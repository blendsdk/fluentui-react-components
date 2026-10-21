import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { TileGridLayout } from './geometry';

export type { TileGridLayout };

/** Selection behaviour for a tile grid. */
export type TileGridSelectionMode = 'none' | 'single' | 'multiselect';

/** Whether an unmodified tile click selects the item or activates it. */
export type TileGridInteractionMode = 'browse' | 'select';

/**
 * Imperative operations exposed by a TileGrid ref.
 *
 * The handle covers the operations that need current items or scroll geometry
 * and cannot be expressed by props.
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

/** Localizable empty-state and committed-selection messages. */
export interface TileGridStrings {
  /** Message shown when there are no items. */
  emptyMessage: string;
  /** Formats the committed count, including hidden IDs, against the current item total. */
  selectionCount: (selected: number, total: number) => string;
}

/**
 * Props for the TileGrid component.
 *
 * Native `div` props pass through except `children`, `role`, `aria-label`,
 * `tabIndex`, and `dangerouslySetInnerHTML`; the grid owns list semantics,
 * content, and keyboard entry. Selection changes are proposals when controlled.
 */
export interface TileGridProps<T> extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'role' | 'aria-label' | 'tabIndex' | 'dangerouslySetInnerHTML'
> {
  /** Items to render. Duplicate IDs keep the first occurrence. */
  items: readonly T[];
  /**
   * Stable identifier used for keys, geometry, and selection.
   *
   * Pass a stable identity (a module-level function or `useCallback`) so an
   * unrelated parent render does not recompute geometry and re-render the
   * mounted cells.
   */
  getItemId: (item: T) => string;
  /** Human-readable label used for the item and the accessible name. */
  getItemLabel: (item: T) => string;
  /** Intrinsic aspect ratio used by masonry and justified layouts. */
  getItemAspectRatio?: (item: T) => number | null | undefined;
  /** Optional 1x1 or 2x2 span used by the mosaic layout. */
  getItemSpan?: (item: T) => { columns?: 1 | 2; rows?: 1 | 2 } | undefined;
  /**
   * Draws the tile content inside the positioned wrapper.
   *
   * Pass a stable identity (a module-level function or `useCallback`) so a
   * selection change re-renders only the affected mounted cell instead of all
   * visible cells.
   */
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
  /** Selection behaviour, fixed until unmount. Defaults to `none`. */
  selectionMode?: TileGridSelectionMode;
  /** Controlled selected IDs; the source of truth when supplied. */
  selectedIds?: ReadonlySet<string>;
  /** Uncontrolled initial selected IDs. Ignored when `selectedIds` is supplied. */
  defaultSelectedIds?: Iterable<string>;
  /** Called once with the requested next set when a selection action changes it. */
  onSelectionChange?: (next: ReadonlySet<string>) => void;
  /** Plain click behavior when selection is enabled. Defaults to `select`. */
  interactionMode?: TileGridInteractionMode;
  /** Enables mouse/pen background marquee in multiselect mode. Defaults to false. */
  enableMarquee?: boolean;
  /**
   * Whether a current item may be selected by a gesture. Defaults to true.
   * Existing membership is preserved. Keep the callback identity stable during marquee.
   */
  isSelectable?: (item: T) => boolean;
  /**
   * Blocks item selection and activation, while retaining readable, focusable content.
   * Defaults to false. Keep the callback identity stable during marquee.
   */
  isDisabled?: (item: T) => boolean;
  /** Receives enabled item activation from browse clicks, select double-clicks, or Enter. */
  onItemActivate?: (item: T) => void;
  /** Changing this key resets scroll to the top while retaining selection. Compared with Object.is. */
  scrollResetKey?: unknown;
  /** Enables unmodified keyboard zoom when a size callback is supplied. Defaults to false. */
  zoomable?: boolean;
  /** Reports the requested bounded tile size; the application must apply it through `tileSize`. */
  onTileSizeChange?: (size: number) => void;
}
