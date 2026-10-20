## Preflight Report: TileGrid Phase A Plan

> **Status**: ✅ PREFLIGHT PASSED — all 10 findings resolved
> **Iteration**: 2 (re-scan after accepted fixes)
> **Previous Iteration**: 10 findings — all resolved
> **This Iteration**: 0 new findings
> **Carried Forward**: none
> **Artifact**: Implementation plan at `codeops/features/tile-grid/plans/v1/` (11 Markdown documents)
> **Scan-start hash**: `0de051a51510028d11593692df907a1552659da760062aeba9bc9a7d0cec04bd`
> **Post-fix hash**: `21a5b2f25ed938bc9b41b37aee963306f68896b443d2696a8fd72719c1698d28` (plan documents only; this report and the temporary notes are excluded)
> **Codebase Grounded**: 20 source, test, and configuration files examined; existing references mapped and verified
> **Last Updated**: 2026-10-20 21:10
> **Scope**: strict; audit target = the plan documents; context = requirements README/RD-01–RD-04, feature/portfolio roadmaps, `AGENTS.md`, `codeops/codeops.json`, package/test/build/CI configuration; modification set = the plan documents (user authorized plan-only fixes)
> **Same-session review**: ⚠️ SAME-SESSION REVIEW — this plan was created in the current session. Same-agent bias risk is elevated; the independent challenger below was used for the major findings. A fresh-session audit or human domain-expert review is recommended before a public release.
> **Hardening**: one independent design-challenger dispatch reviewed the five major candidates without the lead's preferred resolutions. All five candidates were confirmed; the challenger added the missing AC 12 offscreen coverage (PF-004), the renderer memoization conflict (PF-005), and the early perf-gate observation (PF-010).

### Codebase Context Summary

**Repository:** `blendsdk/fluentui-react` — pnpm/Turborepo monorepo with one publishable package, `@blendsdk/fluentui-react-components` 0.2.1.
**Tech Stack:** React 19.3, Fluent UI v9, TypeScript 7, Vite 8, Vitest 5.0.5, Storybook 10, Node 22, pnpm 12.11.2.
**Architecture:** the package follows the house component pattern (component shell, typed props, state hook, render function, Griffel styles, barrel); tests are jsdom by default; Storybook stories live in `src/components/<Name>/stories/`; CI runs one `verify` job with format, skill, type-check, build, unit tests, Storybook build, and pack guard.

**Key files examined:**

| File                                                          | Verified fact                                                                                                                                |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/react-components/package.json`                      | No `dependencies` block; `vitest ^5.0.5`; no browser/perf deps or scripts; peer deps Fluent/React/RHF/DatePicker                             |
| `packages/react-components/tsconfig.json`                     | `include` is `src`, `test`, `.storybook`, `vite.config.ts`, `vitest.config.ts`; new configs need adding                                      |
| `packages/react-components/tsconfig.build.json`               | Emits declarations from `src/**/*.ts`/`tsx`; excludes story files                                                                            |
| `packages/react-components/vite.config.ts`                    | Externalizes React/ReactDOM/RHF/`@fluentui/*`; no TanStack                                                                                   |
| `packages/react-components/vitest.config.ts`                  | jsdom, `test/**/*.{test,spec}.{ts,tsx}`; browser/perf dirs would match unless excluded                                                       |
| `packages/react-components/test/setup.ts`                     | Only jest-dom + `cleanup()`; no `ResizeObserver`/pointer-capture stubs                                                                       |
| `packages/react-components/test/package-exports.spec.test.ts` | Exact sorted runtime export list; type-import assertions; no `TileGrid`                                                                      |
| `packages/react-components/.storybook/main.ts`                | Stories glob `../src/**/stories/*.stories.@(ts\|tsx)`                                                                                        |
| `turbo.json`                                                  | Test inputs already include `test/**/*.ts`/`tsx`; type-check inputs lack the new Vitest configs; Storybook inputs lack test fixtures         |
| `.github/workflows/ci.yml`                                    | One `verify` job; no browser matrix or performance job                                                                                       |
| `README.md`                                                   | Root command table has no `test:browser`/`test:perf`                                                                                         |
| `pnpm-lock.yaml`                                              | `vitest@5.0.5`; `@vitest/browser`/`@vitest/browser-playwright` are optional peers of Vitest, not installed dev deps; no `playwright` package |
| `test/loading.ssr.test.tsx`                                   | Existing node-environment SSR smoke pattern (`// @vitest-environment node`)                                                                  |
| Existing components                                           | House pattern confirmed; `FormTextField` generic `forwardRef` pattern exists                                                                 |

