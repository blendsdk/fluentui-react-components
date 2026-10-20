# Execution Plan: TileGrid Phase A

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-10-20 23:48
> **Progress**: 26/69 tasks (38%)
> **CodeOps Artifact Schema**: 1

## Overview

Implementation of the Phase A TileGrid foundation: test harness, geometry engine, four layouts, virtualization and scrolling, controlled `tileSize`, a shared 20K benchmark, the selection store, minimal public selection wiring, and the internal marquee controller. Every feature phase follows the specification-first order: spec tests → red phase → implementation → green phase → implementation tests → verification.

The plan assumes the project toolchain is available (`node` 22+, `pnpm` 12.11.2). This planning workspace has no Node/pnpm, so every `pnpm` task is executed by the user's execution environment, not by the planner.

**🚨 Update this document after EACH completed task!**

## Implementation Phases

| Phase | Title                                     | Tasks |
| ----- | ----------------------------------------- | ----- |
| 1     | Test harness and dependency foundation    | 10    |
| 2     | Geometry engine and core TileGrid         | 16    |
| 3     | Virtualization, scrolling, and 20K        | 14    |
| 4     | Selection store and public selection      | 12    |
| 5     | Marquee controller                        | 8     |
| 6     | Performance, docs, and final verification | 9     |

**Total: 69 tasks across 6 phases** (no fabricated hour estimates — scope is bounded by the task-size criteria in `quality-checklist.md`)

> **⚠️ EXECUTION RULE — APPLIES TO EVERY AGENT EXECUTING THIS PLAN:**
>
> The task checkboxes in the phase sections below are the **single source of truth** for progress. Every task line appears exactly once in this document. The executing agent MUST:
>
> 1. **On implementation:** mark the task `[~]` with a timestamp — `- [~] 1.1.1 Task description ⏳ (implemented: YYYY-MM-DD HH:MM)`.
> 2. **On verify pass:** promote it to `[x]` — `- [x] 1.1.1 Task description ✅ (completed: YYYY-MM-DD HH:MM)`.
> 3. **Update the Progress header** (`> **Progress**: X/Y tasks (Z%)`) and the Last Updated stamp after EVERY task — never batch updates. Only `[x]` counts as complete.
> 4. **Resume** by scanning the phase sections top-to-bottom: the first `[~]` task is resumed first, else the first `[ ]` task.
> 5. **On blocker:** mark the task `[!]` and append `Blocked: <short reason>` on the same line. The plan lifecycle is `Ready`, `Executing`, `Done`, or `Blocked`, derived from these markers.
>
> Timestamps come from `date '+%Y-%m-%d %H:%M'` — never invented. Failure to keep the marks current means progress is invisible after crashes, context resets, or session handoffs.
>
> **Formatting:** run `pnpm format` before a phase `Verify` when the phase adds or changes files. `pnpm verify` runs `format:check`, so an unformatted diff (including these plan documents) fails the gate.
>
> **Performance gate:** `pnpm test:perf` is the harness smoke until Phase 6. The public 20K selection proxy is asserted in the Phase 4 browser selection suite (ST-47/ST-49); the geometry/scroll budgets are asserted by the real performance test in Phase 6. Early phase gates must not be read as proof of the final performance budgets (PF-010).

---

## Phase 1: Test harness and dependency foundation

> **Phase baseline tree**: `a457b37a4a4ece10fd86ff83ecca721642f8d7b2`
> **Lenses**: `api-surface` (package/test surface)
> **Reasoning**: medium — bounded infrastructure work using existing repository patterns; no product behavior.

### Step 1.1: Harness specification smoke tests

**Reference**: 03-05 §Harness architecture, §Test data; ST-45; AR #9, AR #10, AR #18.
**Objective**: Define the browser and performance harness behavior before the configs exist.

