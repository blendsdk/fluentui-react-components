# RD-01: AppBar Shell

> **Document**: RD-01-app-bar-shell.md
> **Status**: Draft
> **Created**: 2026-11-20
> **Project**: fluentui-react-components
> **Depends On**: —
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

The AppBar shell is the brand-colored application header: a semantic `<header>` that hosts the
launcher, the product name and global commands. It replaces the hand-written `<header>` and the
hand-styled brand trigger that applications currently repeat, and it provides the layout contract
the command button in RD-02 fills.

This requirement owns `AppBar`, `AppBarTitle` and `AppBarSpacer`. It does **not** own the command
button or the launcher; those are RD-02. The visual target is the Microsoft 365 application bar:
48px tall, a 48×48 launcher flush with the leading edge, a 14px semibold title inset by 8px, and
48px trailing commands flush with the trailing edge.

## Functional Requirements

### Must Have (M)

- [ ] `AppBar` renders a native `<header>` element and therefore exposes the banner landmark when
      mounted at the top level of the application. It forwards its ref to that element and merges
      the caller's `className` with its own classes (AR-04, AR-11).
- [ ] `AppBar` passes all native header props through (`id`, `aria-label`, `aria-*`, `style`,
      event handlers, ...). It owns only `children` and the class names (AR-11, AR-13).
- [ ] `AppBar` renders a single flex row with `align-items: center`, `flex-wrap: nowrap`,
      `box-sizing: border-box`, `width: 100%`, `min-height: 48px`, `flex-shrink: 0`, zero padding
      and zero gap. The 48px minimum is the documented bar height; no Fluent token represents it
      (AR-05, AR-13).
- [ ] `AppBar` paints `tokens.colorBrandBackground` and sets
      `tokens.colorNeutralForegroundOnBrand` as the inherited foreground. It does not set a border,
      border radius or shadow (AR-03, AR-13).
- [ ] `AppBar` does **not** use `overflow: hidden`, so focus rings and popovers are not clipped.
      The title truncates itself instead (AR-05, AR-11).
- [ ] `AppBarTitle` renders a `<span>` by default, an `<h1>`–`<h6>` when `headingLevel` is set, or
      an `<a>` when `href` is set. `headingLevel` and `href` are mutually exclusive at the type
      level; no combination is accepted (AR-02, AR-06).
- [ ] `AppBarTitle` uses 14px / 20px at normal text (unitless `1.4286`, so the line box scales at
      text zoom), semibold weight, the inherited on-brand foreground, zero block margins, 8px
      inline margins, single-line nowrap, hidden horizontal overflow and an ellipsis. The full
      text remains in the DOM when the visual text truncates (AR-06, AR-11).
- [ ] `AppBarTitle` headings reset the browser's default block margins. The link variant has no
      underline at rest, an underline on hover, and a white 2px focus-visible outline with a 2px
      offset (AR-06, AR-13).
- [ ] `AppBarTitle` forwards its ref to the rendered root (`span`, heading or anchor) and merges
      the caller's `className` (AR-04, AR-06).
- [ ] `AppBarSpacer` renders an empty `<div>` that grows and shrinks in the bar's flex row, with
      `flex-grow: 1`, `flex-shrink: 1`, `flex-basis: auto`, `min-width: 0` and
      `align-self: stretch`. It has no children and no accessible content (AR-04, AR-05).
- [ ] `AppBarSpacer` forwards its ref and passes native div props through, merging `className`
      (AR-04).
- [ ] All three components use logical inline properties (`margin-inline-start`,
      `margin-inline-end`) so the bar mirrors correctly in RTL (AR-11).
- [ ] The package root exports `AppBar`, `AppBarTitle`, `AppBarSpacer` and their props types; no
      internal module leaks (AR-04).
- [ ] Specification tests exist for every behavior above and pass unmodified; implementation
      tests cover class composition, ref forwarding and element structure (AR-14).
- [ ] Storybook stories show the shell at the M365 geometry, with dashed measurement outlines in
      a dedicated `Geometry` story, plus the title variants and the spacer alignment (AR-14,
      AR-18).
