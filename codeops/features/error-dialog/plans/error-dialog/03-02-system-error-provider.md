# SystemErrorProvider: error-dialog Implementation

> **Document**: 03-02-system-error-provider.md
> **Parent**: [Index](00-index.md)

## Overview

`SystemErrorProvider` is one context provider with an imperative hook, composed around the RD-01
`ErrorDialog`. Behavior, decisions and acceptance criteria are owned by
[RD-02](../../requirements/RD-02-system-error-provider.md); this document owns the implementable
signatures and the wiring. Design choices cite RD-02/RD-01; plan-local decisions cite this plan's
register (`AR #`). The provider is delivered as **Phase 2** of this plan (the AR #15 route).

## Architecture

### Current Architecture

No provider or context exists beyond the DescriptionList item layout context, and the RD-01
dialog itself is not implemented yet — Phase 2 follows Phase 1 and depends on it
(`02-current-state.md`).

### Proposed Changes

A new component folder `src/components/SystemErrorProvider/`:

| File                              | Role                                                               |
| --------------------------------- | ------------------------------------------------------------------ |
| `SystemErrorProvider.tsx`         | Provider: state, per-variant dialog construction, sign-out wrapper |
| `SystemErrorProvider.types.ts`    | Public prop and option types                                       |
| `SystemErrorContext.ts`           | Context object and value type (internal)                           |
| `useSystemError.ts`               | Public hook (throws outside the provider)                          |
| `useGlobalErrorCapture.ts`        | Internal opt-in capture hook (listener lifecycle)                  |
| `SystemErrorProvider.stories.tsx` | Story set                                                          |
| `index.ts`                        | Barrel                                                             |

## Implementation Details

### Interfaces

Public types are approved in RD-02 §Public API and exported as `SystemErrorProvider`,
`useSystemError`, `SystemErrorProviderProps`, `CatchErrorOptions`. The internal interfaces:

```ts
// SystemErrorContext.ts
export type SystemErrorContextValue = {
  catchError: (error: unknown, options?: CatchErrorOptions) => void;
  clearError: () => void;
};
export const SystemErrorContext: React.Context<SystemErrorContextValue | null>;

// SystemErrorProvider.tsx
type CaughtErrorState = { error: unknown; kind: ErrorDialogKind; detailsText?: string };

// useGlobalErrorCapture.ts
export function useGlobalErrorCapture(enabled: boolean, onError: (error: unknown) => void): void;
```

### Provider state and construction

- State: `caught: CaughtErrorState | undefined`; `catchError` replaces it (last-wins),
  `clearError` resets it. The context value is memoized and both callbacks are stable.
- The sign-out wrapper implements register AR #19 — clear first, then invoke:

```tsx
const handleSignOut = useCallback(() => {
  clearError(); // close first — never trap; a re-entrant catchError still wins
  onSignOutRef.current?.(); // a throwing handler propagates, the dialog stays closed
}, [clearError]);
```

- The dialog is constructed **per variant** (RD-02 §State and rendering flow — RD-01's
  discriminated union cannot accept a dynamic `kind` or cross-variant callbacks): shared props
  are assembled once, then spread into the matching branch:

```tsx
const shared = {
  open: caught !== undefined,
  error: caught?.error,
  detailsText: caught?.detailsText,
  strings,
};

caught?.kind === 'unauthorized' ? (
  <ErrorDialog {...shared} kind="unauthorized" onSignOut={handleSignOut} />
) : (
  <ErrorDialog {...shared} kind="error" onDismiss={clearError} onReload={onReload} />
);
```

### Capture hook

```ts
export function useGlobalErrorCapture(enabled, onError) {
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError; // handlers stay stable across renders

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return; // SSR-safe, effect-scoped
    const handleError = (event: ErrorEvent) => onErrorRef.current(event.error ?? event.message);
    const handleRejection = (event: PromiseRejectionEvent) => onErrorRef.current(event.reason);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [enabled]);
}
```

- Always reported as `kind: 'error'` (no unauthorized inference — AR #4); never `preventDefault()`
  (RD-02 §Capture contract); bubble-phase `error` only (no resource-event capture);
  StrictMode-safe (setup/cleanup/setup leaves one listener pair); no window access at import or
  render time.

### Pattern exceptions (recorded)

Per RD-02 §Constraints: no styles file and no native pass-through (the provider renders no DOM of
its own), no render-function split — state and render live in the provider file; the capture
logic is isolated in its own hook. The package README's "presentation only" principles wording
receives the carve-out (it holds transient application state).

## Error Handling

| Error Case                               | Handling Strategy                                                   | Ref                          |
| ---------------------------------------- | ------------------------------------------------------------------- | ---------------------------- |
| Provider has no `onSignOut`              | The click clears the dialog and calls nothing; never throws         | RD-02 AC 6 · register AR #19 |
| `onSignOut` throws                       | Dialog stays closed; the error propagates normally                  | RD-02 AC 6                   |
| Hook used outside the provider           | Throws an `Error` naming `useSystemError` and `SystemErrorProvider` | RD-02 AC 9                   |
| Hostile captured values                  | RD-01's wrapped serialization fallback chain                        | RD-02 AC 15                  |
| `error` event without an `error` payload | `event.message` fallback                                            | RD-02 AC 11                  |
| Rejection with `reason: undefined`       | Default no-details text (RD-01 rule)                                | RD-02 AC 12                  |

## Testing Requirements

- Specification tests: ST-33…ST-53 in [07-testing-strategy.md](07-testing-strategy.md) — written
  before implementation (immutable oracle).
- Implementation tests: capture-hook internals, listener attach/remove spies, memoization
  stability (`test/system-error-provider.impl.test.tsx`); node-environment SSR smoke
  (`test/system-error-provider.ssr.test.tsx`, ST-53).
- Story/manual: the provider story set demonstrates both variants via `catchError` plus the
  capture demo; review-verified (RD-02 AC 17).
