# Testing Strategy: TileGrid Phase A

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)
> **CodeOps Artifact Schema**: 1

## Testing Overview

### Coverage Goals

| Code type                         | Target                  |
| --------------------------------- | ----------------------- |
| Pure geometry engine              | 90% statements/branches |
| Selection store and click mapping | 90%                     |
| TileGrid component/state/render   | 80%                     |
| Styles, stories, glue             | 60%                     |

- Test names state behavior: `should [expected behavior] when [condition]`.
- Specification tests are derived from the RD acceptance criteria and the plan's `03-*` specs. They are written before implementation and are the immutable oracle.
- Implementation tests cover pure geometry edge cases, store transitions, virtualizer parity, and controller edge cases after implementation.
- Browser tests are the end-to-end coverage for measurement, scrolling, pointer selection, and mounted counts. No second E2E runner is added.
- No snapshot files are used for layout (RD-02 AC 2).

## 🚨 Specification Test Cases

> These cases are derived from RD-01/RD-02 and the plan's `03-*` specifications. They define expected behavior before implementation. Do not change an expectation to match the code; a failing spec test means the implementation is wrong.

### Geometry and normalization

| #     | Input / Scenario                                                                                                                       | Expected Output / Behavior                                                                                                                                     | Source                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| ST-1  | Fixed layout; 5 items; container `440`; `tileSize=100`; `gap=10`; `tileAspectRatio=1`; no `columns`                                    | 4 columns; item width/height `102.5`; item x `0,112.5,225,337.5,0`; item y `0,0,0,0,112.5`; `totalHeight=215`; bands `[0,102.5]` and `[112.5,102.5]`           | RD-02 §Fixed layout; 03-01 §Fixed                   |
| ST-2  | Fixed layout; 4 items; container `640`; `tileSize=160`; `gap=8`; `tileAspectRatio=2`; `columns=4`                                      | 4 columns; width `154`; height `77`; x `0,162,324,486`; y `0`; `totalHeight=77`                                                                                | RD-02 §Fixed layout, AC 3                           |
| ST-3  | Masonry; 4 items all ratio `1`; container `350`; `tileSize=100`; `gap=10`; 3 automatic columns                                         | Column width `110`; items 0–2 at lanes 0,1,2 with `y=0`; item 3 chooses lane 0 at `y=120`; `totalHeight=230`                                                   | RD-02 §Masonry layout, AC 4                         |
| ST-4  | Masonry; item 0 ratio `2` (height `55`), items 1–3 ratio `1`; same grid as ST-3                                                        | Item 3 chooses lane 0 at `y=65` (shortest lane), not the leftmost-by-index lane; `totalHeight=175`                                                             | RD-02 §Masonry layout                               |
| ST-5  | Justified; 4 items ratio `1`; container `360`; `tileSize=100`; `gap=0`                                                                 | Row 0 has items 0–2 scaled to `120×120` at x `0,120,240`; row 1 has item 3 at `100×100`, x `0`, y `120`; `totalHeight=220`                                     | RD-02 §Justified layout, AC 5                       |
| ST-6  | Mosaic; 6 items; container `430`; `tileSize=100`; `gap=10`; `columns=4`; item 0 spans `2×2`, items 1–5 span `1×1`                      | Item 0 rect `0,0,210,210`; item 1 `220,0,100,100`; item 2 `330,0`; item 3 `220,110`; item 4 `330,110`; item 5 `0,220`; `totalHeight=320`                       | RD-02 §Mosaic layout, AC 6                          |
| ST-7  | Masonry/justified; `getItemAspectRatio` returns `undefined`, `null`, `NaN`, `0`, `-1`, or `Infinity`; `fallbackAspectRatio=1`          | The item uses ratio `1`; no image measurement or reflow; invalid `fallbackAspectRatio`/`tileAspectRatio` also fall back to `1`                                 | RD-02 §Aspect ratio, AC 7                           |
| ST-8  | `columns=0`, `3.9`, `Infinity`; `gap=-5`/`Infinity`; `minTileSize=400`, `maxTileSize=300`, `tileSize=350`                              | `columns` → `1`, `3`, automatic; `gap` → `0`; `minTileSize` clamps to `300`, `tileSize` clamps to `300`; development warning for min > max                     | RD-02 §Gap, §tileSize bounds, §Columns, AC 15       |
| ST-9  | Items `[a,b,a]`; `normalizeItems` / `computeGeometry`                                                                                  | Normalized items are `[a,b]`; `itemRects` has two entries with unique IDs; the duplicate ID `a` is returned for the component warning; no duplicate rectangles | RD-02 §Stable keys, AC 15                           |
| ST-10 | Mosaic `getItemSpan` returns `{columns:3,rows:0}` on a 4-column grid                                                                   | Clamp to `{columns:2,rows:1}` or the available columns; no rectangle overflows                                                                                 | RD-02 §Mosaic layout                                |
| ST-11 | Fixed/masonry/mosaic results; query `firstVisibleItem`, `offsetForItem`, `indexAtPoint`, `itemsInRange` at known scroll offsets/ranges | Returns the item IDs/rects defined by 03-01; masonry uses topmost-then-leftmost; mosaic includes spanning items in `itemsInRange`                              | RD-02 §Geometry result                              |
| ST-12 | Container width `0`; items non-empty                                                                                                   | Geometry returns empty rectangles/bands, `totalHeight=0`, `columnCount=1`; component renders spacer `0` and no item wrappers                                   | RD-02 §Container measurement; 03-01 §Error handling |

