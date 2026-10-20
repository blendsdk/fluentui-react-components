# RD-03: Selection Integration, Focus, and Accessibility

> **Document**: RD-03-selection-focus-and-accessibility.md
> **Status**: Preflighted — accepted fixes applied
> **Created**: 2026-10-20
> **Project**: fluentui-react-components
> **Depends On**: RD-01, RD-02
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

This RD connects the internal selection and marquee layer from RD-01 to the rendered `TileGrid`
from RD-02. It defines the public selection props, seeded selection behavior, click and keyboard
interaction, focus management, list semantics, announcements, and filtering persistence.

Selection is controlled-first because CastingAppMT almost always seeds it. The application supplies
selected IDs; the grid preserves them before and after items load and across filters and pages.
`onSelectionChange` fires only when the user acts, never on mount or when data changes.

The accessibility model is a list of tiles, not a fabricated 2D grid. Masonry, justified, and mosaic
layouts have no stable row/column model, so advertising `role="grid"` would misrepresent the
structure. Each tile uses a real selection control, a labelled focus target, and independently
operable actions.

---

## Functional Requirements

### Must Have (M)

- [ ] **Selection modes.** `selectionMode` accepts `'none' | 'single' | 'multiselect'` and defaults
      to `'none'`.
- [ ] **Controlled selection.** `selectedIds: ReadonlySet<string>` is the source of truth when
      supplied. `defaultSelectedIds` initializes the uncontrolled case.
- [ ] **Seeded selection.** IDs may be supplied before items load. When matching items appear, they
      render selected. The grid never clears or prunes unknown IDs.
- [ ] **No mount callback.** `onSelectionChange` does not fire on mount, when `selectedIds` changes
      from the parent, or when `items` change.
- [ ] **Hidden selections.** Selected IDs absent from the current `items` remain selected. The
      application can read `selectedIds.size` for the full count.
- [ ] **Single-select seed validation.** In single mode, the application must seed zero or one ID.
      More than one produces a development warning; the first ID in `selectedIds` iteration order is
      treated as selected; no callback is fired.
- [ ] **Interaction mode.** `interactionMode` accepts `'browse' | 'select'` and defaults to
      `'select'`.
      - `'select'`: single click selects; double-click or Enter activates.
      - `'browse'`: single click activates; Ctrl/Cmd-click toggles selection; Shift-click selects a
        range.
- [ ] **Activation callback.** `onItemActivate(item)` fires for double-click/Enter in `'select'`
      mode, for single-click/Enter in `'browse'` mode, and for click/Enter in `'none'` mode, when
      the tile is not disabled.
- [ ] **Multiselect clicks.** With `selectionMode="multiselect"` and `interactionMode="select"`, a
      plain click replaces the selection with the clicked item; Ctrl/Cmd-click toggles one item;
      Shift-click selects the range from the anchor to the clicked item.
- [ ] **Single-select clicks.** A plain click selects the clicked item; clicking the selected item
      keeps it selected; Ctrl/Cmd-click on a different item replaces the selection. Single-select
      follows radio semantics and never deselects by toggling the selected item.
- [ ] **None mode.** With `selectionMode="none"`, no selection controls render and click/Enter
      activate the tile. Ctrl/Shift/marquee selection is disabled.
- [ ] **Selectable and disabled predicates.** `isSelectable(item)` defaults to true.
      Non-selectable items cannot be selected, do not participate in select-all or range selection,
      and render no selection control; they remain readable, focusable, and activatable when useful.
      `isDisabled(item)` defaults to false. Disabled items render `aria-disabled="true"`, do not
      activate, do not start a drag or marquee, and are never selectable. When both predicates are
      supplied, disabled wins.
- [ ] **Disabled focusability.** Disabled items remain focusable by default so screen-reader users
      can reach them and read why they are unavailable; they never activate, select, drag, or start
      a marquee. The application removes an item from the grid by filtering it out of `items`, not
      by disabling it.
- [ ] **Marquee opt-in.** `enableMarquee` defaults to false and works only in multiselect mode.
      RD-01 owns the marquee state machine; this RD renders its overlay and connects commit/cancel.
