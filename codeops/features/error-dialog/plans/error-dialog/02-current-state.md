# Current State: ErrorDialog

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)
> **Analyzed at**: commit `ab4b134` (clean tree); extends to RD-02 at commit `59a8c0e`

## Existing Implementation

### What Exists

The publishable package `packages/react-components` carries two components — `DescriptionList`
and `DescriptionListItem` — that fully exemplify the house pattern: a `forwardRef` shell, a
`.types.ts` contract, a state hook, a pure render function, Griffel styles with Fluent tokens,
a story beside the component, spec/impl tests under `test/`, and a barrel. There is **no error
or notification surface anywhere in the package** — the feature is not redundant with anything.

Infrastructure relevant to this feature (verified):

- **Tests**: Vitest 5 + jsdom 30 + Testing Library 16 + jest-dom; `test/setup.ts` unmounts after
  each test; spec tests are the contract (`description-list.spec.test.tsx`); the export-surface
  spec test asserts the exact runtime export list (`['DescriptionList', 'DescriptionListItem']`).
- **Storybook**: docs + a11y addons; stories are collected from `src/**/*.stories.tsx`; the
  preview wraps every story in `FluentProvider` with `webLightTheme`; no interaction or
  test-runner addon exists.
- **Type-check**: `tsconfig.json` includes `src`, `test` and `.storybook`; the base config is
  `strict` with `verbatimModuleSyntax` — so a `// @ts-expect-error` strategy in test files is
  checked by `pnpm type-check`.
- **CI gate**: format:check → skill:check → type-check → build → test → storybook:build →
  `npm pack --dry-run`.
- **Fluent v9 installed**: `@fluentui/react-components` 9.74.9 (peers `^9.0.0`); the alert
  semantics the RD relies on were verified in `@fluentui/react-dialog` 9.18.5 sources
  (`role="alertdialog"`, backdrop dismissal only for `modalType="modal"`, controlled dialogs
  ignore Escape/backdrop requests), and `tokens.colorPaletteRedForeground1` exists.
- **Provider-relevant facts**: the installed Fluent toast facility is `Toaster` +
  `useToastController` (not a provider); the RD-01 prop union forbids dynamic `kind` (three
  TypeScript probes); jsdom 30 constructs `ErrorEvent`/`PromiseRejectionEvent` (non-cancelable by
  default); Vitest's jsdom environment converts an unhandled `error` event into a run-level
  failure unless a user listener is registered — the RD-02 verification techniques account for
  all of these.

### Relevant Files

| File                                                                          | Purpose                | Changes Needed                                                          |
| ----------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------- |
| `src/index.ts`                                                                | Package barrel         | Add `ErrorDialog` + its types, `SystemErrorProvider` + `useSystemError` |
| `test/package-exports.spec.test.ts`                                           | Export contract        | Extend the exact list with the three new runtime exports                |
| `README.md` (package root)                                                    | Package documentation  | ErrorDialog section + provider section and principles carve-out         |
| `src/components/ErrorDialog/*`                                                | —                      | New component files (RD-01 anatomy / `03-01 §Files`)                    |
| `src/components/SystemErrorProvider/*`                                        | —                      | New provider files (RD-02 anatomy / `03-02 §Implementation Details`)    |
| `test/error-dialog.spec.test.tsx`, `.impl.test.tsx`                           | —                      | New contract/internal tests from the ST cases                           |
| `test/system-error-provider.spec.test.tsx`, `.impl.test.tsx`, `.ssr.test.tsx` | —                      | New provider tests (contract, internals, SSR smoke)                     |
| `.storybook/*`, `vitest.config.ts`, `tsconfig*.json`                          | Test/story/build infra | None — existing patterns already support the new components             |

### Code Analysis

- The shell pattern to mirror: `DescriptionList.tsx` wires hook + render + styles; the item uses
  a layout context — ErrorDialog needs none, and the provider deliberately deviates from the
  anatomy per RD-02 §Constraints (no styles, no native pass-through, state+render in the
  provider file).
- Styles import `makeStyles`, `mergeClasses` and `tokens` from `@fluentui/react-components`
  (not `@griffel/react`); class-name comparison is the honest jsdom stand-in for visual checks
  (jsdom cannot resolve `var()` tokens or measure layout).
- jsdom environment facts that shape the tests: `navigator.clipboard` is absent (stub with
  `Object.defineProperty`); `window.location.reload` is non-configurable (observe with
  `vi.stubGlobal('location', …)`); focus lands on the dialog surface on open (observable), but the
  Tab-cycle focus trap is not reproducible (Fluent's tabster needs layout); the Vitest `error`
  interceptor requires the recorded sink-listener/message-only techniques for negative capture
  dispatches, and listener removal is proven with spies rather than dispatch.

## Gaps Identified

### Gap 1: No error surface in the package

**Current Behavior:** applications using this library have no in-app presentation for unexpected
errors and no ergonomic way to report one; nothing captures or displays them.
**Required Behavior:** a controlled `ErrorDialog` per RD-01 plus the opt-in
`SystemErrorProvider` per RD-02, usable by host applications that own capture and side effects.
**Fix Required:** implement the component and the provider, their tests, stories and README
sections as planned.

## Dependencies

### Internal Dependencies

- Repository component pattern and its skill (`.opencode/skills/fluentui-components/`) — applied
  with the recorded provider exceptions.
- `test/package-exports.spec.test.ts` and `src/index.ts` (both updated by this plan).
- Phase 2 depends on Phase 1 (the provider renders the dialog).

### External Dependencies

- `@fluentui/react-components` (Dialog, DialogSurface, DialogTitle, Textarea, Label, Button,
  tokens) and React 19 — already peers; **no new dependency is added** (the provider itself
  imports only React and the RD-01 component).

## Risks and Concerns

| Risk                                                                | Likelihood      | Impact | Mitigation                                                                                         |
| ------------------------------------------------------------------- | --------------- | ------ | -------------------------------------------------------------------------------------------------- |
| jsdom cannot verify the literal focus trap or resolve tokens        | High (known)    | Low    | RD-01 verification channels: story/manual pass for the trap cycle; impl class assertions for style |
| jsdom lacks `navigator.clipboard`                                   | High (known)    | Low    | Stub via `Object.defineProperty` (documented in `07-testing-strategy.md` §Test Data)               |
| `window.location.reload` is not spyable                             | High (known)    | Low    | `vi.stubGlobal('location', { reload: vi.fn() })`                                                   |
| Vitest jsdom `error` interceptor fails runs on unhandled dispatches | High (verified) | Low    | Sink listener / message-only events; listener spies (RD-02 §Verification)                          |
| Hostile error values beyond the pinned cases can still surprise     | Medium          | Medium | The RDs mandate wrapped serialization with a fallback chain; impl tests extend the matrix          |
| Type-union regressions                                              | Low             | Medium | `@ts-expect-error` spec cases fail `pnpm type-check` if the contract regresses                     |
| Provider listener leaks across re-renders                           | Low             | Medium | Effect-scoped registration; `addEventListener`/`removeEventListener` spies (RD-02 AC 14)           |
