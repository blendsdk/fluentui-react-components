# Selection and Marquee: TileGrid Phase A

> **Document**: 03-03-selection-and-marquee.md
> **Parent**: [Index](00-index.md)
> **CodeOps Artifact Schema**: 1

## Overview

This document implements RD-01's internal selection store and marquee controller, plus the minimal Phase A public selection wiring. The store is controlled-first and preserves seeded/hidden IDs. The marquee controller is a pure state machine over a `TileGridGeometryPort`; it is fully tested in Phase A but is not mounted in `TileGrid` until RD-03 adds the overlay and pointer host.

Phase A selection is deliberately smaller than RD-03: no rendered checkboxes/radios, no roving focus, no keyboard selection, no live announcements, no `isSelectable`/`isDisabled` public predicates, no `interactionMode`, no `enableMarquee`, and no `scrollResetKey`. The click mapping and handle methods are the observable surface.

**References:** RD-01 §Selection semantics, §Marquee selection, §Marquee algorithm, §Performance, §Security; RD-03 §Selection modes, §Controlled selection, §Multiselect clicks, §Single-select clicks, §None mode, §Select-all/clear API, §List semantics. **Decisions:** AR #1, AR #3, AR #4, AR #23.

## Architecture

```
src/components/TileGrid/selection/
├── types.ts               # GridSelectionMode, GridSelectionOptions, GridSelection
├── transitions.ts         # pure set transitions used by the hook and perf test
├── useGridSelection.ts    # controlled/uncontrolled store hook
├── clickSelection.ts      # click mapping + interactive-target guard
└── index.ts               # internal barrel (not package root)

src/components/TileGrid/marquee/
├── types.ts               # PointerLikeEvent, MarqueeRect, options/controller
├── createMarqueeController.ts
├── intersection.ts        # rectangle intersection helpers
└── index.ts               # internal barrel (not package root)
```

`selection/` and `marquee/` are internal. No module here is exported from `src/index.ts`. The RD-03 plan mounts the marquee controller; the Phase A package does not.

## Selection store

### Types

```ts
type GridSelectionMode = TileGridSelectionMode;

interface GridSelectionOptions {
  mode: GridSelectionMode;
  selectedIds?: ReadonlySet<string>;
  defaultSelectedIds?: Iterable<string>;
  onSelectionChange?: (next: ReadonlySet<string>) => void;
  isSelectable?: (id: string) => boolean;
}

interface GridSelection {
  selectedIds: ReadonlySet<string>;
  anchorId: string | undefined;
  isSelected(id: string): boolean;
  select(id: string): void;
  selectOnly(id: string): void;
  deselect(id: string): void;
  toggle(id: string): void;
  selectRange(targetId: string, currentIds: readonly string[]): void;
  selectAll(currentIds: readonly string[]): void;
  clear(): void;
}
```

`useGridSelection(options)` returns the `GridSelection`. The grid passes the unique current IDs to `selectRange`/`selectAll`. `isSelectable` defaults to `() => true`; Phase A never supplies a public predicate, but the store keeps the option for RD-03 and for the RD-01 unit tests.

The set transitions themselves are pure functions in `selection/transitions.ts` (`toggleSelection`, `selectOnlySelection`, `rangeSelection`, `selectAllSelection`, `clearSelection`, `deselectSelection`). The hook owns controlled/uncontrolled resolution and calls these functions; the performance test measures the pure transitions directly so its p95 budget is not dominated by React rendering.

### Controlled/uncontrolled resolution

- If `selectedIds` is supplied, it is the source of truth. The store computes the effective set (single mode keeps only the first ID in iteration order) and calls `onSelectionChange` after a change; it never mutates the prop.
- If `selectedIds` is absent, the store initializes once from `defaultSelectedIds`, deduplicated. Single mode keeps the first ID and warns in development when more than one is supplied. Initialization never calls `onSelectionChange`.
- Unknown IDs stay in the set. They do not render until an item with that ID exists. `selectedIds.size` is the full count.
- A controlled prop change, an items change, or a mount never calls `onSelectionChange`.
- The callback is read through a ref so an inline callback does not invalidate the store.

### Transitions

