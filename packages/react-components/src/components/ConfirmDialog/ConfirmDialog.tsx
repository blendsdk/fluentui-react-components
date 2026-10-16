import * as React from 'react';
import type { ForwardedRef, ReactElement, RefAttributes } from 'react';
import type {
  ConfirmDialogActionsProps,
  ConfirmDialogPairProps,
  ConfirmDialogProps,
} from './ConfirmDialog.types';
import { renderConfirmDialog } from './renderConfirmDialog';
import { useConfirmDialog } from './useConfirmDialog';

/**
 * Confirmation dialog: the prompt a user action needs an explicit decision
 * before it runs.
 *
 * The component is controlled and presentation-only: visibility follows the
 * `open` prop, every closure is an explicit action reporting through
 * `onResolve`, and the dialog never dismisses itself, executes the decision
 * or performs side effects. It is a strict alert — Escape, backdrop clicks
 * and missing close affordances cannot end it; only a rendered action can.
 * The default pair (decline then confirm, safe action first) reports a
 * boolean; a custom action set reports the chosen value. `intent="danger"`
 * applies the danger token recipe to the affirmative action only.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *     open={pending}
 *     title="Delete this record?"
 *     message="This cannot be undone."
 *     intent="danger"
 *     onResolve={confirmed => {
 *         setPending(false);
 *         if (confirmed) deleteRecord();
 *     }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *     open={pending}
 *     title="Save your changes?"
 *     actions={[
 *         { value: 'cancel', label: 'Cancel' },
 *         { value: 'discard', label: 'Discard', intent: 'danger' },
 *         { value: 'save', label: 'Save', appearance: 'primary' },
 *     ]}
 *     onResolve={setPendingOutcome}
 * />
 * ```
 */
function ConfirmDialogInner<V extends string>(
  props: ConfirmDialogProps<V>,
  ref: ForwardedRef<HTMLDivElement>
): ReactElement {
  const state = useConfirmDialog(props, ref);

  return renderConfirmDialog(state);
}

const ForwardedConfirmDialog = React.forwardRef(ConfirmDialogInner);
ForwardedConfirmDialog.displayName = 'ConfirmDialog';

/**
 * The confirmation dialog with its variant-preserving callable type.
 *
 * The assertion is compile-time only: `forwardRef` cannot carry the single
 * generic type parameter, and typing the export as the plain props union
 * would strip contextual typing from inline `onResolve` callbacks. The two
 * overload signatures restore exactly what the type declarations promise —
 * the pair variant's boolean and the actions variant's literal value union —
 * and change nothing at runtime. It narrows no value and is revisited if a
 * cast-free generic `forwardRef` pattern becomes idiomatic.
 */
export const ConfirmDialog = ForwardedConfirmDialog as {
  (props: ConfirmDialogPairProps & RefAttributes<HTMLDivElement>): ReactElement;
  <V extends string>(
    props: ConfirmDialogActionsProps<V> & RefAttributes<HTMLDivElement>
  ): ReactElement;
};
