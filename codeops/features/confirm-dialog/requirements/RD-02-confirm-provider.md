# RD-02: ConfirmProvider and useConfirm

> **Document**: RD-02-confirm-provider.md
> **Status**: Draft
> **Created**: 2026-10-16
> **Project**: fluentui-react-components
> **Depends On**: RD-01
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

`ConfirmProvider` + `useConfirm()` are the DX layer of the feature: the application mounts the
provider once near its root and then asks for decisions anywhere with a single awaited call —
`if (await confirm({ title, message, intent: 'danger' })) { … }` — instead of owning dialog state,
handlers and JSX at every call site. The legacy application repeated that plumbing 25 times; this
RD removes it.

The provider renders at most one `ConfirmDialog` (RD-01) and stays invisible otherwise: it adds no
DOM while idle, captures no policy, and performs no side effects. The design follows the
repository's proven `SystemErrorProvider` pattern — a context-scoped convenience layer whose hook
throws outside its provider — and the upstream precedent of Fluent's own toast facility
(`Toaster` + `useToastController`), with the deliberate difference that this API is
promise-based: each request settles exactly once, and the promise never rejects.

---

## Functional Requirements

### Must Have (M)

- [ ] `ConfirmProvider` wraps an application subtree once, renders its `children` unchanged, and
      renders at most one `ConfirmDialog` while a request is pending; with no request it adds no
      DOM (AR #16).
- [ ] Mount-once guidance: one provider at the application root, above the router; `useConfirm()`
      works from any descendant on any page — per-page providers are never required (AR #16).
- [ ] Nested providers: the nearest provider serves its subtree. One provider per React root is
      the supported setup (documented in the README setup section); more than one per root is
      unsupported — two dialogs could appear simultaneously (AR #16).
- [ ] `useConfirm()` returns a referentially stable function for the lifetime of the provider; it
      throws an `Error` naming both `useConfirm` and `ConfirmProvider` when called outside the
      provider (AR #16; house `SystemErrorProvider` precedent).
- [ ] `confirm(options)` resolves `Promise<boolean>` in pair mode (title, optional message,
      optional intent, optional strings) and `Promise<V>` in actions mode (custom action set,
      typed by literal inference); the request options reuse the RD-01 content and action
      contracts (AR #7, AR #8, AR #20).
- [ ] The dialog shown by the provider behaves exactly like RD-01: alert semantics, no implicit
      dismissal, safe-action initial focus, same accessibility wiring (AR #6, AR #13, AR #14).
- [ ] Activation closes the dialog immediately and then resolves the promise with the chosen
      outcome; the provider never keeps the dialog open while the host's follow-up runs —
      hold-open busy mode is a named deferral (AR #22).
- [ ] Replacement semantics: while a request is pending, a new `confirm()` call resolves the
      previous promise `false` and then shows the new dialog — a `confirm()` call never rejects
      and never leaves a dangling `await` (AR #17).
- [ ] Settlement guarantees: every promise settles exactly once; provider unmount resolves any
      pending request `false`; a superseded or unmounted request reports "not confirmed" — the
      safe direction (AR #17).
- [ ] Provider-level defaults: `strings` prop applying to every dialog the provider shows;
      per-call `strings` override them key by key (AR #18).
- [ ] Usage contract, documented in the README setup section: call `confirm()` from event
      handlers or effects — not during render, not on the server; the provider is SSR-safe in the
      sense that it renders only its children until a request exists on the client (AR #17).
- [ ] Specification, implementation and SSR-smoke tests, a Storybook story with an interactive
      trigger, README section (including the provider-count caveat), the README Principles
      carve-out update naming this provider as the second transient-state layer, and the updated
      package export-surface test (AR #21, AR #24).

### Should Have

- None — the confirmed scope fits Must Have and Won't Have.

### Won't Have (Out of Scope)

- A module-level global `confirm()` singleton importable outside React (AR #16).
- Queueing concurrent prompts — replacement is the single, documented concurrency behavior
  (AR #17).
- Hold-open busy mode with disabled actions during the host's async work — named deferral
  (AR #22).
- Provider-level `intent`/`actions` defaults — per-call only (AR #18).
- Data fetching, policy decisions, telemetry, or business logic of any kind — the provider is a
  convenience layer over RD-01 (AR #24 boundary applies).
- Multiple simultaneous dialogs per root (AR #16).

---

## Technical Requirements

### Component anatomy (M)

Following the repository pattern under `packages/react-components/`:

| File                                                         | Role                                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `src/components/ConfirmProvider/ConfirmProvider.tsx`         | Provider component: request state, rendering the single dialog                                          |
| `src/components/ConfirmProvider/ConfirmProvider.types.ts`    | Provider props and request option contracts                                                             |
| `src/components/ConfirmProvider/ConfirmContext.ts`           | Internal context (`createContext<ConfirmContextValue \| null>`)                                         |
| `src/components/ConfirmProvider/useConfirm.ts`               | The public hook; throws outside the provider                                                            |
| `src/components/ConfirmProvider/index.ts`                    | Barrel                                                                                                  |
| `src/components/ConfirmProvider/ConfirmProvider.stories.tsx` | Storybook story with an interactive trigger                                                             |
| `src/index.ts`                                               | Package barrel: provider + hook + public types                                                          |
| `packages/react-components/README.md`                        | Provider section: setup, props table, request table, composition, provider-count caveat, usage contract |
| `test/confirm-provider.spec.test.tsx`                        | Contract tests derived from this RD                                                                     |
| `test/confirm-provider.impl.test.tsx`                        | Internals (replacement, settle-once, stability, unmount resolution)                                     |
| `test/confirm-provider.ssr.test.tsx`                         | SSR smoke: children render, no dialog markup, no window access                                          |
| `test/package-exports.spec.test.ts`                          | Extended export-surface list                                                                            |

### Public API (M)

```ts
/** Request options for the default pair; resolves `boolean`. */
export interface ConfirmOptions {
  title: ReactNode;
  message?: ReactNode;
  intent?: ConfirmIntent;
  strings?: Partial<ConfirmDialogStrings>;
  actions?: undefined;
}

/** Request options for a custom action set; resolves the chosen value. */
export interface ConfirmOptionsWithActions<V extends string> extends Omit<
  ConfirmOptions,
  'intent' | 'actions'
> {
  actions: readonly [ConfirmAction<V>, ...ConfirmAction<V>[]];
}

/** The stable imperative API returned by the hook. */
interface ConfirmContextValue {
  confirm(options: ConfirmOptions): Promise<boolean>;
  confirm<V extends string>(options: ConfirmOptionsWithActions<V>): Promise<V>;
}

/** Props of the provider. */
export interface ConfirmProviderProps {
  children: ReactNode;
  /** Text defaults applied to every dialog this provider shows. */
  strings?: Partial<ConfirmDialogStrings>;
}

export function useConfirm(): ConfirmContextValue['confirm'];
```

- **Discrimination:** the overload resolves to `boolean` or the literal union `V` exclusively by
  the presence of `actions`; the shapes use `actions?: undefined` so the first overload rejects
  action-carrying options and the second one matches them (AR #20).
- **Stability:** the returned `confirm` function is created with `useCallback` over a memoized
  context value and never changes identity while the provider stays mounted.
- **Error contract:** the hook throws
  `new Error('useConfirm must be used inside a ConfirmProvider: wrap the application subtree in the provider and call the hook from a descendant.')`
  when no provider is found (house wording pattern; AR #16).

### Provider mechanics (M)

- **Request state:** a single internal record holding the active options and the promise's
  `resolve` — `undefined` when idle. The record is written synchronously when a request is
  created (a ref is the authority; rendered state mirrors it), so any `confirm()` call in the
  same tick sees and supersedes the current record; promises are never settled inside state
  updaters.
- **Replacement:** a `confirm()` call while a request is active resolves the previous record's
  promise `false` (settle-once guarded) and installs the new record in the same update — the
  previous dialog never remains visible after the swap (AR #17). The new dialog is keyed per
  request so v9's focus acquisition runs again: after a supersede, focus is inside the new
  dialog. Activation clears the record only if the ref still identifies the activated request
  (conditional clear), so a request installed in the same dispatch is never clobbered.
- **Settlement:** each request carries a settled flag; the first settle wins. On activation the
  provider clears the active record only when it still identifies the activated request
  (conditional clear — see Replacement), closing the dialog, and resolves with the chosen outcome.
- **Unmount:** a genuine provider unmount resolves a still-pending request `false`, so no `await`
  can hang. Requests created in mount effects may exist at the StrictMode probe, whose
  cleanup/re-setup pair must not settle them: the pending settlement is deferred one microtask
  and cancelled when the probe's synchronous re-setup runs (a probe/unmount discriminator), so
  only a real unmount settles (documented in code).
- **Rendering:** the provider passes request options into the RD-01 component — pair mode maps to
  `intent` + default actions, actions mode maps to the `actions` array; `strings` resolve along
  the chain per-call → provider → English defaults: a non-empty per-call value wins, an
  empty-string per-call value counts as not supplied, so the provider default (or the English
  default) applies (AR #15, AR #18).
- **No side effects:** no listeners, no timers, no network, no storage; children render
  unchanged and are never re-created by request state changes (AR #16).

### SSR and environment safety (M)

- The provider performs no DOM or `window` access at render time; a request can only be created
  after client-side interaction.
- SSR smoke: server-rendering a tree containing the provider and a child yields the child's
  markup only — no dialog markup, no errors (AR #17).

---

## Integration Points

### With RD-01 (ConfirmDialog)

- The provider renders exactly one `ConfirmDialog` and supplies `open`, `title`, `message`,
  `intent`/`actions` and `strings` (the pair/actions mapping above); the provider never sets
  `busy` — hold-open is the named deferral (AR #22); the `onResolve` callback closes the dialog
  and settles the promise (RD-01).
- All dialog semantics — alert dismissal behavior, focus policy, accessibility wiring — are
  RD-01's contract and are not re-implemented here.

### With the existing package

- The package barrel gains `ConfirmProvider`, `useConfirm` and their public types —
  `ConfirmProviderProps`, `ConfirmOptions` and `ConfirmOptionsWithActions`; the context module
  stays internal (house rule).
- `SystemErrorProvider`'s implementation is the referenced pattern for context shape, error
  wording and unmount safety; the provider adds the promise lifecycle on top of it.

---

## Scope Decisions

| Decision            | Options Considered                                     | Chosen                                                           | Rationale                                                                                   | AR Ref |
| ------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| Invocation surface  | Provider + hook vs global singleton                    | Provider + hook, root-mounted once                               | Works across pages and routes; SSR- and theme-safe; mirrors `SystemErrorProvider`/`Toaster` | AR #16 |
| Concurrency         | Replacement vs queueing                                | Replacement; previous resolves `false`                           | Prompts are modal; no stale dialogs from abandoned flows; no dangling awaits                | AR #17 |
| Settlement failures | Reject vs resolve `false`                              | Resolve `false` on supersede/unmount                             | The safe direction (no accidental action); the promise never rejects                        | AR #17 |
| Activation timing   | Close-then-resolve vs hold-open while host acts        | Close immediately, then resolve                                  | Simplest correct DX; hold-open mode is a named deferral with stated consequences            | AR #22 |
| Typing              | Boolean only vs typed overloads                        | Overloaded `confirm` with literal `V` inference                  | Exhaustive switches in callers; no casts; single hook/two modes                             | AR #20 |
| Defaults            | Provider `strings` only vs intent/actions defaults too | `strings` only; per-call `intent`/`actions`                      | Smallest useful surface; intent is always flow-specific                                     | AR #18 |
| Provider count      | Exactly one per root vs unlimited                      | One per root; nesting nearest-wins; multi documented unsupported | Prevents two simultaneous dialogs; the legitimate exception is separate React roots         | AR #16 |

> **Traceability:** Every scope decision references the Ambiguity Register entry that resolved
> it. See `00-ambiguity-register.md`.

---

## Security Considerations

- **Data sensitivity:** none — request options carry display content only; nothing is stored or
  transmitted.
- **Input validation:** options flow into typed RD-01 props; the RD-01 robustness rules (empty
  labels, empty actions) apply unchanged — a runtime-empty `actions` request behaves as a pair
  request and resolves a boolean.
- **Authentication & authorization:** N/A — no auth surface; any descendant of the provider may
  ask for a prompt, which is an application-design decision, not a security boundary.
- **Injection risks:** content rendering rules are RD-01's (text-only; never HTML); the provider
  adds no rendering path of its own.
- **Reliability:** promises never reject, are settled exactly once, and are resolved `false` on
  supersede/unmount — no unhandled rejection path exists (AR #17).
- **Encryption / rate limiting / infrastructure:** N/A — no data at rest or in transit, no
  endpoints, no secrets.

---

## Acceptance Criteria

1. [ ] `<ConfirmProvider><App /></ConfirmProvider>` renders the application subtree unchanged;
       with no active request, the document contains no `alertdialog` element.
2. [ ] In a component under the provider, `const ok = await confirm({ title: 'Delete?' })`
       resolves `true` after the confirm action is activated and `false` after decline; after the
       promise settles, the `alertdialog` is no longer in the document.
3. [ ] `await confirm({ title, actions: [{ value: 'cancel' }, { value: 'discard' }, { value: 'save' }] })`
       renders three actions; activating `discard` resolves the promise with `'discard'`
       (inferred literal union); the dialog follows the RD-01 action semantics. A runtime
       `actions: []` value (untyped consumer) falls back to the pair and resolves a boolean.
4. [ ] Replacement: two `confirm()` calls in sequence while the first dialog is open — the first
       promise resolves `false` without any user interaction, only the second dialog is visible,
       focus ends inside the new dialog after the swap (implementation test with differing action
       counts), and activating its confirm resolves the second promise `true`.
5. [ ] Unmount: a pending request whose provider is unmounted resolves `false`; no unhandled
       rejection is reported.
6. [ ] Outside the provider, calling `useConfirm()` throws an `Error` whose message names both
       `useConfirm` and `ConfirmProvider`.
7. [ ] Provider `strings={{ confirm: 'Yes', decline: 'No' }}` renders those labels on dialogs it
       shows; a non-empty per-call `strings` override wins key by key, and a per-call empty
       string resolves to the provider value (or the English default when the provider has none).
8. [ ] The function returned by `useConfirm()` is referentially identical across re-renders of a
       consumer while the provider stays mounted (implementation test).
9. [ ] SSR: `renderToString` of a provider-wrapped tree yields the child markup with no
       `alertdialog` markup and no window/DOM access errors (`test/confirm-provider.ssr.test.tsx`,
       node environment).
10. [ ] Exactly-once: activating confirm twice rapidly (double click, then flush) yields exactly
        one resolution and one `onResolve` activation path (implementation test).
11. [ ] Escape cannot dismiss a provider-shown dialog and produces no settlement; the keydown is
        dispatched on the `alertdialog` element (focus inside the dialog) and the dialog is still
        present after it (RD-01 alert semantics inherited).
12. [ ] Security requirements verified (see Security Considerations): no network/storage side
        effects; promises settle for every termination path (activation, supersede, unmount).
13. [ ] Same-tick calls: two `confirm()` calls in one synchronous tick — the first promise
        resolves `false`, exactly one dialog (the second request) is visible, and no promise is
        left unsettled. A supersede installed in the same dispatch as an activation leaves the
        newer dialog visible and settles its promise exactly once.
14. [ ] StrictMode: a request created in a descendant mount effect survives the double-invoked
        probe — still pending after it, settling exactly once on activation, with no rejection
        (implementation test).
15. [ ] Package surface: the package root exposes `ConfirmProvider` and `useConfirm` at runtime
        plus `ConfirmOptionsWithActions` (with RD-01's types); the export-surface pin test carries
        the runtime list and the type pins.

---

## Non-Functional Notes

- **Complexity:** S — one provider component, one internal context, one hook; no new dependency
  and no infrastructure.
- **Performance:** child subtrees are not re-rendered by request lifecycle changes beyond what
  React reconciliation requires; the context value is memoized.
- **SSR:** safe by construction (children only until a client request exists).
