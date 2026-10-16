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

### ErrorDialog

A blocking alert dialog that shows an error's details for the support workflow
and offers the recovery actions the host provides: close, and optionally a page
reload — or sign-out for a session that expired. The component is controlled and
side-effect-free: visibility follows `open`, dismissal is a callback request to
the application, and nothing is ever reloaded, navigated or logged on the
component's own.

| Prop          | Type                              | Default                                   | Description                                                                                                                                                              |
| ------------- | --------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `open`        | `boolean`                         | — (required)                              | Whether the dialog is shown; the application owns this state.                                                                                                            |
| `error`       | `unknown`                         | —                                         | The value to display; serialized into the details area (see below).                                                                                                      |
| `detailsText` | `string`                          | —                                         | Replaces the serialized details verbatim; an empty string renders a blank details value.                                                                                 |
| `strings`     | `Partial<ErrorDialogStrings>`     | —                                         | Text overrides merged key by key over the English defaults.                                                                                                              |
| `kind`        | `'error' \| 'unauthorized'`       | `'error'`                                 | The variant: standard recovery actions, or sign-out only for a session that expired.                                                                                     |
| `onDismiss`   | `() => void`                      | — (required for the error variant)        | Called once, without arguments, when Close is activated.                                                                                                                 |
| `onReload`    | `() => void`                      | —                                         | When provided, the secondary Reload page action renders.                                                                                                                 |
| `onSignOut`   | `() => void`                      | — (required for the unauthorized variant) | Called once, without arguments, when Sign out is activated.                                                                                                              |
| …             | `ComponentPropsWithoutRef<'div'>` | —                                         | All native props except `children` (the dialog owns its content) spread onto the dialog surface; `className` and `style` merge (the caller wins) and `ref` points at it. |

```tsx
<ErrorDialog
  open={error !== undefined}
  error={error}
  onDismiss={() => setError(undefined)}
  onReload={() => window.location.reload()}
/>
```

#### Composition patterns

- **The application owns visibility.** Render the dialog from the same state
  that holds the current error; `onDismiss` clears that state and the dialog
  disappears on the next render — the component keeps no state of its own.
- **Error values are handled defensively.** `Error` instances serialize to
  pretty-printed JSON with name, message, stack and custom fields; strings pass
  through verbatim; exotic values fall back gracefully, so a hostile or broken
  value can never make the dialog throw. Use `detailsText` when the application
  wants full control of the text.
- **Localization is incremental.** Pass a partial `strings` object; unset keys
  keep their English defaults. A key set to an empty string suppresses that
  text on purpose.
- **Alert semantics.** The dialog is an `alertdialog`: Escape and backdrop
  clicks cannot dismiss it — only the rendered actions can. The session-expired
  variant deliberately offers no dismissal beyond signing out, so a user cannot
  stay in a dead session.
- **The copy control renders only when the clipboard is available** (checked
  after mount) and confirms a successful copy briefly; clipboard failures
  change nothing.

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
