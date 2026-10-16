# ConfirmDialog Implementation Plan

> **Feature**: Controlled Fluent UI v9 confirmation prompt — a strict alert dialog with typed outcomes, danger emphasis and optional action sets; plus the `ConfirmProvider` / `useConfirm()` promise-based convenience layer
> **Status**: Planning Complete
> **Created**: 2026-10-16
> **Implements**: confirm-dialog/RD-01, confirm-dialog/RD-02
> **CodeOps Artifact Schema**: 1

## Overview

`ConfirmDialog` is the prompt a consuming application shows when a user action needs an explicit
decision before it runs: it states the question, presents a fixed set of actions, and reports the
chosen outcome back to the host, which owns both visibility and the follow-up work. The component
is controlled, presentation-only and v9-native: Fluent `Dialog` primitives provide portal,
theming, focus and motion; the component adds the decision semantics, the intent-driven emphasis,
the typed outcome and its accessibility wiring.

This plan implements the feature end to end as two phases. Phase 1 delivers RD-01: the
`ConfirmDialog` itself, in the repository's component pattern (types → hook → render → styles →
story → README), with specification tests written first from the acceptance criteria, then the
implementation, then implementation tests and hardening. Phase 2 delivers RD-02: the
`ConfirmProvider` and its `useConfirm()` hook — a context-scoped, promise-based layer that renders
at most one dialog and settles every request exactly once (replacement semantics, never
rejects, SSR-safe).

The components rebuild the functional requirements of the legacy `fui8` `ConfirmDialog` (Fluent UI
v8) as native v9 components while rejecting every v8 mechanism; the RD set records the full
evidence. Beyond the RDs' own acceptance criteria, this plan pins the plan-level mechanisms the
RDs deliberately left to planning — the generic-preserving export shape, the focus machinery
timing, and the provider's settlement mechanics — in `03-01` and `03-02`.

## Minimum-Sufficient Baseline

**Original goal:** bring the legacy confirmation prompt into this repository as Fluent UI v9
components — a controlled `ConfirmDialog` and a root-mounted `ConfirmProvider` with a
promise-based `useConfirm()` — suitable for current applications.

**Smallest viable design:** two components composed from first-party Fluent v9 primitives over
the existing `Dialog` building blocks, following the repository's component pattern, its
`SystemErrorProvider` provider precedent and its spec-first testing standard; no new dependency,
no new module beyond the two component folders, and no machinery the acceptance criteria do not
require.

**Excluded machinery:** the legacy v8 mechanics (theme swap, `dangerouslySetInnerHTML`,
`setTimeout` interaction guard, always-mounted hidden dialogs), a global `confirm()` singleton,
request queueing, hold-open busy provider mode and a dialog glyph prop — all named deferrals or
Won't-Have entries in the RD set. No new dependency, harness or infrastructure is planned.

**Approved complexity:** None — the requirements register records no complexity escalations.

## Document Index

| #   | Document                                       | Description                                 |
| --- | ---------------------------------------------- | ------------------------------------------- |
| AR  | [Ambiguity Register](00-ambiguity-register.md) | Zero-Ambiguity Gate decisions (audit trail) |
| 00  | [Index](00-index.md)                           | This document — overview and navigation     |
| 01  | [Requirements](01-requirements.md)             | Plan scope as a thin delta over the RD set  |
| 02  | [Current State](02-current-state.md)           | Analysis of the current package             |
| 03  | [ConfirmDialog](03-01-confirm-dialog.md)       | Technical specification                     |
| 03B | [ConfirmProvider](03-02-confirm-provider.md)   | Technical specification (provider + hook)   |
| 07  | [Testing Strategy](07-testing-strategy.md)     | Specification test cases and verification   |
| 99  | [Execution Plan](99-execution-plan.md)         | Phases, sessions, and task checklist        |

## Quick Reference

### Usage Examples

The component is controlled; the host owns visibility and side effects:

```tsx
// Pair mode — resolves a boolean through the host's own state.
const [pending, setPending] = useState(false);

<ConfirmDialog
  open={pending}
  title="Delete this record?"
  message={'This cannot be undone.\nThe record is removed for everyone.'}
  intent="danger"
  onResolve={confirmed => {
    setPending(false);
    if (confirmed) deleteRecord();
  }}
/>;
```

