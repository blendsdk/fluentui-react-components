# Testing Strategy: Loading Primitives

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type                               | Target                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| Component contract and hook state logic | 90%                                                    |
| Styling / layout glue                   | Storybook + manual review (jsdom has no layout engine) |
| SSR/import safety                       | Smoke coverage in the node environment                 |

The repository does not enforce coverage thresholds. The goal is contract coverage, not a percentage:
every observable promise in RD-01 has an ST case, an SSR smoke case, or an explicit story/manual
check.

- Test names state behavior: `renders the default label`, `clears the busy state when the operation rejects`.
- Integration is covered by the `useLoading` + `LoadingOverlay` story; there is no E2E harness in this
  repository. Adding one would be a material support surface and is not required for this UI behavior
  (recorded as N/A with that reason).
- `*.spec.test.tsx` files are the immutable oracle; expectations below come from RD-01, the `03-0x`
  specs and the AR entries, never from imagined implementation behavior. `*.ssr.test.tsx` files are
  smoke tests under the repository convention (`AGENTS.md:31,40`), not oracle tests.

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

> These test cases are derived exclusively from `01-requirements.md` (RD-01), `03-01`…`03-03` and
> `00-ambiguity-register.md`. They define expected behavior before implementation exists. If the
> implementation does not match an expectation, the implementation is wrong, not the test.

### Loading

| #     | Input / Scenario                                                        | Expected Output / Behavior                                                                                                                             | Source                 |
| ----- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| ST-1  | `<Loading />`                                                           | A single `role="status"` region whose text is `Loading…`; a decorative spinner is present and hidden from assistive technology.                        | RD-01 R1, R3, R4; AR-3 |
| ST-2  | `<Loading label="Loading records" />`                                   | The status region text is `Loading records`; the visible label is the same string.                                                                     | RD-01 R3               |
| ST-3  | `<Loading label="   " />`                                               | The status region text is `Loading…`; no empty label is rendered.                                                                                      | RD-01 R3; AR-7         |
| ST-4  | `<Loading data-testid="loader" className="caller" aria-label="Busy" />` | The root has `data-testid="loader"`, the caller class, and `aria-label="Busy"`; the root remains the single status region.                             | RD-01 R5; AR-9         |
| ST-5  | `<Loading ref={ref} />`                                                 | `ref.current` is the root `HTMLDivElement`.                                                                                                            | RD-01 R5               |
| ST-6  | `<Loading />`                                                           | The root is not in the tab order (`tabIndex` is absent or `-1`; it is not a focusable control).                                                        | RD-01 R5               |
| ST-7  | `<Loading minHeight={240} />`                                           | The root's inline style carries `min-height: 240px` (or the equivalent `240` value accepted by React).                                                 | RD-01 R2; AR-9         |
| ST-7a | `<Loading style={{ minHeight: 120 }} />`                                | The root's inline style keeps `min-height: 120px`; omitting the prop does not clobber the caller's style.                                              | RD-01 R5; AR-9         |
| ST-7b | `<Loading minHeight={240} style={{ minHeight: 120 }} />`                | The root's inline style is `min-height: 240px`; a defined `minHeight` prop wins over `style.minHeight`.                                                | RD-01 R2, R5; AR-9     |
| ST-8  | `<Loading delay={300} />` with fake timers                              | At 0–299 ms the status text is empty and no visual spinner is rendered; at 300 ms the status text becomes `Loading…` and the spinner appears.          | RD-01 R2, R4; AR-5     |
| ST-9  | `<Loading />`                                                           | The root has `aria-live="polite"` and `aria-atomic="true"`; the visual indicator wrapper has `aria-hidden="true"`; there is exactly one status region. | RD-01 R4; AR-3         |
| ST-10 | Rerender `<Loading label="One" />` as `<Loading label="Two" />`         | The status text changes from `One` to `Two` without a remount of the live region.                                                                      | RD-01 R3, R4; AR-5     |

### LoadingOverlay

