import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo } from 'react';
import type { TileGridVirtualizerInput, TileGridVirtualWindow } from './types';
import { buildBandVirtualizerOptions, buildMasonryVirtualizerOptions } from './options';

/**
 * Resolves the mounted item window for the current layout and scroll offset.
 *
 * Fixed, justified, and mosaic layouts virtualize geometry bands, then include
 * every item that intersects the rendered band range. Masonry virtualizes
 * individual items with lanes. In both cases the geometry result remains the
 * source of rendered rectangles; this hook only chooses which indexes to
 * mount.
 */
export function useTileGridVirtualizer({
  layout,
  geometry,
  rootRef,
  gap,
  overscan = 2,
}: TileGridVirtualizerInput): TileGridVirtualWindow {
  const getScrollElement = useMemo(() => () => rootRef.current, [rootRef]);
  const bandOptions = buildBandVirtualizerOptions({
    geometry,
    getScrollElement,
    gap,
    overscan,
  });
  const masonryOptions = buildMasonryVirtualizerOptions({
    geometry,
    getScrollElement,
    gap,
    overscan,
  });
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>(
    layout === 'masonry' ? masonryOptions : bandOptions
  );
  const virtualItems = virtualizer.getVirtualItems();

  if (layout === 'masonry') {
    return { itemIndexes: virtualItems.map(item => item.index) };
  }

  if (virtualItems.length === 0) {
    return { itemIndexes: [] };
  }

  const firstBand = virtualItems[0];
  const lastBand = virtualItems[virtualItems.length - 1];

  return {
    itemIndexes: geometry.itemsInRange(firstBand.start, lastBand.start + lastBand.size),
  };
}
