# RD-02: AppBar Commands

> **Document**: RD-02-app-bar-commands.md
> **Status**: Draft
> **Created**: 2026-11-20
> **Project**: fluentui-react-components
> **Depends On**: RD-01
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

The AppBar command button is the on-brand action control that makes the bar usable: a 48px
square icon button or an icon-plus-text button with the Microsoft 365 interaction states. It is
the component applications pass as the existing `AppLauncher`'s `trigger`, and it is the only
button the bar restyles.

This requirement owns `AppBarButton` and the composed launcher story. It does not own the bar
surface, title or spacer (RD-01), and it does not change `AppLauncher`. The visual target is
exact: a 48×48 launcher with a 20px white waffle, a 12% white hover, a 22% white pressed/open
state, a white 2px inset focus ring, and a muted disabled state. The user's visual review of the
`Geometry`, `States` and `WithLauncher` stories is the acceptance gate.

## Functional Requirements

### Must Have (M)

- [ ] `AppBarButton` wraps Fluent `Button` and renders a native `<button>`. It forwards its ref to
      the rendered root and merges the caller's `className` (AR-04, AR-07).
- [ ] `AppBarButton` forces `appearance="transparent"`, `shape="square"` and `size="medium"`.
      Those three props are omitted from the public type and cannot be configured by callers.
      `as` and `href` are also omitted: bar commands are actions, and `AppBarTitle` owns
      navigation (AR-07).
- [ ] `AppBarButton` renders 48px minimum width and 48px minimum height, zero border radius, zero
      border width, 12px inline padding, a transparent resting background, the on-brand
      foreground, 14px / 20px regular text, nowrap and `flex-shrink: 0` (AR-07, AR-17).
- [ ] `AppBarButton` adds the `data-app-bar-button` attribute to its root so its own styles can
      outrank Fluent's `Button` styles without relying on `.fui-Button` implementation classes
      (AR-07, AR-13).
- [ ] The resting state shows the on-brand foreground. Hover shows the same foreground and
      `rgba(255,255,255,0.12)` background. Pressed shows the same foreground and
      `rgba(255,255,255,0.22)` background. The pressed background stays visible while the button
      has `aria-expanded="true"` (AR-17).
- [ ] The focus-visible state shows a white 2px inset ring. It must remain visible on the brand
      background and must not be hidden by Fluent's own focus shadow (AR-11, AR-17).
- [ ] Disabled and `disabledFocusable` commands use a muted on-brand treatment, have no hover
      background, and never activate. `disabledFocusable` stays focusable and keeps the white
      focus ring (AR-07, AR-11).
- [ ] Icons inherit the button's foreground in every enabled state. If Fluent's icon slot applies
      its own color, the implementation adds an attribute-qualified icon rule so the visual target
      is still met (AR-17).
- [ ] The public type requires an accessible name: when `children` is absent, `aria-label` is
      required; when children are present, the visible text is the name and `aria-label` remains
      optional (AR-07, AR-11).
- [ ] `AppBarButton` passes native button props through (`onClick`, `disabled`,
      `disabledFocusable`, `aria-*`, `type`, ...). `type` defaults to `"button"` unless the caller
      overrides it, so a bar command never submits a surrounding form (AR-07).
- [ ] `AppBarButton` works as the `AppLauncher` trigger: it forwards the props and ref that
      `PopoverTrigger` injects. The composed story opens the launcher, shows the trigger's
      `aria-expanded="true"` highlight, and docks the panel below the bar via `dockTarget`
      (AR-10, AR-17).
- [ ] The bar does not restyle arbitrary nested buttons. Only `AppBarButton` carries the on-brand
      command treatment (AR-08).
- [ ] The package root exports `AppBarButton` and `AppBarButtonProps`; no internal module leaks
      (AR-04).
- [ ] Specification tests cover rendering, accessible names, activation, disabled and
      `disabledFocusable` behavior, ref forwarding, class merging, `aria-expanded` pass-through
      and the launcher integration; type tests cover the omitted props and the required
      accessible-name union (AR-14).
- [ ] Implementation tests cover the `data-app-bar-button` attribute, class composition and the
      rendered element structure (AR-14).
- [ ] Storybook shows an `AppBarButton` gallery (icon-only, text, icon+text, disabled,
      `disabledFocusable`, open state) and the composed `AppBar` `Geometry`, `States`,
      `WithLauncher` and `TitleVariants` stories with captions naming the expected measurements
      and colors (AR-14, AR-18).
- [ ] The README documents `AppBarButton`, its props, the forced appearance, the M365 state
      table, the accessible-name rule and the launcher composition (AR-12, AR-14).
- [ ] The export-surface pin lists `AppBarButton` and `AppBarButtonProps` (AR-14).

