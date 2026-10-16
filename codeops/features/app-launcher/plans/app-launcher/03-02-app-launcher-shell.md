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

#### `src/components/AppLauncher/AppLauncher.stories.tsx` — the workbench port

Five composed samples, each rendered inside a small local application-bar shell (a `header` with a
`ref` for `dockTarget`), with the sample data and logos local to the file:

| Story                 | Sample (ported from the workbench)                                                                                                                                                                                                                                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Microsoft365Flow`    | Search + "Recent" rows + "Pinned" tiles + "All apps" tiles; typing filters into a result list; "No apps found" empty state; activating an app closes the panel and records it in recents (refreshed at open time); Bookings/Insights disabled, "Bookings (focusable)" as `disabledFocusable`; long name wraps in tiles and ellipsizes in rows. |
| `FullDocking`         | `docking="full"`: 40 stress tiles (every tenth disabled) filling the window below the bar, scrolling inside the panel, with the search field pinned on top.                                                                                                                                                                                    |
| `TriggerAnchoredList` | `positioning={{ position: 'below', align: 'end' }}`: the plain rows list anchored to its trigger at the far end of the bar.                                                                                                                                                                                                                    |
| `DrawerToolbar`       | A caller `ToolbarButton` trigger inside a non-modal `OverlayDrawer` toolbar between two other commands; the panel opens below the button; a toggle button shows the page with and without the drawer.                                                                                                                                          |
| `Localized`           | German strings on every prop: trigger label, search label/placeholder, the `dismiss` slot's `aria-label`, and the empty state.                                                                                                                                                                                                                 |

- **Local fixtures** (self-contained, requirements AR #10): the 16-entry sample app list, the six
  hand-drawn SVG logos (mail, files, chat, notes, whiteboard, insights), the 40-entry stress list,
  the `useActivatingLauncher` hook (controlled open; close on activation) and the `AppTiles` /
  `AppRows` helpers.
- **De-branding** (requirements AR #9): `'Virtuo Resource Planning'` → `'Resource Planning'`; the
  `'VirtuoApp'` brand text is dropped (the drawer toolbar keeps its Home/Settings commands).
- **Manual review checklist** — rendered in the story's `docs.description` (the `ConfirmDialog`
  precedent), covering the behaviors jsdom cannot verify: docking geometry flush below the bar;
  full docking reaching the window bottom with internal scrolling; the sticky search field over
  scrolling content; the tooltip suppressed (not floating) while the panel is open; the tile hover
  lift above neighbors; the keyboard flow (Tab, Enter/Space, first Escape clears the query, second
  closes); and a clean a11y addon pass for every story.

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
