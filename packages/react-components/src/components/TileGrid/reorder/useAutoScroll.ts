import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';

/** Distance from a scroll edge that starts auto-scrolling, in CSS pixels. */
export const AUTO_SCROLL_EDGE = 24;

/** Slowest frame step, used at the outer edge of the active zone. */
const MIN_STEP = 4;

/** Fastest frame step, used at the edge or beyond it. */
const MAX_STEP = 18;

/** Inputs for the proportional drag auto-scroll loop. */
export interface UseAutoScrollInput {
  /** Scroll container that owns the drag. */
  rootRef: RefObject<HTMLElement | null>;
  /** Whether arranging can auto-scroll; disabling stops a pending loop. */
  enabled: boolean;
  /** Called after each scroll step so the insertion can be recomputed. */
  onScroll: () => void;
}

/** Handle returned by the auto-scroll hook. */
export interface TileGridAutoScroll {
  /** Updates the pointer position and starts, stops, or retargets the loop. */
  updatePointer(clientY: number, rootRect?: DOMRect): void;
  /** Cancels the loop and clears its speed. */
  stop(): void;
}

/** Returns a frame step that grows as the pointer approaches the edge. */
function stepFor(distance: number): number {
  const closeness = 1 - Math.min(Math.max(distance, 0), AUTO_SCROLL_EDGE) / AUTO_SCROLL_EDGE;
  return MIN_STEP + (MAX_STEP - MIN_STEP) * closeness;
}

/**
 * Scrolls a drag container while the pointer rests near its vertical edges.
 *
 * The step is proportional: slow at the 24px boundary and fast at the edge.
 * One animation frame is scheduled only while a nonzero step exists, and each
 * step notifies the caller so the insertion indicator follows content that
 * moves under a stationary pointer.
 */
export function useAutoScroll({
  rootRef,
  enabled,
  onScroll,
}: UseAutoScrollInput): TileGridAutoScroll {
  const enabledRef = useRef(enabled);
  const onScrollRef = useRef(onScroll);
  const speedRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  onScrollRef.current = onScroll;

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    speedRef.current = 0;
  }, []);

  const tick = useCallback(() => {
    const root = rootRef.current;
    const speed = speedRef.current;

    if (!root || speed === 0) {
      frameRef.current = null;
      return;
    }

    const before = root.scrollTop;
    const max = Math.max(root.scrollHeight - root.clientHeight, 0);
    root.scrollTop = Math.min(Math.max(before + speed, 0), max);

    onScrollRef.current();

    frameRef.current = root.scrollTop === before ? null : requestAnimationFrame(tick);
  }, [rootRef]);

  const start = useCallback(() => {
    if (frameRef.current !== null || typeof requestAnimationFrame !== 'function') return;
    frameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const updatePointer = useCallback(
    (clientY: number, rootRect?: DOMRect) => {
      const root = rootRef.current;
      if (!root || !enabledRef.current) {
        stop();
        return;
      }

      const rect = rootRect ?? root.getBoundingClientRect();
      const fromTop = clientY - rect.top;
      const fromBottom = rect.bottom - clientY;

      let speed = 0;
      if (fromTop < AUTO_SCROLL_EDGE) speed = -stepFor(fromTop);
      else if (fromBottom < AUTO_SCROLL_EDGE) speed = stepFor(fromBottom);

      speedRef.current = speed;
      if (speed === 0) stop();
      else start();
    },
    [rootRef, start, stop]
  );

  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) stop();
    return stop;
  }, [enabled, stop]);

  return useMemo(() => ({ updatePointer, stop }), [stop, updatePointer]);
}