### Should Have

- None — the confirmed scope fits Must Have and Won't Have.

### Won't Have (Out of Scope)

- A tooltip built into `AppBarButton` — callers may wrap it in Fluent `Tooltip` if they want a
  visible label in addition to the required accessible name (AR-07).
- Configurable `appearance`, `shape` or `size` — the bar has one command treatment (AR-07).
- A built-in launcher, a launcher panel redesign or `AppLauncher` changes — the application
  composes the existing launcher (AR-10).
- Implicit restyling of arbitrary buttons, `ToolbarButton`s or links in the bar (AR-08).
- Tab commands, a split button, a menu button or a toggle button variant — separate components
  if a later requirement needs them (AR-01).
- Browser screenshot tests — the visual gate is the user's review of the Storybook stories
  (AR-14, AR-18).

---

## Technical Requirements

### Public API (M)

```ts
import type { ButtonProps } from '@fluentui/react-components';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type AppBarButtonBase = Omit<
  ComponentPropsWithoutRef<'button'>,
  'children' | 'dangerouslySetInnerHTML' | 'type'
> & {
  icon?: ButtonProps['icon'];
  iconPosition?: ButtonProps['iconPosition'];
  disabledFocusable?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children?: ReactNode;
};

export type AppBarButtonProps = AppBarButtonBase &
  ({ 'aria-label': string } | { children: NonNullable<ReactNode> });
```

The `aria-label` union makes an absent-name icon-only button a type error. `NonNullable<ReactNode>`
rejects `null` and `undefined`, but TypeScript cannot reject an empty string; the documentation
states that visible text and `aria-label` must be non-empty. The omitted appearance, shape and size
props make the M365 treatment non-negotiable; `as` and `href` are omitted because this is a command
button. Native button props, including `icon`, `iconPosition`, `onClick`, `disabled`,
`disabledFocusable`, `type`, `className`, `style` and `aria-*`, pass through (AR-07).

### DOM and semantics (M)

| Property          | Value                                                                |
| ----------------- | -------------------------------------------------------------------- |
| Root              | Fluent `Button` root (`<button>`)                                    |
| Link command      | Not supported; use `AppBarTitle` for navigation                      |
| Attribute         | `data-app-bar-button`                                                |
| Default type      | `"button"` unless the caller passes `type`                           |
| Accessible name   | Non-empty visible children, or non-empty `aria-label` when icon-only |
| Disabled          | Native `disabled`; never activates                                   |
| disabledFocusable | `aria-disabled="true"`; still focusable; never activates             |
| Ref               | The root button element                                              |

### Styling (M)

| Property           | Resting                                | Hover                    | Pressed / open           | Disabled / disabledFocusable            |
| ------------------ | -------------------------------------- | ------------------------ | ------------------------ | --------------------------------------- |
| `background-color` | transparent                            | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.22)` | transparent                             |
| `color`            | `tokens.colorNeutralForegroundOnBrand` | same                     | same                     | `tokens.colorNeutralForegroundDisabled` |
| `min-width`        | `48px`                                 | `48px`                   | `48px`                   | `48px`                                  |
| `min-height`       | `48px`                                 | `48px`                   | `48px`                   | `48px`                                  |
| `padding-inline`   | `tokens.spacingHorizontalM` (12px)     | same                     | same                     | same                                    |
| `border-radius`    | `0`                                    | `0`                      | `0`                      | `0`                                     |
| `border`           | `none`                                 | `none`                   | `none`                   | `none`                                  |
| `font-size`        | `tokens.fontSizeBase300` (14px)        | same                     | same                     | same                                    |
| `line-height`      | unitless `1.4286` (20px at 14px)       | same                     | same                     | same                                    |
| `font-weight`      | `tokens.fontWeightRegular`             | same                     | same                     | same                                    |
| `cursor`           | default                                | pointer                  | pointer                  | Fluent disabled cursor                  |

The hover, pressed and open selectors exclude `:disabled` and `[aria-disabled="true"]` so a
disabled command never shows interaction feedback. The open state is expressed with a
higher-specificity hover-plus-open rule so it stays at 22% when the pointer remains over the
trigger after opening; `PopoverTrigger` injects `aria-expanded` into the custom trigger, so no
state hook is needed (AR-17). The pressed rule also covers `:active:focus-visible` for keyboard
activation.

The white overlays are the only color literals. They are documented in the styles file because no
Fluent token represents a translucent white overlay on a brand surface; the values come from the
reviewed launcher workaround at
`packages/react-components/src/components/AppLauncher/stories/AppLauncherStoryApps.story.tsx:245-260`
(AR-13, AR-17). White 14px regular text on the overlays measures 4.29:1 on hover and 3.58:1 on
pressed/open; icon-only commands meet the 3:1 non-text threshold. The user accepted the M365
overlays with a documented text-command contrast exception; the README and the `States` story
state it.

Griffel does not support the `borderWidth`/`borderColor` shorthands; the implementation uses the
supported `border: 'none'` and `borderRadius: 0` longhand reset. This is what removes Fluent's
resting and focus border (AR-07, AR-13).

### Selector strategy (M)

All component rules are qualified with `[data-app-bar-button]`, for example
`&[data-app-bar-button]:hover`. This gives the rule enough specificity to beat Fluent's
`.fui-Button:hover` and `.fui-Button[data-fui-focus-visible]` without depending on Fluent's
implementation class names. The focus rule uses
`&[data-app-bar-button][data-fui-focus-visible]` and sets a white inset box shadow plus the
transparent outline Fluent expects (AR-07, AR-13).

### Launcher composition (M)

```tsx
const barRef = useRef<HTMLElement>(null);

