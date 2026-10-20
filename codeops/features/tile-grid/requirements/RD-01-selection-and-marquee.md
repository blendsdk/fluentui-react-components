# RD-01: Selection and Marquee Internals

> **Document**: RD-01-selection-and-marquee.md
> **Status**: Preflighted — accepted fixes applied
> **Created**: 2026-10-20
> **Project**: fluentui-react-components
> **Depends On**: RD-02 (internal geometry input contract); grid-level marquee tests live in RD-03
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

This RD defines the internal selection and marquee layer used by `TileGrid`. It is not a public
export in v1. Keeping it internal lets the component ship a strong selection model without
committing to a second public API before another consumer exists.

The layer has two responsibilities:

1. **Selection state** — controlled or uncontrolled selected IDs, single/multiselect semantics,
   anchor and range selection, select-all/clear, and stable behavior across item changes.
2. **Marquee selection** — optional pointer-drag rectangular selection over item rectangles supplied
   by RD-02's internal `TileGridGeometryPort`, with additive selection, auto-scroll, cancel, and
   commit rules. The marquee engine is unit-tested with synthetic rectangles; the grid-level
   integration tests belong to RD-03.

The application almost always seeds selection. Therefore the selection layer is controlled-first:
seeded IDs survive before items load, across filters, and across pages. `onSelectionChange` fires
only after a user interaction, never on mount or when `items` change.

---

## Functional Requirements

### Must Have (M)

- [ ] **Controlled selection.** Accept `selectedIds: ReadonlySet<string>` as the source of truth.
      When supplied, the internal state mirrors the prop; user interactions report the next set
      through `onSelectionChange` and never mutate the prop.
- [ ] **Uncontrolled selection.** Accept `defaultSelectedIds?: Iterable<string>` for the
      uncontrolled case. The initial set is deduplicated and remains stable across re-renders.
- [ ] **No mount callback.** `onSelectionChange` MUST NOT fire on mount, when `defaultSelectedIds`
      initializes, when `selectedIds` changes from the parent, or when `items` load.
- [ ] **Stable identity.** Selection keys are strings from `getItemId`. The selection layer never
      uses array indexes or object identity.
- [ ] **Duplicate IDs.** Duplicate `getItemId` values are an application contract violation. The
      layer emits a development warning and treats only the first occurrence in display order as
      the canonical item; later duplicates are not rendered or selected.
- [ ] **Unknown IDs preserved.** IDs in `selectedIds` that are not present in the current `items`
      array remain selected. The layer never prunes IDs on its own.
- [ ] **Single mode.** `selectionMode="single"` permits zero or one selected ID. Selecting another
      ID replaces the previous one. In controlled mode, a seed with more than one ID produces a
      development warning and the first ID in the supplied set's iteration order is treated as
      selected; no callback is fired on mount.
- [ ] **Multiselect mode.** `selectionMode="multiselect"` permits any number of selected IDs,
      including all current and hidden IDs.
- [ ] **Toggle.** Toggling an unselected ID adds it; toggling a selected ID removes it in
      multiselect mode. In single mode, selecting a different ID replaces the previous one; a plain
      select or toggle of the selected ID keeps it selected, matching radio semantics.
- [ ] **Range selection.** `selectRange(targetId, currentIds)` selects every selectable ID between
      the anchor and the target in current item order, inclusive. If there is no anchor, only the
      target is selected. The anchor remains unchanged until a new non-range selection is made.
- [ ] **Anchor maintenance.** A single select, toggle, or click sets the anchor to the interacted
      ID. A range selection preserves the existing anchor. Clearing selection clears the anchor.
      A seed sets the anchor to the first selected ID, if any.
- [ ] **Select all.** In multiselect mode, `selectAll(currentIds)` adds every selectable current ID
      to the existing selection. It does not remove hidden selected IDs. Disabled and non-selectable
      items are excluded. In single and none modes, `selectAll` is a no-op and emits a development
      warning.
- [ ] **Clear all.** `clearSelection()` removes every selected ID, including hidden IDs, and clears
      the anchor.