- [ ] **Select-all/clear API.** The forwarded `TileGridHandle` exposes `selectAll()` (multiselect
      only: select every selectable current item, preserving hidden selections), `clearSelection()`
      (clear all), and `scrollToSelected()`. `focusItem(id)` remains internal to the grid. In single
      or none mode, `selectAll()` is a no-op with a development warning.
- [ ] **Scrolling to selection.** The grid never auto-scrolls to a seeded selection on mount.
      `scrollToSelected()` scrolls to the first selected item present in the current layout; it is
      a no-op when no selected item is present.
- [ ] **Filtering persistence.** When the application supplies a different filtered `items` array
      and changes `scrollResetKey`, selected IDs persist, the scroll position resets to the top, and
      focus moves to the first visible selectable tile if the active tile disappeared. Appending a
      page or updating items in place does not reset scroll while `scrollResetKey` is unchanged.
- [ ] **Layout and zoom persistence.** Changing layout or `tileSize` preserves selection and the
      active item when possible.
- [ ] **Roving focus.** The grid has one tab stop: the active tile wrapper. Inactive selection
      controls and inline actions use `tabIndex={-1}`. Arrow keys move the active tile spatially
      using the layout rectangles: left/right/up/down select the nearest tile in that direction.
      Home/End go to the first/last item; PageUp/PageDown move by one visible row across all lanes;
      Ctrl+Home/Ctrl+End go to the first/last item. Moving the active tile calls the internal scroll
      helper when the target is outside the viewport.
- [ ] **Keyboard selection.** Space toggles the active tile in multiselect mode; in single mode it
      selects the active tile and does not deselect it. Enter activates it; Shift+Arrow extends the
      selection range; Ctrl/Cmd+A selects all current selectable items in multiselect mode; Escape
      cancels an active marquee.
- [ ] **Keyboard zoom.** When `zoomable` is true, `+`/`=` reports `tileSize + 20` and `-` reports
      `tileSize - 20` through `onTileSizeChange`, clamped to `minTileSize`/`maxTileSize`. The grid
      never updates its own size. The keys are ignored when `zoomable` is false or no
      `onTileSizeChange` is supplied.
- [ ] **Action entry.** Tab moves from the active tile wrapper into its selection control and inline
      actions in DOM order; further Tab presses leave the grid, and Shift+Tab reverses the order.
      Escape returns focus to the tile wrapper. Arrow keys inside an action menu stay inside that
      menu. The grid does not add a tab stop for every mounted tile's controls.
- [ ] **Focus visibility.** The active tile and focused controls use a visible focus indicator from
      theme tokens.
- [ ] **List semantics.** The root is a list with an accessible name from `ariaLabel` or a native
      `aria-labelledby`; when both are supplied, `aria-labelledby` wins. The grid emits a development
      warning when neither is supplied. Each tile is a list item. The list does not claim
      `role="grid"`.
- [ ] **Selection controls.** Multiselect renders a real checkbox; single-select renders a real radio
      input, and all radios share one `name` so the browser treats them as one group. Each control
      has an accessible name derived from `getItemLabel(item)` and an accessible state that matches
      the selection. Inactive controls use `tabIndex={-1}` per the roving-focus rule.
- [ ] **Virtualized positions.** Each mounted item exposes `aria-setsize` equal to the current item
      count and `aria-posinset` equal to its one-based position.
- [ ] **Announcements.** A polite live region announces selection count changes through
      `strings.selectionCount(selectedCount, totalCount)`, defaulting to
      `"3 of 20,000 selected"`. It must not announce every marquee frame; announce once per
      committed gesture.
- [ ] **Action isolation.** Selection controls and action buttons do not trigger marquee, drag, or
      tile activation. This RD owns the selection-control isolation; RD-04 owns action and drag
      isolation.
- [ ] **Empty state.** The empty state from RD-02 remains inside the named list root and uses
      `strings.emptyMessage`.

### Should Have