- [x] 1.1.1 [spec-author] Write harness smoke tests: `test/browser/tile-grid-harness.browser.test.tsx` and `test/perf/tile-grid-harness.perf.test.tsx` — ST-45 ✅ (completed: 2026-10-20 21:48)
- [x] 1.1.2 Run `pnpm test:browser` and `pnpm test:perf`; verify they fail because the scripts/configs/fixture do not exist (red phase) ✅ (completed: 2026-10-20 21:49)

**Deliverables**:

- [x] The two harness smoke test files exist and import the planned fixture/API.
- [x] The red-phase result: both commands were absent (exit 1); recorded in task 1.1.2.

### Step 1.2: Harness implementation and smoke green

**Reference**: 03-05 §Dependencies and scripts, §Vitest configurations, §jsdom stubs, §Shared fixture; AR #9, AR #10, AR #18, AR #20.
**Objective**: Add the pinned dependencies, configs, setup stubs, scripts, and shared fixture.

- [x] 1.2.1 Update the root `package.json` with browser/perf command wrappers and `packages/react-components/package.json` with `@tanstack/react-virtual`, `vitest` pinned to `5.0.5`, the browser/perf dev dependencies, and the package scripts; run `pnpm install` to update `pnpm-lock.yaml` — 03-05 §Dependencies; PF-008 ✅ (completed: 2026-10-20 21:50)
- [x] 1.2.2 Add `vitest.browser.config.ts` and `vitest.browser-matrix.config.ts` — 03-05 §Vitest configurations ✅ (completed: 2026-10-20 21:50)
- [x] 1.2.3 Add `vitest.perf.config.ts`, update `vitest.config.ts` to exclude `test/browser/**`/`test/perf/**`, and add the new config files to `tsconfig.json` — 03-05 §Vitest configurations ✅ (completed: 2026-10-20 21:50)
- [x] 1.2.4 Add `test/jsdomStubs.ts`, update `test/setup.ts`, and add `test/fixtures/tileGridFixture.ts` — 03-05 §jsdom stubs, §Shared 20K fixture ✅ (completed: 2026-10-20 21:51)
- [x] 1.2.5 Install Chromium if needed (`pnpm --filter @blendsdk/fluentui-react-components exec playwright install chromium`), then run `pnpm test:browser` and `pnpm test:perf`; verify the smoke tests pass (green phase) ✅ (completed: 2026-10-20 21:53)

**Deliverables**:

- [x] `pnpm test:browser` runs Chromium and passes the browser smoke.
- [x] `pnpm test:perf` runs Chromium and passes the performance smoke.
- [x] `pnpm test` remains jsdom-only and passes.

### Step 1.3: Build and CI wiring

**Reference**: 03-05 §CI jobs; AR #9, AR #18, AR #24.
**Objective**: Externalize TanStack, wire Turbo inputs, and add the CI browser-matrix/performance jobs.

- [x] 1.3.1 Update `packages/react-components/vite.config.ts` to externalize `/^@tanstack\//`; update `turbo.json` test/Storybook/type-check inputs for fixtures, browser/perf tests, and the new Vitest configs — 03-05 §Dependencies, §CI jobs ✅ (completed: 2026-10-20 21:53)
- [x] 1.3.2 Add the `browser-matrix` and `performance` jobs to `.github/workflows/ci.yml` — 03-05 §CI jobs ✅ (completed: 2026-10-20 21:54)
- [x] 1.3.3 Run `pnpm format` (it also formats these plan documents), then `pnpm verify && pnpm test:browser && pnpm test:perf`; phase gate ✅ (completed: 2026-10-20 21:58)

**Deliverables**:

- [x] The manifest, lockfile, configs, Vite external, Turbo inputs, and CI jobs are consistent.
- [x] All Phase 1 verification passes.

**Verify**: `pnpm verify && pnpm test:browser && pnpm test:perf`

---

## Phase 2: Geometry engine and core TileGrid

