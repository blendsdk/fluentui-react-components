import { normalizeRect, rectsIntersect } from './intersection';
import type {
  MarqueeController,
  MarqueeRect,
  MarqueeSelectionOptions,
  PointerLikeEvent,
} from './types';

type MarqueePhase = 'idle' | 'pending' | 'active' | 'committed' | 'cancelled';

const EMPTY_SELECTION: ReadonlySet<string> = new Set<string>();

function selectionEquals(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  if (left === right) {
    return true;
  }

  if (left.size !== right.size) {
    return false;
  }

  for (const id of left) {
    if (!right.has(id)) {
      return false;
    }
  }

  return true;
}

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

  const contentPoint = (clientX: number, clientY: number): { x: number; y: number } => {
    const bounds = containerBounds();

    return {
      x: clientX - (bounds?.left ?? 0),
      y: clientY - (bounds?.top ?? 0) + geometry.getScrollOffset(),
    };
  };

  const edgeDelta = (clientY: number): number => {
    const bounds = containerBounds();

    if (!bounds) {
      return 0;
    }

    const bottomDistance = bounds.bottom - clientY;
    const topDistance = clientY - bounds.top;
    const bottomSpeed = Math.min(maxScrollSpeed, Math.max(1, bottomDistance));
    const topSpeed = Math.min(maxScrollSpeed, Math.max(1, topDistance));

    if (bottomDistance > 0 && bottomDistance <= edgeThreshold) {
      return bottomSpeed;
    }

    if (topDistance > 0 && topDistance <= edgeThreshold) {
      return -topSpeed;
    }

    return 0;
  };

  const updatePreview = (nextPreview: ReadonlySet<string>): void => {
    if (selectionEquals(preview, nextPreview)) {
      return;
    }

    preview = nextPreview;
    onPreview?.(new Set(nextPreview));
  };

  const updateFromPointer = (clientX: number, clientY: number): void => {
    const current = contentPoint(clientX, clientY);
    rect = normalizeRect(startContentX, startContentY, current.x, current.y);

    const next = new Set<string>();

    if (additive) {
      for (const id of preSelection) {
        next.add(id);
      }
    }

    for (const id of geometry.getVisibleItemIds()) {
      const itemRect = geometry.getItemRect(id);

      if (itemRect && isSelectable(id) && rectsIntersect(itemRect, rect)) {
        next.add(id);
      }
    }

    updatePreview(next);
  };

  const scheduleFrame = (): void => {
    if (phase !== 'active' || frameHandle !== null) {
      return;
    }

    if (edgeDelta(pointerClientY) === 0) {
      return;
    }

    frameHandle = requestFrame(runFrame);
  };

  function runFrame(): void {
    frameHandle = null;

    if (phase !== 'active') {
      return;
    }

    const delta = edgeDelta(pointerClientY);

    if (delta === 0) {
      return;
    }

    geometry.scrollBy(delta);
    updateFromPointer(pointerClientX, pointerClientY);
    scheduleFrame();
  }

  const cancel = (): void => {
    if (phase !== 'pending' && phase !== 'active') {
      return;
    }

    phase = 'cancelled';
    stopFrames();
    rect = null;
    preview = new Set(preSelection);
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
      rect = null;
      phase = 'pending';

      const start = contentPoint(event.clientX, event.clientY);
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

      updateFromPointer(event.clientX, event.clientY);

      if (edgeDelta(event.clientY) !== 0) {
        scheduleFrame();
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
