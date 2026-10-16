import type { ReactNode } from 'react';
import type { ErrorDialogKind, ErrorDialogStrings } from '../ErrorDialog';

/**
 * Options for a single {@link SystemErrorProviderProps}-driven report.
 */
export interface CatchErrorOptions {
  /**
   * Which dialog variant the report shows. `'error'` (the default) offers
   * Close and, when the provider received `onReload`, Reload page;
   * `'unauthorized'` offers Sign out only. The variant is always an explicit
   * call-site decision — the provider never infers it from the error value.
   */
  kind?: ErrorDialogKind;
  /**
   * Verbatim override for the details area of this report only; a later
   * report without the option shows the serialized error again.
   */
  detailsText?: string;
}

/**
 * Props of the system error provider.
 *
 * The provider wraps the application subtree once, exposes
 * `useSystemError()` to its descendants, and renders one controlled error
 * dialog while an error is being shown. It adds no DOM of its own and holds
 * only transient state: the current error and nothing else.
 *
 * @example
 * ```tsx
 * <SystemErrorProvider
 *     captureGlobalErrors
 *     onReload={() => window.location.reload()}
 *     onSignOut={() => auth.signOut()}
 * >
 *     <App />
 * </SystemErrorProvider>
 * ```
 */
export interface SystemErrorProviderProps {
  /** The application subtree to observe and wrap. */
  children: ReactNode;
  /**
   * Forwarded to the dialog's error variant; when provided, the dialog adds
   * the secondary Reload page action. The provider never reloads by itself.
   */
  onReload?: () => void;
  /**
   * Invoked when the user activates Sign out on the session-expired variant.
   * The dialog closes first and this handler runs afterwards, so a missing or
   * throwing handler can never leave the user inside the blocking dialog.
   */
  onSignOut?: () => void;
  /** Text overrides applied to every dialog the provider shows. */
  strings?: Partial<ErrorDialogStrings>;
  /**
   * Registers opt-in window listeners for `error` and `unhandledrejection`
   * and reports their payloads through the same dialog. Defaults to `false`;
   * the handlers never suppress the events. One capture-enabled provider per
   * application is the supported setup.
   */
  captureGlobalErrors?: boolean;
}
