# Execution Plan: app-launcher

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-10-16 17:09
> **Progress**: 19/33 tasks (58%)
> **CodeOps Artifact Schema**: 1

## Overview

Implements `app-launcher/RD-01` and `app-launcher/RD-02`: a byte-identical port of the VirtuoApp
launcher family with its stories migrated from the source development workbench. Phase 1 lands the
content blocks (RD-02), Phase 2 the shell (RD-01) — each with specification tests first (ported;
red phase verified), then the implementation, then implementation tests and hardening, the
mandatory three-step ordering (AR P2).

**Paths:** relative to `packages/react-components/` unless stated otherwise; the source authority
is `/home/gevik/workdir/codeindustry/VirtuoApp/packages/react-app-launcher` (read-only).

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title          | Tasks |
| ----- | -------------- | ----- |
| 1     | Content blocks | 19    |
| 2     | Shell          | 14    |

**Total: 33 tasks across 2 phases** (no fabricated hour estimates — scope is bounded by the
task-size criteria in the make-plan quality checklist).

> **⚠️ EXECUTION RULE — APPLIES TO EVERY AGENT EXECUTING THIS PLAN:**
>
> The task checkboxes in the phase sections below are the **single source of truth** for
> progress. Every task line appears exactly once in this document. The executing agent MUST:
>
> 1. **On implementation:** mark the task `[~]` with a timestamp —
>    `- [~] 1.1.1 Task description ⏳ (implemented: YYYY-MM-DD HH:MM)`
> 2. **On verify pass:** promote it to `[x]` —
>    `- [x] 1.1.1 Task description ✅ (completed: YYYY-MM-DD HH:MM)`
> 3. **Update the Progress header** (`> **Progress**: X/Y tasks (Z%)`) and the Last Updated
>    stamp after EVERY task — never batch updates. Only `[x]` counts as complete.
> 4. **Resume** by scanning the phase sections top-to-bottom: the first `[~]` task is resumed
>    first, else the first `[ ]` task.
> 5. **On blocker:** mark the task `[!]` and append `Blocked: <short reason>` on the same line.
>    The plan lifecycle is `Ready`, `Executing`, `Done`, or `Blocked`, derived from these markers.
>
> Timestamps come from `date '+%Y-%m-%d %H:%M'` — never invented. Failure to keep the marks
> current means progress is invisible after crashes, context resets, or session handoffs.

---

## Phase 1: Content blocks

> **Phase baseline tree**: `6d13c3d279b8d49e795f055cd9e3e7c2293df585`
> **Scope mode**: strict · **Expected modification set** (`packages/react-components/`-relative):
> `test/app-launcher-search.spec.test.tsx` · `test/app-launcher-section.spec.test.tsx` ·
> `test/app-launcher-grid.spec.test.tsx` · `test/app-launcher-list.spec.test.tsx` ·
> `test/app-launcher-item.spec.test.tsx` · `test/app-launcher-item.impl.test.tsx` ·
> `test/package-exports.spec.test.ts` · `src/components/AppLauncherItem/**` ·
> `src/components/AppLauncherGrid/**` · `src/components/AppLauncherList/**` ·
> `src/components/AppLauncherSection/**` · `src/components/AppLauncherSearch/**` ·
> `src/index.ts` · `README.md` — plus the plan/roadmap bookkeeping under `codeops/`
> **Lenses**: api-surface (ported public contract and export pin)
> **Reasoning**: medium — verbatim port with deterministic checks (normalized-diff gate, oracle
> suite) plus story authoring

### Step 1.1: Specification Tests (before implementation)

**Reference**: [07](07-testing-strategy.md) §Search–Item (ST-15…ST-33) · [03-01](03-01-app-launcher-blocks.md) §Port procedure · AR #7 (req), AR P2, AR P6
**Objective**: Pin the block contract as executable tests before any block source exists.

- [x] 1.1.1 [spec-author] Port the five block spec test files **unchanged** — `test/app-launcher-search.spec.test.tsx`, `test/app-launcher-section.spec.test.tsx`, `test/app-launcher-grid.spec.test.tsx`, `test/app-launcher-list.spec.test.tsx`, `test/app-launcher-item.spec.test.tsx` (ST-15…ST-33) ✅ (completed: 2026-10-16 17:00)
- [x] 1.1.2 [spec-author] Extend the export-surface pin with the five block components and their six type pins — `test/package-exports.spec.test.ts` (ST-37, phase-1 part) ✅ (completed: 2026-10-16 17:00)
- [x] 1.1.3 Run the spec suite and verify the **red phase** (import/render failures expected — the components are not exported yet; document every pre-implementation pass with justification, e.g. erased `import type` pins) — `pnpm test` ✅ (completed: 2026-10-16 17:00)