Custom action sets resolve the chosen value; the provider removes the plumbing entirely:

```tsx
// Actions mode — the inferred outcome is 'cancel' | 'discard' | 'save'.
const outcome = await confirm({
  title: 'Save your changes?',
  actions: [
    { value: 'cancel', label: 'Cancel' },
    { value: 'discard', label: 'Discard', intent: 'danger' },
    { value: 'save', label: 'Save', appearance: 'primary' },
  ],
});
```

```tsx
// Root-mounted once; any descendant awaits a decision.
<ConfirmProvider>
  <App />
</ConfirmProvider>;

if (await confirm({ title: 'Delete?' })) {
  await api.delete(id);
}
```

### Key Decisions

Plan-local decisions (RD-level decisions live in the feature's requirements register; the RDs
carry them):

| Decision                 | Outcome                                                                          | AR Ref |
| ------------------------ | -------------------------------------------------------------------------------- | ------ |
| Plan identity            | `codeops/features/confirm-dialog/plans/confirm-dialog/`                          | AR #1  |
| Plan basis and shape     | Implements `confirm-dialog/RD-01` + `RD-02` in one plan (Phase 1 / Phase 2)      | AR #2  |
| Verify commands          | `pnpm test` in spec/impl steps; `pnpm verify` + `pnpm storybook:build` hardening | AR #3  |
| Export surface           | Three runtime names and seven public types per `03-01`/`03-02` §Public API       | AR #4  |
| Component callable type  | Two-overload object assertion preserves literal inference at the call site       | AR #5  |
| Internal interfaces      | Per `03-01 §Interfaces` and `03-02 §Interfaces` (cast-free outcome bridge)       | AR #6  |
| Focus machinery          | Layout capture/restore; busy rescue covers body-focus and the disabled action    | AR #7  |
| Provider mechanics       | Ref authority, settle-once, conditional clear, probe discriminator, request key  | AR #8  |
| Provider dialog mounting | Always rendered with `open` toggle and per-request key                           | AR #9  |
| Strings chain            | The provider fully resolves per-call → provider → English before RD-01 receives  | AR #10 |
| Test allocation          | Spec/impl/SSR files and manual passes per `07-testing-strategy.md`               | AR #11 |
| README and carve-out     | Appended sections; Principles bullet names both transient-state layers           | AR #12 |

## Specialist Agents

**None** — the capability-gap check ran against this repository's evidence and found no gap a
standing specialist would close.

_Detection evidence: two components, one plan, no findings-ledger recurrence in the strongest
available record (`error-dialog/plans/error-dialog/05-findings.md` holds only MINOR review
findings, none repeated in the same area); the strongest domain signal — Fluent UI v9 component
authoring (focus machinery, Griffel specificity, portal semantics) — is already packaged as the
repo-authored skill `.opencode/skills/fluentui-components/` with references for styling,
accessibility, state/render and testing, which the executors load; manifests show no specialized
framework, DSL, codegen or protocol beyond that (`packages/react-components/package.json`)._

## Related Files

Created:

- `codeops/features/confirm-dialog/plans/confirm-dialog/` — this plan set
- `packages/react-components/src/components/ConfirmDialog/` — `ConfirmDialog.tsx`,
  `ConfirmDialog.types.ts`, `useConfirmDialog.ts`, `renderConfirmDialog.tsx`,
  `useConfirmDialogStyles.styles.ts`, `ConfirmDialog.stories.tsx`, `index.ts`
- `packages/react-components/src/components/ConfirmProvider/` — `ConfirmProvider.tsx`,
  `ConfirmProvider.types.ts`, `ConfirmContext.ts`, `useConfirm.ts`, `ConfirmProvider.stories.tsx`,
  `index.ts`
- `packages/react-components/test/confirm-dialog.spec.test.tsx`,
  `packages/react-components/test/confirm-dialog.impl.test.tsx`
- `packages/react-components/test/confirm-provider.spec.test.tsx`,
  `packages/react-components/test/confirm-provider.impl.test.tsx`,
  `packages/react-components/test/confirm-provider.ssr.test.tsx`

Modified:

- `packages/react-components/src/index.ts` (exports)
- `packages/react-components/test/package-exports.spec.test.ts` (export-surface list)
- `packages/react-components/README.md` (component and provider sections; Principles carve-out)
