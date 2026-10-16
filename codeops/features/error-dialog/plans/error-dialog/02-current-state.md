# Current State: ErrorDialog

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)
> **Analyzed at**: commit `ab4b134` (clean tree)

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

### Relevant Files

| File                                                 | Purpose                | Changes Needed                                             |
| ---------------------------------------------------- | ---------------------- | ---------------------------------------------------------- |
| `src/index.ts`                                       | Package barrel         | Add `ErrorDialog` + the three public types                 |
| `test/package-exports.spec.test.ts`                  | Export contract        | Extend the exact list with `ErrorDialog`                   |
| `README.md` (package root)                           | Package documentation  | Add the ErrorDialog section (description, props, notes)    |
| `src/components/ErrorDialog/*`                       | —                      | New component files (see RD-01 anatomy / `03-01 §Files`)   |
| `test/error-dialog.spec.test.tsx`                    | —                      | New contract tests from the ST cases                       |
| `test/error-dialog.impl.test.tsx`                    | —                      | New internal tests (serializer, timers, tokens)            |
| `.storybook/*`, `vitest.config.ts`, `tsconfig*.json` | Test/story/build infra | None — existing patterns already support the new component |

### Code Analysis

- The shell pattern to mirror: `DescriptionList.tsx` wires hook + render + styles; the item uses
  a layout context — ErrorDialog needs none.
- Styles import `makeStyles`, `mergeClasses` and `tokens` from `@fluentui/react-components`
  (not `@griffel/react`); class-name comparison is the honest jsdom stand-in for visual checks
  (jsdom cannot resolve `var()` tokens or measure layout).
- jsdom environment facts that shape the tests: `navigator.clipboard` is absent (stub with
  `Object.defineProperty`); `window.location.reload` is non-configurable (observe with
  `vi.stubGlobal('location', …)`); focus lands on the dialog surface on open (observable), but the
  Tab-cycle focus trap is not reproducible (Fluent's tabster needs layout).

## Gaps Identified

### Gap 1: No error surface in the package

**Current Behavior:** applications using this library have no in-app presentation for unexpected
errors; nothing captures or displays them.
**Required Behavior:** a controlled `ErrorDialog` per RD-01, usable by host applications that own
capture and side effects.
**Fix Required:** implement the component, its tests, story and README section as planned.

## Dependencies

### Internal Dependencies

- Repository component pattern and its skill (`.opencode/skills/fluentui-components/`).
- `test/package-exports.spec.test.ts` and `src/index.ts` (both updated by this plan).

### External Dependencies

- `@fluentui/react-components` (Dialog, DialogSurface, DialogTitle, Textarea, Label, Button,
  tokens) and React 19 — already peers; **no new dependency is added**.

## Risks and Concerns

| Risk                                                            | Likelihood   | Impact | Mitigation                                                                                         |
| --------------------------------------------------------------- | ------------ | ------ | -------------------------------------------------------------------------------------------------- |
| jsdom cannot verify the literal focus trap or resolve tokens    | High (known) | Low    | RD-01 verification channels: story/manual pass for the trap cycle; impl class assertions for style |
| jsdom lacks `navigator.clipboard`                               | High (known) | Low    | Stub via `Object.defineProperty` (documented in `07-testing-strategy.md` §Test Data)               |
| `window.location.reload` is not spyable                         | High (known) | Low    | `vi.stubGlobal('location', { reload: vi.fn() })`                                                   |
| Hostile error values beyond the pinned cases can still surprise | Medium       | Medium | The RD mandates wrapped serialization with a fallback chain; impl tests extend the matrix          |
| Type-union regressions                                          | Low          | Medium | `@ts-expect-error` spec cases fail `pnpm type-check` if the contract regresses                     |
