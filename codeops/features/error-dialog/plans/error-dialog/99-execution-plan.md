# Execution Plan: ErrorDialog

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-10-16 09:06
> **Progress**: 13/28 tasks (46%)
> **CodeOps Artifact Schema**: 1

## Overview

Implements `error-dialog/RD-01` and `error-dialog/RD-02`: the controlled Fluent UI v9
`ErrorDialog` (Phase 1) and its companion `SystemErrorProvider` (Phase 2), each with
specification tests first, then the implementation, then implementation tests and hardening —
the mandatory three-session ordering.

**Paths:** relative to `packages/react-components/`.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title                 | Tasks |
| ----- | --------------------- | ----- |
| 1     | ErrorDialog component | 15    |
| 2     | SystemErrorProvider   | 13    |

**Total: 28 tasks across 2 phases** (no fabricated hour estimates — scope is bounded by the
task-size criteria in `quality-checklist.md`).

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

## Phase 1: ErrorDialog component

> **Phase baseline tree**: `62d6ab2500ac9dfaab716c06a96b7c6e4d3b290f`
> **Scope mode**: strict · **Expected modification set** (`packages/react-components/`-relative):
> `test/error-dialog.spec.test.tsx` · `test/package-exports.spec.test.ts` ·
> `test/error-dialog.impl.test.tsx` · `src/components/ErrorDialog/**` · `README.md` — plus the
> plan/roadmap bookkeeping in this repository's `codeops/` documents
> **Lenses**: api-surface (public component contract) · security (hostile-value containment)
> **Reasoning**: high — contract-heavy component (19 acceptance criteria), hostile-input
> serialization and a timed copy state machine

### Step 1.1: Specification Tests (before implementation)

**Reference**: [07](07-testing-strategy.md) §Specification Test Cases (ST-01…ST-32, ST-55) · [03-01](03-01-error-dialog.md) §Interfaces · AR #6
**Objective**: Pin the contract as executable tests before any implementation exists.

- [x] 1.1.1 [spec-author] Write the contract spec tests from the ST cases — `test/error-dialog.spec.test.tsx` ✅ (completed: 2026-10-16 08:59)
- [x] 1.1.2 [spec-author] Extend the export-surface list with `ErrorDialog` (ST-28) — `test/package-exports.spec.test.ts` ✅ (completed: 2026-10-16 08:59)
- [x] 1.1.3 Run the spec suite and verify the **red phase** (import/export failures expected; document any case that passes pre-implementation with justification) — `pnpm test` ✅ (completed: 2026-10-16 08:59)

> **Red-phase record (1.1.3):** 43 failed / 10 passed — all 42 dialog tests fail with
> "Element type is invalid … got: undefined" (the component is not exported yet), the
> export-list assertion fails as expected, and description-list stays green; no file-load
> errors. One pre-implementation pass is documented: the type-import witness from 1.1.2 runs
> trivially because `import type` is erased at runtime — its real gate is `pnpm type-check`
> in the green phase. Technique adjustment (mechanical): the dialog surface portals to
> `document.body`, so the spec file locates the backdrop document-wide
> (`.fui-DialogSurface__backdrop`), not via the render container.

**Deliverables**:

- [ ] Spec files carrying every ST case with concrete assertions (including the ST-29 `@ts-expect-error` directives)
- [ ] Red-phase evidence recorded with the task marks

**Verify**: `pnpm test` (expected failures documented; no other command)

### Step 1.2: Implementation

**Reference**: [03-01](03-01-error-dialog.md) §Interfaces, §Serialization algorithm, §Copy state machine, §Dialog structure, §Strings resolution
**Objective**: Implement the component so the frozen spec tests pass.

- [x] 1.2.1 Public types — `src/components/ErrorDialog/ErrorDialog.types.ts` ✅ (completed: 2026-10-16 09:02)
- [x] 1.2.2 Pure serializer: replacer maps and failure containment — `src/components/ErrorDialog/serializeError.ts` ✅ (completed: 2026-10-16 09:02)
- [x] 1.2.3 State hook: English string defaults and resolution, details, copy state machine, surface props, ref — `src/components/ErrorDialog/useErrorDialog.ts` ✅ (completed: 2026-10-16 09:02)
- [x] 1.2.4 Pure render: alert Dialog, labelled details area, variant actions, native spread — `src/components/ErrorDialog/renderErrorDialog.tsx` ✅ (completed: 2026-10-16 09:02)
- [x] 1.2.5 Static Griffel classes with tokens (danger title, 700 px surface cap) — `src/components/ErrorDialog/useErrorDialogStyles.styles.ts` ✅ (completed: 2026-10-16 09:02)
- [x] 1.2.6 Shell, folder barrel and package exports — `src/components/ErrorDialog/ErrorDialog.tsx`, `src/components/ErrorDialog/index.ts`, `src/index.ts` ✅ (completed: 2026-10-16 09:02)
- [x] 1.2.7 Run the spec suite and verify the **green phase** — a failing spec test means the implementation is wrong, never edit the test — `pnpm test` ✅ (completed: 2026-10-16 09:02)

**Deliverables**:

- [ ] Component per the `03-01 §Proposed Changes` file table
- [ ] All spec tests green

**Verify**: `pnpm test`

### Step 1.3: Implementation Tests & Hardening

**Reference**: [03-01](03-01-error-dialog.md) §Testing Requirements · [07](07-testing-strategy.md) §Test Data
**Objective**: Cover internals and edge paths, add story and documentation, run the manual pass, and verify the whole gate.

