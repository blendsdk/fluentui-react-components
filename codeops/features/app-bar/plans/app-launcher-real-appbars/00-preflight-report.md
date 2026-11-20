# Preflight Report: Replace simulated app bars in AppLauncher stories

> **Status**: ✅ PREFLIGHT PASSED — 1 minor finding resolved
> **Iteration**: 1 (focused task scan)
> **Artifact**: Mini plan at `codeops/features/app-bar/plans/app-launcher-real-appbars/99-execution-plan.md`
> **Codebase Grounded**: 14 story files and the AppBar/AppBarButton/AppLauncher source examined
> **Last Updated**: 2026-11-20 23:23
> **Same-session review**: ⚠️ The mini plan was authored in this session. The audit is focused and proportional to a story-only task; the full verification and the user's visual pass follow execution.

## Codebase Context Summary

**Tech stack:** pnpm monorepo, React 19, Fluent UI 9.74.9, TypeScript 7, Storybook 10, Vitest 5.

**Key observations:**

- The local `AppBar`, `Brand` and `LauncherTriggerButton` live in
  `AppLauncherStoryApps.story.tsx:282-337`.
- The raw branded `<header>` is in `AppLauncherBrandedBars.story.tsx:59`.
- Eleven scenario files import the simulated helpers: ControlledOpen, DisabledItems,
  DockedToAppBar, FullDock, IconTreatments, ItemActions, KitchenSink, Localization,
  SearchStates, ToolbarTrigger and TriggerAnchoredList.
- The real `AppBar`, `AppBarTitle` and `AppBarButton` exist; `AppBarButton` works as the
  `AppLauncher` trigger (spec ST-25) and the `AppBar` `style` prop passes through for the
  branded bars.
- `AppLauncherTriggerAnchoredList` was missing from the draft T2 list; it uses the same
  mock and is now included.
- The apparent duplicate `Contoso Sheets` entry in the branded-bars data was a readout
  overlap, not a real duplicate; the data has one entry per brand.
- The uncommitted `AppLauncher` top-radius experiment is outside this task; the stories
  will show its current square-top surface.
- The old mock is `6px 16px` padded; the real bar is 48px with zero padding. The visual
  change is intended.

**Reference verification:** every planned file exists; the real component props support
the composition; the `AppBar` ref can feed `AppLauncher`'s `dockTarget`; the
`AppBarButton` forwards the `PopoverTrigger` props and ref.

## Findings

| ID    | Severity | Dimension    | Finding                                                                                                                       | Resolution                                                                                             |
| ----- | -------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| PF-01 | 🟡 MINOR | Completeness | T2 omitted `AppLauncherTriggerAnchoredList.story.tsx`, which also uses the simulated `AppBar`/`Brand`/`LauncherTriggerButton` | Fixed during preflight: the file is in the scope list and T2; the objective says eleven scenario files |

No critical, major, dependency, security or scope-creep findings. The task adds no
dependency, harness or component API; it only replaces story-only simulations with the
real components.

## Verdict

✅ PREFLIGHT PASSED — 1 minor finding resolved. Execution may proceed.