> **Phase baseline tree**: `448a46210f7690039a2289db8e3b530dd01d2635`
> **Lenses**: `api-surface`, `perf`
> **Reasoning**: high — geometry correctness and the public component contract; small errors cascade through every later phase.

### Step 2.1: Geometry and core component specification tests

**Reference**: 03-01 §Types–§Layout algorithms; 03-04 §Public types–§DOM; ST-1–ST-12, ST-16–ST-20, ST-44, ST-46; AR #6, AR #13, AR #19, PF-002.
**Objective**: Write the pure geometry oracle, the core public component contract, and the node import smoke before implementation.

- [x] 2.1.1 [spec-author] Write `test/tile-grid-geometry.spec.test.ts` covering ST-1–ST-12 — 03-01 ✅ (completed: 2026-10-20 22:33)
- [x] 2.1.2 [spec-author] Write `test/tile-grid-layout.spec.test.tsx` covering ST-16–ST-20/ST-44 and `test/tile-grid-ssr.spec.test.ts` covering ST-46 (core layout/empty/list/warnings/security and node import; selection cases deferred) — 03-04; PF-002 ✅ (completed: 2026-10-20 22:33)
- [x] 2.1.3 Run `pnpm --filter @blendsdk/fluentui-react-components test -- test/tile-grid-geometry.spec.test.ts test/tile-grid-layout.spec.test.tsx test/tile-grid-ssr.spec.test.ts`; verify the tests fail because the geometry/component do not exist (red phase) ✅ (completed: 2026-10-20 22:34)

**Deliverables**:

- [x] Hand-computed geometry cases, component contract cases, and the node import smoke exist.
- [x] The red-phase result is recorded.

### Step 2.2: Geometry engine and core component implementation

**Reference**: 03-01; 03-04 §Public types–§Styles; AR #6, AR #13, AR #19.
**Objective**: Implement the pure geometry engine, the Phase A core types, the `TileGrid` shell, measurement, and small-fixture rendering.

- [x] 2.2.1 Add `geometry/types.ts`, `geometry/columnCount.ts`, and `geometry/normalize.ts` — 03-01 §Types, §Normalization, §Column count ✅ (completed: 2026-10-20 22:39)
- [x] 2.2.2 Add `geometry/fixedLayout.ts` and `geometry/masonryLayout.ts` — 03-01 §Fixed, §Masonry ✅ (completed: 2026-10-20 22:39)
- [x] 2.2.3 Add `geometry/justifiedLayout.ts` and `geometry/mosaicLayout.ts` — 03-01 §Justified, §Mosaic ✅ (completed: 2026-10-20 22:39)
- [x] 2.2.4 Add `geometry/computeGeometry.ts`, `geometry/geometryPort.ts`, and `geometry/index.ts` — 03-01 §Shared result helpers, §Integration points ✅ (completed: 2026-10-20 22:39)
- [x] 2.2.5 Add the Phase A core types in `TileGrid.types.ts` (selection props and `TileGridHandle` are added in Phase 4) — 03-04 §Public types ✅ (completed: 2026-10-20 22:50)
- [x] 2.2.6 Add `TileGrid.tsx` and `TileGrid/index.ts` with the generic component shell (the `forwardRef`/handle layer is added in Phase 4) — 03-04 §Component files ✅ (completed: 2026-10-20 22:53)
- [x] 2.2.7 Update `src/index.ts` and `test/package-exports.spec.test.ts` for the Phase A core runtime/type exports — 03-04 §Package surface ✅ (completed: 2026-10-20 22:53)
- [x] 2.2.8 Add `devWarnings.ts` and the core `useTileGrid.ts` state hook (normalization, defaults, geometry, warnings) — 03-04 §State hook, §Dev warnings ✅ (completed: 2026-10-20 22:51)
- [x] 2.2.9 Add `virtualization/useContainerSize.ts`, `TileGridItemView.tsx` (internal memoized cell), `renderTileGrid.tsx`, and `useTileGridStyles.styles.ts` — 03-02 §Container measurement; 03-04 §DOM, §Styles; PF-005 ✅ (completed: 2026-10-20 22:52)
- [x] 2.2.10 Run the Phase 2 spec tests; verify they pass (green phase); fix the implementation, not the tests ✅ (completed: 2026-10-20 22:53)

