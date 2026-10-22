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
    <>
      <div
        {...state.rootProps}
        ref={state.rootRef}
        role="list"
        data-tile-grid-root=""
        aria-label={labelledBy ? undefined : state.ariaLabel}
        className={mergeClasses(classes.root, state.className)}
        style={state.style}
        tabIndex={state.focus.rootTabIndex}
      >
        {state.hasItems ? (
          <>
            <div
              className={classes.spacer}
              style={{ height: state.geometry.totalHeight }}
              aria-hidden="true"
            />
            {state.visibleItemRects.map(rect => (
              <TileGridItemView
                key={rect.id}
                rect={rect}
                item={state.uniqueItems[rect.index]}
                index={rect.index}
                setSize={state.uniqueItems.length}
                tileSize={state.tileSize}
                selected={state.isSelected(rect.id)}
                selectable={state.selectionMode !== 'none' && state.isSelectable(rect.id)}
                disabled={state.isDisabled(rect.id)}
                label={state.getItemLabel(state.uniqueItems[rect.index])}
                renderItem={state.renderItem}
                className={classes.item}
                selectionMode={state.selectionMode}
                radioName={state.radioName}
                controlClassName={classes.control}
                contentClassName={classes.content}
                itemRef={state.focus.getItemRef(rect.id)}
                tabIndex={state.focus.activeId === rect.id ? 0 : -1}
                controlTabIndex={state.focus.entered && state.focus.activeId === rect.id ? 0 : -1}
              />
            ))}
          </>
        ) : (
          <div role="listitem" data-tile-grid-empty="" className={classes.emptyItem}>
            {state.renderEmpty ? (
              state.renderEmpty()
            ) : (
              <div className={classes.empty}>{state.emptyMessage}</div>
            )}
          </div>
        )}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className={classes.status}>
        {state.selectionAnnouncement}
      </div>
    </>
  );
}
