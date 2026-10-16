# ErrorDialog: error-dialog Implementation

> **Document**: 03-01-error-dialog.md
> **Parent**: [Index](00-index.md)

## Overview

`ErrorDialog` is one controlled component composed from first-party Fluent UI v9 primitives. It
renders a blocking alert dialog with the error details (serializable for the support workflow),
a copy control for those details, and the recovery actions of the selected variant. Behavior,
decisions and acceptance criteria are owned by
[RD-01](../../requirements/RD-01-error-dialog-component.md); this document owns the implementable
signatures, algorithms and wiring. Design choices below cite RD-01 sections; plan-local decisions
cite this plan's register (`AR #`).

## Architecture

### Current Architecture

`packages/react-components` follows one pattern per component: a `forwardRef` shell that calls a
state hook (which also resolves style classes) and hands the state to a pure render function —
see `src/components/DescriptionListItem/` for the reference implementation. No error surface
exists yet (`02-current-state.md`).

### Proposed Changes

A new component folder `src/components/ErrorDialog/` with the files below; the package barrel,
the export-surface spec test and the package README gain their entries. No existing component is
touched, and no dependency is added.

| File                             | Role                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `ErrorDialog.tsx`                | `forwardRef` shell: `useErrorDialog(props, ref)` → `renderErrorDialog(state)` |
| `ErrorDialog.types.ts`           | Public types (per RD-01 §Public API)                                          |
| `useErrorDialog.ts`              | State hook: default strings, details, copy state machine, surface props       |
| `renderErrorDialog.tsx`          | Pure render function                                                          |
| `useErrorDialogStyles.styles.ts` | Griffel `makeStyles` classes with Fluent tokens (static)                      |
| `serializeError.ts`              | Pure serialization helper (internal)                                          |
| `ErrorDialog.stories.tsx`        | Story set per RD-01 AC 18                                                     |
| `index.ts`                       | Folder barrel                                                                 |

## Implementation Details

### Interfaces

