import { makeStyles } from '@fluentui/react-components';

/**
 * Styles of the application bar spacer.
 *
 * The spacer grows into the free space between the leading and trailing
 * groups. `align-self: stretch` keeps it at the bar's height even though the
 * bar aligns its children on the center line. It is invisible and has no
 * content, so it adds no accessible noise.
 */
const useStyles = makeStyles({
  root: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    minWidth: 0,
    alignSelf: 'stretch',
  },
});

/**
 * Classes the spacer hands to {@link renderAppBarSpacer}.
 */
export type AppBarSpacerClasses = {
  /** Root class. */
  root: string;
};

/**
 * Resolves the spacer style classes.
 *
 * @returns the class names consumed by the spacer's render function
 */
export function useAppBarSpacerStyles(): AppBarSpacerClasses {
  const styles = useStyles();

  return { root: styles.root };
}