**Reference verification:** existing package, test, build, CI, Storybook, Vite, Turbo, manifest, export-pin, README, and component-pattern references are verified. The plan’s new `TileGrid`/geometry/selection/marquee/browser/perf files do not exist yet and were not treated as phantom references. The requirements README selects **Web application** and **Data and migration** lenses; iteration 2 records both and the compatibility boundary (PF-006).

**Environment limitation:** this planning workspace has no Node/pnpm toolchain. `pnpm verify`, browser tests, and performance tests were not run. Execution must run in the project’s Node 22/pnpm 12.11.2 environment.

### Summary by Dimension

Findings are counted by their primary dimension; several inform more than one dimension.

| #   | Dimension              | Findings | Highest Severity |
| --- | ---------------------- | -------- | ---------------- |
| 1   | Ambiguities            | 0        | —                |
| 2   | Implicit Assumptions   | 1        | 🟡 MINOR         |
| 3   | Logical Contradictions | 2        | 🟠 MAJOR         |
| 4   | Completeness Gaps      | 0        | —                |
| 5   | Dependency Issues      | 1        | 🟡 MINOR         |
| 6   | Feasibility Concerns   | 1        | 🟠 MAJOR         |
| 7   | Testability            | 3        | 🟠 MAJOR         |
| 8   | Security Blind Spots   | 1        | 🟡 MINOR         |
| 9   | Edge Cases             | 0        | —                |
| 10  | Scope Creep Indicators | 0        | —                |
| 11  | Ordering & Sequencing  | 0        | —                |
| 12  | Consistency            | 1        | 🟡 MINOR         |
| 13  | Codebase Alignment     | 0        | —                |

### Summary by Severity

| Severity       | Count | Status                                |
| -------------- | ----- | ------------------------------------- |
| 🔴 CRITICAL    | 0     | —                                     |
| 🟠 MAJOR       | 5     | All fixed and verified in iteration 2 |
| 🟡 MINOR       | 4     | All fixed and verified in iteration 2 |
| 🔵 OBSERVATION | 1     | Accepted and verified in iteration 2  |

---

## Findings

### PF-001: Phase A public surface is presented as shippable while the final contract and dependency set are deferred [🟠 MAJOR]

**Dimension:** 3 Logical Contradictions (also 10 Scope Creep Indicators, 12 Consistency)
**Location:** `00-index.md:29-31` (§Phase A Scope); `01-requirements.md:47-53,88-89`; `03-04-tile-grid-component.md:69,280`; `03-05-test-harness-and-performance.md:53`; `99-execution-plan.md:391`
**Codebase/Context Evidence:** `requirements/README.md:119-124` says “All phases are release-blocking for v1. The phases are internal delivery order, not a partial public release.” `requirements/README.md:139` chooses “One composed `TileGridProps<T>` and full export pin.” The requirements Ambiguity Register records “no partial public v1.” The plan instead stages a Phase A public subset (`00-index.md:31`, `03-04:69`), updates the package README with “Phase A limitations” (`03-04:280`), calls the result the “shipped surface” (`99:391`), adds only `@tanstack/react-virtual` as a runtime dependency (`03-05:53`), and has no release or contract-freeze gate. `01:89` runs `pnpm pack:check`, producing a publishable tarball. Release is manual (`release.yml`), so the risk is a human dispatch of an incomplete public API.

**The Problem:** The plan’s Phase A artifact can be published/tagged with a public `TileGridProps` subset, a partial export pin, and only part of the v1 dependency set. That contradicts the requirements’ explicit “one composed type / full export pin / no partial public release” decision. The plan is internally clear that RD-03/RD-04 complete the contract, but nothing in the plan prevents a premature release, and the “shipped surface” wording implies one is intended.

**Options:**

| Option | Description                                                                                                                                                                                                                                                                                                            | Pros                                                                                         | Cons                                                                                                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| A      | Add a release/contract-freeze gate: Phase A is internal; no npm publish/tag until RD-03/RD-04 complete and the final composed `TileGridProps`/full export pin/dependencies pass; change “shipped surface” to “internal Phase A surface”; label the package README section unreleased or defer the public README update | Preserves the confirmed Phase A scope; satisfies the requirements’ release gate; no dead API | Adds explicit release discipline and wording changes; Phase A cannot be published alone                                                 |
| B      | Reopen the requirements README/PF-002 to authorize a staged public API and a Phase A package release, with versioning/compatibility rules and a migration note                                                                                                                                                         | Allows an intentional partial release                                                        | Reverses the prior requirements decision; needs a requirements revision; consumers see an incomplete component                          |
| C      | Implement the full final composed type and both runtime dependencies in Phase A without the later behavior                                                                                                                                                                                                             | Public type is complete early                                                                | Dead public props and an unused `@dnd-kit/core` dependency; does not implement RD-03/RD-04 behavior; violates minimum-sufficient design |

