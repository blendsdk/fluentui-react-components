# Execution Plan: Loading Primitives

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-10-18 13:24
> **Progress**: 49/49 tasks (100%)
> **CodeOps Artifact Schema**: 1

## Overview

Implements `loading/RD-01`: the standalone `Loading` filler (Phase 1), the `LoadingOverlay` shim
(Phase 2), the `useLoading()` controller (Phase 3), and integration/hardening (Phase 4). Each
implementation phase follows the mandatory three-session ordering: specification tests → red phase
→ implementation → green phase → implementation tests → full verification.

**Paths:** relative to `packages/react-components/`.

**Execution commit mode requested:** `--auto-commit` (handled by the `exec-plan` skill; this plan
document does not run git commands).

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title                     | Tasks |
| ----- | ------------------------- | ----- |
| 1     | Loading filler            | 16    |
| 2     | LoadingOverlay shim       | 16    |
| 3     | useLoading controller     | 12    |
| 4     | Integration and hardening | 5     |

**Total: 49 tasks across 4 phases** (no fabricated hour estimates — scope is bounded by the
task-size criteria in the make-plan quality checklist).

> **⚠️ EXECUTION RULE — APPLIES TO EVERY AGENT EXECUTING THIS PLAN:**
>
> The task checkboxes in the phase sections below are the **single source of truth** for progress.
> Every task line appears exactly once in this document. The executing agent MUST:
>
> 1. **On implementation:** mark the task `[~]` with a timestamp —
>    `- [~] 1.1.1 Task description ⏳ (implemented: YYYY-MM-DD HH:MM)`
> 2. **On verify pass:** promote it to `[x]` —
>    `- [x] 1.1.1 Task description ✅ (completed: YYYY-MM-DD HH:MM)`
> 3. **Update the Progress header** (`> **Progress**: X/Y tasks (Z%)`) and the Last Updated stamp
>    after EVERY task — never batch updates. Only `[x]` counts as complete.
> 4. **Resume** by scanning the phase sections top-to-bottom: the first `[~]` task is resumed first,
>    else the first `[ ]` task.
> 5. **On blocker:** mark the task `[!]` and append `Blocked: <short reason>` on the same line.
>    The plan lifecycle is `Ready`, `Executing`, `Done`, or `Blocked`, derived from these markers.
>
> Timestamps come from `date '+%Y-%m-%d %H:%M'` — never invented. Failure to keep the marks current
> means progress is invisible after crashes, context resets, or session handoffs.

---

## Phase 1: Loading filler

> **Phase baseline tree**: 79cd7e72c5c215da1cf73cd649a8cc7f3c4ac761
> **Scope mode**: strict · **Expected modification set** (`packages/react-components/`-relative):
> `test/loading.spec.test.tsx` · `test/loading.ssr.test.tsx` · `test/package-exports.spec.test.ts` ·
> `test/loading.impl.test.tsx` · `src/components/Loading/**` · `src/index.ts` · `README.md` — plus the
> plan/roadmap bookkeeping in this repository's `codeops/` documents
> **Lenses**: api-surface (public component contract) · accessibility (status announcement, delay,
> non-focusable filler)
> **Reasoning**: high — contract-heavy public component with a live region, delayed visibility and
> a shared internal renderer used by the overlay

### Step 1.1: Specification Tests (before implementation)

**Reference**: [07](07-testing-strategy.md) §Loading (ST-1…ST-10) · [03-01](03-01-loading.md) §DOM and Accessibility Structure · AR-3, AR-5, AR-7, AR-9
**Objective**: Pin the observable `Loading` contract before any component code exists.