| #      | Input / Scenario                                                                                              | Expected Output / Behavior                                                                                                                                                                                                                          | Source                    |
| ------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| ST-11  | `<LoadingOverlay loading={false}><button>Save</button></LoadingOverlay>`                                      | The button is rendered; no status text, no `inert` and no scrim (the root has no third child); the content wrapper has `aria-busy="false"`.                                                                                                         | RD-01 R6, R8              |
| ST-12  | `<LoadingOverlay loading delay={0}><button>Save</button></LoadingOverlay>`                                    | The button is still rendered; the status text is `Loading…`; the content wrapper has `inert` and `aria-busy="true"`; the scrim is rendered and contains an `aria-hidden` indicator; the status node is not a descendant of the `aria-busy` element. | RD-01 R6–R8               |
| ST-13  | `<LoadingOverlay loading delay={0} label="Saving…">content</LoadingOverlay>`                                  | The status text is `Saving…`; the visible label is `Saving…`.                                                                                                                                                                                       | RD-01 R10; AR-7           |
| ST-14  | `<LoadingOverlay loading delay={0} label="  ">content</LoadingOverlay>`                                       | The status text is `Loading…`.                                                                                                                                                                                                                      | RD-01 R10; AR-7           |
| ST-15  | `<LoadingOverlay loading>content</LoadingOverlay>` with the default 300 ms delay, fake timers                 | At 0–299 ms the status text is empty, the content is not inert, no scrim is rendered, and the content wrapper already has `aria-busy="true"`; at 300 ms the status text is `Loading…`, the content is inert and the scrim is visible.               | RD-01 R6–R8; AR-5         |
| ST-16  | Start loading, then set `loading={false}` before 300 ms; advance timers                                       | The status text never becomes the label; the content is never inert; the content wrapper ends with `aria-busy="false"`.                                                                                                                             | RD-01 R6; AR-5            |
| ST-17  | Focus a button inside the content, then set `loading` true with `delay={0}` and flush effects                 | The overlay root (`tabIndex=-1`, named by `aria-labelledby` the status node) is `document.activeElement`.                                                                                                                                           | RD-01 R9; AR-6            |
| ST-18  | Focus a button outside the overlay, then set `loading` true with `delay={0}`                                  | The outside button remains `document.activeElement`; focus is not moved.                                                                                                                                                                            | RD-01 R9; AR-6            |
| ST-19  | After ST-17, set `loading={false}` and flush effects                                                          | The previously focused button is `document.activeElement` again because it is still connected; `inert` is removed, `aria-busy` is `false`, no scrim remains and the status text is empty.                                                           | RD-01 R9; AR-6            |
| ST-19a | Focus button A, set `loading` true, tab to button B inside the content during the delay, then reveal and end  | Focus moves to the overlay root on reveal; when loading ends, focus returns to B (the reveal-time element), not A, because B is still connected.                                                                                                    | RD-01 R9; AR-6            |
| ST-20  | Focus an inside button, set `loading` true, blur the active element to `body` before reveal                   | When the overlay reveals, the overlay root becomes `document.activeElement` using the captured element fallback.                                                                                                                                    | RD-01 R9; AR-6            |
| ST-21  | Focus an inside button, set `loading` true, unmount the button before reveal, then reveal                     | No throw; `document.activeElement` is `document.body`; the disconnected button is never focused, and the overlay does not focus its root because the captured element is not connected.                                                             | RD-01 R9; AR-6            |
| ST-22  | `<LoadingOverlay loading={false} data-testid="overlay" className="caller" style={{ padding: 4 }} ref={ref}>…` | Root receives the data attribute, merged class and style, and `ref`; `tabIndex` is `-1`; the root does not expose `aria-busy`; the content wrapper reflects `loading` through `aria-busy`.                                                          | RD-01 R10; AR-9           |
| ST-23  | `<LoadingOverlay loading delay={0}>content</LoadingOverlay>`                                                  | The content and the status are descendants of the root; the status is a sibling of the content wrapper that owns `aria-busy`; the overlay does not portal to `document.body`.                                                                       | RD-01 R6, R8, R15; AR-4   |
| ST-24  | Rapidly toggle `loading` true → false → true with a positive delay; advance timers                            | Only the latest true cycle reveals the overlay; no stale timer reveals it after a false state; the status text matches the final cycle.                                                                                                             | RD-01 R6; AR-5            |
| ST-24a | Start loading with `delay={300}`, advance 200 ms, change `delay={0}`, advance timers                          | The new delay applies to the next activation: the current reveal still happens at 300 ms; the overlay does not appear early and does not restart.                                                                                                   | RD-01 R6; AR-5            |
| ST-25  | Mount with loading true and a delay, unmount before the timer, advance timers                                 | No throw; after unmount `vi.getTimerCount()` is `0` (the timer was cleared); no callback runs when the timers advance.                                                                                                                              | RD-01 R6, R15; AR-5       |
| ST-26  | With the overlay visible, change `label` from `Saving…` to `Publishing…`                                      | The persistent status text changes to `Publishing…`; the visible label changes; the content stays mounted and inert; the status remains outside the `aria-busy` subtree.                                                                            | RD-01 R8, R10; AR-5, AR-7 |
| ST-27  | Mount `<LoadingOverlay loading delay={0}>…`, then toggle `loading` false and true again                       | The same status DOM node is reused across the toggle (node identity); it is not remounted, and its text still follows the label. The SSR smoke covers the empty initial node.                                                                       | RD-01 R6–R8; AR-5         |