**Deliverables**:

- [x] Spec files ported byte-identically carrying every ST-15…ST-33 case
- [x] Red-phase evidence recorded with the task marks

**Verify**: `pnpm test` (expected failures documented; no other command)

### Step 1.2: Implementation

**Reference**: [03-01](03-01-app-launcher-blocks.md) §Port procedure, §Normalized-diff gate, §Root barrel extension, §Export-pin extension · AR #1–#3 (req), AR P3
**Objective**: Port the block sources so the frozen spec tests pass.

- [x] 1.2.1 Port `AppLauncherItem` state layer verbatim — `src/components/AppLauncherItem/AppLauncherItemLayoutContext.ts`, `AppLauncherItem.types.ts`, `useAppLauncherItem.ts` ✅ (completed: 2026-10-16 17:05)
- [x] 1.2.2 Port `AppLauncherItem` view layer verbatim — `src/components/AppLauncherItem/useAppLauncherItemStyles.styles.ts`, `renderAppLauncherItem.tsx`, `AppLauncherItem.tsx`, `index.ts` ✅ (completed: 2026-10-16 17:05)
- [x] 1.2.3 Port `AppLauncherGrid` verbatim — `src/components/AppLauncherGrid/**` (6 files) ✅ (completed: 2026-10-16 17:05)
- [x] 1.2.4 Port `AppLauncherList` verbatim — `src/components/AppLauncherList/**` (6 files) ✅ (completed: 2026-10-16 17:05)
- [x] 1.2.5 Port `AppLauncherSection` verbatim — `src/components/AppLauncherSection/**` (6 files) ✅ (completed: 2026-10-16 17:05)
- [x] 1.2.6 Port `AppLauncherSearch` verbatim — `src/components/AppLauncherSearch/**` (6 files) ✅ (completed: 2026-10-16 17:05)
- [x] 1.2.7 Extend the package barrel with the five block exports and their types — `src/index.ts` ✅ (completed: 2026-10-16 17:05)
- [x] 1.2.8 Run the Phase-1 normalized-diff gate (format the source copies in `$CODEOPS_TMPDIR`; **expected: every diff empty** across the 31 component files and the five spec test files) and record the evidence — AR P3 ✅ (completed: 2026-10-16 17:05)
- [x] 1.2.9 Run the spec suite and verify the **green phase** (expected: the 16 shell-independent block spec tests and the extended pin pass; ST-17, ST-22 and ST-24 stay red until Phase 2 — AR P7) — a failing spec test means the port is wrong, never edit the test — `pnpm test` ✅ (completed: 2026-10-16 17:05)

