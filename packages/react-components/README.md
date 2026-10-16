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
  decisions of the calling application. `SystemErrorProvider` and
  `ConfirmProvider` are the deliberate carve-outs: they hold transient state —
  the current error, the pending confirmation request — so any part of the
  application can report errors or ask for a decision through one dialog.
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

### SystemErrorProvider

Wraps the application subtree once and lets any descendant report an error
through `useSystemError()`; the provider holds the current error and renders
one controlled `ErrorDialog`. It is a convenience layer, not a policy layer:
it never inspects errors for authentication, never reloads, navigates or
transmits, and repeated reports replace the current one (last-wins).

```tsx
<FluentProvider theme={webLightTheme}>
  <SystemErrorProvider
    captureGlobalErrors
    onReload={() => window.location.reload()}
    onSignOut={() => auth.signOut()}
  >
    <App />
  </SystemErrorProvider>
</FluentProvider>
```

| Prop                  | Type                          | Default      | Description                                                                                                                                                                                                                          |
| --------------------- | ----------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `children`            | `ReactNode`                   | — (required) | The application subtree; the provider adds no DOM of its own.                                                                                                                                                                        |
| `onReload`            | `() => void`                  | —            | Forwarded to the dialog's standard variant; when provided, the dialog adds the secondary Reload page action. The provider never reloads by itself.                                                                                   |
| `onSignOut`           | `() => void`                  | —            | Runs when the user activates Sign out of the session-expired variant — **after** the dialog has closed, so a missing or throwing handler cannot trap the user.                                                                       |
| `strings`             | `Partial<ErrorDialogStrings>` | —            | Text overrides applied to every dialog the provider shows.                                                                                                                                                                           |
| `captureGlobalErrors` | `boolean`                     | `false`      | Registers opt-in window listeners for `error` and `unhandledrejection` and reports their payloads through the same dialog; the events are never suppressed, and one capture-enabled provider per application is the supported setup. |

The hook returns the provider's imperative API:

| Member       | Type                                                    | Description                                                                                                                                                         |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catchError` | `(error: unknown, options?: CatchErrorOptions) => void` | Stores the value and opens the dialog; `options.kind` (`'error'` by default) selects the variant, `options.detailsText` overrides the details for this report only. |
| `clearError` | `() => void`                                            | Closes and clears the dialog; a no-op when nothing is shown.                                                                                                        |

#### Composition patterns

- **Report from anywhere.** Call `useSystemError()` in any descendant and pass
  the caught value to `catchError`; calling the hook outside the provider
  throws a descriptive error.
- **Session expiry is explicit and never traps.** The unauthorized variant is a
  deliberate call-site decision — `catchError(error, { kind: 'unauthorized' })` —
  and the README-documented setup provides a real `onSignOut` handler: signing
  out closes the dialog first and runs the handler afterwards.
- **Global capture is opt-in and non-suppressing.** With
  `captureGlobalErrors`, uncaught window errors and unhandled rejections reach
  the dialog while the browser console and other listeners keep seeing them;
  the library carries no monitoring policy.
- **The provider holds transient state only** (the principles carve-out): the
  current error lives in memory until it is cleared or replaced, and nothing is
  stored or transmitted.

### ConfirmDialog

The prompt an application shows when a user action needs an explicit decision
before it runs. It is a controlled strict alert dialog: visibility follows
`open`, Escape and backdrop clicks cannot dismiss it, and every closure is an
explicit action reporting through `onResolve` — the component never closes
itself, never executes the decision and performs no side effects. The default
pair reports a boolean; a custom action set reports the chosen value.

| Prop        | Type                                                   | Default          | Description                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `open`      | `boolean`                                              | — (required)     | Whether the dialog is shown; the application owns this state.                                                                                                                                            |
| `title`     | `ReactNode`                                            | — (required)     | The question, rendered as the dialog title; also the accessible name.                                                                                                                                    |
| `message`   | `ReactNode`                                            | —                | Optional explanation; a plain string preserves newlines as visible line breaks. Content is never parsed as HTML.                                                                                         |
| `strings`   | `Partial<ConfirmDialogStrings>`                        | —                | Action-label overrides merged key by key over the English defaults (`"Confirm"` / `"Cancel"`); a blank override keeps the default.                                                                       |
| `busy`      | `boolean`                                              | `false`          | Disables every action while the application finishes its work; focus moves to the dialog surface when the focused action becomes disabled, so keyboard focus never falls to the page body.               |
| `intent`    | `'confirmation' \| 'danger'`                           | `'confirmation'` | Pair variant only: `'danger'` applies the danger token recipe to the affirmative action; the dialog surface stays neutral.                                                                               |
| `actions`   | `readonly [ConfirmAction<V>, ...ConfirmAction<V>[]]`   | —                | Custom action set replacing the default pair; renders in array order and resolves the chosen `value` with its literal type inferred at the call site. Mutually exclusive with the dialog-level `intent`. |
| `onResolve` | `(confirmed: boolean) => void` or `(value: V) => void` | — (required)     | Called once per activation with the adopted outcome; the dialog stays open until the application reacts, and repeat activations report again.                                                            |
| …           | `ComponentPropsWithoutRef<'div'>`                      | —                | All native props except `children` and `title` spread onto the dialog surface; `className`/`style` merge (the caller wins) and `ref` points at it.                                                       |

```tsx
<ConfirmDialog
  open={pending}
  title="Delete this record?"
  message={'This cannot be undone.\nThe record is removed for everyone.'}
  intent="danger"
  onResolve={confirmed => {
    setPending(false);
    if (confirmed) deleteRecord();
  }}
