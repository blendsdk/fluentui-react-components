# Current State: TileGrid RD-04

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

TileGrid already ships the RD-01/RD-02/RD-03 internals: normalized items, the four-layout
geometry engine, TanStack virtualizer, mounted-window selection, roving focus, marquee, filtering
resets, keyboard zoom, and the polite selection announcement. The package root intentionally does
not export TileGrid while the contract is unfinished.

| File                                                            | Purpose                                                           | Changes Needed                                                                          |
| --------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/components/TileGrid/TileGrid.types.ts`                     | Public props, strings, render args, handle                        | Add reorder props, reorder payload, action and handle types, render-arg fields, strings |
| `src/components/TileGrid/TileGrid.tsx`                          | Callable generic wrapper and imperative handle                    | No structural change; state passes through                                              |
| `src/components/TileGrid/useTileGrid.ts`                        | Resolves props, geometry, selection, focus, marquee, announcement | Add reorder controller, resolved strings, reorder actions, combined announcement        |
| `src/components/TileGrid/renderTileGrid.tsx`                    | Root list, mounted items, marquee, live region                    | Add `DndContext`, overlay, drop indicator, reorder args                                 |
| `src/components/TileGrid/TileGridItemView.tsx`                  | Memoized list item and selection control                          | Add droppable and draggable wiring, reorder render args                                 |
| `src/components/TileGrid/selection/useTileGridInteractions.ts`  | Root click, change, and key delegation                            | No behavior change; action isolation already skips interactive targets                  |
| `src/components/TileGrid/selection/useSelectionAnnouncement.ts` | Selection-count message                                           | Generalize into a shared live-announcement channel                                      |
| `src/components/TileGrid/geometry/`                             | Layout rectangles, bands, point/range queries                     | Add an insertion helper that uses mounted rectangles without a full scan                |
| `src/components/TileGrid/useTileGridStyles.styles.ts`           | Grid, control, marquee, status styles                             | Add indicator and drag-state styles                                                     |
| `src/index.ts`                                                  | Package-root exports                                              | Export TileGrid, TileGridItem, and public types                                         |
| `test/package-exports.spec.test.ts`                             | Exact runtime export pin and type checks                          | Replace the “TileGrid absent” expectation                                               |
| `package.json` / `vite.config.ts`                               | Dependencies and externals                                        | Add `@dnd-kit/core`, externalize `@dnd-kit/`                                            |
| `README.md`                                                     | Public contract                                                   | Document actions, drag, keyboard, strings, recipe; keep the unreleased banner           |

### Code Analysis

- `TileGridProps` already omits `children`, `role`, `aria-label`, `tabIndex`, and
  `dangerouslySetInnerHTML`; adding reorder props does not change that ownership.
- `TileGridItemRenderArgs` carries `item`, `index`, `tileSize`, `width`, `height`, `selected`,
  `selectable`, and `disabled`. RD-04 extends this object; the memoized content comparison must
  include the new drag fields or the source tile will not change appearance during a drag.
- `renderTileGrid` owns the single polite live region (`role="status"`). Selection writes to it
  today; reorder must share it rather than add a second region with competing announcements.
- The marquee canvas proves the pattern for pointer-transparent decoration that must not enlarge
  the scroll extent. The drop indicator should reuse that pattern.
- `computeGeometry` exposes `indexAtPoint`, which scans every rectangle. A drag move at 20K items
  must not use that scan; the reorder collision uses only mounted droppables.
- `clickSelection.ts` already treats buttons, links, inputs, and contenteditable targets as
  interactive, so action buttons and the drag handle do not select or activate the tile. Menu
  content renders in a portal outside the root, so delegated tile handlers never see it.
- The 20K fixture in `test/fixtures/tileGridFixture.ts` already provides deterministic data-URL
  thumbnails, so the recipe needs no network and no new fixture.

## Gaps Identified

### Gap 1: No arranging layer

**Current Behavior:** No reorder props, drag context, handle, overlay, indicator, auto-scroll, or
`onReorder` payload exists.
**Required Behavior:** RD-04 arranging requirements 1–17.
**Fix Required:** Add the reorder module and wire it through state, item view, and renderer.

### Gap 2: No tile shell or action model

**Current Behavior:** `renderItem` is the only content channel; there is no `TileGridItem`, action
type, overflow menu, or reorder menu action.
**Required Behavior:** RD-04 shell and action requirements.
**Fix Required:** Add the `TileGridItem` component and its action/menu integration.

### Gap 3: Announcement is selection-only

**Current Behavior:** `useSelectionAnnouncement` formats only committed selection counts.
**Required Behavior:** Reorder and selection share one polite region; the latest event is announced.
**Fix Required:** Replace the hook with a channel that both features write to.

### Gap 4: Package surface still excludes TileGrid

**Current Behavior:** `test/package-exports.spec.test.ts` asserts TileGrid is absent.
**Required Behavior:** Complete TileGrid and TileGridItem export surface.
**Fix Required:** Update `src/index.ts`, the export pin, and the declaration build verification.

### Gap 5: Documentation and recipe are absent

**Current Behavior:** README documents the unreleased TileGrid without actions or drag; stories
cover layouts, selection, marquee, filtering, zoom, keyboard, and the 20K benchmark only.
**Required Behavior:** RD-04 stories, README sections, and the 20K photo-library recipe.
**Fix Required:** Add both story sets and the recipe story, then update README.

## Dependencies

### Internal Dependencies

- Geometry rectangles and bands.
- Virtualizer mounted window.
- Selection store and `isSelectable` / `isDisabled` predicates.
- Focus controller and tab order.
- Marquee controller and canvas pattern.
- Polite live region.

### External Dependencies

- `@tanstack/react-virtual` 3.14.21 (existing direct dependency).
- `@dnd-kit/core` 6.3.1 (new direct dependency, approved by requirements AR #11).
- Fluent UI v9, React 19, and `@fluentui/react-icons` (existing peers).

## Risks and Concerns

| Risk                                                               | Likelihood | Impact | Mitigation                                                                                              |
| ------------------------------------------------------------------ | ---------- | ------ | ------------------------------------------------------------------------------------------------------- |
| Pointer drag behaves differently across Chromium, Firefox, WebKit  | Medium     | High   | Drive real pointer input in the existing browser matrix; pin cancel and pointer-capture ordering        |
| Mounted droppables miss an insertion boundary at the viewport edge | Low        | Medium | Auto-scroll updates the mounted window; clamp to the collection and test the end boundary               |
| A controlled order update arrives late and the tile snaps back     | Medium     | Medium | No optimistic internal order; tests apply `orderedIds` before asserting the final order                 |
| Drag and marquee or selection gestures conflict                    | Low        | High   | Start drag only from the handle; marquee still starts only on the root; action isolation already exists |
| dnd-kit import breaks the SSR smoke                                | Low        | High   | Keep the import module-level and add a shell SSR smoke in the node environment                          |
| 20K recipe slows Storybook                                         | Medium     | Medium | Reuse the virtualized 20K fixture and mounted-window limits; assert fewer than 120 tiles                |
