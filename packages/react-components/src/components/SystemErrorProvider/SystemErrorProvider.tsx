import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { ErrorDialog } from '../ErrorDialog';
import type { ErrorDialogKind } from '../ErrorDialog';
import { SystemErrorContext } from './SystemErrorContext';
import type { SystemErrorContextValue } from './SystemErrorContext';
import type { CatchErrorOptions, SystemErrorProviderProps } from './SystemErrorProvider.types';
import { useGlobalErrorCapture } from './useGlobalErrorCapture';

/** One reported error: the value plus the rendering options it arrived with. */
type CaughtErrorState = {
  error: unknown;
  kind: ErrorDialogKind;
  detailsText?: string;
};

/**
 * System error provider: wraps an application subtree once, lets descendants
 * report errors through `useSystemError()`, and renders one controlled
 * `ErrorDialog` while a report is being shown.
 *
 * The provider is a convenience layer, not a policy layer: it never inspects
 * errors for authentication, never reloads or navigates, and transmits
 * nothing. Repeated reports replace the current one (last-wins). The
 * session-expired variant is constructed per report via `catchError`'s
 * `kind` option; its sign-out action clears the dialog first and then invokes
 * the provider's `onSignOut`, so the user can never be left inside a blocking
 * dialog. With `captureGlobalErrors`, uncaught window errors and unhandled
 * rejections are reported through the same dialog without suppressing the
 * underlying events.
 *
 * @example
 * ```tsx
 * <SystemErrorProvider captureGlobalErrors onSignOut={() => auth.signOut()}>
 *     <App />
 * </SystemErrorProvider>
 * ```
 */
export function SystemErrorProvider({
  children,
  onReload,
  onSignOut,
  strings,
  captureGlobalErrors = false,
}: SystemErrorProviderProps): ReactElement {
  const [caught, setCaught] = useState<CaughtErrorState | undefined>(undefined);

  const catchError = useCallback((error: unknown, options?: CatchErrorOptions) => {
    setCaught({
      error,
      kind: options?.kind ?? 'error',
      detailsText: options?.detailsText,
    });
  }, []);

  const clearError = useCallback(() => {
    setCaught(undefined);
  }, []);

  const contextValue = useMemo<SystemErrorContextValue>(
    () => ({ catchError, clearError }),
    [catchError, clearError]
  );

  useGlobalErrorCapture(captureGlobalErrors, catchError);

  const onSignOutRef = useRef(onSignOut);
  onSignOutRef.current = onSignOut;

  const handleSignOut = useCallback(() => {
    // Clear first so the user is never trapped in the blocking dialog; a host
    // handler that reports a re-entrant error still wins (last-wins), and a
    // throwing handler surfaces through the normal window error channel.
    clearError();
    onSignOutRef.current?.();
  }, [clearError]);

  const shared = {
    open: caught !== undefined,
    error: caught?.error,
    detailsText: caught?.detailsText,
    strings,
  };

  return (
    <SystemErrorContext.Provider value={contextValue}>
      {children}
      {caught?.kind === 'unauthorized' ? (
        <ErrorDialog {...shared} kind="unauthorized" onSignOut={handleSignOut} />
      ) : (
        <ErrorDialog {...shared} kind="error" onDismiss={clearError} onReload={onReload} />
      )}
    </SystemErrorContext.Provider>
  );
}
