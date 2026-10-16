# Shell: App Launcher Implementation Plan

> **Document**: 03-02-app-launcher-shell.md
> **Parent**: [Index](00-index.md)

## Overview

Landing specification for Phase 2: RD-01's `AppLauncher` and `AppLauncherTrigger`. The component
design is frozen — the source package is the authority and
[RD-01](../../requirements/RD-01-app-launcher-shell.md) owns the requirements and the ported file
inventory. This document owns what the plan adds or adapts: the port procedure with the closed
comment whitelist, the normalized-diff expectations, the two story files (including the workbench
samples and the manual review checklist), the README shell sections, the family quick start and
the export-pin extension.

## Architecture

### Current Architecture

The shell has no counterpart in this package; the interplay it needs (a Fluent `Popover` whose
trigger is an existing button, Griffel surface styling with a specificity compensation, a caller
content slot) has no existing equivalent — the design is entirely the frozen source.

### Proposed Changes

Copy 11 files into `src/components/AppLauncher/` and `src/components/AppLauncherTrigger/` exactly
as inventoried in RD-01 §Ported file inventory, then add the stories, README sections and barrel
exports. No new dependency, config or build change.

## Implementation Details

### Port procedure (per component task)

1. Copy the folder's files verbatim from
   `/home/gevik/workdir/codeindustry/VirtuoApp/packages/react-app-launcher/src/components/<Folder>/`.
2. Format with the repository's Prettier (`pnpm format`).
3. Apply the closed comment whitelist (requirements AR #8) — exactly these edits, nothing else:
   - `AppLauncher.tsx` JSDoc: drop the stale "and (in later iterations) the panel behavior"
     phrase.
   - `app-launcher.spec.test.tsx`: reword the two "inspected … in the workbench" comments to the
     Storybook equivalent.
4. Run the normalized-diff gate (below) before marking the task complete.

### Normalized-diff gate (AR P3)

After formatting the source copies in `$CODEOPS_TMPDIR` (same procedure as
[03-01](03-01-app-launcher-blocks.md) §Normalized-diff gate), the expected result is **exactly
three comment hunks and nothing else**:

| File                                 | Expected hunks                                    |
| ------------------------------------ | ------------------------------------------------- |
| `AppLauncherTrigger/**` (5 files)    | none — empty diffs                                |
| `AppLauncher/**` (6 files)           | exactly 1 (the comment edit in `AppLauncher.tsx`) |
| `app-launcher-trigger.spec.test.tsx` | none — empty diff                                 |
| `app-launcher.spec.test.tsx`         | exactly 2 (the reworded comments)                 |

Any other hunk fails the gate; the port is corrected, never the source.

### New artifacts

#### `src/components/AppLauncherTrigger/AppLauncherTrigger.stories.tsx`

| Story         | Shows                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| `Default`     | The built-in waffle button, accessible name `'App launcher'`, label tooltip. |
| `CustomLabel` | A localized label used as both the accessible name and the tooltip.          |
| `CustomIcon`  | An icon override (for example a different Fluent sized icon).                |
| `Appearance`  | An appearance/size variant through the Button passthrough.                   |

#### `src/components/AppLauncher/AppLauncher.stories.tsx` — the integrated story suite

Amended during execution (register P10, user direction): the shell stories are a port of the
component's upstream integrated demo — twelve scenarios over shared fixtures — with this
repository's adaptations: the index file is the single indexed entry, the scenario and fixture
modules are `.story.tsx` support files excluded from the declaration build, and the trigger
fixture follows React 19's native button props. The workbench-derived composition this replaces
is recorded in the ambiguity register.

| Story                 | Shows                                                                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KitchenSink`         | Search + "Recent" rows + "Pinned" tiles + "All apps" tiles; filtering with the "No apps found" empty state; activation closes the panel and refreshes the recents at open time; disabled and `disabledFocusable` items. |
| `DockedToAppBar`      | `dockTarget`: the panel opens flush below the bar, wrapping its content and scrolling internally when the space runs out.                                                                                               |
| `FullDock`            | `docking="full"`: the panel extends to the window bottom; 40 stress tiles scroll inside with the search field pinned on top.                                                                                            |
| `TriggerAnchoredList` | `positioning={{ position: 'below', align: 'end' }}`: the rows list anchored to its trigger at the far end of the bar.                                                                                                   |
| `ToolbarTrigger`      | A `ToolbarButton` trigger inside a non-modal `OverlayDrawer` toolbar between two commands; the panel opens below the button.                                                                                            |
| `DisabledItems`       | The two disabled flavors side by side, in tiles and rows.                                                                                                                                                               |
| `IconTreatments`      | Monochrome icons beside colorful logos; long labels wrapping vs ellipsizing.                                                                                                                                            |
| `SearchStates`        | The controlled field in every state with tile results.                                                                                                                                                                  |
| `ControlledOpen`      | Controlled open state with a recently-used list refreshed at open time.                                                                                                                                                 |
| `ItemActions`         | An activation log proving whole-item click targets and inert disabled items.                                                                                                                                            |
| `Localization`        | German and Armenian examples covering every string.                                                                                                                                                                     |
| `BrandedBars`         | The trigger on five brand-colored bars, keeping its on-brand colors in every interaction state.                                                                                                                         |

- **Shared fixtures** (`AppLauncherStoryApps.story.tsx`, `AppLauncherStoryLogos.story.tsx`): the
  brand-blue `AppBar` with the on-brand `LauncherTriggerButton`, the `Page` frame, the `Captions`
  card, the 16-entry sample app list, the 40-entry stress list, the `useActivatingLauncher` hook,
  the `AppTiles`/`AppRows` helpers and the six hand-drawn SVG logos.
- **Manual review checklist** — rendered in the index story's `docs.description` (the
  `ConfirmDialog` precedent), covering the behaviors jsdom cannot verify: docking geometry,
  full docking with the sticky search, tooltip suppression, tile hover lift, keyboard flow, the
  drawer trigger, branded bars, localization, item actions and a clean a11y addon pass.

#### README — shell sections, family quick start and localization table

Everything is inserted **before** the block sections (see
[03-01](03-01-app-launcher-blocks.md) §README block sections), so the family reads as one unit:

- `### AppLauncher` — description; props table (`label`, `icon`, `trigger`, `positioning`,
  `dockTarget`, `docking`, `open`, `onOpenChange`, `children`); composition notes (application
  owns state; activation closes the panel from caller state; trigger in a toolbar; docking usage);
  the family quick start adapted from the source README/workbench under this package's name.
