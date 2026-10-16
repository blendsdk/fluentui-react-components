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
mechanism as an explicit React provider, following the Fluent UI v9
`ToastProvider` / `useToastController` pattern.

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
- [ ] The dialog receives `onDismiss={clearError}` and the provider-level `strings`, `onReload`
      and `onSignOut`; the unauthorized flow uses `catchError(e, { kind: "unauthorized" })`, and
      without a provider `onSignOut` the sign-out action is inert (the RD-01 runtime guard).
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

| File                                                                 | Role                                                        |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/components/SystemErrorProvider/SystemErrorProvider.tsx`         | Provider: state, context value, renders children + dialog   |
| `src/components/SystemErrorProvider/SystemErrorProvider.types.ts`    | Public prop and option types                                |
| `src/components/SystemErrorProvider/SystemErrorContext.ts`           | Context object and its value type (internal)                |
| `src/components/SystemErrorProvider/useSystemError.ts`               | Public hook (throws outside the provider)                   |
| `src/components/SystemErrorProvider/useGlobalErrorCapture.ts`        | Internal opt-in capture hook (listener lifecycle)           |
| `src/components/SystemErrorProvider/SystemErrorProvider.stories.tsx` | Story set                                                   |
| `src/components/SystemErrorProvider/index.ts`                        | Barrel                                                      |
| `packages/react-components/README.md`                                | Provider section: description, API table, composition notes |
| `test/system-error-provider.spec.test.tsx`                           | Contract tests derived from this RD                         |
| `test/system-error-provider.impl.test.tsx`                           | Internals (capture hook, listener lifecycle)                |
| `test/package-exports.spec.test.ts`                                  | Extended export-surface list                                |

### Public API (M)

```ts
export interface CatchErrorOptions {
  kind?: ErrorDialogKind; // default 'error'
  detailsText?: string; // verbatim details override for this catch
}

