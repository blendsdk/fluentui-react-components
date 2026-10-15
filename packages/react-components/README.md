# @blendsdk/fluentui-react-components

Custom React components built on [Fluent UI v9](https://react.fluentui.dev/),
written in Fluent UI's own component pattern: a typed props contract, a state
hook, a render function, and Griffel styles that resolve every color, radius
and spacing from Fluent design tokens.

## Install

The package declares its Fluent UI and React dependencies as peers, so the
consuming application owns their versions and every component shares one React
instance and one Griffel style sheet — the single-instance setup that makes
`FluentProvider` theming work.

```bash
pnpm add @blendsdk/fluentui-react-components @fluentui/react-components @fluentui/react-icons react react-dom
```

Wrap the application in `FluentProvider` as usual; the components follow the
active theme.

```tsx
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { DescriptionList, DescriptionListItem } from '@blendsdk/fluentui-react-components';

export function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <DescriptionList layout="columns">
        <DescriptionListItem label="Plan">Pro</DescriptionListItem>
        <DescriptionListItem label="Seats">12</DescriptionListItem>
      </DescriptionList>
    </FluentProvider>
  );
}
```

## Principles

- **Presentation only.** The components hold no data and no application state.
  Which pairs exist, which values are shown and what activation means are
  decisions of the calling application.
- **Semantic markup first.** Components render the element that already carries
  the meaning (`dl`/`dt`/`dd`, `button`, `ul`/`li`) and add ARIA attributes only
  where the platform has no element for the job.
- **Tokens, never literals.** Colors, spacing, radii and shadows come from
  `tokens`, so every component follows the `FluentProvider` theme — including
  dark mode and custom brand themes.
- **Native props pass through.** Components extend the props of the element
  they render, so `className`, `aria-*`, `style` and event handlers work
  without the library re-declaring them.

## Components

### DescriptionList

Groups `DescriptionListItem` children and decides how they read: the label
above the value (`layout="stacked"`, the default) or the labels in a column of
their own beside the values (`layout="columns"`). In the columns layout the
labels of all pairs line up on one column, because each pair takes its two
column tracks from the list's grid through CSS `subgrid`.

| Prop       | Type                             | Default      | Description                                                                                         |
| ---------- | -------------------------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `children` | `ReactNode`                      | — (required) | The pairs to render; pass `DescriptionListItem` elements.                                           |
| `layout`   | `'stacked' \| 'columns'`         | `'stacked'`  | Arrangement of the pairs; provided to every item through a context, so items carry no layout props. |
| …          | `ComponentPropsWithoutRef<'dl'>` | —            | All native `dl` props pass through (`className`, `aria-label`, event handlers, ...).                |

### DescriptionListItem

One term/definition pair: the `label` renders in a `dt` element (the term) and
`children` in a `dd` element (the definition). The surrounding list decides the
layout; the item follows.

| Prop       | Type                              | Default      | Description                                                                   |
| ---------- | --------------------------------- | ------------ | ----------------------------------------------------------------------------- |
| `label`    | `ReactNode`                       | — (required) | Term of the pair; also the name assistive technology reads for the value.     |
| `children` | `ReactNode`                       | — (required) | Definition of the pair; any content — text, a `Badge`, a `Link`, a component. |
| …          | `ComponentPropsWithoutRef<'div'>` | —            | All native props of the pair's wrapper element pass through.                  |

#### Composition patterns

- **Pair layout follows the list.** Switch between stacked and columns on the
  `DescriptionList`, not per item; an item rendered outside a list falls back
  to the stacked layout.
- **Values are free-form.** A definition can hold a `Badge`, a `Link`, a
  status indicator or text; the item does not interpret it.
- **Empty values are an application decision.** Render a placeholder (for
  example an em dash) as the value when a field has no data — the library
  ships no placeholder text.
- **Nesting works.** A pair may contain another `DescriptionList` in its
  value; nested lists provide their own layout to their own items.

## Development

```bash
pnpm --filter @blendsdk/fluentui-react-components build         # Vite bundle + declaration files
pnpm --filter @blendsdk/fluentui-react-components test          # Vitest, jsdom
pnpm --filter @blendsdk/fluentui-react-components type-check    # tsc --noEmit
pnpm storybook                                                  # component workbench on :6006
```

Tests live in `test/`, next to the sources: `*.spec.test.tsx` covers the
contract a consumer observes, `*.impl.test.tsx` covers internals such as the
context wiring between a list and its items, and `package-exports.spec.test.ts`
guards the package's public surface. Stories live beside the components
(`*.stories.tsx`) and render in the repository's Storybook, which is published
to GitHub Pages.

New components follow the repository's component pattern. The local
`fluentui-components` skill (`.opencode/skills/fluentui-components`) documents
the pattern, the workflow and the definition of done, with templates for every
file.

## License

MIT © TrueSoftware B.V.