| Method                              | `none`                      | `single`                                                  | `multiselect`                                                                                                               |
| ----------------------------------- | --------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `select(id)`                        | no-op                       | replace with `{id}`; selecting the selected ID is a no-op | add `id`; keep the rest                                                                                                     |
| `selectOnly(id)`                    | no-op                       | same as `select`                                          | replace with `{id}`                                                                                                         |
| `deselect(id)`                      | no-op                       | remove `id`; anchor cleared                               | remove `id`; keep the rest                                                                                                  |
| `toggle(id)`                        | no-op                       | selected → no-op (radio semantics); not selected → select | remove if selected, add if not; anchor set to `id`                                                                          |
| `selectRange(targetId, currentIds)` | no-op                       | `select(targetId)`                                        | add every selectable ID from anchor to target, inclusive; keep selections outside the range; no anchor → select target only |
| `selectAll(currentIds)`             | no-op + development warning | no-op + development warning                               | add every selectable current ID; preserve hidden IDs                                                                        |
| `clear()`                           | clear                       | clear                                                     | clear                                                                                                                       |

Rules shared by all methods:

- A method that produces the same effective set does not call `onSelectionChange`.
- A method that changes the set calls `onSelectionChange` exactly once with the next set.
- `select`, `selectOnly`, `toggle` (when adding), and a non-range selection set the anchor to the target ID. `selectRange` leaves the anchor unchanged. `deselect` clears the anchor in single mode and leaves it in multiselect. `clear` clears the anchor.
- An ID for which `isSelectable(id)` is false is never added; `select`/`toggle` are no-ops for it. A selected non-selectable ID in a controlled prop is still preserved in the set (the application owns the prop) but does not render as selectable; RD-03 finalizes the public predicate behavior.
- A single-mode seed with more than one ID warns once per distinct input and treats the first ID as selected. No callback fires.
- `selectAll` in `none`/`single` is a no-op with a development warning; the Phase A handle delegates to the store, so the warning is the store's. RD-03 owns the documented public warning copy.

### Click mapping

`clickSelection.ts` exports:

```ts
function isInteractiveClickTarget(target: EventTarget | null): boolean;

function applyItemClick(args: {
  event: Pick<MouseEvent, 'shiftKey' | 'ctrlKey' | 'metaKey' | 'target' | 'defaultPrevented'>;
  id: string;
  mode: GridSelectionMode;
  currentIds: readonly string[];
  selection: GridSelection;
}): void;
```

Mapping:

- `mode === 'none'` → no-op.
- `defaultPrevented` → no-op.
- Interactive target → no-op. The guard matches `button`, `a[href]`, `input`, `select`, `textarea`, `[role="button"]`, `[role="menuitem"]`, `[role="checkbox"]`, `[role="radio"]`, `[role="switch"]`, `[contenteditable="true"]`, and `[data-tile-grid-interactive]`.
- `shiftKey` in multiselect → `selectRange(id, currentIds)`.
- `ctrlKey || metaKey` in multiselect → `toggle(id)`.
- Plain click in multiselect → `selectOnly(id)`.
- Single mode → `select(id)` regardless of modifiers; clicking the selected item keeps it selected.
- The handler does not call `preventDefault` or `stopPropagation`; the application's inner controls keep their behavior.

The click handler is attached to the item wrapper in `03-04`. It reads the modifier flags from the React mouse event and calls `applyItemClick`.

### Handle semantics

The Phase A `TileGridHandle` is created with `useImperativeHandle`:

```ts
interface TileGridHandle {
  selectAll(): void;
  clearSelection(): void;
  scrollToSelected(): void;
}
```

- `selectAll()` → `selection.selectAll(currentIds)`. Multiselect only; the store no-ops and warns in single/none.
- `clearSelection()` → `selection.clear()`. Clears hidden IDs too.
- `scrollToSelected()` → first selected ID in current item order; `scrollToItem`; no selected item is a no-op. It never calls `onSelectionChange`.
- The handle methods are stable across renders; `useImperativeHandle` dependencies include the current selection methods/current IDs/scroll helper.

## Marquee controller

### Types

