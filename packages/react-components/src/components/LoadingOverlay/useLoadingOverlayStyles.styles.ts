import { makeStyles, tokens } from '@fluentui/react-components';
import { useVisuallyHiddenClass } from '../Loading/useLoadingStyles.styles';

/**
 * Layout of the region-scoped overlay.
 *
 * The root is the positioning context and creates its own stacking context,
 * so the scrim stays above the content without leaking a global `z-index`.
 * The content wrapper uses `display: contents`, which lets the children keep
 * their place in the parent layout while the wrapper still carries the busy
 * and inert state. The scrim covers the region and centers the indicator.
 *
 * The root is programmatically focusable but deliberately shows no focus
 * ring: it is a landing point for focus that was inside the covered region,
 * not a control the user operates.
 */
const useStyles = makeStyles({
  root: {
    position: 'relative',
    isolation: 'isolate',
    minWidth: 0,
    ':focus': {
      outlineStyle: 'none',
    },
  },
  content: {
    display: 'contents',
  },
  scrim: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorBackgroundOverlay,
    borderRadius: 'inherit',
    zIndex: 1,
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
});

/**
 * Classes a loading overlay hands to its render function.
 */
export type LoadingOverlayClasses = {
  /** Positioning and stacking context of the root. */
  root: string;
  /** Layout-neutral wrapper that carries `aria-busy` and `inert`. */
  content: string;
  /** The covering layer with the themed background. */
  scrim: string;
  /** Layout class of the decorative indicator wrapper. */
  indicator: string;
  /** Shared screen-reader-only class for the persistent status text. */
  visuallyHidden: string;
};

/**
 * Resolves the overlay's style classes.
 *
 * The visually-hidden recipe is imported from the filler's styles module
 * rather than re-declared, so both primitives hide their status text the same
 * way.
 *
 * @returns the class names consumed by the overlay's render function
 */
export function useLoadingOverlayStyles(): LoadingOverlayClasses {
  const styles = useStyles();
  const visuallyHidden = useVisuallyHiddenClass();

  return {
    root: styles.root,
    content: styles.content,
    scrim: styles.scrim,
    indicator: styles.indicator,
    visuallyHidden,
  };
}
