# RD-01: ErrorDialog Component

> **Document**: RD-01-error-dialog-component.md
> **Status**: Draft
> **Created**: 2026-10-16
> **Project**: fluentui-react-components
> **Depends On**: —
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

`ErrorDialog` is the surface a consuming application shows when an unexpected error occurred:
it informs the user, presents the raw error details for support, and offers the recovery
actions the host provides — close, reload, or sign out when the session expired.

The component is a controlled, side-effect-free rebuild of the `error` module from the legacy
`@blendsdk/fluentui` package (Fluent UI v8) and its `fui8` successor. In both earlier lives a
framework-owned store captured errors; the dialog presented them through callbacks. This RD
keeps that split — capture and storage stay app-side — and fixes the defects observed in the
legacy code: `Error` objects serialized as `{}`, a dismissal escape hatch on session-expired
errors, visibility tied to translation loading, and page reloads performed inside the component.

---

## Functional Requirements

### Must Have (M)

- [ ] A controlled `ErrorDialog` component: visibility follows the `open` prop; dismissal is a
      callback request to the host (`onDismiss`), never an internal state change.
- [ ] Blocking alert semantics: Escape and backdrop clicks cannot dismiss the dialog; only the
      rendered actions can. (Fluent UI v9 `modalType="alert"` with a controlled `open` prop.)
- [ ] Two variants selected by `kind`: `"error"` (default) renders primary Close and, when
      `onReload` is provided, secondary Reload page; `"unauthorized"` renders exactly one
      primary Sign out action and has no dismissal path.
- [ ] An always-visible, read-only, scrollable details area showing the serialized error value,
      with an accessible name from `strings.detailsLabel`.
- [ ] Defined error serialization (see Technical Requirements) covering `Error` instances,
      error-like objects, strings, arbitrary values, `undefined`/`null`, circular references and
      values that cannot be serialized; an optional `detailsText` prop overrides the result
      verbatim.
- [ ] A copy-details control that writes the displayed details to the clipboard and confirms
      with a temporary label change; it is only rendered when the Clipboard API is available.
- [ ] All visible text comes from `strings` overrides merged over English defaults; unset keys
      keep their defaults.
- [ ] Last-wins behavior: the component renders the single `error` value it is given; a changed
      value re-renders the details; no queue or history is kept.
- [ ] Accessibility: the dialog is an `alertdialog` named by its title; every interactive control
      has an accessible name; focus moves into the dialog when it opens and is trapped while
      open; the details value is selectable text.
- [ ] The component follows the repository's component pattern (types → hook → render → styles →
      story), is exported from the package root, and ships doc comments for its public API.
- [ ] Specification and implementation tests, including the updated package export-surface test,
      and a Storybook story set covering both variants, custom strings, long details and missing
      details.

### Should Have

- None — the confirmed scope fits Must Have and Won't Have.

### Won't Have (Out of Scope)