- [ ] Development warning when `enableMarquee` is true in single or none mode.
- [ ] Development warning when `interactionMode` is set while `selectionMode="none"`.

### Won't Have (Out of Scope)

- Runtime switching between single and multiselect modes.
- Public selection or marquee hooks/components.
- Selection persistence to storage, URL, or server.
- Touch long-press selection.
- Full RTL keyboard mirroring; v1 is left-to-right.
- A public `aria-*` override that breaks the list or selection contract.

---

## Technical Requirements

### Public props added to `TileGrid`

```ts
interface TileGridSelectionProps<T> {
  selectionMode?: TileGridSelectionMode;
  selectedIds?: ReadonlySet<string>;
  defaultSelectedIds?: Iterable<string>;
  onSelectionChange?: (next: ReadonlySet<string>) => void;
  interactionMode?: TileGridInteractionMode;
  enableMarquee?: boolean;
  isSelectable?: (item: T) => boolean;
  isDisabled?: (item: T) => boolean;
  onItemActivate?: (item: T) => void;
  scrollResetKey?: unknown;
}
```

This is a subset of the final `TileGridProps<T>` defined in RD-02; it is not a separate public
interface. `ariaLabel` is a core prop in RD-02, not a selection prop.

### Selection flow

1. `TileGrid` resolves `selectionMode`, `selectedIds`, `defaultSelectedIds`, and `onSelectionChange`
   into the RD-01 selection module.
2. Click and keyboard handlers call the RD-01 transition functions with the current item order.
3. RD-01 returns the next `ReadonlySet<string>`; RD-03 invokes `onSelectionChange` once per user
   interaction that changes the set. A no-op interaction does not call it.
4. The rendered tile computes `selected`, `selectable`, and `disabled` from the current set and the
   two predicates. A disabled item is never selectable, even when `isSelectable` returns true.
5. `selectAll()` and `clearSelection()` on the public `TileGridHandle` change the set and call
   `onSelectionChange` once when the set changes; `scrollToSelected()` never calls it.
6. Unknown IDs remain in the set but have no visible tile until an item with that ID is present.

### Focus model

- The grid tracks `activeId`. On mount, `activeId` is the first visible selected item if one exists,
  otherwise the first visible item. No scroll occurs for seeded selection.
- Arrow navigation uses geometry:
  - left/right: nearest item whose center is left/right of the active center and whose vertical
    overlap is greatest;
  - up/down: nearest item in the adjacent band/lane in that direction;
  - ties resolve to the lower item index.
- Moving the active item calls the internal `scrollToItem` helper when the target is outside the
  viewport.
- A filter change that changes `scrollResetKey` sets `activeId` to the first visible selectable item
  if the previous active ID is absent. A page append or in-place update keeps the active ID when it
  is still present.
- A layout or zoom change keeps `activeId` when the item remains visible; otherwise it chooses the
  nearest visible item.
- Disabled items remain in the roving focus order and are announced as disabled, but arrow/Space/
  Enter never activates or selects them.

### Accessibility wiring

- Root: list semantics with `aria-label` from `ariaLabel` or a native `aria-labelledby`. When both
  are supplied, `aria-labelledby` wins; a development warning is emitted when neither is supplied.
- Tile: list item with an accessible name from `getItemLabel`; `aria-setsize` and `aria-posinset`.
- Selection: the grid renders the control in the list item wrapper, adjacent to the application's
  tile content. Multiselect uses a real checkbox; single uses native radios sharing one `name` so
  they form one group. The control's accessible name includes the item label and must not be only
  "Select". Inactive controls use `tabIndex={-1}`; only the active tile's controls enter the tab
  order. `TileGridItem`'s selection indicator is visual only; it does not duplicate the control.
- Actions: independently named buttons or menu items; never nested inside the selection control's
  label.
- Live region: `role="status"` or `aria-live="polite"` with `strings.selectionCount`. It must not
  use `aria-live="assertive"`.
- Disabled/non-selectable: `aria-disabled="true"` and no selection or activation; a disabled item
  remains focusable and its reason is available in the accessible description. A non-selectable but
  enabled item has no selection control and remains activatable.

