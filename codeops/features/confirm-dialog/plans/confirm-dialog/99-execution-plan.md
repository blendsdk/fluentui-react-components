# Execution Plan: confirm-dialog

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-10-16 14:44
> **Progress**: 26/27 tasks (96%)
> **CodeOps Artifact Schema**: 1

## Overview

Implements `confirm-dialog/RD-01` and `confirm-dialog/RD-02`: the controlled Fluent UI v9
`ConfirmDialog` (Phase 1) and its companion `ConfirmProvider` + `useConfirm()` (Phase 2), each
with specification tests first, then the implementation, then implementation tests and hardening —
the mandatory three-session ordering.

**Paths:** relative to `packages/react-components/`.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title                   | Tasks |
| ----- | ----------------------- | ----- |
| 1     | ConfirmDialog component | 14    |
| 2     | ConfirmProvider         | 13    |

**Total: 27 tasks across 2 phases** (no fabricated hour estimates — scope is bounded by the
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

## Phase 1: ConfirmDialog component

> **Phase baseline tree**: `7242e7e5c64ff957137709a6751dd2f29edf60df`
> **Scope mode**: strict · **Expected modification set** (`packages/react-components/`-relative):
> `test/confirm-dialog.spec.test.tsx` · `test/package-exports.spec.test.ts` ·
> `test/confirm-dialog.impl.test.tsx` · `src/components/ConfirmDialog/**` · `README.md` — plus the
> plan/roadmap bookkeeping in this repository's `codeops/` documents
> **Lenses**: api-surface (public component contract) · security (content inertness and
> hostile-input containment)
> **Reasoning**: high — contract-heavy component (20 acceptance criteria), Griffel specificity
> override and two focus effects with environment-dependent conditions

### Step 1.1: Specification Tests (before implementation)

**Reference**: [07](07-testing-strategy.md) §ConfirmDialog (ST-1…ST-29) · [03-01](03-01-confirm-dialog.md) §Interfaces · AR #4, AR #6
**Objective**: Pin the contract as executable tests before any implementation exists.

- [x] 1.1.1 [spec-author] Write the contract spec tests from the ST cases — `test/confirm-dialog.spec.test.tsx` ✅ (completed: 2026-10-16 13:53)
- [x] 1.1.2 [spec-author] Extend the export-surface pin with `ConfirmDialog` and its type pins (ST-29) — `test/package-exports.spec.test.ts` ✅ (completed: 2026-10-16 13:53)
- [x] 1.1.3 Run the spec suite and verify the **red phase** (import/export failures expected; document any case that passes pre-implementation with justification) — `pnpm test` ✅ (completed: 2026-10-16 13:54)

> **Red-phase record (1.1.3):** 33 failed / 6 passed across the two files (39 tests; the dialog spec
> carries 35) — 32 dialog tests fail with "Element type is invalid … got: undefined" (the component
> is not exported yet), the export-list assertion fails on the missing `ConfirmDialog` key, and no
> file-load or transform errors occurred. Every pre-existing suite stays green (96 passed). Four
> pre-implementation passes are documented as type-level pins: `import type` is erased at runtime
> (the type-pin test), and the three negative compile constructs only build elements — their real
> gate is `pnpm type-check` in the green phase. Technique note: `fui-Button--primary` does not
> exist in Fluent v9, so the appearance assertions compare class lists (primary differs from
> secondary as a strict superset) instead of invented class names.

**Deliverables**:

- [ ] Spec files carrying every ST case with concrete assertions (including the ST-12/ST-13 `@ts-expect-error` directives)
- [ ] Red-phase evidence recorded with the task marks

**Verify**: `pnpm test` (expected failures documented; no other command)

### Step 1.2: Implementation

**Reference**: [03-01](03-01-confirm-dialog.md) §Public API, §Interfaces, §Danger styling, §Focus and accessibility machinery, §Behaviour details
**Objective**: Implement the component so the frozen spec tests pass.

- [x] 1.2.1 Public types — `src/components/ConfirmDialog/ConfirmDialog.types.ts` ✅ (completed: 2026-10-16 13:59)
- [x] 1.2.2 Static Griffel classes: surface, message (`pre-line`), the guarded danger recipe — `src/components/ConfirmDialog/useConfirmDialogStyles.styles.ts` ✅ (completed: 2026-10-16 13:59)
- [x] 1.2.3 State hook: normalization, label resolution, ids, the outcome bridge, capture/restore and busy effects, merged ref — `src/components/ConfirmDialog/useConfirmDialog.ts` ✅ (completed: 2026-10-16 13:59)
- [x] 1.2.4 Pure render: alert Dialog, title/message wiring, action buttons, icon wrapping, native spread — `src/components/ConfirmDialog/renderConfirmDialog.tsx` ✅ (completed: 2026-10-16 13:59)
- [x] 1.2.5 Shell with the generic-preserving export assertion, folder barrel and package exports — `src/components/ConfirmDialog/ConfirmDialog.tsx`, `src/components/ConfirmDialog/index.ts`, `src/index.ts` ✅ (completed: 2026-10-16 13:59)
- [x] 1.2.6 Run the spec suite and verify the **green phase** — a failing spec test means the implementation is wrong, never edit the test — `pnpm test` ✅ (completed: 2026-10-16 13:59)

> **Green-phase record (1.2.6):** 35/35 dialog spec tests pass; `pnpm type-check` is clean (the four
> `@ts-expect-error` pins are engaged as errors — no unused directives); the full package suite
> passes 129/129 across 9 files. One spec-technique adjustment was needed before green (recorded
> for review; the expectation is unchanged): ST-10's "differs by exactly the danger class" cannot
> be a single class token — Griffel emits atomic classes (one per declaration and pseudo-state),
> and its development build adds a `___`-prefixed merge-sequence class that changes whenever the
> merged class set changes. The technique now compares the added class set against the classes
> whose stylesheet rules consume the danger tokens via `var(...)`, with Griffel debug classes
> filtered out. No implementation defect was involved.

**Deliverables**:

- [ ] Component per the `03-01 §Proposed Changes` file table
- [ ] All spec tests green

**Verify**: `pnpm test`

### Step 1.3: Implementation Tests & Hardening

**Reference**: [03-01](03-01-confirm-dialog.md) §Testing Requirements · [07](07-testing-strategy.md) §Test Data
**Objective**: Cover internals and edge paths, add story and documentation, run the manual pass, and verify the whole gate.

- [x] 1.3.1 Implementation tests: danger class rules/tokens, label-fallback internals, id wiring, effect conditions, merged ref, zero-v8 scan (RD-01 AC 14) — `test/confirm-dialog.impl.test.tsx` ✅ (completed: 2026-10-16 14:04)
- [x] 1.3.2 Stories: default pair, danger pair, custom action set, busy, multi-line message, string overrides + the manual review checklist — `src/components/ConfirmDialog/ConfirmDialog.stories.tsx` ✅ (completed: 2026-10-16 14:04)
- [x] 1.3.3 README component section: props table, composition notes, localization notes, "when not to use" boundary — `README.md` ✅ (completed: 2026-10-16 14:04)
- [ ] 1.3.4 Storybook keyboard/a11y pass and forced-colors pass (real focus path; a11y addon clean) — user-assisted; record the pass result with the task marks and fix anything found

> **Manual-pass record (1.3.4, in progress):** the user ran the danger pair story and reported a
> contrast defect — the label rendered in the pinned `colorStatusDangerForegroundInverted`
> (light theme `#dc626d` on `#c50f1f`; dark theme `#b10e1c` on `#c50f1f`) instead of white.
> Fixed on the user's direction: the recipe now uses `colorNeutralForegroundOnBrand` (white in
> both themes); RD-01, the plan spec `03-01` and the requirements register carry the amendment,
> and the spec/impl tests pin the new token. The remaining checklist items (initial focus, trap
> cycle, close-time restore, Escape/backdrop, busy focus, forced colors, a11y addon) await the
> user's continuation.

