import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo } from 'react';
import type { TileGridVirtualizerInput, TileGridVirtualWindow } from './types';
import { buildBandVirtualizerOptions, buildMasonryVirtualizerOptions } from './options';

/**
 * Resolves the mounted item window for the current layout and scroll offset.
 *
 * Fixed, justified, and mosaic layouts virtualize geometry bands, then include
 * the item index range carried by every rendered band. Masonry virtualizes
 * individual items with lanes. In both cases the geometry result remains the
 * source of rendered rectangles; this hook only chooses which indexes to
 * mount.
 *
 * The options are memoized so a scroll render keeps the same `getItemKey`
 * identity. TanStack can then reuse its measurement cache instead of rebuilding
 * the full item table on every scroll event.
 */
export function useTileGridVirtualizer({
  layout,
  geometry,
  rootRef,
  gap,
  overscan = 2,
}: TileGridVirtualizerInput): TileGridVirtualWindow {
  const getScrollElement = useMemo(() => () => rootRef.current, [rootRef]);
  const options = useMemo(
    () =>
      layout === 'masonry'
        ? buildMasonryVirtualizerOptions({
            geometry,
            getScrollElement,
            gap,
            overscan,
          })
        : buildBandVirtualizerOptions({
            geometry,
            getScrollElement,
            gap,
            overscan,
          }),
    [layout, geometry, getScrollElement, gap, overscan]
  );
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>(options);
  const virtualItems = virtualizer.getVirtualItems();

  if (layout === 'masonry') {
    return { itemIndexes: virtualItems.map(item => item.index) };
  }

  if (virtualItems.length === 0) {
    return { itemIndexes: [] };
  }

  const itemIndexes = new Set<number>();

  for (const virtualBand of virtualItems) {
    const band = geometry.bands[virtualBand.index];

    if (!band) {
      continue;
    }

    const first = Math.max(0, band.firstIndex);
    const last = Math.min(geometry.itemRects.length - 1, band.lastIndex);

    for (let index = first; index <= last; index += 1) {
      itemIndexes.add(index);
    }
  }

  return {
    itemIndexes: [...itemIndexes].sort((left, right) => left - right),
  };
}