### Virtualization, component, and list semantics

| #     | Input / Scenario                                                                              | Expected Output / Behavior                                                                                                    | Source                                            |
| ----- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| ST-13 | 20K fixture; 1440×900; `tileSize=160`; `gap=8`; ratios 0.8–2.0; two-row overscan; each layout | Each layout mounts fewer than 120 `[data-tile-grid-item]` wrappers after initial paint                                        | RD-02 §Virtualized rendering, AC 1                |
| ST-14 | Masonry 20K; scroll from top to middle to bottom                                              | Mounted wrappers stay bounded by the visible vertical window; never a whole-column set; no offscreen wrappers                 | RD-02 §Masonry layout, AC 4; AR #7                |
| ST-15 | Fixed 20K; scroll to item 500; change `tileSize` from `160` to `200`                          | Same first visible item ID; pixel offset preserved within `[0, item height]`; no jump to top                                  | RD-02 §Anchor preservation, AC 8                  |
| ST-16 | `items=[]`; no `renderEmpty`; default `strings`                                               | Renders `'No items'` inside the named root                                                                                    | RD-02 §Empty state, AC 10                         |
| ST-17 | `items=[]`; `renderEmpty` supplied; custom `strings.emptyMessage`                             | `renderEmpty()` wins over the string; the string is not rendered                                                              | RD-02 §Empty state; 03-04 §Empty                  |
| ST-18 | Render with items; inspect the root and wrappers                                              | Root `role="list"`; each item `role="listitem"`, `aria-setsize=N`, `aria-posinset=index+1`, `aria-label=getItemLabel(item)`   | RD-03 §List semantics; 03-04 §DOM                 |
| ST-19 | `ariaLabel="Photos"`; then native `aria-labelledby`; then neither                             | `aria-label` is set; `aria-labelledby` wins when both are present; neither produces a development warning                     | RD-02 §Public props; 03-04 §DOM                   |
| ST-20 | Duplicate IDs; invalid numeric props                                                          | First occurrence only; warn once; no item-content logging; clamping is visible in the rects                                   | RD-02 §Security, AC 15                            |
| ST-21 | 20K fixture with an `<img>` in `renderItem`                                                   | Number of `<img>` elements is bounded by mounted items (under 120), not 20K; the component itself never fetches or logs a URL | RD-02 §Image rendering contract, AC 13, §Security |
| ST-22 | Width change through the `ResizeObserver` stub/browser resize                                 | Geometry recomputes; visible wrappers update; no full remount; mounted count stays bounded                                    | RD-02 §Container measurement                      |

### Selection

