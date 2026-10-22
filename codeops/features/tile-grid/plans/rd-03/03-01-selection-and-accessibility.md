# Selection and Accessibility: TileGrid RD-03

> **Parent**: [Index](00-index.md)
> **Authority**: AR-1, AR-5, AR-9, AR-12, AR-14, AR-15

## Contract Delta

Extend `TileGridProps<T>` with the RD-02/RD-03-defined fields: `interactionMode`, `enableMarquee`,
`isSelectable`, `isDisabled`, `onItemActivate`, `scrollResetKey`, `zoomable`, and `onTileSizeChange`.
Add `TileGridInteractionMode = 'browse' | 'select'` and `TileGridStrings.selectionCount`.
Expose implemented types from the component barrel only. Omit `tabIndex` alongside the existing
library-owned native props (AR-6). The imperative handle retains its three existing members.

Preserve defaults from RD-03. Resolve selection mode once per mount and share that effective mode
across store, handlers, control rendering, warnings, and marquee eligibility. Changing the prop
warns once through `devWarn` but never changes effective behavior. Also warn when marquee is
requested outside multiselect or an explicitly supplied interaction mode is used in none mode.
Messages are static and contain no item values.

## Selection Store Integration

Keep `useGridSelection` as the state authority; do not add a second selected-ID store. Correct the
existing uncovered RD-01 invariants before building on them:

- Initial anchor is the first effective selected ID, including a hidden seed. Mount/prop/data
  updates never notify. Parent updates do not invent a new user anchor.
- Every non-range select/toggle establishes the interacted ID as anchor, including removal by
  toggle. Ranges preserve it; clear removes it. Fixed single mode keeps radio semantics.
- Add one internal `replaceSelection(next: ReadonlySet<string>): void` entry point for a complete
  marquee result, routed through the same equality guard and controlled/uncontrolled commit path.
  It is not exported from the package and does not invent a range anchor.

Build an item-ID lookup when normalized items change. The stable ID predicate reads current
`isSelectable`/`isDisabled` callbacks through refs; a missing current ID is not eligible for a new
gesture. Eligibility is `mode !== 'none' && !disabled && isSelectable(item)`. It filters clicks,
ranges, select-all, controls, and marquee without pruning stored membership (AR-5).

## Interaction Mapping

`selection/useTileGridInteractions.ts` owns the event mapping. Reuse the existing interactive-target
guard and extend it for native `summary` and effective editable state, including empty-value and
`plaintext-only` editing hosts and their editable descendants. Do not treat every
`[contenteditable]` attribute as editable: `false` is a valid non-editable state. Preserve the
explicit application marker. These native interactions must not also select or activate a tile
(preflight PF-012). Use opaque IDs in maps rather than interpolating them into selectors (AR-9, AR-14).

| Target/event                                                 | Action                                                                                                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Disabled wrapper                                             | Focusable; no activation or user selection.                                                                                             |
| Enabled wrapper, none mode, click or Enter                   | Activate. No selection gesture.                                                                                                         |
| Enabled wrapper, select interaction, plain click             | Existing mode-specific selection transition if eligible.                                                                                |
| Enabled wrapper, select interaction, unmodified double-click | Activate once on `dblclick`; ordinary preceding click transitions still occur.                                                          |
| Enabled wrapper, browse interaction, plain click             | Activate immediately; no delayed double-click disambiguation.                                                                           |
| Ctrl/Cmd-click or Shift-click with selection enabled         | Existing toggle/range semantics; single mode selects without deselecting. Shift takes precedence when modifiers combine. No activation. |
| Enabled non-selectable wrapper                               | No selection control or selection transition; activation follows its interaction mode.                                                  |
| Owned checkbox change                                        | Toggle that item once, independent of browse/select interaction.                                                                        |
| Owned radio change                                           | Select that item once; never deselect it by toggling.                                                                                   |
| Application control or portalled menu                        | Its own event behavior; no tile selection/activation/marquee.                                                                           |

All supported native handlers still run once. Compose library event processing so a consumer's
`preventDefault()` for the same event vetoes the default grid action; do not overwrite native
handlers during prop spreading. Root delegation can provide this ordering for tile events.
Do not synthesize a second click from keyboard activation. Wrapper shortcuts and nested native
keyboard handling are specified in 03-02.