- [ ] **Selectable predicate.** `isSelectable(item)` defaults to true. Non-selectable items cannot
      be selected by click, keyboard, range, select-all, or marquee. Disabled items are always
      non-selectable; RD-03 composes `isDisabled` with this predicate.
- [ ] **Mode stability.** Selection mode is fixed per grid. A runtime change is a development
      warning; the layer keeps the mode from the first render for the current mount.
- [ ] **Marquee opt-in.** Marquee is available only when `selectionMode="multiselect"` and the
      application sets `enableMarquee`. It is disabled in single and none modes.
- [ ] **Marquee start.** A marquee starts only from the grid background, not from a tile, action
      button, drag handle, checkbox, radio, link, input, or menu. Starting a marquee on a tile is
      not a drag reorder.
- [ ] **Marquee threshold and background click.** The rectangle becomes active after the pointer
      moves at least 4 CSS pixels from the pointer-down point. A shorter gesture is a background
      click; a background click has no effect on selection and does not activate an item.
- [ ] **Marquee intersection.** An item is selected when its layout rectangle intersects the
      marquee rectangle. Full enclosure is not required.
- [ ] **Marquee replacement.** A plain marquee replaces the selection at pointer-down with the
      items intersecting the rectangle.
- [ ] **Marquee addition.** Shift+drag and Ctrl/Cmd+drag add intersecting items to the
      pre-marquee selection. They never remove items.
- [ ] **Marquee cancel.** Escape or `pointercancel` cancels the gesture and restores the
      pre-marquee selection. `lostpointercapture` cancels only when the gesture has not already
      committed or cancelled; a normal `pointerup` releases capture after commit and must not
      revert it. `onSelectionChange` is not called for a cancelled gesture.
- [ ] **Marquee commit.** After the marquee is active, a successful pointer-up calls
      `onSelectionChange` exactly once with the final set. The committed state wins over a later
      `lostpointercapture` event.
- [ ] **Auto-scroll.** Dragging near the scroll container's edges auto-scrolls while the pointer is
      held. Auto-scroll uses `requestAnimationFrame` and stops when the pointer leaves the edge zone,
      the gesture ends, or the gesture is cancelled.
- [ ] **Geometry source.** Marquee hit testing uses item rectangles from the geometry engine. It MUST
      NOT call `getBoundingClientRect()` once per item per frame.
- [ ] **No HTML parsing.** Selection and marquee never parse or inject HTML.

### Should Have

- [ ] Development warning when `selectionMode="single"` receives more than one selected ID.

### Won't Have (Out of Scope)