- [x] 1.3.5 Full verification — `pnpm verify` and `pnpm storybook:build` ✅ (completed: 2026-10-16 14:04)

> **Full-verification record (1.3.5):** `pnpm verify` green — format, skill check, type-check, build
> and 141/141 tests across 10 files; `pnpm storybook:build` completes successfully with the new
> story set. The manual keyboard/forced-colors pass (1.3.4) awaits the user-assisted run.

**Deliverables**:

- [ ] Implementation tests passing; story set present; README section written; manual pass recorded (user-assisted)
- [ ] All verification passing

**Verify**: `pnpm verify`

---

## Phase 2: ConfirmProvider

> **Phase baseline tree**: `b7f246b80012408d33be4816a5c65625a68a6f93`
> **Scope mode**: strict · **Expected modification set** (`packages/react-components/`-relative):
> `test/confirm-provider.spec.test.tsx` · `test/package-exports.spec.test.ts` ·
> `test/confirm-provider.impl.test.tsx` · `test/confirm-provider.ssr.test.tsx` ·
> `src/components/ConfirmProvider/**` · `README.md` — plus the plan/roadmap bookkeeping in this
> repository's `codeops/` documents
> **Lenses**: api-surface (provider + hook contract) · concurrency (promise lifecycle:
> replacement, settle-once, the StrictMode probe)
> **Reasoning**: high — concurrency-sensitive settlement mechanics across supersede, unmount and
> the StrictMode probe, on top of the string-chain and rendering rules