**Recommendation:** Option A — add a no-release/contract-freeze gate and correct the “shipped surface” wording. This keeps Phase A exactly as scoped while honoring the requirements’ v1 release boundary.
**Confidence:** High that the gate is missing; Medium on whether the user’s earlier AR #2 approval was intended to authorize a staged public surface.
**Hardening:** Independent challenger confirmed the finding and recommended the same release gate; it noted that release is manual, so this is a process guard rather than an automation defect.
**User Decision:** Resolved — User accepted recommendation: Option A

**Iteration 2:** Fixed and verified — see §Iteration 2 Verification.

---

### PF-002: RD-02 AC 16 module-evaluation safety is contradicted by AR #21 and has no test [🟠 MAJOR]

**Dimension:** 3 Logical Contradictions (also 7 Testability, 13 Codebase Alignment)
**Location:** `00-index.md:23` (“No SSR harness”); `01-requirements.md:25,53`; `00-ambiguity-register.md:28` (AR #21); `03-04-tile-grid-component.md` §Dev warnings/§Error handling; `07-testing-strategy.md` ST-44; `99-execution-plan.md` (no node import task)
**Codebase/Context Evidence:** RD-02 acceptance criterion 16 (`RD-02-layout-and-virtualization.md:416`) requires “no HTML injection, no item or image URL logging, no image fetching by the component, and no SSR/window access during module evaluation.” The plan’s AR #21 says “there is no SSR requirement in RD-02/RD-01” and the plan defers SSR entirely. ST-44 covers injection/logging/fetching but not module evaluation. The package already has the correct pattern: `test/loading.ssr.test.tsx:1` uses `// @vitest-environment node` for an import/render smoke.

**The Problem:** The plan puts RD-02 AC 16 in scope but has no test that importing the package or `TileGrid` in a Node environment is free of `window`/`document` access at module evaluation. This is explicit package-library import safety; a consumer importing the package in SSR/SSG or Node tooling could crash. AR #21’s premise is false for this clause; a minimal node import smoke is not a full SSR render.

**Options:**

| Option | Description                                                                                                                                                | Pros                                                                                          | Cons                                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| A      | Add a minimal node-environment import smoke (no rendering) that imports `../src/index` and `TileGrid`; update `07`, `99`, `01`, `03-04`, and AR #21’s note | Satisfies AC 16 with minimal cost; uses the existing test pattern; no SSR rendering machinery | Adds one small test/task                                                                                  |
| B      | Reopen RD-02 AC 16 to remove the module-evaluation requirement                                                                                             | Avoids the test                                                                               | Weakens an explicit package-safety criterion; not recommended                                             |
| C      | Add a full SSR render smoke                                                                                                                                | Stronger coverage                                                                             | More machinery than required; the grid needs browser measurement and SSR rendering is explicitly excluded |

**Recommendation:** Option A — add the node import smoke; keep full SSR rendering out of scope.
**Confidence:** High
**Hardening:** Independent challenger confirmed; it identified the existing `test/loading.ssr.test.tsx:1` pattern and recommended no `renderToString`.
**User Decision:** Resolved — User accepted recommendation: Option A

**Iteration 2:** Fixed and verified — see §Iteration 2 Verification.

---

### PF-003: RD-01 AC 13’s 20K selection observable proxy is not tested [🟠 MAJOR]

**Dimension:** 7 Testability (also 4 Completeness Gaps)
**Location:** `03-03-selection-and-marquee.md:65` (pure transitions); `03-05-test-harness-and-performance.md:176` (pure transition perf test); `07-testing-strategy.md:74` (ST-33); `01-requirements.md:83` (acceptance 4); `99-execution-plan.md` §Phase 6
**Codebase/Context Evidence:** RD-01 §Performance (`RD-01-selection-and-marquee.md:203-206`) requires the 16ms p95 toggle and the observable proxy: one toggle changes only the affected mounted tiles and does not increase the mounted wrapper count. RD-01 AC 13 (`RD-01:277`) requires a 20K selection set to be selected/cleared/read without 20K React state. The plan’s ST-33 measures only 200 toggles through the pure transition helper; the browser selection test uses a small fixture and does not measure the public 20K toggle or mounted count.

**The Problem:** The plan’s performance test is a set-copy microbenchmark. It cannot prove the public 20K selection toggle, the absence of 20K React state, or that the mounted wrapper count stays unchanged. The RD-01 observable proxy is untested. The Phase 4 gate runs only the harness smoke; the real perf test is Phase 6, so a selection regression would not be caught when the selection work lands.

**Options:**

| Option | Description                                                                                                                                                                                                                          | Pros                                                                                                              | Cons                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| A      | Add a 20K public-path selection test in Phase 4: render the grid, select/clear/read, 200 toggles, p95 under 16ms, mounted wrapper count unchanged; keep the pure transition microbenchmark as a supplement; update `07`/`03-05`/`99` | Directly proves RD-01 AC 13; catches regressions when selection lands; supports the render-counter work in PF-005 | Adds a browser test and a Phase 4 perf task                                    |
| B      | Explicitly accept the pure set-copy proxy as the budget and document the observable proxy as untested                                                                                                                                | No new test                                                                                                       | Does not satisfy RD-01 AC 13; a public regression can pass                     |
| C      | Measure a `renderHook`/store harness only                                                                                                                                                                                            | Easier than a full grid test                                                                                      | Does not test mounted wrappers or the public component; still misses the proxy |

**Recommendation:** Option A — move the 20K public selection test into Phase 4 and keep the pure microbenchmark as a supplement.
**Confidence:** High
**Hardening:** Independent challenger confirmed; it also raised the early perf-gate observation (PF-010).
**User Decision:** Resolved — User accepted recommendation: Option A

**Iteration 2:** Fixed and verified — see §Iteration 2 Verification.

---

### PF-004: RD-02 AC 12 has no renderer DOM-read test and offscreen scroll coverage only for masonry [🟠 MAJOR]

**Dimension:** 7 Testability (also 4 Completeness Gaps)
**Location:** `03-02-virtualization-and-scrolling.md:144` (design claim); `07-testing-strategy.md:49-50` (ST-13/ST-14), `07:87` (ST-41); `03-05-test-harness-and-performance.md` §Browser tests
**Codebase/Context Evidence:** RD-02 AC 12 (`RD-02-layout-and-virtualization.md:412`) requires scrolling the 20K fixture to avoid rendering offscreen item wrappers and to avoid calling `getBoundingClientRect()` per item. The plan’s design says the renderer does this (`03-02:144`), but ST-41 covers only the marquee controller; ST-13 checks initial paint only; ST-14 scrolls only masonry. Fixed, justified, and mosaic are never scroll-and-count tested, and no test spies on renderer DOM reads.

**The Problem:** The plan asserts the AC 12 behavior but has no verification for the renderer. A regression that starts measuring items during scroll would pass the current suite. Offscreen coverage is also incomplete: only masonry scrolls in a test.

**Options:**

| Option | Description                                                                                                                                                                                                                                                      | Pros                                                                    | Cons                                                       |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| A      | Add a browser test that spies on `Element.prototype.getBoundingClientRect`, counts calls whose `this` is a `[data-tile-grid-item]`, asserts zero during 20K scroll for all four layouts; add offscreen index assertions against the visible-plus-overscan window | Directly proves AC 12; covers all layouts; catches accidental DOM reads | Adds a browser test and ST cases                           |
| B      | Accept the design claim and document the missing test as risk                                                                                                                                                                                                    | No work                                                                 | Leaves an explicit AC unverified                           |
| C      | Add test-only instrumentation to the component                                                                                                                                                                                                                   | Counts reads without a spy                                              | Production-only test hooks are unnecessary and add surface |

**Recommendation:** Option A — add the DOM-read spy and per-layout scroll/offscreen assertions. Define “offscreen” as outside the visible-plus-overscan virtual window, since overscan is intentionally offscreen.
**Confidence:** High that the tests are missing; High that the design likely complies.
**Hardening:** Independent challenger confirmed; it identified the masonry-only offscreen coverage as a separate major gap.
**User Decision:** Resolved — User accepted recommendation: Option A

**Iteration 2:** Fixed and verified — see §Iteration 2 Verification.

---

### PF-005: Selection changes re-render every visible tile, conflicting with RD-03’s render-counter criterion [🟠 MAJOR]

**Dimension:** 6 Feasibility Concerns (also 11 Ordering & Sequencing, 7 Testability)
**Location:** `03-04-tile-grid-component.md:152-174` (§DOM and list semantics: `visibleItems.map` and inline `renderItem`); `03-04` §State hook/§Integration points; `99-execution-plan.md` Phase 4; `03-03-selection-and-marquee.md` selection store at the grid level
**Codebase/Context Evidence:** RD-03 §Performance (`RD-03-selection-focus-and-accessibility.md:234-236`) says “A render counter around `renderItem` verifies that one toggle changes only the affected mounted tiles and does not increase the mounted wrapper count.” The Phase A renderer maps every visible item and calls `renderItem` inline on each `TileGrid` render. The plan has no memoized item wrapper, per-item subscription, or stable render callback. The plan’s Phase 4 task updates `renderTileGrid` for selection but does not add memoization.

**The Problem:** When selection changes, the grid-level selection store re-renders `TileGrid`; the current render maps all visible items and calls `renderItem` for each. RD-03’s render counter will therefore count every visible tile, not only the affected mounted tile. The RD-03 plan would have to rework the renderer or weaken its performance test. The plan’s integration note says RD-03 can add focus without reworking geometry/store, but it does not address the renderer.

**Options:**

| Option | Description                                                                                                                                                                                                                                                                         | Pros                                                                                                        | Cons                                                                                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | Extract an internal memoized item wrapper in Phase 2/4 (memoized on `id`, rect, `selected`, `selectable`, `disabled`; stable `renderItem` via a ref; stable click handler); add a render-count test that one selection change calls `renderItem` only for the affected mounted item | Keeps RD-03’s render-counter criterion achievable; avoids later renderer rework; bounded visible item count | Adds a component/extraction and a memoization test; needs careful stable callbacks                                                                             |
| B      | Define the RD-03 render counter as DOM-output only and defer memoization to RD-03                                                                                                                                                                                                   | Simpler Phase A                                                                                             | Requires a requirements clarification; the current RD-03 text explicitly says render counter around `renderItem`; the Phase A renderer remains re-render-heavy |
| C      | Accept re-rendering all visible items (under 120) and change the RD-03 acceptance criterion                                                                                                                                                                                         | No Phase A work                                                                                             | Weakens an explicit performance criterion; the RD-03 plan inherits the rework                                                                                  |

**Recommendation:** Option A — add the memoized item wrapper and render-count test now.
**Confidence:** High that the current architecture re-renders all visible items; High that RD-03’s text requires the affected-tile render counter.
**Hardening:** Independent challenger confirmed the conflict and recommended memoization or a DOM-output-only proxy; the RD-03 text supports the stricter reading.
**User Decision:** Resolved — User accepted recommendation: Option A

**Iteration 2:** Fixed and verified — see §Iteration 2 Verification.

---

### PF-006: Requirements’ Domain Lenses and data/migration compatibility boundary are missing [🟡 MINOR]

**Dimension:** 2 Implicit Assumptions (also 4 Completeness Gaps, 13 Codebase Alignment)
**Location:** `00-index.md` §Overview/§Minimum-Sufficient Baseline/§Quality Profile (no Domain Lenses section); `01-requirements.md` Deferred; `02-current-state.md:143`
**Codebase/Context Evidence:** `requirements/README.md:50-65` selects **Web application** and **Data and migration**, with the boundary: the package stores no persistent data; the consuming application owns the v8 `TilesList`/`ActorTile` replacement and any persisted selection/order mapping; the package’s compatibility surface is the public component API; there is no v8 compatibility layer inside the package. The plan records neither lens nor this boundary. `02:143` acknowledges “early consumers see a subset” but does not connect it to the compatibility/release gate.

**The Problem:** The plan omits a required domain lens and the compatibility boundary. The public-contract/release risk in PF-001 is therefore not grounded in the selected data/migration analysis. The missing lens also makes the plan’s public API/versioning assumptions implicit.

**Options:**

| Option | Description                                                                                                                                                                                                                                            | Pros                                                                             | Cons                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A      | Add a `## Domain Lenses` section to `00-index` (Web application + Data and migration, evidence) and a `## Compatibility Boundary` note covering the no-persistent-data/app-owned-v8/no-v8-layer/public-API boundary; add a line to `01`, `03-04`, `99` | Restores the requirements’ lens coverage; connects to PF-001; no behavior change | Documentation only                                                                             |
| B      | Reopen the requirements README to remove the Data and migration lens                                                                                                                                                                                   | Avoids the boundary                                                              | Contradicts the requirements evidence (v8 replacement, seeded selection/order, new public API) |
| C      | Add a v8 migration layer inside the package                                                                                                                                                                                                            | Full migration support                                                           | Explicitly excluded by the requirements; large scope expansion                                 |

**Recommendation:** Option A — add the lens and boundary sections; keep the package out of v8 migration.
**Confidence:** High
**User Decision:** Resolved — User accepted recommendation: Option A (fixed and verified)

**Iteration 2:** Fixed and verified — see §Iteration 2 Verification.

---

### PF-007: The `Implements` line cannot express partial RD-02/RD-03 coverage [🟡 MINOR]

**Dimension:** 12 Consistency (also 4 Completeness Gaps, 11 Ordering & Sequencing)
**Location:** `00-index.md:6` (`Implements: tile-grid/RD-01, tile-grid/RD-02`); `01-requirements.md:33,35,47-50,88`; feature roadmap RD-01/RD-02/RD-03 rows
**Codebase/Context Evidence:** The plan implements a minimal RD-03 selection surface (selectionMode, controlled/uncontrolled IDs, click mapping, handle methods, list semantics) and defers RD-02 AC 14 (`zoomable`/`onTileSizeChange`) and AC 17 (full export pin). The `01` delta and the roadmap note explain this, but the machine-readable `Implements` field/roadmap stage only says RD-01/RD-02, while RD-03 remains “RD Preflighted.” A reader cannot see the partial RD-02/RD-03 coverage from the one-line fields.

**The Problem:** The plan’s summary and roadmap status under-describe partial RD coverage. This is traceability clarity, not a request to re-decide the confirmed scope. The `01` has the details; the `00-index`/roadmap summary should point to them.

**Options:**

| Option | Description                                                                                                                                                                                | Pros                              | Cons                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------ |
| A      | Add a one-line “Partial coverage” note/table to `00-index` (RD-02 AC 14/17 deferred; RD-03 selection subset implemented; RD-03 focus/keyboard/a11y remains preflighted) and a roadmap note | Accurate summary; no scope change | Slightly longer plan header                                                    |
| B      | Add `tile-grid/RD-03` to the `Implements` line and mark RD-03 “Plan Created (partial)”                                                                                                     | Makes RD-03 visible               | Partial-RD convention is not supported by the roadmap; may imply full planning |
| C      | Leave as is and rely on `01`/the roadmap note                                                                                                                                              | No edit                           | The one-line fields remain ambiguous                                           |

**Recommendation:** Option A — add the partial-coverage note; keep the `Implements` line for fully planned RDs.
**Confidence:** High
**User Decision:** Resolved — User accepted recommendation: Option A (fixed and verified)

**Iteration 2:** Fixed and verified — see §Iteration 2 Verification.

---

### PF-008: Browser providers require exact `vitest 5.0.5` but the manifest allows any 5.x [🟡 MINOR]

**Dimension:** 5 Dependency Issues (also 13 Codebase Alignment)
**Location:** `03-05-test-harness-and-performance.md:41-43`; `packages/react-components/package.json:74`
**Codebase/Context Evidence:** The package has `vitest: ^5.0.5`; `pnpm-lock.yaml` resolves `vitest@5.0.5`. The plan adds `@vitest/browser@5.0.5` and `@vitest/browser-playwright@5.0.5`, whose peer dependency on `vitest` is exact `5.0.5` (verified from the package metadata/lockfile optional peers). A lockfile refresh or `pnpm update` could resolve a later 5.x and break the peer contract. The plan says “pinned dependencies” but does not pin `vitest`.

**The Problem:** The browser provider’s exact peer is satisfied today by the lockfile, but the manifest range does not preserve that constraint. A future install/update can produce an unmet peer or an incompatible browser provider.

**Options:**

| Option | Description                                                                                                                            | Pros                                         | Cons                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A      | Pin `vitest` to `5.0.5` (or the exact matching version) in the package manifest and note the browser-provider lockstep in `03-05`/`99` | Removes future drift; matches the exact peer | Slightly tighter dependency update policy                                                |
| B      | Keep `^5.0.5`, rely on the lockfile, and document the constraint                                                                       | No manifest change                           | Future lockfile updates can break; CI `--frozen-lockfile` protects only the current lock |
| C      | Use a newer browser-provider version with a range peer                                                                                 | Avoids the exact pin                         | Not needed; current versions are verified                                                |

**Recommendation:** Option A — pin `vitest` to `5.0.5` or document and enforce the exact lockstep.
**Confidence:** High
**User Decision:** Resolved — User accepted recommendation: Option A (fixed and verified)

**Iteration 2:** Fixed and verified — see §Iteration 2 Verification.

---

### PF-009: Dev-warning no-logging rule omits item and selected IDs [🟡 MINOR]

**Dimension:** 8 Security Blind Spots (also 12 Consistency)
**Location:** `03-04-tile-grid-component.md:234` (messages never include labels/URLs); `03-04:235` (duplicate `getItemId` warning); `03-03-selection-and-marquee.md` selection store/security; `07-testing-strategy.md` ST-44
**Codebase/Context Evidence:** RD-01 §Security (`RD-01:217`) says “no selected IDs, labels, or image URLs are logged”; RD-01 AC 16 and RD-02 §Security reinforce it. The plan’s dev-warning rule prohibits labels and image URLs but not item IDs or selected IDs. The duplicate-`getItemId` warning could include the ID. The selection store has no explicit no-ID-logging statement.

**The Problem:** The no-logging rule is incomplete. A duplicate-ID warning or a selection diagnostic could emit an item/selected ID, which the requirements explicitly prohibit. The plan’s ST-44 does not cover ID logging.

**Options:**

| Option | Description                                                                                                                                             | Pros                                   | Cons                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| A      | Update the no-logging rule to “no item labels, image URLs, item IDs, or selected IDs in messages”; use a generic duplicate warning; add ST-44 assertion | Satisfies RD-01/RD-02 security; simple | Slightly less diagnostic detail in dev warnings                     |
| B      | Prohibit selected IDs only, allow item IDs in duplicate warnings                                                                                        | Keeps more diagnostic detail           | Item IDs may still be sensitive; RD-02 says no item content; weaker |
| C      | Remove dev warnings                                                                                                                                     | Avoids logging                         | Loses useful diagnostics; not necessary                             |

**Recommendation:** Option A — prohibit IDs as well as labels/URLs and test it.
**Confidence:** High
**User Decision:** Resolved — User accepted recommendation: Option A (fixed and verified)

**Iteration 2:** Fixed and verified — see §Iteration 2 Verification.

---

### PF-010: Early `test:perf` phase gates run only the harness smoke [🔵 OBSERVATION]

**Dimension:** 7 Testability (also 11 Ordering & Sequencing)
**Location:** `99-execution-plan.md` Phase 1–5 `Verify` lines; `03-05-test-harness-and-performance.md:170-177`; `07-testing-strategy.md:96` (ST-45)
**Codebase/Context Evidence:** The `test:perf` script exists from Phase 1, but the real `test/perf/tile-grid.perf.test.tsx` is written in Phase 6 (`99` §6.1). Phases 2–5 run only the harness smoke; the Phase 3/4 gates cannot catch geometry or selection performance regressions. PF-003 moves the 20K selection test to Phase 4; the geometry/scroll performance test remains Phase 6.

**The Problem:** The phase `Verify` lines imply performance is gated before the real performance test exists. This is an observation, not a blocking defect; the final Phase 6 gate is real.

**Recommendation:** Move the 20K selection test to Phase 4 (PF-003); move the geometry/scroll performance test to Phase 4 or rename the early `test:perf` check to “performance harness smoke” so the gate does not overstate coverage.
**User Decision:** Resolved — User accepted recommendation: Option A (fixed and verified)

**Iteration 2:** Fixed and verified — see §Iteration 2 Verification.

---

### Iteration 2 Verification

**Scope:** unchanged — the plan documents only. No feature code, requirements, runtime tests, or commit were changed.

**Fixes applied (current locations):**

| Finding | Fix applied                                                                                                                                               | Current location                                                                                                |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| PF-001  | Added the internal Phase A release/contract-freeze gate; removed “shipped surface” wording; package README is marked unreleased; added Phase 6 task 6.3.3 | `00-index.md` §Release and Contract Freeze; `01-requirements.md` §Release; `03-04` §Package surface; `99` 6.3.3 |
| PF-002  | Added the node-environment import smoke; refined AR #21; no full SSR render                                                                               | `07` ST-46; `03-04` §Testing; `03-05` §Harness; `99` 2.1.2; AR #21 refinement                                   |
| PF-003  | Added the 20K public selection proxy and moved it to Phase 4; pure transition test kept as a supplement                                                   | `03-03` §Performance; `03-05` §Browser/§Performance; `07` ST-47; `99` 4.1.2/6.1.1                               |
| PF-004  | Added renderer DOM-read spy and per-layout offscreen scroll assertions                                                                                    | `03-02` §Performance/§Testing; `03-05` §Browser; `07` ST-48; `99` 3.1.1                                         |
| PF-005  | Added internal memoized `TileGridItemView`, stable `renderItem` contract, render-count test; updated the usage example to `useCallback`                   | `03-04` §Memoized item cell/§DOM/§State; `00-index` usage; `07` ST-49; `99` 2.2.9/4.2.4; `01` Renderer          |
| PF-006  | Added Web application + Data and migration lenses and the compatibility boundary                                                                          | `00-index` §Domain Lenses/§Compatibility; `01` §Domain Lenses and Compatibility Boundary                        |
| PF-007  | Added the Partial RD Coverage table and roadmap note                                                                                                      | `00-index` §Partial RD Coverage; `01` §Partial RD Coverage; roadmap notes                                       |
| PF-008  | Pinned `vitest` 5.0.5 to match the browser-provider peer                                                                                                  | `03-05` §Dependencies; `02` external deps; `01` Vitest pin; `99` 1.2.1/6.2.4                                    |
| PF-009  | Extended the no-logging rule to item and selected IDs; generic duplicate warning                                                                          | `03-04` §Dev warnings; `03-03` §Performance/logging; `07` ST-44                                                 |
| PF-010  | Documented the early `test:perf` harness-smoke gate; the public selection proxy is now Phase 4                                                            | `99` execution rule; `03-05` §Performance; `01` acceptance 4; `07` ST-47/ST-49                                  |

**Re-scan result:** 0 new root-cause findings; 0 carried forward. The stable-`renderItem` contract is a PF-005 refinement (needed for the memoized-cell correctness), not an independent root cause.

**Document checks:** table consistency, local links, fences, and trailing whitespace pass for the plan documents; 69 task lines across 6 phases (10/16/14/12/8/9), 49 ST cases, 24 AR entries; no duplicate task IDs; no stale `68`/`ST-1–ST-45`/`shipped surface`/`No SSR harness` wording. Post-fix hash `21a5b2f25ed938bc9b41b37aee963306f68896b443d2696a8fd72719c1698d28` matches the plan documents (report and temporary notes excluded).

**Environment note:** no Node/pnpm is available in this workspace, so no `pnpm`/browser/performance command was run. The pass is a plan-document and codebase-grounding pass; the execution phase still runs the full verification.

**Verdict:** all five major findings are fixed and verified; all four minors and the observation are fixed or accepted. The plan is **PASSED** and may advance the roadmap to `🔬 Plan Preflighted`.

## Accepted Risks and Previous Decisions

These are recorded, not re-opened. They do not block the pass if the findings above are resolved.

| Item                            | Decision                                                                                      | Handling                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| AR #16                          | Frame timing logs the 60fps target and asserts p95 under 50ms as a clear-regression threshold | Accepted risk; the 60fps target remains the logged metric; no re-litigation                                             |
| AR #21                          | No full SSR render harness; browser tests are the E2E                                         | Partially invalidated by RD-02 AC 16 for module-evaluation only; PF-002 adds a node import smoke, not a full SSR render |
| AR #4                           | Marquee controller is internal, tested, and staged for RD-03                                  | Accepted; no package-root export; not public dead code                                                                  |
| AR #5                           | `zoomable`/`onTileSizeChange` deferred to RD-03                                               | Accepted; PF-007 records the partial RD-02 coverage                                                                     |
| AR #8                           | `@dnd-kit/core` deferred to RD-04                                                             | Accepted; PF-001 adds the release/contract gate so the package is not published without it                              |
| AR #1 / AR #3                   | Minimal RD-03 selection wiring in Phase A                                                     | Accepted; PF-007 records the partial RD-03 coverage; PF-001 prevents a partial public release                           |
| Requirements PF-002             | One composed `TileGridProps<T>` and full export pin                                           | The basis of PF-001; the plan’s Phase A subset is internal until the final contract is frozen                           |
| AR #7 / AR #9 / AR #10 / AR #18 | TanStack, browser matrix, separate browser/perf configs, pinned dependencies                  | Approved complexity; no scope-creep finding                                                                             |

## Scan Notes

- The plan documents were scanned in full (11 files, 2,188 lines) against the requirements README, RD-01–RD-04, the feature/portfolio roadmaps, `AGENTS.md`, `codeops/codeops.json`, and the actual package/test/build/CI configuration.
- The plan documents are untracked; the scan-start content hash is recorded above. If fixes are applied, the report will record the post-fix hash and re-scan evidence.
- No code or test was changed by this review. No `pnpm` command was run; the planning workspace has no Node/pnpm toolchain.
- The audit target is the plan; the requirements README/RD defects are context and are not independently reported. The release contradiction (PF-001) is reported because the plan claims a shipped surface; the data/migration lens (PF-006) is reported because the plan omits the requirements’ selected lens.
- `_preflight-notes.md` is a temporary resume artifact and will be deleted when the preflight completes.

## User Decisions

PF-001–PF-010 are resolved — the user accepted Option A for all. Iteration 2 applied and verified every fix; no findings remain. The preflight is **PASSED** (all 10 findings resolved).
