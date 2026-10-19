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
pnpm add @blendsdk/fluentui-react-components @fluentui/react-components @fluentui/react-icons @fluentui/react-datepicker-compat react react-dom react-hook-form
```

`react-hook-form` and `@fluentui/react-datepicker-compat` are required peers
because the package root exports the form field wrappers. The DatePicker
wrapper uses the compat package's 0.6.x line; pin it in the application when
you need a reproducible calendar implementation.

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

## Form fields (React Hook Form)

Eight field wrappers bind the Fluent UI v9 primitives to React Hook Form. Each
wrapper calls `useController` once, reads the value from `field.value`, writes
through `field.onChange`, and renders label, hint, required state and the
validation message through Fluent's `Field`.

| Component             | Fluent UI primitive                                   |
| --------------------- | ----------------------------------------------------- |
| `FormTextField`       | `Input`                                               |
| `FormTextareaField`   | `Textarea`                                            |
| `FormCheckboxField`   | `Checkbox`                                            |
| `FormSwitchField`     | `Switch`                                              |
| `FormRadioGroupField` | `RadioGroup`                                          |
| `FormDropdownField`   | `Dropdown`                                            |
| `FormComboboxField`   | `Combobox`                                            |
| `FormDatePickerField` | `DatePicker` from `@fluentui/react-datepicker-compat` |

### Basic usage

```tsx
import { useForm } from 'react-hook-form';
import {
  FormTextField,
  FormCheckboxField,
  FormDropdownField,
} from '@blendsdk/fluentui-react-components';
import { Option } from '@fluentui/react-components';

type Values = {
  name: string;
  height?: number;
  active: boolean;
  color?: string;
};

const optionLabels: Record<string, string> = { red: 'Red', blue: 'Blue' };

const form = useForm<Values>({
  defaultValues: { name: '', active: false, color: '' },
});

<FormTextField control={form.control} name="name" label="Name" required />
<FormTextField
  control={form.control}
  name="height"
  label="Height"
  hint="Whole centimeters"
  parse={value => (value === '' ? undefined : Number(value))}
/>
<FormCheckboxField
  control={form.control}
  name="active"
  label="Enable feature"
/>
<FormDropdownField
  control={form.control}
  name="color"
  label="Color"
  getOptionText={value => optionLabels[value]}
>
  <Option value="red">Red</Option>
  <Option value="blue">Blue</Option>
</FormDropdownField>
```

### Contract

- `control` and `name` are required. The application owns `useForm`, the
  validation resolver, the schema, DTO mapping and business rules.
- `label` and `hint` are strings. The package ships no string resources;
  pass translated text from the call site.
- `required` marks the control and exposes the required state to assistive
  technology. It does not validate the field; the resolver does.
- Errors render from `fieldState.error?.message`. Set server errors with
  `form.setError(name, { message })`; no second error format is supported.
- `disabled` works per field and through `useForm({ disabled: true })`.
- `readOnly` is available on `FormTextField` and `FormTextareaField`.
  `FormDatePickerField` follows `allowTextInput`; the other fields have no
  read-only state.
- Checkbox and Switch render their own labels; `Field` supplies only the hint,
  validation message and required state for them.
- Zod and `@hookform/resolvers` stay application dependencies. The component
  package only declares React Hook Form as a peer.

### Selection fields

`FormDropdownField` and `FormComboboxField` store the selected option value,
not its display text. The empty string means no selection. When an option's
value differs from its text, pass `getOptionText` so `reset`, `setValue` and
the collapsed display show the correct text:

```tsx
const optionText: Record<string, string> = { red: 'Red', blue: 'Blue' };

const getOptionText = (value: string) => optionText[value];

<FormDropdownField control={form.control} name="color" label="Color" getOptionText={getOptionText}>
  <Option value="red">Red</Option>
  <Option value="blue">Blue</Option>
</FormDropdownField>;
```

Combobox typing filters the list but does not change the form value until an
option is selected. Fluent's clear affordance is pointer-only; for a
keyboard-accessible clear, include an option with an empty value:

```tsx
<FormComboboxField control={form.control} name="color" label="Color">
  <Option value="red">Red</Option>
  <Option value="blue">Blue</Option>
  <Option value="">None</Option>