### Step 2.1: Specification Tests (before implementation)

**Reference**: [07](07-testing-strategy.md) §ConfirmProvider (ST-30…ST-41) · [03-02](03-02-confirm-provider.md) §Interfaces · AR #4, AR #8
**Objective**: Pin the provider contract as executable tests before any implementation exists.

- [x] 2.1.1 [spec-author] Write the provider spec tests from the ST cases — `test/confirm-provider.spec.test.tsx` ✅ (completed: 2026-10-16 14:38)
- [x] 2.1.2 [spec-author] Extend the export-surface list with `ConfirmProvider`, `useConfirm` and their type pins (ST-41) — `test/package-exports.spec.test.ts` ✅ (completed: 2026-10-16 14:38)
- [x] 2.1.3 Run the spec suite and verify the **red phase** (import/export failures expected; document any case that passes pre-implementation with justification) — `pnpm test` ✅ (completed: 2026-10-16 14:38)

> **Red-phase record (2.1.3):** 18 failed / 4 passed across the two files (22 tests; the provider
> spec carries 17) — 16 tests fail with "Element type is invalid … got: undefined" (the provider is
> not exported yet), ST-35 fails because `useConfirm` is not a function yet (the thrown message
> cannot name `ConfirmProvider`), and the export-list assertion fails on the two missing keys.
> Every pre-existing suite stays green (142 passed across 9 files); no file-load or transform
> errors. Justified pre-implementation passes: the three untouched export pins and the new
> provider type pin (a runtime-local block; its real gate is `pnpm type-check` in the green
> phase). Technique notes: ST-33 triggers the second request through an `act`-wrapped hook call
> (deterministic, no jsdom modal dependence); ST-36 asserts both `''` and whitespace blanks.

**Deliverables**:

- [ ] Spec file carrying the provider ST cases with concrete assertions; the export pin extended
- [ ] Red-phase evidence recorded with the task marks

**Verify**: `pnpm test` (expected failures documented; no other command)

### Step 2.2: Implementation

**Reference**: [03-02](03-02-confirm-provider.md) §Public API, §Interfaces, §Provider mechanics, §SSR and environment safety
**Objective**: Implement the provider so the frozen spec tests pass.

