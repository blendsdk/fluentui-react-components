# Requirements: ErrorDialog

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-01](../../requirements/RD-01-error-dialog-component.md) — the OWNING requirements doc

## Scope of this plan (delta view)

### In this plan

- RD-01 in full — Functional Requirements (all Must Have bullets), Technical Requirements, and
  Acceptance Criteria 1–19. The RD owns every behavior, decision and criterion; this plan adds no
  requirement of its own.
- The RD's verification channels are honored as recorded there: the spec oracle covers what jsdom
  can observe; the focus-trap cycle is verified in the Storybook story plus a manual keyboard
  pass; the token/source checks run as implementation checks with review; the story set is
  review-verified.

### Deferred / out of this plan

- None. RD-01's Won't Have list (capture/store/provider, error boundary, telemetry, mail-to,
  reference ID, queue/history, i18n framework, status pages) is out of product scope — not
  deferred work of this plan.

## Plan-local decisions

Only decisions NOT already in the RD:

| Decision                          | Chosen                                                                                                                    | AR Ref |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------ |
| Plan basis                        | Implements `error-dialog/RD-01` in full                                                                                   | AR #1  |
| Plan identity / folder            | `codeops/features/error-dialog/plans/error-dialog/`                                                                       | AR #2  |
| Verify command                    | `pnpm verify` (AGENTS.md; `package.json`)                                                                                 | AR #3  |
| Public export surface             | Runtime `ErrorDialog` + `ErrorDialogProps`, `ErrorDialogStrings`, `ErrorDialogKind`; sub-interfaces and internals private | AR #4  |
| Internal interfaces               | Per `03-01-error-dialog.md` §Interfaces                                                                                   | AR #5  |
| Spec / impl / story allocation    | Per `07-testing-strategy.md` (coverage: all criteria verified; no numeric coverage gate)                                  | AR #6  |
| Component specification documents | Single `03-01-error-dialog.md`                                                                                            | AR #7  |

## Acceptance Criteria

[Only plan-local criteria; the RD owns its own acceptance criteria]

1. [ ] All RD-01 acceptance criteria (1–19) verified through their recorded channels.
2. [ ] The plan's quality gates pass: the Phase 3 checklist, `pnpm verify`, and
       `pnpm storybook:build` at final verification.
