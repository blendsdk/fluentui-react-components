# Reorder Layer: TileGrid RD-04

> **Document**: 03-01-reorder-layer.md
> **Parent**: [Index](00-index.md)

## Overview

The reorder layer adds optional single-item arranging to TileGrid. It owns the drag context, the
insertion calculation, the drag overlay, the drop indicator, auto-scroll, the keyboard reorder
actions, and the reorder announcement. It does not own item order: the application receives
`onReorder` and applies `orderedIds` to its own state.

## Architecture

### Current Architecture

TileGrid renders mounted rectangles from `computeGeometry`, delegates clicks through the root, and
keeps selection, focus, and marquee state in dedicated modules. The only live region is the
selection announcement in `renderTileGrid`.

### Proposed Changes

```text
useTileGrid
├── useLiveAnnouncement            (new, shared message channel)
├── useSelectionAnnouncement       (existing behavior, writes to the channel)
├── useTileGridReorder             (new controller)
│   ├── useSensors(PointerSensor)  (4px activation distance)
│   ├── useAutoScroll              (proportional RAF scrolling)
│   └── insertion.ts / payload.ts  (pure helpers)
├── useTileGridFocus               (unchanged)
├── useGridSelection               (unchanged)
└── useTileGridMarquee             (unchanged)

renderTileGrid
├── DndContext                     (always mounted; inert when arranging is off)
│   └── TileGridRoot               (local component; calls useDroppable)
└── TileGridDragOverlay            (custom body portal while a drag is active)
```

`TileGridRoot` must be a component rendered inside `DndContext` (AR-34); a hook called in
`useTileGrid` would sit above the provider and never see the drag manager. It owns the root ref
merge for the scroll container and the single droppable. `TileGridItemView` calls `useDraggable`
for its tile and exposes the handle props and reorder actions to `renderItem`.

`DndContext` stays mounted across enable/disable transitions. The pointer sensor stays registered
with a stable descriptor; with arranging off it is inert, the droppable is disabled, item views
expose no handle or reorder action, and no overlay is rendered. Keeping the provider and sensor
array in the tree preserves both the scroll container's identity and dnd-kit's hook shape; swapping
the provider for a bare root would remount the container, reset its measurement, scroll, and focus,
and leave the size observer watching a detached node.

## Public Contract Additions

All additions live in `TileGrid.types.ts` unless stated otherwise.

```ts
/** Result reported after a drag drop or keyboard move changes the order. */
export interface TileGridReorderArgs {
  /** ID of the moved item. */
  itemId: string;
  /** Index before the move in the current normalized item list. */
  fromIndex: number;
  /** Final index after the move. */
  toIndex: number;
  /** Complete ID order for the current items array. */
  orderedIds: readonly string[];
}

/** Library-owned drag handle state passed to the default or custom handle. */
export interface TileGridDragHandleProps {
  /** Attaches the drag sensor to the handle node. */
  setNodeRef: (node: HTMLElement | null) => void;
  /** dnd-kit handle attributes, with unsupported keyboard instructions removed. */
  attributes: Record<string, string | number | boolean | undefined>;
  /** dnd-kit pointer listeners. */
  listeners: Record<string, (event: React.SyntheticEvent) => void>;
  /** Whether the tile is the active drag source. */
  isDragging: boolean;
  /** Whether arranging is unavailable for this tile. */
  disabled: boolean;
  /** Accessible name, defaulting to "Reorder <item label>". */
  label: string;
}

/** Application-supplied tile action. */
export interface TileGridAction<T> {
  /** Stable action identity. */
  id: string;
  /** Visible and accessible label; a blank label falls back to `id`. */
  label: string;
  /** Optional inline icon. */
  icon?: React.ReactNode;
  /** Visual intent; defaults to `default`. */
  intent?: 'default' | 'danger';
  /** Runs once when the action is chosen. */
  onSelect: (item: T) => void;
  /** Per-item disabled state. */
  isDisabled?: (item: T) => boolean;
}
```

`TileGridProps<T>` adds:

```ts
/** Enables single-item drag and keyboard arranging. Defaults to false. */
reorderable?: boolean;
/** Removes drag handles, listeners, and keyboard reorder while true. Defaults to false. */
reorderDisabled?: boolean;
/** Reports a changed order; arranging is disabled when omitted. */
onReorder?: (args: TileGridReorderArgs) => void;
```

`TileGridItemRenderArgs<T>` adds:

```ts
/** Whether this tile is the active drag source. */
isDragging: boolean;
/** Whether this content is the portal overlay copy. */
isOverlay: boolean;
/** Handle wiring, absent when arranging is unavailable. */
dragHandleProps?: TileGridDragHandleProps;
/** Move up / Move down actions, absent when arranging is unavailable. */
reorderActions?: readonly TileGridAction<T>[];
/** Fully resolved strings, including the new reorder strings. */
strings: TileGridStrings;
```

