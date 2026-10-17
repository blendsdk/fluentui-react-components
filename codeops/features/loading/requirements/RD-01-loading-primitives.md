# RD-01: Loading Primitives

> **Document**: RD-01-loading-primitives.md
> **Status**: Draft
> **Created**: 2026-10-17
> **Project**: fluentui-react-components
> **Depends On**: —
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Applications need to tell a user that a region is waiting: a list is loading, a form is saving, an import or export is running. The legacy `@blendsdk/fui8` `Loading` component covered that need 47 times in CastingAppMT; every use was the replacement branch of a `fetching ? <Loading /> : content` condition. 35 of those 47 uses passed no label at all, and none passed any prop other than `label`.

This feature rebuilds that convention as three small, native Fluent UI v9 pieces:

1. **`Loading`** — a transparent, centered, indeterminate spinner for a region that has no content to cover.
2. **`LoadingOverlay`** — a region-scoped blocking overlay that keeps its children mounted, covers them with a themed scrim and a spinner while `loading` is true, and makes the covered content inert.
3. **`useLoading()`** — a local controller hook for arbitrary async operations. It ref-counts overlapping operations, clears the busy state in `finally`, returns the operation's value, rethrows its error, and carries per-operation labels.

The pieces are intentionally separate. `LoadingOverlay` accepts a plain boolean, so it works with `useTransition`, `useActionState`, a store, React Query, or existing application state. `useLoading` is an optional convenience for apps that do not otherwise own a pending flag. There is no provider, no global blocker, no portal, no dynamically returned component, and no new dependency.

The design keeps the legacy convention — one consistent loading state per region — and fixes what the legacy component lacked: an accessible announcement, anti-flash delay, stable layout, inert interaction blocking, focus restoration, and a concurrency-safe async controller.

---

## Functional Requirements

### Must Have (M)

