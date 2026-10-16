import type { ReactNode } from 'react';
import type { ConfirmAction, ConfirmDialogStrings, ConfirmIntent } from '../ConfirmDialog';

/**
 * Request options for the default pair; the promise resolves a boolean.
 */
export interface ConfirmOptions {
  /** The question, rendered as the dialog title. */
  title: ReactNode;
  /**
   * Optional explanation under the title. A plain string preserves newlines
   * as visible line breaks; content is never parsed as HTML.
   */
  message?: ReactNode;
  /**
   * Emphasis of the affirmative action. `'danger'` applies the danger token
   * recipe to the affirmative action only; the dialog surface stays neutral.
   */
  intent?: ConfirmIntent;
  /**
   * Label overrides for this request; non-blank values win over the
   * provider's defaults, key by key.
   */
  strings?: Partial<ConfirmDialogStrings>;
  actions?: undefined;
}

/**
 * Request options for a custom action set; the promise resolves the chosen
 * action's `value` with its literal type preserved at the call site.
 */
export interface ConfirmOptionsWithActions<V extends string> extends Omit<
  ConfirmOptions,
  'intent' | 'actions'
> {
  /** A non-empty action set replacing the default pair; order is DOM order. */
  actions: readonly [ConfirmAction<V>, ...ConfirmAction<V>[]];
}

/**
 * Props of the confirm provider.
 *
 * The provider wraps the application subtree once, exposes `useConfirm()` to
 * its descendants, and renders one confirmation dialog while a request is
 * pending. It adds no DOM of its own while idle and holds only transient
 * state: the active request and nothing else.
 *
 * One provider per React root is the supported setup — mount it once near
 * the application root, above the router; a second provider at the same root
 * could show a second dialog at the same time.
 *
 * @example
 * ```tsx
 * <ConfirmProvider strings={{ confirm: 'Yes', decline: 'No' }}>
 *     <App />
 * </ConfirmProvider>
 * ```
 */
export interface ConfirmProviderProps {
  /** The application subtree; the provider adds no DOM of its own. */
  children: ReactNode;
  /** Text defaults applied to every dialog this provider shows. */
  strings?: Partial<ConfirmDialogStrings>;
}
