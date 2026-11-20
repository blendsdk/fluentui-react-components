# Task: Replace simulated app bars in AppLauncher stories

> **Type**: Task (lightweight) · **Feature**: app-bar · **CodeOps Artifact Schema**: 1
> **Progress**: 5/5 tasks (100%)
> **Reasoning**: medium — story-only refactor with a visual pass; no component behavior change.

## Objective

Replace the simulated application bars in the `AppLauncher` stories with the real
`AppBar`, `AppBarTitle`, `AppBarSpacer` and `AppBarButton` components, while keeping
every scenario's launcher behavior, panel content and captions.

**Smallest viable design:** update the shared story helper and the eleven scenario files.
The real components already exist; the `AppBar` `WithLauncher` story is the reference
composition. No component, test, README or package-API changes.

## Scope

**In scope**

- `packages/react-components/src/components/AppLauncher/stories/AppLauncherStoryApps.story.tsx`
- `AppLauncherControlledOpen.story.tsx`, `AppLauncherDisabledItems.story.tsx`,
  `AppLauncherDockedToAppBar.story.tsx`, `AppLauncherFullDock.story.tsx`,
  `AppLauncherIconTreatments.story.tsx`, `AppLauncherItemActions.story.tsx`,
  `AppLauncherKitchenSink.story.tsx`, `AppLauncherLocalization.story.tsx`,
  `AppLauncherSearchStates.story.tsx`, `AppLauncherToolbarTrigger.story.tsx`,
  `AppLauncherTriggerAnchoredList.story.tsx`, `AppLauncherBrandedBars.story.tsx`
- `AppLauncher.stories.tsx` description text that names the simulated helper

**Out of scope**

- `AppLauncher` source, tests and README
- `AppBar` / `AppBarButton` / `AppBarTitle` component source
- The uncommitted `AppLauncher` top-radius experiment (decide that separately)
- New launcher or bar features

The real `AppBar` is 48px with zero padding, so the stories will intentionally look
different from the old `6px 16px` mock. The launcher panel and its behavior do not
change.

## Tasks

- [x] T1 Remove the simulated helpers — `AppLauncherStoryApps.story.tsx`: delete the
      local `AppBar`, `Brand`, `LauncherTriggerButton` and their `bar`/`brand`/`trigger`/
      `waffle` styles; keep `Page`, `Captions`, `AppTiles`, the app data and
      `useActivatingLauncher`; remove the imports that become unused. ✅ (completed: 2026-11-20 23:25)
- [x] T2 Update the scenario imports and compositions — in ControlledOpen, DisabledItems,
      DockedToAppBar, FullDock, IconTreatments, ItemActions, KitchenSink, Localization,
      SearchStates, ToolbarTrigger and TriggerAnchoredList, use the real `AppBar`,
      `AppBarTitle` and `AppBarButton` (`aria-label="App launcher"`,
      `icon={<GridDots20Regular />}`); keep every `barRef` / `dockTarget` and preserve the
      FullDock and Localization labels. ✅ (completed: 2026-11-20 23:25)
- [x] T3 Replace the branded raw header — `AppLauncherBrandedBars.story.tsx`: use
      `<AppBar ref={barRef} aria-label={...} style={{ backgroundColor: color }}>`,
      `AppBarButton` and `AppBarTitle`; remove the local `bar` style,
      `LauncherTriggerButton` and `Brand` imports; keep the captions and search behavior.
      ✅ (completed: 2026-11-20 23:25)
- [x] T4 Update the story docs — `AppLauncher.stories.tsx` and the scenario descriptions
      that name `LauncherTriggerButton` or the simulated bar; keep the manual checklist
      accurate for the real 48px trigger. ✅ (completed: 2026-11-20 23:25)
- [x] T5 Verify — run `pnpm --filter @blendsdk/fluentui-react-components type-check`,
      `pnpm storybook:build`, then `pnpm verify`; open the updated scenarios in Storybook
      and confirm each bar is the real 48px `AppBar` with the launcher docked to it.
      ✅ (completed: 2026-11-20 23:31 — user approved the updated stories)

**Task verify:** the story build and type-check pass; every updated scenario renders a
real `AppBar` at 48px with a working launcher; the full `pnpm verify` passes.

**Execution evidence:** `pnpm type-check` passed; `pnpm storybook:build` completed
successfully; `pnpm verify` passed (88 files, 962 tests). Chromium measurements of the
updated stories: KitchenSink 48px + 1 trigger; DockedToAppBar 48px + 1; BrandedBars
5 × 48px + 5 triggers (Contoso, Contoso Chat, Contoso Docs, Contoso Sheets, Contoso
Slides); ToolbarTrigger 48px (no top-bar launcher trigger); TriggerAnchoredList 48px +
1; ControlledOpen 48px + 1; FullDock 48px + 1. The user visual review is the remaining
check.

**Completion:** the user reviewed the updated launcher stories in Storybook and approved
them on 2026-11-20 23:31.
