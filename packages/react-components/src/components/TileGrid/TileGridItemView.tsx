import { memo } from 'react';
import type { CSSProperties, MouseEvent, ReactElement, ReactNode } from 'react';
import type { TileGridItemRect } from './geometry';
import type { TileGridItemRenderArgs } from './TileGrid.types';

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
}

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
}: TileGridItemViewProps<T>): ReactElement {
  const position: CSSProperties = {
    top: rect.y,
    left: rect.x,
    width: rect.width,
    height: rect.height,
  };

  return (
    <div
      role="listitem"
      aria-setsize={setSize}
      aria-posinset={index + 1}
      aria-label={label}
      data-tile-grid-item={rect.id}
      data-index={index}
      className={className}
      style={position}
      onClick={onItemClick ? event => onItemClick(event, rect.id) : undefined}
    >
      {renderItem({
        item,
        index,
        tileSize,
        width: rect.width,
        height: rect.height,
        selected,
        selectable,
        disabled,
      })}
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
