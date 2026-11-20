# Findings Ledger: T-01 Real AppBars in AppLauncher stories

> **Document**: 05-findings.md
> **Parent**: [Execution plan](99-execution-plan.md)
> **Task**: T-01 (story-only refactor)

## Post-task review

The independent review found no functional, composition, label, docking or scope defects. It
recorded one minor documentation finding and one observation; both were fixed in the same pass.

| Finding | Phase | Severity    | Area                                                                                                                                                                                           | Ruling                                                                                                                                                              |
| ------- | ----- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RV-01   | T-01  | MINOR       | `AppLauncher.stories.tsx` checklist item 3 asked the reviewer to exercise the built-in tooltip, but every story now uses a custom `AppBarButton`/`ToolbarButton` trigger that owns its tooltip | Fixed — the item now points to the `AppLauncherTrigger` story and `test/app-launcher.spec.test.tsx` for the built-in trigger tooltip and its open-state suppression |
| RV-02   | T-01  | OBSERVATION | The checklist and branded-bars caption described the white overlay as the focus feedback                                                                                                       | Fixed — the wording now distinguishes the hover/press overlay from the white keyboard focus ring                                                                    |

## Context

- The `AppLauncher` default top-radius experiment is a separate, user-approved maintenance change;
  it is not part of T-01. The `DockedToAppBar` caption was updated with that change.
- T-01 changed only the AppLauncher story files. The AppBar source, tests and package README
  changes in the working tree belong to the AppBar feature.

## Evidence

- `pnpm type-check`, `pnpm storybook:build` and `pnpm verify` (88 files, 962 tests) passed.
- Chromium measurements: every changed story bar is 48px; the trigger counts match the scenario
  composition.
- User visual approval: 2026-11-20 23:31.