/>
```

#### Composition patterns

- **The application owns visibility and side effects.** Render the dialog from
  the same state that drives the decision. An activation reports the outcome —
  it does not act; close the dialog (or set `busy`) on the first report, and
  remember that repeat activations while it stays open report again.
- **The safe action comes first.** The first action in DOM order receives
  initial focus (Fluent's behavior), so the default pair renders decline before
  confirm; list the cautious choice first in custom action sets too.
- **Danger emphasis flags the destructive action.** `intent="danger"` on the
  pair, or `intent: 'danger'` on one action of a custom set. In forced-colors
  mode the label carries the meaning, because the user agent replaces authored
  colors.
- **Custom sets carry typed outcomes.** With `actions={[{ value: 'discard' },
…]}` the resolved value is the literal union of the values, so a `switch`
  over the outcome is exhaustive.
- **Localization is incremental.** Pass a partial `strings` object; unset keys
  keep their English defaults. Blank labels fall back — an action can never be
  unnamed.

#### When not to use

`ConfirmDialog` is a fixed-shape decision prompt: a title, an optional message
and a rendered action set. It is **not** a general dialog host — for forms,
validation, multi-step flows, custom bodies or header glyphs, compose the
Fluent primitives (`Dialog`, `DialogSurface`, `DialogTitle`, `DialogContent`,
`DialogActions`) directly.

### ConfirmProvider

Wraps the application subtree once and lets any descendant ask for a decision
through `useConfirm()`; the provider holds the pending request and renders one
`ConfirmDialog`. It is a convenience layer, not a policy layer: it never
executes the decided work, and every request settles exactly once — a
superseded or unmounted request resolves `false`, and the promise never
rejects. One provider per React root is the supported setup; more than one
could show two dialogs at the same time.

```tsx
<FluentProvider theme={webLightTheme}>
  <ConfirmProvider strings={{ confirm: 'Yes', decline: 'No' }}>
    <App />
  </ConfirmProvider>
</FluentProvider>
```

| Prop       | Type                            | Default      | Description                                                                                              |
| ---------- | ------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| `children` | `ReactNode`                     | — (required) | The application subtree; the provider adds no DOM of its own while idle.                                 |
| `strings`  | `Partial<ConfirmDialogStrings>` | —            | Text defaults applied to every dialog the provider shows; a non-blank per-call override wins key by key. |

The hook returns a stable imperative function with two shapes:

| Call                                              | Returns            | Description                                                                       |
| ------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `confirm({ title, message?, intent?, strings? })` | `Promise<boolean>` | The default pair; resolves `true`/`false` after the user decides.                 |
| `confirm({ title, message?, strings?, actions })` | `Promise<V>`       | A custom action set; resolves the chosen `value` with its literal type preserved. |

#### Composition patterns

- **Mount once, above the router.** `useConfirm()` works from any descendant on
  any page; per-page providers are never required.
- **The dialog closes first, then the promise resolves.** The host's follow-up
  work runs in the calling flow after the awaited decision — the provider never
  keeps the dialog open while that work runs.
- **Requests are one-at-a-time (replacement).** A new `confirm()` while a dialog
  is open resolves the previous promise `false` and shows the new dialog; a
  `confirm()` call never rejects and never leaves a dangling `await`.
- **Call from handlers or effects — not during render, not on the server.**
  Server rendering emits the children only; a request needs a client-side
  interaction.

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
