# Current State: confirm-dialog

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

`@blendsdk/fluentui-react-components` is a single publishable package
(`packages/react-components/`) with four components, all built on `@fluentui/react-components`
v9 in the house pattern: `DescriptionList`/`DescriptionListItem` (container + context pair),
`ErrorDialog` (controlled alert dialog) and `SystemErrorProvider` (context provider + hook +
always-rendered dialog). The two dialog-related components are the direct precedents for this
feature: the new `ConfirmDialog` mirrors `ErrorDialog`'s anatomy and the new `ConfirmProvider`
mirrors `SystemErrorProvider`'s context shape, error wording and transient state.

### Relevant Files

| File                                            | Purpose                                                 | Changes Needed                                                                   |
| ----------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/components/ErrorDialog/` (8 files)         | The controlled-dialog precedent                         | None — read as the pattern source                                                |
| `src/components/SystemErrorProvider/` (7 files) | The provider precedent (context, hook, always-rendered) | None — read as the pattern source                                                |
| `src/index.ts`                                  | Package barrel (components + props types)               | Add the two components and their public types                                    |
| `test/package-exports.spec.test.ts`             | Runtime + type export pin                               | Extend both pin blocks                                                           |
| `README.md`                                     | Package documentation (sections per component)          | Add `ConfirmDialog` and `ConfirmProvider` sections; update the Principles bullet |
| `test/error-dialog.spec.test.tsx`               | Precedent for jsdom dialog techniques                   | None — technique reference (document-wide queries, rerender close)               |
| `.opencode/skills/fluentui-components/`         | Repo-authored component-authoring skill                 | None — executors load it                                                         |

### Code Analysis

- **Component anatomy** — `ErrorDialog.tsx:36-42` is a `forwardRef` shell that calls the state
  hook and returns the render function; `useErrorDialog.ts` normalizes the discriminated props
  union once (`normalizeProps`, lines 65-102) and exposes a documented `ErrorDialogState`; the
  render function spreads `surfaceProps` onto `DialogSurface`, merges the caller class after its
  own (`renderErrorDialog.tsx:33-37`) and forwards `surfaceRef`. Styles are static Griffel
  classes from `tokens` (`useErrorDialogStyles.styles.ts:13-45`).
- **Alert semantics** — the dialog passes `modalType="alert"` and wires no `onOpenChange`
  (`renderErrorDialog.tsx:32`): backdrop clicks are ignored and Escape stays inert (the
  requirements AR-6/AR-7 resolution records the verified v9 mechanics).
- **Provider pattern** — `SystemErrorProvider.tsx:39-95`: `useState` for the transient record,
  `useCallback` API, `useMemo` context value, children rendered unchanged, and the dialog always
  rendered with `open={caught !== undefined}` (lines 86-92). A latest-ref keeps host callbacks
  fresh (`onSignOutRef`, lines 67-75).
- **v9 focus mechanics (verified in the installed dependency)** —
  `useFocusFirstElement.js` (`@fluentui/react-dialog@9.18.5`) moves initial focus inside a
  `React.useEffect` (passive), so component **layout** effects run before the focus move — the
  open-time focus capture of `03-01 §Focus machinery` can observe the invoking element.
  `useDialogSurface.js:102` renders `role="alertdialog"` for `modalType="alert"` and
  `:119` ties `unmountOnClose` to the appear motion.
- **jsdom behavior (repository-verified)** — the error-dialog spec asserts the surface is gone
  synchronously after `open={false}` (`error-dialog.spec.test.tsx:465-466`); tabster finds no
  focusable element in jsdom, so initial focus lands on the surface there, and jsdom does not
  blur a focused button that becomes disabled (focus containment is asserted instead of the
  first-action focus; RD-01 §Verification channels).
- **Testing and documentation conventions** — spec tests are the immutable oracle in
  `test/*.spec.test.tsx`, internals in `test/*.impl.test.tsx`, SSR in a node-environment
  `*.ssr.test.tsx`; the export pin asserts the exact runtime key list; stories live beside the
  components with `title: 'Components/<Name>'` and `autodocs`; the README carries one section per
  component with a props table and composition notes.

## Gaps Identified

### Gap 1: No confirmation prompt exists

**Current Behavior:** applications compose their own dialogs from Fluent primitives to ask for a
decision; the legacy v8 `ConfirmDialog` is not available in this repository.
**Required Behavior:** the controlled `ConfirmDialog` per RD-01 (strict alert, typed outcomes,
danger recipe, action sets, busy).
**Fix Required:** the Phase 1 implementation and its spec/impl tests, story and README section.

### Gap 2: No promise-based decision API exists

**Current Behavior:** `SystemErrorProvider` reports errors but has no request/response lifecycle;
there is no `useConfirm()`.
**Required Behavior:** the `ConfirmProvider` + `useConfirm()` per RD-02 (replacement semantics,
settle-once, never rejects, SSR-safe, strings chain).
**Fix Required:** the Phase 2 implementation and its spec/impl/SSR tests, story and README
section.

### Gap 3: The export pin covers four components only

**Current Behavior:** `test/package-exports.spec.test.ts:16-22` pins the current runtime list.
**Required Behavior:** the pin carries both new components and all six new public types
(RD-01 AC 18, RD-02 AC 15).
**Fix Required:** extend the runtime list and add the type pins in each phase's spec step.

## Dependencies

### Internal Dependencies

- `ErrorDialog`'s anatomy and jsdom techniques as the pattern source (no code dependency).
- `SystemErrorProvider`'s provider pattern as the pattern source (no code dependency).
- The provider renders the `ConfirmDialog` from Phase 1 (phase ordering).

### External Dependencies

- `@fluentui/react-components` (Dialog primitives, `Button`, `mergeClasses`, `makeStyles`,
  `tokens`) — existing peer/dev dependency; the danger tokens exist in the installed version
  (requirements AR-5 evidence) and `Button` has no built-in danger appearance.
- React 19 (`useId`, `forwardRef`, refs), Vitest + Testing Library, Storybook — existing harness.
- No new dependency of any kind.

## Risks and Concerns

| Risk                                                                    | Likelihood | Impact | Mitigation                                                                                                                       |
| ----------------------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Griffel override fails to beat Fluent Button's state styles             | Low        | Medium | Guarded compound selectors raise specificity above Fluent's rules (`03-01 §Danger styling`); impl test asserts the emitted rules |
| v9 focus-effect ordering differs from the verified behavior             | Low        | Medium | Verified in the installed dependency (passive effect); the spec asserts containment and the story's manual pass records the rest |
| jsdom cannot emulate real-browser focus fixup on disable                | Certain    | Low    | The busy guard covers both environments (AR #7); the manual keyboard pass records the browser path                               |
| StrictMode probe settles a live request during the double-invoked mount | Medium     | High   | The deferred-settlement discriminator (`03-02 §Unmount and probe`) plus an impl test and a spec case (ST-44)                     |
| Replacement/same-tick races leave a promise unsettled                   | Low        | High   | Ref-authority record + settle-once flag + functional conditional clear (`03-02 §Replacement`); spec/impl cases (ST-36, ST-43)    |
| Close-time restore regresses for provider-shown dialogs                 | Low        | Medium | The provider keeps the dialog rendered with an `open` toggle (AR #9), so the RD-01 restore transition always runs                |
| The `useLayoutEffect` capture warns under SSR                           | Low        | Low    | The provider SSR smoke asserts markup only; the dialog performs no DOM access during render (`03-02 §SSR`)                       |
