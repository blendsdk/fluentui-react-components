import { memo, useId } from 'react';
import type { CSSProperties, MouseEvent, ReactElement, ReactNode, RefCallback } from 'react';
import type { TileGridItemRect } from './geometry';
import type { TileGridItemRenderArgs, TileGridSelectionMode } from './TileGrid.types';
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
}: TileGridItemViewProps<T>): ReactElement {
  const contentId = useId();
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
