import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type {
  TileGridAction,
  TileGridDragHandleProps,
  TileGridStrings,
} from '../TileGrid/TileGrid.types';

/**
 * Props for the optional TileGrid item shell.
 *
 * The shell renders application content and actions inside the positioned
 * wrapper owned by TileGrid. It never selects, activates, drags, or reorders
 * on its own; those decisions stay with the grid and the application.
 *
 * Native `div` attributes pass through to the shell root. `children` is not a
 * content channel (slots are), `aria-disabled` is owned by `disabled` so a
 * caller cannot claim an enabled state the grid has disabled, and the native
 * `title` attribute is replaced by the `title` slot.
 */
export interface TileGridItemProps<T> extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'aria-disabled' | 'title'
> {
  /** Original item passed to action callbacks and predicates. */
  item: T;
  /** Media node, typically an `<img>`, `<video>`, or Fluent `Image`. */
  media?: ReactNode;
  /** Primary text. */
  title?: ReactNode;
  /** Secondary text. */
  description?: ReactNode;
  /** Badge row rendered below the description. */
  badges?: ReactNode;
  /** Actions shown inline and duplicated in the overflow menu. */
  actions?: readonly TileGridAction<T>[];
  /** Menu-only actions. */
  overflowActions?: readonly TileGridAction<T>[];
  /** Replaces the default visual selection indicator. */
  selectionIndicator?: ReactNode;
  /** Overlay rendered above media. */
  statusOverlay?: ReactNode;
  /** Replaces the default drag handle. */
  dragHandle?: (props: TileGridDragHandleProps) => ReactNode;
  /** Library-owned handle wiring; absent when arranging is unavailable. */
  dragHandleProps?: TileGridDragHandleProps;
  /** Move up and Move down actions supplied by the grid. */
  reorderActions?: readonly TileGridAction<T>[];
  /** Localized strings; partial over English defaults. */
  strings?: Partial<TileGridStrings>;
  /** Visual selection state. */
  selected?: boolean;
  /** Hides the visual selection affordance when false. Defaults to true. */
  selectable?: boolean;
  /** Disables actions and the drag handle. Defaults to false. */
  disabled?: boolean;
  /** Marks the source tile while it is being dragged. */
  isDragging?: boolean;
  /** Marks the portal copy of a dragged tile. */
  isOverlay?: boolean;
  /** Media fit inside its aspect-ratio box. Defaults to cover. */
  fit?: 'cover' | 'contain';
  /** Media aspect ratio; invalid values fall back to 1. */
  aspectRatio?: number;
}
