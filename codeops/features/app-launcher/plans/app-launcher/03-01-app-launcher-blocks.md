# Content Blocks: App Launcher Implementation Plan

> **Document**: 03-01-app-launcher-blocks.md
> **Parent**: [Index](00-index.md)

## Overview

Landing specification for Phase 1: RD-02's five content blocks (`AppLauncherSearch`,
`AppLauncherSection`, `AppLauncherGrid`, `AppLauncherList`, `AppLauncherItem`) and the internal
layout context. The component design is frozen — the source package is the authority and
[RD-02](../../requirements/RD-02-app-launcher-blocks.md) owns the requirements and the ported file
inventory. This document owns only what the plan adds or adapts: the port procedure, the
normalized-diff gate, the five story files, the README block sections and the export-pin
extension.

## Architecture

### Current Architecture

The package has no launcher sources; the ten existing components show the target anatomy
(`forwardRef` shell, props types, state hook, render function, Griffel styles, folder barrel,
container/child context in the `DescriptionList` pair) — the same anatomy the source blocks use.

### Proposed Changes

Copy 31 files into `src/components/AppLauncher{Item,Grid,List,Section,Search}/` exactly as
inventoried in RD-02 §Ported file inventory (the layout context lives in `AppLauncherItem/`). No
new architecture, no dependency, config or build change; stories and README content are added
beside the sources.

## Implementation Details

### Port procedure (per component task)

1. Copy the folder's files verbatim from
   `/home/gevik/workdir/codeindustry/VirtuoApp/packages/react-app-launcher/src/components/<Folder>/`.
