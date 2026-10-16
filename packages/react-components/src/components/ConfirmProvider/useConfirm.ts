import { useContext } from 'react';
import { ConfirmContext } from './ConfirmContext';
import type { ConfirmContextValue } from './ConfirmContext';

/**
 * Returns the provider's imperative API: `confirm(options)` shows the
 * confirmation dialog and resolves when the user decides — always exactly
 * once, and never with a rejection.
 *
 * Call it from event handlers or effects, not during render and not on the
 * server: a request shows a dialog, so it needs a client-side interaction
 * context. The returned function is referentially stable for the lifetime of
 * the provider.
 *
 * @returns the stable `confirm` function
 * @throws An `Error` when called outside a `ConfirmProvider`, naming both the
 * hook and the provider so the missing wrapper is obvious.
 *
 * @example
 * ```tsx
 * const confirm = useConfirm();
 *
 * if (await confirm({ title: 'Delete this record?', intent: 'danger' })) {
 *     await deleteRecord();
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Custom action set — the outcome keeps its literal union type.
 * const outcome = await confirm({
 *     title: 'Save your changes?',
 *     actions: [
 *         { value: 'cancel', label: 'Cancel' },
 *         { value: 'discard', label: 'Discard', intent: 'danger' },
 *         { value: 'save', label: 'Save', appearance: 'primary' },
 *     ],
 * });
 * ```
 */
export function useConfirm(): ConfirmContextValue['confirm'] {
  const value = useContext(ConfirmContext);

  if (value === null) {
    throw new Error(
      'useConfirm must be used inside a ConfirmProvider: wrap the application subtree in the provider and call the hook from a descendant.'
    );
  }

  return value.confirm;
}
