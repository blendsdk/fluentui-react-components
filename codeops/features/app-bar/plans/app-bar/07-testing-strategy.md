# Testing Strategy: AppBar

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type                          | Target                                  |
| ---------------------------------- | --------------------------------------- |
| Public component behavior          | 100% of the ST cases below              |
| Internal state / class composition | Covered by impl tests                   |
| Visual states and geometry         | Storybook review; no screenshot harness |

- Test names state behavior: `should [expected behavior] when [condition]`.
- Integration is covered by the launcher-trigger case ST-25.
- End-to-end: **N/A** — the components are pure client-side markup; the existing Vitest/jsdom
  suite and the Storybook visual review are the right surfaces. No new browser harness is
  created (AR-14).

<a id="specification-test-cases"></a>

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

These cases are derived from RD-01, RD-02, the four component specs and the ambiguity register.
They are the immutable oracle: if an implementation does not match a case, the implementation is
wrong, never the test.

### AppBar

| #    | Input / Scenario                                                                             | Expected Output / Behavior                                                                     | Source                                |
| ---- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------- |
| ST-1 | Render `<AppBar><span>Content</span></AppBar>`                                               | A `header` element with the banner role contains `Content`.                                    | RD-01 AC1                             |
| ST-2 | Render `<AppBar aria-label="Application">…</AppBar>`                                         | The banner's accessible name is `Application`.                                                 | RD-01 AC1                             |
| ST-3 | Pass a `RefObject<HTMLElement>` and render                                                   | `ref.current` is the `header` element.                                                         | RD-01 AC1                             |
| ST-4 | Render with `id="app-bar"`, `className="custom"` and `style={{ minHeight: '64px' }}`         | The header has `id="app-bar"`, the caller class is present, and the style reaches the element. | RD-01 §Functional Requirements, AR-11 |
| ST-5 | Render `<AppBar><button type="button">Command</button></AppBar>` and click the child         | The child button has no `data-app-bar-button` attribute and its click handler fires.           | RD-01 AC8, AR-08                      |
| ST-6 | Render `<AppBar><AppBarTitle>Contoso</AppBarTitle><AppBarSpacer /><span>End</span></AppBar>` | The title, spacer and end marker appear in that order inside the banner.                       | RD-01 §Functional Requirements        |

### AppBarTitle

| #     | Input / Scenario                                                   | Expected Output / Behavior                                                                                                                                                                                                                           | Source                                              |
| ----- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| ST-7  | Render `<AppBarTitle>Contoso</AppBarTitle>`                        | The root is a `span` whose text and accessible name are `Contoso`.                                                                                                                                                                                   | RD-01 AC4                                           |
| ST-8  | Render with `headingLevel={1}` and separately `headingLevel={3}`   | The roots are `h1` and `h3`; the text is `Contoso`.                                                                                                                                                                                                  | RD-01 AC4                                           |
| ST-9  | Render `href="/home" target="_blank" rel="noreferrer"`             | The root is an `a` with those exact attributes; the text is `Contoso`.                                                                                                                                                                               | RD-01 AC4                                           |
| ST-10 | Attach a ref in span, heading and link modes                       | The ref points at the `span`, the `h1` and the `a` respectively.                                                                                                                                                                                     | RD-01 §Functional Requirements (AppBarTitle), AR-06 |
| ST-11 | Render with `className="custom"` and `id="title"`                  | The root has the caller class, the component class and `id="title"`.                                                                                                                                                                                 | RD-01 §Functional Requirements (AppBarTitle)        |
| ST-12 | Render a 200-character title                                       | The root's `textContent` is the full 200-character string; computed `white-space`, `overflow` and `text-overflow` are `nowrap`, `hidden` and `ellipsis`. The visual ellipsis is checked in `TitleVariants`; the Griffel class check is an impl test. | RD-01 AC5, PF-012                                   |
| ST-13 | TypeScript: `headingLevel={1} href="/home"` and `headingLevel={7}` | Both are type errors.                                                                                                                                                                                                                                | RD-01 AC6, AR-02                                    |

### AppBarSpacer

| #     | Input / Scenario                                          | Expected Output / Behavior                                                   | Source    |
| ----- | --------------------------------------------------------- | ---------------------------------------------------------------------------- | --------- |
| ST-14 | Render `<AppBarSpacer />`                                 | The root is an empty `div` with no text, no accessible name and no tab stop. | RD-01 AC7 |
| ST-15 | Attach a ref and pass `className="custom"` and `id="gap"` | The ref points at the div; the class and id are present.                     | RD-01 AC7 |