- [ ] **R1 — `Loading` exists.** A `Loading` component renders a centered, indeterminate Fluent UI v9 `Spinner` with a visible label. It is presentation-only and has no data or application state.
- [ ] **R2 — `Loading` defaults and layout.** The default spinner size is `large`, the default appearance is `primary`, the default label position is `below`, and the default delay is `0`. The root fills the available width and height of its parent and has no background, no global `z-index`, and no portal. An optional `minHeight` lets an empty parent size the region.
- [ ] **R3 — `Loading` label resolution.** `label` is an optional plain string. When omitted, empty or whitespace-only, the visible and announced label is the English default `Loading…`. Localized applications pass their own label; the package ships no string resource files.
- [ ] **R4 — `Loading` visibility and announcement.** `Loading` renders a polite status region. The visible spinner is decorative to assistive technology; the label is the single announcement source. A positive `delay` postpones both the visible indicator and the status text; there is no announcement while the region is visually empty. The status node exists before its text appears.
- [ ] **R5 — `Loading` pass-through.** `className` and `style` merge onto the root; remaining native `div` props pass through; `ref` points at the root. The root is not in the tab order.
- [ ] **R6 — `LoadingOverlay` is controlled and stable.** `LoadingOverlay` requires `loading: boolean` and `children`. Children stay mounted in both states. While idle, the overlay adds no scrim, no status text and no inert state. While loading, the overlay appears after `delay` (default `300` ms); a fast operation that settles before the delay never shows the overlay. `delay={0}` shows it on the next effect.
- [ ] **R7 — `LoadingOverlay` blocks interaction safely.** While the overlay is visible, the content is marked `inert`, so it is removed from the tab order and the accessibility tree, and the scrim blocks pointer interaction. The overlay root and its status are outside the inert subtree. Interaction is not blocked during the delay window; applications that must prevent a second submission disable their own trigger or use `isLoading` from `useLoading`.
- [ ] **R8 — `LoadingOverlay` is announced.** The content wrapper carries `aria-busy` that reflects `loading` immediately, and the status region stays outside that busy subtree so its text change is not deferred until the region becomes idle. A persistent polite status region is mounted with the overlay; its text becomes the resolved label when the overlay appears, so the announcement is a text change in an existing live region, not an insertion. The visible spinner is decorative; the status text is the single announcement.
- [ ] **R9 — `LoadingOverlay` manages focus.** When the overlay appears, focus moves to the overlay root only if focus was inside the covered content, or if the browser has already blurred the focused element to `document.body` and the element captured when loading started was inside and still connected. When loading ends, focus returns to the captured element only if the component moved focus, the element is still connected, and focus is still on the overlay root or the body. Focus that was outside the content is never moved. The root has `tabIndex={-1}` and no visible focus ring.
- [ ] **R10 — `LoadingOverlay` labels and pass-through.** `label` follows the same resolution as `Loading`. `className` and `style` merge onto the root; other native `div` props pass through; `ref` points at the root. `aria-busy` and `tabIndex` are managed by the component and are not caller-overridable through the props type.
- [ ] **R11 — `useLoading` controller.** `useLoading(options?: { label?: string })` returns `{ isLoading, label, run }`. `isLoading` is true while at least one tracked operation is pending. `label` is the most recently started active operation's non-blank label, else the hook's default label, else `undefined`. `run<T>(operation, options?)` accepts a function returning `T` or `Promise<T>` and returns `Promise<T>`.
- [ ] **R12 — `useLoading` cleanup and concurrency.** `run` marks the operation active before invoking it, clears it in `finally`, returns the operation's value, and rethrows the error unchanged. Overlapping operations are ref-counted: `isLoading` stays true until the last one settles. Operations are removed by id, never by last-in-first-out order. Labels from overlapping operations resolve deterministically.
- [ ] **R13 — `useLoading` stability and failure behavior.** The `run` function is referentially stable across renders. The hook re-renders the calling component when `isLoading` or `label` changes. Calling `run` after unmount is safe: the returned promise still settles and the state update is a no-op. The hook never swallows errors and performs no logging, navigation or I/O.
- [ ] **R14 — Public surface and documentation.** The package root exports `Loading`, `LoadingOverlay` and `useLoading` at runtime, and `LoadingProps`, `LoadingOverlayProps`, `LoadingOptions` and `LoadingController` as types. The package-export specification test pins the runtime surface. The README documents each piece, its props, its accessibility behavior, its composition patterns and a decision table. Storybook shows `Loading` variants, an async `useLoading` + `LoadingOverlay` flow, a fast operation that does not flash, an app-owned boolean, and a custom label.
- [ ] **R15 — Compatibility and SSR.** The components use Fluent UI v9 peers supplied by the application and React 19 features already present in the repository (`inert`). No browser API is touched during render. Server rendering renders the structural roots and children without throwing; the delayed indicator appears after hydration. The overlay adds no portal, global stacking context or application-wide state.
- [ ] **R16 — Scope discipline.** No provider/context, no global full-page blocker, no `Skeleton` or `ProgressBar` variants, no v8 prop surface (`backgroundColor`, `styles`, `theme`, `type`, `ariaLive`), no `busy()`/`done()` pair, no `begin()` release tokens, no `minVisible`, no new dependency, and no string resource files. None of these are implemented by this RD.
- [ ] **R17 — Verification.** `pnpm verify` passes for the repository, `pnpm storybook:build` succeeds, and the new feature specification tests are written before the implementation and kept unchanged. The package-export pin is extended intentionally as each public symbol lands.

### Should Have

- [ ] None. The RD is deliberately limited to the three pieces and their required behavior.

### Won't Have (Out of Scope)

- A `LoadingProvider` or any context-scoped global loading state.
- A full-page or full-application blocking overlay.
- A portal-based overlay or global z-index management.
- `Skeleton`/`SkeletonItem` or `ProgressBar` variants inside the loading components; applications choose those Fluent primitives directly when the content shape or progress is known.
- A dynamic component returned from a hook (`const [MyLoading, controller] = useLoading()`).
- `busy()`/`done()` or `begin()`/release-token lifecycle methods in v1.
- A `focusManagement` opt-out, `minVisible`, or `blockInteraction` prop in v1.
- The legacy opaque body background, `z-index: 999999`, and the full v8 `Spinner` prop surface.
- A ReactNode label, HTML parsing, or a string resource/i18n framework.
- Any new runtime dependency, test harness, infrastructure or service.

