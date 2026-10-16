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
      `onReload` is provided, secondary Reload page; `"unauthorized"` renders Sign out as its
      only recovery action and has no dismissal path.
- [ ] An always-visible, read-only, scrollable details area showing the serialized error value,
      with an accessible name from `strings.detailsLabel`.
- [ ] Defined error serialization (see Technical Requirements) covering `Error` instances,
      error-like objects, strings, arbitrary values, `undefined`/`null`, circular references,
      functions, bigints and values that cannot be serialized; an optional `detailsText` prop
      overrides the result verbatim.
- [ ] A copy-details control in the details area (both variants) that writes the displayed
      details to the clipboard and confirms with a temporary label change; it renders only when
      the Clipboard API is available.
- [ ] All visible text comes from `strings` overrides merged over English defaults; unset keys
      keep their defaults, and a key present with an empty string is honored verbatim.
- [ ] Last-wins behavior: the component renders the single `error` value it is given; a changed
      value re-renders the details; no queue or history is kept.
- [ ] Accessibility: the dialog is an `alertdialog` named by its title; every interactive control
      has an accessible name; focus moves into the dialog when it opens and is trapped while
      open; the details value is selectable text.
- [ ] Runtime safety: action callbacks are invoked only when defined (an untyped consumer that
      omits one gets an inert action, never a crash); a hostile or broken `error` value can never
      make the dialog throw.
- [ ] Native props pass through to the dialog surface element and a forwarded ref points at it
      (repository component rules).
- [ ] The component follows the repository's component pattern (types → hook → render → styles →
      story → README section), is exported from the package root, and ships doc comments for its
      public API.
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
| `src/components/ErrorDialog/ErrorDialog.tsx`                | `forwardRef` shell (ref targets the dialog surface element)        |
| `src/components/ErrorDialog/ErrorDialog.types.ts`           | Public prop and string contracts                                   |
| `src/components/ErrorDialog/useErrorDialog.ts`              | State hook (details text, copy feedback)                           |
| `src/components/ErrorDialog/renderErrorDialog.tsx`          | Pure render function                                               |
| `src/components/ErrorDialog/useErrorDialogStyles.styles.ts` | Griffel styles with Fluent tokens                                  |
| `src/components/ErrorDialog/serializeError.ts`              | Internal serialization helper (not exported from the package root) |
| `src/components/ErrorDialog/ErrorDialog.stories.tsx`        | Storybook stories                                                  |
| `src/components/ErrorDialog/index.ts`                       | Barrel                                                             |
| `packages/react-components/README.md`                       | Component section: description, props table, composition notes     |
| `test/error-dialog.spec.test.tsx`                           | Contract tests derived from this RD                                |
| `test/error-dialog.impl.test.tsx`                           | Internals (helper details, timers, style/token wiring)             |
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

interface ErrorDialogBaseProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  open: boolean;
  error?: unknown;
  strings?: Partial<ErrorDialogStrings>;
  detailsText?: string;
}

interface ErrorDialogErrorProps extends ErrorDialogBaseProps {
  kind?: 'error';
  onDismiss: () => void; // required
  onReload?: () => void; // renders the secondary action when provided
}

interface ErrorDialogUnauthorizedProps extends ErrorDialogBaseProps {
  kind: 'unauthorized';
  onSignOut: () => void; // required at compile time
}