### useLoading

| #      | Input / Scenario                                                                   | Expected Output / Behavior                                                                                                                                                                         | Source                 |
| ------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| ST-28  | `const { isLoading, label, run } = useLoading()`                                   | `isLoading` is `false`; `label` is `undefined`; `run` is a function.                                                                                                                               | RD-01 R11              |
| ST-29  | Start `run(() => deferred.promise)`; resolve the deferred with `42`                | `isLoading` is `true` while the deferred is pending (before resolution); after resolution it is `false`; the promise resolves `42`; the same hook instance reports both states.                    | RD-01 R11, R12         |
| ST-30  | `await run(() => Promise.reject(error))`                                           | `isLoading` is `false` after; the promise rejects with the same `error` object; the hook does not swallow or replace it.                                                                           | RD-01 R12, R13; AR-8   |
| ST-31  | Start two deferred runs; resolve the first; resolve the second                     | `isLoading` stays `true` after the first settles and becomes `false` only after the second.                                                                                                        | RD-01 R12; AR-8        |
| ST-31a | Start two deferred runs, reject the first, then resolve the second                 | Only the first operation is removed; `isLoading` stays `true` and the second operation's label (or the non-blank default, else `undefined`) remains until it settles; then `isLoading` is `false`. | RD-01 R12; AR-8        |
| ST-32  | `useLoading({ label: 'Please wait…' })`, idle                                      | `label` is `Please wait…`.                                                                                                                                                                         | RD-01 R11; AR-7        |
| ST-32a | `useLoading({ label: '   ' })`, idle                                               | `label` is `undefined`; a blank default is treated as no default.                                                                                                                                  | RD-01 R11; AR-7        |
| ST-33  | `run(op, { label: 'Saving…' })`, then settle                                       | `label` is `Saving…` while active; after settlement it falls back to the hook default, or `undefined` when no default was supplied.                                                                | RD-01 R11, R12; AR-7   |
| ST-33a | `run(op, { label: '   ' })` with a non-blank hook default, while active            | The blank per-run label is treated as no label; the hook default is reported.                                                                                                                      | RD-01 R11, R12; AR-7   |
| ST-34  | Start A with label `A`, then B with label `B`; settle B, then A                    | `label` is `B` while both run; `A` after B settles; the non-blank hook default (else `undefined`) after A settles.                                                                                 | RD-01 R12; AR-7        |
| ST-35  | Rerender the hook's host component without changing state                          | The `run` function identity is the same across renders.                                                                                                                                            | RD-01 R13; AR-8        |
| ST-36  | `await run(() => 7)`                                                               | The promise resolves `7`; `isLoading` becomes false; the return is still a Promise.                                                                                                                | RD-01 R11, R12         |
| ST-37  | `await run(() => { throw error; })`                                                | The promise rejects with the same `error`; `isLoading` is false afterwards.                                                                                                                        | RD-01 R12, R13; AR-8   |
| ST-38  | Inspect the controller object                                                      | It exposes `isLoading`, `label` and `run`; it has no `busy`, `done` or `begin` members.                                                                                                            | RD-01 R16; AR-15       |
| ST-39  | Start a run, unmount the host component, then resolve the operation                | No throw; the returned promise still resolves with the operation's value; the operation is not cancelled by the hook.                                                                              | RD-01 R13; AR-8, AR-12 |
| ST-40  | Change `useLoading({ label: 'One' })` to `useLoading({ label: 'Two' })` while idle | The returned `label` becomes `Two`.                                                                                                                                                                | RD-01 R11; AR-7        |
| ST-41  | Start an unlabeled run, then a labeled `A` run; settle A, then the unlabeled run   | `label` is `A` while A is active; after A settles, `label` is `undefined` because no hook default was supplied, even though the unlabeled run is still active; the overlay then shows `Loading…`.  | RD-01 R12; AR-7        |
| ST-41a | Start a labeled `A` run, then an unlabeled `B` run; settle A before B              | `label` is `A` while A is active; after A settles, `label` is `undefined` while B still runs; B never suppresses A's label.                                                                        | RD-01 R12; AR-7        |
| ST-42  | Start overlapping labeled A and B, settle B before A                               | The label returns to A (id-based removal; not last-in-first-out).                                                                                                                                  | RD-01 R12; AR-7, AR-8  |
| ST-43  | Reject a run with a specific error object                                          | The rejection value is the exact same object (`toBe`), not a wrapped or serialized error.                                                                                                          | RD-01 R13; AR-8        |

