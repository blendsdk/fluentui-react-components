import type { ReactElement } from 'react';
import { renderTileGrid } from './renderTileGrid';
import type { TileGridProps } from './TileGrid.types';
import { useTileGrid } from './useTileGrid';

const TileGridBase = <T,>(props: TileGridProps<T>): ReactElement => {
  const state = useTileGrid(props);
  return renderTileGrid(state);
};

/**
 * Displays items in a fixed, masonry, justified, or mosaic grid.
 *
 * The component owns the layout and list semantics; callers supply the tile
 * content through `renderItem`.
 */
export const TileGrid = Object.assign(TileGridBase, { displayName: 'TileGrid' });