- [ ] The package README documents the three components, their props, the bar geometry, the
      title semantics, the spacer, the responsive/truncation behavior and the localization model
      (AR-12, AR-14).
- [ ] The export-surface pin (`test/package-exports.spec.test.ts`) lists the three components and
      their public props types (AR-14).

### Should Have

- None — the confirmed scope fits Must Have and Won't Have.

### Won't Have (Out of Scope)

- A tab strip, tab panels or the fui9 drawer-based tab system — a separate navigation feature
  (AR-01).
- Sticky positioning, an overflow command menu, responsive command collapsing, a neutral
  appearance, a custom height prop or a `size` variant — the caller may set `position` or hide
  commands; the bar keeps one brand surface (AR-03, AR-09).
- Built-in English strings, a skip link, a `main` landmark or a full application shell — the
  application owns the shell and localization (AR-11, AR-12).
- `AppLauncher` changes — the launcher is composed by the application (AR-10).
- Browser, performance or SSR test suites — the shell is pure markup; the visual contract is
  checked in Storybook (AR-14).

---

## Technical Requirements

### Public API (M)

`AppBar` extends the native header element and owns only its children:

```ts
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type AppBarProps = Omit<
  ComponentPropsWithoutRef<'header'>,
  'children' | 'dangerouslySetInnerHTML'
> & {
  /** Bar content: launcher, title, spacer and commands. */
  children: ReactNode;
};
```

`AppBarTitle` is a union: a text root (span or heading) or a link root. The union makes the
heading/link combination unrepresentable:

```ts
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type AppBarTitleTextProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'children' | 'dangerouslySetInnerHTML'
> & {
  /** The visible product or application name. */
  children: ReactNode;
  /** Renders h1–h6 instead of a span when set. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  href?: never;
  target?: never;
  rel?: never;
};

type AppBarTitleLinkProps = Omit<
  ComponentPropsWithoutRef<'a'>,
  'children' | 'dangerouslySetInnerHTML' | 'href'
> & {
  /** The visible product or application name. */
  children: ReactNode;
  /** Renders an anchor instead of a span. */
  href: string;
  headingLevel?: never;
};

export type AppBarTitleProps = AppBarTitleTextProps | AppBarTitleLinkProps;
```

`AppBarSpacer` is an empty layout element:

```ts
import type { ComponentPropsWithoutRef } from 'react';

export type AppBarSpacerProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'dangerouslySetInnerHTML'
>;
```

Every prop is documented with JSDoc in the implementation. The props type is the contract; the
defaults live in the state hook and are repeated in the props documentation (AR-04).

### DOM and semantics (M)

| Component      | Root element                     | Ref target        | Accessible name                |
| -------------- | -------------------------------- | ----------------- | ------------------------------ |
| `AppBar`       | `<header>`                       | `HTMLElement`     | Caller `aria-label` (optional) |
| `AppBarTitle`  | `<span>`, `<h1>`–`<h6>` or `<a>` | The rendered root | Its text content               |
| `AppBarSpacer` | `<div>`                          | `HTMLDivElement`  | None — empty and not focusable |

`AppBar` must be mounted at the top level of the application page to expose the banner landmark.
A `<header>` nested inside `article`, `aside`, `main`, `nav` or `section` is not a banner; the
component does not force `role="banner"` because that would create multiple banners when nested
(AR-11).

### Layout and styling (M)

`AppBar` root:

| Property            | Value                                  |
| ------------------- | -------------------------------------- |
| `display`           | `flex`                                 |
| `flex-direction`    | `row`                                  |
| `align-items`       | `center`                               |
| `flex-wrap`         | `nowrap`                               |
| `box-sizing`        | `border-box`                           |
| `width`             | `100%`                                 |
| `min-height`        | `48px` (documented literal)            |
| `flex-shrink`       | `0`                                    |
| `padding`           | `0`                                    |
| `gap`               | `0`                                    |
| `background-color`  | `tokens.colorBrandBackground`          |
| `color`             | `tokens.colorNeutralForegroundOnBrand` |
| `border` / `shadow` | none                                   |
| `overflow`          | visible (default)                      |

