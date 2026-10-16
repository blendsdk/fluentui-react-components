import { useContext } from 'react';
import { SystemErrorContext } from './SystemErrorContext';
import type { SystemErrorContextValue } from './SystemErrorContext';

/**
 * Returns the provider's imperative API: `catchError` reports an error and
 * opens the dialog, `clearError` closes and clears it.
 *
 * @returns the stable `catchError`/`clearError` pair
 * @throws An `Error` when called outside a `SystemErrorProvider`, naming both
 * the hook and the provider so the missing wrapper is obvious.
 *
 * @example
 * ```tsx
 * const { catchError, clearError } = useSystemError();
 *
 * try {
 *     await saveOrder(data);
 * } catch (error) {
 *     catchError(error);
 * }
 * ```
 */
export function useSystemError(): SystemErrorContextValue {
  const value = useContext(SystemErrorContext);

  if (value === null) {
    throw new Error(
      'useSystemError must be used inside a SystemErrorProvider: wrap the application subtree in the provider and call the hook from a descendant.'
    );
  }

  return value;
}