- [x] 1.1.1 [spec-author] Write the `Loading` contract spec tests from ST-1…ST-10, including ST-7a/ST-7b — `test/loading.spec.test.tsx` ✅ (completed: 2026-10-17 14:52)
- [x] 1.1.2 [spec-author] Extend the export-surface pin with `Loading` and the `LoadingProps` type pin (partial pin; the cumulative list is reached in Phase 3) — `test/package-exports.spec.test.ts` ✅ (completed: 2026-10-17 14:52)
- [x] 1.1.3 Run the spec suite and `pnpm type-check`, and verify the **red phase** (missing export/component and rejected negative type pins expected; document any pre-implementation pass with justification) — `pnpm test`, `pnpm type-check` ✅ (completed: 2026-10-17 14:53)

> **Red-phase record (1.1.3):** 12/12 `loading.spec.test.tsx` cases failed because the package
> root does not export `Loading` (`Element type is invalid ... got: undefined`); the export pin and
> `LoadingProps` import failed for the same reason. `pnpm type-check` failed with `TS2305` (missing
> `Loading`/`LoadingProps` export) and four `TS2578` unused `@ts-expect-error` directives caused by
> the unresolved `LoadingProps` type. All failures are the expected missing implementation, not
> test errors; no case passed pre-implementation.

### Step 1.2: Implementation

**Reference**: [03-01](03-01-loading.md) §Implementation Details · AR-2, AR-3, AR-5, AR-7, AR-9
**Objective**: Deliver the filler with the status, delay, defaults and pass-through contract.

- [x] 1.2.1 Add the internal label resolver (`resolveLoadingLabel`, `normalizeLabel`) and delayed-visibility hook — `src/components/Loading/loadingLabel.ts`, `src/components/Loading/useDelayedVisibility.ts` ✅ (completed: 2026-10-17 14:55)
- [x] 1.2.2 Add the `LoadingProps` contract and managed-attribute omissions — `src/components/Loading/Loading.types.ts` ✅ (completed: 2026-10-17 14:55)
- [x] 1.2.3 Add the `Loading` styles, including the exported shared visually-hidden class and the indicator wrapper — `src/components/Loading/useLoadingStyles.styles.ts` ✅ (completed: 2026-10-17 14:55)
- [x] 1.2.4 Add the internal visual indicator renderer with its own `aria-hidden` wrapper — `src/components/Loading/renderLoadingIndicator.tsx` ✅ (completed: 2026-10-17 14:55)
- [x] 1.2.5 Add the state hook returning `LoadingBaseState` with defaults, visibility and classes — `src/components/Loading/useLoadingBase.ts` ✅ (completed: 2026-10-17 14:55)
- [x] 1.2.6 Add the render function (`renderLoading(state, ref)`), forward-ref shell and barrel — `src/components/Loading/renderLoading.tsx`, `src/components/Loading/Loading.tsx`, `src/components/Loading/index.ts` ✅ (completed: 2026-10-17 14:55)
- [x] 1.2.7 Export `Loading` and its props from the package root — `src/index.ts` ✅ (completed: 2026-10-17 14:55)
- [x] 1.2.8 Run the spec suite and verify the **green phase** — `pnpm test` ✅ (completed: 2026-10-17 14:55)

### Step 1.3: Implementation Tests, Story, SSR Smoke and Documentation

**Reference**: [07](07-testing-strategy.md) §Implementation Tests, §SSR Smoke Cases · [03-01](03-01-loading.md) §Styles · AR-10, AR-11
**Objective**: Cover the internals, show every variant, add the early node smoke and document the filler.

- [x] 1.3.1 Write the `Loading` implementation tests (class merge, structure, indicator `aria-hidden` ownership, timer cleanup and delay normalization) — `test/loading.impl.test.tsx` ✅ (completed: 2026-10-17 14:58)
- [x] 1.3.2 Write the `Loading` story (default, sizes, label positions, fixed-height parent, delayed reveal) — `src/components/Loading/Loading.stories.tsx` ✅ (completed: 2026-10-17 14:58)
- [x] 1.3.3 Add the README `Loading` section, props table, accessibility note and composition patterns — `README.md` ✅ (completed: 2026-10-17 14:58)
- [x] 1.3.4 Add the `Loading` SSR smoke case (ST-46) — `test/loading.ssr.test.tsx` ✅ (completed: 2026-10-17 14:58)
- [x] 1.3.5 Full phase verification, including the Storybook build — `pnpm verify`, `pnpm storybook:build` ✅ (completed: 2026-10-17 14:58)