2. Format the copied files with the repository's Prettier (`pnpm format`).
3. No comment edits: the closed edit whitelist (requirements AR #8) covers only two RD-01 files.
4. Run the normalized-diff gate for the copied files (below) before marking the task complete.

### Normalized-diff gate (AR P3)

1. Copy the same source files to `$CODEOPS_TMPDIR/app-launcher-src-blocks/`.
2. Format the copies with the repository's Prettier configuration and pinned version.
3. `diff -ru` every source copy against its destination file.
4. **Expected: an empty diff for every one of the 31 component files and the five block spec
   test files.** Any hunk — including whitespace, ordering or comment differences — fails the
   gate; the port is corrected, never the source, and an unexplainable difference is recorded as a
   finding.

### New artifacts

#### `src/components/AppLauncherSearch/AppLauncherSearch.stories.tsx`

| Story        | Shows                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------- |
| `Default`    | The labelled field with the default `'Search'` placeholder; no visible label is rendered. |
| `Controlled` | Live filtering of a small local sample list through `onChange` + component state.         |
| `Localized`  | German texts on every string: label, placeholder and the `dismiss` slot's `aria-label`.   |
| `Size`       | The `size` passthrough on the field.                                                      |

#### `src/components/AppLauncherSection/AppLauncherSection.stories.tsx`

| Story         | Shows                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| `Titled`      | A titled section over a small grid.                                       |
| `WithDivider` | Two stacked sections where the second carries `divider` (spacing + line). |
| `Untitled`    | A plain group without a title.                                            |

#### `src/components/AppLauncherGrid/AppLauncherGrid.stories.tsx`

| Story         | Shows                                      |
| ------------- | ------------------------------------------ |
| `Default`     | The 3-column default with a small app set. |
| `FourColumns` | The `columns` prop (4).                    |
| `LongName`    | A long app name wrapping inside its tile.  |

#### `src/components/AppLauncherList/AppLauncherList.stories.tsx`

| Story      | Shows                                                 |
| ---------- | ----------------------------------------------------- |
| `Rows`     | Full-width rows with icons.                           |
| `LongName` | A long app name ending in an ellipsis.                |
| `Disabled` | A disabled row beside enabled ones (muted, no click). |

#### `src/components/AppLauncherItem/AppLauncherItem.stories.tsx`

| Story          | Shows                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| `Default`      | A standalone item (no container) — the documented `'tile'` fallback.                      |
| `IconLess`     | An item without an icon.                                                                  |
| `ColorfulLogo` | A colorful logo element beside a Fluent icon (the item does not constrain icon size).     |
| `DisabledPair` | `disabled` and `disabledFocusable` side by side; the description explains the difference. |
| `LongName`     | A long app name (wrap in tile, ellipsis in row).                                          |

- The `ColorfulLogo` fixture is one small inline-SVG logo component local to this file (`aria-hidden`,
  a colored rounded square with a white glyph); no other story file defines a logo and no shared
  fixture module exists (requirements AR #10).
- All story files follow the house conventions: `title: 'Components/<Name>'`, `tags: ['autodocs']`,
  a JSDoc line per export saying when to choose the variant, relative imports, **no** `FluentProvider`
  wrapper (the preview provides it).

### Root barrel extension

`src/index.ts` gains, in the file's existing style and alphabetical position:

```ts
export { AppLauncherGrid } from './components/AppLauncherGrid';
export type { AppLauncherGridProps } from './components/AppLauncherGrid';
export { AppLauncherItem } from './components/AppLauncherItem';
export type { AppLauncherItemProps } from './components/AppLauncherItem';
export { AppLauncherList } from './components/AppLauncherList';
export type { AppLauncherListProps } from './components/AppLauncherList';
export { AppLauncherSearch } from './components/AppLauncherSearch';
export type {
  AppLauncherSearchChangeData,
  AppLauncherSearchProps,
} from './components/AppLauncherSearch';
export { AppLauncherSection } from './components/AppLauncherSection';
export type { AppLauncherSectionProps } from './components/AppLauncherSection';
```

### Export-pin extension

`test/package-exports.spec.test.ts` gains the five runtime names in the sorted
`Object.keys(api)` list and type pins for `AppLauncherGridProps`, `AppLauncherItemProps`,
`AppLauncherListProps`, `AppLauncherSearchProps`, `AppLauncherSearchChangeData` and
`AppLauncherSectionProps`, with local usage values following the file's existing pattern. After
Phase 1 the runtime list has 13 entries; Phase 2 brings it to 15.

### README block sections

Append after the existing `ConfirmProvider` section — one section per block in this order:
`AppLauncherSearch`, `AppLauncherSection`, `AppLauncherGrid`, `AppLauncherList`, `AppLauncherItem`.
Each section: a one-paragraph description; the props table
(`Prop | Type | Default | Description`); composition bullets where the source README has them
(tiles for browsing vs rows for scanning, icons free-form, disabled from business rules, empty
results are application content, search Escape behavior). The family introduction, quick start
and localization table are owned by [03-02](03-02-app-launcher-shell.md) and are inserted **before**
these sections in Phase 2, so Phase 1 appends at the end of the Components section.

## Code Examples

Story skeleton used by every block story file (house pattern):

```tsx
const meta: Meta<typeof AppLauncherSection> = {
  title: 'Components/AppLauncherSection',
  component: AppLauncherSection,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AppLauncherSection>;

/** A titled section — the common case when grouping apps under a caption. */
export const Titled: Story = {
  render: () => (
    <AppLauncherSection title="All apps">
      <AppLauncherGrid>
        <AppLauncherItem label="Mail" icon={<Mail32Regular />} />
      </AppLauncherGrid>
    </AppLauncherSection>
  ),
};
```

## Error Handling

| Error Case                                                          | Handling Strategy                                                                                                                                                                     | AR Ref      |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| None — the blocks are rendering-only components with no error paths | N/A. Behavior on the edges (empty search value, unmounted children, disabled states) is frozen in the source and covered by the oracle; any defect is a recorded finding, never a fix | AR #2 (req) |

## Testing Requirements

Pointer to [07-testing-strategy.md](07-testing-strategy.md): ST-15…ST-36 (blocks) plus the pin's
ST-37 contribution; the five block spec files and the item impl test are ported unchanged; the
normalized-diff gate covers the byte-identity claim; the phase verify is `pnpm verify` and
`pnpm storybook:build`. Three of the ported cases (ST-17, ST-22, ST-24) render inside the
launcher surface and turn green in Phase 2, when the shell lands (AR P7).
