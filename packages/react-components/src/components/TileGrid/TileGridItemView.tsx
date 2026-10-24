import { memo, useId, useMemo } from 'react';
import type {
  CSSProperties,
  MouseEvent,
  ReactElement,
  ReactNode,
  RefCallback,
  SyntheticEvent,
} from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import type { TileGridItemRect } from './geometry';
import type {
  TileGridAction,
  TileGridDragHandleProps,
  TileGridItemRenderArgs,
  TileGridSelectionMode,
  TileGridStrings,
} from './TileGrid.types';
import { defaultTileGridStrings } from './strings';
import { TileGridSelectionControl } from './TileGridSelectionControl';

/** Props for the internal memoized tile wrapper. */
export interface TileGridItemViewProps<T> {
  /** Computed position and size. */
  rect: TileGridItemRect;
  /** Original item. */
  item: T;
  /** Zero-based normalized index. */
  index: number;
  /** Number of normalized items, used for `aria-setsize`. */
  setSize: number;
  /** Resolved tile size forwarded to the renderer. */
  tileSize: number;
  /** Whether the item is selected. */
  selected: boolean;
  /** Whether the item may be selected. */
  selectable: boolean;
  /** Whether the item is disabled. */
  disabled: boolean;
  /** Accessible item label. */
  label: string;
  /** Application tile-content renderer. */
  renderItem: (args: TileGridItemRenderArgs<T>) => ReactNode;
  /** Optional selection click handler supplied by the parent. */
  onItemClick?: (event: MouseEvent<HTMLElement>, id: string) => void;
  /** Wrapper class from the grid styles. */
  className?: string;
  /** Mounted selection mode; standalone internal views default to no control. */
  selectionMode?: TileGridSelectionMode;
  /** Shared unique name for this grid's owned radios. */
  radioName?: string;
  /** Token-based placement of the owned selection overlay. */
  controlClassName?: string;
  /** Full rectangle layout for application content. */
  contentClassName?: string;
  /** Stable registration callback for this mounted wrapper. */
  itemRef?: RefCallback<HTMLDivElement>;
  /** The active wrapper is the only outside entry stop. */
  tabIndex?: 0 | -1;
  /** Enables the owned input only while its active tile holds inline focus. */
  controlTabIndex?: 0 | -1;
  /** Whether arranging is enabled for the grid. */
  reorderEnabled?: boolean;
  /** Active drag source ID, used for the source tile's reduced state. */
  activeId?: string;
  /** Fully resolved strings for handle names and content. */
  strings?: TileGridStrings;
  /** Returns the keyboard reorder actions for an item index. */
  getReorderActions?: (index: number) => readonly TileGridAction<T>[] | undefined;
}

/** Keeps control and focus updates from invoking unchanged application content. */
function TileGridContentComponent<T>({
  renderItem,
  ...args
}: TileGridItemRenderArgs<T> & {
  /** Stable application renderer. */
  renderItem: (args: TileGridItemRenderArgs<T>) => ReactNode;
}): ReactNode {
  return renderItem(args);
}

const TileGridContent = memo(TileGridContentComponent) as typeof TileGridContentComponent;

/**
 * Copies dnd-kit handle attributes without its keyboard-drag instructions.
 *
 * Keyboard reorder uses the action menu, so describing a keyboard drag gesture
 * on the handle would promise behavior this component does not implement.
 */
function handleAttributes(
  attributes: DraggableAttributes
): Record<string, string | number | boolean | undefined> {
  const next: Record<string, string | number | boolean | undefined> = { ...attributes };
  delete next['aria-describedby'];
  // A pointer-only handle is not a pressed toggle, and keyboard reorder lives
  // in the action menu. Removing dnd-kit's tab stop and pressed state lets the
  // default shell choose its own focus policy without claiming a keyboard drag.
  delete next['tabIndex'];
  delete next['aria-pressed'];
  return next;
}

/** Normalizes dnd-kit listener maps to the public handle contract. */
function handleListeners(
  listeners: DraggableSyntheticListeners
): Record<string, (event: SyntheticEvent) => void> {
  const next: Record<string, (event: SyntheticEvent) => void> = {};

  for (const key of Object.keys(listeners ?? {})) {
    const listener = listeners?.[key];
    if (typeof listener === 'function') {
      next[key] = event => listener(event);
    }
  }

  return next;
}

/** Positions a labelled tile while keeping input and content lifecycles independent. */
function TileGridItemViewComponent<T>({
  rect,
  item,
  index,
  setSize,
  tileSize,
  selected,
  selectable,
  disabled,
  label,
  renderItem,
  onItemClick,
  className,
  selectionMode = 'none',
  radioName,
  controlClassName,
  contentClassName,
  itemRef,
  tabIndex = -1,
  controlTabIndex = -1,
  reorderEnabled = false,
  activeId,
  strings = defaultTileGridStrings,
  getReorderActions,
}: TileGridItemViewProps<T>): ReactElement {
  const contentId = useId();
  const canReorder = reorderEnabled && !disabled;
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: rect.id,
    disabled: !canReorder,
  });
  const dragging = reorderEnabled && activeId === rect.id;
  const dragHandleProps = useMemo<TileGridDragHandleProps | undefined>(
    () =>
      canReorder
        ? {
            setNodeRef,
            attributes: handleAttributes(attributes),
            listeners: handleListeners(listeners),
            isDragging: dragging,
            disabled: false,
            label: strings.dragHandleLabel(label).trim() || `Reorder ${label}`,
          }
        : undefined,
    [attributes, canReorder, dragging, label, listeners, setNodeRef, strings.dragHandleLabel]
  );
  const reorderActions = canReorder ? getReorderActions?.(index) : undefined;
  const position: CSSProperties = {
    top: rect.y,
    left: rect.x,
    width: rect.width,
    height: rect.height,
  };

  return (
    <div
      role="listitem"
      ref={itemRef}
      tabIndex={tabIndex}
      aria-setsize={setSize}
      aria-posinset={index + 1}
      aria-label={label}
      aria-describedby={contentId}
      aria-disabled={disabled || undefined}
      data-tile-grid-item={rect.id}
      data-index={index}
      data-dragging={dragging ? 'true' : undefined}
      className={className}
      style={position}
      onClick={onItemClick ? event => onItemClick(event, rect.id) : undefined}
    >
      {selectable && selectionMode !== 'none' && (
        <TileGridSelectionControl
          mode={selectionMode}
          checked={selected}
          label={label}
          name={radioName}
          className={controlClassName}
          tabIndex={controlTabIndex}
        />
      )}
      <div id={contentId} data-tile-grid-content="" className={contentClassName}>
        <TileGridContent
          item={item}
          index={index}
          tileSize={tileSize}
          width={rect.width}
          height={rect.height}
          selected={selected}
          selectable={selectable}
          disabled={disabled}
          isDragging={dragging}
          isOverlay={false}
          dragHandleProps={dragHandleProps}
          reorderActions={reorderActions}
          strings={strings}
          renderItem={renderItem}
        />
      </div>
    </div>
  );
}

/**
 * Memoized tile wrapper.
 *
 * The generic call signature is restored after `memo` because React's memo
 * wrapper does not preserve generic component types.
 */
export const TileGridItemView = memo(TileGridItemViewComponent) as typeof TileGridItemViewComponent;
