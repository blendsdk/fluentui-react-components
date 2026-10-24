import { mergeClasses } from '@fluentui/react-components';
import { DndContext, useDroppable } from '@dnd-kit/core';
import type { CollisionDetection } from '@dnd-kit/core';
import { useCallback, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { TILE_GRID_DROPPABLE_ID, TileGridDragOverlay, TileGridDropIndicator } from './reorder';
import type { TileGridState } from './useTileGrid';
import { TileGridItemView } from './TileGridItemView';

/**
 * Renders the scroll container and registers its single droppable.
 *
 * This component must live inside `DndContext`; a droppable hook called in the
 * state hook above the provider would never see the drag manager. It merges the
 * scroll-container ref with the droppable node.
 */
function TileGridRoot<T>({ state }: { state: TileGridState<T> }): ReactElement {
  const { classes } = state;
  const labelledBy = state.rootProps['aria-labelledby'];
  const { setNodeRef } = useDroppable({
    id: TILE_GRID_DROPPABLE_ID,
    disabled: !state.reorder.enabled,
  });

  const droppableRef = useRef(setNodeRef);
  droppableRef.current = setNodeRef;

  // Keep this callback stable: a new identity would detach and reattach the
  // scroll container on every drag render, briefly resetting its measurement
  // and collapsing the virtual window.
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      state.rootRef.current = node;
      droppableRef.current(node);
    },
    [state.rootRef]
  );

  return (
    <div
      {...state.rootProps}
      ref={setRootRef}
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
              reorderEnabled={state.reorder.enabled}
              activeId={state.reorder.activeId}
              strings={state.strings}
              getReorderActions={state.reorder.getReorderActions}
            />
          ))}
          <div
            className={classes.dropIndicatorCanvas}
            style={{ height: state.geometry.totalHeight }}
          >
            <TileGridDropIndicator
              insertion={state.reorder.insertion}
              layout={state.layout}
              gap={state.gap}
              itemCount={state.uniqueItems.length}
              className={classes.dropIndicator}
            />
          </div>
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
      {state.marqueeRect && (
        <div
          aria-hidden="true"
          className={classes.marqueeCanvas}
          style={{ height: state.geometry.totalHeight }}
        >
          <div
            data-tile-grid-marquee=""
            aria-hidden="true"
            className={classes.marquee}
            style={{
              left: state.marqueeRect.x,
              top: state.marqueeRect.y,
              width: state.marqueeRect.width,
              height: state.marqueeRect.height,
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Builds the presentational tile arguments for the portal copy. */
function renderOverlay<T>(state: TileGridState<T>): ReactNode {
  const id = state.reorder.activeId;
  const item = state.reorder.activeItem;
  const index = state.reorder.activeIndex;
  const rect = state.reorder.overlayRect;

  if (!id || item === undefined || index === undefined || !rect) return null;

  return state.renderItem({
    item,
    index,
    tileSize: state.tileSize,
    width: rect.width,
    height: rect.height,
    selected: state.isSelected(id),
    selectable: state.selectionMode !== 'none' && state.isSelectable(id),
    disabled: state.isDisabled(id),
    isDragging: true,
    isOverlay: true,
    dragHandleProps: undefined,
    reorderActions: undefined,
    strings: state.strings,
  });
}

/**
 * Keeps dnd-kit's built-in live region inert and out of the accessibility tree.
 *
 * The grid owns one polite region for selection and reorder news, so dnd-kit's
 * assertive drag announcements must not compete with it. The region is portaled
 * into a hidden container and every message is blank.
 */
const silentAnnouncements = {
  onDragStart: () => '',
  onDragOver: () => '',
  onDragEnd: () => '',
  onDragCancel: () => '',
};

/** Stable inert collision detector used while arranging is disabled. */
const NO_COLLISION: CollisionDetection = () => [];

/**
 * Drag context plus the hidden container that neutralizes dnd-kit announcements.
 *
 * The provider and the scroll container stay mounted across enable/disable
 * transitions. A different component type at the same tree position would
 * remount the scroll container, reset its measurement, scroll, and focus, and
 * leave the size observer watching a detached node.
 */
function TileGridReorderSurface<T>({ state }: { state: TileGridState<T> }): ReactElement {
  // A detached node keeps dnd-kit's inert live region out of the document, so
  // it cannot compete with the grid's polite region or appear in role queries.
  const [announcementContainer] = useState<HTMLDivElement | null>(() =>
    typeof document === 'undefined' ? null : document.createElement('div')
  );
  const enabled = state.reorder.enabled;

  return (
    <>
      <DndContext
        sensors={state.reorder.sensors}
        collisionDetection={enabled ? state.reorder.collisionDetection : NO_COLLISION}
        autoScroll={false}
        accessibility={{
          container: announcementContainer ?? undefined,
          announcements: silentAnnouncements,
        }}
        onDragStart={state.reorder.onDragStart}
        onDragMove={state.reorder.onDragMove}
        onDragEnd={state.reorder.onDragEnd}
        onDragCancel={state.reorder.onDragCancel}
      >
        <TileGridRoot state={state} />
        {enabled && (
          <TileGridDragOverlay
            rect={state.reorder.overlayRect}
            offset={state.reorder.overlayOffset}
          >
            {renderOverlay(state)}
          </TileGridDragOverlay>
        )}
      </DndContext>
    </>
  );
}

/**
 * Renders the TileGrid list, its items, or the empty state.
 *
 * The renderer receives a fully resolved state object and renders the item
 * rectangles supplied by that state. The drag provider stays mounted so the
 * scroll container keeps its identity when arranging is toggled; the shared
 * live region stays outside the provider.
 */
export function renderTileGrid<T>(state: TileGridState<T>): ReactElement {
  return (
    <>
      <TileGridReorderSurface state={state} />
      <div role="status" aria-live="polite" aria-atomic="true" className={state.classes.status}>
        {state.announcement}
      </div>
    </>
  );
}