---

## Technical Requirements

### Performance

- The loader is CSS-animation-driven through Fluent `Spinner`; there is no per-frame JavaScript.
- `useLoading` holds one active-operation array and re-renders only the component that calls it. No store, no portal and no global subscription is required.
- The overlay timer is a single `setTimeout` per loading transition and is cleaned up on hide, delay change and unmount.
- `LoadingOverlay` composes the existing `Loading` indicator path; it does not duplicate spinner rendering logic.

### Compatibility

- React 19 and Fluent UI v9 are peer dependencies supplied by the application; the repository already uses them.
- `inert` is a React 19 native attribute. The overlay falls back to a normal content wrapper if `display: contents` is unavailable; no browser polyfill is planned.
- Server rendering must not access `document`, `window`, `HTMLElement` or timers during render.
- The component follows the active `FluentProvider` theme, including dark and custom themes; the scrim uses `tokens.colorBackgroundOverlay`.

### Security

- The only user-facing text is the `label` string; React escapes it. No HTML parsing, `dangerouslySetInnerHTML`, `eval`, network access, credential handling or storage is involved.
- `children` are application-owned React nodes; the component does not inspect, serialize or transmit them.
- The components add no authentication, authorization, server input path or rate-limiting surface. Those concerns remain in the host application and are recorded as not applicable for this UI-only feature.

### Accessibility