export type ErrorDialogProps = ErrorDialogErrorProps | ErrorDialogUnauthorizedProps;
```

- **Native pass-through:** the base props are the dialog surface element's props; they are spread
  onto the surface. `className` and `style` merge with the component's own classes/styles
  (caller wins), and `ref` forwards to the surface element (`HTMLDivElement`).
- **Callbacks:** `onDismiss`, `onReload` and `onSignOut` are invoked only when defined; for
  untyped consumers that bypass the types, a missing handler leaves its action visible but
  inert instead of throwing.

> **Decision per AR #4:** the `kind` union makes the session-expired variant a deliberate host
> choice, and `onSignOut` a compile-time requirement for it. A host or provider that serves both
> variants narrows the callback set by `kind` before constructing the props.

### Details serialization (M)

Given `error` and optional `detailsText`, the displayed details are computed in this order:

1. `detailsText !== undefined` → used verbatim (an empty string renders a blank details value),
   `error` ignored.
2. `error` is `undefined` or `null` → `strings.noDetails`.
3. `error` is a string → the string unchanged (including `""`).
4. `error` is error-like — an `Error` instance, or an object with string `name` and string
   `message` — → pretty-printed JSON (2-space indent) of an object containing `name`, `message`,
   `stack` (when present) and every own enumerable property not already included (e.g. `code`).
5. Any other value → `JSON.stringify(error, replacer, 2)`; if the result is `undefined` or
   serialization throws → `String(error)`; if that also throws → `strings.noDetails`.

The `replacer` maps `bigint` values to their decimal string form, function values to
`"[Function]"`, and circular references to `"[Circular]"` — at every depth, including the
top-level value. The serializer therefore produces defined output for every input class.

Every step executes host-provided code (property reads, `toJSON`, getters, `toString`), and every
such invocation is wrapped: when a value makes a step fail, the serializer falls through to
`String(error)`, and if that also throws the result is `strings.noDetails`. **The dialog never
throws because of the error value.** The result is rendered as text only — the component never
injects HTML.

> **Decision per AR #10:** fixes the legacy defects (`{}` for plain errors, crashes on circular
> or exotic values) while keeping an escape hatch for hosts that want full control.

### Copy behavior (M)

- The copy control lives in the details area and renders in both variants.
- Availability is detected in a mount effect (hydration-safe): after mount, when
  `navigator.clipboard.writeText` is available the control renders; otherwise it never appears.
- Activating it writes exactly the displayed details string.
- On success the label changes to `strings.copied` for 2000 ms and then reverts to
  `strings.copy`; repeated activations restart the timer.
- The label returns to `strings.copy` immediately whenever the displayed details change or the
  dialog closes; a write that settles after the details changed or after the dialog closed does
  not switch the label to `strings.copied`.
- On a rejected write the label is unchanged and no unhandled rejection escapes.
- The timer is cleared on unmount, on close, and when the details change.

### Dialog structure, semantics and accessibility (M)

- Controlled Fluent v9 `Dialog` with `modalType="alert"` and the `open` prop; the component does
  not wire `onOpenChange`, so Escape and backdrop interactions cannot dismiss a controlled alert
  dialog (verified against `@fluentui/react-dialog` 9.18.5: `role="alertdialog"` for alert,
  backdrop handling only for `modalType="modal"`, and no state change for a controlled dialog).
- `DialogSurface` carries the native pass-through props, is capped at `maxWidth: 700px`, and its
  title is styled with the danger color token (`tokens.colorPaletteRedForeground1`); all styling
  via Griffel `makeStyles` with Fluent `tokens` only — no literal colors.
- `DialogTitle` provides the accessible name; the details control is a read-only Fluent
  `Textarea` (about 8 text rows; longer content scrolls inside it) associated with a visible
  `Label` rendering `strings.detailsLabel`; actions are Fluent `Button`s (Close/Reload page:
  primary/secondary; Sign out: primary; copy control: subtle).
- Focus moves inside the dialog when it opens and the dialog applies Fluent's modal focus trap
  (`useModalAttributes`) while open; no custom focus logic. The literal Tab-cycle cannot be
  exercised in jsdom — it is verified in the Storybook story and a manual keyboard pass (see
  Verification).

### Constraints (M)

- No new dependencies: the component imports only from `@fluentui/react-components` and `react`
  (peers unchanged: `@fluentui/react-components ^9.0.0`, React 19).
- No import-time browser API access; the module must be safe to import without a DOM.
- No side effects: no reload, navigation, logout, logging, or network request on any path.
- Public API documented with doc comments; no references to plans, requirements or task IDs in
  code (repository rules).

### Verification (M)

- `test/error-dialog.spec.test.tsx` derives directly from the Acceptance Criteria below and is
  the immutable oracle for every criterion the jsdom test environment can observe;
  `test/error-dialog.impl.test.tsx` covers the internal serialization helper, style/token wiring
  and copy-timer mechanics. Criteria verified by another channel state that channel explicitly.
- The compile-time contract (criterion 16) is verified with `// @ts-expect-error` annotations on
  the invalid usages in the spec test: if the expected error stops occurring, the unused
  directive fails `pnpm type-check`.