**Deliverables**:

- [x] The pure geometry engine returns the hand-computed rectangles and invariants.
- [x] The public TileGrid renders fixed/masonry/justified/mosaic small fixtures, the empty state, list semantics, and the internal memoized cell.
- [x] Duplicate IDs and invalid numeric props warn in development and behave deterministically.
- [x] The node import smoke passes without accessing `window`/`document` at module evaluation.

### Step 2.3: Geometry/core implementation tests and hardening

**Reference**: 03-01 §Testing requirements; 03-04 §Testing requirements; ST-1–ST-20.
**Objective**: Add internals/edge-case coverage and run the phase gate.

- [x] 2.3.1 Add `test/tile-grid-geometry.impl.test.ts` for normalization edge cases, extra invariants, and result helpers — 03-01 §Testing requirements ✅ (completed: 2026-10-20 22:54)
- [x] 2.3.2 Add `test/tile-grid-layout.impl.test.tsx` for zero width, duplicate IDs, warning deduplication, empty/list edge cases, and memoized-cell stable props — 03-04 §Error handling; PF-005 ✅ (completed: 2026-10-20 22:55)
- [x] 2.3.3 Run `pnpm verify && pnpm test:browser && pnpm test:perf`; phase gate ✅ (completed: 2026-10-20 23:47)

**Deliverables**:

- [x] All Phase 2 tests pass; no regressions in the existing suite.
- [x] The Phase 2 browser/perf smoke remains green.

**Verify**: `pnpm verify && pnpm test:browser && pnpm test:perf`

---

## Phase 3: Virtualization, scrolling, and 20K

> **Phase baseline tree**: _(recorded by the exec-plan skill from a temporary-index snapshot of committed, staged, unstaged, and untracked phase-start state)_
> **Lenses**: `perf`
> **Reasoning**: high — 20K mounting, measurement, scrolling, and anchor behavior are performance-critical and browser-dependent.

### Step 3.1: Browser virtualization specification tests

**Reference**: 03-02 §Scroll container–§Performance; ST-13–ST-15, ST-21, ST-22, ST-48; RD-02 AC 1, 4, 8, 11–13; PF-004.
**Objective**: Define the browser-level mounting, anchor, image-bound, resize, DOM-read, and offscreen behavior before virtualization exists.

- [ ] 3.1.1 [spec-author] Write `test/browser/tile-grid-layout.browser.test.tsx` covering ST-13–ST-15, ST-21, ST-22, ST-48 — 03-02
- [ ] 3.1.2 Run `pnpm test:browser`; verify the 20K/layout cases fail because the component still renders all items and has no anchor/scroll behavior (red phase)

**Deliverables**:

- [ ] The browser layout spec exists with the 20K fixture.
- [ ] The red-phase result is recorded.

### Step 3.2: Virtualization and scrolling implementation

**Reference**: 03-02 §Scroll container–§Internal scroll helpers, §Item wrapper rendering; AR #6, AR #7, AR #12.
**Objective**: Add the band/item virtualizer, root scroll container, anchor preservation, scroll helpers, and Phase A stories.

