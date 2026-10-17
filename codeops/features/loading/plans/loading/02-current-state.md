# Current State: Loading Primitives

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

The package has no loading component, overlay or async controller. Fluent UI v9 already supplies the
indeterminate `Spinner`; the repository has not wrapped it. The package's existing components establish
the patterns this feature reuses:

- `ConfirmDialog` is a controlled, presentation-only component with two focus effects that handle
  environment-dependent blur behavior: capture/restore at
  `src/components/ConfirmDialog/useConfirmDialog.ts:181-196` and the busy rescue at `:198-215`.
- `ConfirmProvider` / `useConfirm` and `SystemErrorProvider` / `useSystemError` are stable imperative
  controllers exposed through hooks (`src/components/ConfirmProvider/useConfirm.ts`,
  `src/components/SystemErrorProvider/useSystemError.ts`).
- `DescriptionList` / `DescriptionListItem` show the small component anatomy: types, state hook, render,
  Griffel styles, story and tests.
- The package root exports only public components, hooks and their types (`src/index.ts`); the export
  surface is pinned by `test/package-exports.spec.test.ts`.

### Relevant Files

| File                                                                         | Purpose                                                                  | Changes Needed                                                          |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `packages/react-components/src/index.ts`                                     | Public package surface                                                   | Add `Loading`, `LoadingOverlay`, `useLoading` and four types            |
| `packages/react-components/test/package-exports.spec.test.ts`                | Runtime/type export pins                                                 | Add the three runtime symbols and type pins                             |
| `packages/react-components/README.md`                                        | Consumer documentation                                                   | Add Loading, LoadingOverlay and useLoading sections plus decision table |
| `packages/react-components/src/components/ConfirmDialog/useConfirmDialog.ts` | Focus capture/restore and busy rescue precedent                          | Reference only; no change                                               |
| `packages/react-components/src/components/ConfirmProvider/useConfirm.ts`     | Stable imperative hook precedent                                         | Reference only; no change                                               |
| `packages/react-components/src/components/DescriptionList/`                  | Component anatomy and story/test precedent                               | Reference only; no change                                               |
| `packages/react-components/test/setup.ts`                                    | Jest-dom and RTL cleanup only; each test supplies its own FluentProvider | Reference only; no change                                               |
| `packages/react-components/package.json`                                     | React/Fluent peers and scripts                                           | No dependency changes                                                   |

### Code Analysis

**Fluent UI v9 `Spinner` (`@fluentui/react-spinner@9.8.6`).** The installed types expose
`appearance`, `delay`, `label`, `labelPosition` and eight named sizes (`dist/index.d.ts:45-66`). The
root defaults to `role="progressbar"` (`lib/components/Spinner/useSpinner.js:42`), associates its
label through `aria-labelledby` (`useSpinner.js:81-82`), and hides the whole spinner until the delay
elapses (`useSpinner.js:87`). It does not provide a region wrapper, a scrim, inert behavior or a
caller-owned busy state.

**Theme tokens.** `tokens.colorBackgroundOverlay` exists in the installed token package
(`@fluentui/tokens@1.0.0-alpha.24/dist/index.d.ts:217`) and is the themed translucent layer used by
Fluent surfaces. No new color or z-index token is needed.

**React 19.** The installed React types expose the native `inert` attribute
(`@types/react@19.3.0/index.d.ts:2946-2948`). The repository already targets React 19 and Fluent UI
v9 as peers (`packages/react-components/package.json`).

**Legacy component (external evidence).** The CastingAppMT `packages/fui8/src/Loading` component is a v8 wrapper around
`Spinner`: the root fills its parent, centers the spinner, paints the v8 body background and sets
`z-index: 999999`; `size` defaults to large; `labelPosition` keeps the v8 default (`bottom`). The
webclient has 47 uses, all 47 the replacement branch of a `fetching ? … : …` condition; 12 pass a
label, 35 pass none, and no call site uses any other prop. The legacy component has no delay, no
busy announcement, no focus handling and no async controller. These figures come from the external
CastingAppMT repository and are not verifiable here.

## Gaps Identified

### Gap 1: No standalone loading filler

**Current Behavior:** an application writes a local `div` plus a Fluent `Spinner` and repeats the
centering, label and status wiring.
**Required Behavior:** `Loading` provides the centered, transparent filler with a default label,
status announcement, delay and native pass-through.
**Fix Required:** new `Loading` component and its spec/impl tests, story and README section.

