import type { TileGridSelectionMode } from '../TileGrid.types';

/** Internal alias for the public selection mode. */
export type GridSelectionMode = TileGridSelectionMode;

/** Options accepted by the internal selection store. */
export interface GridSelectionOptions {
  /** Selection behaviour for the grid. */
  mode: GridSelectionMode;
  /** Controlled selected IDs; when present they are the source of truth. */
  selectedIds?: ReadonlySet<string>;
  /** Uncontrolled initial IDs, used only when `selectedIds` is absent. */
  defaultSelectedIds?: Iterable<string>;
  /** Called once with the requested next set after a changing action. */
  onSelectionChange?: (next: ReadonlySet<string>) => void;
  /** Whether an ID may be added by a selection action. */
  isSelectable?: (id: string) => boolean;
}

/**
 * State and actions returned by the internal selection store.
 *
 * The application sees the same behaviour through the public selection props
 * and the TileGrid handle; this interface is for the component internals.
 */
export interface GridSelection {
  /** Selection mode fixed for this mounted store. */
  mode: GridSelectionMode;
  /** Effective selected IDs, including hidden IDs. */
  selectedIds: ReadonlySet<string>;
  /** Current range anchor, or undefined when no anchor is set. */
  anchorId: string | undefined;
  /** Returns true when the effective set contains the ID. */
  isSelected(id: string): boolean;
  /** Selects an ID according to the current mode. */
  select(id: string): void;
  /** Replaces the selection with an ID according to the current mode. */
  selectOnly(id: string): void;
  /** Removes an ID from the selection. */
  deselect(id: string): void;
  /** Toggles an ID according to the current mode. */
  toggle(id: string): void;
  /** Selects the anchor-to-target range in current item order. */
  selectRange(targetId: string, currentIds: readonly string[]): void;
  /** Selects every selectable current item in multiselect mode. */
  selectAll(currentIds: readonly string[]): void;
  /** Clears every selected ID and the anchor. */
  clear(): void;
  /** Commits a complete gesture result without changing the range anchor. */
  replaceSelection(next: ReadonlySet<string>): void;
}