| #     | Input / Scenario                                                                                | Expected Output / Behavior                                                                                                                                        | Source                                                |
| ----- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| ST-23 | Controlled `selectedIds={'a','b'}`; items initially empty, then load `a,b,c`                    | Both render selected before and after load; no `onSelectionChange`                                                                                                | RD-03 §Controlled selection, §Seeded selection; AR #3 |
| ST-24 | Selected set `{'z'}` (hidden); Ctrl-click `a`; then plain-click `b`                             | Ctrl-click yields `{'z','a'}`; plain-click yields `{'b'}` (hidden `z` cleared by replace)                                                                         | RD-01 §Unknown IDs; RD-03 §Multiselect clicks         |
| ST-25 | Multiselect items `a–e`; plain-click `b`; Shift-click `d`; Ctrl-click `d`; Ctrl-click `d` again | Plain `b` → `{'b'}`; Shift `d` → `{'b','c','d'}` (anchor stays `b`); Ctrl `d` → `{'b','c'}`; Ctrl `d` again → `{'b','c','d'}` (anchor moves to `d` on the toggle) | RD-03 §Multiselect clicks; RD-01 §Range               |
| ST-26 | Single mode; selected `{'a'}`; click `b`; click `b` again                                       | `{'b'}` then unchanged `{'b'}`; no callback on the second click; no deselect by toggle                                                                            | RD-03 §Single-select clicks                           |
| ST-27 | `selectionMode='none'`; click any tile                                                          | No selection callback; `selected` is false for every render arg                                                                                                   | RD-03 §None mode; AR #3                               |
| ST-28 | Controlled prop changes and item changes after mount                                            | `onSelectionChange` fires zero times for mount, prop change, or item change                                                                                       | RD-03 §No mount callback; RD-01                       |
| ST-29 | Single mode; `defaultSelectedIds=['a','b']`                                                     | Development warning; only `a` renders selected; no callback on initialization                                                                                     | RD-03 §Single-select seed validation                  |
| ST-30 | Multiselect; hidden `z`; handle `selectAll` over `a,b,c`; then `clearSelection`                 | `{'z','a','b','c'}`, one callback; clear → `{}`, one callback; single/none `selectAll` → no callback + warning                                                    | RD-03 §Select-all/clear API; AR #23                   |
| ST-31 | `renderItem` contains `<button>`; click the button, then the tile area                          | Button click does not select; tile-area click selects                                                                                                             | RD-03 §Action isolation; AR #3                        |
| ST-32 | Render args after selection                                                                     | `selected` reflects the effective store; `selectable` is true; `disabled` is false in Phase A                                                                     | 03-04 §DOM; AR #3                                     |
| ST-33 | 20K selected-ID set; 200 toggles through the pure transition helper (supplement)                | p95 under 16ms; no per-item React state; no 20K wrapper render; the public proxy is ST-47                                                                          | RD-01 §Performance; RD-02 §Performance; PF-003        |
| ST-34 | Handle `scrollToSelected` with selected item `150` in a 200-item browser grid                   | Item 150's wrapper intersects the root viewport; no selection callback                                                                                            | RD-03 §Scrolling to selection; AR #23                 |

### Marquee controller

| #     | Input / Scenario                                                     | Expected Output / Behavior                                                                                         | Source                                      |
| ----- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| ST-35 | Pointer down at `(10,10)`, move to `(12,12)` (under 4px), pointer up | No active marquee, no commit/cancel selection callback; background click is a no-op                                | RD-01 §Marquee threshold, AC 15             |
| ST-36 | Pointer down, move past 4px over item `a`; plain gesture             | Preview `{'a'}`; commit `{'a'}` exactly once                                                                       | RD-01 §Marquee replacement, §Marquee commit |
| ST-37 | Same with Shift/Ctrl additive; pre-selection `{'z'}`                 | Preview/commit `{'z','a'}`; never removes the pre-selection                                                        | RD-01 §Marquee addition, AC 9               |
| ST-38 | Active gesture; Escape or `pointercancel`; then release              | `onCancel(preSelection)`; no `onCommit`; rect cleared                                                              | RD-01 §Marquee cancel, AC 10                |
| ST-39 | Active gesture; `pointerup` then `lostpointercapture`                | Commit once; the later capture-loss event does not revert the committed set                                        | RD-01 §Marquee cancel/commit, AC 10         |
| ST-40 | Active gesture near the bottom/top edge; injected frame scheduler    | Calls `geometry.scrollBy` with the correct sign; recomputes preview; stops on pointer-up/cancel                    | RD-01 §Auto-scroll, AC 11                   |
| ST-41 | Active gesture over visible item IDs                                 | Uses `getItemRect`/geometry; never calls `getBoundingClientRect()` on each item; preview is bounded by visible IDs | RD-01 §Geometry source, AC 12               |
| ST-42 | `dispose()` during an active gesture                                 | Stops the frame loop; releases capture; no commit/cancel callback                                                  | 03-03 §Error handling                       |

