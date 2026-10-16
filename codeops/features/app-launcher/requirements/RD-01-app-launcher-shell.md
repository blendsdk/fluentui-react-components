# RD-01: App Launcher Shell

> **Document**: RD-01-app-launcher-shell.md
> **Status**: Draft
> **Created**: 2026-10-16
> **Project**: fluentui-react-components
> **Depends On**: —
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

The launcher shell pairs the waffle trigger with the popover surface an application switcher
opens: `AppLauncher` is the component applications mount, and `AppLauncherTrigger` is its
built-in icon-only trigger button, exported for callers that place the waffle themselves.

Both components are ported **byte-identically** from VirtuoApp's
`@virtuoapp/react-app-launcher` — the reviewed source package whose behavior was validated by
its own test suite (the migration's immutable oracle, AR #7). This RD records the frozen contract
so the plan's tasks and reviewers can verify the port without re-deriving it from the source.
Nothing here is redesignable: props, defaults, behavior, styles, DOM output and aria wiring are
exactly as shipped in the source (AR #2).

The RD also owns the migrated stories: the source `AppLauncher` story carries the five composed
workbench samples (M365 flow, full docking stress, trigger-anchored list, drawer toolbar, German
localization) with the manual review checklist for the behavior jsdom cannot verify (AR #5,
AR #10, AR #13), and the `AppLauncherTrigger` story shows the trigger's documented variants.

---

## Functional Requirements

### Must Have (M)

- [ ] The built-in trigger is an icon-only Fluent `Button`: the resolved icon (default
      `GridDots20Regular`, overridable through `icon`) renders through the Button's icon slot;
      `label` (default `'App launcher'`) is both the `aria-label` and the tooltip text
      (`relationship="label"`); `appearance` defaults to `'subtle'`; `size` and `shape` pass
      through; all remaining native button props pass through to the button element (AR #1,
      AR #2).
- [ ] The trigger tooltip is **suppressed, never removed, while the surface is open**: the
      trigger mirrors every visibility change the tooltip requests and forces it hidden while
      `hideTooltip` is set, so the button element keeps its DOM identity and focus (AR #2).
- [ ] The forwarded ref of `AppLauncher` points at the built-in trigger button; with a
      caller-provided `trigger` the element is rendered as-is — it owns its accessible name and
      tooltip, and the ref stays attached to nothing (frozen behavior; the trigger slot's
      documented contract) (AR #2).
- [ ] A caller-provided `trigger` element replaces the built-in button and works under the same
      `PopoverTrigger` contract: it accepts and forwards injected props and a ref
      (`PopoverTrigger` renders it with `disableButtonEnhancement`, merging its own anchor ref)
      (AR #2).
- [ ] The surface is a Fluent `Popover` + `PopoverSurface` that renders the caller's children;
      the caller's `className` merges with the component's surface classes (AR #2).
- [ ] Docking: `docking` is `'default'` (surface wraps its content) or `'full'` (surface extends
      from its anchored top edge to the window bottom); every docking merges `autoSize: 'height'`
      into the positioning so the positioning layer caps the surface at the space to the window
      bottom and scrolls the content inside instead of growing the page; the default docking
      rounds all corners with `borderRadiusXLarge`, the full docking rounds only the top corners
      and stays square at the window edge (AR #2).
- [ ] The surface carries the `data-app-launcher-surface` attribute and pins its background to
      `colorNeutralBackground1` through the attribute-qualified selector — the documented
      mechanism that outweighs Fluent's own surface styles, whose stylesheet is inserted after
      this package's (AR #2).
- [ ] Positioning: the default is `{ position: 'below', align: 'start' }`; the `positioning` prop
      passes through Fluent's `PopoverProps['positioning']`, shorthands are resolved with
      `resolvePositioningShorthand` before options are merged (AR #2).
- [ ] `dockTarget` anchors the surface to an element instead of the trigger (usually the
      application bar): the ref is wrapped in a stable virtual target whose
      `getBoundingClientRect` forwards to the ref on every position computation — read lazily so
      mounting order and later layout changes stay correct; the element must stay mounted while
      the launcher is open (documented precondition) (AR #2).
- [ ] Open state: uncontrolled by default; with `open` passed, the popover is controlled and
      every requested change is forwarded through `onOpenChange` (trigger, Escape, outside
      click); the hook always mirrors the resolved open state so the trigger can hide its tooltip
      while the panel is open (AR #2).
- [ ] Public exports: `AppLauncher` and `AppLauncherTrigger` plus the types `AppLauncherProps`
      (including `AppLauncherDocking`), and `AppLauncherTriggerProps`; no internal module leaks
      (AR #11).
- [ ] Ported tests pass **unmodified**: `test/app-launcher.spec.test.tsx` (12 tests) and
      `test/app-launcher-trigger.spec.test.tsx` (2 tests) — the immutable oracle (AR #7).
- [ ] Stories: `src/components/AppLauncher/AppLauncher.stories.tsx` presents the five ported
      workbench samples as stories — Microsoft 365 flow (search, recent rows, pinned and all-app
      tiles, filtering, empty state, close-on-activation, recent recording), full docking stress
      (40 tiles, every tenth disabled, internal scrolling), trigger-anchored list, drawer toolbar
      (caller `ToolbarButton` trigger inside an `OverlayDrawer`), German localization — plus the
      manual review checklist; `src/components/AppLauncherTrigger/AppLauncherTrigger.stories.tsx`
      shows the trigger variants (default, custom icon, appearance, size/shape) (AR #5, AR #10).
- [ ] README: the `AppLauncher` and `AppLauncherTrigger` sections (description, props tables,
      composition patterns, docking notes, localization table) integrated into the existing
      package README in its format (AR #18).
- [ ] The package export-surface pin (`test/package-exports.spec.test.ts`) lists both components
      and carries type pins for the three public types (AR #12).

### Should Have

- None — the confirmed scope fits Must Have and Won't Have.

### Won't Have (Out of Scope)

- Any behavioral fix, improvement or refactor — findings become recorded findings for a possible
  follow-up feature (AR #2).
- New capability from comparable systems: arrow-key grid navigation, notification badges,
  package-managed recents/favorites, pinned-app management UI, virtualized lists, RTL sweep
  (user left the comparable-systems table at default Out).
- An SSR smoke test — the source ships none (AR #7).
- Release, versioning or source-repository work (AR #16, AR #17).

---

## Technical Requirements

### Ported file inventory (M)

| Destination (`packages/react-components/`)                       | Source (`packages/react-app-launcher/src/components/`) | Role                                                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `src/components/AppLauncher/AppLauncher.tsx`                     | `AppLauncher/AppLauncher.tsx`                          | `forwardRef` shell                                                                                                      |
| `src/components/AppLauncher/AppLauncher.types.ts`                | `AppLauncher/AppLauncher.types.ts`                     | Props contract (`label`, `icon`, `trigger`, `positioning`, `dockTarget`, `docking`, `open`, `onOpenChange`, `children`) |
| `src/components/AppLauncher/useAppLauncher.ts`                   | `AppLauncher/useAppLauncher.ts`                        | State hook (defaults, virtual dock target, open mirror)                                                                 |
| `src/components/AppLauncher/renderAppLauncher.tsx`               | `AppLauncher/renderAppLauncher.tsx`                    | Render function                                                                                                         |
| `src/components/AppLauncher/useAppLauncherStyles.styles.ts`      | `AppLauncher/useAppLauncherStyles.styles.ts`           | Griffel surface styles                                                                                                  |
| `src/components/AppLauncher/index.ts`                            | `AppLauncher/index.ts`                                 | Barrel                                                                                                                  |
| `src/components/AppLauncherTrigger/AppLauncherTrigger.tsx`       | `AppLauncherTrigger/AppLauncherTrigger.tsx`            | `forwardRef` shell                                                                                                      |
| `src/components/AppLauncherTrigger/AppLauncherTrigger.types.ts`  | `AppLauncherTrigger/AppLauncherTrigger.types.ts`       | Props contract                                                                                                          |
| `src/components/AppLauncherTrigger/useAppLauncherTrigger.ts`     | `AppLauncherTrigger/useAppLauncherTrigger.ts`          | State hook (defaults, tooltip visibility mirror)                                                                        |
| `src/components/AppLauncherTrigger/renderAppLauncherTrigger.tsx` | `AppLauncherTrigger/renderAppLauncherTrigger.tsx`      | Render function                                                                                                         |
| `src/components/AppLauncherTrigger/index.ts`                     | `AppLauncherTrigger/index.ts`                          | Barrel                                                                                                                  |

New (not ported): `src/components/AppLauncher/AppLauncher.stories.tsx`,
`src/components/AppLauncherTrigger/AppLauncherTrigger.stories.tsx`,
`test/app-launcher.spec.test.tsx`, `test/app-launcher-trigger.spec.test.tsx` (ported test
content), the extended `test/package-exports.spec.test.ts`, and the README sections.

### Frozen mechanics (M)

These implementation details are ported exactly; the plan must not redesign them (AR #2):

- **Default positioning** lives in one constant (`DEFAULT_POSITIONING = { position: 'below', align: 'start' }`) and is resolved through `resolvePositioningShorthand` so the dock target can be merged into the options object.
- **Virtual dock target**: a `useMemo`-stable object whose `getBoundingClientRect` returns `dockTarget.current?.getBoundingClientRect() ?? new DOMRect()` — the same mechanism Fluent uses for context-menu targets.
- **Tooltip visibility mirror**: the trigger keeps `tooltipVisible` state fed by the tooltip's `onVisibleChange` and passes `visible={hideTooltip ? false : tooltipVisible}` — the suppression is a prop, never an unmount.
- **`disableButtonEnhancement`** on `PopoverTrigger` so the existing button stays the trigger instead of being wrapped in a second button; the popover merges its anchor ref with the forwarded one.
- **Specificity compensation**: the surface background selector carries `&[data-app-launcher-surface]` because Fluent's stylesheet is inserted after this package's and wins at equal specificity; the full-dock variant sets `height: '100dvh'` (this is what makes the positioning layer's height clamp always apply) and overrides the two bottom radii to `'0'`.
- **Styles use tokens only** (`borderRadiusXLarge`, `colorNeutralBackground1`); the two literal radius values (`'0'`) are the documented square-edge exception.

### Scope adaptation (M)

The ported component sources contain zero package-name references (verified: relative imports
only); the scope adaptation applies to the README (this package's name and commands), the
stories (relative imports instead of `@virtuoapp/...`) and the sample copy de-branding
(AR #3, AR #9). The source repository is read-only throughout.

### Port discipline (M)

Allowed edit classes for every ported file: Prettier formatting; the closed comment-edit list —
(1) `AppLauncher.tsx` JSDoc: drop the stale "and (in later iterations) the panel behavior"
phrase; (2)-(3) `app-launcher.spec.test.tsx`: reword the two "inspected ... in the workbench"
comments to the Storybook equivalent (AR #8). No other comment, code, style or test edits are
permitted; a review rejects any file whose diff contains anything else (AR #2).

### Story port rules (M)

- Imports are relative (`../AppLauncherItem`, `./AppLauncher`, ...); no package-name imports.
- Stories do **not** wrap in `FluentProvider` — `preview.tsx` provides it for every story.
- The composed samples keep the workbench's state patterns: `useActivatingLauncher` (controlled
  open, close on activation), local sample-app data, and the six sample logos ported into the
  story file as local fixtures (self-contained, AR #10).
- De-branding: "Virtuo Resource Planning" → "Resource Planning"; the "VirtuoApp" brand text in
  the drawer sample is dropped (its Home/Settings toolbar commands stay) (AR #9).
- The manual review checklist documents the jsdom-invisible behavior: docked geometry flush
  below the bar, full-dock reach to the window bottom with internal scrolling, sticky search over
  scrolling content, tooltip suppression while open, tile hover lift above neighbors, keyboard
  flow (Tab, Enter/Space, Escape twice) (AR #13).

### Package integration (M)

- `src/index.ts` gains `export { AppLauncher }` / `export { AppLauncherTrigger }` and the three
  public types in the file's existing order and style.
- `test/package-exports.spec.test.ts` gains the two runtime names and the three type pins.
- No dependency, `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig` or Storybook
  configuration changes (AR #14).

---

## Integration Points

### With RD-02 (App launcher content blocks)

- The composed `AppLauncher` story samples render RD-02's blocks (`AppLauncherSearch`,
  `AppLauncherSection`, `AppLauncherGrid`, `AppLauncherList`, `AppLauncherItem`); the full sample
  set is complete only when both RDs are implemented, while the shell itself works with any
  caller children.
- This RD imports nothing from RD-02 in component code.

### With the existing package

- The package barrel, the export pin, the Storybook preview provider and the component folder
  pattern are the only integration surfaces; the shell follows the house anatomy exactly
  (forwardRef shell, state hook, render function, styles file, barrel).

---

## Scope Decisions

| Decision            | Options Considered                       | Chosen                                      | Rationale                                                         | AR Ref        |
| ------------------- | ---------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- | ------------- |
| Port fidelity       | Byte-identical vs port with fixes        | Byte-identical; findings recorded only      | User directive; the source suite is the validated contract        | AR #2         |
| Trigger model       | Built-in only vs built-in + caller slot  | Exactly as source: both                     | Frozen behavior; the drawer-toolbar sample depends on the slot    | AR #1, AR #2  |
| Tooltip suppression | Unmount tooltip vs visibility-controlled | Visibility-controlled (frozen)              | Keeps the button's DOM identity and focus while the panel is open | AR #2         |
| Docking model       | Keep default/full + autoSize vs simplify | Exactly as source                           | Frozen behavior; M365-style dock is the component's point         | AR #2         |
| Story content       | Port workbench samples vs write minimal  | Port all 5 samples + trigger variants       | User directive to migrate the stories                             | AR #5, AR #10 |
| Sample copy         | Neutral rewording vs placeholder brand   | Neutral (de-branded)                        | User decision (AR #9)                                             | AR #9         |
| Comment edits       | Clean 3 refs vs verbatim                 | Clean the closed 3-item list                | User decision (AR #8)                                             | AR #8         |
| Test strategy       | Port oracle + extend pin vs new tests    | Oracle unchanged; pin extended; no SSR test | Port-only directive; the pin is the repo's required artifact      | AR #7, AR #12 |
| Dependencies        | Keep vs tighten peer range               | Keep everything unchanged                   | Verified imports resolve; repo peer policy unchanged              | AR #14        |

> **Traceability:** Every scope decision references the Ambiguity Register entry that resolved
> it. See `00-ambiguity-register.md`.

---

## Security Considerations

- **Data sensitivity:** none — presentation-only components; no PII, credentials or tokens.
- **Input validation:** all content arrives through typed props and is rendered through React;
  no parsing, no HTML injection surface is added (the components render caller elements and
  text as React nodes).
- **Authentication & authorization:** N/A — no auth surface; visibility is caller-controlled.
- **Injection risks:** N/A — no dynamic HTML, no `dangerouslySetInnerHTML`, no URLs built from
  input; the port introduces no new sink.
- **Encryption needs:** N/A — no data at rest or in transit.
- **Rate limiting:** N/A — no endpoints or network calls.
- **Infrastructure:** N/A — client-side library components; no secrets, no deployment surface.

---

## Acceptance Criteria

1. [ ] `test/app-launcher.spec.test.tsx` is ported and passes **unchanged**, verifying all 12
       source behaviors: the surface stays closed until the trigger is activated; it opens with
       its content on activation; it opens when docked to a bar element; positioning reads the
       dock target (`getBoundingClientRect` called on the bar element); full docking opens;
       controlled `open` follows the prop (click reports `{ open: true }` through `onOpenChange`
       while `aria-expanded` stays `"false"`, rerendering with `open` shows the content); Escape
       closes; an outside click closes; the tooltip shows while closed; the tooltip is hidden
       while open (no `tooltip` role within the sample window); a caller trigger replaces the
       built-in button; a caller trigger opens the surface.
2. [ ] `test/app-launcher-trigger.spec.test.tsx` is ported and passes unchanged: the default
       trigger is an icon-only button whose accessible name is `'App launcher'`; a provided
       `label` becomes the accessible name.
3. [ ] The package root exports `AppLauncher` and `AppLauncherTrigger`, and the export pin lists
       them plus type pins for `AppLauncherProps`, `AppLauncherDocking` and
       `AppLauncherTriggerProps`; `Object.keys(api)` matches the full documented surface exactly.
4. [ ] Byte-identical review: a diff review of every ported file against the source shows only
       the allowed edit classes — Prettier formatting, the three closed comment edits (both
       "workbench" comments and the "later iterations" phrase), and story-side scope/de-brand
       changes; no behavioral difference exists (reviewer + auditor confirm per the plan's
       review loop).
5. [ ] `src/components/AppLauncher/AppLauncher.stories.tsx` renders the five samples
       (Microsoft 365 flow with search/recents/pinned/all apps and the empty state, full docking
       with 40 tiles and every tenth disabled, trigger-anchored list, drawer toolbar with a
       caller `ToolbarButton`, German localization) and carries the manual review checklist;
       `src/components/AppLauncherTrigger/AppLauncherTrigger.stories.tsx` shows default, custom
       icon, appearance and size/shape variants; `pnpm storybook:build` succeeds and the a11y
       addon reports no violations for any story.
6. [ ] The README gains the `AppLauncher` and `AppLauncherTrigger` sections in the repository's
       format: props tables (every prop, type, default, semantics), composition patterns
       (activation closes the panel from caller state, trigger in a toolbar, docking usage),
       the docking notes and the localization table mapping every user-facing string to its prop
       and default.
7. [ ] `pnpm verify` passes: format check, skill check, type-check, build, full test suite.
8. [ ] Security requirements verified per Security Considerations (N/A rationale): the ported
       components perform no network, storage, auth or crypto operations; no new dependency
       enters the manifest.
9. [ ] The source package and repository are unmodified (read-only port).

---

## Non-Functional Notes

- **Complexity:** S–M — one shell component and its trigger button over existing Fluent UI v9
  primitives; the port copies a validated implementation and adds stories and documentation.
- **Performance:** no measurable target beyond the repository norm — a single popover and one
  button; the dock target's `getBoundingClientRect` is read lazily by the positioning layer only.
- **Bundle:** additive only; no new dependency; imports stay within
  `@fluentui/react-components`, `@fluentui/react-icons` and React.