- [x] 1.3.1 Implementation tests: serializer internals, copy-timer mechanics, availability detection, class/token + 700 px checks (AC 17b/17c) — `test/error-dialog.impl.test.tsx` ✅ (completed: 2026-10-16 09:06)
- [x] 1.3.2 Stories: standard variant, unauthorized variant, Dutch strings, long details, missing details — `src/components/ErrorDialog/ErrorDialog.stories.tsx` ✅ (completed: 2026-10-16 09:08)
- [x] 1.3.3 README component section: description, props table, composition and localization notes — `README.md` ✅ (completed: 2026-10-16 09:09)
- [~] 1.3.4 Storybook keyboard/a11y pass (real focus path; a11y addon clean) — user-assisted; record the pass result with the task marks and fix anything found ⏳ (implemented: 2026-10-16 09:10 — story set and a11y addon ready; dialogs open from a trigger button (user-requested revision); isolated dev server on http://127.0.0.1:6007; checklist handed to the user; awaiting the pass result)
- [ ] 1.3.5 Full verification — `pnpm verify` and `pnpm storybook:build`

**Deliverables**:

- [ ] Implementation tests passing; story set present; README section written; manual pass recorded (user-assisted)
- [ ] All verification passing

**Verify**: `pnpm verify`

---

## Phase 2: SystemErrorProvider

> **Phase baseline tree**: _(recorded by the exec-plan skill from a temporary-index snapshot of
> committed, staged, unstaged, and untracked phase-start state)_
> **Lenses**: api-surface (public provider + hook contract) · security (capture listener hygiene)
> **Reasoning**: high — listener lifecycle, typed per-kind construction and the user-ruled sign-out
> semantics (requirements AR #19)

### Step 2.1: Specification Tests (before implementation)

**Reference**: [07](07-testing-strategy.md) §Specification Test Cases (ST-33…ST-54) · [03-02](03-02-system-error-provider.md) §Interfaces · [RD-02](../../requirements/RD-02-system-error-provider.md) · requirements AR #19
**Objective**: Pin the provider contract as executable tests before any implementation exists.

- [ ] 2.1.1 [spec-author] Write the provider spec tests from the ST cases — `test/system-error-provider.spec.test.tsx`
- [ ] 2.1.2 [spec-author] Extend the export-surface list with `SystemErrorProvider` + `useSystemError` (ST-52) — `test/package-exports.spec.test.ts`
- [ ] 2.1.3 Run the spec suite and verify the **red phase** (import/export failures expected; document any case that passes pre-implementation with justification) — `pnpm test`

**Deliverables**:

- [ ] Spec file carrying ST-33…ST-51 and ST-54 with concrete assertions (including the sink-listener technique for negative dispatches and for ST-40's throwing handler); ST-52 extends the export-surface list (task 2.1.2); the ST-53 SSR smoke is authored in Step 2.3
- [ ] Red-phase evidence recorded with the task marks

**Verify**: `pnpm test` (expected failures documented; no other command)

### Step 2.2: Implementation

**Reference**: [03-02](03-02-system-error-provider.md) §Interfaces, §Provider state and construction, §Capture hook
**Objective**: Implement the provider so the frozen spec tests pass.

- [ ] 2.2.1 Public types and context — `src/components/SystemErrorProvider/SystemErrorProvider.types.ts`, `src/components/SystemErrorProvider/SystemErrorContext.ts`
- [ ] 2.2.2 Opt-in capture hook (effect-scoped listeners, StrictMode/SSR-safe) — `src/components/SystemErrorProvider/useGlobalErrorCapture.ts`
- [ ] 2.2.3 Provider state, per-variant dialog construction, sign-out wrapper, hook — `src/components/SystemErrorProvider/SystemErrorProvider.tsx`, `src/components/SystemErrorProvider/useSystemError.ts`
- [ ] 2.2.4 Barrel and package exports — `src/components/SystemErrorProvider/index.ts`, `src/index.ts`
- [ ] 2.2.5 Run the spec suite and verify the **green phase** — a failing spec test means the implementation is wrong, never edit the test — `pnpm test`

**Deliverables**:

- [ ] Provider per the `03-02` file table
- [ ] All spec tests green

**Verify**: `pnpm test`

### Step 2.3: Implementation Tests & Hardening

**Reference**: [03-02](03-02-system-error-provider.md) §Testing Requirements · [07](07-testing-strategy.md) §Test Data
**Objective**: Cover internals and edge paths, add the SSR smoke, stories and documentation, and verify the whole gate.

- [ ] 2.3.1 Implementation tests: capture-hook listener attach/remove spies, StrictMode-safe single pair, memoization stability — `test/system-error-provider.impl.test.tsx`
- [ ] 2.3.2 SSR smoke test (node environment; import + `renderToString` must not throw) — `test/system-error-provider.ssr.test.tsx`
- [ ] 2.3.3 Stories: both variants via `catchError`, a `detailsText` demo and a capture demo — `src/components/SystemErrorProvider/SystemErrorProvider.stories.tsx`
- [ ] 2.3.4 README provider section and the principles carve-out — `README.md`
- [ ] 2.3.5 Full verification — `pnpm verify` and `pnpm storybook:build`

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
5. ✅ Security hardened — hostile error values contained (wrapped serialization fallback chain);
   details render as text only (no HTML injection); clipboard failures contained; capture never
   suppresses errors (`preventDefault` untouched) and the sign-out path cannot trap the user
6. ✅ Documentation updated — README component section and API doc comments
7. ✅ Code reviewed (if applicable)
8. ✅ Post-completion project re-analysis (handled by the exec-plan skill)