</FormComboboxField>
```

### Date picker

`FormDatePickerField` stores a `Date | null`. The input is read-only by default;
set `allowTextInput` to accept typed dates, and pass `formatDate` and
`parseDateFromString` so the input and the form agree on the format. The
calendar strings, minimum and maximum dates and validation callback pass
through to the compat component.

```tsx
<FormDatePickerField
  control={form.control}
  name="startDate"
  label="Start date"
  formatDate={date => date?.toLocaleDateString() ?? ''}
/>
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

A superseded or unmounted request resolves `false` — the safe "not confirmed"
direction — in both shapes, so inspect for `false` before treating an outcome
as the user's choice. The promise never rejects.

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

### AppLauncher

The launcher shell: a waffle trigger that opens a popover panel of application
content. The application owns everything the panel shows — which apps exist,
when one is disabled, what a search matches and what "recent" means — and the
open state when it needs to close the panel from an activation. Docked to the
application bar (the `dockTarget` pattern), the panel opens flush below the bar,
the way the Microsoft 365 launcher behaves.

A launcher in an application bar: the waffle trigger, a search field, a pinned
grid, and a result list with an application-provided empty state while
searching.

```tsx
import { useRef, useState } from 'react';
import {
  AppLauncher,
  AppLauncherGrid,
  AppLauncherItem,
  AppLauncherList,
  AppLauncherSearch,
  AppLauncherSection,
} from '@blendsdk/fluentui-react-components';

function AppMenu() {
  const barRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const matches = apps.filter(app => app.label.toLowerCase().includes(needle));

  return (
    <header ref={barRef}>
      <AppLauncher label="App launcher" dockTarget={barRef}>
        <AppLauncherSearch
          label="Search apps"
          value={query}
          onChange={(_event, data) => setQuery(data.value)}
        />
        {needle === '' ? (
          <AppLauncherSection title="Pinned">
            <AppLauncherGrid>
              {apps.map(app => (
                <AppLauncherItem
                  key={app.label}
                  label={app.label}
                  icon={app.icon}
                  onClick={() => open(app)}
                />
              ))}
            </AppLauncherGrid>
          </AppLauncherSection>
        ) : (
          <AppLauncherSection>
            {matches.length === 0 ? (
              <p>No apps found</p>
            ) : (
              <AppLauncherList>
                {matches.map(app => (
                  <AppLauncherItem
                    key={app.label}
                    label={app.label}
                    icon={app.icon}
                    onClick={() => open(app)}
                  />
                ))}
              </AppLauncherList>
            )}
          </AppLauncherSection>
        )}
      </AppLauncher>
    </header>
  );
}
```

