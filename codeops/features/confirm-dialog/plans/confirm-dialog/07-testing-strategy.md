# Testing Strategy: confirm-dialog

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

Coverage is expressed as "every criterion verified in its recorded channel" — the repository
configures no numeric threshold:

| Code type                                 | Target                                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| ConfirmDialog contract (spec tests)       | every jsdom-observable RD-01 acceptance criterion (AC 1–13, 15–18, 20)                               |
| Compile-time contract                     | RD-01 AC 7/19 pins via `// @ts-expect-error` and annotated-callback witnesses (type-check gate)      |
| Danger styling and internals (impl tests) | the emitted class rules/tokens, fallbacks, id wiring, effect conditions (RD-01 AC 6, 14)             |
| Focus behavior beyond jsdom               | Storybook keyboard/a11y and forced-colors manual passes (RD-01 AC 3/6/11; AR #21)                    |
| Provider contract (spec tests)            | every jsdom-observable RD-02 acceptance criterion (AC 1–7, 9, 11–13, 15)                             |
| Provider internals                        | focus-after-swap, stability, settle-once, same-tick and StrictMode mechanics (RD-02 AC 4/8/10/13/14) |
| SSR safety                                | node-environment smoke (ST-37; RD-02 AC 9)                                                           |

- Test names state behavior: `should [expected behavior] when [condition]`.
- **Integration tests**: N/A — there is no integration surface beyond mounting inside
  `FluentProvider` (covered by the spec tests).
- **E2E tests**: N/A — no browser harness exists; the jsdom-blind aspects (exact first-action
  focus, Tab trap cycle, live Escape/backdrop, forced colors) use the prescribed Storybook
  manual pass instead of new infrastructure (RD-01 §Verification channels; AR #21).

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

> Derived from RD-01 and RD-02 (the owning requirements docs; acceptance criteria) and
> `03-01-confirm-dialog.md` / `03-02-confirm-provider.md` (implementable signatures).
> Expectations are the specification's, never imagined implementation behavior. The
> immutable-oracle rule applies: a failing spec test means the implementation is wrong.

### ConfirmDialog (RD-01)

| #     | Input / Scenario                                                                                                                                                                   | Expected Output / Behavior                                                                                                                                                 | Source            |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| ST-1  | Render `open={false}` with the default pair                                                                                                                                        | No `alertdialog` element exists; no `onResolve` call                                                                                                                       | RD-01 AC 1        |
| ST-2  | Render `open` with `title="Delete this record?"`                                                                                                                                   | Exactly one `alertdialog`; its accessible name equals the title text                                                                                                       | RD-01 AC 1        |
| ST-3  | Default pair                                                                                                                                                                       | Two buttons in DOM order: decline (`"Cancel"`, secondary) then confirm (`"Confirm"`, primary); no third action                                                             | RD-01 AC 2        |
| ST-4  | Open the dialog                                                                                                                                                                    | `document.activeElement` is contained by the `alertdialog` element (the surface in jsdom)                                                                                  | RD-01 AC 3        |
| ST-5  | With the dialog open, dispatch Escape on the `alertdialog`                                                                                                                         | The `alertdialog` remains; zero `onResolve` calls                                                                                                                          | RD-01 AC 4        |
| ST-6  | With the dialog open, click the backdrop                                                                                                                                           | The `alertdialog` remains; zero `onResolve` calls                                                                                                                          | RD-01 AC 4        |
| ST-7  | Click `"Confirm"`                                                                                                                                                                  | `onResolve(true)` called exactly once; the `alertdialog` is still in the document (host-controlled)                                                                        | RD-01 AC 5        |
| ST-8  | Click `"Cancel"`                                                                                                                                                                   | `onResolve(false)` called exactly once                                                                                                                                     | RD-01 AC 5        |
| ST-9  | Click `"Cancel"` twice while the dialog stays open                                                                                                                                 | `onResolve(false)` called twice — repeat activations report again                                                                                                          | RD-01 AC 5        |
| ST-10 | Pair with `intent="danger"` vs `intent` omitted                                                                                                                                    | The confirm button's class composition differs by exactly the danger class; the decline button and surface classes are identical across variants                           | RD-01 AC 6        |
| ST-11 | `actions` `[{value:'cancel',label:'Cancel'},{value:'discard',label:'Discard',intent:'danger'},{value:'save',label:'Save',appearance:'primary'}]`; click `"Discard"`                | Three buttons in array order; `onResolve('discard')` called once                                                                                                           | RD-01 AC 7        |
| ST-12 | Annotated-callback witnesses: `(value: 'cancel' \| 'discard' \| 'save') => void` compiles for ST-11's actions; `// @ts-expect-error` — a `(value: 'other') => void` callback fails | Literal inference holds at the call site; the directive catches regressions via `pnpm type-check`                                                                          | RD-01 AC 7        |
| ST-13 | `// @ts-expect-error` cases: `intent` combined with `actions`; `actions: ConfirmAction[]` (not a non-empty tuple); `actions={[]}`                                                  | `pnpm type-check` reports exactly those errors (an unused directive fails the gate)                                                                                        | RD-01 AC 19       |
| ST-14 | `strings={{ confirm: 'Delete' }}`                                                                                                                                                  | Only the affirmative label is `"Delete"`; the decline label remains `"Cancel"`                                                                                             | RD-01 AC 8        |
| ST-15 | `strings={{ confirm: '' }}`; also `strings={{ confirm: '  ' }}`                                                                                                                    | The affirmative label falls back to `"Confirm"` in both cases — never an unnamed button                                                                                    | RD-01 AC 8        |
| ST-16 | `message="line one\nline two"`                                                                                                                                                     | The message element's computed `white-space` is `pre-line` (visual line-break rendering is asserted by the manual pass)                                                    | RD-01 AC 9        |
| ST-17 | `title` and `message` containing `<script>alert(1)</script>` and an `<img onerror>` payload                                                                                        | No `script` or `img` element is created from the content; the text is visible literally in the dialog                                                                      | RD-01 AC 9, AC 15 |
| ST-18 | Message present, then absent                                                                                                                                                       | The `alertdialog`'s `aria-describedby` resolves to the element containing the message text; without a message the attribute is absent                                      | RD-01 AC 10       |
| ST-19 | Caller-provided `aria-describedby="caller-id"` with a message present                                                                                                              | The attribute is exactly the caller's value — unchanged, not replaced                                                                                                      | RD-01 AC 10       |
| ST-20 | `busy` true (and `busy` flipped true after render); attempt activations                                                                                                            | Every action button is disabled; no `onResolve` call                                                                                                                       | RD-01 AC 11       |
| ST-21 | Focus an action button explicitly, then flip `busy` true; then re-render with an unrelated prop change                                                                             | `document.activeElement` is the dialog surface element once; the unrelated re-render does not move focus again                                                             | RD-01 AC 11       |
| ST-22 | Untyped consumer passes `actions: []`                                                                                                                                              | The default confirm/decline pair renders; activating confirm calls `onResolve(true)`, decline `onResolve(false)`                                                           | RD-01 AC 12       |
| ST-23 | Pass `data-testid`, `className="custom"`, `style={{ maxWidth: '700px' }}` and a ref                                                                                                | The data attribute lands on the surface; the surface carries both the component class and `custom`; the style applies; the ref resolves to the surface element             | RD-01 AC 13       |
| ST-24 | Full interaction (open, activate, Escape, backdrop) with `fetch` and `localStorage` spies                                                                                          | Neither is ever called; the component performs no network or storage access                                                                                                | RD-01 AC 15       |
| ST-25 | Focus an outside invoker, open the dialog, then set `open={false}`                                                                                                                 | Focus returns to the invoker element                                                                                                                                       | RD-01 AC 16       |
| ST-26 | Focus an invoker, open the dialog, remove the invoker from the tree, then close                                                                                                    | Nothing throws; focus is not restored to the removed element                                                                                                               | RD-01 AC 16       |
| ST-27 | `{ value: 'save', label: '' }`; also a whitespace-only label                                                                                                                       | The button's visible label and accessible name are exactly `save`                                                                                                          | RD-01 AC 17       |
| ST-28 | An action carrying an icon (e.g. a Fluent icon or a plain `<span>glyph</span>`)                                                                                                    | The glyph renders inside the button and is hidden from assistive technology (`aria-hidden` ancestor); the button's accessible name is exactly its label                    | RD-01 AC 20       |
| ST-29 | Import the package root                                                                                                                                                            | Runtime exports include `ConfirmDialog`; `ConfirmIntent`, `ConfirmAction`, `ConfirmDialogStrings`, `ConfirmDialogProps` compile for import; the full runtime list is exact | RD-01 AC 18       |

### ConfirmProvider (RD-02)

| #     | Input / Scenario                                                                                                                                                         | Expected Output / Behavior                                                                                                                                                   | Source      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| ST-30 | `<ConfirmProvider><App /></ConfirmProvider>` with no request                                                                                                             | The child markup renders (no wrapper element added); no `alertdialog` exists                                                                                                 | RD-02 AC 1  |
| ST-31 | A descendant awaits `confirm({ title: 'Delete?' })`; activate confirm; then decline on a second request                                                                  | First promise resolves `true`; second resolves `false`; after each settlement the `alertdialog` is no longer in the document                                                 | RD-02 AC 2  |
| ST-32 | Actions request with three actions; activate `discard`; then an untyped `actions: []` request                                                                            | The promise resolves `'discard'` (literal union at the declaration); the empty request renders the pair and resolves a boolean                                               | RD-02 AC 3  |
| ST-33 | Two `confirm()` calls while the first dialog is open                                                                                                                     | The first promise resolves `false` with no user interaction; only the second request's dialog is visible; activating confirm resolves the second promise `true`              | RD-02 AC 4  |
| ST-34 | Unmount the provider while a request is pending                                                                                                                          | The pending promise resolves `false`; no unhandled rejection is reported                                                                                                     | RD-02 AC 5  |
| ST-35 | `useConfirm()` called outside any provider                                                                                                                               | Throws an `Error` whose message names both `useConfirm` and `ConfirmProvider`                                                                                                | RD-02 AC 6  |
| ST-36 | Provider `strings={{ confirm: 'Yes', decline: 'No' }}`; a per-call `{ confirm: 'Delete' }`; a per-call `{ confirm: '' }`; and a per-call-only provider without `strings` | Provider labels apply; non-blank per-call wins key by key; a blank per-call resolves to the provider value; with no provider value the English default applies               | RD-02 AC 7  |
| ST-37 | Node environment (`// @vitest-environment node`): import + `renderToString` of a provider-wrapped tree                                                                   | Child markup renders; no `alertdialog` markup; no window/DOM access errors                                                                                                   | RD-02 AC 9  |
| ST-38 | Escape dispatched on a provider-shown `alertdialog`                                                                                                                      | The dialog remains; no promise settles                                                                                                                                       | RD-02 AC 11 |
| ST-39 | Spy `fetch`/`localStorage` across the flows; exercise activation, supersede and unmount settlements                                                                      | No network or storage access; every started promise settles (no dangling `await`)                                                                                            | RD-02 AC 12 |
| ST-40 | Two `confirm()` calls in one synchronous tick; and an activation followed by a `confirm()` in the same dispatch                                                          | Only one dialog (the latest request) is visible; the superseded promise resolves `false`; no promise is left unsettled, including the supersede-in-same-dispatch case        | RD-02 AC 13 |
| ST-41 | Import the package root                                                                                                                                                  | Runtime exports include `ConfirmProvider` and `useConfirm`; `ConfirmProviderProps`, `ConfirmOptions`, `ConfirmOptionsWithActions` compile for import; the full list is exact | RD-02 AC 15 |

> ST-12/ST-13's expectations are enforced by `pnpm type-check`, not the Vitest run; the directives
> live in the spec files so the gate catches contract regressions. ST-16 asserts the computed
> style because jsdom has no layout; the visual line-break behavior is a story checklist item.
> ST-33's focus clause is verified by the implementation test (differing action counts); ST-40's
> same-dispatch clause is an implementation-adjacent scenario exercised through the public API in
> the spec file with a helper component.

## Test Categories

### Specification Tests (from the ST cases)

> Written BEFORE implementation.

| Test File                             | ST Cases Covered             | Component         |
| ------------------------------------- | ---------------------------- | ----------------- |
| `test/confirm-dialog.spec.test.tsx`   | ST-1 – ST-28                 | `ConfirmDialog`   |
| `test/confirm-provider.spec.test.tsx` | ST-30 – ST-36, ST-38 – ST-40 | `ConfirmProvider` |
| `test/package-exports.spec.test.ts`   | ST-29, ST-41                 | package barrel    |

### Implementation Tests (edge cases, internals)

> Written AFTER implementation.

| Test File                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Priority |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `test/confirm-dialog.impl.test.tsx`   | Danger class rules in the emitted stylesheet (four guarded selectors with the three background tokens and the inverted foreground); label-fallback internals (blank, whitespace); id wiring (`messageId` matches the described element); busy-effect conditions (fires once per false→true, not on unrelated re-render); restore-effect conditions (capture on transition, connected check); merged ref callback; class merging; zero-v8 source/manifest scan (RD-01 AC 14) | High     |
| `test/confirm-provider.impl.test.tsx` | `confirm` referential stability across re-renders (RD-02 AC 8); focus inside the new dialog after a supersede with differing action counts (RD-02 AC 4); settle-once under double activation (RD-02 AC 10); StrictMode double-invoked probe survival (RD-02 AC 14); children element identity preserved across request lifecycle changes; unmount microtask discriminator                                                                                                   | High     |

### Integration Tests

N/A — no integration surface beyond `FluentProvider` mounting (covered by the spec tests).

### End-to-End Tests

N/A — no browser harness; jsdom-blind focus behavior is covered by the Storybook manual passes
(tasks 1.3.4).

SSR smoke: `test/confirm-provider.ssr.test.tsx` (node environment; import + `renderToString` must
not throw — ST-37).

## Test Data

### Fixtures Needed

- Action sets: the three-action sample (cancel/discard/save) with per-action intent and
  appearance; a two-action Yes/No set; a set with an icon.
- Strings samples: `{ confirm: 'Delete' }`; `{ confirm: '' }`; provider sample
  `{ confirm: 'Yes', decline: 'No' }`; a Dutch sample for the story.
- Messages: multi-line string; markup-like strings (`<script>`, `<img onerror>`); a long message
  for the story.
- A focusable invoker button outside the dialog for the restore cases.

### Mock Requirements

- **Themes**: wrap renders in `FluentProvider` with `webLightTheme` (mirroring the existing
  tests).
- **Spies**: `fetch` and `localStorage` spies for the no-side-effect cases; the error-dialog
  clipboard-stub pattern is reused only if a test needs navigator stubs (the components do not).
- **StrictMode**: `React.StrictMode` wrapper in the probe case (ST-34's discriminator and the
  impl case).
- **Async settlement**: `await act(async () => {})` or awaiting the returned promise to flush
  state updates.
- Real objects preferred otherwise; no component mocks.

## Verification Checklist

- [ ] All specification test cases (ST-*) defined with concrete input/output pairs
- [ ] Every ST case traces to a requirement, spec doc, or AR entry
- [ ] Specification tests written BEFORE implementation
- [ ] Specification tests verified to FAIL before implementation (red phase)
- [ ] All specification tests pass after implementation (green phase)
- [ ] Implementation tests written for edge cases and internals
- [ ] All unit tests pass; integration and E2E recorded N/A with reasons
- [ ] No regressions in existing tests
- [ ] Coverage meets the goals above (every criterion verified in its channel)
