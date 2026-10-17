# useLoading: Loading Primitives

> **Document**: 03-03-use-loading.md
> **Parent**: [Index](00-index.md)

## Overview

`useLoading()` is the local controller for arbitrary async work. It removes the repetitive
`setBusy(true)` / `try` / `finally setBusy(false)` pattern, counts overlapping operations, carries a
label, returns the operation's value and rethrows its error. It is a normal hook: it lives in the
component that owns the region, re-renders that component when `isLoading` or `label` changes, and
connects to `LoadingOverlay` or `Loading` explicitly through props.

## Architecture

### Current Architecture

No async controller exists. Applications own a boolean or an object of booleans, set it around each
operation and remember `finally`. The legacy CastingAppMT webclient has 371 `fetching` references
(external evidence; the figure is not verifiable in this repository), which shows both the frequency
of the pattern and the cost of maintaining it by hand.

### Proposed Changes

Add two files to `packages/react-components/src/components/Loading/`:

| File                  | Responsibility                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `useLoading.types.ts` | `LoadingOptions` and `LoadingController` public types.                                       |
| `useLoading.ts`       | Public `useLoading()` hook: reducer state, ids, `run`, label resolution and stable callback. |

The hook is exported from `Loading/index.ts` and `src/index.ts`; the reducer and helpers stay private.

## Implementation Details

### New Types/Interfaces

```ts
export type LoadingOptions = {
  /** Default message when no active operation supplies one. */
  label?: string;
};

export type LoadingController = {
  /** True while at least one tracked operation is pending. */
  readonly isLoading: boolean;
  /** Most recently started active operation's non-blank label, else the non-blank default, else `undefined`. */
  readonly label: string | undefined;
  /**
   * Runs one operation and tracks it until it settles.
   * Returns the operation's value; rethrows its error unchanged.
   * The busy state is cleared in `finally`, including when the operation throws.
   */
  run<T>(operation: () => T | Promise<T>, options?: { label?: string }): Promise<T>;
};

export function useLoading(options?: LoadingOptions): LoadingController;
```

The run options are inline to keep the public type surface to four declarations. `run` is generic and
preserves the operation's return type.

### State Model

```ts
type ActiveOperation = {
  /** Monotonic id from a ref; unique for the lifetime of the hook instance. */
  id: number;
  /** Non-blank per-operation label, if one was supplied. */
  label?: string;
};

type State = {
  active: ActiveOperation[];
};

type Action = { type: 'begin'; id: number; label?: string } | { type: 'end'; id: number };

/** Returns undefined for a blank/whitespace label; otherwise the original string. */
export function normalizeLabel(label?: string): string | undefined; // internal, loadingLabel.ts
```

- `begin` appends an operation. The label is normalized before dispatch, so a blank string never
  enters the active list.
- `end` removes the operation **by id**, never by popping the last entry. Out-of-order completion
  therefore cannot corrupt the active list or the label.
- `isLoading` is `active.length > 0`.
- `label` is the last active operation with a non-blank label, then the non-blank `options.label`,
  then `undefined`:

  ```ts
  const label =
    [...active].reverse().find(operation => operation.label !== undefined)?.label ??
    normalizeLabel(options?.label);
  ```

- A blank hook default is treated exactly like an omitted default: `label` is `undefined`, and the
  consumer (`LoadingOverlay` or `Loading`) applies the English `Loading…` fallback.
- The hook uses `useReducer`; the caller re-renders on state changes. No store, no provider and no
  `useSyncExternalStore` in v1 (AR-8).

### `run` Algorithm

```
run(operation, options):
  id = nextId++
  dispatch(begin, id, normalizeLabel(options?.label))
  try:
    return await operation()
  finally:
    dispatch(end, id)
```

Properties:

- The active mark is dispatched **before** the operation is invoked.
- The cleanup is structural: a throw, a rejection, an early return or a non-promise return all reach
  the `finally`.
- The returned promise resolves to the operation's value; it rejects with the **same error object**.
- The error is never caught, logged or replaced.
- `run` is a stable `useCallback` with an empty dependency list; the ref counter and dispatch are
  stable.
- Callers must return or catch the returned promise. The JSDoc and README show
  `.catch(catchError)` from `useSystemError`; fire-and-forget calls can produce an unhandled
  rejection, which is the caller's responsibility (AR-8).
- `run` must be called from event handlers or effects, not during render.
- If the component unmounts while the operation is pending, the `end` dispatch is a no-op in React
  19; the returned promise still settles normally (AR-8, AR-12).

### Label Policy