### AppBarButton

| #     | Input / Scenario                                                                                                                                   | Expected Output / Behavior                                                                                                                                             | Source                   |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| ST-16 | Render `<AppBarButton>Settings</AppBarButton>`                                                                                                     | The root is a `button` with `data-app-bar-button`, `type="button"`, the text `Settings` and the accessible name `Settings`.                                            | RD-02 AC1, AC2           |
| ST-17 | Render `<AppBarButton aria-label="Settings" icon={<Settings20Regular />} />`                                                                       | The accessible name is `Settings`; the button contains an `svg`.                                                                                                       | RD-02 AC1                |
| ST-18 | Render with an `onClick` spy and click                                                                                                             | The spy is called exactly once.                                                                                                                                        | RD-02 AC2                |
| ST-19 | Attach a `RefObject<HTMLButtonElement>`                                                                                                            | `ref.current` is the rendered `button`.                                                                                                                                | RD-02 AC4                |
| ST-20 | Render with `className="custom"`                                                                                                                   | The button has both the component class and `custom`.                                                                                                                  | RD-02 AC4                |
| ST-21 | Render `disabled` and click                                                                                                                        | The button is disabled; the click handler is not called.                                                                                                               | RD-02 AC5                |
| ST-22 | Render `disabledFocusable`, focus it and click                                                                                                     | The button has `aria-disabled="true"` and is not natively disabled; it receives focus; the click handler is not called.                                                | RD-02 AC5                |
| ST-23 | Render `aria-expanded="true"`                                                                                                                      | The button exposes `aria-expanded="true"`.                                                                                                                             | RD-02 AC6                |
| ST-24 | Render `type="submit"` and separately omit `type`                                                                                                  | The explicit `submit` passes through; the omitted case renders `type="button"`.                                                                                        | RD-02 AC1                |
| ST-25 | Compose `AppBar` + `AppLauncher` with `trigger={<AppBarButton aria-label="App launcher" icon={…} />}` and `dockTarget={barRef}`; click the trigger | The launcher panel content appears and the trigger has `aria-expanded="true"`. The “no AppLauncher change” claim is checked by a final diff review, not this DOM test. | RD-02 AC7, AR-10, PF-012 |
| ST-26 | TypeScript: icon-only without `aria-label`; any `appearance`, `shape`, `size`, `as` or `href`; `children={null}`                                   | All are type errors.                                                                                                                                                   | RD-02 AC3, AR-07         |

## Test Categories

### Specification Tests

| Test File                            | ST Cases       | Component      |
| ------------------------------------ | -------------- | -------------- |
| `test/app-bar.spec.test.tsx`         | ST-1 .. ST-6   | `AppBar`       |
| `test/app-bar-title.spec.test.tsx`   | ST-7 .. ST-12  | `AppBarTitle`  |
| `test/app-bar-title.types.test.tsx`  | ST-13          | `AppBarTitle`  |
| `test/app-bar-spacer.spec.test.tsx`  | ST-14 .. ST-15 | `AppBarSpacer` |
| `test/app-bar-button.spec.test.tsx`  | ST-16 .. ST-25 | `AppBarButton` |
| `test/app-bar-button.types.test.tsx` | ST-26          | `AppBarButton` |

The spec tests are written before the implementation and run red first. The spec files use the
real Fluent components, a `FluentProvider` wrapper with `webLightTheme`, and real icons; no
component is mocked.

### Implementation Tests

| Test File                           | Description                                                                                        | Priority |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| `test/app-bar.impl.test.tsx`        | Root class composition, ref identity, element structure, no implicit command attribute on children | High     |
| `test/app-bar-button.impl.test.tsx` | `data-app-bar-button` presence, class merge, default type, rendered root structure                 | High     |

### Integration Tests

| Test  | Components                              | Description                                                            |
| ----- | --------------------------------------- | ---------------------------------------------------------------------- |
| ST-25 | `AppBar`, `AppBarButton`, `AppLauncher` | The button is a working launcher trigger and receives `aria-expanded`. |

### End-to-End Tests

| Scenario | Steps | Expected Result                                                                                     |
| -------- | ----- | --------------------------------------------------------------------------------------------------- |
| N/A      | —     | The components have no routing, data or network flow. The visual contract is reviewed in Storybook. |

## Test Data

### Fixtures Needed

