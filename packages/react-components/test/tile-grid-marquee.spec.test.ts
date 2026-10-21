import { describe, expect, it, vi } from 'vitest';

import { createMarqueeController } from '../src/components/TileGrid/marquee';

/**
 * Specification tests for the internal marquee selection controller.
 *
 * Every test runs against synthetic layout data: a fake scroll container
 * reports a fixed viewport rectangle, and the geometry port answers item
 * rectangles and visible ids from plain objects. There is no real layout, no
 * DOM measurement of items and no real animation timer, so each expectation
 * describes the controller contract rather than browser behaviour.
 *
 * Coordinates matter in two spaces:
 * - client coordinates are what a pointer event carries;
 * - content coordinates are client coordinates minus the container's top-left
 *   corner plus the current scroll offset.
 * The container below sits at client (20, 30), so client (30, 40) is content
 * (10, 10) at scroll offset 0.
 */

/** Axis-aligned rectangle in the scroll container's content coordinates. */
interface ItemRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Fixed viewport of every synthetic scroll container. */
const VIEWPORT = { left: 20, top: 30, width: 800, height: 600 } as const;

/** Four tiles arranged in a 2x2 block with gaps, in content coordinates. */
const DEFAULT_ITEMS: Record<string, ItemRect> = {
  a: { x: 100, y: 100, width: 100, height: 100 },
  b: { x: 300, y: 100, width: 100, height: 100 },
  c: { x: 100, y: 300, width: 100, height: 100 },
  d: { x: 300, y: 300, width: 100, height: 100 },
};

const DEFAULT_VISIBLE_IDS = ['a', 'b', 'c', 'd'];

/** Controllable replacement for the browser frame scheduler. */
interface FrameScheduler {
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (handle: number) => void;
  /** Runs every currently scheduled callback exactly once and returns how many ran. */
  runFrame: () => number;
  /** Number of callbacks waiting for the next frame. */
  pendingCount: () => number;
}

/**
 * Creates a frame scheduler whose callbacks only run when the test says so.
 * A callback that schedules the next frame while running stays scheduled for
 * the following `runFrame` call, which models a running animation loop.
 */
function createFrameScheduler(): FrameScheduler {
  const pending = new Map<number, FrameRequestCallback>();
  let nextHandle = 1;

  const requestFrame = vi.fn((callback: FrameRequestCallback): number => {
    const handle = nextHandle;
    nextHandle += 1;
    pending.set(handle, callback);
    return handle;
  });

  const cancelFrame = vi.fn((handle: number): void => {
    pending.delete(handle);
  });

  const runFrame = (): number => {
    const scheduled = Array.from(pending.values());
    pending.clear();
    for (const callback of scheduled) {
      callback(16);
    }
    return scheduled.length;
  };

  return {
    requestFrame,
    cancelFrame,
    runFrame,
    pendingCount: () => pending.size,
  };
}

/** Elements used as pointer capture targets together with their spies. */
interface CaptureTarget {
  target: HTMLElement;
  setPointerCapture: ReturnType<typeof vi.fn>;
  releasePointerCapture: ReturnType<typeof vi.fn>;
  hasPointerCapture: ReturnType<typeof vi.fn>;
}

/** Builds a capture target that records the pointer capture calls it receives. */
function createCaptureTarget(): CaptureTarget {
  const target = document.createElement('div');
  const setPointerCapture = vi.fn((_pointerId: number): void => undefined);
  const releasePointerCapture = vi.fn((_pointerId: number): void => undefined);
  const hasPointerCapture = vi.fn((_pointerId: number): boolean => true);

  Object.assign(target, { setPointerCapture, releasePointerCapture, hasPointerCapture });

  return { target, setPointerCapture, releasePointerCapture, hasPointerCapture };
}

