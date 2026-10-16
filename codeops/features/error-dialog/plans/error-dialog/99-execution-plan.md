# Execution Plan: ErrorDialog

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-10-16 06:28
> **Progress**: 0/15 tasks (0%)
> **CodeOps Artifact Schema**: 1

## Overview

Implements `error-dialog/RD-01`: one controlled Fluent UI v9 `ErrorDialog` with specification
tests first, then the implementation, then implementation tests and hardening — the mandatory
three-session ordering.

**Paths:** relative to `packages/react-components/`.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title                 | Tasks |
| ----- | --------------------- | ----- |
| 1     | ErrorDialog component | 15    |

**Total: 15 tasks across 1 phase** (no fabricated hour estimates — scope is bounded by the
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

> **Phase baseline tree**: _(recorded by the exec-plan skill from a temporary-index snapshot of
> committed, staged, unstaged, and untracked phase-start state)_
> **Lenses**: api-surface (public component contract) · security (hostile-value containment)
> **Reasoning**: high — contract-heavy component (19 acceptance criteria), hostile-input
> serialization and a timed copy state machine

### Step 1.1: Specification Tests (before implementation)

**Reference**: [07](07-testing-strategy.md) §Specification Test Cases (ST-01…ST-32) · [03-01](03-01-error-dialog.md) §Interfaces · AR #6
**Objective**: Pin the contract as executable tests before any implementation exists.

- [ ] 1.1.1 [spec-author] Write the contract spec tests from the ST cases — `test/error-dialog.spec.test.tsx`
- [ ] 1.1.2 [spec-author] Extend the export-surface list with `ErrorDialog` (ST-28) — `test/package-exports.spec.test.ts`
- [ ] 1.1.3 Run the spec suite and verify the **red phase** (import/export failures expected; document any case that passes pre-implementation with justification) — `pnpm test`

**Deliverables**:

- [ ] Spec files carrying every ST case with concrete assertions (including the ST-29 `@ts-expect-error` directives)
- [ ] Red-phase evidence recorded with the task marks

**Verify**: `pnpm test` (expected failures documented; no other command)

### Step 1.2: Implementation

**Reference**: [03-01](03-01-error-dialog.md) §Interfaces, §Serialization algorithm, §Copy state machine, §Dialog structure, §Strings resolution
**Objective**: Implement the component so the frozen spec tests pass.

- [ ] 1.2.1 Public types and English string defaults — `src/components/ErrorDialog/ErrorDialog.types.ts`
- [ ] 1.2.2 Pure serializer: replacer maps and failure containment — `src/components/ErrorDialog/serializeError.ts`
- [ ] 1.2.3 State hook: strings resolution, details, copy state machine, surface props, ref — `src/components/ErrorDialog/useErrorDialog.ts`
- [ ] 1.2.4 Pure render: alert Dialog, labelled details area, variant actions, native spread — `src/components/ErrorDialog/renderErrorDialog.tsx`
- [ ] 1.2.5 Static Griffel classes with tokens (danger title, 700 px surface cap) — `src/components/ErrorDialog/useErrorDialogStyles.styles.ts`
- [ ] 1.2.6 Shell, folder barrel and package exports — `src/components/ErrorDialog/ErrorDialog.tsx`, `src/components/ErrorDialog/index.ts`, `src/index.ts`
- [ ] 1.2.7 Run the spec suite and verify the **green phase** — a failing spec test means the implementation is wrong, never edit the test — `pnpm test`

**Deliverables**:

- [ ] Component per the `03-01 §Files` table
- [ ] All spec tests green

**Verify**: `pnpm test`

### Step 1.3: Implementation Tests & Hardening

**Reference**: [03-01](03-01-error-dialog.md) §Testing Requirements · [07](07-testing-strategy.md) §Test Data
**Objective**: Cover internals and edge paths, add story and documentation, run the manual pass, and verify the whole gate.

- [ ] 1.3.1 Implementation tests: serializer internals, copy-timer mechanics, availability detection, class/token + 700 px checks (AC 17b/17c) — `test/error-dialog.impl.test.tsx`
- [ ] 1.3.2 Stories: standard variant, unauthorized variant, Dutch strings, long details, missing details — `src/components/ErrorDialog/ErrorDialog.stories.tsx`
- [ ] 1.3.3 README component section: description, props table, composition and localization notes — `README.md`
- [ ] 1.3.4 Storybook keyboard/a11y pass (real focus path; a11y addon clean) and fix anything found
- [ ] 1.3.5 Full verification — `pnpm verify` and `pnpm storybook:build`

**Deliverables**:

- [ ] Implementation tests passing; story set present; README section written; manual pass recorded
- [ ] All verification passing

**Verify**: `pnpm verify`

---

## Dependencies

```
Phase 1 — single phase; steps run in strict order:
  1.1 (spec tests, red) ──▶ 1.2 (implementation, green) ──▶ 1.3 (impl tests & hardening)
```

---

## Success Criteria

**Feature is complete when:**

1. ✅ All phases completed
2. ✅ All verification passing (`pnpm verify`; `pnpm storybook:build`)
3. ✅ No warnings/errors
4. ✅ No dead code — no unused parameters, functions, classes, or modules
5. ✅ Security hardened — hostile error values contained (wrapped serialization fallback chain);
   details render as text only (no HTML injection); clipboard failures contained
6. ✅ Documentation updated — README component section and API doc comments
7. ✅ Code reviewed (if applicable)
8. ✅ Post-completion project re-analysis (handled by the exec-plan skill)
