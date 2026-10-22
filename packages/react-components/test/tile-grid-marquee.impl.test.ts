import { describe, expect, it, vi } from 'vitest';
import {
  createMarqueeController,
  normalizeRect,
  rectsIntersect,
} from '../src/components/TileGrid/marquee';
import type {
  MarqueeRect,
  MarqueeSelectionOptions,
} from '../src/components/TileGrid/marquee/types';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function pointer(
  clientX: number,
  clientY: number,
  overrides: Partial<Record<string, unknown>> = {}
) {
  return {
    clientX,
    clientY,
    pointerId: 3,
    button: 0,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    target: null,
    currentTarget: null,
    preventDefault: vi.fn(),
    ...overrides,
  };
}

function createHarness(
  options: {
    selectedIds?: readonly string[];
    capture?: HTMLElement | null;
    /** Optional notifications and final resolver under test. */
    callbacks?: Pick<
      MarqueeSelectionOptions,
      'onRectChange' | 'resolveFinalSelection' | 'onPreview'
    >;
  } = {}
) {
  const container = document.createElement('div');
  Object.defineProperty(container, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });

  const items: Record<string, Rect> = {
    a: { x: 100, y: 100, width: 100, height: 100 },
    z: { x: 100, y: 100, width: 100, height: 100 },
  };
  const visibleIds = ['a'];
  const scroll = { offset: 0 };
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const onPreview = vi.fn();
  const scrollBy = vi.fn((delta: number) => {
    scroll.offset += delta;
  });
  const pending = new Map<number, FrameRequestCallback>();
  let nextHandle = 1;

  const requestFrame = vi.fn((callback: FrameRequestCallback) => {
    const handle = nextHandle;
    nextHandle += 1;
    pending.set(handle, callback);
    return handle;
  });
  const cancelFrame = vi.fn((handle: number) => {
    pending.delete(handle);
  });

  const controller = createMarqueeController({
    geometry: {
      getItemRect: id => items[id],
      getVisibleItemIds: () => visibleIds,
      getScrollContainer: () => container,
      getScrollOffset: () => scroll.offset,
      scrollBy,
    },
    getSelectedIds: () => new Set(options.selectedIds ?? []),
    isSelectable: () => true,
    onCommit,
    onCancel,
    onPreview,
    pointerCaptureTarget: options.capture ?? null,
    requestFrame,
    cancelFrame,
    ...options.callbacks,
  });

  return {
    controller,
    container,
    scroll,
    pending,
    onCommit,
    onCancel,
    onPreview,
    scrollBy,
    requestFrame,
    cancelFrame,
  };
}

function captureTarget(overrides: { setThrows?: boolean; releaseThrows?: boolean } = {}) {
  const target = document.createElement('div');
  Object.assign(target, {
    setPointerCapture: vi.fn(() => {
      if (overrides.setThrows) {
        throw new Error('capture unavailable');
      }
    }),
    releasePointerCapture: vi.fn(() => {
      if (overrides.releaseThrows) {
        throw new Error('capture already released');
      }
    }),
    hasPointerCapture: vi.fn(() => true),
  });
  return target;
}

