import type { TileGridLayout, TileGridItemRect } from '../geometry';

/** Stable identifier for the single droppable registered on the grid root. */
export const TILE_GRID_DROPPABLE_ID = 'tile-grid-root';

/** Stable action ids used by the keyboard reorder actions. */
export const TILE_GRID_REORDER_ACTION_IDS = {
  /** Moves the item one position toward the start. */
  moveUp: 'move-up',
  /** Moves the item one position toward the end. */
  moveDown: 'move-down',
} as const;

/** Where the pointer would insert the dragged item. */
export interface TileGridInsertion {
  /** Boundary in the current item order, from 0 through the item count. */
  boundary: number;
  /** Whether the item lands before or after the nearest rectangle. */
  edge: 'before' | 'after';
  /** Index of the nearest mounted rectangle. */
  index: number;
  /** Nearest mounted rectangle in content coordinates. */
  rect: TileGridItemRect;
}

/** Viewport rectangle captured at drag start for the portal copy. */
export interface TileGridOverlayRect {
  /** Viewport left edge. */
  left: number;
  /** Viewport top edge. */
  top: number;
  /** Tile width. */
  width: number;
  /** Tile height. */
  height: number;
}

/** Pointer translation applied to the overlay since drag start. */
export interface TileGridOverlayOffset {
  /** Horizontal translation in CSS pixels. */
  x: number;
  /** Vertical translation in CSS pixels. */
  y: number;
}

/** Inputs required to resolve an insertion from a pointer position. */
export interface FindInsertionInput {
  /** Pointer x in scroll-content coordinates. */
  x: number;
  /** Pointer y in scroll-content coordinates. */
  y: number;
  /** Mounted rectangles in scroll-content coordinates. */
  rects: readonly TileGridItemRect[];
  /** Layout that defines the reading edge. */
  layout: TileGridLayout;
  /** Number of items in the current normalized list. */
  itemCount: number;
}