- [ ] 3.2.1 Add `virtualization/types.ts` and `virtualization/options.ts` — 03-02 §Virtualizer integration
- [ ] 3.2.2 Add `virtualization/useTileGridVirtualizer.ts` — 03-02 §Band layouts, §Masonry
- [ ] 3.2.3 Add `virtualization/scrollHelpers.ts` and `virtualization/useAnchorPreservation.ts` — 03-02 §Anchor preservation, §Internal scroll helpers
- [ ] 3.2.4 Update `useTileGrid.ts` to integrate the container size, geometry, virtualizer, anchor, and scroll helpers — 03-02 §Container measurement, §Integration points
- [ ] 3.2.5 Update `renderTileGrid.tsx` to render the spacer and visible memoized cells from the virtual range — 03-02 §Item wrapper rendering; PF-005
- [ ] 3.2.6 Add `TileGrid.stories.tsx` and `TileGridLayouts.story.tsx` — 03-04 §Stories
- [ ] 3.2.7 Add `TileGridControlledTileSize.story.tsx` and `TileGridEmpty.story.tsx` — 03-04 §Stories; RD-02 AC 14 (controlled part)
- [ ] 3.2.8 Add `TileGridTwentyThousandBenchmark.story.tsx` with the shared 20K fixture and a fixed-height wrapper — 03-04 §Stories; RD-02 AC 1
- [ ] 3.2.9 Run the browser spec; verify it passes (green phase)

**Deliverables**:

- [ ] All four layouts mount under 120 wrappers at 20K.
- [ ] Masonry does not mount whole columns; fixed/justified/mosaic virtualize bands.
- [ ] Changing `tileSize` preserves the first visible item and offset.
- [ ] The Phase A stories render and the 20K story builds.
- [ ] Renderer DOM reads and offscreen wrappers are covered for all four layouts (ST-48).

### Step 3.3: Virtualizer implementation tests and hardening

**Reference**: 03-02 §Testing requirements; ST-13–ST-15, ST-21, ST-22, ST-48; PF-004.
**Objective**: Add parity/scroll-helper coverage and run the phase gate.

- [ ] 3.3.1 Add `test/tile-grid-virtualizer.impl.test.tsx` for band start/total parity, masonry lane/start parity, and scroll-helper clamps — 03-02
- [ ] 3.3.2 Update `test/tile-grid-layout.impl.test.tsx` for virtualized empty/list/resize edge cases and memoized-cell props — 03-02 §Error handling; PF-005
- [ ] 3.3.3 Run `pnpm verify && pnpm test:browser && pnpm test:perf`; phase gate

**Deliverables**:

- [ ] Parity tests pass; no whole-column masonry mounting.
- [ ] Anchor and scroll helpers are covered.
- [ ] No regressions.

**Verify**: `pnpm verify && pnpm test:browser && pnpm test:perf`

---

## Phase 4: Selection store and public selection

> **Phase baseline tree**: _(recorded by the exec-plan skill from a temporary-index snapshot of committed, staged, unstaged, and untracked phase-start state)_
> **Lenses**: `api-surface`
> **Reasoning**: high — the selection contract is public, controlled-first, and shared with the later focus/keyboard plan.

### Step 4.1: Selection specification tests

**Reference**: 03-03 §Selection store, §Click mapping, §Handle semantics, §Performance; ST-23–ST-32, ST-34, ST-47, ST-49; RD-03 §Selection modes–§Select-all/clear API; PF-003, PF-005.
**Objective**: Define the public selection, 20K public selection proxy, affected-cell render count, and browser handle-scroll behavior before the store exists.

- [ ] 4.1.1 [spec-author] Write `test/tile-grid-selection.spec.test.tsx` covering ST-23–ST-32 — 03-03
- [ ] 4.1.2 [spec-author] Write `test/browser/tile-grid-selection.browser.test.tsx` covering ST-34, ST-47, ST-49 — 03-03
- [ ] 4.1.3 Run the jsdom and browser selection specs; verify they fail because the selection props/store/handle/renderer proxy do not exist (red phase)

**Deliverables**:

- [ ] Controlled/uncontrolled, click-modifier, hidden-ID, handle, interactive-guard, 20K selection proxy, and render-count cases exist.
- [ ] The red-phase result is recorded.

### Step 4.2: Selection implementation

**Reference**: 03-03 §Selection store–§Handle semantics; AR #3, AR #23.
**Objective**: Implement the selection store, click mapping, public selection props, selected render args, and handle.