/** Options for the pointer events the tests feed to the controller. */
interface PointerEventOptions {
  clientX: number;
  clientY: number;
  button?: number;
  pointerId?: number;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

/**
 * Builds a pointer-like event. Each call returns a fresh event object so a test
 * can inspect the `preventDefault` spy of exactly one event.
 */
function pointerEvent(options: PointerEventOptions) {
  const target = document.createElement('div');
  return {
    clientX: options.clientX,
    clientY: options.clientY,
    pointerId: options.pointerId ?? 7,
    button: options.button ?? 0,
    shiftKey: options.shiftKey ?? false,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    target,
    currentTarget: target,
    preventDefault: vi.fn(() => undefined),
  };
}

/** Builds the Escape key event the controller reacts to. */
function escapeEvent() {
  return { key: 'Escape', preventDefault: vi.fn(() => undefined) };
}

/** Sorted member list of a selection set, for readable equality assertions. */
function ids(value: ReadonlySet<string> | undefined): string[] {
  return value === undefined ? [] : [...value].sort();
}

/** Asserts the four documented fields of a marquee rectangle. */
function expectMarqueeRect(rect: ItemRect | null, expected: ItemRect): void {
  expect(rect).not.toBeNull();
  expect(rect).toMatchObject(expected);
}

/** Settings a test can change on the synthetic scenario. */
interface HarnessSettings {
  items?: Record<string, ItemRect>;
  visibleIds?: readonly string[];
  selectedIds?: readonly string[];
  unselectableIds?: readonly string[];
  scrollOffset?: number;
  edgeThreshold?: number;
  maxScrollSpeed?: number;
  captureTarget?: HTMLElement | null;
  frames?: FrameScheduler;
}

/**
 * Creates one controller wired to a synthetic scroll container, synthetic
 * geometry and recording callbacks.
 */
function createHarness(settings: HarnessSettings = {}) {
  const items = settings.items ?? DEFAULT_ITEMS;
  const visibleIds = settings.visibleIds ?? DEFAULT_VISIBLE_IDS;
  const selectedIds = new Set(settings.selectedIds ?? []);
  const unselectable = new Set(settings.unselectableIds ?? []);

  const container = document.createElement('div');
  const bounds = {
    left: VIEWPORT.left,
    top: VIEWPORT.top,
    right: VIEWPORT.left + VIEWPORT.width,
    bottom: VIEWPORT.top + VIEWPORT.height,
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    x: VIEWPORT.left,
    y: VIEWPORT.top,
    toJSON: () => ({}),
  };
  Object.defineProperty(container, 'getBoundingClientRect', {
    configurable: true,
    value: () => bounds,
  });

  const scroll = { offset: settings.scrollOffset ?? 0 };

  const getItemRect = vi.fn((id: string) => items[id]);
  const getVisibleItemIds = vi.fn(() => [...visibleIds]);
  const getScrollContainer = vi.fn(() => container);
  const getScrollOffset = vi.fn(() => scroll.offset);
  const scrollBy = vi.fn((delta: number): void => {
    scroll.offset += delta;
  });

  const onCommit = vi.fn((_next: ReadonlySet<string>): void => undefined);
  const onCancel = vi.fn((_preSelection: ReadonlySet<string>): void => undefined);
  const onPreview = vi.fn((_preview: ReadonlySet<string>): void => undefined);
  const isSelectable = vi.fn((id: string) => !unselectable.has(id));

  const controller = createMarqueeController({
    geometry: {
      getItemRect,
      getVisibleItemIds,
      getScrollContainer,
      getScrollOffset,
      scrollBy,
    },
    getSelectedIds: () => new Set(selectedIds),
    isSelectable,
    onCommit,
    onCancel,
    onPreview,
    ...(settings.edgeThreshold === undefined ? {} : { edgeThreshold: settings.edgeThreshold }),
    ...(settings.maxScrollSpeed === undefined ? {} : { maxScrollSpeed: settings.maxScrollSpeed }),
    ...(settings.captureTarget === undefined
      ? {}
      : { pointerCaptureTarget: settings.captureTarget }),
    ...(settings.frames === undefined
      ? {}
      : { requestFrame: settings.frames.requestFrame, cancelFrame: settings.frames.cancelFrame }),
  });

  return {
    controller,
    container,
    items,
    visibleIds,
    scroll,
    getItemRect,
    getVisibleItemIds,
    getScrollContainer,
    getScrollOffset,
    scrollBy,
    onCommit,
    onCancel,
    onPreview,
    isSelectable,
  };
}

describe('marquee selection controller', () => {
  describe('activation and background clicks', () => {
    it('ignores a pointer-down that is not the primary button', () => {
      const capture = createCaptureTarget();
      const harness = createHarness({ captureTarget: capture.target });

      const down = pointerEvent({ clientX: 30, clientY: 40, button: 2 });
      const move = pointerEvent({ clientX: 170, clientY: 180 });
      const up = pointerEvent({ clientX: 170, clientY: 180 });

      harness.controller.handlePointerDown(down);
      harness.controller.handlePointerMove(move);
      harness.controller.handlePointerUp(up);

      expect(harness.controller.isActive()).toBe(false);
      expect(harness.controller.getRect()).toBeNull();
      expect(harness.onPreview).not.toHaveBeenCalled();
      expect(harness.onCommit).not.toHaveBeenCalled();
      expect(harness.onCancel).not.toHaveBeenCalled();
      expect(capture.setPointerCapture).not.toHaveBeenCalled();
      expect(down.preventDefault).not.toHaveBeenCalled();
      expect(move.preventDefault).not.toHaveBeenCalled();

      // The same pointer sequence with the primary button must work, so the
      // rejection above comes from the button and not from a dead controller.
      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));
      harness.controller.handlePointerUp(pointerEvent({ clientX: 170, clientY: 180 }));

      expect(harness.onCommit).toHaveBeenCalledTimes(1);
      expect(ids(harness.onCommit.mock.calls[0][0])).toEqual(['a']);
    });

    it('treats a pointer-up below the activation distance as a background click', () => {
      const capture = createCaptureTarget();
      const harness = createHarness({ captureTarget: capture.target });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 32, clientY: 42 }));
      harness.controller.handlePointerUp(pointerEvent({ clientX: 32, clientY: 42 }));

      expect(harness.controller.isActive()).toBe(false);
      expect(harness.controller.getRect()).toBeNull();
      expect(harness.onPreview).not.toHaveBeenCalled();
      expect(harness.onCommit).not.toHaveBeenCalled();
      expect(harness.onCancel).not.toHaveBeenCalled();
      expect(capture.releasePointerCapture).toHaveBeenCalledTimes(1);
    });

    it('stays inactive until the pointer travels the activation distance', () => {
      const harness = createHarness();

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      // Less than four pixels away from the pointer-down point.
      harness.controller.handlePointerMove(pointerEvent({ clientX: 32, clientY: 42 }));

      expect(harness.controller.isActive()).toBe(false);
      expect(harness.controller.getRect()).toBeNull();
      expect(harness.controller.getPreviewSelection().size).toBe(0);
      expect(harness.onPreview).not.toHaveBeenCalled();

      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));

      expect(harness.controller.isActive()).toBe(true);
      expect(harness.controller.getRect()).not.toBeNull();
    });
  });

  describe('marquee rectangle', () => {
    it('reports the rectangle in scroll-container content coordinates', () => {
      const harness = createHarness({ scrollOffset: 100 });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 130, clientY: 90 }));

      // Client (30, 40) is content (10, 110) with the container at (20, 30).
      expectMarqueeRect(harness.controller.getRect(), {
        x: 10,
        y: 110,
        width: 100,
        height: 50,
      });
    });

    it('normalizes the rectangle when the pointer moves up and to the left', () => {
      const harness = createHarness();

      harness.controller.handlePointerDown(pointerEvent({ clientX: 130, clientY: 90 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 30, clientY: 40 }));

      expectMarqueeRect(harness.controller.getRect(), {
        x: 10,
        y: 10,
        width: 100,
        height: 50,
      });
    });
  });

  describe('hit testing and preview', () => {
    it('selects a partially overlapped item and commits once on pointer-up', () => {
      const capture = createCaptureTarget();
      const harness = createHarness({ captureTarget: capture.target });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));

      // The rectangle covers content (10, 10) to (150, 150) and only clips the
      // top-left corner of item a, so partial overlap is enough to include it.
      expect(ids(harness.controller.getPreviewSelection())).toEqual(['a']);
      expect(harness.onPreview).toHaveBeenCalledTimes(1);
      expect(ids(harness.onPreview.mock.calls[0][0])).toEqual(['a']);

      harness.controller.handlePointerUp(pointerEvent({ clientX: 170, clientY: 180 }));

      expect(harness.onCommit).toHaveBeenCalledTimes(1);
      expect(ids(harness.onCommit.mock.calls[0][0])).toEqual(['a']);
      expect(harness.onCancel).not.toHaveBeenCalled();
      expect(harness.controller.isActive()).toBe(false);
      expect(harness.controller.getRect()).toBeNull();
      expect(capture.setPointerCapture).toHaveBeenCalledWith(7);
      expect(capture.releasePointerCapture).toHaveBeenCalledTimes(1);
      expect(harness.onCommit.mock.invocationCallOrder[0]).toBeLessThan(
        capture.releasePointerCapture.mock.invocationCallOrder[0]
      );
    });

    it('keeps the pre-selection during an additive gesture', () => {
      const harness = createHarness({ selectedIds: ['z'] });

      harness.controller.handlePointerDown(
        pointerEvent({ clientX: 30, clientY: 40, shiftKey: true })
      );

      // Before the marquee activates, an additive gesture reports the selection
      // it started from.
      expect(ids(harness.controller.getPreviewSelection())).toEqual(['z']);

      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));

      expect(ids(harness.controller.getPreviewSelection())).toEqual(['a', 'z']);
      expect(ids(harness.onPreview.mock.calls[0][0])).toEqual(['a', 'z']);

      // Leaving every item keeps the pre-selection instead of clearing it.
      harness.controller.handlePointerMove(pointerEvent({ clientX: 70, clientY: 80 }));
      expect(ids(harness.controller.getPreviewSelection())).toEqual(['z']);
      expect(ids(harness.onPreview.mock.calls[1][0])).toEqual(['z']);

      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));
      harness.controller.handlePointerUp(pointerEvent({ clientX: 170, clientY: 180 }));

      expect(harness.onCommit).toHaveBeenCalledTimes(1);
      expect(ids(harness.onCommit.mock.calls[0][0])).toEqual(['a', 'z']);
    });

    it.each(['ctrlKey', 'metaKey'] as const)('treats %s as an additive modifier', modifier => {
      const harness = createHarness({ selectedIds: ['z'] });

      harness.controller.handlePointerDown(
        pointerEvent({
          clientX: 30,
          clientY: 40,
          ctrlKey: modifier === 'ctrlKey',
          metaKey: modifier === 'metaKey',
        })
      );
      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));
      harness.controller.handlePointerUp(pointerEvent({ clientX: 170, clientY: 180 }));

      expect(harness.onCommit).toHaveBeenCalledTimes(1);
      expect(ids(harness.onCommit.mock.calls[0][0])).toEqual(['a', 'z']);
    });

    it('excludes items the selectable predicate rejects', () => {
      const harness = createHarness({ unselectableIds: ['b'] });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 450, clientY: 180 }));

      // The rectangle spans content x 10 to 430, which overlaps items a and b.
      expect(harness.isSelectable).toHaveBeenCalledWith('b');
      expect(ids(harness.controller.getPreviewSelection())).toEqual(['a']);

      harness.controller.handlePointerUp(pointerEvent({ clientX: 450, clientY: 180 }));
      expect(ids(harness.onCommit.mock.calls[0][0])).toEqual(['a']);
    });

    it('emits a preview only when the preview set changes', () => {
      const harness = createHarness();

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));

      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));
      expect(harness.onPreview).toHaveBeenCalledTimes(1);
      expect(ids(harness.onPreview.mock.calls[0][0])).toEqual(['a']);

      // Growing the rectangle still overlaps only item a, so no second preview.
      harness.controller.handlePointerMove(pointerEvent({ clientX: 180, clientY: 190 }));
      expect(harness.onPreview).toHaveBeenCalledTimes(1);

      // Shrinking the rectangle away from every item empties the preview.
      harness.controller.handlePointerMove(pointerEvent({ clientX: 70, clientY: 80 }));
      expect(harness.onPreview).toHaveBeenCalledTimes(2);
      expect(ids(harness.onPreview.mock.calls[1][0])).toEqual([]);

      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));
      expect(harness.onPreview).toHaveBeenCalledTimes(3);
      expect(ids(harness.onPreview.mock.calls[2][0])).toEqual(['a']);
    });

    it('returns a fresh empty preview before a plain gesture activates', () => {
      const harness = createHarness();

      const first = harness.controller.getPreviewSelection();
      const second = harness.controller.getPreviewSelection();

      expect(first.size).toBe(0);
      expect(second.size).toBe(0);
      expect(first).not.toBe(second);

      // The same accessor reports the real preview once the gesture is active.
      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));
      expect(ids(harness.controller.getPreviewSelection())).toEqual(['a']);
    });

    it('reads item rectangles only for the visible ids from the geometry port', () => {
      const prototypeRect = vi.spyOn(Element.prototype, 'getBoundingClientRect');
      try {
        const harness = createHarness({
          items: { ...DEFAULT_ITEMS, hidden: { x: 100, y: 100, width: 100, height: 100 } },
        });

        harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
        harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));

        // The marquee overlaps the geometry of the hidden item, but only the
        // visible id list may be probed and only the visible ids may be selected.
        expect(harness.getVisibleItemIds).toHaveBeenCalled();
        expect(harness.getItemRect.mock.calls.map(([id]) => id)).not.toContain('hidden');
        expect([...new Set(harness.getItemRect.mock.calls.map(([id]) => id))].sort()).toEqual([
          'a',
          'b',
          'c',
          'd',
        ]);
        expect(ids(harness.controller.getPreviewSelection())).toEqual(['a']);

        // No element-level measurement happens outside the scroll container.
        expect(prototypeRect).not.toHaveBeenCalled();
      } finally {
        prototypeRect.mockRestore();
      }
    });

    it('skips visible ids that have no geometry instead of throwing', () => {
      const harness = createHarness({ visibleIds: ['a', 'ghost'] });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));

      expect(harness.getItemRect).toHaveBeenCalledWith('ghost');
      expect(ids(harness.controller.getPreviewSelection())).toEqual(['a']);
    });
  });

  describe('commit and cancel', () => {
    it('cancels on Escape and restores the previous selection', () => {
      const capture = createCaptureTarget();
      const harness = createHarness({ selectedIds: ['z'], captureTarget: capture.target });
      const escape = escapeEvent();

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));
      harness.controller.handleKeyDown(escape);

      expect(harness.onCancel).toHaveBeenCalledTimes(1);
      expect(ids(harness.onCancel.mock.calls[0][0])).toEqual(['z']);
      expect(harness.onCommit).not.toHaveBeenCalled();
      expect(harness.controller.isActive()).toBe(false);
      expect(harness.controller.getRect()).toBeNull();
      expect(capture.releasePointerCapture).toHaveBeenCalledTimes(1);
    });

    it('cancels on pointercancel without committing', () => {
      const capture = createCaptureTarget();
      const harness = createHarness({ selectedIds: ['z'], captureTarget: capture.target });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));
      harness.controller.handlePointerCancel(pointerEvent({ clientX: 170, clientY: 180 }));

      expect(harness.onCancel).toHaveBeenCalledTimes(1);
      expect(ids(harness.onCancel.mock.calls[0][0])).toEqual(['z']);
      expect(harness.onCommit).not.toHaveBeenCalled();
      expect(harness.controller.isActive()).toBe(false);
      expect(harness.controller.getRect()).toBeNull();
      expect(capture.releasePointerCapture).toHaveBeenCalledTimes(1);
    });

    it('cancels when pointer capture is lost before the gesture finishes', () => {
      const harness = createHarness({ selectedIds: ['z'] });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));
      harness.controller.handleLostPointerCapture(pointerEvent({ clientX: 170, clientY: 180 }));

      expect(harness.onCancel).toHaveBeenCalledTimes(1);
      expect(ids(harness.onCancel.mock.calls[0][0])).toEqual(['z']);
      expect(harness.onCommit).not.toHaveBeenCalled();
      expect(harness.controller.isActive()).toBe(false);
      expect(harness.controller.getRect()).toBeNull();
    });

    it('cancels a pending gesture on Escape before the activation distance', () => {
      const harness = createHarness({ selectedIds: ['z'] });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 32, clientY: 42 }));
      harness.controller.handleKeyDown(escapeEvent());
      harness.controller.handlePointerUp(pointerEvent({ clientX: 32, clientY: 42 }));

      expect(harness.onCancel).toHaveBeenCalledTimes(1);
      expect(ids(harness.onCancel.mock.calls[0][0])).toEqual(['z']);
      expect(harness.onCommit).not.toHaveBeenCalled();
      expect(harness.controller.getRect()).toBeNull();
    });

    it('ignores pointer and Escape events while no gesture is in progress', () => {
      const harness = createHarness();
      const move = pointerEvent({ clientX: 170, clientY: 180 });
      const escape = escapeEvent();

      expect(harness.controller.isActive()).toBe(false);
      expect(harness.controller.getRect()).toBeNull();

      harness.controller.handlePointerMove(move);
      harness.controller.handlePointerUp(pointerEvent({ clientX: 170, clientY: 180 }));
      harness.controller.handleKeyDown(escape);

      expect(harness.controller.isActive()).toBe(false);
      expect(harness.onPreview).not.toHaveBeenCalled();
      expect(harness.onCommit).not.toHaveBeenCalled();
      expect(harness.onCancel).not.toHaveBeenCalled();
      expect(move.preventDefault).not.toHaveBeenCalled();
      expect(escape.preventDefault).not.toHaveBeenCalled();

      // A full gesture afterwards proves the controller was live all along.
      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));
      harness.controller.handlePointerUp(pointerEvent({ clientX: 170, clientY: 180 }));

      expect(harness.onCommit).toHaveBeenCalledTimes(1);
      expect(ids(harness.onCommit.mock.calls[0][0])).toEqual(['a']);
    });

    it('commits once and ignores the capture-loss event that follows the commit', () => {
      const capture = createCaptureTarget();
      let controller: ReturnType<typeof createMarqueeController> | undefined;
      const pointerUp = pointerEvent({ clientX: 170, clientY: 180 });

      // A browser reports the lost capture as soon as the capture is released.
      // The committed state must be set before that release, otherwise the
      // synchronous capture-loss event would cancel the finished gesture.
      capture.releasePointerCapture.mockImplementation(() => {
        controller?.handleLostPointerCapture(pointerUp);
      });

      const harness = createHarness({ captureTarget: capture.target });
      controller = harness.controller;

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));
      harness.controller.handlePointerUp(pointerUp);

      expect(harness.onCommit).toHaveBeenCalledTimes(1);
      expect(ids(harness.onCommit.mock.calls[0][0])).toEqual(['a']);
      expect(capture.releasePointerCapture).toHaveBeenCalledTimes(1);

      harness.controller.handleLostPointerCapture(pointerUp);
      harness.controller.handleLostPointerCapture(pointerEvent({ clientX: 170, clientY: 180 }));

      expect(harness.onCommit).toHaveBeenCalledTimes(1);
      expect(harness.onCancel).not.toHaveBeenCalled();
      expect(harness.controller.isActive()).toBe(false);
      expect(harness.controller.getRect()).toBeNull();
    });
  });

  describe('pointer capture', () => {
    it('keeps working when the capture target cannot capture pointers', () => {
      const target = document.createElement('div');
      for (const method of ['setPointerCapture', 'releasePointerCapture', 'hasPointerCapture']) {
        Object.defineProperty(target, method, { configurable: true, value: undefined });
      }
      const harness = createHarness({ captureTarget: target });

      expect(() => {
        harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
        harness.controller.handlePointerMove(pointerEvent({ clientX: 170, clientY: 180 }));
      }).not.toThrow();

      expect(ids(harness.controller.getPreviewSelection())).toEqual(['a']);

      expect(() => {
        harness.controller.handlePointerUp(pointerEvent({ clientX: 170, clientY: 180 }));
      }).not.toThrow();

      expect(harness.onCommit).toHaveBeenCalledTimes(1);
      expect(ids(harness.onCommit.mock.calls[0][0])).toEqual(['a']);
    });
  });

  describe('auto-scroll', () => {
    it('scrolls toward the bottom edge while the pointer stays in the edge zone', () => {
      const frames = createFrameScheduler();
      const harness = createHarness({ frames });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      // Client y 620 is 10 pixels above the container bottom edge (y 630).
      harness.controller.handlePointerMove(pointerEvent({ clientX: 60, clientY: 620 }));

      expect(frames.pendingCount()).toBeGreaterThan(0);
      frames.runFrame();

      const deltas = harness.scrollBy.mock.calls.map(([delta]) => delta);
      expect(deltas.length).toBeGreaterThanOrEqual(1);
      expect(deltas.every(delta => delta > 0 && delta <= 20)).toBe(true);
      // The loop keeps scheduling frames while the pointer stays near the edge.
      expect(frames.pendingCount()).toBeGreaterThan(0);

      harness.controller.handlePointerUp(pointerEvent({ clientX: 60, clientY: 620 }));
      const callsAfterPointerUp = harness.scrollBy.mock.calls.length;
      frames.runFrame();

      expect(frames.pendingCount()).toBe(0);
      expect(harness.scrollBy.mock.calls.length).toBe(callsAfterPointerUp);
    });

    it('scrolls toward the top edge with a negative delta', () => {
      const frames = createFrameScheduler();
      const harness = createHarness({ frames, scrollOffset: 500 });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 200 }));
      // Client y 40 is 10 pixels below the container top edge (y 30).
      harness.controller.handlePointerMove(pointerEvent({ clientX: 60, clientY: 40 }));

      frames.runFrame();

      const deltas = harness.scrollBy.mock.calls.map(([delta]) => delta);
      expect(deltas.length).toBeGreaterThanOrEqual(1);
      expect(deltas.every(delta => delta < 0 && delta >= -20)).toBe(true);
    });

    it('recomputes the rectangle and preview from the updated scroll offset', () => {
      const frames = createFrameScheduler();
      const harness = createHarness({
        frames,
        items: {
          near: { x: 0, y: 0, width: 60, height: 60 },
          deep: { x: 0, y: 620, width: 60, height: 60 },
        },
        visibleIds: ['near', 'deep'],
      });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 60, clientY: 620 }));

      // At offset 0 the rectangle reaches content y 590 and misses `deep`.
      expect(ids(harness.controller.getPreviewSelection())).toEqual(['near']);

      let framesRun = 0;
      while (!harness.controller.getPreviewSelection().has('deep') && framesRun < 100) {
        frames.runFrame();
        framesRun += 1;
      }

      expect(harness.scroll.offset).toBeGreaterThanOrEqual(30);
      expect(harness.controller.getPreviewSelection().has('deep')).toBe(true);
      expect(harness.onPreview.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(harness.onPreview.mock.calls.at(-1)?.[0].has('deep')).toBe(true);
    });

    it('caps the frame delta at maxScrollSpeed', () => {
      const frames = createFrameScheduler();
      const harness = createHarness({ frames, maxScrollSpeed: 3 });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      // 22 pixels above the bottom edge: proportional speed would exceed the cap.
      harness.controller.handlePointerMove(pointerEvent({ clientX: 60, clientY: 608 }));

      frames.runFrame();

      const deltas = harness.scrollBy.mock.calls.map(([delta]) => delta);
      expect(deltas.length).toBeGreaterThanOrEqual(1);
      expect(deltas.every(delta => delta > 0 && delta <= 3)).toBe(true);
    });

    it('scrolls faster the further the pointer sits inside the edge zone', () => {
      const slowFrames = createFrameScheduler();
      const slow = createHarness({ frames: slowFrames });
      slow.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      // 2 pixels above the bottom edge.
      slow.controller.handlePointerMove(pointerEvent({ clientX: 60, clientY: 628 }));
      slowFrames.runFrame();

      const fastFrames = createFrameScheduler();
      const fast = createHarness({ frames: fastFrames });
      fast.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      // 20 pixels above the bottom edge, still inside the default edge zone.
      fast.controller.handlePointerMove(pointerEvent({ clientX: 60, clientY: 610 }));
      fastFrames.runFrame();

      const slowDelta = slow.scrollBy.mock.calls.at(-1)?.[0];
      const fastDelta = fast.scrollBy.mock.calls.at(-1)?.[0];

      expect(slowDelta).toBeGreaterThan(0);
      expect(fastDelta).toBeGreaterThan(0);
      expect(fastDelta).toBeGreaterThan(slowDelta ?? 0);
    });

    it('honors a custom edgeThreshold', () => {
      const insideFrames = createFrameScheduler();
      const inside = createHarness({ frames: insideFrames, edgeThreshold: 60 });
      inside.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      // 50 pixels above the bottom edge: inside a 60 pixel zone, outside the default.
      inside.controller.handlePointerMove(pointerEvent({ clientX: 60, clientY: 580 }));
      expect(insideFrames.pendingCount()).toBeGreaterThan(0);

      const outsideFrames = createFrameScheduler();
      const outside = createHarness({ frames: outsideFrames });
      outside.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      outside.controller.handlePointerMove(pointerEvent({ clientX: 60, clientY: 580 }));
      expect(outsideFrames.pendingCount()).toBe(0);
    });

    it('stops the frame loop when the pointer leaves the edge zone', () => {
      const frames = createFrameScheduler();
      const harness = createHarness({ frames });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 60, clientY: 620 }));
      expect(frames.pendingCount()).toBeGreaterThan(0);

      // Client y 330 is far from both container edges.
      harness.controller.handlePointerMove(pointerEvent({ clientX: 60, clientY: 330 }));

      const callsAfterLeaving = harness.scrollBy.mock.calls.length;
      expect(frames.pendingCount()).toBe(0);
      expect(frames.runFrame()).toBe(0);
      expect(harness.scrollBy.mock.calls.length).toBe(callsAfterLeaving);
    });

    it('stops the frame loop when the gesture is cancelled', () => {
      const frames = createFrameScheduler();
      const harness = createHarness({ frames, selectedIds: ['z'] });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 60, clientY: 620 }));
      frames.runFrame();

      harness.controller.handlePointerCancel(pointerEvent({ clientX: 60, clientY: 620 }));

      const callsAfterCancel = harness.scrollBy.mock.calls.length;
      frames.runFrame();

      expect(frames.pendingCount()).toBe(0);
      expect(harness.scrollBy.mock.calls.length).toBe(callsAfterCancel);
      expect(harness.onCancel).toHaveBeenCalledTimes(1);
      expect(ids(harness.onCancel.mock.calls[0][0])).toEqual(['z']);
      expect(harness.onCommit).not.toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('stops the frame loop and releases capture without notifying selection', () => {
      const frames = createFrameScheduler();
      const capture = createCaptureTarget();
      const harness = createHarness({ frames, captureTarget: capture.target });

      harness.controller.handlePointerDown(pointerEvent({ clientX: 30, clientY: 40 }));
      harness.controller.handlePointerMove(pointerEvent({ clientX: 60, clientY: 620 }));
      frames.runFrame();

      expect(frames.pendingCount()).toBeGreaterThan(0);

      harness.controller.dispose();

      expect(frames.pendingCount()).toBe(0);
      expect(frames.runFrame()).toBe(0);
      expect(capture.releasePointerCapture).toHaveBeenCalledTimes(1);
      expect(harness.onCommit).not.toHaveBeenCalled();
      expect(harness.onCancel).not.toHaveBeenCalled();
      expect(harness.controller.isActive()).toBe(false);
      expect(harness.controller.getRect()).toBeNull();
    });
  });
});
