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

const TileGridForwardRef = React.forwardRef(TileGridBase) as <T>(
  props: TileGridProps<T> & React.RefAttributes<TileGridHandle>
) => React.ReactElement;

/**
 * Callable public wrapper around the generic forward-ref implementation.
 *
 * React 19 passes `ref` as a regular prop to function components. Keeping the
 * public export callable preserves the component-shaped import surface while
 * the inner forward-ref component owns the imperative handle.
 */
const TileGridCallable = <T,>(
  props: TileGridProps<T> & React.RefAttributes<TileGridHandle>
): React.ReactElement => {
  const { ref, ...rest } = props;

  return <TileGridForwardRef {...rest} ref={ref} />;
};

TileGridCallable.displayName = 'TileGrid';

/**
 * Displays items in a fixed, masonry, justified, or mosaic grid.
 *
 * The component owns the layout, list semantics, and optional selection. The
 * scroll container is keyboard-focusable by default; pass a native `tabIndex`
 * to override it. Use the ref handle for select-all, clear, and scroll-to-
 * selected operations.
 */
export const TileGrid = TileGridCallable;