- [ ] 4.2.1 Add `selection/types.ts` and `selection/transitions.ts` — 03-03 §Types, §Transitions
- [ ] 4.2.2 Add `selection/useGridSelection.ts` and `selection/clickSelection.ts` — 03-03 §Controlled/uncontrolled resolution, §Click mapping
- [ ] 4.2.3 Extend `TileGrid.types.ts` with `TileGridSelectionMode`, selection props, and `TileGridHandle` — 03-04 §Public types
- [ ] 4.2.4 Update `TileGrid.tsx` to `forwardRef` with `TileGridHandle`, and update `useTileGrid.ts`/`renderTileGrid.tsx`/`TileGridItemView.tsx` to use the store, selected render args, stable click handler, memoized cell, and handle — 03-03 §Handle semantics; 03-04 §Generic forwardRef, §Click selection; PF-005
- [ ] 4.2.5 Update `src/index.ts` and `test/package-exports.spec.test.ts` with the selection types/handle — 03-04 §Package surface
- [ ] 4.2.6 Add `TileGridSelection.story.tsx` and re-export it from `TileGrid.stories.tsx` — 03-04 §Stories
- [ ] 4.2.7 Run the selection spec tests; verify they pass (green phase); fix the implementation, not the tests

**Deliverables**:

- [ ] Controlled/uncontrolled selection, hidden IDs, single/multiselect click mapping, and handle methods work.
- [ ] `onSelectionChange` never fires on mount/prop/items changes.
- [ ] Interactive content does not trigger selection.
- [ ] The 20K public selection proxy passes p95/mounted-count assertions; one toggle calls `renderItem` only for the affected mounted cell.

### Step 4.3: Selection implementation tests and hardening

**Reference**: 03-03 §Testing requirements; ST-23–ST-34.
**Objective**: Add store internals/edge-case coverage and run the phase gate.

- [ ] 4.3.1 Add `test/tile-grid-selection.impl.test.tsx` for the transition table, no-op callbacks, anchor behavior, single seed warning, selectAll filtering, and memoized-cell props — 03-03; PF-005
- [ ] 4.3.2 Run `pnpm verify && pnpm test:browser && pnpm test:perf`; phase gate

**Deliverables**:

- [ ] All Phase 4 tests pass; no regressions.
- [ ] The browser selection spec passes in Chromium, including the 20K public selection proxy and affected-cell render count.

**Verify**: `pnpm verify && pnpm test:browser && pnpm test:perf`

---

## Phase 5: Marquee controller

> **Phase baseline tree**: _(recorded by the exec-plan skill from a temporary-index snapshot of committed, staged, unstaged, and untracked phase-start state)_
> **Lenses**: `perf`
> **Reasoning**: high — pointer state, capture-loss ordering, auto-scroll frames, and commit/cancel correctness.

### Step 5.1: Marquee specification tests

**Reference**: 03-03 §Marquee controller; ST-35–ST-42; RD-01 AC 8–13.
**Objective**: Define the controller's threshold, preview, commit/cancel, capture ordering, auto-scroll, and geometry usage before implementation.

- [ ] 5.1.1 [spec-author] Write `test/tile-grid-marquee.spec.test.ts` covering ST-35–ST-42 with a synthetic geometry port and injected frame scheduler — 03-03
- [ ] 5.1.2 Run the marquee spec; verify it fails because the controller does not exist (red phase)

**Deliverables**:

- [ ] The synthetic pointer/geometry harness exists.
- [ ] The red-phase result is recorded.

### Step 5.2: Marquee implementation

**Reference**: 03-03 §State machine; RD-01 §Marquee algorithm; AR #4.
**Objective**: Implement the internal controller and its capture/auto-scroll edge cases.