**Deliverables**:

- [x] `Loading` is exported and its spec tests are green.
- [x] The status/delay/native-prop contract is covered by spec and impl tests.
- [x] The story shows every documented variant.
- [x] The SSR smoke covers the server render.
- [x] The README section is complete.
- [x] All verification passing.

**Verify**: `pnpm verify` and `pnpm storybook:build`

---

## Phase 2: LoadingOverlay shim

> **Phase baseline tree**: de23539ec898a7d7b16bd94dc3088a2a9c643100
> **Scope mode**: strict · **Expected modification set** (`packages/react-components/`-relative):
> `test/loading-overlay.spec.test.tsx` · `test/loading.ssr.test.tsx` · `test/package-exports.spec.test.ts` ·
> `test/loading-overlay.impl.test.tsx` · `src/components/LoadingOverlay/**` ·
> `src/components/Loading/useLoadingStyles.styles.ts` · `src/index.ts` · `README.md` — plus the
> plan/roadmap bookkeeping in this repository's `codeops/` documents
> **Lenses**: api-surface (overlay contract) · accessibility (inert, live region, focus capture and
> restoration)
> **Reasoning**: high — environment-dependent focus behavior, inert interaction blocking and a
> delayed live-region reveal; jsdom cannot fully reproduce the browser behavior

### Step 2.1: Specification Tests (before implementation)

**Reference**: [07](07-testing-strategy.md) §LoadingOverlay (ST-11…ST-27) · [03-02](03-02-loading-overlay.md) §State Machine, §Focus Algorithm · AR-4, AR-5, AR-6, AR-9
**Objective**: Pin the overlay contract, including delay, inert, status and focus behavior, before implementation.

- [x] 2.1.1 [spec-author] Write the `LoadingOverlay` contract spec tests from ST-11…ST-27, including ST-19a and ST-24a — `test/loading-overlay.spec.test.tsx` ✅ (completed: 2026-10-17 15:08)
- [x] 2.1.2 [spec-author] Extend the export-surface pin with `LoadingOverlay` and the `LoadingOverlayProps` type pin (partial pin; the cumulative list is reached in Phase 3) — `test/package-exports.spec.test.ts` ✅ (completed: 2026-10-17 15:08)
- [x] 2.1.3 Run the spec suite and `pnpm type-check`, and verify the **red phase** — `pnpm test`, `pnpm type-check` ✅ (completed: 2026-10-17 15:08)

> **Red-phase record (2.1.3):** 19/19 `loading-overlay.spec.test.tsx` cases failed because the
> package root does not export `LoadingOverlay` (`Element type is invalid ... got: undefined`);
> `pnpm type-check` failed with `TS2305` (missing `LoadingOverlay`/`LoadingOverlayProps` export) and
> nine `TS2578` unused `@ts-expect-error` directives caused by the unresolved props type. One
> test-authoring type error in the local scrim helper was corrected before implementation (a
> mechanical fix with no expectation change). No case passed pre-implementation.

### Step 2.2: Implementation

**Reference**: [03-02](03-02-loading-overlay.md) §Implementation Details · AR-4, AR-5, AR-6, AR-9
**Objective**: Deliver the controlled overlay with the persistent status, scrim, inert and focus contract.