- Public export of the selection or marquee module in v1 (AR #11).
- Multi-item drag selection.
- Lasso selection with a free-form path; the marquee is rectangular.
- Touch-specific long-press selection.
- Selection persistence to storage, URL, or server; the application owns persistence.
- Undo/redo for selection changes.

---

## Technical Requirements

### Selection module contract

The internal module is a hook plus a small store, for example:

```ts
type GridSelectionMode = 'none' | 'single' | 'multiselect';

interface GridSelectionOptions {
  mode: GridSelectionMode;
  selectedIds?: ReadonlySet<string>;
  defaultSelectedIds?: Iterable<string>;
  onSelectionChange?: (next: ReadonlySet<string>) => void;
  getItemId: (item: unknown) => string;
  isSelectable?: (item: unknown) => boolean;
}

interface GridSelection {
  selectedIds: ReadonlySet<string>;
  anchorId?: string;
  isSelected(id: string): boolean;
  select(id: string): void;
  deselect(id: string): void;
  toggle(id: string): void;
  selectRange(targetId: string, currentIds: string[]): void;
  selectAll(currentIds: string[]): void;
  clear(): void;
}
```

The exact names may change during implementation, but the observable rules in this RD are fixed.

### Controlled/uncontrolled resolution

- If `selectedIds` is defined, it wins. The internal store mirrors it and never emits a callback
  just because the prop changed.
- Otherwise the store initializes from `defaultSelectedIds` once and owns subsequent changes.
- A controlled parent that rejects a change by not updating `selectedIds` sees the previous
  selection on the next render; the component must not keep a conflicting hidden state.

### Range algorithm

1. Resolve current item IDs in display order.
2. Find the anchor index and target index.
3. If either index is missing, select only the target when selectable.
4. Otherwise select every selectable ID between the lower and upper index, inclusive.
5. Keep existing selected IDs outside the range; range selection adds, it does not clear.
6. Keep the original anchor.

### Marquee algorithm

1. On pointer-down on the background, record the starting point, the pre-marquee selection, and
   the additive flag (`shiftKey || ctrlKey || metaKey`).
2. Capture the pointer and attach `pointermove`, `pointerup`, `pointercancel`, and
   `lostpointercapture`.
3. After the 4px threshold, create the rectangle in scroll-container coordinates. A shorter
   gesture is a background click with no selection or activation effect.
4. On each animation frame, compute the visible item range and test each item rectangle for
   intersection using cached geometry.
5. Apply auto-scroll when the pointer is within 24px of an edge. The default maximum scroll speed
   is 20px per frame; the exact speed may be tuned during implementation.
6. Render a non-interactive marquee overlay above the grid content but below any drag overlay.
7. On pointer-up, set the committed state and commit once. On Escape or `pointercancel`, set the
   cancelled state, restore the pre-marquee selection, and call no callback. A
   `lostpointercapture` event cancels only when neither the committed nor the cancelled state is
   set; the normal release after `pointerup` must not revert a committed selection.

### Accessibility

- Selection controls rendered by `TileGridItem` must have an accessible name derived from the item
  label. RD-03 owns the exact control wiring and announcements.
- Marquee is pointer-only. Keyboard users receive equivalent range selection through Shift+Arrow
  and Shift+click; the marquee is never the only way to select many items.
- Selection count announcements are owned by RD-03 and must be polite, not assertive.

### Performance

- A selection toggle updates only the selected-ID lookup and the visible item wrappers; it must not
  map over all 20K items to compute visual state.
- `selectedIds.size` is the authoritative count; hidden selected IDs are not scanned for rendering.
- Marquee hit testing is bounded by the visible item window plus the auto-scroll window, not by DOM
  reads for all 20K items or by whole masonry columns.
- A 20K selection set may be copied on interaction. The p95 selection toggle completes within 16ms
  on the shared 20K benchmark fixture; no per-item React state is created for unselected items.
  Observable proxy: one toggle changes the rendered output of only the affected mounted tiles and
  does not increase the mounted wrapper count.

### Security

- **Data sensitivity:** selection contains item IDs only. The application owns the associated
  records and any PII.
- **Input validation:** IDs are opaque strings; duplicate IDs are warned in development and
  resolved deterministically to the first occurrence in production.
- **Injection:** no HTML parsing, `eval`, `innerHTML`, or `dangerouslySetInnerHTML`.
- **Authentication/authorization:** N/A; selection is client state. The application enforces record
  access.
- **Logging:** no selected IDs, labels, or image URLs are logged.
- **Encryption/rate limiting/infrastructure:** N/A for this client-side module.

---

## Integration Points

### With RD-02 (Layout and virtualization)

- RD-02 owns the internal `TileGridGeometryPort`; RD-01 consumes its rectangles, visible item IDs,
  scroll container, and scroll helpers.
- RD-02 calls the selection module's range and select-all helpers with the current item order.
- RD-01's unit tests use synthetic rectangles and do not require a mounted grid.

### With RD-03 (Selection integration, focus, accessibility)

- RD-03 owns the public `selectionMode`, `selectedIds`, `defaultSelectedIds`,
  `onSelectionChange`, `interactionMode`, `enableMarquee`, and `isDisabled` props.
- RD-03 owns click/keyboard mapping, the rendered selection controls, the public
  `TileGridHandle` selection methods, and the grid-level marquee integration tests.
- RD-03 composes `isDisabled` into the internal selectable predicate.
- RD-01 owns the state transition rules and marquee engine.

### With RD-04 (Arranging, tile shell, actions)

- Drag reorder does not mutate selection.
- Tile actions must not start selection or marquee.

---

## Scope Decisions

| Decision                | Options Considered                | Chosen                                                | Rationale                                                   | AR Ref        |
| ----------------------- | --------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- | ------------- |
| Public selection module | Public hook/component vs internal | Internal only                                         | No second consumer; public surface stays intentional        | AR #11        |
| Selection identity      | Item objects vs stable IDs        | Stable string IDs                                     | Seeded, filtered, and paged selections need stable identity | AR #6         |
| Unknown IDs             | Prune vs preserve                 | Preserve                                              | Filtering and paging hide items that remain selected        | AR #6         |
| Initial callback        | Fire on mount vs never            | Never                                                 | Avoids controlled-state loops and surprise writes           | AR #6         |
| Single-mode seed        | Keep all vs first vs throw        | Warn and keep first                                   | Deterministic, non-crashing; app must sanitize              | AR #16        |
| Marquee scope           | Required vs optional              | Optional                                              | Not every grid needs it; reduces interaction cost           | AR #6         |
| Marquee hit test        | DOM rects per item vs geometry    | Geometry                                              | 20K scale and virtualization                                | AR #6, AR #11 |
| Marquee cancel          | Capture-loss vs terminal events   | Commit-once guard; cancel only Escape/`pointercancel` | Avoids reverting a committed gesture                        | PF-014        |
| Duplicate IDs           | Share vs first occurrence         | First occurrence wins with a development warning      | Deterministic identity and React keys                       | PF-013        |

---

## Acceptance Criteria

1. [ ] With a multiselect selection layer, `selectedIds` containing `a` and `b`, and an empty item list, initialization does not throw and emits no callback.
2. [ ] When items containing `a` and `b` are added, both report selected and no `onSelectionChange` fires.
3. [ ] Toggling an unselected ID adds it; toggling a selected ID removes it. In single mode, selecting a different ID replaces the previous ID, while a plain select of the selected ID keeps it selected.
4. [ ] `selectRange('d', ['a','b','c','d'])` from an anchor at `b` selects `b`, `c`, and `d`, and keeps selections outside the range.
5. [ ] In multiselect mode, `selectAll(currentIds)` adds every selectable current ID and keeps hidden selected IDs; `clearSelection()` removes all selected IDs; in single/none mode, `selectAll()` is a no-op with a development warning.
6. [ ] In single mode, selecting a second ID replaces the first; a seed with two IDs warns in development and treats the first as selected.
7. [ ] `onSelectionChange` is not called on initialization, on `selectedIds` prop changes, or when the item set changes.
8. [ ] A marquee controller driven by synthetic pointer events and a synthetic `TileGridGeometryPort` replaces the selection with intersecting items and calls the commit callback once on pointer-up.
9. [ ] Shift+drag and Ctrl/Cmd+drag add intersecting items and never remove pre-existing selected IDs.
10. [ ] Escape or `pointercancel` restores the pre-marquee selection and fires no callback; a `pointerup` followed by `lostpointercapture` keeps the committed selection.
11. [ ] Auto-scroll calls the geometry port's `scrollBy` when dragging within 24px of an edge and stops at pointer-up or cancel.
12. [ ] Marquee hit testing does not call `getBoundingClientRect()` per item per frame and is bounded by the visible item window.
13. [ ] A 20K-item selection set can be selected, cleared, and read without creating 20K React state entries; the p95 selection toggle completes within 16ms on the shared benchmark fixture.
14. [ ] Duplicate `getItemId` values produce a development warning; only the first occurrence in display order is rendered and selected.
15. [ ] A background gesture shorter than 4px has no effect on selection and does not activate an item.
16. [ ] Security requirements verified: no HTML parsing, no selected-ID logging, no unsafe casts, and no `getBoundingClientRect` per item per frame.

The grid-level marquee integration criteria (overlay rendering, `enableMarquee`, selection callback wiring, and live-region announcements) are in RD-03.