### Package, security, and verification

| #     | Input / Scenario                                            | Expected Output / Behavior                                                                                                                                                                                | Source                                                 |
| ----- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| ST-43 | Import the package root                                     | `TileGrid` is a runtime export; `TileGridProps`, `TileGridHandle`, `TileGridItemRenderArgs`, `TileGridLayout`, `TileGridSelectionMode`, `TileGridStrings` compile; no RD-04 symbol is required in Phase A | RD-02 §Package surface (Phase A subset); AR #2, AR #13 |
| ST-44 | `renderItem` with hostile-looking text and URL-like strings | Text renders as text, never HTML; the component does not log labels, URLs, item IDs, or selected IDs, and does not fetch images                                                                          | RD-02 §Security; RD-01 §Security; PF-009               |
| ST-45 | `pnpm test:browser` / `pnpm test:perf` smoke                | The browser config runs the browser smoke; the perf config runs the 20K measurement; no second runner is required                                                                                         | AR #9, AR #10, AR #18                                  |
| ST-46 | Node environment; import `../src/index` and `TileGrid`; no render | Import succeeds without throwing and without accessing `window`/`document` at module evaluation; no `renderToString` is used                                                                              | RD-02 AC 16; PF-002                                    |
| ST-47 | Browser; 20K fixture; public controlled selection; select/clear/read; 200 toggles | p95 under 16ms; mounted `[data-tile-grid-item]` count unchanged; no 20K React state; one toggle changes only the affected mounted output                                                                 | RD-01 AC 13; RD-03 §Performance; PF-003                |
| ST-48 | Browser; scroll each of the four 20K layouts; spy on `Element.prototype.getBoundingClientRect` | Mounted indexes stay within the visible-plus-overscan window; zero calls on `[data-tile-grid-item]`; no offscreen wrappers                                                                                | RD-02 AC 12; PF-004                                    |
| ST-49 | Browser; stable `renderItem` spy; toggle one selected tile in a 20K grid | Only the affected mounted cell calls `renderItem` again; mounted count unchanged; the other visible cells do not re-render; an unstable renderer would re-render all visible cells and is documented | RD-03 §Performance; PF-005                             |

## Test Categories

### Specification Tests

| Test file                                           | ST cases                  | Component                                  |
| --------------------------------------------------- | ------------------------- | ------------------------------------------ |
| `test/tile-grid-geometry.spec.test.ts`              | ST-1–ST-12                | Geometry engine (pure)                     |
| `test/tile-grid-layout.spec.test.tsx`               | ST-16–ST-20, ST-44        | Public TileGrid layout/empty/list/security |
| `test/tile-grid-selection.spec.test.tsx`            | ST-23–ST-32               | Public selection/click/handle              |
| `test/tile-grid-marquee.spec.test.ts`               | ST-35–ST-42               | Marquee controller                         |
| `test/package-exports.spec.test.ts`                 | ST-43                     | Package surface                            |
| `test/tile-grid-ssr.spec.test.ts`                   | ST-46                     | Node import/module-evaluation smoke        |
| `test/browser/tile-grid-harness.browser.test.tsx`   | ST-45                     | Browser harness smoke                      |
| `test/perf/tile-grid-harness.perf.test.tsx`         | ST-45                     | Performance harness smoke                  |
| `test/browser/tile-grid-layout.browser.test.tsx`    | ST-13–ST-15, ST-21, ST-22, ST-48 | Browser measurement/virtualization/DOM reads |
| `test/browser/tile-grid-selection.browser.test.tsx` | ST-34, ST-47, ST-49       | Browser selection/perf/render count        |
| `test/perf/tile-grid.perf.test.tsx`                 | ST-13, ST-33 (supplement) | Geometry/mounted/scroll budgets            |