- [x] 2.2.1 Add the `LoadingOverlayProps` contract and managed-attribute omissions — `src/components/LoadingOverlay/LoadingOverlay.types.ts` ✅ (completed: 2026-10-17 15:08)
- [x] 2.2.2 Add the overlay styles (root, content, scrim, indicator wrapper, focus-ring suppression) and import the shared `visuallyHidden` class — `src/components/LoadingOverlay/useLoadingOverlayStyles.styles.ts` ✅ (completed: 2026-10-17 15:08)
- [x] 2.2.3 Add the internal focus capture/move/restore hook taking `rootRef`, `contentRef`, `loading` and `visible` — `src/components/LoadingOverlay/useLoadingOverlayFocus.ts` ✅ (completed: 2026-10-17 15:08)
- [x] 2.2.4 Add the state hook returning `LoadingOverlayState` with delay, label, `useId` status id, refs, focus wiring and classes — `src/components/LoadingOverlay/useLoadingOverlay.ts` ✅ (completed: 2026-10-17 15:08)
- [x] 2.2.5 Add the pure overlay renderer over `LoadingOverlayState` with persistent status, content wrapper, scrim and indicator — `src/components/LoadingOverlay/renderLoadingOverlay.tsx` ✅ (completed: 2026-10-17 15:08)
- [x] 2.2.6 Add the forward-ref shell and barrel — `src/components/LoadingOverlay/LoadingOverlay.tsx`, `src/components/LoadingOverlay/index.ts` ✅ (completed: 2026-10-17 15:08)
- [x] 2.2.7 Export `LoadingOverlay` and its props from the package root — `src/index.ts` ✅ (completed: 2026-10-17 15:08)
- [x] 2.2.8 Run the spec suite and verify the **green phase** — `pnpm test` ✅ (completed: 2026-10-17 15:08)

### Step 2.3: Implementation Tests, Story, SSR Smoke and Documentation

**Reference**: [07](07-testing-strategy.md) §Implementation Tests, §SSR Smoke Cases · [03-02](03-02-loading-overlay.md) §Focus Algorithm · AR-10, AR-11
**Objective**: Cover the focus/timer internals, show the overlay variants and document the accessibility contract.

- [x] 2.3.1 Write the `LoadingOverlay` implementation tests (capture ordering, body-focus fallback, ownership restore, unmount-while-visible teardown, class merge, structure) — `test/loading-overlay.impl.test.tsx` ✅ (completed: 2026-10-17 15:12)
- [x] 2.3.2 Write the `LoadingOverlay` story with app-owned boolean, fast-operation and custom-label cases — `src/components/LoadingOverlay/LoadingOverlay.stories.tsx` ✅ (completed: 2026-10-17 15:12)
- [x] 2.3.3 Add the README `LoadingOverlay` section, props table, accessibility/focus notes, the region-scoped limitation and composition patterns — `README.md` ✅ (completed: 2026-10-17 15:12)
- [x] 2.3.4 Extend the SSR smoke with the overlay case (ST-47) — `test/loading.ssr.test.tsx` ✅ (completed: 2026-10-17 15:12)
- [x] 2.3.5 Full phase verification, including the Storybook build — `pnpm verify`, `pnpm storybook:build` ✅ (completed: 2026-10-17 15:12)

**Deliverables**:

- [x] `LoadingOverlay` is exported and its spec tests are green.
- [x] The delay/inert/status/focus contract is covered by spec and impl tests.
- [x] The story shows app-owned and fast-operation cases.
- [x] The SSR smoke covers the overlay's server render.
- [x] The README section documents focus, inert, announcement behavior and the portaled/fixed-content limitation.
- [x] All verification passing.

**Verify**: `pnpm verify` and `pnpm storybook:build`

---

## Phase 3: useLoading controller

> **Phase baseline tree**: 07c7d02fa22c1126170ad19b674f357236935f53
> **Scope mode**: strict · **Expected modification set** (`packages/react-components/`-relative):
> `test/use-loading.spec.test.tsx` · `test/package-exports.spec.test.ts` ·
> `test/use-loading.impl.test.tsx` · `test/loading.ssr.test.tsx` ·
> `src/components/Loading/useLoading.types.ts` · `src/components/Loading/useLoading.ts` ·
> `src/components/Loading/index.ts` · `src/index.ts` · `src/components/LoadingOverlay/LoadingOverlay.stories.tsx` ·
> `README.md` — plus the plan/roadmap bookkeeping in this repository's `codeops/` documents
> **Lenses**: api-surface (hook contract) · concurrency (ref-counting, out-of-order labels)
> **Reasoning**: high — concurrent operation counting, error propagation, stable callback identity
> and label lifecycle are correctness-sensitive

