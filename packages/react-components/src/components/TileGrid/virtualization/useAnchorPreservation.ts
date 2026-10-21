import { useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { TileGridGeometryResult } from '../geometry';
import { scrollToOffset } from './scrollHelpers';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Inputs for the first-visible-item anchor restoration. */
export interface UseAnchorPreservationInput<T> {
  /** Ref to the grid root, which is also the scroll container. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Geometry result for the current render. */
  geometry: TileGridGeometryResult;
  /** Stable signature of the layout inputs that change item positions. */
  geometryKey: string;
  /** Normalized item list; a new reference means the item set changed. */
  itemList: readonly T[];
}

/**
 * Keeps the first visible item and its pixel offset stable when the geometry
 * changes.
 *
 * A plain scroll does not alter the geometry key or the item list, so it never
 * triggers a restore. When an item disappears from a changed layout, the
 * container returns to the top because there is no reliable anchor left.
 */
export function useAnchorPreservation<T>({
  rootRef,
  geometry,
  geometryKey,
  itemList,
}: UseAnchorPreservationInput<T>): void {
  const previousGeometry = useRef(geometry);
  const previousKey = useRef(geometryKey);
  const previousItemList = useRef(itemList);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const oldGeometry = previousGeometry.current;
    const oldKey = previousKey.current;
    const oldItemList = previousItemList.current;

    previousGeometry.current = geometry;
    previousKey.current = geometryKey;
    previousItemList.current = itemList;

    if (!root || (oldKey === geometryKey && oldItemList === itemList)) {
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
    // Keep at least one pixel of the anchor inside the viewport. An offset
    // equal to the item height would place its bottom exactly at the scroll
    // top, where firstVisibleItem no longer sees it.
    const maximumOffset = Math.max(0, nextRect.height - 1);
    const clampedOffset = Math.min(Math.max(offset, 0), maximumOffset);

    scrollToOffset(root, nextRect.y + clampedOffset);
  }, [geometry, geometryKey, itemList, rootRef]);
}