- A `FluentProvider` wrapper with `webLightTheme`, matching the existing launcher and
  collapsible-section specs.
- `Settings20Regular` and `GridDots20Regular` from `@fluentui/react-icons` for the button cases.
- A `RefObject<HTMLElement>` and `RefObject<HTMLButtonElement>` for the ref cases.

### Mock Requirements

None. The tests use the real Fluent `Button`, `Popover`, and `AppLauncher`; only the caller's
`onClick` is a spy.

## Verification Commands

| Purpose            | Command                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Focused spec file  | `pnpm --filter @blendsdk/fluentui-react-components exec vitest run test/app-bar.spec.test.tsx --reporter=verbose` |
| Focused type check | `pnpm --filter @blendsdk/fluentui-react-components type-check`                                                    |
| Full verification  | `pnpm verify`                                                                                                     |
| Storybook build    | `pnpm storybook:build`                                                                                            |

The repository has no `codeops/test-map.json`; the phase-level full verify is always `pnpm verify`
and the visual build check is always `pnpm storybook:build` (AR-14).

## Story Matrix

| Story                                         | Required scenarios                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `AppBar / Default`                            | Brand bar with title, spacer and a plain command; the shell baseline.                                                                  |
| `AppBar / Geometry`                           | 48px bar, zero bar padding, 48×48 launcher, 8px title inset, flush trailing command; dashed outlines and a ruler; a narrow title case. |
| `AppBar / States`                             | Enabled icon, enabled text, disabled icon, `disabledFocusable`; pointer hover, pointer press, keyboard press, focus.                   |
| `AppBar / WithLauncher`                       | Real `AppLauncher` with the `AppBarButton` trigger; open highlight; docked panel; Escape/outside close.                                |
| `AppBar / TitleVariants`                      | Plain, heading, link, long/truncated; normal and narrow bars.                                                                          |
| `AppBarButton / Gallery`                      | Icon-only, text, icon+text, disabled, `disabledFocusable`, forced open (`aria-expanded="true"`).                                       |
| `AppBarTitle / Plain / Heading / Link / Long` | Title roots and truncation; link hover and focus.                                                                                      |
| `AppBarSpacer / Alignment`                    | Leading title, spacer, trailing command.                                                                                               |

## Manual Browser Checklist

The reviewer runs these in Storybook after the build:

1. `Geometry`: the bar is exactly 48px at normal text; there is no horizontal bar padding; the
   48×48 launcher is flush leading; the title starts 8px after the launcher; the trailing 48px
   command is flush; dashed outlines and the ruler confirm the measurements.
2. `Geometry` / `TitleVariants`: at 200% text-only zoom the title and command text do not clip
   vertically; the bar grows if the content exceeds 48px.
3. `States`: hover a command — 12% white; pointer press — 22% white; keyboard Space/Enter — 22%
   white; focus — white 2px inset ring with no dark Fluent border; disabled — muted, no hover;
   `disabledFocusable` — muted, focus ring visible, still focusable.
4. `WithLauncher`: open the launcher and leave the pointer over the waffle — the 22% open
   highlight stays; the panel docks below the bar; Escape and outside click close it.
5. `TitleVariants`: the title is 14px semibold; a long title ellipsizes in the narrow bar; the
   link underlines on hover and shows a focus ring.
6. RTL: set `dir="rtl"` on a wrapper — the launcher is flush leading on the right, the title inset
   mirrors, and the spacer still pushes the trailing command to the left.
7. Forced colors: emulate forced-colors — the focus ring and command states remain visible; add a
   forced-colors fallback only if the white ring disappears.
8. Accessibility addon: no violations for every AppBar story.

## Verification Checklist

- [ ] All ST cases are defined with concrete input/output pairs.
- [ ] Every ST case traces to an RD, spec or AR entry.
- [ ] ST-13 and ST-26 are type tests; the rest are behavioral spec tests.
- [ ] Spec and type tests are written before implementation.
- [ ] Spec and type tests are verified red before implementation.
- [ ] Spec and type tests pass after implementation.
- [ ] Implementation tests cover class composition, refs and attributes.
- [ ] All existing tests still pass.
- [ ] `pnpm verify` and `pnpm storybook:build` pass.
- [ ] The final diff review confirms no `AppLauncher` source or documentation change.
- [ ] The a11y addon reports no violations.
- [ ] The user approves the shell stories, then the `Geometry`, `States` and `WithLauncher` stories.
