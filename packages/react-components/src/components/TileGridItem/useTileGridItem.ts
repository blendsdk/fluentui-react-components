import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import type {
  TileGridAction,
  TileGridDragHandleProps,
  TileGridStrings,
} from '../TileGrid/TileGrid.types';
import { resolveTileGridStrings } from '../TileGrid/strings';
import type { TileGridItemProps } from './TileGridItem.types';
import { useTileGridItemStyles } from './useTileGridItemStyles.styles';
import type { TileGridItemClasses } from './useTileGridItemStyles.styles';

/** Native attributes that pass through to the shell root. */
type TileGridItemRootProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'aria-disabled' | 'title' | 'className' | 'style'
>;

/** Resolved visual and behavioural values used by the renderer. */
export interface TileGridItemResolvedState {
  /** Resolved media aspect ratio. */
  aspectRatio: number;
  /** Resolved media fit. */
  fit: 'cover' | 'contain';
  /** Whether the tile is visually selected. */
  selected: boolean;
  /** Whether the visual selection affordance is allowed. */
  selectable: boolean;
  /** Whether the shell suppresses actions and the handle. */
  disabled: boolean;
  /** Whether this is the source tile of a drag. */
  isDragging: boolean;
  /** Whether this is the portal copy of a dragged tile. */
  isOverlay: boolean;
}

/** Render-ready state for one tile shell. */
export interface TileGridItemState<T> {
  /** Original item passed to action callbacks. */
  item: T;
  /** Native root attributes, without the shell-owned props. */
  rootProps: TileGridItemRootProps;
  /** Caller class names, merged after the shell classes. */
  className?: string;
  /** Caller inline styles, applied after the shell classes. */
  style?: CSSProperties;
  /** Resolved Griffel classes. */
  classes: TileGridItemClasses;
  /** Fully resolved strings. */
  strings: TileGridStrings;
  /** Resolved visual and behavioural state. */
  resolved: TileGridItemResolvedState;
  /** Media slot. */
  media?: ReactNode;
  /** Title slot. */
  title?: ReactNode;
  /** Description slot. */
  description?: ReactNode;
  /** Badge slot. */
  badges?: ReactNode;
  /** Custom selection indicator slot. */
  selectionIndicator?: ReactNode;
  /** Status overlay slot. */
  statusOverlay?: ReactNode;
  /** Custom drag-handle renderer. */
  dragHandle?: (props: TileGridDragHandleProps) => ReactNode;
  /** Handle wiring when the handle may render. */
  handleProps?: TileGridDragHandleProps;
  /** Actions rendered inline and repeated in the menu. */
  inlineActions: readonly TileGridAction<T>[];
  /** Complete menu order. */
  menuActions: readonly TileGridAction<T>[];
  /** Whether the overflow trigger renders. */
  showMenu: boolean;
  /** Whether the drag handle renders. */
  showHandle: boolean;
  /** Whether the selection indicator renders. */
  showSelection: boolean;
  /** Accessible name for the overflow trigger. */
  moreActionsLabel: string;
  /** Returns the visible label, falling back to the action id. */
  labelFor(action: TileGridAction<T>): string;
  /** Returns the visual intent, defaulting to the normal surface. */
  intentFor(action: TileGridAction<T>): 'default' | 'danger';
  /** Returns the per-item disabled state. */
  isActionDisabled(action: TileGridAction<T>): boolean;
}

/**
 * Resolves the shell's visual state, action lists, and string defaults.
 *
 * The hook is presentation-only. It keeps the original `item` for callbacks
 * and never reads or mutates selection, focus, or drag state.
 */
export function useTileGridItem<T>(props: TileGridItemProps<T>): TileGridItemState<T> {
  const {
    item,
    media,
    title,
    description,
    badges,
    actions,
    overflowActions,
    selectionIndicator,
    statusOverlay,
    dragHandle,
    dragHandleProps,
    reorderActions,
    strings,
    selected = false,
    selectable = true,
    disabled = false,
    isDragging = false,
    isOverlay = false,
    fit = 'cover',
    aspectRatio,
    className,
    style,
    ...rootProps
  } = props;

  const classes = useTileGridItemStyles();
  const resolvedStrings = resolveTileGridStrings(strings);
  const resolvedAspectRatio =
    typeof aspectRatio === 'number' && Number.isFinite(aspectRatio) && aspectRatio > 0
      ? aspectRatio
      : 1;
  const resolvedFit: 'cover' | 'contain' = fit === 'contain' ? 'contain' : 'cover';
  const canAct = !disabled && !isOverlay;
  const inlineActions: readonly TileGridAction<T>[] = canAct ? (actions ?? []) : [];
  const menuActions: readonly TileGridAction<T>[] = canAct
    ? [...(actions ?? []), ...(overflowActions ?? []), ...(reorderActions ?? [])]
    : [];
  const showMenu = menuActions.length > 0;
  const showHandle = canAct && dragHandleProps !== undefined;
  const showSelection = selected && selectable;

  const labelFor = (action: TileGridAction<T>): string => {
    const label = action.label.trim();
    return label ? action.label : action.id;
  };

  const intentFor = (action: TileGridAction<T>): 'default' | 'danger' =>
    action.intent === 'danger' ? 'danger' : 'default';

  const isActionDisabled = (action: TileGridAction<T>): boolean =>
    disabled || (action.isDisabled?.(item) ?? false);

  return {
    item,
    rootProps,
    className,
    style,
    classes,
    strings: resolvedStrings,
    resolved: {
      aspectRatio: resolvedAspectRatio,
      fit: resolvedFit,
      selected,
      selectable,
      disabled,
      isDragging,
      isOverlay,
    },
    media,
    title,
    description,
    badges,
    selectionIndicator,
    statusOverlay,
    dragHandle,
    handleProps: showHandle ? dragHandleProps : undefined,
    inlineActions,
    menuActions,
    showMenu,
    showHandle,
    showSelection,
    moreActionsLabel: resolvedStrings.moreActions.trim() || 'More actions',
    labelFor,
    intentFor,
    isActionDisabled,
  };
}