### Package surface

| #     | Input / Scenario                                                       | Expected Output / Behavior                                                                                                                                                                                                                                                                                                                                                          | Source           |
| ----- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| ST-44 | Import `* as api` from the package root                                | The runtime export list contains exactly `Loading`, `LoadingOverlay` and `useLoading` in addition to the existing symbols; no internal helper leaks.                                                                                                                                                                                                                                | RD-01 R14; AR-11 |
| ST-45 | Import the public types and build typed values; add negative type pins | `LoadingProps`, `LoadingOverlayProps`, `LoadingOptions` and `LoadingController` compile and accept the documented shapes. `@ts-expect-error` pins reject `role`/`aria-live`/`aria-atomic`/`dangerouslySetInnerHTML` on `Loading`, and `aria-busy`/`aria-label`/`aria-labelledby`/`aria-live`/`aria-atomic`/`role`/`inert`/`tabIndex`/`dangerouslySetInnerHTML` on `LoadingOverlay`. | RD-01 R14; AR-11 |

## SSR Smoke Cases (repository convention)

> `test/loading.ssr.test.tsx` is a smoke file, not the immutable oracle. The repository defines
> `*.ssr.test.tsx` as node-environment smoke coverage (`AGENTS.md:31,40`). These cases keep the
> identifiers used in earlier planning so traceability is preserved.

| #     | Input / Scenario                                                                        | Expected Output / Behavior                                                                                                        | Source           |
| ----- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| ST-46 | `renderToString(<Loading />)` in the node environment                                   | No throw, no browser API access; the status root is present and its text is empty before hydration.                               | RD-01 R15; AR-12 |
| ST-47 | `renderToString(<LoadingOverlay loading><span>server content</span></LoadingOverlay>)`  | No throw; `server content` is present; the content wrapper carries `aria-busy="true"`; the status text is empty before hydration. | RD-01 R15; AR-12 |
| ST-48 | `renderToString` a small component that calls `useLoading()` and renders its idle state | No throw and no browser API access; `isLoading` is false on the server.                                                           | RD-01 R15; AR-12 |

## Test Categories

> **Export-pin sequencing:** `test/package-exports.spec.test.ts` is extended incrementally as each
> phase lands its public symbol (`Loading` in Phase 1, `LoadingOverlay` in Phase 2, `useLoading` in
> Phase 3). ST-44/ST-45 describe the cumulative final surface reached in Phase 3; each phase's pin
> assertion covers the symbols that exist at that point, so every phase can reach a green suite.

