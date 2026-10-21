import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { TileGridLayout } from './geometry';

export type { TileGridLayout };

/** Selection behaviour for a tile grid. */
export type TileGridSelectionMode = 'none' | 'single' | 'multiselect';

/**
 * Imperative operations exposed by a TileGrid ref.
 *
 * The handle is intentionally small in this phase: it covers the operations
 * that need current items or scroll geometry and cannot be expressed by props.
 */
export interface TileGridHandle {
  /** Selects every current item in multiselect mode. */
  selectAll(): void;
  /** Clears every selected ID, including hidden IDs. */
  clearSelection(): void;
  /** Scrolls to the first selected item in current item order. */
  scrollToSelected(): void;
}

/**
 * Arguments passed to the application's `renderItem` callback.
 *
 * The wrapper owns positioning and list semantics. The renderer draws the
 * tile's content inside the measured rectangle.
 */
export interface TileGridItemRenderArgs<T> {
  /** The original item. */
  item: T;
  /** Zero-based index in the normalized item list. */
  index: number;
  /** Resolved tile size used for the layout calculation. */
  tileSize: number;
  /** Computed tile width in CSS pixels. */
  width: number;
  /** Computed tile height in CSS pixels. */
  height: number;
  /** Whether this item is currently selected. */
  selected: boolean;
  /** Whether this item may be selected in the current selection mode. */
  selectable: boolean;
  /** Whether this item is disabled. */
  disabled: boolean;
}

/** Localizable strings used by the empty state. */
export interface TileGridStrings {
  /** Message shown when there are no items. */
  emptyMessage: string;
}

/**
 * Props for the TileGrid component.
 *
 * Native `div` props pass through except `children`, `role`, `aria-label`, and
 * `dangerouslySetInnerHTML`; the component owns the list role and its content.
 */
export interface TileGridProps<T> extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'role' | 'aria-label' | 'dangerouslySetInnerHTML'
> {
  /** Items to render. Duplicate IDs keep the first occurrence. */
  items: readonly T[];
  /** Stable identifier used for keys, geometry, and selection. */
  getItemId: (item: T) => string;
  /** Human-readable label used for the item and the accessible name. */
  getItemLabel: (item: T) => string;
  /** Intrinsic aspect ratio used by masonry and justified layouts. */
  getItemAspectRatio?: (item: T) => number | null | undefined;
  /** Optional 1x1 or 2x2 span used by the mosaic layout. */
  getItemSpan?: (item: T) => { columns?: 1 | 2; rows?: 1 | 2 } | undefined;
  /** Draws the tile content inside the positioned wrapper. */
  renderItem: (args: TileGridItemRenderArgs<T>) => ReactNode;
  /** Replaces the default empty message when there are no items. */
  renderEmpty?: () => ReactNode;
  /** Layout strategy. Defaults to `fixed`. */
  layout?: TileGridLayout;
  /** Preferred tile size. Defaults to 160. */
  tileSize?: number;
  /** Lower bound for the resolved tile size. Defaults to 120. */
  minTileSize?: number;
  /** Upper bound for the resolved tile size. Defaults to 320. */
  maxTileSize?: number;
  /** Aspect ratio for fixed-layout tiles. Defaults to 1. */
  tileAspectRatio?: number;
  /** Fallback ratio for items without a usable intrinsic ratio. Defaults to 1. */
  fallbackAspectRatio?: number;
  /** Explicit column count. Automatic when omitted or non-finite. */
  columns?: number;
  /** Gap between tiles and rows. Defaults to 8. */
  gap?: number;
  /** Accessible name for the list. Prefer `aria-labelledby` when available. */
  ariaLabel?: string;
  /** Overrides for localizable strings. */
  strings?: Partial<TileGridStrings>;
  /** Selection behaviour. Defaults to `none`. */
  selectionMode?: TileGridSelectionMode;
  /** Controlled selected IDs; the source of truth when supplied. */
  selectedIds?: ReadonlySet<string>;
  /** Uncontrolled initial selected IDs. Ignored when `selectedIds` is supplied. */
  defaultSelectedIds?: Iterable<string>;
  /** Called once with the requested next set when a selection action changes it. */
  onSelectionChange?: (next: ReadonlySet<string>) => void;
}
