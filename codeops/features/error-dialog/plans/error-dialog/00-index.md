# ErrorDialog Implementation Plan

> **Feature**: Controlled Fluent UI v9 error dialog — error details for support plus close, reload, and sign-out recovery actions; plus the opt-in `SystemErrorProvider`
> **Status**: Done
> **Created**: 2026-10-16
> **Implements**: error-dialog/RD-01, error-dialog/RD-02
> **CodeOps Artifact Schema**: 1

## Overview

`ErrorDialog` is the surface a consuming application shows when an unexpected error occurred. It
renders a blocking alert dialog with the error details for the support workflow and offers the
recovery actions the host provides: close, reload, or sign out when the session expired.

This plan implements the feature end to end: one controlled, side-effect-free component built
from first-party Fluent UI v9 primitives, following the repository's component pattern
(types → hook → render → styles → story → README), with specification tests written first from
the acceptance criteria, then the implementation, then implementation tests and hardening.

The component rebuilds the legacy `@blendsdk/fluentui` v8 error module and keeps its proven
split: capture and storage stay app-side; the dialog is presentational and controlled. The
defects of the legacy code are fixed by the specification — meaningful error serialization,
no dismissal escape hatch on session-expired errors, and no side effects inside the component.

The plan also implements the provider companion (RD-02): a context-scoped `SystemErrorProvider`
with `useSystemError()`, one rendered dialog, and opt-in global capture — delivered as Phase 2.

## Minimum-Sufficient Baseline

**Original goal:** bring the legacy application-error dialog into this repository as a
Fluent UI v9 component suitable for current applications.

**Smallest viable design:** the controlled `ErrorDialog` (Phase 1) plus the thin
`SystemErrorProvider` and its hook (Phase 2), composed from first-party Fluent v9 primitives and
the repository's existing dependencies and conventions; auth and navigation policy stay with the
host application (the provider's global capture is an opt-in flag).

**Excluded machinery:** a React error boundary, telemetry, mail-to and support-reference-ID
affordances, an i18n framework, and any new dependency — as recorded in the RDs' Won't Have
lists.

**Approved complexity:** None.

## Document Index

| #   | Document                                              | Description                                 |
| --- | ----------------------------------------------------- | ------------------------------------------- |
| AR  | [Ambiguity Register](00-ambiguity-register.md)        | Zero-Ambiguity Gate decisions (audit trail) |
| 00  | [Index](00-index.md)                                  | This document — overview and navigation     |
| 01  | [Requirements](01-requirements.md)                    | Plan scope as a thin delta over RD-01       |
| 02  | [Current State](02-current-state.md)                  | Analysis of the current package             |
| 03  | [ErrorDialog](03-01-error-dialog.md)                  | Technical specification                     |
| 03B | [SystemErrorProvider](03-02-system-error-provider.md) | Technical specification (provider + hook)   |
| 07  | [Testing Strategy](07-testing-strategy.md)            | Specification test cases and verification   |
| 99  | [Execution Plan](99-execution-plan.md)                | Phases, sessions, and task checklist        |

## Quick Reference

### Usage Examples

Applications own error capture and side effects; the dialog is controlled and raises callbacks:

```tsx
// Host wiring sketch — capture stays application-side.
const [error, setError] = useState<unknown>(undefined);

<ErrorDialog
  open={error !== undefined}
  error={error}
  onDismiss={() => setError(undefined)}
  onReload={() => window.location.reload()}
/>;
```

Session-expired errors use the unauthorized variant (and the host supplies a sign-out callback):

```tsx
<ErrorDialog open={sessionExpired} kind="unauthorized" onSignOut={() => auth.signOut()} />
```

### Key Decisions

Plan-local decisions (RD-level decisions live in the feature's requirements register and are
cited by the RD):

| Decision            | Outcome                                                                       | AR Ref |
| ------------------- | ----------------------------------------------------------------------------- | ------ |
| Plan basis          | Implements `error-dialog/RD-01` in full                                       | AR #1  |
| Plan identity       | `codeops/features/error-dialog/plans/error-dialog/`                           | AR #2  |
| Verify command      | `pnpm verify`                                                                 | AR #3  |
| Export surface      | `ErrorDialog` + `ErrorDialogProps`, `ErrorDialogStrings`, `ErrorDialogKind`   | AR #4  |
| Internal interfaces | Serializer, hook, render and styles signatures per `03-01 §Interfaces`        | AR #5  |
| Test allocation     | Spec / impl / story-manual split per `07-testing-strategy.md`                 | AR #6  |
| Spec documents      | One component specification (`03-01-error-dialog.md`)                         | AR #7  |
| RD-02 plan shape    | Extended this plan set with `03-02` + Phase 2 (the requirements AR #15 route) | AR #8  |
| Provider interfaces | Per `03-02-system-error-provider.md` §Interfaces                              | AR #9  |

## Specialist Agents

**None** — the capability-gap check re-ran at plan time and found no gap a standing specialist
would close; a specialist would restate the repository's component-authoring skill plus
`AGENTS.md`.

_Detection evidence: one feature with two RDs and one plan; no findings ledgers and no recurring
review area to anchor on (`_shared/specialist-agents.md` recurrence anchor unmet); the strongest
domain signal — Fluent UI v9 component authoring — is already packaged as the repo-authored skill
`.opencode/skills/fluentui-components/` (SKILL.md, references, templates), which the executors
load; manifests show no specialized framework, DSL, codegen or protocol beyond that._

## Related Files

Created:

- `packages/react-components/src/components/ErrorDialog/` — `ErrorDialog.tsx`,
  `ErrorDialog.types.ts`, `useErrorDialog.ts`, `renderErrorDialog.tsx`,
  `useErrorDialogStyles.styles.ts`, `serializeError.ts`, `ErrorDialog.stories.tsx`, `index.ts`
- `packages/react-components/test/error-dialog.spec.test.tsx`,
  `packages/react-components/test/error-dialog.impl.test.tsx`
- `packages/react-components/src/components/SystemErrorProvider/` — `SystemErrorProvider.tsx`,
  `SystemErrorProvider.types.ts`, `SystemErrorContext.ts`, `useSystemError.ts`,
  `useGlobalErrorCapture.ts`, `SystemErrorProvider.stories.tsx`, `index.ts`
- `packages/react-components/test/system-error-provider.spec.test.tsx`,
  `packages/react-components/test/system-error-provider.impl.test.tsx`,
  `packages/react-components/test/system-error-provider.ssr.test.tsx`

Modified:

- `packages/react-components/src/index.ts` (exports)
- `packages/react-components/test/package-exports.spec.test.ts` (export-surface list)
- `packages/react-components/README.md` (component section)