| Prop           | Type                                       | Default                         | Description                                                                                                                                                                                                                                                                                                                      |
| -------------- | ------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`        | `string`                                   | `'App launcher'`                | Accessible name of the built-in trigger and its tooltip; pass a localized string. Applies to the built-in trigger only.                                                                                                                                                                                                          |
| `icon`         | `ReactElement`                             | the Fluent waffle glyph         | Trigger icon override; built-in trigger only.                                                                                                                                                                                                                                                                                    |
| `trigger`      | `ReactElement`                             | —                               | Caller-provided trigger element used instead of the built-in waffle button — for example a Fluent `ToolbarButton`, so the launcher can live in an application toolbar or a drawer header. The element must accept and forward injected props and a ref (the `PopoverTrigger` contract) and owns its accessible name and tooltip. |
| `positioning`  | `PopoverProps['positioning']`              | below the anchor, start-aligned | Fluent popover positioning; combine with `dockTarget` to dock to the right edge (`align: 'end'`).                                                                                                                                                                                                                                |
| `dockTarget`   | `RefObject<HTMLElement \| null>`           | —                               | Element the panel anchors to instead of the trigger — usually the application bar, so the panel docks flush with the window edge. The element must stay mounted while the launcher is open.                                                                                                                                      |
| `docking`      | `'default' \| 'full'`                      | `'default'`                     | `'default'` wraps the content; `'full'` stretches the panel from its anchored top edge to the bottom of the window. Either way the panel is capped at the window bottom and scrolls internally when the content is taller. Size panel content with `box-sizing: border-box`.                                                     |
| `open`         | `boolean`                                  | uncontrolled                    | Controlled open state; pair with `onOpenChange` to close the panel from an item click, for example.                                                                                                                                                                                                                              |
| `onOpenChange` | `(event, data: { open: boolean }) => void` | —                               | Fired whenever the launcher asks to change the open state: the trigger, Escape, or a click outside.                                                                                                                                                                                                                              |
| `children`     | `ReactNode`                                | — (required)                    | The panel content: search, sections, grids and lists.                                                                                                                                                                                                                                                                            |

#### Composition patterns

- **The application owns the state.** The package holds no query and no app
  list; keep them in the calling component and switch what the panel renders.
- **Activating an app closes the panel.** Keep the open state in the
  application (`open` + `onOpenChange`) and close it from the item click, the
  way the Microsoft 365 launcher behaves.
- **The trigger can live in a toolbar.** Pass `trigger` with an element that
  accepts injected props and a ref; the launcher replaces its waffle with that
  element and the panel still anchors to the element itself.
- **Docking chooses the anchor.** Without `dockTarget` the panel opens below
  its trigger; with `dockTarget` it anchors to that element — the bar — so it
  opens flush with the window edge. `positioning` picks the edge and
  alignment, `docking="full"` fills the window below the anchor.
- **Keyboard flow.** Tab moves through the panel content, Enter and Space
  activate an item, Escape clears a controlled query first — the second
  Escape closes the panel.
- **Empty search results need a state.** Render a short message (for example
  "No apps found") in place of the result list.

### AppLauncherTrigger

The built-in waffle trigger, exported for applications that place it
themselves. It renders an icon-only button whose `label` is both the
accessible name and the tooltip; while the launcher's panel is open the
tooltip is suppressed without remounting the button. The launcher renders
this component unless a caller-provided `trigger` replaces it.

| Prop          | Type                        | Default           | Description                                                                                 |
| ------------- | --------------------------- | ----------------- | ------------------------------------------------------------------------------------------- |
| `label`       | `string`                    | `'App launcher'`  | Accessible name, also shown as the tooltip; pass a localized string.                        |
| `icon`        | `ReactElement`              | the Fluent waffle | Icon rendered inside the button.                                                            |
| `appearance`  | `ButtonProps['appearance']` | `'subtle'`        | Visual style of the button.                                                                 |
| `size`        | `ButtonProps['size']`       | Fluent's default  | Size of the button.                                                                         |
| `shape`       | `ButtonProps['shape']`      | Fluent's default  | Shape of the button.                                                                        |
| `hideTooltip` | `boolean`                   | `false`           | Suppresses the tooltip without removing it from the tree, so the button keeps its identity. |
| …             | native button props         | —                 | All native button props (`onClick`, `className`, `aria-*`, ...) pass through.               |

### Texts and localization

Every user-facing string is a prop; the package ships no string resource
files. The defaults are English and can be overridden per application:

| Text                             | Kind                      | Default                               | How to localize                                                                                   |
| -------------------------------- | ------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Trigger label (also the tooltip) | accessible name + tooltip | `'App launcher'`                      | `label` on `AppLauncher` / `AppLauncherTrigger`                                                   |
| Search field's accessible name   | accessible                | none — required                       | `label` on `AppLauncherSearch`                                                                    |
| Search placeholder               | visible                   | `'Search'`                            | `placeholder` (SearchBox passthrough)                                                             |
| Clear button on the search field | accessible                | `'clear'` — set by Fluent's SearchBox | `dismiss={{ 'aria-label': '…' }}` (SearchBox passthrough; the slot merges over Fluent's defaults) |
| Item names                       | visible + accessible      | none — caller content                 | `label` on `AppLauncherItem`                                                                      |
| Section titles                   | visible                   | none — caller content                 | `title` on `AppLauncherSection` (or omit)                                                         |
| Empty search state               | visible                   | none — caller content                 | render your own message instead of the result list                                                |

A German search field — the override the `Localized` story renders:

```tsx
<AppLauncherSearch
  label="Apps durchsuchen"
  placeholder="Suchen"
  dismiss={{ 'aria-label': 'Eingabe löschen' }}
  value={query}
  onChange={onQueryChange}