`AppBarTitle` root:

| Property             | Value                                                 |
| -------------------- | ----------------------------------------------------- |
| `font-size`          | `tokens.fontSizeBase300` (14px)                       |
| `line-height`        | unitless `1.4286` (20px at 14px; scales at text zoom) |
| `font-weight`        | `tokens.fontWeightSemibold` (600)                     |
| `color`              | inherited on-brand foreground                         |
| `margin-block`       | `0`                                                   |
| `margin-inline`      | `tokens.spacingHorizontalS` (8px) on both sides       |
| `display`            | `block`                                               |
| `min-width`          | `0`                                                   |
| `white-space`        | `nowrap`                                              |
| `overflow`           | `hidden`                                              |
| `text-overflow`      | `ellipsis`                                            |
| Link text decoration | none at rest; underline on `:hover`                   |
| Link focus           | 2px white outline, 2px offset, on `:focus-visible`    |

`AppBarSpacer` root:

| Property      | Value     |
| ------------- | --------- |
| `flex-grow`   | `1`       |
| `flex-shrink` | `1`       |
| `flex-basis`  | `auto`    |
| `min-width`   | `0`       |
| `align-self`  | `stretch` |

The bar's zero padding is deliberate: the 48×48 launcher sits flush with the leading edge and a
trailing 48px icon command sits flush with the trailing edge, matching M365. `AppBarTitle`'s 8px
inline margin provides the inset after the launcher (AR-05).

### Responsive and text-zoom behavior (M)

- The title is the only shrinking element. At narrow widths it ellipsizes; the full text remains
  in the DOM and is the accessible name (AR-06, AR-11).
- The bar uses `min-height: 48px` instead of a fixed height. At normal text it is exactly 48px;
  at text zoom it grows with its content instead of clipping (AR-05, AR-11).
- The component does not hide, collapse or move commands at narrow widths. The application owns
  the command set and may hide commands with its own media strategy (AR-09).

### Localization (M)

The package ships no strings. Every visible text and every accessible name comes from the
caller's children or native `aria-label`. The title's text is caller content; the bar's
`aria-label` is optional and caller-owned (AR-12).

### Security (M)

`AppBar`, `AppBarTitle` and `AppBarSpacer` render React children only. They do not use
`dangerouslySetInnerHTML`, do not evaluate HTML, do not fetch data and do not read cookies or
storage. React escapes text children. No security infrastructure is required (AR-13, AR-14).

### Documentation and stories (M)

- Storybook: `src/components/AppBar/stories/AppBar.stories.tsx` includes a `Default` shell, a
  `Geometry` story with dashed outlines and a caption listing the 48px height, zero bar padding,
  48px launcher slot, 8px title inset and flush trailing command, and the narrow/truncation case.
  `src/components/AppBarTitle/stories/AppBarTitle.stories.tsx` shows plain, heading, link and
  long-title variants. `src/components/AppBarSpacer/stories/AppBarSpacer.stories.tsx` shows
  leading/trailing alignment.
- README: add `AppBar`, `AppBarTitle` and `AppBarSpacer` sections with descriptions, props
  tables, the geometry table, title semantics and composition notes (AR-14).
- JSDoc: every public component and prop, plus the non-obvious layout and accessibility
  decisions (AR-14).

---

## Integration Points

### With RD-02 (AppBar commands)

RD-01 defines the bar surface and the title/spacer. RD-02 adds `AppBarButton` and the composed
launcher story. The bar is complete without RD-02, but the full M365 visual contract is only
visible when the command button and the launcher are composed (AR-01, AR-15).

### With the existing `AppLauncher`

The `AppBar` ref is the element the application passes as `AppLauncher`'s `dockTarget`. The
launcher itself is unchanged (AR-10). RD-02's story proves the composition.

### With the package export surface

The three components and their props types are added to `src/index.ts` and to
`test/package-exports.spec.test.ts`. No internal state hook, classes type or render function is
exported (AR-04).

---

## Scope Decisions