- The loading state has a single polite announcement source (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`). The visual spinner is `aria-hidden`.
- `LoadingOverlay` marks the region busy with `aria-busy`, removes covered content from the tab order and accessibility tree with `inert`, and blocks pointer interaction with the scrim while visible.
- Focus moves only when it was inside the covered region; it is restored only when the component moved it and the target is still connected.
- The label is always non-empty through the English default and blank fallback.
- The components add no custom animation; the Fluent spinner is the only motion. No fade or scale transition is added, so there is no extra reduced-motion concern.
- A real-browser manual check is required for `inert` blur behavior, focus restoration, dark theme and reduced motion because jsdom cannot verify them.

### Localization

- `label` is a plain string prop. The package ships an English default (`Loading…`) and no resource files. Applications pass translated labels at the call site.

### Documentation

- Every public component, prop, hook, controller member and exported type has a documentation comment in teaching tone.
- The README includes props tables, composition patterns, accessibility notes, a localization note and a decision table.
- Storybook stories cover every documented variant and the async flow, with a manual review checklist for real-browser behavior.

---

## Scope Decisions

| Decision            | Options Considered                                                   | Chosen                               | Rationale                                                                                                           | AR Ref |
| ------------------- | -------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------ |
| Public pieces       | Overlay + hook only; all three                                       | All three                            | The legacy filler use case and the new shim use case are both real; a standalone spinner is the smallest primitive. | AR #1  |
| Artifact shape      | Standalone plan; feature + RD + plan                                 | Feature `loading`, RD-01 + plan      | Fits the nested layout and roadmap/feature pipeline.                                                                | AR #2  |
| API shape           | Dynamic tuple; provider + hook; normal components + local controller | Normal components + local controller | Stable component identity, statically analyzable, no provider tree restructuring.                                   | AR #3  |
| Operation lifecycle | `busy/done`; `begin` release; `run` only                             | `run` only                           | `run` is error-safe and concurrency-safe; paired lifecycles are easy to unbalance.                                  | AR #4  |
| Overlay behavior    | Replacement; blocking mounted overlay; global portal                 | Blocking mounted overlay             | Region-level evidence (47/47), stable layout, inert blocking, no global stacking/focus costs.                       | AR #5  |
| Label policy        | Required label; English default + fallback                           | English default + fallback           | Fixes the legacy 35/47 unlabeled uses and matches the repository's string pattern.                                  | AR #6  |
| Standalone visual   | Legacy opaque background + z-index; transparent centered filler      | Transparent centered filler          | The background and z-index were v8 workarounds; a filler does not need them.                                        | AR #7  |
| Non-goals           | Provider/global/Skeleton/ProgressBar/new deps; none                  | Explicit exclusion                   | Keeps the feature small and avoids unrequested surface.                                                             | AR #8  |
| Hook return shape   | `{ isLoading, label, run }`; store-backed controller; boolean helper | `{ isLoading, label, run }`          | Simple, typed, no store; the caller re-renders as with ordinary state.                                              | AR #9  |

> **Traceability:** Every scope decision references the Ambiguity Register entry that resolved it. See `00-ambiguity-register.md`.

---

## Acceptance Criteria

1. [ ] `<Loading />` renders a centered indeterminate spinner with the visible and announced label `Loading…`, a polite status region and an `aria-hidden` visual indicator (R1, R3, R4).
2. [ ] `<Loading label="Saving" />` shows `Saving`; a blank or whitespace-only label shows `Loading…` (R3).
3. [ ] `<Loading delay={300} />` shows no indicator or status text before 300 ms and shows both at 300 ms; `delay={0}` shows them after mount (R4).
4. [ ] `<Loading minHeight={240} />` carries `minHeight: 240px`; the root fills its parent, is not in the tab order, merges `className`/`style` and forwards `ref` and native props (R2, R5).
5. [ ] `<LoadingOverlay loading={false}>content</LoadingOverlay>` renders the content, no scrim, no status text, and `aria-busy="false"` (R6).
6. [ ] `<LoadingOverlay loading delay={0}>content</LoadingOverlay>` keeps the content mounted, renders a scrim and spinner, resolves the label, sets `aria-busy="true"` and marks the content wrapper `inert` (R6, R7, R8).
7. [ ] The default 300 ms delay prevents a flash for an operation that settles earlier; a `loading` change to false before the delay cancels the overlay (R6).
8. [ ] While visible, covered content cannot be reached by keyboard or assistive technology; the scrim blocks pointer interaction; the status text is announced once (R7, R8).
9. [ ] Focus inside the content moves to the overlay root when the overlay appears; focus outside is untouched; focus returns to the captured element when loading ends if it is still connected (R9).
10. [ ] `useLoading()` starts idle; `run` sets `isLoading`, returns the operation's value, clears the flag on success and failure, and rethrows the same error (R11, R12, R13).
11. [ ] Two overlapping `run` calls keep `isLoading` true until both settle; labels resolve deterministically and by operation id (R12).
12. [ ] `run` is referentially stable; unmounting during a run does not warn; the hook does not swallow errors (R13).
13. [ ] The package root exports exactly the three runtime symbols and four types listed in R14; the export-surface test and type pins compile (R14).
14. [ ] README, stories and JSDoc document every public piece, prop, hook member and accessibility behavior (R14).
15. [ ] `pnpm verify` and `pnpm storybook:build` pass; SSR smokes render without touching browser APIs (R15, R17).
16. [ ] The implementation contains no provider, global blocker, portal, `Skeleton`/`ProgressBar` variant, v8 prop surface, `busy`/`done`, `begin`, `minVisible`, new dependency or string resource file (R16).

---

## Legacy Evidence

The source component is `packages/fui8/src/Loading` in the CastingAppMT repository:

| File                | Functional evidence                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Loading.tsx`       | Forward-ref shell; calls a state hook and render function.                                                      |
| `LoadingTypes.ts`   | Extends v8 `ISpinnerProps` plus `backgroundColor`; no `loading` prop.                                           |
| `LoadingLogic.ts`   | Defaults `size` to `SpinnerSize.large`; no timing or state.                                                     |
| `LoadingRender.tsx` | Renders a `Spinner` inside a wrapper `div`.                                                                     |
| `LoadingStyles.ts`  | Root is `100% × 100%`, centered, `z-index: 999999`, opaque `semanticColorsBodyBackground` by default.           |
| Webclient usage     | 47 call sites; all 47 are the replacement branch of a `fetching ? … : …` condition; 12 pass a label; 35 do not. |

The legacy evidence is functional input only. No v8 code, style, prop or mechanism is reused.

---

## Verification

The repository's full gate is `pnpm verify` (`AGENTS.md:21`):

```bash
pnpm verify
pnpm storybook:build
```

Specification tests are written before implementation, verified to fail, then kept unchanged. The plan's `07-testing-strategy.md` owns the concrete ST cases.