`TileGridStrings` adds:

```ts
/** Formats the handle name; defaults to `Reorder ${itemLabel}`. */
dragHandleLabel: (itemLabel: string) => string;
/** Keyboard move-up label; defaults to "Move up". */
moveUp: string;
/** Keyboard move-down label; defaults to "Move down". */
moveDown: string;
/** Formats the new position; defaults to `Moved to position ${position} of ${total}`. */
reorderPosition: (position: number, total: number) => string;
/** Accessible overflow trigger name; defaults to "More actions". */
moreActions: string;
```

## Reorder Lifecycle

### Enablement

```ts
const enabled = reorderable === true && reorderDisabled !== true && onReorder !== undefined;
```

When `reorderable` is true and `onReorder` is missing, the state hook calls
`devWarn('tilegrid-reorder-callback', ...)` once. Arranging renders no handle, listeners, overlay,
indicator, or reorder actions. When `reorderDisabled` is true, the same absence applies without a
warning. A disabled item (`isDisabled(item)`) gets no handle and no reorder actions even when the
grid is enabled.

### Drag start, move, drop, cancel

| Event             | Behavior                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start             | Stores `activeId` and the tile's viewport rectangle; clears the insertion. The source tile receives `isDragging`.                                                          |
| Move              | Derives the pointer position from the activator event plus `delta`; recomputes the insertion from the current mounted rectangles and scroll offset; updates the indicator. |
| Drop              | Converts the insertion boundary to a final index; calls `onReorder` once when the index changed; announces the new position; clears the drag state.                        |
| Cancel            | Clears the drag state and fires no callback. Escape and `pointercancel` arrive through dnd-kit's pointer sensor.                                                           |
| Late capture loss | A `lostpointercapture` after a committed `pointerup` does not cancel; the browser test pins the ordering.                                                                  |

The drag state is cleared in a `finally` block so a throwing application callback cannot leave the
grid stuck in a drag.

### Insertion calculation

`findInsertion` is pure and receives content coordinates, the mounted rectangles, the layout, the
gap, and the item count.

1. Convert the pointer from viewport to content coordinates with the root rectangle and scroll
   offset.
2. Find the rectangle with the smallest squared distance to the pointer, using the clamped point on
   each rectangle; ties choose the lower index.
3. Choose `before` or `after`: for `masonry`, compare `pointer.y` with the rectangle's vertical
   center; for `fixed`, `justified`, and `mosaic`, compare `pointer.x` with the horizontal center.
4. Set `boundary = rect.index + (edge === 'after' ? 1 : 0)` and clamp to `0..itemCount`.
5. Convert the boundary to a final index: `fromIndex < boundary ? boundary - 1 : boundary`, clamped
   to `0..itemCount - 1`.

The lookup is bounded by the mounted window, which always covers the viewport. The window includes
the collection end when the grid is scrolled to the bottom, so the end boundary remains reachable.

### Collision detection

`TileGridRoot` registers one droppable on the scroll container. The custom `collisionDetection`
function:

1. returns no collision when the root or pointer is missing;
2. runs the insertion calculation above;
3. stores the result in a ref for the move/drop handlers;
4. returns the root droppable as the collision.

The root droppable lets dnd-kit maintain a live `over` target without registering one droppable per
mounted tile. No `getBoundingClientRect` is called per item.

### Auto-scroll

`useAutoScroll` runs a `requestAnimationFrame` loop while a drag is active. It reads the root
rectangle once per pointer move and caches it.

- The active zone is 24px from the top or bottom edge of the scroll container.
- Speed is linear: 4 px/frame at the 24px boundary, 18 px/frame at the edge, clamped to
  `0..18`. No horizontal scrolling is performed.
- Each frame updates `scrollTop` and recomputes the insertion from the last pointer position, so
  the indicator follows content that scrolls under a stationary pointer.
- The loop stops at drop, cancel, when the pointer leaves the zone, or on unmount.
- dnd-kit's own `autoScroll` is disabled to avoid double scrolling.

### Overlay

A custom body portal renders the presentational copy of the active tile:

- On drag start, the controller derives the tile's viewport rectangle once from the active item's
  geometry rectangle, the root's client origin, and the current scroll offset, then stores it with
  the active item. No per-item DOM measurement is needed.
- On drag move, the portal is positioned at `start rectangle + delta`; its width and height stay
  the tile's size, so it follows the pointer without resizing.
- It renders through `createPortal` into `document.body`, uses `position: fixed`,
  `pointer-events: none`, a high z-index, and `aria-hidden="true"` so the copy does not duplicate
  list semantics. No `window` access happens during server rendering because the portal only exists
  during a client drag.