/>
```

### AppLauncherSearch

The panel's search field: a Fluent `SearchBox` with the launcher defaults —
full width, the search icon, and a clear button while a query is present.
`label` is required and becomes the accessible name; the field renders no
visible label. `onChange` fires with `{ value }` while typing, when the clear
button is clicked, and when Escape clears a controlled field.

| Prop       | Type                                                                 | Default      | Description                                                                                                                   |
| ---------- | -------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `label`    | `string`                                                             | — (required) | Accessible name of the field.                                                                                                 |
| `onChange` | `(event: SyntheticEvent, data: AppLauncherSearchChangeData) => void` | —            | Fired with the next query value; the event is the common `SyntheticEvent` shape rather than Fluent's event union.             |
| …          | `SearchBoxProps` (except `aria-label`, `onChange`, `onKeyDown`)      | —            | All other `SearchBox` props pass through (`value`, `placeholder`, `size`, `dismiss`, ...); `onKeyDown` is owned by the block. |

#### Composition patterns

- **The application owns the query.** Keep it in component state and pass
  `value` with `onChange`; the field keeps no state of its own.
- **Clearing happens in two steps.** The first Escape clears a non-empty
  query and stops there — the panel stays open; with an empty field, the next
  Escape reaches the panel and closes it.
- **Localization is props all the way down.** `label` names the field,
  `placeholder` is the visible cue, and Fluent's `dismiss` slot takes the
  clear button's `aria-label`.

### AppLauncherSection

Groups tiles under an optional `title` with the launcher's spacing between
sections; `divider` draws a line above the section, between it and the one
before it. An untitled section is a plain unlabeled group.

| Prop       | Type                              | Default      | Description                                                              |
| ---------- | --------------------------------- | ------------ | ------------------------------------------------------------------------ |
| `children` | `ReactNode`                       | — (required) | Section content, usually an `AppLauncherGrid`.                           |
| `title`    | `string`                          | —            | Caption above the content, for example "Pinned" or "All apps".           |
| `divider`  | `boolean`                         | `false`      | Draws a divider line above the section, between it and the previous one. |
| …          | `ComponentPropsWithoutRef<'div'>` | —            | All native div props pass through (`className`, `aria-*`, ...).          |

### AppLauncherGrid

Lays `AppLauncherItem` children out as tiles — icon above the name — and wraps
each tile in a list item, so assistive technology hears the panel content as a
list of apps. The default is three columns, the Microsoft 365 launcher's
column count.

| Prop       | Type                             | Default      | Description                                        |
| ---------- | -------------------------------- | ------------ | -------------------------------------------------- |
| `children` | `ReactNode`                      | — (required) | Tiles to lay out; pass `AppLauncherItem` elements. |
| `columns`  | `number`                         | `3`          | Number of tile columns.                            |
| …          | `ComponentPropsWithoutRef<'ul'>` | —            | All native list props pass through.                |

### AppLauncherList

Stacks `AppLauncherItem` children as full-width rows — the icon beside the app
name — the layout of the launcher's search results and recents. Long names end
in an ellipsis.

| Prop       | Type                             | Default      | Description                                          |
| ---------- | -------------------------------- | ------------ | ---------------------------------------------------- |
| `children` | `ReactNode`                      | — (required) | Rows to lay out, usually `AppLauncherItem` elements. |
| …          | `ComponentPropsWithoutRef<'ul'>` | —            | All native list props pass through.                  |

### AppLauncherItem

One app in the launcher: the name as the button's text — so the accessible
name is the visible label — with an optional icon. The surrounding container
decides the layout: inside `AppLauncherGrid` the item renders as a tile (icon
above the name), inside `AppLauncherList` as a row (icon beside the name);
standalone it falls back to the tile layout.

| Prop                | Type                                 | Default      | Description                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`             | `string`                             | — (required) | Name of the app; also the accessible name.                                                                                                                                                                                             |
| `icon`              | `ReactElement`                       | —            | Any element: a sized Fluent icon (`*32` for tiles, `*20` for rows) or a colorful logo; the item does not constrain its size.                                                                                                           |
| `disabled`          | `boolean`                            | `false`      | Renders the item disabled — muted name, dimmed icon, no activation, skipped by keyboard navigation; for apps an application disables from business rules.                                                                              |
| `disabledFocusable` | `boolean`                            | `false`      | Renders the item disabled but reachable: announced as disabled, kept in the tab order, never activating; the same muted look. When both are set, the Button's precedence applies — the item stays focusable and is announced disabled. |
| …                   | `ComponentPropsWithoutRef<'button'>` | —            | All native button props pass through (`onClick`, `className`, `aria-*`, ...).                                                                                                                                                          |

