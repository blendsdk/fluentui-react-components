# RD-02: App Launcher Content Blocks

> **Document**: RD-02-app-launcher-blocks.md
> **Status**: Draft
> **Created**: 2026-10-16
> **Project**: fluentui-react-components
> **Depends On**: —
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

The content blocks are what a launcher panel is made of: `AppLauncherSearch` filters the app
list, `AppLauncherSection` groups content under an optional title, `AppLauncherGrid` lays items
out as tiles, `AppLauncherList` as full-width rows, and `AppLauncherItem` renders one app — a
tile or a row, decided by its surrounding container through an internal layout context.

All five components and the context are ported **byte-identically** from VirtuoApp's
`@virtuoapp/react-app-launcher` (AR #2). The port keeps the source's design decisions exactly:
the blocks hold no data and no application state (the application owns which apps exist, what a
search matches and what "recent" means), the item's disabled semantics follow Fluent's Button
precedence, the search field owns its Escape behavior, and the layout context makes the same
`AppLauncherItem` serve both layouts. This RD records the frozen contract for the port (AR #7
oracle) and the variant stories the repository's definition of done requires (AR #5, AR #10).

---

## Functional Requirements

### Must Have (M)

**AppLauncherItem**

- [ ] One app rendered as a Fluent `Button` with `appearance="subtle"`; `label` (required) renders
      as the button text and is the accessible name — no `aria-label` is needed (AR #1, AR #2).
- [ ] `icon` is any element (a sized Fluent icon or a colorful logo element) rendered in a
      wrapper box inside the button content — deliberately **not** through the Button's `icon`
      slot, whose sizing suits inline icons; the item does not constrain the icon's size; an
      item without an icon renders the label alone (AR #2).
- [ ] The surrounding container decides the layout through the internal
      `AppLauncherItemLayoutContext`: `AppLauncherGrid` provides `'tile'` (icon above the name),
      `AppLauncherList` provides `'row'` (icon beside the name); items outside any container fall
      back to `'tile'`; the innermost container wins (AR #2).
- [ ] `disabled` renders the item as a natively disabled button: no activation (click, Enter,
      Space), skipped by keyboard navigation, Fluent's muted disabled look (AR #2).
- [ ] `disabledFocusable` renders the item announced disabled but reachable: no native `disabled`
      attribute, `aria-disabled` set by Fluent's Button, stays in the tab order, never activates;
      when both props are set, the Button's precedence applies — the item stays focusable and is
      announced disabled (AR #2).
- [ ] Disabled items dim their icon: monochrome icons follow the muted text color; a colorful
      logo is desaturated and faded (`grayscale(1)`, `opacity: 0.5`) so it sits near the
      lightness of the muted name; `disabledFocusable` dims exactly like `disabled` (AR #2).
- [ ] All native button props (`onClick`, `className`, `aria-*`, ...) pass through; `className`
      merges; the forwarded ref points at the button element (AR #2).

**AppLauncherGrid**

- [ ] Renders a `ul` whose children are each wrapped in an `li` (list semantics for assistive
      technology); provides `'tile'` to the items through the layout context (AR #2).
- [ ] `columns` (default 3) builds the inline `gridTemplateColumns` as
      `repeat(N, minmax(0, 1fr))` — the `minmax(0, …)` floor lets tiles shrink below their
      content width so a long name cannot widen the panel; a caller `style` merges over it
      (AR #2).
- [ ] The grid fixes the panel width at 320px (the source's Microsoft 365 panel width) and
      removes the `ul` decoration (margin, padding, list style); native list props pass through;
      the forwarded ref points at the `ul` (AR #2).

**AppLauncherList**

- [ ] Renders a `ul` whose children are each wrapped in an `li`; provides `'row'` to the items
      (AR #2).
- [ ] Rows are full-width; long names end in an ellipsis instead of wrapping; native list props
      pass through; the forwarded ref points at the `ul` (AR #2).

**AppLauncherSection**

- [ ] Groups content in a `div` (flex column, small internal gap); `title` renders as a plain
      label above the content — deliberately no heading semantics, so the section can hold a
      grid, a list or anything else (AR #2).
- [ ] Spacing applies from the second section on (`:not(:first-child)`); `divider` (default
      `false`) adds a separator line above the section from the second section on; a section
      without a title works as an unlabeled group (AR #2).
- [ ] Native `div` props pass through; the forwarded ref points at the section element (AR #2).

**AppLauncherSearch**

- [ ] A Fluent `SearchBox` in a sticky wrapper: the wrapper pins the field to the panel's top
      while the content scrolls under it and its opaque background covers the surface's padding
      band (the wrapper carries the negative margin, sticky offset and top padding; the
      SearchBox keeps its native outline and size) (AR #2).
- [ ] `label` (required) is the field's accessible name (`aria-label`); no visible label is
      rendered; `placeholder` defaults to `'Search'`; `value` is controlled by the caller
      (AR #2).
- [ ] Escape behavior lives in the field: with a non-empty controlled `value`, the first Escape
      clears the query (`preventDefault`, `stopPropagation`, `onChange(event, { value: '' })`)
      and the panel stays open; with an empty or uncontrolled field the key travels on and the
      panel closes as usual; `onKeyDown` is owned by the block (AR #2).
- [ ] All remaining `SearchBox` props pass through (`size`, `appearance`, `disabled`, the
      `dismiss` slot, ...); the forwarded ref points at the input element (AR #2).

**Shared**

- [ ] The layout context (`AppLauncherItemLayoutContext`) stays internal: it is not exported from
      the package root (AR #11).
- [ ] Public exports: `AppLauncherSearch`, `AppLauncherSection`, `AppLauncherGrid`,
      `AppLauncherList`, `AppLauncherItem` plus the types `AppLauncherSearchProps`,
      `AppLauncherSearchChangeData`, `AppLauncherSectionProps`, `AppLauncherGridProps`,
      `AppLauncherListProps`, `AppLauncherItemProps` (AR #11).
- [ ] Ported tests pass **unmodified**: `test/app-launcher-search.spec.test.tsx` (4),
      `test/app-launcher-section.spec.test.tsx` (2), `test/app-launcher-grid.spec.test.tsx` (2),
      `test/app-launcher-list.spec.test.tsx` (2), `test/app-launcher-item.spec.test.tsx` (9),
      `test/app-launcher-item.impl.test.tsx` (3) — 22 tests in 6 files, the immutable oracle
      (AR #7).
- [ ] Stories: one story file per block —
      `src/components/AppLauncherSearch/AppLauncherSearch.stories.tsx` (default labelled field,
      controlled filtering, localized German field with `dismiss` override, size variant),
      `AppLauncherSection` (titled, divider sequence, untitled group),
      `AppLauncherGrid` (default 3 columns, other column counts, long-name wrapping),
      `AppLauncherList` (rows, long-name ellipsis, disabled rows),
      `AppLauncherItem` (standalone tile, icon-less, colorful logo, `disabled` vs
      `disabledFocusable` side by side, long name) — each showing its documented variants
      (AR #5, AR #10). The `AppLauncherItem` story defines one small local color-logo fixture
      for the dimming demo; no shared fixture module exists (AR #10).
- [ ] README: one section per block (description, props table, composition patterns) and the
      family's localization table (every user-facing string is a prop; defaults are English)
      integrated into the existing package README (AR #18).
- [ ] The package export-surface pin lists the five components and carries type pins for the
      six public types (AR #12).

### Should Have

- None — the confirmed scope fits Must Have and Won't Have.

### Won't Have (Out of Scope)

- Any behavioral fix, improvement or refactor — findings become recorded findings (AR #2).
- Arrow-key grid navigation, badges, recents/favorites management, virtualization, RTL sweep
  (comparable-systems candidates left at default Out).
- Keyboard-interaction changes; the source documents Tab-through behavior only and that stays.
- An SSR smoke test (AR #7); release or source-repository work (AR #16, AR #17).

---

## Technical Requirements

### Ported file inventory (M)

| Destination (`packages/react-components/src/components/`)                                                                                                                                          | Source counterpart (`react-app-launcher/src/components/`) | Notes                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------- |
| `AppLauncherItem/` — `AppLauncherItem.tsx`, `.types.ts`, `useAppLauncherItem.ts`, `renderAppLauncherItem.tsx`, `useAppLauncherItemStyles.styles.ts`, `AppLauncherItemLayoutContext.ts`, `index.ts` | same names                                                | 7 files; the context lives here |
| `AppLauncherGrid/` — `.tsx`, `.types.ts`, `use…`, `render…`, `use…Styles.styles.ts`, `index.ts`                                                                                                    | same names                                                | 6 files                         |
| `AppLauncherList/` — `.tsx`, `.types.ts`, `use…`, `render…`, `use…Styles.styles.ts`, `index.ts`                                                                                                    | same names                                                | 6 files                         |
| `AppLauncherSection/` — `.tsx`, `.types.ts`, `use…`, `render…`, `use…Styles.styles.ts`, `index.ts`                                                                                                 | same names                                                | 6 files                         |
| `AppLauncherSearch/` — `.tsx`, `.types.ts`, `use…`, `render…`, `use…Styles.styles.ts`, `index.ts`                                                                                                  | same names                                                | 6 files                         |

New (not ported): the five story files, the six ported test files and the export-pin extension.

### Frozen mechanics (M)

- **Layout context**: `createContext<AppLauncherItemLayout>('tile')`; the providers wrap the
  `<li>`-mapped children inside each container's `render`; the item reads it with `useContext`.
- **Item styles**: the tile pins its cards with `:enabled:not([aria-disabled="true"])` guards
  (background/foreground/radius), the hover lift uses `position: relative` + `zIndex: 1` +
  `shadow16` (skipped while `data-fui-focus-visible` so the focus ring wins), the pressed state
  uses `colorSubtleBackgroundPressed`, and disabled items fall outside every guard to keep
  Fluent's disabled look. Row labels ellipsize via `min-width: 0` + `overflow: hidden` +
  `text-overflow: ellipsis` + `white-space: nowrap`.
- **Grid template**: inline style `{ gridTemplateColumns: state.gridTemplateColumns, ...rootProps.style }` — the caller's style wins where it overlaps.
- **Search sticky math**: `position: sticky; top: -16px; margin-top: -16px; padding-top: 16px; z-index: 2` with the panel background, compensating the medium `PopoverSurface` padding (a documented literal, since no token names the surface's padding); the field fills the panel width.
- **Section spacing**: `:not(:first-child)` margin plus `padding-block-start` and the thin
  `colorNeutralStroke2` top border for dividers (longhand border properties as the source
  documents).
- **Children mapping**: `Children.map(children, child => <li>{child}</li>)` — React's
  `Children.map` supplies keys; this is the frozen list-semantics mechanism.

### Scope adaptation and port discipline (M)

The block sources contain zero package-name references. This RD's files carry **no** comment
edits (the closed 3-item list belongs to RD-01); the only allowed differences from source are
Prettier formatting and story-side scope/de-branding rules (AR #3, AR #8, AR #9). Any other
diff is a review failure (AR #2).

### Story rules (M)

Same rules as RD-01: relative imports, no `FluentProvider` wrapper, self-contained fixtures
(the item story's local logo fixture), story JSDoc states when to choose each variant, the
`disabled`/`disabledFocusable` pair shown side by side with the difference explained (AR #5,
AR #10, AR #13).

### Package integration (M)

- `src/index.ts` gains the five component exports and six type exports in the file's existing
  order and style; the layout context stays internal (AR #11).
- `test/package-exports.spec.test.ts` gains the five runtime names and six type pins (AR #12).
- No dependency, manifest, build or configuration changes (AR #14).

---

## Integration Points

### With RD-01 (App launcher shell)

- The blocks compose inside the shell's surface: the composed `AppLauncher` story samples render
  them, and the README quick start shows the family together; neither RD's component code
  imports the other.

### With the existing package

- The blocks follow the house anatomy and the container/child context precedent
  (`DescriptionList`/`DescriptionListItem`); the export pin and README are the shared
  documentation surfaces.

---

## Scope Decisions

| Decision          | Options Considered                        | Chosen                                               | Rationale                                                      | AR Ref        |
| ----------------- | ----------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------- | ------------- |
| Port fidelity     | Byte-identical vs port with fixes         | Byte-identical; findings recorded only               | User directive; the source suite is the validated contract     | AR #2         |
| Layout delivery   | Context vs per-item layout prop           | Context as source (`'tile'` default, innermost wins) | Frozen behavior; keeps items container-agnostic                | AR #2         |
| Disabled model    | Keep `disabledFocusable` vs drop          | Keep exactly as source (Button precedence)           | Frozen behavior; tested semantics                              | AR #2         |
| Escape behavior   | Keep in the field vs lift to the shell    | Keep in the block (frozen)                           | The field owns clearing; the shell closes on the second Escape | AR #2         |
| Stories           | Variant stories per block vs samples only | Variant stories required by the repo DoD             | User directive + repository definition of done                 | AR #5, AR #10 |
| Item logo fixture | Local fixture vs shared module            | One small local logo in the item story               | No shared fixture module; nothing leaks into the package build | AR #10        |
| Test strategy     | Oracle unchanged vs new tests             | Oracle unchanged (22 tests, 6 files)                 | Port-only directive                                            | AR #7         |
| Export pin        | Extend existing pin vs separate file      | Extend the existing pin                              | Repository convention: one export-surface test                 | AR #12        |

> **Traceability:** Every scope decision references the Ambiguity Register entry that resolved
> it. See `00-ambiguity-register.md`.

---

## Security Considerations

- **Data sensitivity:** none — presentation-only components; no PII, credentials or tokens. The
  application owns all data; the blocks render what they are given.
- **Input validation:** all content arrives through typed props (`label: string`, `ReactNode`
  children, elements) and renders through React; no parsing.
- **Authentication & authorization:** N/A — no auth surface.
- **Injection risks:** N/A — no dynamic HTML, no URL construction from input, no
  `dangerouslySetInnerHTML`; labels render as text.
- **Encryption needs:** N/A — no data at rest or in transit.
- **Rate limiting:** N/A — no endpoints or network calls.
- **Infrastructure:** N/A — client-side library components; no secrets, no deployment surface.

---

## Acceptance Criteria

1. [ ] `test/app-launcher-item.spec.test.tsx` passes unchanged (9 tests): the label renders as
       the button text with the icon as an `svg`; an item without an icon renders no `svg`;
       `onClick` fires once on activation; `disabled` sets the native `disabled` attribute and
       blocks focus and activation; `disabledFocusable` sets `aria-disabled="true"`, no native
       `disabled`, stays focusable, and blocks click and Enter activation; both props together
       keep the item focusable and announced disabled without activation.
2. [ ] `test/app-launcher-item.impl.test.tsx` passes unchanged (3 tests): the same item renders
       different class sets inside `AppLauncherGrid` (tile) versus `AppLauncherList` (row); a
       disabled item's icon box carries the dimming class; a `disabledFocusable` item's icon box
       carries exactly the same dimming class.
3. [ ] `test/app-launcher-search.spec.test.tsx` passes unchanged (4 tests): the field renders a
       `searchbox` named by `label` with placeholder `'Search'`; typing reports
       `onChange(event, { value })`; the first Escape clears a non-empty controlled value and
       keeps the panel open (`aria-expanded="true"`), the second closes it; a clearing Escape
       does not reach document-level keydown listeners, while the Escape after clearing does.
4. [ ] `test/app-launcher-section.spec.test.tsx` (2 tests), `test/app-launcher-grid.spec.test.tsx`
       (2 tests) and `test/app-launcher-list.spec.test.tsx` (2 tests) pass unchanged: a section
       renders its title (including with `divider`) and its content, and renders content without
       a title; the grid and the list each render one `list` with one `listitem` per child and
       compose inside the launcher surface (the item is reachable after the trigger opens the
       panel).
5. [ ] The package root exports the five components and the six public types; the export pin
       lists them and carries the type pins; `AppLauncherItemLayoutContext` and every state
       type, hook and render function stay internal (`Object.keys(api)` matches exactly).
6. [ ] Byte-identical review: a diff review of every ported block file against the source shows
       Prettier formatting only — no comment edits, no code, style or test differences (reviewer
       and auditor confirm per the plan's review loop).
7. [ ] The five story files exist and show their documented variants (search: labelled +
       controlled + localized + size; section: titled + divider + untitled; grid: 3-column
       default + other column counts + long name; list: rows + ellipsis + disabled; item:
       standalone + icon-less + colorful logo + `disabled`/`disabledFocusable` pair + long
       name); `pnpm storybook:build` succeeds and the a11y addon reports no violations.
8. [ ] The README gains the five block sections (props tables with every prop, type, default and
       semantics; composition patterns for tiles vs rows, free-form icons, business-rule
       disabling, the empty-results state) and the localization table.
9. [ ] `pnpm verify` passes: format check, skill check, type-check, build, full test suite.
10. [ ] Security requirements verified per Security Considerations (N/A rationale): no network,
        storage, auth or crypto operations; no new dependency enters the manifest.
11. [ ] The source package and repository are unmodified (read-only port).

---

## Non-Functional Notes

- **Complexity:** M — five presentational blocks plus one internal context, ported from a
  validated implementation with 22 covering tests.
- **Performance:** no measurable target beyond the repository norm; the blocks render static
  lists and one search field and add no listeners or timers.
- **Bundle:** additive only; no new dependency; imports stay within
  `@fluentui/react-components`, `@fluentui/react-icons` and React.