- The copy receives `isOverlay: true`, `isDragging: true`, `dragHandleProps: undefined`, and
  `reorderActions: undefined`.
- The portal root carries `data-tile-grid-overlay` and unmounts at drop or cancel; there is no drop
  animation because the controlled order is expected to update immediately.
- The source wrapper, while it remains in the mounted window, receives `isDragging: true` and
  `data-dragging="true"`. The tile shell applies the reduced visual from `isDragging`; the grid
  does not style application content. The overlay copy persists through auto-scroll because the
  active item, index, and rectangle are captured at drag start rather than re-read from the
  virtual window.

### Drop indicator

The indicator is a 2px line rendered inside the scroll container with absolute content
coordinates.

| Layout                         | Orientation | Position                                                                                                           |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `fixed`, `justified`, `mosaic` | Vertical    | `x = rect.x - gap/2` for `before`, `rect.x + rect.width + gap/2` for `after`; `y = rect.y`; height = `rect.height` |
| `masonry`                      | Horizontal  | `y = rect.y - gap/2` for `before`, `rect.y + rect.height + gap/2` for `after`; `x = rect.x`; width = `rect.width`  |

The line carries `data-tile-grid-drop-indicator`, uses `tokens.colorBrandStroke1`, a `Highlight`
background in forced-colors mode, `pointer-events: none`, `aria-hidden="true"`, and `z-index: 2`.
It is clipped by the scroll container and never changes its scroll extent.

### Keyboard reorder

The controller builds two actions per item while arranging is enabled:

```ts
{ id: 'move-up', label: strings.moveUp, icon: <ArrowUpRegular />, onSelect: moveUp, isDisabled: upBoundary }
{ id: 'move-down', label: strings.moveDown, icon: <ArrowDownRegular />, onSelect: moveDown, isDisabled: downBoundary }
```

Move up is disabled at index 0 and Move down at the last index. Both call the same commit path as a
drop: one `onReorder` call when the index changes, then `strings.reorderPosition(toIndex + 1,
total)` in the shared live region. The actions are absent entirely when arranging is disabled; the
shell appends them after the application's menu entries.

### Announcement

A single `useLiveAnnouncement` channel owns the message state. Selection and reorder both call
`announce(message)`; the latest call wins. The initial render is silent. The existing selection
count comparison stays in place so equal-count replacements do not re-announce.

## Integration Points

### `useTileGrid`

- Resolves the new props and the merged strings once per render.
- Creates the announcement channel and passes `announce` to selection and reorder.
- Creates the reorder controller with `currentIds`, `visibleItemRects`, `rootRef`, layout, gap,
  strings, callbacks, and the enablement predicate.
- Exposes `reorder` state to the renderer and item views.

### `TileGridItemView`

- Calls `useDraggable` for its tile with `disabled: !reorderEnabled || disabled`.
- Builds `dragHandleProps` only when the tile can be dragged; the label uses
  `strings.dragHandleLabel(label)`.
- Passes `isDragging`, `dragHandleProps`, `reorderActions`, and `strings` into the memoized content
  arguments.
- Calls `useDraggable` unconditionally so hook order stays stable; the hook is disabled when
  arranging is off.

### `renderTileGrid`

- Defines `TileGridRoot` at module scope; it calls `useDroppable` and merges the scroll-container
  ref with the droppable ref.
- Wraps `TileGridRoot` in the always-mounted `DndContext`; the provider is inert when reorder is
  off.
- Passes `collisionDetection`, sensors, and the drag lifecycle handlers.
- Renders `TileGridDropIndicator` after the items and before the marquee canvas.
- Renders the body portal beside the list, using the active item's render arguments and the stored
  start rectangle plus delta.

## Error Handling

| Error Case                                  | Handling Strategy                                         | AR Ref |
| ------------------------------------------- | --------------------------------------------------------- | ------ |
| `reorderable` without `onReorder`           | Disable arranging; warn once in development               | AR-12  |
| `onReorder` throws                          | Clear drag state in `finally`; rethrow to the application | AR-9   |
| Pointer leaves the grid during a drop       | Clamp to the nearest collection boundary                  | AR-10  |
| Mounted window does not contain the pointer | Return no insertion; a later move recomputes              | AR-17  |
| Root unmounts during a drag                 | Stop the RAF loop and clear state                         | AR-6   |
| Escape during a drag                        | dnd-kit pointer sensor cancels; no callback fires         | AR-19  |

## Testing Requirements

Specification and implementation tests are owned by
[07-testing-strategy.md](07-testing-strategy.md). The reorder layer needs jsdom coverage for props,
actions, payloads, and announcements, plus real-browser coverage for pointer drag, cancel,
auto-scroll, the indicator, and each layout.