### Step 3.1: Specification Tests (before implementation)

**Reference**: [07](07-testing-strategy.md) §useLoading (ST-28…ST-43) · [03-03](03-03-use-loading.md) §State Model, §Label Policy, §`run` Algorithm · AR-7, AR-8
**Objective**: Pin the controller contract, ref-counting, labels and error behavior before implementation.

- [x] 3.1.1 [spec-author] Write the `useLoading` contract spec tests from ST-28…ST-43, including ST-31a, ST-32a, ST-33a and ST-41a — `test/use-loading.spec.test.tsx` ✅ (completed: 2026-10-17 15:20)
- [x] 3.1.2 [spec-author] Extend the export-surface pin with `useLoading` and the `LoadingOptions`/`LoadingController` type pins (final cumulative list, ST-44/ST-45) — `test/package-exports.spec.test.ts` ✅ (completed: 2026-10-17 15:20)
- [x] 3.1.3 Run the spec suite and `pnpm type-check`, and verify the **red phase** — `pnpm test`, `pnpm type-check` ✅ (completed: 2026-10-17 15:20)

> **Red-phase record (3.1.3):** 20/20 `use-loading.spec.test.tsx` cases failed with
> `TypeError: useLoading is not a function`; the export surface failed with 17 runtime symbols
> instead of the expected 18. `pnpm type-check` failed with `TS2305` for the missing
> `useLoading`, `LoadingOptions` and `LoadingController` exports. No case passed pre-implementation.

### Step 3.2: Implementation

**Reference**: [03-03](03-03-use-loading.md) §Implementation Details · AR-7, AR-8
**Objective**: Deliver the local controller with `run`, active-operation ids and the label policy.

- [x] 3.2.1 Add `LoadingOptions` and `LoadingController` — `src/components/Loading/useLoading.types.ts` ✅ (completed: 2026-10-17 15:20)
- [x] 3.2.2 Add the reducer, ids, label normalization/resolution and the public hook — `src/components/Loading/useLoading.ts` ✅ (completed: 2026-10-17 15:20)
- [x] 3.2.3 Export `useLoading` and its types from the Loading barrel and the package root — `src/components/Loading/index.ts`, `src/index.ts` ✅ (completed: 2026-10-17 15:20)
- [x] 3.2.4 Run the spec suite and verify the **green phase** — `pnpm test` ✅ (completed: 2026-10-17 15:20)

### Step 3.3: Implementation Tests, Integration Story and Documentation

**Reference**: [07](07-testing-strategy.md) §Implementation Tests, §Integration Tests, §SSR Smoke Cases · [03-03](03-03-use-loading.md) §Label Policy · AR-7, AR-8, AR-10, AR-12
**Objective**: Cover out-of-order labels and unmount safety, show the canonical integration and document the hook.

- [x] 3.3.1 Write the `useLoading` implementation tests (out-of-order id removal, immediate busy state, label stack, no stale entries) — `test/use-loading.impl.test.tsx` ✅ (completed: 2026-10-17 15:23)
- [x] 3.3.2 Add the async `useLoading` + `LoadingOverlay` story, including the `.catch(catchError)` pattern — `src/components/LoadingOverlay/LoadingOverlay.stories.tsx` ✅ (completed: 2026-10-17 15:23)
- [x] 3.3.3 Add the README `useLoading` section, decision table, migration note and error-handling guidance — `README.md` ✅ (completed: 2026-10-17 15:23)
- [x] 3.3.4 Extend the SSR smoke with an idle `useLoading` component (ST-48) — `test/loading.ssr.test.tsx` ✅ (completed: 2026-10-17 15:23)
- [x] 3.3.5 Full phase verification, including the Storybook build — `pnpm verify`, `pnpm storybook:build` ✅ (completed: 2026-10-17 15:23)