### Implementation Tests

| Test file                                  | Description                                                               | Priority |
| ------------------------------------------ | ------------------------------------------------------------------------- | -------- |
| `test/tile-grid-geometry.impl.test.ts`     | Normalization edge cases, extra invariants, band/range helpers            | High     |
| `test/tile-grid-layout.impl.test.tsx`      | Zero width, duplicates, warnings, memoized cell props/stable callbacks    | High     |
| `test/tile-grid-selection.impl.test.tsx`   | Store transition table, controlled/uncontrolled, anchor, warnings         | High     |
| `test/tile-grid-marquee.impl.test.ts`      | Capture unavailable, dispose, boundary clamps, additive hidden IDs        | Medium   |
| `test/tile-grid-virtualizer.impl.test.tsx` | Band starts/total parity; masonry lane/start parity; scroll helper clamps | High     |

### Integration / Browser Tests

| Test                    | Components                                      | Description                                                              |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| Layout browser suite    | TileGrid, geometry, virtualizer, ResizeObserver | 20K mounting, anchor, image bound, width changes, DOM-read/offscreen      |
| Selection browser suite | TileGrid, selection store, handle, TileGridItemView | Real clicks, modifiers, handle scroll, 20K public proxy, render count |
| Performance suite       | Geometry, TileGrid, selection transitions       | Geometry/mounted/scroll budgets; pure selection supplement               |

### End-to-End Tests

**N/A** — the package ships a component library, not an application. The browser suite exercises the real browser rendering, pointer, scroll, and measurement path; a separate E2E runner would not add coverage and would introduce a second harness (AR #21).

## Test Data

### Fixtures

- `test/fixtures/tileGridFixture.ts` — deterministic 20K/small fixture, aspect ratios `[0.8, 1, 1.25, 1.5, 2]`, five data-URL thumbnails.
- `test/fixtures/tileGridGeometryFixtures.ts` (optional) — small item arrays for the hand-computed ST-1–ST-6 cases.
- The stories and browser/perf tests import the same fixture module.

### Mocks

- `ResizeObserver` and pointer-capture stubs only when jsdom lacks the API.
- Injected `requestFrame`/`cancelFrame` for the marquee auto-scroll unit test.
- `vi.spyOn(console, 'warn')` for development warnings; restore after each test.
- No image/network mocks; data URLs and element counts are used instead.

## Verification Checklist

- [ ] All specification test cases (ST-1–ST-49) are defined with concrete input/output.
- [ ] Every ST case traces to an RD, a `03-*` spec, or an AR/PF entry.
- [ ] Spec tests are written before implementation and verified to fail first.
- [ ] Spec tests pass after implementation; failures are fixed in the implementation, not the tests.
- [ ] Implementation tests cover geometry normalization, store transitions, virtualizer parity, memoized-cell behavior, and controller edge cases.
- [ ] Browser suite passes in Chromium locally and in the three-browser matrix in CI.
- [ ] The node import smoke passes in the node environment (ST-46).
- [ ] The 20K public selection proxy and affected-cell render count pass (ST-47/ST-49).
- [ ] The renderer DOM-read/offscreen assertions pass for all four layouts (ST-48).
- [ ] Performance suite records/asserts the geometry/mounted/scroll budgets; the public selection proxy is in the Phase 4 browser suite.
- [ ] `vitest` is pinned to 5.0.5; no warning/error in the browser-provider peer resolution (PF-008).
- [ ] No public publish/tag occurs before the final contract freeze (PF-001).
- [ ] No regressions in the existing tests, Storybook build, or export pin.
- [ ] `pnpm verify`, `pnpm test:browser`, `pnpm test:browser:all`, and `pnpm test:perf` pass.