#### Composition patterns

- **Tiles for browsing, rows for scanning.** A typical panel mixes grids of
  tiles for pinned and all apps with lists of rows for search results and
  recents — the same item adapts to its container, section by section.
- **Icons are free-form.** Monochrome Fluent icons follow the item's text
  color, including the disabled color. Colorful logos are dimmed automatically
  while disabled: desaturated and faded to the lightness of the muted name.
- **Disabled items come from business rules.** `disabled` removes an app from
  keyboard navigation; `disabledFocusable` keeps a disabled app reachable for
  keyboard users. Both never activate.

### Loading

A transparent, centered filler for a region that has no content to cover: a
list that is still empty, a detail pane that is waiting for its record. The
filler draws a Fluent `Spinner` with a visible label, fills the available width
and height of its parent, and announces the label through a polite status
region. It holds no data and performs no I/O; the application decides when to
render it.

| Prop            | Type                                                    | Default     | Description                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`         | `string`                                                | `Loading…`  | Visible and announced message. A missing, empty or whitespace-only value falls back to the English default.                                                                                                       |
| `size`          | `SpinnerProps['size']`                                  | `'large'`   | Fluent spinner size.                                                                                                                                                                                              |
| `appearance`    | `SpinnerProps['appearance']`                            | `'primary'` | Fluent spinner appearance.                                                                                                                                                                                        |
| `labelPosition` | `SpinnerProps['labelPosition']`                         | `'below'`   | Placement of the visible label relative to the ring.                                                                                                                                                              |
| `delay`         | `number`                                                | `0`         | Milliseconds before both the status text and the indicator appear, so a fast response never flashes a loader. Negative, `NaN` and `Infinity` behave as `0`.                                                       |
| `minHeight`     | `number \| string`                                      | —           | Minimum block size for an otherwise empty parent. When defined it wins over `style.minHeight`; when omitted the caller's style passes through untouched.                                                          |
| …               | `ComponentPropsWithoutRef<'div'>` (minus managed attrs) | —           | All other native `div` props pass through; `className` and `style` merge and `ref` points at the root. `children`, `role`, `aria-live`, `aria-atomic` and `dangerouslySetInnerHTML` are managed by the component. |

```tsx
<Loading label="Loading the record…" />

<div style={{ height: 240 }}>
  <Loading label="Saving…" delay={300} minHeight={240} />
</div>
```

#### Composition patterns

- **Use it when there is nothing to cover.** When content already exists, use
  `LoadingOverlay` instead, so the content stays mounted and becomes inert
  rather than disappearing.
- **Let the parent own the height.** The root fills 100% of its parent; pass
  `minHeight` when an empty parent would otherwise collapse to zero height.
- **Delay fast operations.** A positive `delay` postpones the announcement as
  well as the visual, so neither flashes for a response that arrives quickly.
- **Localization is a prop.** `label` is a plain string; the package ships no
  resource files and only the English `Loading…` default. Pass a translated
  label at the call site.

#### Accessibility

The root is a single `role="status"` region with `aria-live="polite"` and
`aria-atomic="true"`. The announced text is a visually hidden copy of the
label; the visible spinner and its own label sit in an `aria-hidden` wrapper,
so assistive technology hears the label once. The visible label uses the theme
foreground color (`colorNeutralForeground1`), so it is readable on the page in
both light and dark themes. The status node mounts before its text, and the
delayed reveal changes the text in that existing region. The root is not
focusable and adds no motion beyond Fluent's spinner.

### LoadingOverlay

A region-scoped blocking overlay that keeps its children mounted. While
`loading` is true it waits for its delay (300 ms by default), then covers the
region with a theme-aware translucent veil and spinner, marks the content
`inert` and announces the label once. The veil uses
`colorNeutralBackgroundAlpha2` — white at 80% in the light theme, dark gray at
70% in the dark theme — and the visible label uses `colorNeutralForeground1`,
so the text stays readable on light and dark content. A response that settles
before the delay never flashes the overlay, and the content keeps its scroll
position, form state and focus context across a save or refresh.

The component is controlled: the application owns the boolean, the async work
and every side effect. The boolean can come from `useLoading().isLoading`,
`useTransition`, `useActionState`, a store or an existing `fetching` flag.

| Prop       | Type                                                    | Default      | Description                                                                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loading`  | `boolean`                                               | — (required) | Whether the covered operation is pending.                                                                                                                                                                                                                            |
| `children` | `ReactNode`                                             | — (required) | Content that stays mounted and becomes inert while the overlay is visible.                                                                                                                                                                                           |
| `label`    | `string`                                                | `Loading…`   | Visible and announced message. A missing, empty or whitespace-only value falls back to the English default.                                                                                                                                                          |
| `delay`    | `number`                                                | `300`        | Milliseconds before the scrim, spinner and status text appear. Negative, `NaN` and `Infinity` behave as `0`; a change applies to the next activation and never restarts a visible overlay.                                                                           |
| …          | `ComponentPropsWithoutRef<'div'>` (minus managed attrs) | —            | Other native `div` props pass through; `className` and `style` merge and `ref` points at the root. `aria-busy`, `aria-label`, `aria-labelledby`, `aria-live`, `aria-atomic`, `role`, `inert`, `tabIndex` and `dangerouslySetInnerHTML` are managed by the component. |

