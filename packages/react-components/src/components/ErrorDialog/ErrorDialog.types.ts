import type { ComponentPropsWithoutRef } from 'react';

/**
 * Selects which recovery variant the dialog renders.
 *
 * `'error'` is the default and offers Close plus — when the host provides a
 * reload callback — Reload page. `'unauthorized'` marks a session-expired
 * error whose only recovery action is signing out.
 */
export type ErrorDialogKind = 'error' | 'unauthorized';

/**
 * The visible texts of the dialog.
 *
 * Every text has an English default; callers localize by passing a partial
 * override object where unset keys keep their default. A key present with an
 * empty string is honored as written — it suppresses that text instead of
 * falling back to the default.
 */
export interface ErrorDialogStrings {
  /** Dialog title. Default: `"Application error"`. */
  title: string;
  /** Explanatory line under the title. Default: the "unknown error" notice. */
  subText: string;
  /** Label of the primary close action. Default: `"Close"`. */
  close: string;
  /** Label of the secondary reload action. Default: `"Reload page"`. */
  reload: string;
  /** Label of the session-expired action. Default: `"Sign out"`. */
  signOut: string;
  /** Label above the details area. Default: `"Error details"`. */
  detailsLabel: string;
  /** Label of the copy-details control. Default: `"Copy details"`. */
  copy: string;
  /** Feedback label shown briefly after a successful copy. Default: `"Copied"`. */
  copied: string;
  /** Details text shown when no error value was supplied. Default: `"No error details are available."`. */
  noDetails: string;
}

interface ErrorDialogBaseProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Whether the dialog is shown; the host owns this state. */
  open: boolean;
  /** The error value to display; serialized into the details area. */
  error?: unknown;
  /** Partial text overrides, merged key by key over the English defaults. */
  strings?: Partial<ErrorDialogStrings>;
  /** Replaces the serialized details verbatim (an empty string renders blank). */
  detailsText?: string;
}

interface ErrorDialogErrorProps extends ErrorDialogBaseProps {
  /** The standard error variant (the default). */
  kind?: 'error';
  /** The host's dismissal request; required for this variant. */
  onDismiss: () => void;
  /** Reload request; the secondary action renders only when provided. */
  onReload?: () => void;
}

interface ErrorDialogUnauthorizedProps extends ErrorDialogBaseProps {
  /** The session-expired variant. */
  kind: 'unauthorized';
  /** The host's sign-out request; required at compile time for this variant. */
  onSignOut: () => void;
}

/**
 * Props of the error dialog — a discriminated union over {@link ErrorDialogKind}.
 *
 * The union makes the session-expired variant a deliberate host choice and
 * its sign-out callback a compile-time requirement; a host that serves both
 * variants narrows the callback set by `kind` before constructing the props.
 *
 * All native `div` props (`className`, `style`, `data-*`, `aria-*`, event
 * handlers, ...) pass through to the dialog surface element — except
 * `children`, which the dialog owns — and a forwarded ref points at it.
 * Callbacks are invoked only when defined: an untyped consumer that omits
 * one gets a visible but inert action, never a crash.
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
export type ErrorDialogProps = ErrorDialogErrorProps | ErrorDialogUnauthorizedProps;