- [x] 2.2.1 Public types and internal context — `src/components/ConfirmProvider/ConfirmProvider.types.ts`, `src/components/ConfirmProvider/ConfirmContext.ts` ✅ (completed: 2026-10-16 14:41)
- [x] 2.2.2 Provider: request record, replacement, settle-once activation, the probe discriminator, strings chain, always-rendered dialog with the idle-key reuse — `src/components/ConfirmProvider/ConfirmProvider.tsx` ✅ (completed: 2026-10-16 14:41)
- [x] 2.2.3 The public hook with the outside-provider error — `src/components/ConfirmProvider/useConfirm.ts` ✅ (completed: 2026-10-16 14:41)
- [x] 2.2.4 Barrel and package exports — `src/components/ConfirmProvider/index.ts`, `src/index.ts` ✅ (completed: 2026-10-16 14:41)
- [x] 2.2.5 Run the spec suite and verify the **green phase** — a failing spec test means the implementation is wrong, never edit the test — `pnpm test` ✅ (completed: 2026-10-16 14:41)

> **Green-phase record (2.2.5):** 22/22 spec + export-pin tests pass; `pnpm type-check` is clean
> (the provider type pins and the runtime-empty-actions directive are enforced); the full package
> suite passes 160/160 across 11 files. One test-authoring slip was corrected in the spec file
> before green (recorded for review): the ST-30 test destructured a `container` the harness does
> not return; the expectation is unchanged (no wrapper element) and the lookup now goes through
> the render result's container. No implementation defect was involved.

**Deliverables**:

- [ ] Provider and hook per the `03-02` file table
- [ ] All spec tests green

**Verify**: `pnpm test`

### Step 2.3: Implementation Tests & Hardening

**Reference**: [03-02](03-02-confirm-provider.md) §Testing Requirements · [07](07-testing-strategy.md) §Test Data
**Objective**: Cover internals and edge paths, add the SSR smoke, stories and documentation, and verify the whole gate.

- [x] 2.3.1 Implementation tests: stability, focus-after-swap, settle-once, StrictMode probe, children identity — `test/confirm-provider.impl.test.tsx` ✅ (completed: 2026-10-16 14:44)
- [x] 2.3.2 SSR smoke test (node environment; import + `renderToString` must not throw) — `test/confirm-provider.ssr.test.tsx` ✅ (completed: 2026-10-16 14:44)
- [x] 2.3.3 Stories: interactive trigger covering pair mode, danger, custom actions and replacement — `src/components/ConfirmProvider/ConfirmProvider.stories.tsx` ✅ (completed: 2026-10-16 14:44)
- [x] 2.3.4 README provider section (setup, props and request tables, usage contract, provider-count caveat) and the Principles carve-out update — `README.md` ✅ (completed: 2026-10-16 14:44)
- [x] 2.3.5 Full verification — `pnpm verify` and `pnpm storybook:build` ✅ (completed: 2026-10-16 14:44)

> **Full-verification record (2.3.5):** `pnpm verify` green — format, skill check, type-check, build
> and 166/166 tests across 13 files; `pnpm storybook:build` completes successfully with the
> provider story set. Phase 1's manual keyboard/forced-colors pass (1.3.4) remains the only open
> task in the plan.

**Deliverables**:

- [ ] Implementation tests and SSR smoke passing; story set present; README section written
- [ ] All verification passing

**Verify**: `pnpm verify`

---

## Dependencies

```
Phase 1 ──▶ Phase 2 (the provider renders the Phase 1 dialog). Within each phase the steps run
in strict order:
  1.1 (spec tests, red) ──▶ 1.2 (implementation, green) ──▶ 1.3 (impl tests & hardening)
  2.1 (spec tests, red) ──▶ 2.2 (implementation, green) ──▶ 2.3 (impl tests & hardening)
```

---

## Success Criteria

**Feature is complete when:**

1. ✅ All phases completed
2. ✅ All verification passing (`pnpm verify`; `pnpm storybook:build`)
3. ✅ No warnings/errors
4. ✅ No dead code — no unused parameters, functions, classes, or modules
5. ✅ Security hardened — content renders as text only (no HTML injection); no network, storage
   or timer side effects; every promise settles exactly once and never rejects
6. ✅ Documentation updated — README sections (with the "when not to use" boundary and the
   Principles carve-out) and API doc comments
7. ✅ Code reviewed (if applicable)
8. ✅ Post-completion project re-analysis (handled by the exec-plan skill)