Public types are approved in RD-01 §Public API and exported only as `ErrorDialog`,
`ErrorDialogProps`, `ErrorDialogStrings`, `ErrorDialogKind` (AR #4). The internal interfaces
(the spec-test author's packet per AR #5):

```ts
// ErrorDialog.types.ts
export type ErrorDialogKind = 'error' | 'unauthorized';
export interface ErrorDialogStrings {
  title: string;
  subText: string;
  close: string;
  reload: string;
  signOut: string;
  detailsLabel: string;
  copy: string;
  copied: string;
  noDetails: string;
}
export type ErrorDialogProps = ErrorDialogErrorProps | ErrorDialogUnauthorizedProps; // per RD-01 §Public API

// serializeError.ts — pure, never throws (RD-01 §Details serialization)
export function serializeError(error: unknown): string | undefined;

// useErrorDialog.ts — house pattern: the hook owns state AND classes
/** English defaults for every key; resolved per key with the caller's overrides. */
export const errorDialogDefaultStrings: ErrorDialogStrings;
export type ErrorDialogState = {
  open: boolean;
  kind: ErrorDialogKind; // resolved; default 'error'
  strings: ErrorDialogStrings; // defaults overridden key-by-key where the override !== undefined
  details: string; // detailsText !== undefined ? detailsText : serializeError(error)
  detailsId: string; // useId() — associates the visible label with the textarea
  copyAvailable: boolean; // clipboard detected in a mount effect (hydration-safe)
  copied: boolean; // feedback flag (2000 ms)
  onCopy: () => void;
  onDismiss?: () => void; // passed through; undefined renders an inert action natively
  onReload?: () => void;
  onSignOut?: () => void;
  surfaceProps: ComponentPropsWithoutRef<'div'>; // native pass-through (caller wins)
  surfaceRef: Ref<HTMLDivElement>;
  classes: ErrorDialogClasses;
};
export function useErrorDialog(props: ErrorDialogProps, ref: Ref<HTMLDivElement>): ErrorDialogState;

// useErrorDialogStyles.styles.ts — static classes; called by the hook (house pattern)
export type ErrorDialogClasses = {
  surface: string;
  title: string;
  subText: string;
  detailsRow: string;
  detailsLabel: string;
  details: string;
  copyButton: string;
  actions: string;
};
export function useErrorDialogStyles(): ErrorDialogClasses;

// renderErrorDialog.tsx — pure; consumes only the state
export function renderErrorDialog(state: ErrorDialogState): ReactElement;
```

### Serialization algorithm

**Hook-side resolution** (`useErrorDialog`): `detailsText !== undefined` → use it verbatim;
`error == null` → resolved `strings.noDetails`; otherwise `details = serializeError(error)`.

**`serializeError` value paths** (pure; never throws; no string-table access):

1. `error` is a string → the string unchanged (including `''`).
2. Error-like — `instanceof Error`, or an object whose `name` and `message` are strings →
   structured object `{ name, message, stack?, ...ownEnumerable }` where `name`/`message`/`stack`
   are not duplicated by the spread, serialized with `JSON.stringify(structured, replacer, 2)`.
3. Any other value → the same replacer call; when the result is `undefined` (symbols and other
   unmapped values) → `String(error)`; a throw anywhere → `String(error)`.
4. Only if `String(error)` also throws, the serializer returns `undefined` and the hook maps
   that to the resolved `strings.noDetails` — the terminal guarantee, unreachable in practice.
5. Replacer: `bigint` → `String(value)`; function → `"[Function]"`; an object seen before →
   `"[Circular]"`. _Implementation note:_ the replacer and its `WeakSet` are created per
   `serializeError` call, so repeated serialization of the same value is stable (the impl test
   pins this); within one call a shared (non-circular) reference still renders `"[Circular]"`;
   error payloads are trees in practice and no criterion covers DAGs — the impl test pins that
   within-call behavior.

Implementation shape:

```ts
export function serializeError(error: unknown): string | undefined {
  const seen = new WeakSet<object>();
  const replacer = (_key: string, value: unknown): unknown => {
    if (typeof value === 'bigint') return String(value);
    if (typeof value === 'function') return '[Function]';
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  };

  // … the value paths 1–4 above, each wrapped by the fallback chain …
}
```

### Copy state machine (`useErrorDialog`)

| Event                     | Transition                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| mount                     | `copyAvailable = typeof navigator.clipboard?.writeText === 'function'` (mount effect; hydration-safe)                     |
| `onCopy()`                | capture `written = details`; `clipboard.writeText(written)`; on reject: do nothing (contained)                            |
| write resolves            | flip to `copied = true` **only if** `details` and `open` are unchanged since the capture; start/restart the 2000 ms timer |
| timer fires               | `copied = false`                                                                                                          |
| `details` changes / close | clear timer and `copied = false` immediately                                                                              |
| unmount                   | clear timer                                                                                                               |

"Unchanged since capture" is a capture-and-compare against refs for `details` and `open` — no
tokens or extra state. Repeated activations restart the timer (RD-01 §Copy behavior).

### Dialog structure and accessibility

- `<Dialog open={state.open} modalType="alert">` — no `onOpenChange` is wired (RD-01 §Dialog
  structure; verified alert/controlled semantics in `@fluentui/react-dialog` 9.18.5).
- `<DialogSurface {...state.surfaceProps} className={mergeClasses(classes.surface,
state.surfaceProps.className)} ref={state.surfaceRef}>` — native props spread, caller
  `className` merged last (caller wins), ref forwards to this element (RD-01 AC 19).
- `<DialogTitle className={classes.title}>` names the dialog (Fluent wires `aria-labelledby`).
- Body: `<p>` sub-text; a label row (`<Label htmlFor={detailsId}>` + subtle copy `Button`, only
  when `copyAvailable`); `<Textarea id={detailsId} readOnly rows={8} value={details}>`.
- Actions per variant: error → secondary `Reload page` only when `onReload` is defined, primary
  `Close`; unauthorized → primary `Sign out`, nothing else. Undefined handlers are passed
  through and are inert natively (RD-01 AC 16 runtime clause).

### Strings resolution

`resolveStrings(overrides?: Partial<ErrorDialogStrings>): ErrorDialogStrings` merges
`errorDialogDefaultStrings` with every override whose value `!== undefined` (key-by-key);
an override present as `''` is honored verbatim (RD-01 §Must Have / AC 12).

## Code Examples

```tsx
// Shell (ErrorDialog.tsx)
export const ErrorDialog = React.forwardRef<HTMLDivElement, ErrorDialogProps>((props, ref) => {
  const state = useErrorDialog(props, ref);
  return renderErrorDialog(state);
});
ErrorDialog.displayName = 'ErrorDialog';
```

```tsx
// Details binding (renderErrorDialog.tsx, excerpt)
<Label htmlFor={state.detailsId} className={state.classes.detailsLabel}>
  {state.strings.detailsLabel}
</Label>
<Textarea
  id={state.detailsId}
  className={state.classes.details}
  readOnly
  rows={8}
  value={state.details}
/>
```

## Error Handling

| Error Case                                       | Handling Strategy                                               | Ref                                                  |
| ------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------- |
| Plain `Error`                                    | Structured JSON with name/message/stack + own enumerable fields | RD-01 §Details serialization · (requirements AR #10) |
| Error-like object with throwing accessor         | Contained; falls back to `String(value)`                        | RD-01 AC 8                                           |
| Circular data                                    | `"[Circular]"` via the replacer                                 | RD-01 AC 8                                           |
| Unserializable / revoked Proxy                   | `String(value)` → `noDetails`; never throws                     | RD-01 AC 9                                           |
| Empty payload (`undefined`/`null`) or empty text | `strings.noDetails`; empty `detailsText` renders blank          | RD-01 AC 6/10                                        |
| Clipboard write rejects                          | Label unchanged; rejection contained                            | RD-01 AC 11                                          |
| Untyped consumer omits a required callback       | Action renders and is inert (`undefined` handler); never throws | RD-01 AC 16                                          |

> **Traceability:** behavior and criteria trace to RD-01; plan-local design decisions trace to
> `AR #` (this plan's register). The feature's requirements register is cited as
> "requirements AR #N".

## Testing Requirements

- Specification tests: all ST cases in [07-testing-strategy.md](07-testing-strategy.md) —
  written before implementation (immutable oracle).
- Implementation tests: serializer internals (shared-reference nuance within one call,
  repeat-serialization stability, stack-absent errors, key collisions), copy-timer mechanics,
  availability detection, and the class/token + 700 px checks (RD-01 AC 17b/17c).
- Story/manual: the literal Tab-cycle focus path runs in Storybook with the a11y addon
  (RD-01 §Verification).