### Gap 2: No in-place busy overlay

**Current Behavior:** applications replace content with a spinner or write an ad-hoc absolute layer
and forget `aria-busy`, `inert` or focus handling.
**Required Behavior:** `LoadingOverlay` keeps children mounted, applies the scrim/inert/status/focus
contract and never flashes for fast operations.
**Fix Required:** new overlay component, delayed-visibility hook, focus hook and tests.

### Gap 3: No concurrency-safe async controller

**Current Behavior:** each call site owns `setBusy(true)` / `try` / `finally`, which is easy to
forget and hard to count across overlapping operations.
**Required Behavior:** `useLoading().run()` ref-counts operations, clears in `finally`, returns the
value, rethrows and carries labels.
**Fix Required:** new public hook plus reducer/state tests.

### Gap 4: No accessible announcement convention

**Current Behavior:** 35 of 47 legacy uses are unlabeled; the visible v8 label is not a live region.
**Required Behavior:** one polite status announcement, a non-empty label by default, decorative
spinner hidden from assistive technology, and no double speech.
**Fix Required:** status structure, label resolver and accessibility tests/story checklist.

### Gap 5: No consistent anti-flash or layout stability

**Current Behavior:** the legacy component appears immediately and replaces content; fast operations
flash and layout shifts.
**Required Behavior:** a 300 ms overlay delay, a one-effect reveal, mounted children and a stable
root.
**Fix Required:** shared delayed-visibility hook, overlay render structure and timer tests.

## Dependencies

### Internal Dependencies

- Fluent UI v9 `Spinner`, `makeStyles`, `mergeClasses` and `tokens` from the existing peer package.
- Repository component anatomy and spec-first test conventions (`AGENTS.md:30`, `AGENTS.md:31`,
  `AGENTS.md:40`).
- `ConfirmDialog` focus precedent for environment-dependent blur handling.
- The package export-surface test and README.

### External Dependencies

- None. React 19, Fluent UI v9 and the existing test toolchain are already installed.
- No new runtime or development dependency.

## Risks and Concerns

| Risk                                                                | Likelihood | Impact | Mitigation                                                                                                                                                          |
| ------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inert` blur behavior differs between jsdom and real browsers       | High       | Medium | Test the attribute and the explicit focus fallback; add a real-browser story checklist; use `isConnected` and ownership checks.                                     |
| Live region inserted with text does not announce                    | Medium     | High   | Mount the status node before its text; keep the status outside the `aria-busy` subtree; hide the visual spinner from AT.                                            |
| A busy subtree suppresses the status text change                    | Medium     | High   | Put `aria-busy` on the content wrapper only; the status node is a sibling, so its text change is not deferred (ST-12).                                              |
| `display: contents` plus `inert` behaves inconsistently             | Low-Medium | Medium | The wrapper has no box; manual story verification; current Chromium, Firefox and Safari support `display: contents`; a normal wrapper is a manual, recorded change. |
| `aria-busy` on `display: contents` is not exposed to AT             | Medium     | Medium | Check the busy state in the manual matrix (M-9); if a supported browser drops it, apply the normal-wrapper fallback and record the layout change.                   |
| Portaled or fixed content paints above the scrim                    | Medium     | Medium | The overlay is region-scoped by design; document the limitation in the README and check an open `Menu` and a sticky header manually.                                |
| Focus steal in a non-modal region                                   | Medium     | Medium | Move focus only if it was inside the content or the browser blurred it to body; restore the reveal-time element first, then the loading-start element.              |
| Caller ignores `run`'s returned promise and gets an unhandled error | Medium     | Medium | JSDoc and README show `return`/`.catch(catchError)`; the story demonstrates the pattern; errors are never swallowed.                                                |
| Owner re-renders on every busy/label change                         | Low        | Low    | The hook is local to the region; a store is deferred until a measured need appears.                                                                                 |
| Visual size/label position cannot be asserted in jsdom              | High       | Low    | Cover the visual variants in Storybook; unit tests assert the observable label/status/structure contract.                                                           |
| Public surface grows beyond three components/hook                   | Low        | Medium | Export pins; internal helpers stay unexported; the plan records the exclusions.                                                                                     |
| Legacy migration breakage                                           | Low        | Medium | `LoadingOverlay` accepts an existing boolean first; the `run()` adoption is incremental.                                                                            |