## Controls and Item Rendering

`TileGridSelectionControl.tsx` composes Fluent `Checkbox` or `Radio`. `checked` reflects committed
selection except during the visual marquee preview, which is transient and never notifies the
store. Selection controls use the item label as `aria-label`. Every mounted radio in one grid
shares its generated name; separate grids have different names. The wrapper remains `role=listitem`.

Isolate only library-owned controls from enclosing Fluent defaults: wrap the Checkbox branch in
the public `FieldContextProvider value={undefined}` and the Radio branch in public
`RadioGroupProvider value={undefined}` from `@fluentui/react-components`. The application content
remains outside these boundaries. An enclosing Field/RadioGroup must not assign duplicate input
IDs, change item names, require every checkbox, or override the grid's eligibility, grouping, or
checked-state ownership (preflight PF-011). These provider names and undefined values are supported
by the installed umbrella exports and provider types.

Native ancestor-form reset must not desynchronize private inputs from their rendered selection.
During the owned input's commit/ref lifecycle, synchronize its DOM `defaultChecked` property to
the same checked projection supplied to React: committed membership normally, transient preview
during marquee. Update on initial attachment and each projection change, through an SSR-safe
layout effect. Do not supply both React `checked` and `defaultChecked` props. No public selection
callback, count announcement, form-wide reset listener, or reset-to-seed behavior is introduced.
Application-driven selection changes still apply normally (preflight PF-010).

Consumer cancellation can trigger native checked-state rollback after React's controlled restore.
For a cancelled owned-input event, reconcile the still-connected input in a microtask using its
latest DOM reset default. This preserves the existing veto without a store action or stale snapshot
(runtime AR-18).

A single eligible mounted item may produce a singleton radio group. The user explicitly accepted
the narrow HTML authoring-conformance exception in preflight PF-013. Keep the real radio and its
normal selection semantics; do not add synthetic peers or fake tiles. Document this limitation.
The component maintainer revisits it if release conformance requirements change or browser/assistive
technology evidence shows a functional issue.

Position the control at the top-left with token spacing/surface colors. It is adjacent to the
content, never a label wrapping application actions. Controls are absent for none/ineligible
items. A retained ineligible selected ID still supplies `selected=true` to content (AR-5).

Give the content container a generated ID and use it for the wrapper's `aria-describedby`.
Applications place any disabled explanation in that readable content. Only disabled items receive
`aria-disabled=true`; enabled non-selectable items do not. Keep existing list names, virtualized
positions, and empty-list semantics.

`TileGridItemView` retains memoization. Isolate its `renderItem` invocation in a private memoized
content component so focus, tab-index, and control-only changes do not rerender unchanged content.
Compare ordinary stable props rather than a custom deep comparator. Resolve selected/eligible/
disabled values only for mounted wrappers; do not create per-item React state for the full list.

## Announcements

`selection/useSelectionAnnouncement.ts` observes the **effective committed** count after mount.
Start with an empty message. When that count changes, format it once with
`strings.selectionCount(count, normalizedItems.length)`; default formatting uses grouped English
counts. Read the latest formatter/total when a count change occurs. Their changes alone do not
cause a message (AR-12).

Render one visually hidden `role=status`, `aria-live=polite`, `aria-atomic=true` sibling after the
list. It is not a fake list item. Same-count replacements, no-op actions, rejected controlled
proposals, and marquee preview frames do not produce messages. Accepted external selected-ID
changes do, without firing `onSelectionChange`. Hidden/ineligible IDs count because membership
remains authoritative. Strings render as React text.

## Failure Handling and Verification

| Case                                      | Handling                                                               | Authority    |
| ----------------------------------------- | ---------------------------------------------------------------------- | ------------ |
| Missing/duplicate ID, invalid single seed | Existing normalization/warning behavior; no new data logging.          | RD-01; AR-1  |
| Predicate changes for a selected item     | Keep stored membership; recompute only eligibility/presentation props. | AR-5         |
| Parent rejects a change                   | Read the controlled source on render; no false announcement.           | RD-01; AR-12 |
| Nested control or prevented event         | No grid default action.                                                | AR-9         |

Specification cases: ST-01–ST-13, ST-36–ST-42. Existing selection/export/SSR specifications stay
unchanged. Security tests exercise hostile labels and IDs, static warnings, and no fake items.