> **Red-phase record (1.1.3, complete):** the filtered run over the six new/modified files reports
> 20 failed / 5 passed (25) — the 19 ported block tests fail with "Element type is invalid" (the
> components are not exported yet) and the pin's runtime-list assertion fails on exactly the five
> missing keys; the five type-pin tests pass pre-implementation (type-level pins erase at runtime —
> their real gate is the green-phase type-check). The full suite fails exactly the six files of
> this step: 20 failed / 171 passed (191); all 12 pre-existing test files stay green. Byte-identity:
> the Prettier-normalized diff of all five ported spec files against the source copies is empty.
> The three shell-composition cases (ST-17, ST-22, ST-24) stay red until Phase 2 (AR P7).
>
> **Green-phase record (1.2.9, complete):** 188/191 tests pass — the only failures are the three
> recorded shell-composition cases (search "clears the query…", grid/list "composes inside the
> launcher surface") waiting for Phase 2. `pnpm type-check` reports exactly the three matching
> `AppLauncher` imports (P8). The normalized-diff gate is empty for all 31 ported component files;
> all 12 pre-existing test files stay green.

**Deliverables**:

- [x] The five block folders per RD-02 §Ported file inventory
- [x] All shell-independent block spec tests green (16/19) plus the extended pin; the three shell-composition tests documented as Phase-2-dependent; normalized-diff evidence recorded

**Verify**: `pnpm test`

### Step 1.3: Implementation Tests & Hardening

**Reference**: [03-01](03-01-app-launcher-blocks.md) §New artifacts · [07](07-testing-strategy.md) §Test Data · AR #5, #10, #13, #18 (req)
**Objective**: Port the internals test, add the block stories and README sections, and verify the phase gate.

- [x] 1.3.1 Port the implementation tests **unchanged** — `test/app-launcher-item.impl.test.tsx` (ST-34…ST-36) ✅ (completed: 2026-10-16 17:09)
- [x] 1.3.2 Stories: `AppLauncherSearch` (Default/Controlled/Localized/Size) and `AppLauncherSection` (Titled/WithDivider/Untitled) — `src/components/AppLauncherSearch/AppLauncherSearch.stories.tsx`, `src/components/AppLauncherSection/AppLauncherSection.stories.tsx` ✅ (completed: 2026-10-16 17:09)
- [x] 1.3.3 Stories: `AppLauncherGrid` (Default/FourColumns/LongName) and `AppLauncherList` (Rows/LongName/Disabled) — `src/components/AppLauncherGrid/AppLauncherGrid.stories.tsx`, `src/components/AppLauncherList/AppLauncherList.stories.tsx` ✅ (completed: 2026-10-16 17:09)
- [x] 1.3.4 Story: `AppLauncherItem` (Default/IconLess/ColorfulLogo/DisabledPair/LongName incl. the local color-logo fixture) — `src/components/AppLauncherItem/AppLauncherItem.stories.tsx` ✅ (completed: 2026-10-16 17:09)
- [x] 1.3.5 README: the five block sections (description, props table, composition bullets), appended at the end of the Components section — `README.md` ✅ (completed: 2026-10-16 17:09)
- [x] 1.3.6 Storybook build and a11y pass — build green; the interactive a11y addon check runs with the Phase-2 manual checklist (2.3.4) — `pnpm storybook:build` ✅ (completed: 2026-10-16 17:09)
- [x] 1.3.7 Full verification — run `pnpm verify`; expected green except the three P7 cross-phase tests and their three `AppLauncher` type-import errors (P8 — recorded); the complete green gate runs in Phase 2 (2.3.6) — `pnpm verify` ✅ (completed: 2026-10-16 17:09)

> **Full-verification record (1.3.7, P8-adapted — complete):** `pnpm build` ✓ and
> `pnpm storybook:build` ✓; `pnpm test` = 191 passed / 3 failed (194) — exactly the three
> shell-composition cases (ST-17, ST-22, ST-24); `pnpm type-check` = exactly the three documented
> `AppLauncher` imports; `format:check` and `skill:check` green. The root `verify` chain stops at
> type-check, so the remaining steps were evidenced directly (fresh build and test runs) —
> everything beyond the documented P7/P8 set is green; the complete green `pnpm verify` runs in
> Phase 2 (2.3.6).

**Deliverables**:

- [x] Impl tests and the five block stories in place; README block sections written
- [x] `pnpm storybook:build` green; `pnpm verify` green except the recorded P7/P8 residual set

**Verify**: `pnpm verify` (green except the recorded P7/P8 set) and `pnpm storybook:build`

---

## Phase 2: Shell

> **Phase baseline tree**: _(recorded at execution start by the exec-plan skill from a temporary-index snapshot)_
> **Scope mode**: strict · **Expected modification set** (`packages/react-components/`-relative):
> `test/app-launcher.spec.test.tsx` · `test/app-launcher-trigger.spec.test.tsx` ·
> `test/package-exports.spec.test.ts` · `src/components/AppLauncher/**` ·
> `src/components/AppLauncherTrigger/**` · `src/index.ts` · `README.md` — plus the plan/roadmap
> bookkeeping under `codeops/`
> **Lenses**: api-surface (ported public contract and export pin)
> **Reasoning**: medium — verbatim port with deterministic checks (normalized-diff gate, oracle
> suite) plus the composed workbench story

### Step 2.1: Specification Tests (before implementation)

**Reference**: [07](07-testing-strategy.md) §Shell–Trigger (ST-1…ST-14) · [03-02](03-02-app-launcher-shell.md) §Port procedure · AR #7 (req), AR #8 (req), AR P2
**Objective**: Pin the shell contract as executable tests before any shell source exists.

- [ ] 2.1.1 [spec-author] Port the two shell spec test files with **exactly the two whitelisted comment edits** (the two "workbench" comments in `app-launcher.spec.test.tsx` reworded to the Storybook equivalent; assertions untouched) — `test/app-launcher.spec.test.tsx`, `test/app-launcher-trigger.spec.test.tsx` (ST-1…ST-14)
- [ ] 2.1.2 [spec-author] Extend the export-surface pin with `AppLauncher`, `AppLauncherTrigger` and their three type pins — `test/package-exports.spec.test.ts` (ST-37 completion; final 15-entry list)
- [ ] 2.1.3 Run the spec suite and verify the **red phase** (import/render failures expected; document every pre-implementation pass with justification) — `pnpm test`

**Deliverables**:

- [ ] Shell spec files ported with only the whitelisted comment edits
- [ ] Red-phase evidence recorded with the task marks

**Verify**: `pnpm test` (expected failures documented; no other command)

### Step 2.2: Implementation

**Reference**: [03-02](03-02-app-launcher-shell.md) §Port procedure, §Normalized-diff gate, §Root barrel and pin · AR #1–#3 (req), AR P3
**Objective**: Port the shell sources so the frozen spec tests pass.

- [ ] 2.2.1 Port `AppLauncherTrigger` verbatim — `src/components/AppLauncherTrigger/**` (5 files)
- [ ] 2.2.2 Port `AppLauncher` with **exactly the one whitelisted comment edit** (drop the stale "and (in later iterations) the panel behavior" phrase from the `AppLauncher.tsx` JSDoc) — `src/components/AppLauncher/**` (6 files)
- [ ] 2.2.3 Extend the package barrel with the two shell exports and their types — `src/index.ts`
- [ ] 2.2.4 Run the Phase-2 normalized-diff gate (expected: **exactly the three comment hunks** — one in `AppLauncher.tsx`, two in `app-launcher.spec.test.tsx`; every other diff empty) and record the evidence — AR P3
- [ ] 2.2.5 Run the spec suite and verify the **green phase** — includes the three cross-phase block composition tests (ST-17, ST-22, ST-24) turning green (AR P7); a failing spec test means the port is wrong, never edit the test — `pnpm test`

**Deliverables**:

- [ ] The two shell folders per RD-01 §Ported file inventory
- [ ] All shell spec tests green; normalized-diff evidence recorded

**Verify**: `pnpm test`

### Step 2.3: Implementation Tests & Hardening

**Reference**: [03-02](03-02-app-launcher-shell.md) §New artifacts · [07](07-testing-strategy.md) §End-to-End Tests · AR #5, #9, #10, #13, #18 (req)
**Objective**: Add the shell stories (workbench port), the README family sections and the final audit, then verify the phase gate.

- [ ] 2.3.1 Story: `AppLauncherTrigger` variants (Default/CustomLabel/CustomIcon/Appearance) — `src/components/AppLauncherTrigger/AppLauncherTrigger.stories.tsx`
- [ ] 2.3.2 Story: `AppLauncher` composed samples — Microsoft365Flow, FullDocking, TriggerAnchoredList, DrawerToolbar, Localized — with the local sample data, the six logos, the de-branded copy and the manual review checklist in the story docs — `src/components/AppLauncher/AppLauncher.stories.tsx`
- [ ] 2.3.3 README: `AppLauncher` and `AppLauncherTrigger` sections plus the family quick start and localization table, inserted before the block sections — `README.md`
- [ ] 2.3.4 Manual Storybook review pass (docking geometry flush below the bar; full docking to the window bottom with internal scrolling; sticky search; tooltip suppressed while open; tile hover lift; keyboard flow; a11y addon clean) — user-assisted; record the pass result with the task marks and record anything found as a finding, never a fix — AR #13
- [ ] 2.3.5 Final port audit: zero `@virtuoapp`/`Virtuo` references in ported and shipped artifacts; the source repository untouched; README covers every family component — record the evidence
- [ ] 2.3.6 Full verification — `pnpm verify` and `pnpm storybook:build`

**Deliverables**:

- [ ] Both shell stories and the README family sections in place
- [ ] Manual checklist recorded; final audit evidence recorded
- [ ] `pnpm verify` and `pnpm storybook:build` green

**Verify**: `pnpm verify` and `pnpm storybook:build`

---

## Dependencies

```
Phase 1 (Content blocks: RD-02)
    ↓
Phase 2 (Shell: RD-01 — its composed story renders the Phase-1 blocks)
```

---

## Success Criteria

**Feature is complete when:**

1. ✅ All phases completed
2. ✅ All verification passing (`pnpm verify`; `pnpm storybook:build` in both phases)
3. ✅ All 36 ported oracle tests pass unchanged (plus the extended export pin); the normalized-diff gate passed per phase with only the whitelisted comment edits
4. ✅ No dead code — the port adds no unused module; no internal file is exported
5. ✅ Security posture documented and unchanged — presentation-only components, no new exposure (AR #15 req); no new dependency
6. ✅ Documentation updated — README family sections, stories with autodocs, the manual checklist recorded
7. ✅ Code reviewed per the repository's quality policy (independent reviewer + auditor per phase)
8. ✅ Post-completion project re-analysis (handled by the exec-plan skill)
