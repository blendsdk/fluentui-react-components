import { describe, expect, it, vi } from 'vitest';
import { createMarqueeController } from '../src/components/TileGrid/marquee';
import { normalizeRect, rectsIntersect } from '../src/components/TileGrid/marquee';

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
  options: { selectedIds?: readonly string[]; capture?: HTMLElement | null } = {}
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
    getCurrentIds: () => visibleIds,
    getSelectedIds: () => new Set(options.selectedIds ?? []),
    isSelectable: () => true,
    onCommit,
    onCancel,
    onPreview,
    pointerCaptureTarget: options.capture ?? null,
    requestFrame,
    cancelFrame,
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
