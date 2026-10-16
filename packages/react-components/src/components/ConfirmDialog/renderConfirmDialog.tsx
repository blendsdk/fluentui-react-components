import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogSurface,
  DialogTitle,
  mergeClasses,
} from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { ConfirmDialogState } from './useConfirmDialog';

/**
 * Renders the confirmation dialog.
 *
 * The dialog is a controlled Fluent alert dialog: it has no dismissal path of
 * its own, so Escape and backdrop clicks cannot close it — only the rendered
 * actions report an outcome. The title is the accessible name; the message,
 * when present, is tied to the surface as its description (a caller-provided
 * `aria-describedby` wins). Action icons render inside their buttons wrapped
 * in an `aria-hidden` element, so a decorative glyph never joins the
 * accessible name. Native props spread onto the surface element with the
 * caller's class name merged after the component's own classes.
 *
 * @param state - resolved dialog state
 * @returns the rendered dialog
 */
export function renderConfirmDialog(state: ConfirmDialogState): ReactElement {
  return (
    <Dialog open={state.open} modalType="alert">
      <DialogSurface
        {...state.surfaceProps}
        aria-describedby={state.describedBy}
        className={mergeClasses(state.classes.surface, state.surfaceProps.className)}
        ref={state.surfaceRef}
      >
        <DialogTitle>{state.title}</DialogTitle>
        <DialogContent>
          {state.message != null && (
            <div id={state.messageId} className={state.classes.message}>
              {state.message}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          {state.actions.map(action => (
            <Button
              key={action.key}
              appearance={action.appearance}
              disabled={state.busy}
              className={action.danger ? state.classes.dangerAction : undefined}
              icon={
                action.icon === undefined ? undefined : (
                  <span aria-hidden="true">{action.icon}</span>
                )
              }
              onClick={() => {
                state.onAction(action.outcome);
              }}
            >
              {action.label}
            </Button>
          ))}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
}
