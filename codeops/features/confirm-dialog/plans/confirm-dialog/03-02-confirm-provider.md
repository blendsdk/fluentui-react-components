# ConfirmProvider: confirm-dialog

> **Document**: 03-02-confirm-provider.md
> **Parent**: [Index](00-index.md)

## Overview

The promise-based convenience layer specified by RD-02: `ConfirmProvider` wraps an application
subtree once, `useConfirm()` returns a stable imperative API, and every `confirm(options)` call
settles exactly once — replacement resolves the superseded request `false`, unmount resolves any
pending request `false`, and the promise never rejects. This document owns the implementable
mechanics; behavior and acceptance criteria are owned by
[RD-02](../../requirements/RD-02-confirm-provider.md).

## Architecture

### Current Architecture

`SystemErrorProvider` is the pattern precedent (`02-current-state.md`): an internal context with a
hook that throws outside the provider, transient request state, children rendered unchanged, and
the dialog always rendered with an `open` toggle. The confirm provider adds the promise lifecycle
on top of that shape.

### Proposed Changes

New folder `src/components/ConfirmProvider/` per the RD-02 file table:

| File                                             | Contents                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| `ConfirmProvider.types.ts`                       | `ConfirmOptions`, `ConfirmOptionsWithActions<V>`, provider props |
| `ConfirmContext.ts`                              | Internal context (`createContext<ConfirmContextValue \| null>`)  |
| `ConfirmProvider.tsx`                            | Request state, settlement mechanics, dialog rendering            |
| `useConfirm.ts`                                  | The public hook; throws outside the provider                     |
| `ConfirmProvider.stories.tsx`                    | Interactive-trigger story set                                    |
| `index.ts`                                       | Folder barrel: provider, hook, public types                      |
| `src/index.ts` (modified)                        | Package exports (AR #4)                                          |
| `packages/react-components/README.md` (modified) | Provider section + Principles carve-out (AR #12)                 |

## Implementation Details

### Public API

The type declarations are exactly the RD-02 §Public API block. Exported from the package root
(AR #4): `ConfirmProvider`, `useConfirm`, `ConfirmProviderProps`, `ConfirmOptions`,
`ConfirmOptionsWithActions`; `ConfirmContext` and `ConfirmContextValue` stay internal (house
rule). The exported names are:

```ts
export interface ConfirmOptions {
  title: ReactNode;
  message?: ReactNode;
  intent?: ConfirmIntent;
  strings?: Partial<ConfirmDialogStrings>;
  actions?: undefined;
}

export interface ConfirmOptionsWithActions<V extends string> extends Omit<
  ConfirmOptions,
  'intent' | 'actions'
> {
  actions: readonly [ConfirmAction<V>, ...ConfirmAction<V>[]];
}

export interface ConfirmProviderProps {
  children: ReactNode;
  strings?: Partial<ConfirmDialogStrings>;
}

export function useConfirm(): ConfirmContextValue['confirm'];
```

### Interfaces

Internal interfaces the provider owns (never exported from the package):

```ts
/** The imperative API the provider exposes to its subtree. */
export type ConfirmContextValue = {
  confirm(options: ConfirmOptions): Promise<boolean>;
  confirm<V extends string>(options: ConfirmOptionsWithActions<V>): Promise<V>;
};

/**
 * One active request. The record is the authority (a ref) with a rendered state
 * mirror; `settled` guarantees settle-once; `key` keys the dialog instance so a
 * replacement remounts it and v9 focuses the new dialog again.
 */
type ConfirmRequest = {
  options: ConfirmOptions | ConfirmOptionsWithActions<string>;
  key: number;
  settled: boolean;
  /**
   * Settles this request's promise: booleans for pair outcomes (including the
   * runtime-empty-actions fallback), the chosen value for action sets, `false`
   * for replacement and unmount. The parameter is deliberately `unknown`: the
   * per-request promise type is bound at creation inside `confirm`, and this
   * internal slot only forwards the outcome — no assertion needed (plan AR #6).
   */
  resolve(outcome: unknown): void;
};
```

The `confirm` implementation uses TS function overloads inside a `useMemo` factory so the public
overloads stay exact while the implementation works with the wide union — no cast at any
boundary (compile-verified in planning):

```ts
const confirm = useMemo<ConfirmContextValue['confirm']>(() => {
  function confirmFn(options: ConfirmOptions): Promise<boolean>;
  function confirmFn<V extends string>(options: ConfirmOptionsWithActions<V>): Promise<V>;
  function confirmFn(
    options: ConfirmOptions | ConfirmOptionsWithActions<string>
  ): Promise<boolean | string> {
    return new Promise<boolean | string>(resolve => {
      /* request creation — see §Replacement */
    });
  }
  return confirmFn;
}, []);
```

The `useMemo([])` factory captures only stable refs; a dev-mode double render recreates the
function harmlessly. The returned identity is stable for the provider's lifetime (RD-02 AC 8).

### Provider mechanics

Pinned by plan AR #8; evidence in `02-current-state.md` and the requirements AR #16/#17 notes.

- **Request creation (synchronous record write)** — inside the promise executor: read
  `requestRef.current`; if a previous request exists and is unsettled, mark it settled and
  `previous.resolve(false)` (replacement, below); increment `lastKeyRef`, build the record, write
  `requestRef.current = next`, then `setRequest(next)`. The ref is the authority, so any
  `confirm()` call in the same tick sees and supersedes the current record; promises are never
  settled inside state updaters.
- **Replacement (RD-02 AC 4/13)** — the superseded promise resolves `false` in the same tick and
  never rejects; the new record installs immediately; the dialog is keyed per request, so the
  new instance remounts and v9's focus acquisition features the new dialog.
- **Activation (settle-once + conditional clear)** —

  ```ts
  const handleResolve = useCallback((outcome: boolean | string) => {
    const active = requestRef.current;
    if (active === undefined || active.settled) return; // a repeat activation is a no-op
    active.settled = true;
    if (requestRef.current === active) {
      requestRef.current = undefined;
    }
    // Close (unmount the record) before resolving, and only if the rendered
    // state still identifies this request — a request installed in the same
    // dispatch must not be clobbered (functional-update conditional clear).
    setRequest(current => (current === active ? undefined : current));
    active.resolve(outcome);
  }, []);
  ```

  A double activation (double click before re-render) settles once — the second call sees
  `settled` (RD-02 AC 10). The conditional clear covers "a supersede installed in the same
  dispatch as an activation" (RD-02 AC 13).

- **Unmount and the StrictMode probe (RD-02 AC 5/14)** — a mounted ref plus a deferred
  settlement:

  ```ts
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const pending = requestRef.current;
      if (pending !== undefined && !pending.settled) {
        queueMicrotask(() => {
          // The StrictMode probe's synchronous re-setup flips this back before
          // the microtask runs; only a real unmount settles the request.
          if (mountedRef.current || pending.settled) return;
          pending.settled = true;
          pending.resolve(false);
        });
      }
    };
  }, []);
  ```

- **Strings chain (RD-02 AC 7; plan AR #10)** — per key, the first non-blank value wins:
  per-call `options.strings` then the provider's `strings` prop; keys with no non-blank value are
  omitted, so the `ConfirmDialog` falls back to its English defaults. The provider never lets
  RD-01 see an empty per-call value while a non-blank provider value exists.
- **Dialog rendering (plan AR #9)** — the provider always renders one `ConfirmDialog`:

  ```tsx
  const options = request?.options;
  const dialogKey = request?.key ?? lastKeyRef.current; // idle keeps the closing key
  ...
  {options !== undefined && options.actions !== undefined ? (
    <ConfirmDialog
      key={dialogKey}
      open
      title={options.title}
      message={options.message}
      actions={options.actions}
      strings={effectiveStrings}
      onResolve={handleResolve}
    />
  ) : (
    <ConfirmDialog
      key={dialogKey}
      open={options !== undefined}
      title={options?.title ?? null}
      message={options?.message}
      intent={options?.intent}
      strings={effectiveStrings}
      onResolve={handleResolve}
    />
  )}
  ```

  The idle branch keeps the last request's key so the clearing render flips `open` on the **same
  instance** — the RD-01 close transition (and its focus restore) always runs. A new request
  increments the key and remounts the dialog for fresh focus acquisition. The provider never
  sets `busy` (the RD-02 deferral; requirements AR #22).

- **No side effects** — no listeners, no timers, no network, no storage; `children` render
  unchanged and are never re-created by request lifecycle changes (the same element reference
  flows through).

### SSR and environment safety

The provider performs no DOM or `window` access at render time; a request can only be created
after client-side interaction. The idle dialog renders with `open={false}`, which produces no DOM
(the `ErrorDialog`/`SystemErrorProvider` precedent — `unmountOnClose`). The RD-01 layout effect
does not run on the server. The SSR smoke (`test/confirm-provider.ssr.test.tsx`, node
environment) renders a provider-wrapped tree and asserts the child markup with no dialog markup
and no errors (RD-02 AC 9).

## Code Examples

```tsx
// Application root: mount once, use anywhere below.
<ConfirmProvider strings={{ confirm: 'Yes', decline: 'No' }}>
  <App />
</ConfirmProvider>
```

```tsx
// Any descendant, any page.
const confirm = useConfirm();

if (await confirm({ title: 'Delete this record?', intent: 'danger' })) {
  await api.delete(id);
}

const outcome = await confirm({
  title: 'Save your changes?',
  actions: [
    { value: 'cancel', label: 'Cancel' },
    { value: 'discard', label: 'Discard', intent: 'danger' },
    { value: 'save', label: 'Save', appearance: 'primary' },
  ],
}); // 'cancel' | 'discard' | 'save'
```

## Error Handling

| Error Case                                       | Handling Strategy                                                                  | AR Ref                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------ |
| `useConfirm()` outside the provider              | Throws the RD-02 error naming both the hook and the provider                       | RD-02 AC 6                     |
| New `confirm()` while a request is pending       | Previous promise resolves `false`; the new request installs; exactly one dialog    | RD-02 AC 4/13; plan AR #8      |
| Provider unmount with a pending request          | Deferred settlement resolves `false` exactly once; the probe's re-setup cancels it | RD-02 AC 5/14; plan AR #8      |
| Repeat activation before re-render               | Settle-once guard makes the repeat a no-op (no double resolution)                  | RD-02 AC 10                    |
| Runtime-empty `actions` from an untyped consumer | RD-01 falls back to the pair; the promise resolves a boolean                       | RD-02 AC 3; requirements AR #9 |
| Per-call `strings` value blank                   | The provider value (or RD-01's English default) applies                            | RD-02 AC 7; plan AR #10        |

> **Traceability:** Every mechanism above references the register entry that resolved it.
> Behavioral requirements and acceptance criteria are owned by RD-02.

## Testing Requirements

- **Spec tests** (`test/confirm-provider.spec.test.tsx`): jsdom-observable RD-02 acceptance
  criteria via the ST cases in `07-testing-strategy.md` (provider rows), including the strings
  chain, replacement, unmount settlement and the outside-provider throw.
- **Implementation tests** (`test/confirm-provider.impl.test.tsx`): `confirm` stability across
  re-renders, focus-after-swap with differing action counts, settle-once races, same-tick calls,
  the StrictMode probe (discriminator behavior), and children not re-rendering on request
  lifecycle changes.
- **SSR smoke** (`test/confirm-provider.ssr.test.tsx`, node environment): import + `renderToString`
  of a provider-wrapped tree.
- **Story set** (`ConfirmProvider.stories.tsx`): an interactive trigger exercising pair mode,
  danger, custom actions and replacement.
- **README section**: setup (mount-once guidance, provider-count caveat), props table, request
  table, usage contract (call from handlers/effects, not during render or on the server) and the
  Principles carve-out update (AR #12).
