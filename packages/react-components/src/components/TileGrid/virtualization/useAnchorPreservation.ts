import { useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { TileGridGeometryResult } from '../geometry';
import { scrollToOffset } from './scrollHelpers';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Inputs for the first-visible-item anchor restoration. */
export interface UseAnchorPreservationInput {
  /** Ref to the grid root, which is also the scroll container. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Geometry result for the current render. */
  geometry: TileGridGeometryResult;
  /** Stable signature of every input that changes item positions. */
  geometryKey: string;
}

/**
 * Keeps the first visible item and its pixel offset stable when the geometry
 * changes.
 *
 * A plain scroll does not alter the geometry key, so it never triggers a
 * restore. When an item disappears from a changed layout, the container
 * returns to the top because there is no reliable anchor left.
 */
export function useAnchorPreservation({
  rootRef,
  geometry,
  geometryKey,
}: UseAnchorPreservationInput): void {
  const previousGeometry = useRef(geometry);
  const previousKey = useRef(geometryKey);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const oldGeometry = previousGeometry.current;
    const oldKey = previousKey.current;

    previousGeometry.current = geometry;
    previousKey.current = geometryKey;

    if (!root || oldKey === geometryKey) {
      return;
    }

    const scrollTop = root.scrollTop;
    const anchor = oldGeometry.firstVisibleItem(scrollTop);

    if (!anchor) {
      scrollToOffset(root, 0);
      return;
    }

    const nextRect = geometry.itemRects.find(rect => rect.id === anchor.id);

    if (!nextRect) {
      scrollToOffset(root, 0);
      return;
    }

    const offset = scrollTop - anchor.y;
    const clampedOffset = Math.min(Math.max(offset, 0), nextRect.height);

    scrollToOffset(root, nextRect.y + clampedOffset);
  }, [geometry, geometryKey, rootRef]);
}
