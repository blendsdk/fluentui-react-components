import * as React from 'react';
import type { ErrorDialogProps } from './ErrorDialog.types';
import { renderErrorDialog } from './renderErrorDialog';
import { useErrorDialog } from './useErrorDialog';

/**
 * Error dialog: a blocking alert that shows an error's details for support
 * and offers the recovery actions of the selected variant.
 *
 * The component is controlled and side-effect-free: the `open` prop decides
 * visibility, dismissing is a callback request to the host, and the dialog
 * never reloads, navigates, or signs out on its own. The details area shows
 * the serialized error value (or a verbatim override), with a copy control
 * when the clipboard is available. Escape and backdrop clicks cannot close an
 * alert dialog — only the rendered actions can.
 *
 * The default variant offers Close and, when `onReload` is provided,
 * Reload page; the `'unauthorized'` variant for session-expired errors offers
 * Sign out as its only recovery action.
 *
 * @example
 * ```tsx
 * <ErrorDialog
 *     open={error !== undefined}
 *     error={error}
 *     onDismiss={() => setError(undefined)}
 *     onReload={() => window.location.reload()}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <ErrorDialog open kind="unauthorized" onSignOut={() => auth.signOut()} />
 * ```
 */
export const ErrorDialog = React.forwardRef<HTMLDivElement, ErrorDialogProps>((props, ref) => {
  const state = useErrorDialog(props, ref);

  return renderErrorDialog(state);
});

ErrorDialog.displayName = 'ErrorDialog';