**Deliverables**:

- [x] `useLoading` is exported and its spec tests are green.
- [x] Ref-counting, labels, error propagation and unmount safety are covered.
- [x] The integration story and the complete SSR smoke exist.
- [x] The README documents the hook and the decision table.
- [x] All verification passing.

**Verify**: `pnpm verify` and `pnpm storybook:build`

---

## Phase 4: Integration and hardening

> **Phase baseline tree**: ed011b392bf1a707a796a7b43f52b236879446b1
> **Scope mode**: strict · **Expected modification set** (`packages/react-components/`-relative):
> `src/components/Loading/**` · `src/components/LoadingOverlay/**` · `README.md` ·
> `test/package-exports.spec.test.ts` — plus the plan/roadmap bookkeeping in this repository's
> `codeops/` documents
> **Lenses**: documentation · verification
> **Reasoning**: medium — bounded audit and deterministic verification; no new behavior

### Step 4.1: Audit and final verification

**Reference**: [03-01](03-01-loading.md), [03-02](03-02-loading-overlay.md), [03-03](03-03-use-loading.md) · AR-9, AR-10, AR-11, AR-13, AR-14
**Objective**: Confirm the public surface, documentation and manual accessibility checks match the plan, then run the full gate.

- [x] 4.1.1 Audit every public symbol, prop, hook member and exported type for documentation completeness; remove any planning/RD/task references from code comments — `src/components/Loading/**`, `src/components/LoadingOverlay/**` ✅ (completed: 2026-10-17 15:33)
- [x] 4.1.2 Verify README links, props tables, decision table and export pins agree with the implemented surface — `README.md`, `src/index.ts`, `test/package-exports.spec.test.ts` ✅ (completed: 2026-10-17 15:33)
- [x] 4.1.3 Build Storybook and verify the stories compile — `pnpm storybook:build` ✅ (completed: 2026-10-17 15:33)
- [x] 4.1.4 Run the full repository gate — `pnpm verify` ✅ (completed: 2026-10-17 15:33)
- [x] 4.1.5 Complete the manual accessibility checklist below in a real browser, then record the observed result and pass/fail in the table — this document (table below) ✅ (completed: 2026-10-18 13:24; user-reported all ten checks pass)

**Manual accessibility checklist (4.1.5):**

> Fill one row per browser/assistive-technology combination actually exercised. A row is `Pass` only
> when the observed result matches the expected result. The table must be complete before Phase 4 is
> marked done; browser and screen-reader execution remains user-owned.

| #    | Browser       | Screen reader | Scenario                                                             | Expected result                                                                        | Observed result                 | Pass/Fail |
| ---- | ------------- | ------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------- | --------- |
| M-1  | User-reported | User-reported | Inert blur: focus a control inside the content, start loading        | Focus moves to the named overlay root; no focus is lost to the document                | Pass — user-reported 2026-10-18 | Pass      |
| M-2  | User-reported | User-reported | Focus restore: end loading after M-1                                 | Focus returns to the reveal-time element (or the loading-start element)                | Pass — user-reported 2026-10-18 | Pass      |
| M-3  | User-reported | User-reported | Pointer blocking: click or tap covered in-flow content while visible | No click, navigation or control activation occurs                                      | Pass — user-reported 2026-10-18 | Pass      |
| M-4  | User-reported | User-reported | Idle state: `loading={false}`                                        | No scrim, no status text and the content is interactive                                | Pass — user-reported 2026-10-18 | Pass      |
| M-5  | User-reported | User-reported | Announcement: reveal the overlay                                     | The label is announced once; the root name does not double-announce                    | Pass — user-reported 2026-10-18 | Pass      |
| M-6  | User-reported | User-reported | Focus ring: focus the overlay root                                   | No visible ring on the root, as designed, without confusing the user                   | Pass — user-reported 2026-10-18 | Pass      |
| M-7  | User-reported | User-reported | Portaled `Menu` and sticky header inside the content                 | Record whether either escapes the scrim; the known region-scoped limitation            | Pass — user-reported 2026-10-18 | Pass      |
| M-8  | User-reported | User-reported | Light and dark theme, forced colors and reduced motion               | Scrim and label remain legible in both themes; no extra motion beyond Fluent's spinner | Pass — user-reported 2026-10-18 | Pass      |
| M-9  | User-reported | User-reported | Busy semantics: inspect the content wrapper while `loading` is true  | `aria-busy` is exposed on the `display: contents` wrapper; if not, record the fallback | Pass — user-reported 2026-10-18 | Pass      |
| M-10 | User-reported | User-reported | Region scope: a 200×200 container with short content                 | The scrim covers the entire 200×200 box; the rest of the page stays interactive        | Pass — user-reported 2026-10-18 | Pass      |

