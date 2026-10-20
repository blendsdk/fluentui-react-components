import { mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { TileGridState } from './useTileGrid';
import { TileGridItemView } from './TileGridItemView';

/**
 * Renders the TileGrid list, its items, or the empty state.
 *
 * The renderer receives a fully resolved state object and renders the item
 * rectangles supplied by that state.
 */
export function renderTileGrid<T>(state: TileGridState<T>): ReactElement {
  const { classes } = state;
  const labelledBy = state.rootProps['aria-labelledby'];

  return (
    <div
      {...state.rootProps}
      ref={state.rootRef}
      role="list"
      aria-label={labelledBy ? undefined : state.ariaLabel}
      className={mergeClasses(classes.root, state.className)}
      style={state.style}
    >
      {state.hasItems ? (
        <>
          <div
            className={classes.spacer}
            style={{ height: state.geometry.totalHeight }}
            aria-hidden="true"
          />
          {state.geometry.itemRects.map(rect => (
            <TileGridItemView
              key={rect.id}
              rect={rect}
              item={state.uniqueItems[rect.index]}
              index={rect.index}
              setSize={state.uniqueItems.length}
              tileSize={state.tileSize}
              selected={false}
              selectable
              disabled={false}
              label={state.getItemLabel(state.uniqueItems[rect.index])}
              renderItem={state.renderItem}
              className={classes.item}
            />
          ))}
        </>
      ) : state.renderEmpty ? (
        state.renderEmpty()
      ) : (
        <div className={classes.empty}>{state.emptyMessage}</div>
      )}
    </div>
  );
}
