# Styling

Components are styled with Griffel through `@fluentui/react-components` —
`makeStyles` for the CSS and `tokens` for every value. The rules below keep the
styles correct across themes, dark mode and right-to-left layouts, and keep
them compatible with the Fluent UI components they compose.

## The shape of a styles file

```ts
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { ExampleLayout } from './ExampleContext';

const useStyles = makeStyles({
  rootBase: {
    display: 'grid',
    margin: 0,
  },
  rootStacked: {
    gridTemplateColumns: '1fr',
    rowGap: tokens.spacingVerticalXXS,
  },
  label: {
    color: tokens.colorNeutralForeground2,
    margin: 0,
  },
});

/** Classes the component hands to its render function. */
export type ExampleClasses = {
  /** Root classes for the resolved layout. */
  root: string;
  /** Classes of the label element. */
  label: string;
};

export function useExampleStyles(layout: ExampleLayout): ExampleClasses {
  const styles = useStyles();

  return {
    root: mergeClasses(
      styles.rootBase,
      layout === 'compact' ? styles.rootCompact : styles.rootDefault
    ),
    label: styles.label,
  };
}
```

Conventions:

- `makeStyles` is called at module scope, once per file. Never inside a
  component or hook body.
- The `use<Name>Styles` hook is the only export besides the classes type. It
  takes exactly the inputs the styles depend on (layout, size, …), not props.
- Each class in `makeStyles` has one responsibility. Shared declarations go in
  a `…Base` class that the hook merges with the variant.
- The classes type documents each field: which element it lands on and what it
  expresses. The render function reads classes only through this object — never
  a raw `styles.…` reference.

## Tokens, not literals

Every color, spacing, radius, shadow, font size and weight comes from
`tokens`:

| Need                | Token family                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Text and icon color | `colorNeutralForeground1` (primary), `colorNeutralForeground2` (secondary), `…3`, `…Disabled` |
| Surfaces            | `colorNeutralBackground1` (default), `…2`, `…3`, `colorSubtleBackgroundHover`                 |
| Brand               | `colorBrandBackground`, `colorBrandForeground1`, `colorBrandStroke1`                          |
| Spacing             | `spacingVertical…`, `spacingHorizontal…` (`XS`, `S`, `M`, `L`, `XL`, `XXS`, `SNudge`, …)      |
| Corner radius       | `borderRadiusSmall`, `borderRadiusMedium`, `borderRadiusLarge`, `borderRadiusCircular`        |
| Shadow              | `shadow2`, `shadow4`, `shadow8`, `shadow16`, `shadow28`, `shadow64`                           |
| Typography          | `fontSizeBase200`…`fontSizeBase600`, `fontWeightRegular`/`…Semibold`/`…Bold`                  |

A literal is allowed only when no token exists (a structural value such as an
`8em` column minimum). Then the comment says why the token scale does not fit.
Never hard-code a color — that breaks dark mode and custom themes silently.

## Variants

A variant that only changes declarations is a second class in the same
`makeStyles` call, merged in the hook:

```ts
root: mergeClasses(styles.rootBase, size === 'small' ? styles.rootSmall : styles.rootMedium),
```

A variant that changes the element or the children travels as state, not as
styles (see `state-and-render.md`).

## Interaction states

Style states with selectors, not JavaScript:

```ts
root: {
  ':hover': { backgroundColor: tokens.colorSubtleBackgroundHover },
  ':hover:active': { backgroundColor: tokens.colorSubtleBackgroundPressed },
  ':focus-visible': { outline: `${tokens.strokeWidthThick} solid ${tokens.colorStrokeFocus2}` },
  [`:disabled`]: { color: tokens.colorNeutralForegroundDisabled },
},
```

- Disabled styling keys off `:disabled` and `[aria-disabled="true"]` — both
  because the two disabled modes of Fluent UI buttons map to those two
  selectors.
- Focus styling keys off `:focus-visible`, never plain `:focus`, so the ring
  appears for keyboard users only.
- For components that wrap a Fluent UI component, extend rather than fight it:
  read the primitive's own class name usage in the launcher-style examples.

## Specificity and insertion order

Griffel inserts this package's stylesheet **before** Fluent UI's own
stylesheets, so at equal specificity Fluent UI wins. When a rule must beat a
Fluent UI style (re-skinning a `Button`, a `SearchBox` field, a `Popover`
surface):

- raise specificity with a guarded selector
  (`':enabled:not([aria-disabled="true"])'`) rather than `!important`,
- or scope under a data attribute the component owns
  (`data-example-surface=""`), which also documents that the rule targets the
  component's own surface.

Write the reason in a comment whenever a selector looks unusual — the next
reader will not reconstruct it.

## Layout negotiation between containers and children

When a container decides a child's layout, both sides cooperate through the
context:

- The **container** owns the grid that gives the layout its alignment (for
  example the two column tracks of a columns-listed description list).
- The **child** reads the layout and picks the matching class, spanning the
  container's columns when it must (`gridColumn: '1 / -1'`) and taking its
  tracks from the container (`gridTemplateColumns: 'subgrid'`).

Prefer standard grid mechanisms over `display: contents`: a wrapper that keeps
its box keeps the caller's `className` and `style` meaningful.

## Theming, dark mode and RTL

- Never read the theme from JavaScript; tokens resolve against the active
  `FluentProvider` theme. A component that follows tokens automatically works
  in light, dark and brand themes.
- Define nothing globally: no resets, no `body` rules, no global class names.
  A component styles only its own elements.
- Use logical CSS properties (`marginInlineStart`, `paddingInline`, …) or CSS
  properties that are already direction-agnostic (`gap`, `margin: 0`). Griffel
  flips logical properties for RTL automatically.
- Order and alignment (`textAlign: 'start'`) use logical values, never
  `left`/`right`.

## Inline styles

Inline `style` is for values that are computed per instance and cannot live in
a class (a `gridTemplateColumns` built from a prop, a CSS custom property).
When inline styles are used:

- Spread the caller's `style` first and let the computed value win, so the
  contract is explicit: `style={{ gridTemplateColumns, ...state.rootProps.style }}`,
- comment what cannot be a class and why.

## A review checklist for styles

- [ ] No color, spacing, radius, shadow or font literal without a comment.
- [ ] `makeStyles` at module scope; hook merges base + variants.
- [ ] Classes type documents every field; render function uses only it.
- [ ] `mergeClasses` in the render function so caller classes survive.
- [ ] Interaction states via selectors, focus via `:focus-visible`.
- [ ] Specificity-raising selectors carry a comment explaining the Fluent UI
      style they must outweigh.
- [ ] Logical properties for anything direction-sensitive.