<AppBar ref={barRef}>
  <AppLauncher
    trigger={<AppBarButton aria-label="App launcher" icon={<GridDots20Regular />} />}
    dockTarget={barRef}
  >
    {/* existing launcher content */}
  </AppLauncher>
  <AppBarTitle>Contoso</AppBarTitle>
  <AppBarSpacer />
  <AppBarButton aria-label="Settings" icon={<Settings20Regular />} />
</AppBar>;
```

No `AppLauncher` source or documentation changes. The bar's forwarded ref is the dock target; the
button is the trigger; the launcher owns its panel, open state and accessibility (AR-10).

### Stories and visual acceptance (M)

`src/components/AppBarButton/stories/AppBarButton.stories.tsx` shows icon-only, text,
icon-plus-text, disabled, `disabledFocusable` and open (`aria-expanded="true"`) commands on a
brand surface. The caption lists the 48px target, 12% hover, 22% pressed/open, white focus and
muted disabled targets.

`src/components/AppBar/stories/AppBar.stories.tsx` adds:

| Story           | What it proves                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Geometry`      | 48px bar, zero bar padding, 48×48 launcher flush leading, 8px title inset, 48px trailing command flush trailing; dashed outlines and a ruler |
| `States`        | Enabled icon, enabled text, disabled icon, `disabledFocusable` icon; hover, press and focus are exercised by the reviewer                    |
| `WithLauncher`  | The real `AppLauncher` opens from the `AppBarButton` trigger, the trigger keeps the 22% open highlight, the panel docks below the bar        |
| `TitleVariants` | Plain, heading, link and long/truncated titles in a normal and a narrow bar                                                                  |

The user reviews `Geometry`, `States` and `WithLauncher` and approves or requests corrections.
The feature is not done until the user approves (AR-18).

### Security (M)

`AppBarButton` renders React children and forwards native props to Fluent `Button`. It does not
use `dangerouslySetInnerHTML`, evaluate HTML, fetch data, read storage or handle credentials. The
launcher it triggers is the existing, reviewed `AppLauncher`. No security infrastructure is
required (AR-10, AR-13).

### Documentation (M)

The README adds an `AppBarButton` section with the props table, the forced appearance, the state
table, the accessible-name rule and the launcher composition. The composed AppBar example becomes
the canonical launcher-in-a-bar example (AR-12, AR-14).

---

## Integration Points

### With RD-01 (AppBar shell)

`AppBarButton` depends on the bar's 48px surface and zero padding for its flush placement. The
bar does not require the button; the full M365 look appears when they are composed (AR-01,
AR-15).

### With the existing `AppLauncher`

The launcher's `trigger` prop accepts any element that forwards props and refs.
`PopoverTrigger` injects `aria-expanded`, `onClick` and its anchor ref; `AppBarButton` forwards
all of them. The launcher's `dockTarget` receives the `AppBar` ref. No launcher changes
(AR-10).

### With the package export surface

`AppBarButton` and `AppBarButtonProps` are added to `src/index.ts` and the export pin. The state
hook, classes type and render function stay internal (AR-04).

---

## Scope Decisions