- [ ] 5.2.1 Add `marquee/types.ts` and `marquee/intersection.ts` — 03-03 §Types
- [ ] 5.2.2 Add `marquee/createMarqueeController.ts` with the idle/pending/active/committed/cancelled state machine, threshold, preview, and commit/cancel — 03-03 §State machine
- [ ] 5.2.3 Extend `marquee/createMarqueeController.ts` with auto-scroll frames, pointer capture, `lostpointercapture` ordering, and `dispose` — 03-03 §State machine, §Error handling
- [ ] 5.2.4 Run the marquee spec; verify it passes (green phase)

**Deliverables**:

- [ ] The controller is internal, not exported, and not mounted in `TileGrid`.
- [ ] Background clicks, additive selection, cancel, commit-once, and auto-scroll behave per RD-01.

### Step 5.3: Marquee implementation tests and hardening

**Reference**: 03-03 §Testing requirements; ST-35–ST-42.
**Objective**: Add edge-case coverage and run the phase gate.

- [ ] 5.3.1 Add `test/tile-grid-marquee.impl.test.ts` for capture unavailable, dispose, boundary clamps, additive hidden IDs, and scheduler cleanup — 03-03
- [ ] 5.3.2 Run `pnpm verify && pnpm test:browser && pnpm test:perf`; phase gate

**Deliverables**:

- [ ] All marquee tests pass; no public export.
- [ ] The staged-internal-code exception is documented in the plan/review.

**Verify**: `pnpm verify && pnpm test:browser && pnpm test:perf`

---

## Phase 6: Performance, docs, and final verification

> **Phase baseline tree**: _(recorded by the exec-plan skill from a temporary-index snapshot of committed, staged, unstaged, and untracked phase-start state)_
> **Lenses**: `perf`, `api-surface`
> **Reasoning**: high — performance budgets, package surface, documentation, and the final gate.

### Step 6.1: Performance specification and baseline

**Reference**: 03-05 §Performance test; ST-13, ST-33 (supplement), ST-47/ST-49 (Phase 4 browser); RD-02 §Performance, AC 1, 11; RD-01 §Performance; PF-003, PF-010.
**Objective**: Add the real geometry/mounted/scroll performance test and record the baseline before final hardening. The public 20K selection proxy is already asserted in Phase 4.

- [ ] 6.1.1 [spec-author] Write `test/perf/tile-grid.perf.test.tsx` for geometry recompute, mounted wrappers, pure selection supplement, and scripted scroll — 03-05
- [ ] 6.1.2 Run `pnpm test:perf`; record the measured values. If a budget already passes before any Phase 6 change, document that baseline as a pre-implementation pass with justification.

**Deliverables**:

- [ ] The performance test records/asserts the geometry/mounted/scroll budgets and the pure selection supplement.
- [ ] The baseline or red result is recorded.

### Step 6.2: Hardening, documentation, and story review

**Reference**: 03-04 §Package surface, §Documentation; 03-05 §CI jobs; AR #24.
**Objective**: Fix any performance regression, finish the package docs, and review the stories/CI.

- [ ] 6.2.1 If the perf test fails, profile and fix the hot path in `geometry/`, `virtualization/`, or `selection/transitions.ts`; do not relax the RD budgets — 03-05 §Performance test
- [ ] 6.2.2 Add the internal “Phase A — unreleased” `TileGrid` section to `packages/react-components/README.md` (install, scroll contract, layouts, controlled `tileSize`, selection, empty state, strings, Phase A limitations), add the browser/perf commands to the root `README.md` commands table, and add the three commands plus the browser-matrix/performance jobs to `AGENTS.md` — 03-04 §Package surface; 03-05 §CI jobs; PF-001
- [ ] 6.2.3 Update `TileGrid.stories.tsx` docs/manual checklist and verify the story a11y addon reports no violations for the Phase A stories — 03-04 §Stories
- [ ] 6.2.4 Verify the final `package.json` (`vitest` pinned 5.0.5), `vite.config.ts`, `turbo.json`, and CI workflow match 03-05; run `pnpm test:browser` and, when the browsers are installed, `pnpm test:browser:all` — PF-008

