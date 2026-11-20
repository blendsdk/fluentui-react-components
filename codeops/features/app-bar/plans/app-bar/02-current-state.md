# Current State: AppBar

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What exists in this repository

The package has a complete, tested `AppLauncher` family: the shell (`AppLauncher`), trigger
(`AppLauncherTrigger`), search, sections, grid, list and item. The launcher already supports a
caller-provided trigger, controlled/uncontrolled open state, `dockTarget`, `docking`, and the
`aria-expanded` wiring that a custom trigger needs. It is the launcher the new bar composes
(AR-10).

The package has no application header. The launcher README tells consumers to hand-write a
`<header ref={barRef}>`, and the launcher stories hand-write a mock `AppBar` plus a custom
`LauncherTriggerButton` because Fluent's transparent `Button` repaints its foreground with
neutral hover colors on the brand surface. The mock and workaround are the direct evidence of
the gap this feature closes:

| File                                                                        | Evidence                                                                                                          |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/components/AppLauncher/stories/AppLauncherStoryApps.story.tsx:282-293` | A local `AppBar` mock: `<header>` with `display:flex`, `gap:8px`, `padding:6px 16px`, brand background.           |
| `src/components/AppLauncher/stories/AppLauncherStoryApps.story.tsx:245-260` | `LauncherTriggerButton` workaround: white icon, `rgba(255,255,255,0.12)` hover, `rgba(255,255,255,0.22)` pressed. |
| `README.md` (AppLauncher section)                                           | The canonical example uses a raw `<header ref={barRef}>` because no `AppBar` exists.                              |

### The fui9 reference

`/home/gevik/workdir/truesoftware/blendsdk-v3/packages/fui9/src/components/appbar` contains a
family of eight components. It is a visual reference, not a migration source. The code is built
on the BlendSDK slot framework (`@blendsdk/react`: `ComponentProps`, `CommonState`, `Slot`,
`SlotComponentProps`, `resolveSlot`) which this package does not use, and it targets React 18 /
Fluent 9.58 while this package targets React 19 / Fluent 9.74.

The parts worth keeping are the intent: a 48px brand header, a spacer, a title, a launcher slot
and on-brand command states. The implementation is not reusable:

| Finding                                                                                                                     | Evidence                                                                        |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Props and state are BlendSDK slot contracts, not native element props                                                       | `AppBar/AppBar.types.ts:1-9`                                                    |
| Command styling is implicit via `[data-appbar-button=true]` descendant selectors                                            | `AppBar/useAppBarStyles.ts:22-41`                                               |
| `AppBarSpacer` exposes `flexSize` in state but never reads it from props                                                    | `AppBarSpacer/AppBarSpacer.types.ts:7-12`, `useAppBarSpacerStyles.ts:20`        |
| `AppTitle` forces an `h1`, uses invalid `textDecorationColor: none`, and never attaches its ref                             | `AppTitle/renderAppTitle.tsx:3-13`, `useAppTitle.ts:3-9`                        |
| Launcher panel is always mounted off-screen; no `aria-expanded`, Escape or focus return; close button uses the waffle glyph | `AppLauncher/renderAppLauncher.tsx:14-28`                                       |
| Launcher module mutates the caller's items and handlers                                                                     | `AppLauncherModule/useAppLauncherModule.ts:18-28`                               |
| Tabs use random IDs in `useMemo`, register in a `useEffect` with stale deps, and have no tab roles or arrow-key navigation  | `AppBarTab/useAppBarTab.ts:5-19`, `AppBarTabList/renderAppBarTabList.tsx:10-31` |
| The appbar folder has no tests or stories of its own; the top-level fui9 index still has commented-out appbar exports       | repository search, `packages/fui9/src/index.ts:6-12`                            |

The new design keeps the 48px brand bar, the title and the spacer, replaces the implicit command
styling with an explicit `AppBarButton`, and leaves the launcher and tabs to the existing
`AppLauncher` and a future navigation feature (AR-01, AR-08, AR-10).

## Relevant Files

| File                                                              | Purpose                  | Changes Needed                                     |
| ----------------------------------------------------------------- | ------------------------ | -------------------------------------------------- |
| `src/components/AppLauncher/`                                     | Existing launcher family | None — composed, not modified (AR-10)              |
| `src/components/AppBar/`                                          | New header component     | Create component, styles, story, barrel            |
| `src/components/AppBarTitle/`                                     | New title component      | Create component, styles, story, barrel            |
| `src/components/AppBarSpacer/`                                    | New spacer component     | Create component, styles, story, barrel            |
| `src/components/AppBarButton/`                                    | New command button       | Create component, styles, story, barrel            |
| `src/index.ts`                                                    | Package root exports     | Add four components and four props types           |
| `test/package-exports.spec.test.ts`                               | Export-surface pin       | Add the four runtime names and type pins           |
| `test/app-bar*.spec.test.tsx`                                     | Specification tests      | Create                                             |
| `test/app-bar*.types.test.tsx`                                    | Type-level tests         | Create                                             |
| `test/app-bar*.impl.test.tsx`                                     | Implementation tests     | Create                                             |
| `README.md`                                                       | Public documentation     | Add AppBar family sections and composition example |
| `codeops/00-roadmap.md`, `codeops/features/app-bar/00-roadmap.md` | Roadmap                  | Add/update the app-bar rows                        |

## Gaps Identified

### Gap 1: No reusable application header

**Current behavior:** applications hand-write a `<header>` with local styles; the bar's height,
padding, foreground and alignment vary per application.

**Required behavior:** `AppBar` renders a semantic brand header with the 48px geometry, zero bar
padding, brand surface and forwarded ref.

**Fix required:** implement RD-01.

### Gap 2: No on-brand command button

**Current behavior:** a Fluent `Button` on the brand bar repaints its foreground with neutral
hover colors; the workaround is a per-story styled `LauncherTriggerButton`.

**Required behavior:** `AppBarButton` provides the M365 states once, for the launcher trigger and
every other bar command.

**Fix required:** implement RD-02.

### Gap 3: The launcher example is a raw header

**Current behavior:** the README teaches a raw `<header ref={barRef}>`; the story mock duplicates
the bar.

**Required behavior:** the README and the composed story use `AppBar` and `AppBarButton` with the
existing launcher.

**Fix required:** add the README sections and the `WithLauncher` story; do not change the
launcher's own docs (AR-10).

### Gap 4: fui9 is not a migration source

**Current behavior:** the fui9 appbar is built on a different framework, has no tests and has
accessibility defects.

**Required behavior:** a new implementation in the repository's anatomy, with spec tests, stories
and the M365 visual contract.

**Fix required:** implement RD-01 and RD-02; record fui9 as reference evidence only.

## Dependencies

### Internal dependencies

- The existing `AppLauncher` and its `dockTarget`/`trigger` contract.
- The repository's component anatomy and Griffel conventions (`skills/fluentui-components`).
- The package export pin and README.

### External dependencies

- `@fluentui/react-components` (`Button`, `mergeClasses`, `makeStyles`, `tokens`).
- `@fluentui/react-icons` for the story waffle and settings icons.
- React 19 refs and `forwardRef`.
- No new package dependency.

## Risks and Concerns

| Risk                                                             | Likelihood | Impact | Mitigation                                                                                                   |
| ---------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| Fluent `Button` styles outrank the component's hover/focus rules | High       | High   | Use `[data-app-bar-button]`-qualified selectors; verify every state in the `States` story.                   |
| Fluent's icon slot repaints the icon on hover                    | Medium     | High   | Verify the icon color in every state; add an attribute-qualified icon rule only if the inheritance fails.    |
| Disabled commands are hard to read on the brand surface          | Medium     | Medium | Use `colorNeutralForegroundDisabled`; review the `States` story; disabled controls are exempt from contrast. |
| The title truncates in a way the user dislikes                   | Medium     | Low    | Show normal and narrow bars in `TitleVariants`; the full text stays in the DOM.                              |
| The visual gate is subjective and may loop                       | Medium     | Medium | Keep the geometry and state values in the story captions; one correction pass, then re-review.               |
| `aria-expanded` is not injected into the custom trigger          | Low        | High   | Fluent 9.14.9 `usePopoverTrigger` injects `aria-expanded`; the integration spec asserts it.                  |
| The type unions make the components awkward to use               | Low        | Medium | Type tests cover the valid and invalid shapes; the README shows the intended usage.                          |
| README growth makes the package docs harder to scan              | Low        | Low    | Add concise sections in the existing format; link the composed example.                                      |
