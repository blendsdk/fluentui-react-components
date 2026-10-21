import type { TileGridGeometryResult } from '../geometry';
import type { TileGridBandVirtualizerOptions, TileGridMasonryVirtualizerOptions } from './types';

/** Inputs for the band virtualizer options builder. */
export interface BuildBandVirtualizerOptionsInput {
  /** Geometry result whose bands drive the virtual range. */
  geometry: Pick<TileGridGeometryResult, 'bands'>;
  /** Returns the root scroll element. */
  getScrollElement: () => HTMLDivElement | null;
  /** Normalized gap between bands. */
  gap: number;
  /** Extra bands rendered on each side. Defaults to two. */
  overscan?: number;
}

/** Inputs for the masonry virtualizer options builder. */
export interface BuildMasonryVirtualizerOptionsInput {
  /** Geometry result whose item rectangles and lanes drive the range. */
  geometry: Pick<TileGridGeometryResult, 'itemRects' | 'laneCount'>;
  /** Returns the root scroll element. */
  getScrollElement: () => HTMLDivElement | null;
  /** Normalized gap between tiles. */
  gap: number;
  /** Extra lane rows rendered on each side. Defaults to two. */
  overscan?: number;
}

/**
 * Builds TanStack Virtual options for the band-based layouts.
 *
 * The virtualizer's cumulative starts match the geometry band starts because
 * both use the same band heights and gap. The geometry result stays
 * authoritative for the spacer height and the rendered rectangles.
 */
export function buildBandVirtualizerOptions({
  geometry,
  getScrollElement,
  gap,
  overscan = 2,
}: BuildBandVirtualizerOptionsInput): TileGridBandVirtualizerOptions {
  return {
    count: geometry.bands.length,
    getScrollElement,
    estimateSize: index => geometry.bands[index]?.height ?? 0,
    getItemKey: index => {
      const band = geometry.bands[index];
      return band ? `${index}:${band.firstIndex}:${band.lastIndex}` : String(index);
    },
    gap,
    overscan,
  };
}

/**
 * Builds TanStack Virtual options for the masonry layout.
 *
 * TanStack's lane assignment is a range calculator only. The rendered tile
 * positions still come from the geometry rectangles. The parity test asserts
 * start/end parity and a valid lane range; the lane number may differ when two
 * lanes end at the same offset.
 */
export function buildMasonryVirtualizerOptions({
  geometry,
  getScrollElement,
  gap,
  overscan = 2,
}: BuildMasonryVirtualizerOptionsInput): TileGridMasonryVirtualizerOptions {
  return {
    count: geometry.itemRects.length,
    getScrollElement,
    estimateSize: index => geometry.itemRects[index]?.height ?? 0,
    getItemKey: index => geometry.itemRects[index]?.id ?? String(index),
    gap,
    overscan,
    lanes: Math.max(1, geometry.laneCount),
  };
}
