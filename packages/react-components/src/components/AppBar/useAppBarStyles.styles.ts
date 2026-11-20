import { makeStyles, tokens } from '@fluentui/react-components';

/**
 * Styles of the application bar.
 *
 * The 48px minimum height is the Microsoft 365 bar height; Fluent has no
 * bar-height token, so the literal is documented here. `min-height` rather
 * than a fixed `height` lets the bar grow at 200% text zoom instead of
 * clipping its content. No `overflow` is set, so focus rings and popovers are
 * not clipped.
 */
const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    boxSizing: 'border-box',
    width: '100%',
    minHeight: '48px',
    flexShrink: 0,
    padding: 0,
    gap: 0,
    position: 'relative',
    border: 'none',
    boxShadow: 'none',
    borderRadius: 0,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    // Forced colors removes the brand fill; the title and commands must keep
    // reading as system text. An absolutely positioned pseudo-element draws the
    // bar edge without adding a layout border that would make the bar 49px tall.
    '@media (forced-colors: active)': {
      backgroundColor: 'Canvas',
      color: 'CanvasText',
      '&::after': {
        content: '""',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderBottom: '1px solid CanvasText',
        pointerEvents: 'none',
        forcedColorAdjust: 'none',
      },
    },
  },
});

/**
 * Classes the application bar hands to {@link renderAppBar}.
 */
export type AppBarClasses = {
  /** Root class. */
  root: string;
};

/**
 * Resolves the bar style classes.
 *
 * @returns the class names consumed by the bar's render function
 */
export function useAppBarStyles(): AppBarClasses {
  const styles = useStyles();

  return { root: styles.root };
}