- Global error capture, a singleton store, and a provider — app/framework concern; a future
  `SystemErrorProvider` may live in `blendsdk/react` (AR #1).
- `code === 401` (or any HTTP) inspection inside the component — the host chooses `kind`
  explicitly (AR #4).
- Page reload, navigation, or logout performed inside the component — callbacks only (AR #7).
- A React error boundary (`ErrorBoundary`) — not selected during planning; may become its own RD.
- Telemetry / automatic error reporting (AR #13).
- Support reference ID and report-to-administrators mailto affordances (AR #8).
- Error queueing/history across multiple errors (AR #14).
- An i18n framework or built-in translation tables — strings via props only (AR #11).
- Error404/Error500-style status pages — application concern (legacy precedent).

---

## Technical Requirements

### Component anatomy (M)

Following the repository pattern under `packages/react-components/`:

| File                                                        | Role                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/components/ErrorDialog/ErrorDialog.tsx`                | `forwardRef` shell                                                 |
| `src/components/ErrorDialog/ErrorDialog.types.ts`           | Public prop and string contracts                                   |
| `src/components/ErrorDialog/useErrorDialog.ts`              | State hook (details text, copy feedback)                           |
| `src/components/ErrorDialog/renderErrorDialog.tsx`          | Pure render function                                               |
| `src/components/ErrorDialog/useErrorDialogStyles.styles.ts` | Griffel styles with Fluent tokens                                  |
| `src/components/ErrorDialog/serializeError.ts`              | Internal serialization helper (not exported from the package root) |
| `src/components/ErrorDialog/ErrorDialog.stories.tsx`        | Storybook stories                                                  |
| `src/components/ErrorDialog/index.ts`                       | Barrel                                                             |
| `test/error-dialog.spec.test.tsx`                           | Contract tests derived from this RD                                |
| `test/error-dialog.impl.test.tsx`                           | Internals (helper details, timers)                                 |
| `test/package-exports.spec.test.ts`                         | Extended export-surface list                                       |

### Public API (M)

```ts
export type ErrorDialogKind = 'error' | 'unauthorized';

export interface ErrorDialogStrings {
  title: string; // default: "Application error"
  subText: string; // default: "An unknown error has occurred in this application. Please notify the system administrators for further assistance."
  close: string; // default: "Close"
  reload: string; // default: "Reload page"
  signOut: string; // default: "Sign out"
  detailsLabel: string; // default: "Error details"
  copy: string; // default: "Copy details"
  copied: string; // default: "Copied"
  noDetails: string; // default: "No error details are available."
}

interface ErrorDialogBaseProps {
  open: boolean;
  error?: unknown;
  strings?: Partial<ErrorDialogStrings>;
  detailsText?: string;
}

interface ErrorDialogErrorProps extends ErrorDialogBaseProps {
  kind?: 'error';
  onDismiss: () => void; // required
  onReload?: () => void; // renders the secondary action when provided
  onSignOut?: () => void; // accepted for unified hosts; unused
}

interface ErrorDialogUnauthorizedProps extends ErrorDialogBaseProps {
  kind: 'unauthorized';
  onSignOut: () => void; // required at compile time
  onDismiss?: () => void; // accepted for unified hosts; unused
  onReload?: () => void; // accepted for unified hosts; unused
}

export type ErrorDialogProps = ErrorDialogErrorProps | ErrorDialogUnauthorizedProps;
```

> **Decision per AR #4:** the `kind` union makes the session-expired variant a deliberate host
> choice, and `onSignOut` a compile-time requirement for it. Callbacks that have no control in a
> variant remain accepted so a future provider can pass one unified callback set.

### Details serialization (M)

Given `error` and optional `detailsText`, the displayed details are computed in this order:

1. `detailsText` provided → used verbatim, `error` ignored.
2. `error` is `undefined` or `null` → `strings.noDetails`.
3. `error` is a string → the string unchanged.
4. `error` is error-like — an `Error` instance, or an object with string `name` and string
   `message` — → pretty-printed JSON (2-space indent) of an object containing `name`, `message`,
   `stack` (when present) and every own enumerable property not already included (e.g. `code`).
5. Any other value → pretty-printed JSON (2-space indent) when representable; otherwise
   `String(error)`; if that also throws → `strings.noDetails`.

Serialization is circular-safe: circular references render as `"[Circular]"`; `bigint` values
render in string form; function values render as `"[Function]"`; the whole step never throws.
The result is rendered as text only — the component never injects HTML.

> **Decision per AR #10:** fixes the legacy defects (`{}` for plain errors, crashes on circular
> or exotic values) while keeping an escape hatch for hosts that want full control.

### Copy behavior (M)

- Rendered only when `navigator.clipboard.writeText` is available (guarded for environments
  without the API).
- Activating it writes exactly the displayed details string.
- On success the label changes to `strings.copied` for 2000 ms and then reverts to
  `strings.copy`; repeated activations restart the timer.
- On a rejected write the label is unchanged and no unhandled rejection escapes.
- The timer is cleared on unmount and when the details change.

### Dialog structure, semantics and accessibility (M)

- Controlled Fluent v9 `Dialog` with `modalType="alert"` and the `open` prop; the component does
  not wire `onOpenChange`, so Escape and backdrop interactions cannot dismiss a controlled alert
  dialog (verified against `@fluentui/react-dialog` 9.18.5: `role="alertdialog"` for alert,
  backdrop handling only for `modalType="modal"`, and no state change for a controlled dialog).
- `DialogSurface` capped at `maxWidth: 700px`; the title styled with the danger color token
  (`tokens.colorPaletteRedForeground1`); all styling via Griffel `makeStyles` with Fluent
  `tokens` only — no literal colors.
- `DialogTitle` provides the accessible name; the details control is a read-only Fluent
  `Textarea` (about 8 text rows; longer content scrolls inside it) associated with a visible
  `Label` rendering `strings.detailsLabel`; actions are Fluent `Button`s (Close/Reload page:
  primary/secondary; Sign out: primary; copy control: subtle).
- Focus moves inside the dialog when it opens; focus remains trapped while open (Fluent
  `useModalAttributes` behavior); no custom focus logic.

### Constraints (M)

- No new dependencies: the component imports only from `@fluentui/react-components` and `react`
  (peers unchanged: `@fluentui/react-components ^9.0.0`, React 19).
- No import-time browser API access; the module must be safe to import without a DOM.
- No side effects: no reload, navigation, logout, logging, or network request on any path.
- Public API documented with doc comments; no references to plans, requirements or task IDs in
  code (repository rules).

### Verification (M)

- `test/error-dialog.spec.test.tsx` derives directly from the Acceptance Criteria below and is
  the immutable oracle for the contract; `test/error-dialog.impl.test.tsx` covers the internal
  serialization helper and copy-timer mechanics.
- The package export-surface spec test lists exactly `DescriptionList`, `DescriptionListItem`,
  `ErrorDialog`.
- `pnpm verify` (format check, skill check, type-check, build, tests) passes; `pnpm
storybook:build` succeeds.

---

## Integration Points

### With the package export surface

`ErrorDialog` and its public types (`ErrorDialogProps`, `ErrorDialogStrings`,
`ErrorDialogKind`) are exported from `packages/react-components/src/index.ts`; internal modules
(`serializeError`, hooks) are not. The runtime export-surface test is updated accordingly.

### With consuming applications

The host mounts the component where it renders the app shell, feeds it the current error value
and controls `open`; capture (global `error` listeners, API-layer pushes, future React root
`onUncaughtError` hooks) stays in the application.

### With a future framework provider (context, not part of this RD)

The prop contract is designed to be satisfiable by a future `SystemErrorProvider` in
`blendsdk/react` (the successor of the old `makeSystemError` + `CustomErrorDialog` mechanism):
one unified callback set (`onDismiss`, `onReload`, `onSignOut`) plus the error value and `kind`
maps directly onto the public API.

---

## Scope Decisions

| Decision                           | Options Considered                                              | Chosen                                 | Rationale                                                                        | AR Ref |
| ---------------------------------- | --------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------- | ------ |
| Component vs. full error mechanism | Dialog only · dialog + boundary · dialog + capture provider     | Dialog only                            | Capture is application policy; keeps the library pure (matches the v8 successor) | AR #1  |
| Component name                     | `ErrorDialog` · `SystemErrorDialog` · `AppErrorDialog`          | `ErrorDialog`                          | Legacy lineage; the community knows the name                                     | AR #3  |
| Unauthorized modeling              | `kind` union · `isUnauthorized` boolean · host-composed actions | `kind` union                           | Explicit host intent; `onSignOut` enforceable at compile time                    | AR #4  |
| Unauthorized dismissal             | Sign-out only · dismissible (legacy parity)                     | Sign-out only                          | Removes the legacy escape hatch that left users in a dead session                | AR #5  |
| Modal semantics                    | Alert (no Esc/backdrop) · standard modal                        | Alert                                  | Parity with the legacy blocking modal; an error must be acknowledged             | AR #6  |
| Reload execution                   | Callback only · fallback · built-in                             | Callback only                          | No side effects inside the component; host owns navigation                       | AR #7  |
| Extra affordances                  | Copy details · reference ID · mailto                            | Copy details only                      | Small, dependency-free support workflow; the others have no producer today       | AR #8  |
| Details presentation               | Always visible · expander · hidden                              | Always visible                         | Legacy parity; the support workflow needs the text visible                       | AR #9  |
| Details content                    | Serialization + override · error only · host string             | Serialization + `detailsText` override | Fixes legacy defects; hosts keep full control when needed                        | AR #10 |
| Strings model                      | Props + English defaults · required strings · built-in NL+EN    | Props + English defaults               | Localization without an i18n dependency; Fluent UI convention                    | AR #11 |
| Visual shape                       | Legacy parity · neutral                                         | Legacy parity (danger title, 700 px)   | The danger signal was a deliberate legacy choice users recognize                 | AR #12 |
| Telemetry                          | Out of scope · want it                                          | Out of scope                           | No backend; keeps the minimal support surface                                    | AR #13 |
| Multiple errors                    | Last-wins · queue/history                                       | Last-wins                              | The host controls what is shown; simpler contract                                | AR #14 |

> **Traceability:** every decision above references its Ambiguity Register entry. See
> `00-ambiguity-register.md`.

---

## Security Considerations

- **Data sensitivity**: error messages, names and stack traces may contain internal identifiers
  or fragments of data. They are rendered only to the user who experienced the error and are
  copied only by an explicit user action; the component stores nothing and transmits nothing.
- **Input validation**: there is no external input. The `error` value is typed `unknown` and is
  handled by the serialization rules above; no `eval`, no code execution, no property access
  beyond safe enumeration of own enumerable keys.
- **Authentication & authorization**: N/A — the component performs no authentication. The
  session-expired variant only _offers_ the host's sign-out callback; session handling stays in
  the application.
- **Injection risks**: XSS — all values are rendered as React text (or written to a read-only
  textarea); no `dangerouslySetInnerHTML`, no markup interpretation of error content; the
  clipboard receives plain text only.
- **Encryption needs**: N/A — nothing is stored or transmitted by the component.
- **Rate limiting**: N/A — no endpoints or network calls.
- **Infrastructure**: N/A — client-side library code; no secrets, no containers.
- **Security testing**: negative tests for the serialization rules ensure hostile or broken
  values (throwing getters, circular structures, unserializable values) cannot crash the dialog
  or leak beyond the intended text; tests assert no raw-HTML rendering and that clipboard
  failures are contained.

---

## Acceptance Criteria

1. [ ] **Closed state**: with `open={false}` no element with `role="alertdialog"` exists in the
       document, and no action callback has been called.
2. [ ] **Open state**: with `open={true}` and no string overrides, an `alertdialog` exists whose
       accessible name is `"Application error"`; the text `"An unknown error has occurred in
 this application. Please notify the system administrators for further assistance."` and
       the details label `"Error details"` are visible, and the details label is associated with
       the details control.
3. [ ] **Alert semantics**: with the dialog open in either variant, pressing Escape and clicking
       the backdrop leave the `alertdialog` in the document and call none of `onDismiss`,
       `onReload`, `onSignOut`; Tab from the last focusable element moves focus back inside the
       dialog (focus trap).
4. [ ] **Standard actions**: `kind` omitted or `"error"` renders a primary `"Close"` action and,
       only when `onReload` is provided, a secondary `"Reload page"` action; clicking Close calls
       `onDismiss` exactly once (no arguments) and not `onReload`; clicking Reload page calls
       `onReload` exactly once and not `onDismiss`; when `onReload` is omitted no reload action
       exists.
5. [ ] **Unauthorized actions**: `kind="unauthorized"` with `onSignOut` renders exactly one
       action, `"Sign out"`; clicking it calls `onSignOut` exactly once; no Close or Reload page
       action exists.
6. [ ] **Details for empty payload**: `error={undefined}` (or `null`) shows exactly `"No error
 details are available."`; the text follows a `strings.noDetails` override.
7. [ ] **Details for strings**: `error="backend offline"` shows exactly `backend offline`.
8. [ ] **Details for errors**: for an `Error` with a message, name and stack plus a custom
       enumerable `code: 401`, the details contain `"name"`, `"message"`, `"stack"` and
       `"code": 401` in 2-space JSON; for the same error with a circular reference in a custom
       property the details render `"[Circular]"` and no exception is thrown.
9. [ ] **Details for other values**: `{ status: 500, detail: "boom" }` renders as 2-space JSON;
       a value whose JSON serialization throws but `String()` works (an object with a throwing
       enumerable getter) shows `String(value)`; a value where both throw shows `"No error
 details are available."`.
10. [ ] **Details override**: with `detailsText="Support case 4711"` and `error={new Error()}`
        the details show exactly `Support case 4711`.
11. [ ] **Copy control**: when `navigator.clipboard.writeText` is present a control named
        `"Copy details"` is rendered; activating it writes exactly the displayed details string
        to the clipboard and renames the control to `"Copied"` for 2000 ms before it reverts; a
        rejected clipboard write leaves the name unchanged and produces no unhandled rejection;
        when the API is absent no copy control is rendered.
12. [ ] **String overrides**: passing `{ title: 'Applicatiefout', close: 'Sluiten',
detailsLabel: 'Foutdetails' }` renders exactly those texts while every unset key keeps
        its English default (e.g. the reload action still reads `"Reload page"`).
13. [ ] **Replacement**: rerendering the same open dialog with a different `error` shows the new
        serialized value and no trace of the previous one.
14. [ ] **No side effects**: across a full interaction cycle (open, copy, activate every action,
        press Escape, click the backdrop) `window.location.reload` is never called and the
        component issues no `fetch`.
15. [ ] **Package surface**: importing the package root yields exactly the runtime exports
        `DescriptionList`, `DescriptionListItem`, `ErrorDialog`; the types `ErrorDialogProps`,
        `ErrorDialogStrings`, `ErrorDialogKind` are exported; no internal module leaks.
16. [ ] **Type contract**: `kind="unauthorized"` without `onSignOut` fails `pnpm type-check`;
        `kind` omitted without `onDismiss` fails `pnpm type-check`; passing `onReload` or
        `onDismiss` alongside `kind="unauthorized"` compiles (the controls are simply not
        rendered).
17. [ ] **Theme and visual constraints**: the dialog renders without errors under both
        `webLightTheme` and `webDarkTheme`; the title resolves to the danger color token
        (`colorPaletteRedForeground1`) and no literal colors appear in the component sources;
        the dialog surface is capped at 700 px width.
18. [ ] **Quality gate**: `pnpm verify` passes; `pnpm storybook:build` succeeds; stories cover
        the standard variant, the unauthorized variant, custom (Dutch) strings, long details and
        missing details.
