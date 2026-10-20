/** Layout strategy supported by the TileGrid geometry engine. */
export type TileGridLayout = 'fixed' | 'masonry' | 'justified' | 'mosaic';

/** A single positioned item rectangle in scroll-container coordinates. */
export interface TileGridItemRect {
  id: string;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A row band used by band-based virtualization. */
export interface TileGridBand {
  /** Top of the band in scroll-container coordinates. */
  start: number;
  /** Content height of the band, without the inter-band gap. */
  height: number;
  /** First item index intersecting this band; includes a tall span from an earlier row. */
  firstIndex: number;
  /** Last item index intersecting this band; includes a tall span from an earlier row. */
  lastIndex: number;
}

/** Inputs required to compute a layout. */
export interface TileGridGeometryInput<T> {
  items: readonly T[];
  getItemId: (item: T) => string;
  getItemAspectRatio?: (item: T) => number | null | undefined;
  getItemSpan?: (item: T) => { columns?: 1 | 2; rows?: 1 | 2 } | undefined;
  layout: TileGridLayout;
  columns?: number;
  tileSize: number;
  tileAspectRatio: number;
  fallbackAspectRatio: number;
  gap: number;
  containerWidth: number;
}

/** Geometry input after numeric and column normalization. */
export interface ResolvedTileGridGeometryInput<T> extends Omit<
  TileGridGeometryInput<T>,
  'columns' | 'tileSize' | 'gap' | 'tileAspectRatio' | 'fallbackAspectRatio'
> {
  columns: number;
  tileSize: number;
  gap: number;
  tileAspectRatio: number;
  fallbackAspectRatio: number;
}

/** Raw layout result before the query helpers are attached. */
export interface TileGridLayoutResult {
  itemRects: TileGridItemRect[];
  bands: TileGridBand[];
  totalHeight: number;
  columnCount: number;
  laneCount: number;
}

/** The computed geometry consumed by the renderer, virtualizer, and marquee. */
export interface TileGridGeometryResult {
  itemRects: readonly TileGridItemRect[];
  bands: readonly TileGridBand[];
  totalHeight: number;
  columnCount: number;
  laneCount: number;
  indexAtPoint(x: number, y: number): number | undefined;
  firstVisibleItem(scrollTop: number): TileGridItemRect | undefined;
  offsetForItem(id: string): number | undefined;
  itemsInRange(startY: number, endY: number): readonly number[];
}