### Filtering

- The application owns filter/search/sort state and passes filtered `items` (AR #10).
- The application changes `scrollResetKey` when the filter/search/sort result changes. The grid
  resets scroll to the top only when that key changes; it does not infer a filter change from array
  identity.
- Appending a page or updating items in place with the same `scrollResetKey` preserves the scroll
  anchor and the active item.
- Selection is not cleared.
- `activeId` is retained if present; otherwise it becomes the first visible selectable item.
- `scrollToSelected()` is available for an explicit “show selection” action and is a no-op when no
  selected item is present.

### Performance

- Selection rendering reads from a Set; no per-item selection state is created for unselected items.
- The live region updates once per committed interaction, not on every marquee frame.
- Focus movement uses geometry and the virtualizer's scroll API; no DOM scan across 20K items.
- A 20K selection set can be read and cleared without rendering 20K tiles.
- The performance job records p95 selection toggle time on the shared 20K benchmark fixture; the
  target is under 16ms. A render counter around `renderItem` verifies that one toggle changes only
  the affected mounted tiles and does not increase the mounted wrapper count.

### Security

- **Data sensitivity:** selection IDs and item labels may reference actors or photos. The component
  does not log them or persist them.
- **Input validation:** `selectedIds` is deduplicated; unknown IDs are preserved but never rendered
  as fake items.
- **Injection:** labels render as React text; no HTML parsing.
- **Authentication/authorization:** N/A; the application decides which items and images the user may
  see.
- **Encryption/rate limiting/infrastructure:** N/A for this client-side module.

---

## Integration Points

### With RD-01 (Selection and marquee internals)

- RD-03 supplies the public props and calls the internal selection transitions.
- RD-03 composes `isDisabled` into the internal selectable predicate.
- RD-03 renders the marquee overlay, forwards pointer gestures to RD-01, owns the grid-level
  marquee integration tests, and exposes the public `TileGridHandle` selection methods.
- RD-01 owns state transitions, range logic, and commit/cancel rules.

### With RD-02 (Layout and virtualization)

- RD-03 uses item rectangles and the `TileGridGeometryPort` for spatial arrow navigation and
  marquee hit testing.
- RD-03 calls the internal `scrollToItem`/`scrollToIndex` helpers for focus and the public
  `scrollToSelected` for the handle.
- RD-02 supplies item order, current visible range, and the rendered wrapper positions.

### With RD-04 (Arranging, tile shell, actions)

- RD-04's tile shell renders the content and action slots; the accessible selection control is owned
  by `TileGrid` per this RD.
- RD-04's drag handle is excluded from selection and marquee starts.
- RD-04's keyboard reorder does not change selection.
- RD-04's action and keyboard-reorder strings use the same `TileGridStrings` object.

---

## Scope Decisions

| Decision                | Options Considered                | Chosen                                      | Rationale                                     | AR Ref       |
| ----------------------- | --------------------------------- | ------------------------------------------- | --------------------------------------------- | ------------ |
| Selection ownership     | Internal vs controlled            | Controlled-first with uncontrolled fallback | Seeded selection is the dominant use case     | AR #6        |
| Unknown IDs             | Prune vs preserve                 | Preserve                                    | Filters and pages hide selected items         | AR #4, AR #6 |
| Initial callback        | Fire vs never                     | Never                                       | Avoids controlled loops                       | AR #6        |
| Single seed             | Keep all vs first vs throw        | Warn, keep first                            | Non-crashing and deterministic                | AR #16       |
| Interaction mode        | Fixed clicks vs configurable      | `browse`/`select`                           | Current app needs both behaviours             | AR #5        |
| Accessibility structure | Grid vs list                      | List with real selection controls           | Mixed layouts have no stable rows/columns     | AR #15       |
| Marquee                 | Required vs optional              | Optional                                    | Not every grid needs it                       | AR #6        |
| Mode switching          | Runtime vs fixed                  | Fixed per grid                              | Avoids ambiguous multi-to-single transitions  | AR #16       |
| Filtering reset         | Array identity vs explicit key    | `scrollResetKey`                            | Paging appends must not jump to the top       | PF-005       |
| Focus model             | Native tab order vs roving        | Roving tabindex with one grid entry stop    | Bounded tab order at 20K                      | PF-007       |
| Disabled items          | `isSelectable` proxy vs predicate | Separate `isDisabled`, disabled wins        | Keeps non-selectable activatable items honest | PF-009       |
| Zoom state              | Controlled vs uncontrolled        | Controlled `tileSize` only                  | Matches AR #8; one source of truth            | PF-016       |

---

## Acceptance Criteria

1. [ ] `selectionMode="none"` renders no selection controls; a click and Enter both call `onItemActivate`.
2. [ ] `selectionMode="multiselect"` with a seeded `selectedIds` set renders those tiles selected before items load and after items load, with no `onSelectionChange` call.
3. [ ] A seeded ID that is absent from the current `items` remains in `selectedIds` and reappears selected when it returns.
4. [ ] `onSelectionChange` is not called on mount, on a `selectedIds` prop change, or when `items` change.
5. [ ] In `'select'` mode, a plain click selects; a double-click and Enter call `onItemActivate`.
6. [ ] In `'browse'` mode, a plain click calls `onItemActivate`; Ctrl/Cmd-click selects; Shift-click selects a range.
7. [ ] In single mode, selecting a second tile replaces the first; a two-ID seed warns in development and renders only the first ID as selected.
8. [ ] Ctrl/Cmd-click toggles one multiselect tile; Shift-click selects the inclusive range from the anchor to the target.
9. [ ] Arrow keys move focus to the nearest tile in the requested direction; Home/End and PageUp/PageDown move to the expected items.
10. [ ] Space toggles the active tile in multiselect mode and selects without deselecting in single mode; Enter activates it; Shift+Arrow extends the range; Ctrl/Cmd+A selects all current selectable items in multiselect mode and is a no-op with a development warning in single/none mode.
11. [ ] With `zoomable` and `onTileSizeChange`, `+`/`=` reports `tileSize + 20` and `-` reports `tileSize - 20`, clamped to `minTileSize`/`maxTileSize`; both keys are ignored when `zoomable` is false or no handler is supplied.
12. [ ] The grid exposes exactly one entry tab stop; Tab enters the active tile's controls in DOM order, further Tab presses leave the grid, Shift+Tab reverses, and Escape returns focus to the tile wrapper. Inactive controls use `tabIndex={-1}`.
13. [ ] The grid root has an accessible name from `ariaLabel` or `aria-labelledby` (the latter wins when both are present); a development warning is emitted when neither is supplied. Each mounted tile has `aria-setsize` and `aria-posinset`; each selectable tile has an accessible selection control with the item label; non-selectable tiles render no selection control; disabled tiles expose `aria-disabled="true"`.
14. [ ] Single-select radios share one `name` and form one group; multiselect uses real checkboxes.
15. [ ] A disabled item renders `aria-disabled="true"`, remains focusable, does not activate, does not start a drag or marquee, and is never selected; a non-selectable but enabled item has no selection control and remains activatable.
16. [ ] The live region announces a committed selection count once, not on every marquee frame, using `strings.selectionCount`.
17. [ ] With `enableMarquee` and multiselect, a plain background drag replaces the selection and calls `onSelectionChange` once; Shift+drag adds; Escape restores the pre-marquee selection and fires no callback.
18. [ ] Changing `scrollResetKey` resets scroll to the top, preserves selection, and moves focus to the first visible selectable tile when the active tile disappears; appending a page while the key is unchanged preserves the scroll anchor and active item.
19. [ ] A 20K selection set can be selected, cleared, and read without rendering 20K tiles or creating per-item selection state; the performance job records p95 selection toggle under 16ms.
20. [ ] The grid uses list semantics, not `role="grid"`, for all four layout modes.
21. [ ] Security requirements verified: labels render as text, selection IDs are not logged, and unknown IDs do not create fake items.