```ts
interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PointerLikeEvent {
  clientX: number;
  clientY: number;
  pointerId: number;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  preventDefault(): void;
}

interface MarqueeSelectionOptions {
  geometry: TileGridGeometryPort;
  getSelectedIds(): ReadonlySet<string>;
  isSelectable(id: string): boolean;
  onCommit(next: ReadonlySet<string>): void;
  onCancel?(preSelection: ReadonlySet<string>): void;
  onPreview?(preview: ReadonlySet<string>): void;
  edgeThreshold?: number; // default 24
  maxScrollSpeed?: number; // default 20
  activationDistance?: number; // default 4
  pointerCaptureTarget?: HTMLElement | null;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
}

interface MarqueeController {
  handlePointerDown(event: PointerLikeEvent): void;
  handlePointerMove(event: PointerLikeEvent): void;
  handlePointerUp(event: PointerLikeEvent): void;
  handlePointerCancel(event: PointerLikeEvent): void;
  handleLostPointerCapture(event: PointerLikeEvent): void;
  handleKeyDown(event: Pick<KeyboardEvent, 'key' | 'preventDefault'>): void;
  getRect(): MarqueeRect | null;
  getPreviewSelection(): ReadonlySet<string>;
  isActive(): boolean;
  dispose(): void;
}
```

`createMarqueeController(options)` returns the controller. The host calls the methods; the controller does not attach global listeners in Phase A. The RD-03 overlay host attaches `pointermove`/`pointerup`/`pointercancel`/`lostpointercapture` and a keydown listener while the controller is active.

### State machine

```
idle ──pointerdown──▶ pending ──4px──▶ active ──pointerup──▶ committed
                         │                │
                         ├──pointerup─────┴──▶ idle (background click, no callback)
                         ├──Escape/pointercancel/lostpointercapture──▶ cancelled
                         └──dispose──▶ idle
```

- `pointerdown` on a non-left button is ignored.
- `pointerdown` records the start point, the pre-marquee selection, the additive flag (`shift || ctrl || meta`), and the pointer ID. It captures the pointer on `pointerCaptureTarget` when available.
- `pointermove` before the 4px threshold keeps the pending state and does not create a rect.
- The first move at or beyond 4px becomes active and creates the rect in scroll-container content coordinates:
  - `containerRect = geometry.getScrollContainer()?.getBoundingClientRect()`
  - `x = clientX - containerRect.left`
  - `y = clientY - containerRect.top + geometry.getScrollOffset()`
  - The rect is the normalized rectangle from the start point to the current point.
- On every active move or auto-scroll frame, the controller obtains `geometry.getVisibleItemIds()`, reads each `geometry.getItemRect(id)`, and intersects it with the marquee rect. It filters by `isSelectable(id)`. Plain mode uses the intersecting set; additive mode unions it with the pre-marquee selection. Hit testing must use this visible-ID path, not the O(n) `indexAtPoint` helper, so a 20K grid does not scan every rectangle per pointer move.
- The controller calls `onPreview(preview)` only when the preview set changes. It never commits during the drag.
- Auto-scroll starts when the pointer is within `edgeThreshold` of the container's top or bottom. The speed is proportional to the edge distance, capped at `maxScrollSpeed` pixels per frame. Each frame calls `geometry.scrollBy(delta)` and recomputes the rect/preview. It stops when the pointer leaves the edge zone, the gesture ends, or the controller is disposed.
- `pointerup` in the pending state is a background click: reset to idle, release capture, no selection callback. This implements RD-01's shorter-gesture no-op.
- `pointerup` in the active state sets `committed` before releasing capture, calls `onCommit(preview)` exactly once, stops the frame loop, and clears the rect. A subsequent `lostpointercapture` sees `committed` and does nothing.
- `Escape`, `pointercancel`, or `lostpointercapture` in pending/active sets `cancelled`, calls `onCancel(preSelection)`, stops the frame loop, clears the rect, and releases capture. It never calls `onCommit`.
- `dispose()` stops the frame loop, releases capture if held, and moves to idle. It does not call `onCancel` or `onCommit`.

The controller never calls `getBoundingClientRect()` per item. It calls the geometry port, which uses cached rectangles. It reads the scroll container rect once per pointer move/frame, not once per item.

### Staged status

