# RD-02: SystemErrorProvider Component

> **Document**: RD-02-system-error-provider.md
> **Status**: Draft
> **Created**: 2026-10-16
> **Project**: fluentui-react-components
> **Depends On**: error-dialog/RD-01
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

`SystemErrorProvider` is the companion of the `ErrorDialog` component (RD-01): a provider the
application wraps around its tree once, plus a `useSystemError()` hook that reports errors from
anywhere — `catchError(error)` — while the provider holds the current error and renders the
dialog. It rebuilds the ergonomics of the legacy `makeSystemError` + `CustomErrorDialog`
mechanism as an explicit React provider. Fluent UI v9's toast facility (`Toaster` +
`useToastController`) is the shape precedent; this provider differs deliberately: it is
context-scoped, holds the state itself, and its hook throws outside the provider.

The provider is a convenience layer, not a policy layer: it never inspects errors for
authentication, never reloads, navigates, logs or transmits, and its global capture listeners
(`window` `error` and `unhandledrejection`) are opt-in and never suppress the events. All
behavior of the dialog itself — alert semantics, serialization, copy, strings, last-wins —
remains owned by RD-01.

---

## Functional Requirements

### Must Have (M)

- [ ] A `SystemErrorProvider` component that wraps the application subtree, holds one current
      error value, and renders exactly one controlled `ErrorDialog`; it adds no DOM of its own.
- [ ] A `useSystemError()` hook returning `{ catchError, clearError }`; using it outside the
      provider throws a descriptive error.
- [ ] `catchError(error, options?)` stores the value and opens the dialog; `options.kind`
      defaults to `"error"`; `options.detailsText` overrides the serialized details for that
      catch. Repeated calls replace the current error (last-wins).
