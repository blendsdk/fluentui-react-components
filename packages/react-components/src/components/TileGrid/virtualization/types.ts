import type { RefObject } from 'react';
import type { TileGridGeometryResult, TileGridLayout } from '../geometry';

/**
 * Inputs shared by the TileGrid virtualizer hook.
 *
 * The geometry result remains the source of item positions and total height;
 * the virtualizer only decides which indexes are close enough to the viewport
 * to render.
 */
export interface TileGridVirtualizerInput {
  /** Layout strategy currently in use. */
  layout: TileGridLayout;
  /** Geometry result for the current items and container width. */
  geometry: TileGridGeometryResult;
  /** Ref to the grid root, which is also the scroll container. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Normalized gap between bands or lanes. */
  gap: number;
  /** Extra rows rendered above and below the viewport. Defaults to two. */
  overscan?: number;
}

/** The indexes that should be mounted for the current virtual window. */
export interface TileGridVirtualWindow {
  /** Item indexes in ascending order. */
  itemIndexes: readonly number[];
}

/**
 * Options for the band virtualizer used by fixed, justified, and mosaic
 * layouts. One virtual item represents one layout band.
 */
export interface TileGridBandVirtualizerOptions {
  /** Number of geometry bands. */
  count: number;
  /** Returns the scroll container. */
  getScrollElement: () => HTMLDivElement | null;
  /** Returns the height of one band. */
  estimateSize: (index: number) => number;
  /** Stable key for a band, including its item range. */
  getItemKey: (index: number) => string;
  /** Gap between bands. */
  gap: number;
  /** Number of extra bands rendered on each side. */
  overscan: number;
}

/**
 * Options for the masonry virtualizer. One virtual item represents one tile,
 * and TanStack's lane assignment must match the geometry lane assignment.
 */
export interface TileGridMasonryVirtualizerOptions extends TileGridBandVirtualizerOptions {
  /** Number of masonry lanes. */
  lanes: number;
}
