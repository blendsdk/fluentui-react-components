import { makeStyles, tokens } from '@fluentui/react-components';

/**
 * Styles of the error dialog.
 *
 * The surface is capped at 700 px so long stack traces stay readable without
 * the dialog spanning very wide screens. The title uses the danger color
 * token — the legacy warning signal users recognize — and every other value
 * comes from Fluent design tokens, so both light and dark themes apply.
 * The details row keeps the label and the copy control on one line, and the
 * actions row right-aligns its buttons.
 */
const useStyles = makeStyles({
  surface: {
    maxWidth: '700px',
  },
  title: {
    color: tokens.colorPaletteRedForeground1,
  },
  subText: {
    marginTop: tokens.spacingVerticalXS,
    marginBottom: 0,
  },
  detailsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalL,
  },
  detailsLabel: {
    fontWeight: tokens.fontWeightSemibold,
  },
  details: {
    width: '100%',
    marginTop: tokens.spacingVerticalXS,
  },
  copyButton: {
    flexShrink: 0,
  },
  actions: {
    justifyContent: 'flex-end',
    marginTop: tokens.spacingVerticalL,
  },
});

/**
 * Classes the dialog hands to its render function.
 */
export type ErrorDialogClasses = {
  /** The dialog surface element. */
  surface: string;
  /** The dialog title. */
  title: string;
  /** The explanatory line under the title. */
  subText: string;
  /** The row holding the details label and the copy control. */
  detailsRow: string;
  /** The label above the details control. */
  detailsLabel: string;
  /** The read-only details control. */
  details: string;
  /** The copy-details control. */
  copyButton: string;
  /** The action-button row. */
  actions: string;
};

/**
 * Resolves the dialog's static style classes.
 *
 * The classes depend on no props, so this is a plain lookup — it exists as a
 * hook to follow the repository's component pattern, where the state hook
 * owns both the state and the classes.
 */
export function useErrorDialogStyles(): ErrorDialogClasses {
  const styles = useStyles();

  return {
    surface: styles.surface,
    title: styles.title,
    subText: styles.subText,
    detailsRow: styles.detailsRow,
    detailsLabel: styles.detailsLabel,
    details: styles.details,
    copyButton: styles.copyButton,
    actions: styles.actions,
  };
}
