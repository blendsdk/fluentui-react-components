# Requirements: TileGrid Phase A

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-01 Selection and Marquee](../../requirements/RD-01-selection-and-marquee.md) — internal selection and marquee requirements
> **Source**: [RD-02 Layout and Virtualization](../../requirements/RD-02-layout-and-virtualization.md) — layout, geometry, virtualization, and package requirements
> **CodeOps Artifact Schema**: 1

## Scope of this plan (delta view)

### In this plan

**RD-02 — layout and virtualization**

- Generic `TileGrid<T>` component, `getItemId`, `getItemLabel`, `renderItem`, `renderEmpty`.
- Layout selection defaulting to `fixed`; fixed, masonry, justified, and mosaic strategies.
- Aspect-ratio fallback, span source, gap, `tileSize` bounds, columns normalization, anchor preservation.
- Container measurement through `ResizeObserver`; virtualized rendering with a two-row overscan.
- Stable keys, duplicate-ID first-occurrence policy, pure geometry result, internal geometry port.
- Phase A item-rendering args: `item`, `index`, `tileSize`, `width`, `height`, `selected`, `selectable`, `disabled`.
- Internal memoized item cell so a selection change re-renders only the affected mounted cell (PF-005).
- Internal scroll helpers and Phase A `TileGridHandle` (`selectAll`, `clearSelection`, `scrollToSelected`).
- Empty state through `strings.emptyMessage`; list semantics and `ariaLabel`/`aria-labelledby`.
- Phase A Storybook layouts, controlled `tileSize`, empty state, and named 20K benchmark; 20K performance fixture.
- Phase A package surface and export pin; README, manifest, Vite external, lockfile, and CI updates; the Phase A README section is internal/unreleased (PF-001).
- Node-environment import smoke for RD-02 AC 16 (PF-002).
- RD-02 acceptance criteria 1–13, 15–16, and the Phase A portion of 14 and 17.

**RD-01 — selection and marquee internals**

- Internal selection store: controlled/uncontrolled IDs, single/multiselect, toggle, range, select-all/clear, anchor, hidden IDs.
- Duplicate-ID policy, stable identity, no mount/prop/items callback, single-seed validation.
- Internal selectable predicate defaulting to true.
- Internal marquee controller: 4px threshold, geometry intersection, replacement/addition, commit/cancel, pointer-capture ordering, auto-scroll, background-click no-op, performance/security rules.
- 20K public selection observable proxy: select/clear/read, p95 toggle, mounted count unchanged, and render-count for the affected cell (PF-003, PF-005).
- RD-01 acceptance criteria 1–16 at the internal/controller level. Grid-level marquee integration tests remain in RD-03.

**Minimal RD-03 selection wiring (plan-local necessity, not full RD-03)**

- `selectionMode` (default `none`), `selectedIds`, `defaultSelectedIds`, `onSelectionChange`.
- Plain/Ctrl/Cmd/Shift click mapping for single and multiselect; interactive-target guard.
- Handle methods `selectAll`, `clearSelection`, `scrollToSelected`.
- Basic list semantics: `role="list"`, `role="listitem"`, `aria-setsize`, `aria-posinset`, listitem label.
- Selected/selectable/disabled render args; no rendered selection controls.
- Render-count/memoized-cell proof that one toggle changes only the affected mounted cell (PF-005).

### Deferred / out of this plan

