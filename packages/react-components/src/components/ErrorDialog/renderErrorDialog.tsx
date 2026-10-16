import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Label,
  Textarea,
  mergeClasses,
} from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { ErrorDialogState } from './useErrorDialog';

/**
 * Renders the error dialog.
 *
 * The dialog is a controlled Fluent alert dialog: it has no dismissal path of
 * its own, so Escape and backdrop clicks cannot close it — only the rendered
 * actions raise the host's callbacks. The details show as text inside a
 * read-only textarea (never as HTML), tied to its visible label, and the copy
 * control appears only when the clipboard was detected. Native props spread
 * onto the surface element with the caller's class name merged after the
 * component's own classes, so an application can adjust the surface without
 * losing the component styling.
 *
 * @param state - resolved dialog state
 * @returns the rendered dialog
 */
export function renderErrorDialog(state: ErrorDialogState): ReactElement {
  return (
    <Dialog open={state.open} modalType="alert">
      <DialogSurface
        {...state.surfaceProps}
        className={mergeClasses(state.classes.surface, state.surfaceProps.className)}
        ref={state.surfaceRef}
      >
        <DialogTitle className={state.classes.title}>{state.strings.title}</DialogTitle>
        <DialogContent>
          <p className={state.classes.subText}>{state.strings.subText}</p>
          <div className={state.classes.detailsRow}>
            <Label htmlFor={state.detailsId} className={state.classes.detailsLabel}>
              {state.strings.detailsLabel}
            </Label>
            {state.copyAvailable && (
              <Button
                appearance="subtle"
                className={state.classes.copyButton}
                onClick={state.onCopy}
              >
                {state.copied ? state.strings.copied : state.strings.copy}
              </Button>
            )}
          </div>
          <Textarea
            id={state.detailsId}
            className={state.classes.details}
            readOnly
            rows={8}
            value={state.details}
          />
        </DialogContent>
        <DialogActions className={state.classes.actions}>
          {state.kind === 'error' ? (
            <>
              {state.onReload !== undefined && (
                <Button appearance="secondary" onClick={() => state.onReload?.()}>
                  {state.strings.reload}
                </Button>
              )}
              <Button appearance="primary" onClick={() => state.onDismiss?.()}>
                {state.strings.close}
              </Button>
            </>
          ) : (
            <Button appearance="primary" onClick={() => state.onSignOut?.()}>
              {state.strings.signOut}
            </Button>
          )}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
}