```tsx
<LoadingOverlay loading={isFetching} label="Loading records…">
  <DataGrid records={records} />
</LoadingOverlay>
```

#### Composition patterns

- **Existing state is enough.** Pass any boolean; the overlay does not know or
  care where it comes from. `useLoading` is an optional convenience for new
  async work, not a requirement.
- **Fast operations never flash.** Keep the default delay for saves and
  refreshes. Use `delay={0}` only when the operation is known to be slow, or
  when an immediate visual response is wanted.
- **The delay window is not blocked.** Interaction is blocked only while the
  overlay is visible. An application that must prevent a second submission
  disables its own trigger, for example with `isLoading` from `useLoading`.
- **Content stays mounted.** The overlay covers the region instead of replacing
  it, so a form keeps its values, a table keeps its scroll position and focus
  restoration has a target.
- **The guarantee is region-scoped.** Portaled descendants (for example a
  Fluent `MenuPopover`), fixed-position elements and content in a higher
  stacking context can paint and operate above the scrim. The overlay installs
  no global blocker and no portal; record the escape in the manual checklist
  when a region uses one.
- **Scope is the overlay root's box.** A 200×200 wrapper limits the scrim to
  200×200. The overlay root follows its content's height, so give it the
  container height when the content is shorter:

  ```tsx
  <div style={{ width: 200, height: 200 }}>
    <LoadingOverlay loading={loading} style={{ height: '100%' }}>
      <ShortContent />
    </LoadingOverlay>
  </div>
  ```

#### Accessibility

The content wrapper carries `aria-busy` from the first render, including the
delay window. The persistent polite status region is a sibling of that wrapper,
not a descendant, so its text change is announced while the region is busy.
The visual spinner is `aria-hidden`; the status is the single announcement.

When the overlay becomes visible it sets `inert` on the content wrapper, which
removes the covered content from the tab order and the accessibility tree, and
the scrim blocks pointer interaction. The scrim is a theme-aware translucent
veil rather than a dark dim; the visible label uses the theme foreground color,
which keeps normal-text contrast in both themes. The root has `tabIndex={-1}`,
is named by the persistent status node, and shows no focus ring. Focus moves to the root
only when it was inside the covered content (or the browser blurred that
element to the body); focus outside is never moved. When loading ends, focus
returns to the reveal-time element, then the loading-start element, only if the
component moved it and the target is still connected and focus is still on the
root or the body.

The content wrapper uses `display: contents` so it introduces no layout box.
If a supported browser fails to expose `aria-busy` on that wrapper, the
documented fallback is a normal wrapper with a recorded layout change; the
status announcement stays outside the wrapper either way.

### useLoading

