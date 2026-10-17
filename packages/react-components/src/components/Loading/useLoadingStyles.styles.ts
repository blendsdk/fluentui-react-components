import { makeStyles } from '@fluentui/react-components';

/**
 * Layout of the standalone filler.
 *
 * The root is a full-size flex container that centers the indicator. It has
 * no background, no border, no stacking context and no animation: the filler
 * sits inside its parent's layout and the Fluent spinner owns all motion.
 */
const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
});

/**
 * The screen-reader-only recipe shared by both loading primitives.
 *
 * No design token describes a clipped one-pixel box, so the structural
 * literals are intentional. Keeping the recipe in one place means the filler
 * and the overlay cannot drift into two slightly different hidden styles.
 */
const useVisuallyHiddenStyles = makeStyles({
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 'none',
  },
});

/**
 * Classes a loading filler hands to its render function.
 */
export type LoadingClasses = {
  /** Layout class of the status root. */
  root: string;
  /** Clipped class for the announced copy of the label. */
  visuallyHidden: string;
  /** Layout class of the decorative indicator wrapper. */
  indicator: string;
};

/**
 * Resolves the shared visually-hidden class.
 *
 * The overlay imports this hook instead of re-declaring the recipe, so both
 * primitives hide their status text exactly the same way.
 *
 * @returns the Griffel class name of the screen-reader-only box
 */
export function useVisuallyHiddenClass(): string {
  return useVisuallyHiddenStyles().visuallyHidden;
}

/**
 * Resolves the filler's style classes.
 *
 * @returns the class names consumed by the filler's render function
 */
export function useLoadingStyles(): LoadingClasses {
  const styles = useStyles();
  const visuallyHidden = useVisuallyHiddenClass();

  return {
    root: styles.root,
    visuallyHidden,
    indicator: styles.indicator,
  };
}