export interface SystemErrorProviderProps {
  children: React.ReactNode;
  onReload?: () => void; // passed to the dialog; adds the "Reload page" action
  onSignOut?: () => void; // passed to the dialog; used by kind="unauthorized"
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
  wraps the children and one `ErrorDialog` receiving `open={caught !== undefined}`,
  `error={caught?.error}`, `kind={caught?.kind}`, `detailsText={caught?.detailsText}`,
  `strings`, `onDismiss={clearError}`, `onReload`, `onSignOut`.
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

### Constraints (M)

- No new dependencies; the provider does not import Fluent UI directly.
- No own DOM; no import-time window access; no side effects inside the provider (no reload,
  navigation, logging, or network request).
- Public API documented with doc comments; no references to plans, requirements or task IDs in
  code (repository rules).

### Verification (M)

- `test/system-error-provider.spec.test.tsx` derives directly from the Acceptance Criteria below
  and is the immutable oracle for what jsdom can observe. Synthetic `ErrorEvent` and
  `PromiseRejectionEvent` construct and dispatch in jsdom 30 (verified in the installed
  version); `defaultPrevented` assertions cover non-suppression; listener cleanup is verified by
  dispatching after unmount or after the flag turns off.
- `test/system-error-provider.impl.test.tsx` covers the capture hook internals and the listener
  lifecycle mechanics.
- The package export-surface spec test lists exactly `DescriptionList`, `DescriptionListItem`,
  `ErrorDialog`, `SystemErrorProvider`, `useSystemError`.
- `pnpm verify` passes; `pnpm storybook:build` succeeds. The story set is part of the definition
  of done and reviewed.

---

## Integration Points

### With ErrorDialog (RD-01)

Sole consumer: the provider constructs the controlled props and never duplicates dialog behavior.
RD-01 is intentionally unchanged by this RD (its preflight pass stays valid).

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

| Decision            | Options Considered                                          | Chosen                                                          | Rationale                                                                   | AR Ref |
| ------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- | ------ |
| Provider home       | this library · `blendsdk/react` later · app code            | this library as RD-02                                           | One wrapper + one call for adoption; RD-01 and its preflight pass untouched | AR #15 |
| API shape           | single `catchError(options)` · separate `catchUnauthorized` | `catchError` + `clearError`                                     | One discoverable method; explicit `kind` preserved                          | AR #16 |
| Capture policy      | off · opt-in flag · always-on                               | opt-in `captureGlobalErrors` (default off)                      | The library stays policy-free; apps opt in; existing monitoring unaffected  | AR #17 |
| Export surface      | provider + hook + 2 types · broader surface                 | provider, hook, `SystemErrorProviderProps`, `CatchErrorOptions` | Smallest public commitment                                                  | AR #18 |
| Inherited contracts | —                                                           | RD-01 ARs #4, #7, #13, #14 honored                              | The provider adds convenience, not policy                                   | —      |

> **Traceability:** every decision above references its Ambiguity Register entry. See
> `00-ambiguity-register.md`.

---

## Security Considerations

- **Data sensitivity**: identical exposure to RD-01 — details are rendered to the local user and
  copied only on request; the provider transmits and stores nothing beyond its in-memory state.
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
- **Security testing**: hostile captured values (revoked `Proxy`, throwing accessors) render
  fallback text without throwing; `defaultPrevented` stays `false`; listener cleanup is asserted.

---

## Acceptance Criteria

1. [ ] **Closed by default**: the provider renders its children; before any error is reported no
       `alertdialog` exists in the document.
2. [ ] **catchError opens**: a descendant calling `catchError(new Error("boom"))` renders an
       `alertdialog` whose details contain `"name": "Error"` and `"message": "boom"` in 2-space
       JSON.
3. [ ] **Dismiss clears**: activating `"Close"` closes the dialog; afterward a new `catchError`
       reopens it with the new value.
4. [ ] **clearError**: calling `clearError()` directly closes and clears; calling it with no
       error shown is a no-op and does not throw.
5. [ ] **Last-wins**: two `catchError` calls made before any interaction leave the dialog showing
       only the second error's details.
6. [ ] **Kind routing**: `catchError(e, { kind: "unauthorized" })` renders the sign-out-only
       variant and clicking `"Sign out"` calls the provider's `onSignOut` exactly once; `kind`
       omitted or `"error"` renders `"Close"`, and `"Reload page"` exists only when the provider
       received `onReload`.
7. [ ] **detailsText per catch**: `catchError(e, { detailsText: "Support case 4711" })` shows
       exactly that text; a later plain `catchError` shows serialized details again (no stale
       override).
8. [ ] **Strings passthrough**: provider `strings` overrides render on every shown dialog while
       unset keys keep their English defaults.
9. [ ] **Hook misuse**: `useSystemError()` outside the provider throws a descriptive error.
10. [ ] **Capture default off**: without `captureGlobalErrors`, dispatching a window `error` event
        and an `unhandledrejection` event opens nothing.
11. [ ] **Capture on — error events**: with `captureGlobalErrors`, a window `error` event
        (`ErrorEvent` carrying `error`) opens the dialog with that error serialized; when the
        event carries no `error`, the `message` is shown; the variant is `"error"` (no
        `"Sign out"` action).
12. [ ] **Capture on — rejections**: an `unhandledrejection` event opens the dialog with
        `event.reason` serialized.
13. [ ] **No suppression**: after criteria 11 and 12 the dispatched events report
        `defaultPrevented === false`.
14. [ ] **Listener lifecycle**: turning `captureGlobalErrors` off stops capture (a subsequent
        dispatch opens nothing) and turning it back on re-registers; unmounting the provider also
        stops capture.
15. [ ] **Hostile captured value**: a revoked `Proxy` (or a value with a throwing accessor) as a
        rejection reason renders the fallback/no-details text without throwing.
16. [ ] **No side effects**: across these flows the provider never calls `window.location.reload`
        and issues no `fetch`.
17. [ ] **Exports and gate**: the package root exports exactly `DescriptionList`,
        `DescriptionListItem`, `ErrorDialog`, `SystemErrorProvider`, `useSystemError`; the types
        `SystemErrorProviderProps` and `CatchErrorOptions` compile for imports; `pnpm verify`
        passes; `pnpm storybook:build` succeeds; the story set (both variants via `catchError`,
        plus a capture demo) is part of the definition of done and review-verified.