> **Manual pass record (2026-10-18):** the user reported that all ten checks passed in a real
> browser and assistive-technology session. The specific browser and AT versions were not
> recorded; the rows above are user-reported observations, not an independent agent run.
>
> **Audit record (4.1.1–4.1.4):** every public component, prop, hook member and exported type
> carries a teaching-tone doc comment; non-trivial internals (delayed visibility, label resolution,
> focus algorithm, shared indicator) are documented too. No planning, requirement or task reference
> appears in shipped code or comments. The README props tables match the exported types, the
> decision table and migration note cover the three pieces, and the export pin is exact. Storybook
> compiles, and `pnpm verify` passes (28 test files, 289 tests).

**Deliverables**:

- [x] The public surface matches RD-01 R14 and the export pin.
- [x] Documentation is complete and free of planning references.
- [x] Storybook and `pnpm verify` pass.
- [x] The manual accessibility checklist table is completed with user-reported results (2026-10-18).

**Verify**: `pnpm verify` and `pnpm storybook:build`

---

## Dependencies

```
Phase 1 (Loading)
    ↓
Phase 2 (LoadingOverlay)
    ↓
Phase 3 (useLoading + integration)
    ↓
Phase 4 (audit and hardening)
```

Phase 3's hook implementation depends only on the `Loading/` folder and barrel from Phase 1; its
integration story depends on Phase 2. The phases execute sequentially to keep the spec-first order
and the review boundary explicit.

---

## Closure Record

**Closed**: 2026-10-18 13:24

- All 49 tasks are complete. Task 4.1.5 records the user's report that all ten manual
  accessibility checks passed; the browser and AT versions were not recorded.
- Package `0.2.1` contains the loading primitives and the contrast/story changes. This
  closure changes repository documents only; no additional release is required.
- If independent accessibility evidence is required later, re-run the checklist and record
  the browser and AT versions.

## Success Criteria

**Feature is complete when:**

1. [x] All 49 tasks are checked `[x]` — 49/49 done; 4.1.5 is user-reported pass on 2026-10-18.
2. ✅ All verification passing (`pnpm verify`).
3. [x] `pnpm storybook:build` succeeds — done; manual checklist recorded as user-reported pass.
4. ✅ No warnings or errors.
5. ✅ No dead code — no unused parameters, helpers, modules or exports.
6. ✅ Security surface is N/A and documented: UI-only, no user input path, no network/storage, no
   HTML parsing, no auth or rate-limit surface.
7. ✅ Documentation updated: JSDoc, README sections, props tables, decision table and stories.
8. ✅ Code reviewed through the repository's quality profile — phase reviews 1–4 recorded, including the fix-diff re-review.
9. [x] Post-completion project re-analysis and roadmap sync (handled by the exec-plan skill).
10. ✅ `--auto-commit` execution mode applied by exec-plan (commit and push after each verified task).
