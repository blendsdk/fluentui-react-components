import { makeStyles, tokens } from '@fluentui/react-components';

/**
 * Styles of the confirmation dialog.
 *
 * The surface is capped at a focused prompt width so the question and its
 * actions read as one compact decision unit. The message renders with
 * `pre-line` so newlines in plain-string content stay visible. The danger
 * recipe applies to a single flagged action: every rule is guarded by
 * `:enabled:not([aria-disabled="true"])` and written in compound form so it
 * outweighs Fluent's own Button state styles (base, hover, pointer-pressed and
 * keyboard-pressed) while disabled buttons keep Fluent's disabled styling.
 * All colors come from status-danger tokens, so light, dark and custom themes
 * apply, and the override leaves the user agent's forced-colors handling
 * intact.
 */
const useStyles = makeStyles({
  surface: {
    maxWidth: '480px',
  },
  message: {
    whiteSpace: 'pre-line',
  },
  dangerAction: {
    ':enabled:not([aria-disabled="true"])': {
      backgroundColor: tokens.colorStatusDangerBackground3,
      color: tokens.colorStatusDangerForegroundInverted,
    },
    ':enabled:not([aria-disabled="true"]):hover': {
      backgroundColor: tokens.colorStatusDangerBackground3Hover,
      color: tokens.colorStatusDangerForegroundInverted,
    },
    ':enabled:not([aria-disabled="true"]):hover:active': {
      backgroundColor: tokens.colorStatusDangerBackground3Pressed,
      color: tokens.colorStatusDangerForegroundInverted,
    },
    ':enabled:not([aria-disabled="true"]):active:focus-visible': {
      backgroundColor: tokens.colorStatusDangerBackground3Pressed,
      color: tokens.colorStatusDangerForegroundInverted,
    },
  },
});

/**
 * Classes the dialog hands to its render function.
 */
export type ConfirmDialogClasses = {
  /** The dialog surface element. */
  surface: string;
  /** The container of the optional message. */
  message: string;
  /** The danger recipe of one flagged action button. */
  dangerAction: string;
};

/**
 * Resolves the dialog's static style classes.
 *
 * The classes depend on no props, so this is a plain lookup — it exists as a
 * hook to follow the repository's component pattern, where the state hook
 * owns both the state and the classes.
 */
export function useConfirmDialogStyles(): ConfirmDialogClasses {
  const styles = useStyles();

  return {
    surface: styles.surface,
    message: styles.message,
    dangerAction: styles.dangerAction,
  };
}