| Decision             | Options Considered                                                                 | Chosen | Rationale                                                                                                | AR Ref |
| -------------------- | ---------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- | ------ |
| Command component    | A: dedicated `AppBarButton`; B: implicit descendant styling; C: no command styling | A      | Explicit, typed and testable; avoids fui9's undocumented data-attribute contract.                        | AR-08  |
| Forced visual props  | A: force transparent/square/medium; B: allow caller choice; C: style descendants   | A      | One consistent M365 command treatment; a caller needing another treatment uses Fluent `Button` directly. | AR-07  |
| Sizing               | A: 48px targets, 12px text padding; B: Fluent default; C: size variants            | A      | M365 uses 48×48 bar commands; the 48px target also meets touch guidance.                                 | AR-17  |
| Hover/pressed colors | A: 12%/22% white overlays; B: Fluent brand-token shades; C: Fluent defaults        | A      | Matches M365 and the reviewed launcher workaround; brand-token shades vanish on custom brand colors.     | AR-17  |
| Focus                | A: white 2px inset ring; B: Fluent neutral focus; C: no custom focus               | A      | Visible on brand and not clipped by the button's overflow; meets the accessibility contract.             | AR-11  |
| Disabled             | A: muted on-brand, no hover; B: Fluent disabled; C: hide disabled commands         | A      | Keeps the command discoverable and matches the M365 muted look; `disabledFocusable` stays reachable.     | AR-07  |
| Accessible-name rule | A: require `aria-label` when no children; B: document only; C: runtime warning     | A      | Makes an unnamed icon-only button a compile-time error.                                                  | AR-07  |
| Launcher integration | A: compose with `dockTarget` + trigger; B: modify `AppLauncher`                    | A      | The launcher is complete; the bar only supplies the trigger styling and the dock ref.                    | AR-10  |
| Visual acceptance    | A: user reviews Geometry/States/WithLauncher; B: no gate; C: screenshot tests      | A      | The user's stated acceptance criteria are visual; the stories are the right surface.                     | AR-18  |

---

## Security Considerations

- **Data sensitivity**: N/A — display-only command button; no stored data.
- **Input validation**: N/A — no network or form input; React escapes children.
- **Authentication & authorization**: N/A — the component does not decide who may see a command;
  the application renders only permitted commands.
- **Injection risks**: N/A — no `dangerouslySetInnerHTML`, HTML evaluation, SQL, shell or file
  operations.
- **Encryption needs**: N/A — no data at rest or in transit.
- **Rate limiting**: N/A — no endpoints or requests.
- **Infrastructure**: N/A — no containers, secrets, network exposure or CI change.

---

## Acceptance Criteria

1. [ ] `<AppBarButton aria-label="Settings" icon={<Settings20Regular />} />` renders a `button`
       with `data-app-bar-button`, `type="button"`, the accessible name `"Settings"`, a 48px
       minimum width and height, zero border radius, no border and 12px inline padding.
2. [ ] `<AppBarButton onClick={fn}>Settings</AppBarButton>` renders the visible text, uses it as
       the accessible name and calls `fn` once per click.
3. [ ] An icon-only `AppBarButton` without `aria-label` is a TypeScript error; passing
       `appearance`, `shape`, `size`, `as` or `href` is a TypeScript error. `children={null}` and
       `children={undefined}` are type errors; empty strings are documented as invalid.
4. [ ] The ref points at the rendered button; a caller `className` is present alongside the
       component class; native `id`, `aria-*` and event props pass through.
5. [ ] `disabled` renders a native disabled button that does not fire `onClick`.
       `disabledFocusable` renders `aria-disabled="true"`, remains focusable and does not fire
       `onClick`.
6. [ ] Hover shows `rgba(255,255,255,0.12)`; press and `aria-expanded="true"` show
       `rgba(255,255,255,0.22)`, including when the pointer remains over an open trigger and
       when keyboard activation enters `:active:focus-visible`; the icon and text stay
       `colorNeutralForegroundOnBrand`; the focus-visible state shows a white 2px inset ring with
       no dark Fluent border; disabled commands show no hover background and the muted disabled
       foreground. Text commands carry the documented M365 contrast exception; icon-only commands
       meet the 3:1 non-text threshold.
7. [ ] The composed `WithLauncher` story opens the existing `AppLauncher` from the `AppBarButton`
       trigger, the trigger has `aria-expanded="true"` while open, and the panel docks below the
       bar.
8. [ ] The `Geometry` story shows a 48px bar, zero bar padding, a 48×48 launcher flush leading,
       an 8px title inset and a 48px trailing command flush trailing; the `States` story shows
       enabled, disabled and `disabledFocusable` commands and the reviewer can exercise hover,
       press and focus.
9. [ ] The user approves the `Geometry`, `States` and `WithLauncher` stories, or the corrections
       are applied and the stories are re-reviewed.
10. [ ] `AppBarButton` and `AppBarButtonProps` are exported from the package root and listed in
        the export pin; `pnpm verify` and `pnpm storybook:build` pass.
11. [ ] The README documents the props, forced appearance, state table, accessible-name rule and
        launcher composition.
12. [ ] No `AppLauncher` source or documentation is changed.
13. [ ] Security requirements verified as N/A with the reasons above.
