import { makeStyles, tokens } from '@fluentui/react-components';

/**
 * Styles of the application title.
 *
 * The 1.4286 line-height is the unitless equivalent of the 20px
 * `lineHeightBase300` at 14px. Keeping it unitless lets the line box scale at
 * 200% text-only zoom; the normal 14px/20px look is unchanged. The title is a
 * flex item, so `min-width: 0` lets it shrink and ellipsize instead of pushing
 * the bar commands out of view.
 */
const useStyles = makeStyles({
  root: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: 1.4286,
    fontWeight: tokens.fontWeightSemibold,
    color: 'inherit',
    marginBlock: 0,
    marginInlineStart: tokens.spacingHorizontalS,
    marginInlineEnd: tokens.spacingHorizontalS,
    display: 'block',
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '@media (forced-colors: active)': {
      color: 'CanvasText',
    },
  },
  link: {
    textDecorationLine: 'none',
    ':hover': {
      textDecorationLine: 'underline',
    },
    ':focus-visible': {
      outline: `2px solid ${tokens.colorNeutralForegroundOnBrand}`,
      outlineOffset: '2px',
    },
    '@media (forced-colors: active)': {
      ':focus-visible': {
        outline: '2px solid ButtonText',
        outlineOffset: '2px',
      },
    },
  },
});

/**
 * Classes the application title hands to {@link renderAppBarTitle}.
 */
export type AppBarTitleClasses = {
  /** Root typography, margins and truncation. */
  root: string;

  /** Link-only decoration and focus treatment; absent in the other modes. */
  link?: string;
};

/**
 * Resolves the title style classes.
 *
 * @param link - whether the title renders as an anchor
 * @returns the class names consumed by the title's render function
 */
export function useAppBarTitleStyles(link: boolean): AppBarTitleClasses {
  const styles = useStyles();

  return {
    root: styles.root,
    link: link ? styles.link : undefined,
  };
}