| Decision          | Options Considered                                                                                           | Chosen | Rationale                                                                                                                  | AR Ref |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------- | ------ |
| Shell scope       | A: bar + title + spacer + button; B: bar + title + spacer only; C: add tabs                                  | A      | The command button is the visual gap the user called out; tabs are a separate navigation concern.                          | AR-01  |
| Title semantics   | A: span default, optional heading/link; B: forced h1 + url; C: presentation-only                             | A      | Avoids the fui9 heading-hierarchy defect while keeping heading and link use cases.                                         | AR-02  |
| Bar layout        | A: 48px min-height, zero padding, zero gap; B: fixed 48px with padding; C: props                             | A      | Matches M365 geometry and lets text zoom grow the bar.                                                                     | AR-05  |
| Title typography  | A: 14px/20px semibold, 8px inset, truncation; B: 16px/500; C: caller styles                                  | A      | Matches the M365 title and keeps the bar single-line.                                                                      | AR-06  |
| Styling source    | A: tokens; B: hardcoded colors; C: CSS variables                                                             | A      | Theme changes propagate; the 48px height and white overlays are documented exceptions.                                     | AR-13  |
| Accessibility     | A: banner, optional name/heading, 48px targets, visible focus, text-zoom growth; B: fixed height; C: minimal | A      | Meets the web-application lens without adding a shell or global behavior.                                                  | AR-11  |
| Package structure | A: four folders and barrels; B: one family folder; C: one file                                               | A      | Follows the established component anatomy and keeps internals private.                                                     | AR-04  |
| Verification      | A: four spec files, impl tests, export pin, stories, README, no browser/SSR; B: fewer; C: browser suite      | A      | The shell is pure markup; Storybook is the right visual surface; the button and launcher integration are covered in RD-02. | AR-14  |

---

## Security Considerations

- **Data sensitivity**: N/A — the components render caller-provided display content; they store
  no data.
- **Input validation**: N/A — no network or form input; React children are rendered as React
  nodes, and text is escaped by React.
- **Authentication & authorization**: N/A — no protected actions or data.
- **Injection risks**: N/A — no `dangerouslySetInnerHTML`, no HTML string evaluation, no SQL,
  shell or file operations.
- **Encryption needs**: N/A — no data at rest or in transit.
- **Rate limiting**: N/A — no endpoints or requests.
- **Infrastructure**: N/A — no containers, secrets, network exposure or CI change.

---

## Acceptance Criteria

1. [ ] `<AppBar aria-label="Application">` renders a `header` element with the banner role, the
       accessible name `"Application"`, and the ref pointing at that element.
2. [ ] The `AppBar` root has `min-height: 48px`, zero padding and zero gap; a leading 48×48
       child is flush with the leading edge; a trailing 48×48 child is flush with the trailing
       edge; the title starts 8px after the leading child.
3. [ ] At normal text the bar measures exactly 48px in the Storybook `Geometry` story; at 200%
       text-only zoom the content does not clip, and the bar grows if the content exceeds 48px.
4. [ ] `<AppBarTitle>Contoso</AppBarTitle>` renders a `span`; `headingLevel={1}` renders an `h1`;
       `headingLevel={3}` renders an `h3`; `href="/home"` renders an `a` with `href="/home"`.
5. [ ] The title is 14px/20px at normal text (unitless `1.4286`), semibold, white, with 8px
       inline margins; a long title ellipsizes in a narrow bar and its full text remains in the
       DOM.
6. [ ] The title link has no underline at rest, an underline on hover, and a visible white focus
       ring. `headingLevel` plus `href` is a TypeScript error.
7. [ ] `<AppBarSpacer />` renders an empty `div`, grows in the bar, has no accessible name and is
       not focusable; its ref and native props are forwarded.
8. [ ] The bar does not restyle arbitrary child buttons; only an `AppBarButton` from RD-02 carries
       the on-brand command treatment.
9. [ ] The three components and their props types are exported from the package root; the export
       pin lists them; `pnpm verify` and `pnpm storybook:build` pass.
10. [ ] The README documents the three components, the geometry, the title semantics, the
        truncation/zoom behavior and the localization model.
11. [ ] No `AppLauncher` source or documentation is changed.
12. [ ] Security requirements verified as N/A with the reasons above.