**Deliverables**:

- [ ] Performance budgets pass.
- [ ] The internal Phase A package README is marked unreleased and documents the surface and limitations.
- [ ] The Phase A story set is documented and accessible.
- [ ] The manifest/build/CI wiring is consistent.

### Step 6.3: Final verification

**Reference**: 01-requirements.md §Acceptance Criteria; 03-05 §Verification checklist.
**Objective**: Run the complete Phase A gate and confirm the deferred surface.

- [ ] 6.3.1 Run `pnpm verify`, `pnpm test:browser`, `pnpm test:perf`, `pnpm storybook:build`, and `pnpm pack:check`; fix failures in the implementation
- [ ] 6.3.2 Review the Phase A export pin and the deferred RD-03/RD-04 contract; confirm no out-of-scope symbol is required and no staged module is package-root exported
- [ ] 6.3.3 Verify the release/contract-freeze gate: no publish/tag/release dispatch includes the TileGrid surface until RD-03/RD-04 complete and the final composed contract/export pin/dependency set is frozen; the package README is marked unreleased — PF-001

**Deliverables**:

- [ ] All Phase A acceptance criteria in `01-requirements.md` are satisfied.
- [ ] No regressions; no exported dead code; the marquee controller is documented as staged for RD-03.
- [ ] The release/contract-freeze gate is recorded; Phase A is internal, not a partial public release.
- [ ] The plan is ready for the Phase B (RD-03) planning step.

**Verify**: `pnpm verify && pnpm test:browser && pnpm test:perf && pnpm storybook:build && pnpm pack:check`

---

## Dependencies

```
Phase 1 (harness/dependencies)
    ↓
Phase 2 (geometry + core TileGrid)
    ↓
Phase 3 (virtualization/scroll/anchor/20K)
    ↓
Phase 4 (selection store/public selection)
    ↓
Phase 5 (marquee controller)
    ↓
Phase 6 (performance/docs/final gate)
```

Phase 4 depends on the public component from Phase 2 and the 20K/browser setup from Phase 3. Phase 5 depends on the geometry port from Phase 2 and the selection store from Phase 4. Phase 6 depends on every prior phase.

## Success Criteria

**Feature is complete when:**

1. ✅ All phases completed.
2. ✅ All Phase A ST cases pass; spec tests were written before implementation and failed first.
3. ✅ `pnpm verify`, `pnpm test:browser`, `pnpm test:browser:all` (CI), and `pnpm test:perf` pass.
4. ✅ `pnpm storybook:build` and `pnpm pack:check` pass after a build.
5. ✅ No warnings/errors; no exported dead code; the staged marquee controller is documented and unexported.
6. ✅ Security hardened: no HTML parsing, no item/image URL/item-ID/selected-ID logging, no image fetching by the component, numeric/ID validation, no unsafe casts.
7. ✅ The Phase A package README is marked “Phase A — unreleased”; the export pin documents the internal Phase A surface; no publish/tag/release dispatch occurs before the final contract freeze.
8. ✅ No regressions in the existing component tests, export pin, or Storybook build.
9. ✅ The RD-03 plan can mount the marquee controller and add focus, keyboard, selection controls, announcements, and filtering without reworking the geometry, store, or memoized-cell renderer contracts; one toggle re-renders only the affected mounted cell.
10. ✅ The RD-04 plan can add the tile shell, actions, arranging, and the full recipe without changing the Phase A geometry/virtualization contracts.
11. ✅ The node import smoke, 20K public selection proxy, renderer DOM-read/offscreen assertions, and affected-cell render count pass.
12. ✅ The Web application + Data and migration lenses and the v8/public-API compatibility boundary are recorded; the package remains free of a v8 compatibility layer.
13. ✅ The release/contract-freeze gate (6.3.3) is verified; Phase A is internal and not a partial public release.