A local controller for arbitrary async work: it removes the repetitive
`setBusy(true)` / `try` / `finally setBusy(false)` pattern, counts overlapping
operations, carries a per-operation label, returns the operation's value and
rethrows its error. It is a normal hook — it re-renders only the component that
calls it and connects to the loading components through ordinary props.

| Option  | Type     | Default | Description                                                                                                             |
| ------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `label` | `string` | —       | Default message when no active operation supplies one. A blank value means no default; the consumer applies `Loading…`. |

| Member      | Type                                                                                | Description                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `isLoading` | `boolean`                                                                           | True while at least one tracked operation is pending.                                                                                                        |
| `label`     | `string \| undefined`                                                               | The most recently started active labeled operation's label, else the non-blank default, else `undefined`. The consumer applies the visible English fallback. |
| `run`       | `<T>(operation: () => T \| Promise<T>, options?: { label?: string }) => Promise<T>` | Marks the operation active, invokes it, clears it in `finally`, resolves with its value and rejects with the same error. Stable across renders.              |

```tsx
function ActorDetails() {
  const { isLoading, label, run } = useLoading({ label: 'Please wait…' });
  const { catchError } = useSystemError();

  const save = () => run(() => api.saveActor(actorId), { label: 'Saving…' }).catch(catchError);

  return (
    <>
      <Button disabled={isLoading} onClick={save}>
        Save
      </Button>

      <LoadingOverlay loading={isLoading} label={label}>
        <ActorForm />
      </LoadingOverlay>
    </>
  );
}
```

#### Label policy

The reported label is the most recently started active **labeled** operation.
An unlabeled operation never suppresses a labeled one, even when it started
later. A blank per-operation label counts as no label; when no active operation
supplies one, the non-blank hook default applies; when that is also absent, the
hook reports `undefined` and the loading component applies `Loading…`. Active
operations are removed by id, so out-of-order settlement returns the label to
the operation that is still running.

#### Concurrency and lifecycle

Overlapping `run` calls are ref-counted: `isLoading` stays true until the last
one settles. A failed operation removes only its own entry, so a rejecting save
cannot cancel a concurrent load. `run` is referentially stable and safe in
dependency arrays. Calling it after unmount is safe: React ignores the state
update and the returned promise still settles; the hook never cancels the
operation.

#### Error handling

`run` never swallows an error. Return or catch the returned promise:

```tsx
const save = () => run(saveActor, { label: 'Saving…' }).catch(catchError);
```

or, inside an async handler:

```tsx
try {
  await run(saveActor);
} catch (error) {
  catchError(error);
}
```

A fire-and-forget call (`run(saveActor)` without `return` or `.catch`) can
produce an unhandled rejection; that responsibility stays with the caller.
Call `run` from event handlers or effects, not during render.

#### Decision table

| Situation                                                                                                      | Use                                                    |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| The application already owns a pending boolean (`useTransition`, `useActionState`, a store, a `fetching` flag) | `LoadingOverlay` with that boolean                     |
| New async work needs busy state and optional labels, and no other state owner exists                           | `useLoading`, passing its pair to `LoadingOverlay`     |
| A region has no content to cover                                                                               | `Loading`                                              |
| A region has content that should stay mounted while busy                                                       | `LoadingOverlay`                                       |
| A full-page or application-wide blocker                                                                        | Not provided by design; use a region-level composition |

#### Migration note

- `fetching ? <Loading /> : <Content />` becomes
  `<LoadingOverlay loading={fetching}><Content /></LoadingOverlay>`: the content
  stays mounted, keeps its scroll and form state, and becomes inert while busy.
- `setBusy(true); try { … } finally { setBusy(false); }` becomes
  `run(() => …)`, with the returned promise returned or caught.
- The legacy v8 props (`backgroundColor`, `styles`, `theme`, `type`,
  `ariaLive`) are intentionally not ported. The scrim and text follow the
  `FluentProvider` theme; `label` is the only user-facing string.

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
guards the package's public surface. Stories live in each component's
`stories/` folder (`*.stories.tsx`) and render in the repository's Storybook,
which is published to GitHub Pages.

New components follow the repository's component pattern. The local
`fluentui-components` skill (`.opencode/skills/fluentui-components`) documents
the pattern, the workflow and the definition of done, with templates for every
file.

## License

MIT © TrueSoftware B.V.
