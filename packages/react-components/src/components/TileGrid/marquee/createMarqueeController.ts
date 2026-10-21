import { areSetsEqual } from '../selection/transitions';
import { normalizeRect, rectsIntersect } from './intersection';
import type {
  MarqueeController,
  MarqueeRect,
  MarqueeSelectionOptions,
  PointerLikeEvent,
} from './types';

type MarqueePhase = 'idle' | 'pending' | 'active' | 'committed' | 'cancelled';

const EMPTY_SELECTION: ReadonlySet<string> = new Set<string>();

function defaultRequestFrame(callback: FrameRequestCallback): number {
  return typeof requestAnimationFrame === 'function' ? requestAnimationFrame(callback) : 0;
}

function defaultCancelFrame(handle: number): void {
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(handle);
  }
}

/**
 * Creates the internal marquee state machine.
 *
 * The controller never attaches listeners and never measures individual item
 * elements. The caller supplies pointer events, a frame scheduler when needed,
 * and the cached geometry port; the controller returns a preview set and
 * commits exactly once when an active gesture ends.
 */
export function createMarqueeController({
  geometry,
  getSelectedIds,
  isSelectable,
  onCommit,
  onCancel,
  onPreview,
  activationDistance = 4,
  edgeThreshold = 24,
  maxScrollSpeed = 20,
  pointerCaptureTarget = null,
  requestFrame = defaultRequestFrame,
  cancelFrame = defaultCancelFrame,
}: MarqueeSelectionOptions): MarqueeController {
  let phase: MarqueePhase = 'idle';
  let pointerId = -1;
  let startClientX = 0;
  let startClientY = 0;
  let startContentX = 0;
  let startContentY = 0;
  let pointerClientX = 0;
  let pointerClientY = 0;
  let additive = false;
  let preSelection: ReadonlySet<string> = EMPTY_SELECTION;
  let preview: ReadonlySet<string> = EMPTY_SELECTION;
  let lastHits: ReadonlySet<string> = EMPTY_SELECTION;
  let rect: MarqueeRect | null = null;
  let frameHandle: number | null = null;
  let captured = false;

  const releaseCapture = (): void => {
    if (
      captured &&
      pointerCaptureTarget &&
      typeof pointerCaptureTarget.releasePointerCapture === 'function'
    ) {
      try {
        pointerCaptureTarget.releasePointerCapture(pointerId);
      } catch {
        // Capture can already be gone; releasing is best-effort.
      }
    }

    captured = false;
  };

  const stopFrames = (): void => {
    if (frameHandle !== null) {
      cancelFrame(frameHandle);
      frameHandle = null;
    }
  };

  const containerBounds = (): DOMRect | null =>
    geometry.getScrollContainer()?.getBoundingClientRect() ?? null;

  /**
   * Converts a client point to content coordinates.
   *
   * The pointer-down anchor is converted once; later points use the current
   * scroll offset so auto-scroll keeps the rectangle anchored while its far
   * edge follows the pointer through the content.
   */
  const contentPoint = (
    clientX: number,
    clientY: number,
    bounds = containerBounds()
  ): { x: number; y: number } => {
    return {
      x: clientX - (bounds?.left ?? 0),
      y: clientY - (bounds?.top ?? 0) + geometry.getScrollOffset(),
    };
  };

  /**
   * Returns the signed auto-scroll speed for the current pointer position.
   *
   * Positive means scroll down, negative means scroll up. The distance is
   * measured from the nearest edge; at or beyond an edge the pointer cannot
   * move farther, so the maximum speed is used instead of a dead zone.
   */
  const edgeDelta = (clientY: number, bounds = containerBounds()): number => {
    if (!bounds) {
      return 0;
    }

    const bottomDistance = bounds.bottom - clientY;
    const topDistance = clientY - bounds.top;

    if (bottomDistance <= 0) {
      return maxScrollSpeed;
    }

    if (topDistance <= 0) {
      return -maxScrollSpeed;
    }

    if (bottomDistance <= edgeThreshold) {
      return Math.min(maxScrollSpeed, Math.max(1, bottomDistance));
    }

    if (topDistance <= edgeThreshold) {
      return -Math.min(maxScrollSpeed, Math.max(1, topDistance));
    }

    return 0;
  };

  const updatePreview = (nextPreview: ReadonlySet<string>): void => {
    if (areSetsEqual(preview, nextPreview)) {
      return;
    }

    preview = nextPreview;
    onPreview?.(new Set(nextPreview));
  };

  const updateFromPointer = (
    clientX: number,
    clientY: number,
    bounds = containerBounds()
  ): void => {
    const current = contentPoint(clientX, clientY, bounds);
    rect = normalizeRect(startContentX, startContentY, current.x, current.y);

    const hits = new Set<string>();

    for (const id of geometry.getVisibleItemIds()) {
      const itemRect = geometry.getItemRect(id);

      if (itemRect && isSelectable(id) && rectsIntersect(itemRect, rect)) {
        hits.add(id);
      }
    }

    if (areSetsEqual(lastHits, hits)) {
      return;
    }

    lastHits = hits;

    if (!additive) {
      updatePreview(hits);
      return;
    }

    const next = new Set(preSelection);
    for (const id of hits) {
      next.add(id);
    }
    updatePreview(next);
  };

  const scheduleFrame = (delta: number): void => {
    if (phase !== 'active' || frameHandle !== null || delta === 0) {
      return;
    }

    frameHandle = requestFrame(runFrame);
  };

  function runFrame(): void {
    frameHandle = null;

    if (phase !== 'active') {
      return;
    }

    const bounds = containerBounds();
    const delta = edgeDelta(pointerClientY, bounds);

    if (delta === 0) {
      return;
    }

    const before = geometry.getScrollOffset();
    geometry.scrollBy(delta);
    updateFromPointer(pointerClientX, pointerClientY, bounds);

    // Stop at a boundary instead of rescheduling a no-op frame forever; the
    // next pointer move restarts the loop if the pointer is still in the zone.
    if (geometry.getScrollOffset() !== before) {
      scheduleFrame(delta);
    } else {
      stopFrames();
    }
  }

  const cancel = (): void => {
    if (phase !== 'pending' && phase !== 'active') {
      return;
    }

    phase = 'cancelled';
    stopFrames();
    rect = null;
    preview = new Set(preSelection);
    lastHits = EMPTY_SELECTION;
    onCancel?.(new Set(preSelection));
    releaseCapture();
  };

  return {
    handlePointerDown(event: PointerLikeEvent): void {
      if (
        event.button !== 0 ||
        (phase !== 'idle' && phase !== 'committed' && phase !== 'cancelled')
      ) {
        return;
      }

      pointerId = event.pointerId;
      startClientX = event.clientX;
      startClientY = event.clientY;
      pointerClientX = event.clientX;
      pointerClientY = event.clientY;
      additive = event.shiftKey || event.ctrlKey || event.metaKey;
      preSelection = new Set(getSelectedIds());
      preview = additive ? new Set(preSelection) : EMPTY_SELECTION;
      lastHits = EMPTY_SELECTION;
      rect = null;
      phase = 'pending';

      const bounds = containerBounds();
      const start = contentPoint(event.clientX, event.clientY, bounds);
      startContentX = start.x;
      startContentY = start.y;

      if (pointerCaptureTarget && typeof pointerCaptureTarget.setPointerCapture === 'function') {
        try {
          pointerCaptureTarget.setPointerCapture(event.pointerId);
          captured = true;
        } catch {
          captured = false;
        }
      }
    },

    handlePointerMove(event: PointerLikeEvent): void {
      if (phase !== 'pending' && phase !== 'active') {
        return;
      }

      if (event.pointerId !== pointerId) {
        return;
      }

      pointerClientX = event.clientX;
      pointerClientY = event.clientY;

      if (phase === 'pending') {
        const distance = Math.hypot(event.clientX - startClientX, event.clientY - startClientY);

        if (distance < activationDistance) {
          return;
        }

        phase = 'active';
      }

      const bounds = containerBounds();
      updateFromPointer(event.clientX, event.clientY, bounds);

      const delta = edgeDelta(event.clientY, bounds);

      if (delta !== 0) {
        scheduleFrame(delta);
      } else {
        stopFrames();
      }
    },

    handlePointerUp(event: PointerLikeEvent): void {
      if (event.pointerId !== pointerId) {
        return;
      }

      if (phase === 'pending') {
        phase = 'idle';
        stopFrames();
        rect = null;
        preview = EMPTY_SELECTION;
        releaseCapture();
        return;
      }

      if (phase !== 'active') {
        return;
      }

      const finalSelection = new Set(preview);
      phase = 'committed';
      stopFrames();
      rect = null;
      onCommit(finalSelection);
      releaseCapture();
    },

    handlePointerCancel(event: PointerLikeEvent): void {
      if (event.pointerId === pointerId) {
        cancel();
      }
    },

    handleLostPointerCapture(event: PointerLikeEvent): void {
      if (event.pointerId === pointerId) {
        cancel();
      }
    },

    handleKeyDown(event: Pick<KeyboardEvent, 'key' | 'preventDefault'>): void {
      if (event.key !== 'Escape' || (phase !== 'pending' && phase !== 'active')) {
        return;
      }

      event.preventDefault();
      cancel();
    },

    getRect(): MarqueeRect | null {
      return rect ? { ...rect } : null;
    },

    getPreviewSelection(): ReadonlySet<string> {
      return new Set(preview);
    },

    isActive(): boolean {
      return phase === 'active';
    },

    dispose(): void {
      phase = 'idle';
      stopFrames();
      rect = null;
      preview = EMPTY_SELECTION;
      releaseCapture();
    },
  };
}
