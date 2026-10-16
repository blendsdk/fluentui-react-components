import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { ConfirmDialog } from '../ConfirmDialog';
import type { ConfirmDialogStrings } from '../ConfirmDialog';
import { ConfirmContext } from './ConfirmContext';
import type { ConfirmContextValue } from './ConfirmContext';
import type {
  ConfirmOptions,
  ConfirmOptionsWithActions,
  ConfirmProviderProps,
} from './ConfirmProvider.types';

/**
 * One active request.
 *
 * The record is the authority (held in a ref) with a rendered state mirror;
 * `settled` guarantees the settle-once rule; `key` keys the dialog instance
 * so a replacement remounts it and Fluent's focus acquisition features the
 * new dialog again.
 */
type ConfirmRequest = {
  /** The pending request options (pair or actions shape). */
  options: ConfirmOptions | ConfirmOptionsWithActions<string>;
  /** Dialog key of this request; increments with every request. */
  key: number;
  /** Whether this request's promise has been settled. */
  settled: boolean;
  /**
   * Settles this request's promise: booleans for pair outcomes (including
   * the untyped-consumer fallback), the chosen value for action sets, and
   * `false` for a superseded or unmounted request. The parameter is
   * deliberately `unknown`: the per-request promise type is bound where
   * `confirm` creates the promise, and this internal slot only forwards the
   * outcome without an assertion.
   */
  resolve(outcome: unknown): void;
};

/**
 * Resolves the effective label overrides for one request.
 *
 * The first non-blank value wins per key: the per-call override, then the
 * provider default. Keys with no non-blank value are omitted, so the dialog
 * applies its own English defaults. A blank value never reaches the dialog —
 * it would otherwise mask a configured provider default.
 */
function resolveChainStrings(
  perCall: Partial<ConfirmDialogStrings> | undefined,
  provider: Partial<ConfirmDialogStrings> | undefined
): Partial<ConfirmDialogStrings> {
  const resolved: Partial<ConfirmDialogStrings> = {};
  const pick = (key: keyof ConfirmDialogStrings): string | undefined => {
    const perCallValue = perCall?.[key];
    if (perCallValue !== undefined && perCallValue.trim() !== '') {
      return perCallValue;
    }
    const providerValue = provider?.[key];
    if (providerValue !== undefined && providerValue.trim() !== '') {
      return providerValue;
    }
    return undefined;
  };

  const confirm = pick('confirm');
  if (confirm !== undefined) {
    resolved.confirm = confirm;
  }
  const decline = pick('decline');
  if (decline !== undefined) {
    resolved.decline = decline;
  }
  return resolved;
}

/**
 * Confirm provider: wraps an application subtree once, lets descendants ask
 * for decisions through `useConfirm()`, and renders one controlled
 * `ConfirmDialog` while a request is pending.
 *
 * The provider is a convenience layer over the dialog, not a policy layer:
 * it never inspects the decision, never executes the host's work, and
 * transmits nothing. Every request settles exactly once and never rejects:
 * a new request resolves the superseded one `false` (replacement — prompts
 * are one-at-a-time), and a genuine unmount resolves a pending request
 * `false`. The dialog closes on activation and the promise resolves
 * afterwards.
 *
 * @example
 * ```tsx
 * <ConfirmProvider>
 *     <App />
 * </ConfirmProvider>
 * ```
 *
 * @example
 * ```tsx
 * // Anywhere below the provider:
 * if (await confirm({ title: 'Delete this record?', intent: 'danger' })) {
 *     await api.delete(id);
 * }
 * ```
 */
export function ConfirmProvider({ children, strings }: ConfirmProviderProps): ReactElement {
  const requestRef = useRef<ConfirmRequest | undefined>(undefined);
  const lastKeyRef = useRef(0);
  const [request, setRequest] = useState<ConfirmRequest | undefined>(undefined);

  const confirm = useMemo<ConfirmContextValue['confirm']>(() => {
    function confirmFn(options: ConfirmOptions): Promise<boolean>;
    function confirmFn<V extends string>(options: ConfirmOptionsWithActions<V>): Promise<V>;
    function confirmFn(
      options: ConfirmOptions | ConfirmOptionsWithActions<string>
    ): Promise<boolean | string> {
      return new Promise<boolean | string>(resolve => {
        // The record is written synchronously, so any call in the same tick
        // sees and supersedes the current request; promises are never settled
        // inside state updaters.
        const previous = requestRef.current;
        if (previous !== undefined && !previous.settled) {
          previous.settled = true;
          previous.resolve(false);
        }
        lastKeyRef.current += 1;
        const next: ConfirmRequest = {
          options,
          key: lastKeyRef.current,
          settled: false,
          resolve,
        };
        requestRef.current = next;
        setRequest(next);
      });
    }
    return confirmFn;
  }, []);

  const handleResolve = useCallback((outcome: boolean | string) => {
    const active = requestRef.current;
    if (active === undefined || active.settled) {
      return; // a repeat activation before the re-render is a no-op
    }
    active.settled = true;
    if (requestRef.current === active) {
      requestRef.current = undefined;
    }
    // Close the dialog first and only if the rendered state still identifies
    // this request: a request installed in the same dispatch must survive.
    setRequest(current => (current === active ? undefined : current));
    active.resolve(outcome);
  }, []);

  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const pending = requestRef.current;
      if (pending !== undefined && !pending.settled) {
        // A development StrictMode probe remounts the provider synchronously
        // (cleanup, then setup again); deferring one microtask lets the probe
        // cancel the settlement. Only a genuine unmount resolves `false`.
        queueMicrotask(() => {
          if (mountedRef.current || pending.settled) {
            return;
          }
          pending.settled = true;
          pending.resolve(false);
        });
      }
    };
  }, []);

  const contextValue = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  const options = request?.options;
  const dialogKey = request?.key ?? lastKeyRef.current;
  const effectiveStrings = resolveChainStrings(options?.strings, strings);

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}
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
    </ConfirmContext.Provider>
  );
}