### Specification Tests (from ST-cases above)

| Test File                            | ST Cases Covered                                       | Component        |
| ------------------------------------ | ------------------------------------------------------ | ---------------- |
| `test/loading.spec.test.tsx`         | ST-1…ST-10 (including ST-7a/ST-7b)                     | `Loading`        |
| `test/loading-overlay.spec.test.tsx` | ST-11…ST-27 (including ST-19a and ST-24a)              | `LoadingOverlay` |
| `test/use-loading.spec.test.tsx`     | ST-28…ST-43 (including ST-31a, ST-32a, ST-33a, ST-41a) | `useLoading`     |
| `test/package-exports.spec.test.ts`  | ST-44, ST-45                                           | Package surface  |

### SSR Smoke Tests

| Test File                   | ST Cases Covered | Environment |
| --------------------------- | ---------------- | ----------- |
| `test/loading.ssr.test.tsx` | ST-46…ST-48      | Node        |

### Implementation Tests (edge cases, internals)

| Test File                            | Description                                                                                                                                                 | Priority |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `test/loading.impl.test.tsx`         | Class merge, root/indicator structure, indicator `aria-hidden` ownership, theme label color, timer cleanup and delay normalization on unmount               | High     |
| `test/loading-overlay.impl.test.tsx` | Capture-before-inert ordering with `loading`/`visible`, body-focus fallback, ownership-guarded restore, unmount-while-visible, class merge, scrim structure | High     |
| `test/use-loading.impl.test.tsx`     | Out-of-order id removal, label stack fallback, immediate `isLoading`, no stale active entries                                                               | High     |

### Integration Tests

| Test                 | Components                               | Description                                                                                 |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Async save story     | `useLoading`, `LoadingOverlay`, `Button` | A deferred save shows the overlay, disables the trigger via `isLoading`, and restores idle. |
| Fast operation story | `LoadingOverlay`                         | A 150 ms operation settles before the 300 ms delay; no overlay flash.                       |

### End-to-End Tests

| Scenario | Steps | Expected Result                                                                                                                                                                              |
| -------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N/A      | —     | The repository has no E2E harness; adding one is a material support surface and is not required for this UI behavior. Storybook manual checks cover the real-browser `inert`/focus behavior. |

## Test Data

### Fixtures Needed

- A deferred promise helper (`createDeferred<T>()`) for pending/resolve/reject transitions, used by
  ST-29, ST-31 and ST-31a.
- A focusable button inside the overlay content and one outside it.
- A `FluentProvider` wrapper with `webLightTheme`, mirroring application mounting.
- Fake timers for `delay` cases; restore real timers in `afterEach`.

### Mock Requirements

- No Fluent UI mocks: the tests use the real `Spinner`, tokens and `FluentProvider`.
- No network or storage mocks; the hook takes plain functions.
- `document.activeElement`/`focus()` are real jsdom APIs; the inert-blur fallback is simulated by
  blurring to `body` because jsdom does not implement inert focus blocking.

## Verification Checklist

- [ ] All specification test cases (ST-1…ST-45) are defined with concrete input/output pairs.
- [ ] Every ST case traces to RD-01, a `03-0x` spec or an AR entry.
- [ ] Specification tests are written before implementation.
- [ ] Specification tests are verified to fail before implementation (red phase), including
      `pnpm type-check` for the type pins.
- [ ] All specification tests pass after implementation (green phase).
- [ ] SSR smoke cases ST-46…ST-48 pass in the node environment.
- [ ] Implementation tests cover focus fallback, timer cleanup/normalization, class merge and
      structure.
- [ ] All unit/integration/SSR tests pass.
- [ ] No regressions in existing tests.
- [ ] `pnpm verify` passes.
- [ ] `pnpm storybook:build` succeeds in each implementation phase and in Phase 4.
- [ ] The manual story checklist in `99-execution-plan.md` task 4.1.5 covers real-browser
      inert/focus, focus target name, busy exposure, light and dark label contrast, fixed-region
      scope, forced colors, reduced motion, no double announcement and the portaled
      `Menu`/sticky-header limitation.