| Situation                                           | Displayed label                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| No active operation and no default                  | `undefined`; the consumer (`LoadingOverlay`) applies `Loading…`      |
| No active operation and a blank default             | `undefined`; the blank default is treated as no default              |
| No active operation, non-blank default supplied     | the default                                                          |
| One active operation with a label                   | that label                                                           |
| One active operation without a label                | the non-blank default, else `undefined`                              |
| Overlapping operations A (label "A"), B (label "B") | "B" while both run; "A" after B ends; default after A ends           |
| Overlapping labeled A and unlabeled B               | "A" while either runs, because B contributes no label                |
| Per-run label is empty or whitespace                | treated as no label; the non-blank default applies, else `undefined` |

The rule is "the most recently started active **labeled** operation". An unlabeled operation never
suppresses a labeled one, even when it started later. This is the useful interpretation of R11's
wording; the RD sentence is recorded for the next revision (AR-7).

When `label` is `undefined`, `LoadingOverlay` (or `Loading`) applies the English `Loading…` default.
The distinction matters: the hook reports what the caller supplied, and the component owns the
visible fallback.

### Re-render and Stability

- `isLoading` and `label` are snapshots from the reducer; the object returned by the hook is rebuilt
  each render.
- `run` is referentially stable and can be passed to memoized children or used in dependency arrays.
- The hook causes the calling component to re-render on `isLoading`/`label` changes. This is the same
  update boundary the legacy application used for `fetching`; no store is introduced for v1 (AR-8).
- The hook does not subscribe to external state, timers, browser APIs or network events.

### Integration Points

- `LoadingOverlay` consumes `isLoading` and `label`:

  ```tsx
  const { isLoading, label, run } = useLoading({ label: t('please_wait') });

  <LoadingOverlay loading={isLoading} label={label}>
    <ActorForm />
  </LoadingOverlay>;
  ```

- `Loading` can consume the same pair for a standalone filler.
- The hook is not tied to the overlay; an application can use `isLoading` to disable a button, show a
  top bar or any other indicator.
- `LoadingOverlay` also accepts app-owned booleans, so the hook is optional and incremental.

## Code Examples

### Basic async operation

```tsx
function SaveButton() {
  const { isLoading, run } = useLoading();
  const { catchError } = useSystemError();

  return (
    <Button
      disabled={isLoading}
      onClick={() => run(() => api.save(), { label: 'Saving…' }).catch(catchError)}
    >
      Save
    </Button>
  );
}
```

### Overlapping operations

```tsx
const { isLoading, run } = useLoading({ label: 'Working…' });

const save = () => run(() => api.save(), { label: 'Saving…' });
const publish = () => run(() => api.publish(), { label: 'Publishing…' });
```

Both operations keep `isLoading` true; the overlay shows the most recently started label and falls
back when that operation settles.

### App-owned boolean alternative

```tsx
const [isPending, startTransition] = useTransition();

<LoadingOverlay loading={isPending} label="Saving…">
  <Form />
</LoadingOverlay>;

startTransition(async () => {
  await api.save();
});
```

## Error Handling

| Error Case                              | Handling Strategy                                                                                                             | AR Ref |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ |
| Operation rejects                       | `finally` clears the active entry; the same error object is rethrown to the caller.                                           | AR-8   |
| Operation throws synchronously          | The async `run` catches via `try/finally`, clears and rejects with the same error.                                            | AR-8   |
| Two overlapping operations, one rejects | Only that operation is removed; the other keeps `isLoading` true.                                                             | AR-8   |
| Caller ignores the returned promise     | Documentation and stories show `return`/`.catch(catchError)`; the hook does not swallow errors.                               | AR-8   |
| `run` called after unmount              | State dispatch is a no-op; the promise still settles.                                                                         | AR-8   |
| `run` called during render              | Unsupported; documented as an event-handler/effect API.                                                                       | AR-8   |
| Label is blank                          | Treated as no label; the non-blank default applies, otherwise `undefined`.                                                    | AR-7   |
| Component unmounts mid-operation        | Dispatch is a no-op in React 19; the promise still settles. No test asserts a React warning, because React 19.3.1 emits none. | AR-8   |

## Testing Requirements

- Specification tests (`test/use-loading.spec.test.tsx`): initial state, async resolve/reject,
  overlapping operations including a rejecting overlap, label policy (blank default, blank per-run
  label, labeled-then-unlabeled order), stable `run`, sync value/throw, unmount safety and the
  absence of `busy`/`done`/`begin`.
- Implementation tests (`test/use-loading.impl.test.tsx`): out-of-order label fallback, id-based
  removal, immediate `isLoading` after `run`, return type consistency and no stale active entries.
- Integration story (`LoadingOverlay.stories.tsx`): the canonical `useLoading` + `LoadingOverlay` save
  flow, including error handling via `useSystemError`.
- SSR smoke (`test/loading.ssr.test.tsx`): an idle `useLoading` host renders without browser access
  (ST-48).
- The hook is UI-state-only; there is no network, storage or security test surface.