describe('marquee controller implementation details', () => {
  it('notifies rectangle-only changes with snapshots and removes the rectangle on cancellation', () => {
    const rectangles: (MarqueeRect | null)[] = [];
    const harness = createHarness({ callbacks: { onRectChange: rect => rectangles.push(rect) } });
    harness.controller.handlePointerDown(pointer(10, 10));
    harness.controller.handlePointerMove(pointer(30, 30));
    harness.controller.handlePointerMove(pointer(40, 40));
    harness.controller.handlePointerMove(pointer(40, 40));
    expect(rectangles).toEqual([
      { x: 10, y: 10, width: 20, height: 20 },
      { x: 10, y: 10, width: 30, height: 30 },
    ]);
    expect(harness.onPreview).not.toHaveBeenCalled();
    const snapshot = rectangles.at(-1);
    if (!snapshot) throw new Error('Expected the current rectangle snapshot');
    snapshot.x = 999;
    expect(harness.controller.getRect()?.x).toBe(10);
    harness.controller.handleKeyDown({ key: 'Escape', preventDefault: vi.fn() });
    expect(rectangles.at(-1)).toBeNull();
    expect(rectangles).toHaveLength(3);
    expect(harness.onCommit).not.toHaveBeenCalled();
  });

  it('samples a release-only threshold crossing and invokes the final resolver once', () => {
    const resolve = vi.fn(
      (_rect: MarqueeRect, initial: ReadonlySet<string>, _additive: boolean) =>
        new Set([...initial, 'resolved'])
    );
    const harness = createHarness({
      selectedIds: ['z'],
      callbacks: { resolveFinalSelection: resolve },
    });
    harness.controller.handlePointerDown(pointer(10, 10, { shiftKey: true }));
    expect(resolve).not.toHaveBeenCalled();
    harness.controller.handlePointerUp(pointer(20, 20));
    expect(resolve).toHaveBeenCalledExactlyOnceWith(
      { x: 10, y: 10, width: 10, height: 10 },
      new Set(['z']),
      true
    );
    expect(harness.onCommit).toHaveBeenCalledExactlyOnceWith(new Set(['z', 'resolved']));
    harness.controller.handlePointerUp(pointer(150, 150));
    harness.controller.handleLostPointerCapture(pointer(150, 150));
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(harness.onCancel).not.toHaveBeenCalled();
  });

  it('marks release terminal before calling the resolver and ignores capture loss from that callback', () => {
    let loseCapture = () => {};
    const resolve = vi.fn(() => {
      loseCapture();
      return new Set(['final']);
    });
    const capture = captureTarget();
    const harness = createHarness({ capture, callbacks: { resolveFinalSelection: resolve } });
    loseCapture = () => harness.controller.handleLostPointerCapture(pointer(150, 150));
    harness.controller.handlePointerDown(pointer(10, 10));
    harness.controller.handlePointerMove(pointer(150, 150));
    expect(resolve).not.toHaveBeenCalled();
    harness.controller.handlePointerUp(pointer(160, 170));
    expect(resolve).toHaveBeenCalledExactlyOnceWith(
      { x: 10, y: 10, width: 150, height: 160 },
      new Set(),
      false
    );
    expect(harness.onCommit).toHaveBeenCalledExactlyOnceWith(new Set(['final']));
    expect(harness.onCancel).not.toHaveBeenCalled();
    expect(capture.releasePointerCapture).toHaveBeenCalledTimes(1);
  });

  it('clears decoration and releases capture when the terminal resolver throws', () => {
    const failure = new Error('Resolution failed');
    const capture = captureTarget();
    const onRectChange = vi.fn();
    const harness = createHarness({
      capture,
      callbacks: {
        onRectChange,
        resolveFinalSelection: () => {
          throw failure;
        },
      },
    });
    harness.controller.handlePointerDown(pointer(10, 10));
    harness.controller.handlePointerMove(pointer(150, 590));
    expect(() => harness.controller.handlePointerUp(pointer(150, 590))).toThrow(failure);
    expect(harness.pending.size).toBe(0);
    expect(harness.controller.getRect()).toBeNull();
    expect(onRectChange).toHaveBeenLastCalledWith(null);
    expect(capture.releasePointerCapture).toHaveBeenCalledTimes(1);
    expect(harness.onCommit).not.toHaveBeenCalled();
    expect(harness.onCancel).not.toHaveBeenCalled();
  });

  it('does not traverse retained large membership on pointer frames without a full-set preview callback', () => {
    const hidden = Array.from({ length: 20_000 }, (_, index) => `hidden-${index}`);
    const harness = createHarness({ selectedIds: hidden, callbacks: { onPreview: undefined } });
    harness.controller.handlePointerDown(pointer(10, 10, { shiftKey: true }));
    let largeTraversals = 0;
    const original = Set.prototype[Symbol.iterator];
    const iterator = vi.spyOn(Set.prototype, Symbol.iterator).mockImplementation(function (
      this: Set<unknown>
    ) {
      if (this.size >= hidden.length) largeTraversals++;
      return original.call(this);
    });
    try {
      for (let index = 0; index < 20; index++) {
        harness.controller.handlePointerMove(index % 2 ? pointer(40, 40) : pointer(150, 150));
      }
      expect(largeTraversals).toBe(0);
    } finally {
      iterator.mockRestore();
      harness.controller.dispose();
    }
  });

  it('drops rectangle notifications from a saved frame after disposal', () => {
    const onRectChange = vi.fn();
    const harness = createHarness({ callbacks: { onRectChange } });
    harness.controller.handlePointerDown(pointer(10, 10));
    harness.controller.handlePointerMove(pointer(40, 590));
    const callback = [...harness.pending.values()][0];
    expect(callback).toBeDefined();
    harness.controller.dispose();
    expect(onRectChange).toHaveBeenLastCalledWith(null);
    const calls = onRectChange.mock.calls.length;
    callback?.(16);
    expect(onRectChange).toHaveBeenCalledTimes(calls);
    expect(harness.controller.getPreviewSelection().size).toBe(0);
  });

  it('normalizes rectangles and excludes touching edges', () => {
    expect(normalizeRect(10, 20, 4, 8)).toEqual({ x: 4, y: 8, width: 6, height: 12 });
    expect(
      rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 })
    ).toBe(false);
    expect(
      rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 9, y: 0, width: 10, height: 10 })
    ).toBe(true);
  });

  it('continues when pointer capture setup or release throws', () => {
    const capture = captureTarget({ setThrows: true, releaseThrows: true });
    const harness = createHarness({ capture });

    expect(() => {
      harness.controller.handlePointerDown(pointer(10, 10));
      harness.controller.handlePointerMove(pointer(150, 150));
      harness.controller.handlePointerUp(pointer(150, 150));
    }).not.toThrow();

    expect(harness.onCommit).toHaveBeenCalledTimes(1);
    expect(harness.onCommit.mock.calls[0][0]).toEqual(new Set(['a']));
  });

  it('releases capture and stops a pending gesture without callbacks', () => {
    const capture = captureTarget();
    const harness = createHarness({ capture });

    harness.controller.handlePointerDown(pointer(10, 10));
    harness.controller.handlePointerMove(pointer(11, 11));
    harness.controller.dispose();
    harness.controller.handlePointerUp(pointer(11, 11));

    expect(capture.releasePointerCapture).toHaveBeenCalledTimes(1);
    expect(harness.onPreview).not.toHaveBeenCalled();
    expect(harness.onCommit).not.toHaveBeenCalled();
    expect(harness.onCancel).not.toHaveBeenCalled();
  });

  it('uses maximum speed when the pointer reaches the exact edge', () => {
    const harness = createHarness();

    harness.controller.handlePointerDown(pointer(10, 10));
    harness.controller.handlePointerMove(pointer(40, 600));

    const [callback] = [...harness.pending.values()];
    expect(callback).toBeDefined();
    callback?.(16);

    expect(harness.scrollBy).toHaveBeenCalled();
    expect(harness.scrollBy.mock.calls[0][0]).toBe(20);
  });

  it('drops a stale frame callback after dispose', () => {
    const harness = createHarness();

    harness.controller.handlePointerDown(pointer(10, 10));
    harness.controller.handlePointerMove(pointer(40, 590));
    const [callback] = [...harness.pending.values()];
    expect(callback).toBeDefined();

    harness.controller.dispose();
    expect(harness.pending.size).toBe(0);

    callback?.(16);

    expect(harness.scrollBy).not.toHaveBeenCalled();
    expect(harness.onCommit).not.toHaveBeenCalled();
    expect(harness.onCancel).not.toHaveBeenCalled();
  });

  it('keeps hidden pre-selection during an additive gesture without an early preview callback', () => {
    const harness = createHarness({ selectedIds: ['z'] });

    harness.controller.handlePointerDown(pointer(10, 10, { shiftKey: true }));

    expect(harness.onPreview).not.toHaveBeenCalled();
    expect([...harness.controller.getPreviewSelection()]).toEqual(['z']);

    harness.controller.handlePointerMove(pointer(150, 150));
    expect(new Set(harness.controller.getPreviewSelection())).toEqual(new Set(['a', 'z']));
    expect(harness.onPreview).toHaveBeenCalledTimes(1);

    harness.controller.handlePointerUp(pointer(150, 150));
    expect(harness.onCommit).toHaveBeenCalledTimes(1);
    expect(harness.onCommit.mock.calls[0][0]).toEqual(new Set(['a', 'z']));
  });

  it('ignores a second pointer-down while a gesture is active', () => {
    const harness = createHarness();

    harness.controller.handlePointerDown(pointer(10, 10));
    harness.controller.handlePointerMove(pointer(150, 150));
    harness.controller.handlePointerDown(pointer(300, 300));

    expect(harness.controller.getRect()).not.toBeNull();
    harness.controller.handlePointerUp(pointer(150, 150));

    expect(harness.onCommit).toHaveBeenCalledTimes(1);
    expect(harness.onCommit.mock.calls[0][0]).toEqual(new Set(['a']));
  });
});
