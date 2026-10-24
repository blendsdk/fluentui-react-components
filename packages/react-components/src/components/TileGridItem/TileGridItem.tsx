import * as React from 'react';
import { renderTileGridItem } from './renderTileGridItem';
import type { TileGridItemProps } from './TileGridItem.types';
import { useTileGridItem } from './useTileGridItem';

const TileGridItemBase = <T,>(props: TileGridItemProps<T>, ref: React.Ref<HTMLDivElement>) => {
  const state = useTileGridItem(props);

  return renderTileGridItem(state, ref);
};

TileGridItemBase.displayName = 'TileGridItem';

const TileGridItemForwardRef = React.forwardRef(TileGridItemBase) as <T>(
  props: TileGridItemProps<T> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement;

/**
 * Callable public wrapper around the generic forward-ref implementation.
 *
 * React 19 passes `ref` as a regular prop to function components. Keeping the
 * public export callable preserves the component-shaped import surface while
 * the inner forward-ref component owns the root ref.
 */
const TileGridItemCallable = <T,>(
  props: TileGridItemProps<T> & React.RefAttributes<HTMLDivElement>
): React.ReactElement => {
  const { ref, ...rest } = props;

  return <TileGridItemForwardRef {...rest} ref={ref} />;
};

TileGridItemCallable.displayName = 'TileGridItem';

/**
 * Renders an optional tile shell inside a TileGrid item.
 *
 * The shell lays out media, text, badges, actions, a selection indicator, a
 * status overlay, and the drag handle. It is presentation-only: the grid owns
 * selection, activation, focus, and arranging, and the application owns the
 * item data, actions, image URLs, and preview surface.
 *
 * @example
 * ```tsx
 * <TileGridItem
 *   item={photo}
 *   media={<img src={photo.thumbnailUrl} alt="" loading="lazy" />}
 *   title={photo.name}
 *   actions={[{ id: 'open', label: 'Open', onSelect: openPhoto }]}
 *   dragHandleProps={dragHandleProps}
 * />
 * ```
 */
export const TileGridItem = TileGridItemCallable;