- `### AppLauncherTrigger` — description; props table.
- The family **localization table** (trigger label; search accessible name and placeholder; clear
  button via the `dismiss` slot; item names; section titles; empty state) with the defaults and
  the localization mechanism per row.

#### Root barrel and pin

- `src/index.ts` gains `export { AppLauncher }` + `AppLauncherProps`/`AppLauncherDocking` and
  `export { AppLauncherTrigger }` + `AppLauncherTriggerProps` in the file's existing style.
- `test/package-exports.spec.test.ts` gains the two runtime names and the three type pins. The
  final sorted runtime surface is exactly:

  `AppLauncher, AppLauncherGrid, AppLauncherItem, AppLauncherList, AppLauncherSearch,`
  `AppLauncherSection, AppLauncherTrigger, ConfirmDialog, ConfirmProvider, DescriptionList,`
  `DescriptionListItem, ErrorDialog, SystemErrorProvider, useConfirm, useSystemError`

#### Final port audit

Grep the whole repository for `@virtuoapp` and `Virtuo` in ported/shipped artifacts (expect zero),
confirm the source repository is unmodified and the README covers every family component.

## Code Examples

Caller-provided trigger (the drawer toolbar usage):

```tsx
<AppLauncher trigger={<ToolbarButton aria-label="App launcher" icon={<GridDots20Regular />} />}>
  …panel content…
</AppLauncher>
```

## Error Handling

| Error Case                                                              | Handling Strategy                                                                                                                           | AR Ref      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| None — the shell is a rendering-only component pair with no error paths | N/A. Positioning and tooltip edge behavior is frozen in the source and covered by the oracle; any defect is a recorded finding, never a fix | AR #2 (req) |

## Testing Requirements

Pointer to [07-testing-strategy.md](07-testing-strategy.md): ST-1…ST-14 (shell) plus the pin's
ST-37 completion; the two shell spec files are ported unchanged apart from the two whitelisted
comment edits; the normalized-diff gate covers the byte-identity claim; the phase verify is
`pnpm verify` and `pnpm storybook:build`, plus the recorded manual pass.
