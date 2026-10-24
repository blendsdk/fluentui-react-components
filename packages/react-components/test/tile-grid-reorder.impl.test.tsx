import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TileGridItemRect } from '../src/components/TileGrid/geometry';
import { findInsertion } from '../src/components/TileGrid/reorder/insertion';
import {
  buildReorderArgs,
  moveId,
  resolveToIndex,
} from '../src/components/TileGrid/reorder/payload';
import { useAutoScroll } from '../src/components/TileGrid/reorder/useAutoScroll';
import { useLiveAnnouncement } from '../src/components/TileGrid/useLiveAnnouncement';
import { useSelectionAnnouncement } from '../src/components/TileGrid/selection/useSelectionAnnouncement';
import { resolveTileGridStrings } from '../src/components/TileGrid/strings';

/** Two adjacent row-flow rectangles with a readable gap. */
const ROW_RECTS: readonly TileGridItemRect[] = [
  { id: 'a', index: 0, x: 0, y: 0, width: 100, height: 100 },
  { id: 'b', index: 1, x: 108, y: 0, width: 100, height: 100 },
];

/** One rectangle used to check the masonry vertical edge. */
const MASONRY_RECTS: readonly TileGridItemRect[] = [
  { id: 'a', index: 0, x: 0, y: 0, width: 100, height: 100 },
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('findInsertion', () => {
  it('should return undefined when there are no mounted rectangles', () => {
    expect(findInsertion({ x: 0, y: 0, rects: [], layout: 'fixed', itemCount: 0 })).toBeUndefined();
  });

  it('should choose before or after from the horizontal centre in row flow', () => {
    const before = findInsertion({
      x: 20,
      y: 50,
      rects: ROW_RECTS,
      layout: 'fixed',
      itemCount: 2,
    });
    const after = findInsertion({
      x: 80,
      y: 50,
      rects: ROW_RECTS,
      layout: 'fixed',
      itemCount: 2,
    });

    expect(before).toMatchObject({ index: 0, edge: 'before', boundary: 0 });
    expect(after).toMatchObject({ index: 0, edge: 'after', boundary: 1 });
  });

  it('should choose before or after from the vertical centre in masonry', () => {
    const before = findInsertion({
      x: 50,
      y: 20,
      rects: MASONRY_RECTS,
      layout: 'masonry',
      itemCount: 1,
    });
    const after = findInsertion({
      x: 50,
      y: 80,
      rects: MASONRY_RECTS,
      layout: 'masonry',
      itemCount: 1,
    });

    expect(before).toMatchObject({ edge: 'before', boundary: 0 });
    expect(after).toMatchObject({ edge: 'after', boundary: 1 });
  });

  it('should pick the nearest rectangle when the pointer sits in a gap', () => {
    const insertion = findInsertion({
      x: 104,
      y: 50,
      rects: ROW_RECTS,
      layout: 'fixed',
      itemCount: 2,
    });

    // Both gaps are equidistant; the lower index wins the tie.
    expect(insertion?.index).toBe(0);
  });

  it('should clamp a pointer outside the content to the collection bounds', () => {
    const start = findInsertion({
      x: -500,
      y: -500,
      rects: ROW_RECTS,
      layout: 'fixed',
      itemCount: 2,
    });
    const end = findInsertion({
      x: 900,
      y: 900,
      rects: ROW_RECTS,
      layout: 'fixed',
      itemCount: 2,
    });

    expect(start?.boundary).toBe(0);
    expect(end?.boundary).toBe(2);
  });
});

describe('resolveToIndex', () => {
  it('should account for the removed source when moving forward', () => {
    expect(resolveToIndex(6, 2, 10)).toBe(5);
  });

  it('should keep a backward boundary as the final index', () => {
    expect(resolveToIndex(2, 5, 10)).toBe(2);
  });

  it('should clamp to the first and last item indexes', () => {
    expect(resolveToIndex(0, 5, 10)).toBe(0);
    expect(resolveToIndex(10, 9, 10)).toBe(9);
    expect(resolveToIndex(4, 0, 0)).toBe(0);
  });
});

describe('moveId', () => {
  it('should move an id forward without mutating the source', () => {
    const ids = ['a', 'b', 'c', 'd'] as const;

    expect(moveId(ids, 1, 3)).toEqual(['a', 'c', 'd', 'b']);
    expect(ids).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should clamp out-of-range indexes and handle an empty list', () => {
    expect(moveId(['a', 'b', 'c'], -2, 99)).toEqual(['b', 'c', 'a']);
    expect(moveId([], 0, 0)).toEqual([]);
  });
});

describe('buildReorderArgs', () => {
  it('should return no payload when the move is a no-op', () => {
    expect(buildReorderArgs(['a', 'b', 'c'], 1, 1)).toBeUndefined();
  });

  it('should report the moved item and the complete resulting order', () => {
    expect(buildReorderArgs(['a', 'b', 'c', 'd'], 1, 3)).toEqual({
      itemId: 'b',
      fromIndex: 1,
      toIndex: 3,
      orderedIds: ['a', 'c', 'd', 'b'],
    });
  });
});

describe('useAutoScroll', () => {
  /** Builds a scrollable root with a controllable viewport rectangle. */
  function makeRoot(scrollTop: number) {
    const root = document.createElement('div');
    Object.defineProperty(root, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(0, 0, 200, 200),
    });
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 1_000 });
    Object.defineProperty(root, 'clientHeight', { configurable: true, value: 200 });
    root.scrollTop = scrollTop;
    return root;
  }

  it('should scroll down proportionally near the bottom edge', () => {
    const root = makeRoot(100);
    const rootRef = { current: root };
    let frame: FrameRequestCallback | undefined;
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    });
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const onScroll = vi.fn();

    const { result } = renderHook(() => useAutoScroll({ rootRef, enabled: true, onScroll }));
    act(() => result.current.updatePointer(190));

    // Ten pixels from the bottom gives roughly 12 px per frame.
    act(() => frame?.(0));

    expect(root.scrollTop).toBeCloseTo(112.17, 1);
    expect(onScroll).toHaveBeenCalled();
  });

  it('should scroll up near the top edge and stop in the middle', () => {
    const root = makeRoot(100);
    const rootRef = { current: root };
    let frame: FrameRequestCallback | undefined;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frame = callback;
        return 1;
      })
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const onScroll = vi.fn();

    const { result } = renderHook(() => useAutoScroll({ rootRef, enabled: true, onScroll }));
    act(() => result.current.updatePointer(0));
    act(() => frame?.(0));

    expect(root.scrollTop).toBeCloseTo(82, 1);

    const before = root.scrollTop;
    act(() => result.current.updatePointer(100));
    act(() => frame?.(0));

    expect(root.scrollTop).toBe(before);
  });

  it('should not schedule a frame when the pointer is outside the active zone', () => {
    const root = makeRoot(100);
    const rootRef = { current: root };
    const requestFrame = vi.fn(() => 1);
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { result } = renderHook(() =>
      useAutoScroll({ rootRef, enabled: true, onScroll: vi.fn() })
    );
    act(() => result.current.updatePointer(100));

    expect(requestFrame).not.toHaveBeenCalled();
    expect(root.scrollTop).toBe(100);
  });

  it('should cancel the frame when the drag becomes inactive', () => {
    const root = makeRoot(100);
    const rootRef = { current: root };
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1)
    );
    const cancelFrame = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);

    const { result, rerender } = renderHook(
      ({ enabled }) => useAutoScroll({ rootRef, enabled, onScroll: vi.fn() }),
      { initialProps: { enabled: true } }
    );
    act(() => result.current.updatePointer(190));
    rerender({ enabled: false });

    expect(cancelFrame).toHaveBeenCalled();
  });

  it('should not schedule a second frame while one is pending', () => {
    const root = makeRoot(100);
    const rootRef = { current: root };
    const requestFrame = vi.fn(() => 1);
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { result } = renderHook(() =>
      useAutoScroll({ rootRef, enabled: true, onScroll: vi.fn() })
    );
    act(() => result.current.updatePointer(190));
    act(() => result.current.updatePointer(190));

    expect(requestFrame).toHaveBeenCalledTimes(1);
  });

  it('should stop at the end of the scroll range', () => {
    const root = makeRoot(800);
    const rootRef = { current: root };
    let frame: FrameRequestCallback | undefined;
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    });
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { result } = renderHook(() =>
      useAutoScroll({ rootRef, enabled: true, onScroll: vi.fn() })
    );
    act(() => result.current.updatePointer(190));
    act(() => frame?.(0));

    expect(root.scrollTop).toBe(800);
    expect(requestFrame).toHaveBeenCalledTimes(1);
  });

  it('should cancel a pending frame on unmount', () => {
    const root = makeRoot(100);
    const rootRef = { current: root };
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1)
    );
    const cancelFrame = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);

    const { result, unmount } = renderHook(() =>
      useAutoScroll({ rootRef, enabled: true, onScroll: vi.fn() })
    );
    act(() => result.current.updatePointer(190));
    unmount();

    expect(cancelFrame).toHaveBeenCalled();
  });
});