| Source     | Deferred item                                                                                                                                                                                                                                                     | Why                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| RD-02      | `zoomable` and `onTileSizeChange`                                                                                                                                                                                                                                 | Keyboard zoom is RD-03; Phase A has controlled `tileSize` only (AR #5).           |
| RD-02      | Full final `TileGridProps<T>`, `TileGridItem`, `TileGridItemProps`, `TileGridAction`, `TileGridReorderArgs`, `TileGridDragHandleProps`, `TileGridInteractionMode`, full export pin                                                                                | RD-03/RD-04 complete the public surface (AR #2, AR #13).                          |
| RD-02      | Full photo-library recipe, toolbar, filter, actions, lightbox, arranging                                                                                                                                                                                          | RD-04. Phase A builds the layout/zoom/empty/20K benchmark stories only (AR #8).   |
| RD-03      | Selection controls, roving focus, keyboard navigation, live announcements, `isSelectable`/`isDisabled`, `interactionMode`, `enableMarquee`, marquee overlay, `onItemActivate`, `scrollResetKey`, filtering persistence, disabled focusability, full accessibility | RD-03 plan. Phase A carries only the minimal selection wiring (AR #1, AR #3).     |
| RD-04      | Tile shell, actions, overflow menu, drag/reorder, `@dnd-kit/core`, photo-library recipe, action announcements                                                                                                                                                     | RD-04 plan (AR #8).                                                               |
| Plan-local | Marquee overlay and pointer host                                                                                                                                                                                                                                  | RD-03. The Phase A controller is internal, tested, and staged (AR #4).            |
| Plan-local | Full SSR rendering and a separate E2E suite                                                                                                                                                                                                                       | A node import smoke is in scope (PF-002); the grid requires browser measurement; Vitest browser tests are the E2E. |
| Plan-local | `@dnd-kit/core`                                                                                                                                                                                                                                                   | Only RD-04 arranging uses it (AR #18).                                            |
| Plan-local | Public package release/tag and the final composed contract/export pin/full dependency set                                                                                                          | Phase A is internal; the release/contract-freeze gate is 6.3.3 and PF-001.        |

## Domain Lenses and Compatibility Boundary

The requirements README selects **Web application** and **Data and migration**. The plan records both in `00-index.md` §Domain Lenses. The package stores no persistent data and performs no migration; the consuming application owns the v8 `TilesList`/`ActorTile` replacement and persisted selection/order mapping; there is no v8 compatibility layer inside the package. The public compatibility surface is the component API (PF-006).

## Release and Contract Freeze

Phase A is internal. No `@blendsdk/fluentui-react-components` publish, release tag, or release-workflow dispatch may include the TileGrid surface until RD-03/RD-04 complete and the final composed `TileGridProps<T>`/export pin/full dependency set is frozen (PF-001). The package README section is marked “Phase A — unreleased” or deferred to v1; `pnpm pack:check` is an artifact guard, not release authorization. Phase 6 task 6.3.3 verifies the gate.

## Partial RD Coverage

RD-02 AC 14/17 and the RD-03 controls/focus/keyboard remain preflighted. The Phase A plan implements the RD-02 core and a plan-local RD-03 selection subset; the authoritative coverage table is `00-index.md` §Partial RD Coverage (PF-007).

## Plan-local decisions

| Decision            | Chosen                                                                                               | AR Ref                       |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------- |
| Phase A target      | RD-02 core + RD-01 + minimal RD-03 selection wiring; RD-03/RD-04 remainder deferred                  | AR #1                        |
| Public contract     | Phase A internal subset; later plans extend; no public release until final contract freeze           | AR #2, AR #13, PF-001        |
| Selection wiring    | Controlled/uncontrolled IDs, plain/Ctrl/Cmd/Shift clicks, handle methods; no controls/focus/keyboard | AR #3, AR #23                |
| Renderer            | Memoized item cell; stable `renderItem` identity; one selection change re-renders only the affected mounted cell | PF-005                       |
| Module evaluation   | Node-environment import smoke; no full SSR render                                                    | PF-002                       |
| 20K selection       | Public browser selection proxy plus the pure-transition microbenchmark                               | PF-003                       |
| DOM-read/offscreen  | Browser `getBoundingClientRect` spy and per-layout scroll/offscreen assertions                       | PF-004                       |
| Release gate        | No public release/tag until the final contract/export pin/dependency set is frozen                  | PF-001                       |
| Domain lenses       | Web application + Data and migration; package is not a v8 migration layer                           | PF-006                       |
| Logging             | No labels, image URLs, item IDs, or selected IDs in messages                                        | PF-009                       |
| Vitest pin          | Pin `vitest` 5.0.5 to match the exact browser-provider peer                                          | PF-008                       |
| Marquee             | Controller built and tested internally; overlay/host in RD-03                                        | AR #4                        |
| Zoom                | Controlled `tileSize` and anchor only; `zoomable`/`onTileSizeChange` deferred                        | AR #5                        |
| Scroll contract     | Grid root is the scroll container; the application sizes it                                          | AR #6                        |
| Masonry             | TanStack `lanes` plus a geometry parity test                                                         | AR #7                        |
| Virtualization      | Bands for fixed/justified/mosaic; items/lanes for masonry; two-row overscan                          | AR #12                       |
| Module layout       | `src/components/TileGrid/` with `geometry/`, `virtualization/`, `selection/`, `marquee/`             | AR #11                       |
| Test harness        | jsdom unit, separate browser/perf configs, Chromium per task, full matrix/perf in CI                 | AR #9, AR #10, AR #15–AR #17 |
| Dependencies        | TanStack 3.14.21; Vitest browser/playwright 5.0.5; Playwright 1.64.1; `vitest` pinned 5.0.5; dnd-kit later | AR #18, PF-008               |
| Mosaic ratio        | `getItemAspectRatio` accepted but does not affect cell placement                                     | AR #19                       |
| Basic accessibility | List/listitem semantics, setsize/posinset, `ariaLabel`; controls/focus/announcements later           | AR #6, AR #20                |
| Generic component   | Follow the existing `FormTextField` generic `forwardRef` assertion pattern                           | AR #22                       |
| Docs/packaging      | Internal Phase A package README (unreleased), manifest, Vite external, CI, export pin, lockfile      | AR #24, PF-001               |

## Acceptance Criteria

The RD acceptance criteria remain the owning source. Phase A is complete when:

1. [ ] Every Phase A ST case in [07-testing-strategy.md](07-testing-strategy.md) passes.
2. [ ] `pnpm verify` passes (format, skill check, type-check, build, jsdom tests).
3. [ ] `pnpm test:browser` passes in Chromium; `pnpm test:browser:all` passes in Chromium, Firefox, and WebKit in CI.
4. [ ] The Phase 4 browser selection suite records the 20K public selection toggle/clear/read, asserts p95 under 16ms and mounted wrappers unchanged; `pnpm test:perf` records the pure-transition supplement, mounted wrappers under 120 per layout, geometry recompute under 200ms, and a non-pathological scripted-scroll frame trace.
5. [ ] RD-02 geometry invariants hold for all four layouts: no overlap, container bounds, correct total height, row fill, span occupancy, and source order.
6. [ ] The 20K fixture mounts fewer than 120 item wrappers in each layout at 1440×900, 160px `tileSize`, 8px gap, aspect ratios 0.8–2.0, and two-row overscan.
7. [ ] Selection store and minimal public selection wiring pass the controlled/uncontrolled, hidden-ID, single/multiselect, click-modifier, and handle-method criteria; `onSelectionChange` never fires on mount, prop change, or item change.
8. [ ] The marquee controller passes the synthetic pointer/geometry criteria; it is internal, not exported, and not mounted in `TileGrid`.
9. [ ] The Phase A export pin includes `TileGrid` and the Phase A public types; the full final pin remains deferred to RD-03/RD-04.
10. [ ] Package README, `package.json`, Vite externals, CI workflow, `turbo.json`, and lockfile are updated; `pnpm pack:check` passes after a build when the toolchain is available.
11. [ ] No regressions in the existing component tests, Storybook build, or package export surface.
12. [ ] No exported dead code; the staged internal marquee controller is documented as consumed by the RD-03 plan.
13. [ ] The node-environment import smoke passes: importing the package/`TileGrid` in Node does not access `window`/`document` at module evaluation (RD-02 AC 16).
14. [ ] The renderer DOM-read/offscreen test passes for all four layouts, and the memoized-cell render-count test proves one toggle calls `renderItem` only for the affected mounted item (RD-02 AC 12, RD-03 performance).
15. [ ] No public publish/tag/release dispatch includes the TileGrid surface until RD-03/RD-04 complete and the final contract/export pin/dependency set is frozen; the Phase A package README is marked unreleased.
16. [ ] Dev warnings and diagnostics never include item labels, image URLs, item IDs, or selected IDs (RD-01/RD-02 security).
17. [ ] The Web application + Data and migration lenses and the compatibility boundary are recorded in `00-index.md` and referenced from this document.
