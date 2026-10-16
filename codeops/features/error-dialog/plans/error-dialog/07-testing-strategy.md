# Testing Strategy: ErrorDialog

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

Coverage is expressed as "every criterion verified in its recorded channel" (AR #6) — the repo
configures no numeric threshold:

| Code type                                | Target                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Component contract (spec tests)          | every jsdom-observable RD-01 acceptance criterion (1–16, 17a, 19)                                 |
| Serializer and copy state machine (impl) | every internal path of `03-01 §Serialization algorithm` / §Copy state machine                     |
| Token/style checks                       | RD-01 AC 17b/17c via implementation checks plus review                                            |
| Focus-trap cycle and story set           | Storybook keyboard/a11y pass and review (RD-01 §Verification)                                     |
| Provider contract (spec tests)           | every jsdom-observable RD-02 acceptance criterion (ST-33…ST-52)                                   |
| Provider internals and SSR safety        | capture-hook listener spies and memoization (RD-02 §Verification); node-environment smoke (ST-53) |

- Test names state behavior: `should [expected behavior] when [condition]`.
- **Integration tests**: N/A — the component has no integration surface beyond its own mount
  inside `FluentProvider`; there is nothing to integrate with.
- **E2E tests**: N/A — the repository has no browser harness, and the single jsdom-blind aspect
  (the focus-trap cycle) uses the repository's prescribed Storybook/manual pass instead of new
  infrastructure (RD-01 §Verification; preflight PF-001); provider listener-removal mechanics use
  implementation-test spies (RD-02 §Verification).

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

> Derived exclusively from RD-01 (acceptance criteria, the owning requirements doc) and
> `03-01-error-dialog.md` (implementable signatures). Expectations are the specification's, never
> imagined implementation behavior. The immutable-oracle rule applies: a failing spec test means
> the implementation is wrong.

| #     | Input / Scenario                                                                                        | Expected Output / Behavior                                                                                                                                           | Source       |
| ----- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| ST-01 | Render with `open={false}`                                                                              | No element with `role="alertdialog"` exists; no action callback has been called                                                                                      | RD-01 AC 1   |
| ST-02 | Render `open` with defaults (`kind` omitted, no strings overrides)                                      | An `alertdialog` whose accessible name is `"Application error"`; the default sub-text is visible; the label `"Error details"` is associated with the details control | RD-01 AC 2   |
| ST-03 | With the dialog open, press Escape; then click the backdrop                                             | The `alertdialog` remains in the document; `onDismiss`, `onReload`, `onSignOut` are not called                                                                       | RD-01 AC 3   |
| ST-04 | Render `open`                                                                                           | Immediately after opening, `document.activeElement` is inside the `alertdialog`                                                                                      | RD-01 AC 3   |
| ST-05 | `kind="error"` with `onDismiss` + `onReload`; click the `"Close"` action                                | `onDismiss` called exactly once with no arguments; `onReload` not called                                                                                             | RD-01 AC 4   |
| ST-06 | `kind="error"` with `onDismiss` + `onReload`; click the `"Reload page"` action                          | `onReload` called exactly once; `onDismiss` not called                                                                                                               | RD-01 AC 4   |
| ST-07 | `kind="error"` without `onReload`                                                                       | No `"Reload page"` action is rendered                                                                                                                                | RD-01 AC 4   |
| ST-08 | `kind="unauthorized"` with `onSignOut`; click the `"Sign out"` action                                   | `onSignOut` called exactly once; no `"Close"` or `"Reload page"` action exists                                                                                       | RD-01 AC 5   |
| ST-09 | `error={undefined}` (default strings), then with a `strings.noDetails` override                         | Details show exactly `"No error details are available."`, then exactly the override text                                                                             | RD-01 AC 6   |
| ST-10 | `error="backend offline"`                                                                               | Details show exactly `backend offline`                                                                                                                               | RD-01 AC 7   |
| ST-11 | An `Error` with name/message/stack and a custom enumerable `code: 401`                                  | Details contain `"name"`, `"message"`, `"stack"` and `"code": 401` in 2-space JSON                                                                                   | RD-01 AC 8   |
| ST-12 | The same error with a circular reference in a custom property                                           | Details render `"[Circular]"`; no exception is thrown                                                                                                                | RD-01 AC 8   |
| ST-13 | Error-like `{ name: 'X', get message() { throw … } }`                                                   | Details show `String(value)` (e.g. `[object Object]`); no exception is thrown                                                                                        | RD-01 AC 8   |
| ST-14 | `error={{ status: 500, detail: 'boom' }}`                                                               | Details render as 2-space JSON                                                                                                                                       | RD-01 AC 9   |
| ST-15 | `error` is a function; `error` is `1n`                                                                  | Details render `"[Function]"`; details render `"1"`                                                                                                                  | RD-01 AC 9   |
| ST-16 | An object with a throwing enumerable getter (JSON throws, `String()` works)                             | Details show `String(value)`                                                                                                                                         | RD-01 AC 9   |
| ST-17 | An object whose JSON serialization and `String()` both throw                                            | Details show the default no-details text                                                                                                                             | RD-01 AC 9   |
| ST-18 | A revoked `Proxy`                                                                                       | Details show the default no-details text; no exception is thrown                                                                                                     | RD-01 AC 9   |
| ST-19 | `detailsText="Support case 4711"` with `error={new Error()}`                                            | Details show exactly `Support case 4711`                                                                                                                             | RD-01 AC 10  |
| ST-20 | `detailsText=""` with a non-empty `error`                                                               | Details render a blank value; the serialized error is suppressed                                                                                                     | RD-01 AC 10  |
| ST-21 | Clipboard stubbed; activate `"Copy details"`; advance 2000 ms                                           | `writeText` received exactly the displayed details; the control reads `"Copied"`, then `"Copy details"` after 2000 ms (fake timers)                                  | RD-01 AC 11  |
| ST-22 | Clipboard stub rejects                                                                                  | The control name is unchanged; no unhandled rejection escapes                                                                                                        | RD-01 AC 11  |
| ST-23 | Clipboard absent after mount                                                                            | No copy control is rendered                                                                                                                                          | RD-01 AC 11  |
| ST-24 | `"Copied"` shown; replace `error` / close the dialog; and a write settling late                         | The control resets to `"Copy details"`; the late write does not rename it                                                                                            | RD-01 AC 11  |
| ST-25 | Dutch partial overrides and one empty-string override                                                   | Exactly the overridden texts; unset keys keep English defaults; the empty key suppresses its text                                                                    | RD-01 AC 12  |
| ST-26 | Rerender the open dialog with a different `error`                                                       | Details show the new serialized value with no trace of the previous one                                                                                              | RD-01 AC 13  |
| ST-27 | Full interaction cycle (open, copy, actions, Escape, backdrop) with stubs                               | `window.location.reload` is never called; no `fetch` is issued                                                                                                       | RD-01 AC 14  |
| ST-28 | Import the package root                                                                                 | Runtime exports are exactly `DescriptionList`, `DescriptionListItem`, `ErrorDialog`; the three public types compile for import                                       | RD-01 AC 15  |
| ST-29 | `@ts-expect-error` cases: `kind="unauthorized"` without `onSignOut`; `kind` omitted without `onDismiss` | `pnpm type-check` reports exactly those errors (an unused directive fails the gate — the regression signal)                                                          | RD-01 AC 16  |
| ST-30 | Untyped consumer (cast) renders `kind="unauthorized"` without `onSignOut`; click `"Sign out"`           | Nothing throws; the action is inert                                                                                                                                  | RD-01 AC 16  |
| ST-31 | Render under `webLightTheme` and under `webDarkTheme`                                                   | No errors; the `alertdialog` renders and remains accessible in both                                                                                                  | RD-01 AC 17a |
| ST-32 | Pass `className`, `style`, `data-testid` and a ref                                                      | Class and style merge onto the dialog surface; the data attribute lands on it; the ref points at the surface element                                                 | RD-01 AC 19  |
| ST-33 | Provider rendered with children                                                                         | Children render with no wrapper element around them; no `alertdialog` exists                                                                                         | RD-02 AC 1   |
| ST-34 | `catchError(new Error("boom"))` from a descendant                                                       | Exactly one `alertdialog`; details contain `"name": "Error"` and `"message": "boom"` in 2-space JSON                                                                 | RD-02 AC 2   |
| ST-35 | Activate `"Close"`; then `catchError` again                                                             | The dialog closes; the new call reopens it with the new value                                                                                                        | RD-02 AC 3   |
| ST-36 | `clearError()` with a shown error; then with none                                                       | First closes and clears; the second is a no-op and does not throw                                                                                                    | RD-02 AC 4   |
| ST-37 | Two `catchError` calls before interaction                                                               | Only the second error's details are shown                                                                                                                            | RD-02 AC 5   |
| ST-38 | `catchError(e, { kind: "unauthorized" })` with provider `onSignOut`; click `"Sign out"`                 | Sign-out-only variant; `onSignOut` called exactly once; the dialog closes                                                                                            | RD-02 AC 6   |
| ST-39 | The same without provider `onSignOut`; click `"Sign out"`                                               | The dialog closes; nothing throws                                                                                                                                    | RD-02 AC 6   |
| ST-40 | Provider `onSignOut` throws; click `"Sign out"`                                                         | The click throws (the error propagates) and the dialog is closed                                                                                                     | RD-02 AC 6   |
| ST-41 | `onSignOut` calls `catchError` synchronously                                                            | The dialog shows the re-entrant error (last-wins)                                                                                                                    | RD-02 AC 6   |
| ST-42 | `catchError(e, { detailsText: "Support case 4711" })`; then a plain `catchError`                        | First shows exactly the override; the second shows serialized details again                                                                                          | RD-02 AC 7   |
| ST-43 | Provider `strings` partial (Dutch sample)                                                               | Overridden texts everywhere; unset keys keep English defaults                                                                                                        | RD-02 AC 8   |
| ST-44 | `useSystemError()` outside the provider                                                                 | Throws an `Error` naming `useSystemError` and `SystemErrorProvider`                                                                                                  | RD-02 AC 9   |
| ST-45 | `captureGlobalErrors` omitted; dispatch `error` (sink listener / message-only) and `unhandledrejection` | Nothing opens                                                                                                                                                        | RD-02 AC 10  |
| ST-46 | `captureGlobalErrors`; dispatch a `cancelable` `ErrorEvent` with `error`; then one with message only    | Dialog opens with the error serialized; the message-only event shows the message; variant is `"error"` (no `"Sign out"`)                                             | RD-02 AC 11  |
| ST-47 | Dispatch `unhandledrejection` with a reason; then with `reason: undefined`                              | Reason serialized; the second shows the default no-details text                                                                                                      | RD-02 AC 12  |
| ST-48 | After ST-46/ST-47                                                                                       | The dispatched (cancelable) events report `defaultPrevented === false`                                                                                               | RD-02 AC 13  |
| ST-49 | Toggle `captureGlobalErrors` off; dispatch; back on; dispatch                                           | Off: nothing opens; on: the dialog opens again                                                                                                                       | RD-02 AC 14  |
| ST-50 | Rejection reasons: revoked `Proxy`; an object with a throwing accessor                                  | Default no-details text; `String(value)` (e.g. `[object Object]`); nothing throws                                                                                    | RD-02 AC 15  |
| ST-51 | Full flow with `location` and `fetch` stubs                                                             | `window.location.reload` never called; no `fetch` issued                                                                                                             | RD-02 AC 16  |
| ST-52 | Import the package root                                                                                 | Runtime exports exactly the five names; `SystemErrorProviderProps` and `CatchErrorOptions` compile for import                                                        | RD-02 AC 17  |
| ST-53 | Node environment (`// @vitest-environment node`): import + `renderToString`                             | Does not throw                                                                                                                                                       | RD-02 AC 18  |

> ST-29's expectation is enforced by `pnpm type-check`, not the Vitest run; the directives live in
> the spec file so the gate catches contract regressions. ST-03's Escape/backdrop clauses run in
> jsdom; the literal Tab-cycle trap is **not** an ST case — it runs in the Storybook keyboard pass
> (RD-01 §Verification).
>
> Provider cases: ST-45 and ST-49's negative dispatches use the recorded sink-listener or
> message-only technique (Vitest's jsdom environment turns an unhandled `error` event into a
> run-level failure); ST-53 lives in the node-environment file; provider listener-removal
> mechanics are verified in the implementation test with `addEventListener` /
> `removeEventListener` spies (RD-02 §Verification).

## Test Categories

### Specification Tests (from the ST cases)

> Written BEFORE implementation. Filed as `packages/react-components/test/error-dialog.spec.test.tsx`
> (export-list case: `test/package-exports.spec.test.ts`, extended).

| Test File                                  | ST Cases Covered                          | Component             |
| ------------------------------------------ | ----------------------------------------- | --------------------- |
| `test/error-dialog.spec.test.tsx`          | ST-01 – ST-27, ST-29, ST-30, ST-31, ST-32 | `ErrorDialog`         |
| `test/system-error-provider.spec.test.tsx` | ST-33 – ST-51                             | `SystemErrorProvider` |
| `test/package-exports.spec.test.ts`        | ST-28, ST-52                              | package barrel        |

### Implementation Tests (edge cases, internals)

> Written AFTER implementation. Filed as `test/error-dialog.impl.test.tsx`.

| Test File                         | Description                                                                                                                                                                                                                                                                                                                                                                                                | Priority |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `test/error-dialog.impl.test.tsx` | Serializer internals: shared (non-circular) reference renders `"[Circular]"` per the chosen WeakSet behavior; stack-absent errors; key collisions between custom props and name/message/stack; nested bigint/function/circular values; copy-timer restart and unmount cleanup; clipboard availability detection; class/token assertion for the danger title and the computed 700 px max width (AC 17b/17c) | High     |

| `test/system-error-provider.impl.test.tsx` | Capture-hook internals: `addEventListener`/`removeEventListener` spies (attach/detach on toggle and unmount), StrictMode-safe single listener pair, handler stability/memoization; no clipboard dependency | High |

SSR smoke: `test/system-error-provider.ssr.test.tsx` (node environment; import + `renderToString`
must not throw — ST-53).

### Integration Tests

N/A — no integration surface beyond mounting inside `FluentProvider` (covered by the spec tests).

### End-to-End Tests

N/A — no browser harness exists in the repository; the one jsdom-blind behavior (focus-trap
cycle) is covered by the Storybook keyboard/a11y pass during task 1.3.4 (RD-01 §Verification).

## Test Data

### Fixtures Needed

- Error fixtures (inline in the spec file): `Error` with `code: 401`; `Error` with a circular
  custom property; error-like object with a throwing `message` accessor; plain object; object
  with a throwing enumerable getter; object whose JSON and `String()` both throw; revoked
  `Proxy`; function; `1n` bigint; a long single-line stack sample for the story.
- Dutch strings sample `{ title: 'Applicatiefout', close: 'Sluiten', detailsLabel: 'Foutdetails' }`.

### Mock Requirements

- **Clipboard**: jsdom provides none — stub with
  `Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true })`
  and restore after each test that stubs it.
- **Location**: observe the reload guard with `vi.stubGlobal('location', { reload: vi.fn() })`
  (spying on `window.location.reload` throws in jsdom).
- **Timers**: `vi.useFakeTimers()` for the copy-feedback cases (ST-21, ST-24); restore real timers after.
- **Themes**: wrap renders in `FluentProvider` with `webLightTheme` / `webDarkTheme`, mirroring
  the existing tests (`test/description-list.spec.test.tsx`).
- **Global capture events**: construct `ErrorEvent` / `PromiseRejectionEvent` with
  `{ cancelable: true }` for ST-46 – ST-48; negative dispatches (ST-45, ST-49) carry a test-owned
  sink listener or message-only events (the Vitest jsdom `error` interceptor converts unhandled
  dispatches into run-level failures — verified). The re-entrant case (ST-41) uses a helper
  component that captures the hook API.
- Real objects preferred otherwise; no component mocks.

## Verification Checklist

- [ ] All specification test cases (ST-*) defined with concrete input/output pairs
- [ ] Every ST case traces to a requirement, spec doc, or AR entry
- [ ] Specification tests written BEFORE implementation
- [ ] Specification tests verified to FAIL before implementation (red phase)
- [ ] All specification tests pass after implementation (green phase)
- [ ] Implementation tests written for edge cases and internals
- [ ] All unit / integration / E2E tests pass (integration and E2E recorded N/A with reasons)
- [ ] No regressions in existing tests
- [ ] Coverage meets the goals above (every criterion verified in its channel)