describe('resolveTileGridStrings', () => {
  it('should keep defaults for undefined overrides and return a fresh object', () => {
    const first = resolveTileGridStrings({ emptyMessage: undefined });
    const second = resolveTileGridStrings();

    expect(first.emptyMessage).toBe('No items');
    expect(first.dragHandleLabel('Tile 1')).toBe('Reorder Tile 1');
    expect(first).not.toBe(second);
  });
});

describe('shared announcements', () => {
  it('should start silent and replace selection news when the count changes', async () => {
    const { result, rerender } = renderHook(
      ({ count, total }) => {
        const [message, announce] = useLiveAnnouncement();
        useSelectionAnnouncement(count, total, undefined, announce);
        return message;
      },
      { initialProps: { count: 0, total: 2 } }
    );

    expect(result.current).toBe('');

    rerender({ count: 1, total: 2 });
    await waitFor(() => expect(result.current).toBe('1 of 2 selected'));

    rerender({ count: 1, total: 3 });
    expect(result.current).toBe('1 of 2 selected');

    rerender({ count: 2, total: 3 });
    await waitFor(() => expect(result.current).toBe('2 of 3 selected'));
  });

  it('should mutate the live region when the same text repeats', () => {
    const { result } = renderHook(() => {
      const [message, announce] = useLiveAnnouncement();
      return { message, announce };
    });

    act(() => result.current.announce('Moved to position 2 of 2'));
    const first = result.current.message;
    expect(first).toBe('Moved to position 2 of 2');

    act(() => result.current.announce('Moved to position 2 of 2'));
    expect(result.current.message).not.toBe(first);
    expect(result.current.message).toContain('Moved to position 2 of 2');
  });
});
