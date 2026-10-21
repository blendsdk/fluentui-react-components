import * as React from 'react';
import { renderTileGrid } from './renderTileGrid';
import type { TileGridHandle, TileGridProps } from './TileGrid.types';
import { useTileGrid } from './useTileGrid';

const TileGridBase = <T,>(props: TileGridProps<T>, ref: React.Ref<TileGridHandle>) => {
  const state = useTileGrid(props);

  React.useImperativeHandle(
    ref,
    () => ({
      selectAll: state.selectAll,
      clearSelection: state.clearSelection,
      scrollToSelected: state.scrollToSelected,
    }),
    [state.selectAll, state.clearSelection, state.scrollToSelected]
  );

  return renderTileGrid(state);
};

TileGridBase.displayName = 'TileGrid';

/**
 * Displays items in a fixed, masonry, justified, or mosaic grid.
 *
 * The component owns the layout, list semantics, and optional selection. The
 * scroll container is keyboard-focusable by default; pass a native `tabIndex`
 * to override it. Use the ref handle for select-all, clear, and scroll-to-
 * selected operations.
 */
export const TileGrid = React.forwardRef(TileGridBase) as <T>(
  props: TileGridProps<T> & React.RefAttributes<TileGridHandle>
) => React.ReactElement;