- [ ] `clearError()` closes and clears the dialog; it is a no-op when nothing is shown.
- [ ] The dialog is constructed per variant, narrowed by `kind` (RD-01's union): the error
      variant receives `onDismiss={clearError}` and the provider-level `onReload`; the
      unauthorized variant receives a sign-out handler that first clears the error and then
      invokes the provider's `onSignOut` when it is defined. Clicking "Sign out" therefore always
      closes the dialog — a missing or throwing host handler can never leave the user in a
      blocking modal — and a `catchError` issued synchronously inside the host handler still wins
      (last-wins). The README documents that `kind: "unauthorized"` requires a real handler.
- [ ] Opt-in global capture: with `captureGlobalErrors` (default `false`), the provider registers
      `window` listeners for `error` (bubble phase) and `unhandledrejection`, catching
      `event.error ?? event.message` and `event.reason` as `kind="error"`; it never calls
      `preventDefault()`; listeners are effect-scoped and removed on unmount or when the flag
      turns off; no window access at import or render time (SSR-safe).
- [ ] Public exports: `SystemErrorProvider`, `useSystemError`, `SystemErrorProviderProps`,
      `CatchErrorOptions`; the package export-surface test is updated.
- [ ] A story set (catchError demos for both variants, a capture demo) and a package README
      section; a single capture-enabled provider per application is documented as the supported
      setup.
- [ ] Specification and implementation tests per the Verification section below.

### Should Have

- None — the confirmed scope fits Must Have and Won't Have.

### Won't Have (Out of Scope)

- Automatic unauthorized detection from error content — `kind` stays an explicit call-site
  decision (AR #4, inherited from RD-01).
- React error boundary / render-error capture — not selected; may become its own RD.
- Telemetry, logging, reporting, and console suppression — no `preventDefault()`, no new
  dependencies (AR #13, inherited).
- Error queueing or history — last-wins (AR #14, inherited).
- A module-level singleton access path — provider and hook only.
- Persistence of errors across reloads; multiple simultaneous dialogs; per-call string overrides
  (provider-level `strings` only).
- Capture of resource-loading errors — only the bubble-phase `error` listener is registered.

---

## Technical Requirements

### Component anatomy (M)

Following the repository pattern under `packages/react-components/`:

| File                                                                 | Role                                                            |
| -------------------------------------------------------------------- | --------------------------------------------------------------- |
| `src/components/SystemErrorProvider/SystemErrorProvider.tsx`         | Provider: state, context value, renders children + dialog       |
| `src/components/SystemErrorProvider/SystemErrorProvider.types.ts`    | Public prop and option types                                    |
| `src/components/SystemErrorProvider/SystemErrorContext.ts`           | Context object and its value type (internal)                    |
| `src/components/SystemErrorProvider/useSystemError.ts`               | Public hook (throws outside the provider)                       |
| `src/components/SystemErrorProvider/useGlobalErrorCapture.ts`        | Internal opt-in capture hook (listener lifecycle)               |
| `src/components/SystemErrorProvider/SystemErrorProvider.stories.tsx` | Story set                                                       |
| `src/components/SystemErrorProvider/index.ts`                        | Barrel                                                          |
| `packages/react-components/README.md`                                | Provider section + principles carve-out (holds transient state) |
| `test/system-error-provider.spec.test.tsx`                           | Contract tests derived from this RD                             |
| `test/system-error-provider.impl.test.tsx`                           | Internals (capture hook, listener lifecycle)                    |
| `test/system-error-provider.ssr.test.tsx`                            | Node-environment SSR smoke (import + `renderToString`)          |
| `test/package-exports.spec.test.ts`                                  | Extended export-surface list                                    |

### Public API (M)

```ts
export interface CatchErrorOptions {
  kind?: ErrorDialogKind; // default 'error'
  detailsText?: string; // verbatim details override for this catch
}

export interface SystemErrorProviderProps {
  children: React.ReactNode;
  onReload?: () => void; // passed to the dialog; adds the "Reload page" action
  onSignOut?: () => void; // invoked by the provider's sign-out wrapper for kind="unauthorized"
  strings?: Partial<ErrorDialogStrings>; // applied to every shown dialog
  captureGlobalErrors?: boolean; // default false
}

export function useSystemError(): {
  catchError: (error: unknown, options?: CatchErrorOptions) => void;
  clearError: () => void;
};
```

> **Decision per AR #16 / AR #17:** one `catchError` method with an options bag keeps the API
> small while preserving the explicit `kind` intent (AR #4); capture is opt-in so the library
> carries no policy by default.

### State and rendering flow (M)

- Internal state:
  `caught: { error: unknown; kind: ErrorDialogKind; detailsText?: string } | undefined`.
- `catchError` replaces the state value (last-wins); `clearError` resets it to `undefined`.
- Render: the context provider (value `{ catchError, clearError }`, memoized, stable callbacks)
  wraps the children and one `ErrorDialog`, constructed per variant by narrowing on `kind`
  (RD-01's discriminated union cannot accept a dynamic `kind` or cross-variant callbacks):
  - error variant: `open`, `error`, `kind="error"`, `detailsText`, `strings`,
    `onDismiss={clearError}`, `onReload`;
  - unauthorized variant: `open`, `error`, `kind="unauthorized"`, `detailsText`, `strings`,
    `onSignOut={handleSignOut}`, where `handleSignOut` clears the error first and then invokes
    the provider's `onSignOut` when it is defined.
- Shared props (`open`, `error`, `detailsText`, `strings`) are assembled once and spread into
  both branches so they cannot drift.
- The provider imports only React and the RD-01 component — no Fluent UI primitives directly.

### Global capture contract (M)

| Event                  | Listener                                           | Maps to                                    |
| ---------------------- | -------------------------------------------------- | ------------------------------------------ |
| `error` (bubble phase) | `window.addEventListener('error', handler)`        | `catchError(event.error ?? event.message)` |
| `unhandledrejection`   | `window.addEventListener('unhandledrejection', …)` | `catchError(event.reason)`                 |

- Always `kind: 'error'` — capture never infers the unauthorized variant.
- Never `preventDefault()` — console reporting and other listeners keep working.
- One effect keyed on `captureGlobalErrors`; cleanup removes both listeners; SSR-safe (no window
  access at import or render time).
- One capture-enabled provider per application is the documented setup (nested captures would
  render their own dialogs).
- The listener observes `window`-level reports, including React 19's own global reports for
  uncaught and recoverable render errors; it is not an error boundary (see Won't Have).

### Constraints (M)

- No new dependencies; the provider does not import Fluent UI directly.
- No own DOM; no import-time window access; no side effects inside the provider (no reload,
  navigation, logging, or network request).
- **Pattern exceptions (recorded):** the provider deliberately deviates from the house component
  anatomy — no Griffel styles file and no native pass-through (it renders no DOM of its own),
  and its state plus render live in the provider file; the capture logic is isolated in
  `useGlobalErrorCapture.ts`. The package README's principles wording is updated to carve out the
  provider (it holds transient application state), and the barrel additionally exports the hook
  and the two public types.
- Public API documented with doc comments; no references to plans, requirements or task IDs in
  code (repository rules).

### Verification (M)

- `test/system-error-provider.spec.test.tsx` derives directly from the Acceptance Criteria below
  and is the immutable oracle for what jsdom can observe. Synthetic `ErrorEvent` and
  `PromiseRejectionEvent` construct and dispatch in jsdom 30 (verified in the installed
  version); non-suppression is asserted with `cancelable: true` events so a stray
  `preventDefault()` would be detectable.
- Vitest's jsdom environment turns an `error` event carrying `error` into a run-level unhandled
  error when no user listener is registered (verified empirically), so capture-off and
  post-removal dispatches use a test-owned sink listener (registered and removed by the test) or
  message-only events. Listener removal itself is verified in the implementation test with
  `addEventListener` / `removeEventListener` spies — dispatch-based observation cannot
  distinguish a removed listener from a leaked one.
- `test/system-error-provider.impl.test.tsx` covers the capture hook internals and the listener
  lifecycle mechanics.
- `test/system-error-provider.ssr.test.tsx` runs in a node environment
  (`// @vitest-environment node`): importing the module and `renderToString`-rendering the
  provider must not throw (the SSR-safety channel).
- The package export-surface spec test lists exactly `DescriptionList`, `DescriptionListItem`,
  `ErrorDialog`, `SystemErrorProvider`, `useSystemError`.
- `pnpm verify` passes; `pnpm storybook:build` succeeds. The story set and the README section are
  part of the definition of done and reviewed (no pipeline check covers documentation content).

---

## Integration Points

### With ErrorDialog (RD-01)

Sole consumer: the provider constructs the controlled props per variant and never duplicates
dialog behavior. RD-01 is intentionally unchanged by this RD (its preflight pass stays valid);
the register annotation accompanying this RD supersedes RD-01's AR #1 wording about a future
provider and `blendsdk/react` as its home.

### With the application root

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

### With a future `blendsdk/react` package

May wrap or re-export the provider; capture remains the opt-in flag defined here.

---

## Scope Decisions

| Decision            | Options Considered                                                                   | Chosen                                                          | Rationale                                                                                          | AR Ref                     |
| ------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------- |
| Provider home       | this library · `blendsdk/react` later · app code                                     | this library as RD-02                                           | One wrapper + one call for adoption; RD-01 and its preflight pass untouched                        | AR #15                     |
| API shape           | single `catchError(options)` · separate `catchUnauthorized`                          | `catchError` + `clearError`                                     | One discoverable method; explicit `kind` preserved                                                 | AR #16                     |
| Capture policy      | off · opt-in flag · always-on                                                        | opt-in `captureGlobalErrors` (default off)                      | The library stays policy-free; apps opt in; existing monitoring unaffected                         | AR #17                     |
| Export surface      | provider + hook + 2 types · broader surface                                          | provider, hook, `SystemErrorProviderProps`, `CatchErrorOptions` | Smallest public commitment                                                                         | AR #18                     |
| Inherited contracts | —                                                                                    | RD-01 ARs #4, #7, #13, #14 honored                              | The provider adds convenience, not policy                                                          | RD-01 ARs #4, #7, #13, #14 |
| Sign-out completion | clear first + invoke handler · clear only after handler · downgrade to error variant | clear first, then invoke the handler (wrapper)                  | No trapped state; a missing or throwing handler cannot block the user; AR #5 affordances untouched | AR #19                     |

> **Traceability:** every decision above references its Ambiguity Register entry. See
> `00-ambiguity-register.md`.

---

## Security Considerations

- **Data sensitivity**: exposure stays local-only — details are rendered to the local user and
  copied only on request; capture additionally surfaces reports from any script on the page
  (including cross-origin message-only reports), nothing is transmitted, and state is in-memory
  only.
- **Input validation**: `catchError` accepts `unknown`; captured values flow into RD-01's wrapped
  serialization, so hostile values cannot crash the dialog. The capture handlers read only the
  documented event fields.
- **Authentication & authorization**: N/A — the provider performs no authentication; the
  unauthorized variant remains an explicit call-site decision.
- **Injection risks**: text-only rendering via RD-01; no HTML interpretation, no `eval`.
- **Non-suppression**: capture never calls `preventDefault()`, so application monitoring and the
  browser console continue to see errors — deliberately, to avoid masking failures.
- **Listener hygiene**: effect-scoped registration with cleanup; no listeners at import time; no
  duplicate handlers across re-renders.
- **Encryption / rate limiting / infrastructure**: N/A — client-side library code; nothing is
  stored or transmitted.
- **Security testing**: hostile captured values render per the RD-01 fallback rules — revoked
  `Proxy` → default no-details text, throwing accessors → `String(value)` — without throwing;
  `defaultPrevented` stays `false` on cancelable events; listener cleanup is asserted with
  `addEventListener` / `removeEventListener` spies.

---

## Acceptance Criteria

1. [ ] **Closed by default (and structure)**: the provider renders its children without
       introducing a wrapper element of its own; before any error is reported no `alertdialog`
       exists in the document.
2. [ ] **catchError opens**: a descendant calling `catchError(new Error("boom"))` renders exactly
       one `alertdialog` whose details contain `"name": "Error"` and `"message": "boom"` in
       2-space JSON.
3. [ ] **Dismiss clears**: activating `"Close"` closes the dialog; afterward a new `catchError`
       reopens it with the new value.
4. [ ] **clearError**: calling `clearError()` directly closes and clears; calling it with no
       error shown is a no-op and does not throw.
5. [ ] **Last-wins**: two `catchError` calls made before any interaction leave the dialog showing
       only the second error's details.
6. [ ] **Kind routing**: `catchError(e, { kind: "unauthorized" })` renders the sign-out-only
       variant; clicking `"Sign out"` calls the provider's `onSignOut` exactly once and closes
       the dialog; with no provider `onSignOut` the click still closes the dialog and throws
       nothing; an `onSignOut` that throws still leaves the dialog closed (the error propagates
       normally); a `catchError` called synchronously inside `onSignOut` leaves the dialog showing
       the re-entrant error. `kind` omitted or `"error"` renders `"Close"`, and `"Reload page"` exists only
       when the provider received `onReload`.
7. [ ] **detailsText per catch**: `catchError(e, { detailsText: "Support case 4711" })` shows
       exactly that text; a later plain `catchError` shows serialized details again (no stale
       override).
8. [ ] **Strings passthrough**: provider `strings` overrides render on every shown dialog while
       unset keys keep their English defaults.
9. [ ] **Hook misuse**: `useSystemError()` outside the provider throws an `Error` whose message
       names both `useSystemError` and `SystemErrorProvider`.
10. [ ] **Capture default off**: without `captureGlobalErrors`, dispatching a window `error` event
        and an `unhandledrejection` event opens nothing.
11. [ ] **Capture on — error events**: with `captureGlobalErrors`, a window `error` event
        (`ErrorEvent` carrying `error`) opens the dialog with that error serialized; when the
        event carries no `error`, the `message` is shown; the variant is `"error"` (no
        `"Sign out"` action).
12. [ ] **Capture on — rejections**: an `unhandledrejection` event opens the dialog with
        `event.reason` serialized; a rejection whose `reason` is `undefined` shows the default
        no-details text.
13. [ ] **No suppression**: after criteria 11 and 12 the dispatched events — constructed with
        `cancelable: true` so a suppression would be detectable — report
        `defaultPrevented === false`.
14. [ ] **Listener lifecycle**: turning `captureGlobalErrors` off stops capture (a subsequent
        dispatch opens nothing) and turning it back on re-registers; unmounting the provider also
        stops capture.
15. [ ] **Hostile captured values**: a revoked `Proxy` as a rejection reason renders the default
        no-details text; a reason whose serialization falls back (a value with a throwing
        accessor) renders `String(value)` (e.g. `[object Object]`) — both without throwing.
16. [ ] **No side effects**: across these flows the provider never calls `window.location.reload`
        and issues no `fetch`.
17. [ ] **Exports and gate**: the package root exports exactly `DescriptionList`,
        `DescriptionListItem`, `ErrorDialog`, `SystemErrorProvider`, `useSystemError`; the types
        `SystemErrorProviderProps` and `CatchErrorOptions` compile for imports; `pnpm verify`
        passes; `pnpm storybook:build` succeeds; the story set (both variants via `catchError`,
        plus a capture demo) and the README section are part of the definition of done and
        review-verified.
18. [ ] **SSR safety**: in a node environment, importing the module and rendering the provider to
        a string (the smoke test) does not throw.
