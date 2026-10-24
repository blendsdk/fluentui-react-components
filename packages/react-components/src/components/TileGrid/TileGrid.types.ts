import type { ComponentPropsWithoutRef, ReactNode, SyntheticEvent } from 'react';
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
 * Result reported after a drag drop or keyboard move changes the item order.
 *
 * The application owns the item array; the grid never mutates `items`.
 */
export interface TileGridReorderArgs {
  /** ID of the moved item. */
  itemId: string;
  /** Zero-based index before the move in the current normalized item list. */
  fromIndex: number;
  /** Final zero-based index after the move. */
  toIndex: number;
  /** Complete ID order for the current items array, after the move. */
  orderedIds: readonly string[];
}

/**
 * Library-owned drag handle wiring passed to the default or custom handle.
 *
 * Raw dnd-kit types stay private; applications receive only these stable
 * values.
 */
export interface TileGridDragHandleProps {
  /** Attaches the drag sensor to the handle node. */
  setNodeRef: (node: HTMLElement | null) => void;
  /** Handle attributes; unsupported keyboard instructions are removed. */
  attributes: Record<string, string | number | boolean | undefined>;
  /** Pointer listeners that start and track the drag. */
  listeners: Record<string, (event: SyntheticEvent) => void>;
  /** Whether this tile is the active drag source. */
  isDragging: boolean;
  /** Whether arranging is unavailable for this tile. */
  disabled: boolean;
  /** Accessible handle name, normally `Reorder <item label>`. */
  label: string;
}

/**
 * Application-supplied action rendered by the tile shell.
 *
 * Actions are supplied by the application; the package never hardcodes
 * domain-specific actions.
 */
export interface TileGridAction<T> {
  /** Stable action identity. */
  id: string;
  /** Visible and accessible label; a blank label falls back to `id`. */
  label: string;
  /** Optional icon. When present, inline actions render icon-only. */
  icon?: ReactNode;
  /** Visual intent; defaults to `default`. */
  intent?: 'default' | 'danger';
  /** Runs once when the action is chosen. */
  onSelect: (item: T) => void;
  /** Optional per-item disabled state. */
  isDisabled?: (item: T) => boolean;
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
  /** Whether this tile is the active drag source. */
  isDragging: boolean;
  /** Whether this content is the portal overlay copy. */
  isOverlay: boolean;
  /** Handle wiring; absent when arranging is unavailable. */
  dragHandleProps?: TileGridDragHandleProps;
  /** Move up and Move down actions; absent when arranging is unavailable. */
  reorderActions?: readonly TileGridAction<T>[];
  /** Resolved localizable strings. */
  strings: TileGridStrings;
}

/** Localizable empty-state, selection, reorder, and menu messages. */
export interface TileGridStrings {
  /** Message shown when there are no items. */
  emptyMessage: string;
  /** Formats the committed count, including hidden IDs, against the current item total. */
  selectionCount: (selected: number, total: number) => string;
  /** Formats the drag handle name; defaults to `Reorder <item label>`. */
  dragHandleLabel: (itemLabel: string) => string;
  /** Keyboard move-up label; defaults to "Move up". */
  moveUp: string;
  /** Keyboard move-down label; defaults to "Move down". */
  moveDown: string;
  /** Formats the new position; defaults to `Moved to position <n> of <total>`. */
  reorderPosition: (position: number, total: number) => string;
  /** Accessible name for the overflow menu trigger; defaults to "More actions". */
  moreActions: string;
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
  /** Enables single-item drag and keyboard arranging. Defaults to false. */
  reorderable?: boolean;
  /** Removes drag handles, listeners, and keyboard reorder while true. Defaults to false. */
  reorderDisabled?: boolean;
  /** Reports a changed order; arranging is disabled when omitted. */
  onReorder?: (args: TileGridReorderArgs) => void;
  /** Receives enabled item activation from browse clicks, select double-clicks, or Enter. */
  onItemActivate?: (item: T) => void;
  /** Changing this key resets scroll to the top while retaining selection. Compared with Object.is. */
  scrollResetKey?: unknown;
  /** Enables unmodified keyboard zoom when a size callback is supplied. Defaults to false. */
  zoomable?: boolean;
  /** Reports the requested bounded tile size; the application must apply it through `tileSize`. */
  onTileSizeChange?: (size: number) => void;
}