- jsdom techniques for the implementer: observe the reload guard with
  `vi.stubGlobal('location', { reload: vi.fn() })` (spying on `window.location.reload` throws in
  jsdom); stub the clipboard with `Object.defineProperty(navigator, 'clipboard', …)` (jsdom
  provides none); drive the copy-feedback timer with Vitest fake timers.
- Criteria that jsdom cannot observe: the focus-trap cycle (no layout; verified in the Storybook
  story and a manual keyboard pass, per the repository's testing guidance for portaled surfaces)
  and the visual/token checks (verified through the implementation test's class/token assertions
  and review — `getComputedStyle` cannot resolve `var()` tokens in jsdom).
- The package export-surface spec test lists exactly `DescriptionList`, `DescriptionListItem`,
  `ErrorDialog`.
- `pnpm verify` (format check, skill check, type-check, build, tests) passes; `pnpm
storybook:build` succeeds. The README section is verified by review — no pipeline check covers
  documentation content.

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
the provider supplies the error value, `kind`, and the callback set for that kind — narrowing by
`kind` before constructing the props.

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
>
> **Preflight:** PF-001–PF-014 (see `00-preflight-report-RD-01.md`) amended the focus-verification
> channel, the serialization containment guarantee and precision, the copy-feedback state
> machine, the public API (native pass-through, ref target, removal of unused cross-variant
> callbacks) and criteria 3, 5, 8–12, 16–19.

---

## Security Considerations

- **Data sensitivity**: error messages, names and stack traces may contain internal identifiers
  or fragments of data. They are rendered only to the user who experienced the error and are
  copied only by an explicit user action; the component stores nothing and transmits nothing.
- **Input validation**: there is no external input. The `error` value is typed `unknown` and is
  handled by the serialization rules above; the component performs no `eval`, `Function`
  construction, or dynamic script execution. Value-controlled accessors (`toJSON`, `toString`,
  enumerable getters) are executed by design when rendering the details, and every such
  invocation is contained by the wrapped fallback chain, so a hostile value cannot crash the
  dialog or escape as anything but text.
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
  values (throwing getters and accessors, revoked proxies, circular structures, unserializable
  values) cannot crash the dialog or leak beyond the intended text; tests assert no raw-HTML
  rendering and that clipboard failures are contained.

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
       `onReload`, `onSignOut`; immediately after opening, focus is inside the dialog.
4. [ ] **Standard actions**: `kind` omitted or `"error"` renders a primary `"Close"` action and,
       only when `onReload` is provided, a secondary `"Reload page"` action; clicking Close calls
       `onDismiss` exactly once (no arguments) and not `onReload`; clicking Reload page calls
       `onReload` exactly once and not `onDismiss`; when `onReload` is omitted no reload action
       exists.
5. [ ] **Unauthorized actions**: `kind="unauthorized"` with `onSignOut` renders exactly one
       recovery action, `"Sign out"`; clicking it calls `onSignOut` exactly once; no Close or
       Reload page action exists. (The copy control of the details area may also be present —
       see criterion 11.)
6. [ ] **Details for empty payload**: `error={undefined}` (or `null`) shows exactly `"No error
 details are available."`; the text follows a `strings.noDetails` override.
7. [ ] **Details for strings**: `error="backend offline"` shows exactly `backend offline`.
8. [ ] **Details for errors**: for an `Error` with a message, name and stack plus a custom
       enumerable `code: 401`, the details contain `"name"`, `"message"`, `"stack"` and
       `"code": 401` in 2-space JSON; for the same error with a circular reference in a custom
       property the details render `"[Circular]"` and no exception is thrown; an error-like
       object whose `name` or `message` accessor throws renders `String(value)` (e.g.
       `[object Object]` for a plain object) and never throws.
9. [ ] **Details for other values**: `{ status: 500, detail: "boom" }` renders as 2-space JSON;
       a top-level function renders the JSON text `"[Function]"` and a `1n` bigint renders `"1"`;
       a value whose JSON serialization throws but `String()` works (an object with a throwing
       enumerable getter) shows `String(value)`; a value where both throw shows the default
       no-details text; a revoked `Proxy` renders the default no-details text and never throws.
10. [ ] **Details override**: with `detailsText="Support case 4711"` and `error={new Error()}`
        the details show exactly `Support case 4711`; `detailsText=""` (present but empty)
        renders a blank details value, suppressing the serialized error.
11. [ ] **Copy control**: after mount, when `navigator.clipboard.writeText` is present a control
        named `"Copy details"` is rendered; activating it writes exactly the displayed details
        string to the clipboard and renames the control to `"Copied"` for 2000 ms before it
        reverts; a rejected clipboard write leaves the name unchanged and produces no unhandled
        rejection; when the API is absent no copy control is rendered. While `"Copied"` is shown,
        replacing `error` or closing the dialog resets the control to `"Copy details"`; a write
        that settles after the details changed or after the dialog closed does not rename the
        control.
12. [ ] **String overrides**: with `kind` omitted and `onReload` provided, passing
        `{ title: 'Applicatiefout', close: 'Sluiten', detailsLabel: 'Foutdetails' }` renders
        exactly those texts while every unset key keeps its English default (e.g. the reload
        action still reads `"Reload page"`); a key present with an empty string (e.g.
        `{ subText: '' }`) suppresses that text instead of falling back to the default.
13. [ ] **Replacement**: rerendering the same open dialog with a different `error` shows the new
        serialized value and no trace of the previous one.
14. [ ] **No side effects**: across a full interaction cycle (open, copy, activate every action,
        press Escape, click the backdrop) `window.location.reload` is never called and the
        component issues no `fetch`.
15. [ ] **Package surface**: importing the package root yields exactly the runtime exports
        `DescriptionList`, `DescriptionListItem`, `ErrorDialog`; the types `ErrorDialogProps`,
        `ErrorDialogStrings`, `ErrorDialogKind` are exported; no internal module leaks.
16. [ ] **Type and runtime contract**: `kind="unauthorized"` without `onSignOut` fails `pnpm
 type-check`; `kind` omitted without `onDismiss` fails `pnpm type-check` (both verified with
        `// @ts-expect-error` annotations in the spec test). For untyped consumers bypassing the
        types, rendering `kind="unauthorized"` without `onSignOut` renders `"Sign out"` and
        activating it throws nothing (the action is inert).
17. [ ] **Theme and visual constraints**: (a) the dialog renders without errors under both
        `webLightTheme` and `webDarkTheme` (spec/impl test); (b) the styles module references the
        danger token `tokens.colorPaletteRedForeground1` for the title and contains no literal
        colors (impl/source check, confirmed by review); (c) the dialog surface's computed
        maximum width is `700px` (impl test).
18. [ ] **Quality gate**: `pnpm verify` passes; `pnpm storybook:build` succeeds. The story set —
        standard variant, unauthorized variant, custom (Dutch) strings, long details, missing
        details, and a focus/keyboard pass — is part of the definition of done and verified by
        review, not by the spec test.
19. [ ] **Native pass-through and ref**: `className` and `style` passed to the dialog merge onto
        the dialog surface element alongside the component's own, other native props
        (`data-*`, `aria-*`, event handlers) are spread onto it, and a forwarded `ref` points at
        it.