The controller is internal, not exported from the package root, and not mounted in `TileGrid` in Phase A. It is a completed unit with synthetic tests. The RD-03 plan adds `enableMarquee`, the overlay component, the background pointer host, the keyboard/announcement integration, and the grid-level tests. This is the accepted staged-internal-code exception recorded in AR #4; it is not public dead code.

### Performance, rendering, and logging

- The pure transition helper is a set-copy microbenchmark (ST-33). The public 20K selection observable proxy is ST-47 in the Phase 4 browser selection suite: select/clear/read, p95 under 16ms, and mounted wrappers unchanged.
- `03-04` renders each visible item with the internal memoized `TileGridItemView`; a selection change re-renders only the affected mounted cell. ST-49 verifies the affected-cell `renderItem` count (RD-03’s render-counter criterion).
- Diagnostics never include item labels, image URLs, item IDs, or selected IDs. Duplicate-ID warnings use a generic message and a non-identifying dedupe key (PF-009).

## Error handling

| Error case                                                | Handling strategy                                                                  | AR Ref                  |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------- |
| `selectedIds` contains more than one ID in single mode    | Warn in development; use the first ID; no callback                                 | RD-03                   |
| `defaultSelectedIds` contains duplicates                  | Deduplicate; single mode keeps the first                                           | RD-01                   |
| Unknown IDs in the selected set                           | Preserve; render nothing until the item exists                                     | RD-01                   |
| A no-op selection method                                  | Do not call `onSelectionChange`                                                    | RD-01                   |
| `selectAll` in single/none                                | No-op with a development warning                                                   | RD-01, AR #23           |
| Interactive click target                                  | Do not select                                                                      | AR #3                   |
| Pointer down on a non-left button                         | Ignore                                                                             | RD-01                   |
| Pointer capture unavailable                               | Continue without capture; rely on the host's listeners                             | RD-01                   |
| `lostpointercapture` after commit                         | No-op; never revert a committed set                                                | RD-01                   |
| Marquee geometry port returns `undefined` for an ID       | Skip that item                                                                     | RD-01                   |
| Auto-scroll at the scroll boundary                        | Clamp; stop the frame loop at the boundary and restart it on the next pointer move | RD-01                   |
| Controller disposed mid-gesture                           | Stop frames, release capture, no callback                                          | Standards               |
| A warning/diagnostic would include an item or selected ID | Use a generic message and non-identifying key; never log the ID                    | RD-01 §Security, PF-009 |

## Integration points

- `03-01` provides the geometry result; the grid implements `TileGridGeometryPort` from the current geometry and root.
- `03-02` provides `scrollToItem`/`scrollToOffset` and the root scroll container.
- `03-04` attaches `applyItemClick` to the item wrapper, creates the handle, and passes the current IDs.
- The RD-03 plan mounts the marquee controller, adds `enableMarquee`, and connects commit/cancel to the store. It also adds the selection controls, focus, keyboard, and announcements.

## Testing requirements

**Selection spec (public, jsdom):** controlled/uncontrolled seeds, no mount callback, hidden IDs, single/multiselect click mapping, Shift range, Ctrl/Cmd toggle, none-mode no-op, handle methods, interactive-target guard, selected render arg.

**Selection impl:** store transitions table, no-op callback rules, anchor behavior, single radio semantics, seed validation warning, `selectAll` filtering/visibility, clear hidden IDs, controlled prop mirroring, no-ID logging.

**Selection performance (browser, Phase 4):** 20K public select/clear/read, p95 under 16ms, mounted wrappers unchanged (ST-47); one toggle calls `renderItem` only for the affected mounted cell (ST-49).

**Marquee spec (internal, synthetic):** 4px threshold, background click no-op, plain replace, additive union, Escape/pointercancel restore, commit once, `pointerup` then `lostpointercapture` keeps committed, auto-scroll calls `scrollBy`, preview changes, `dispose` stops frames, no per-item `getBoundingClientRect`.

**Browser:** real pointer click selection and handle scroll behavior in `test/browser/tile-grid-selection.browser.test.tsx`, including the 20K selection proxy. The marquee overlay is not part of Phase A; the controller is covered by the synthetic suite.
