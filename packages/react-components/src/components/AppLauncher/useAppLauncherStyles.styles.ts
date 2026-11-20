import { makeStyles, tokens } from '@fluentui/react-components';
import type { AppLauncherDocking } from './AppLauncher.types';

/**
 * Panel background shared by both docking variants.
 *
 * Fluent's own surface style wins on equal specificity, because its
 * stylesheet is inserted after this package's. The selector therefore
 * carries the `data-app-launcher-surface` attribute the render adds, and the
 * background stays pinned in one place: currently the Fluent default,
 * `colorNeutralBackground1` (white in the light theme).
 */
const panelBackground = {
  '&[data-app-launcher-surface]': {
    backgroundColor: tokens.colorNeutralBackground1,
  },
} as const;

const useStyles = makeStyles({
  surface: {
    // The top corners stay square so the panel meets the application bar
    // flush; the bottom corners keep the 8px Microsoft 365 rounding.
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: tokens.borderRadiusXLarge,
    borderBottomRightRadius: tokens.borderRadiusXLarge,
    ...panelBackground,
  },
  surfaceFullDock: {
    // Asking for the full window height is what makes the positioning
    // layer's height clamp — and with it the dock — always apply.
    height: '100dvh',
    // Full docking rounds the top corners and stays square at the bottom,
    // where the panel is flush with the window.
    borderTopLeftRadius: tokens.borderRadiusXLarge,
    borderTopRightRadius: tokens.borderRadiusXLarge,
    borderBottomLeftRadius: '0',
    borderBottomRightRadius: '0',
    ...panelBackground,
  },
});

/** Class names that style parts of the launcher. */
export type AppLauncherClasses = {
  /** Applied to the popover surface. */
  surface: string;
};

/**
 * Resolves the surface style classes.
 *
 * The default docking keeps the top corners square so the panel meets the
 * application bar flush, and rounds the bottom corners with
 * `borderRadiusXLarge` (8px). Full docking sizes the surface instead: it asks
 * for the full window height, rounds the top corners and stays square at the
 * bottom, where the panel meets the window. The positioning layer clamps the
 * surface to the space below the anchor, scrolling the content when it is
 * taller. Both variants carry the panel background from one place.
 *
 * @param docking - resolved docking behavior
 * @returns class names for the surface slot
 */
export function useAppLauncherStyles(docking: AppLauncherDocking): AppLauncherClasses {
  const styles = useStyles();

  return { surface: docking === 'full' ? styles.surfaceFullDock : styles.surface };
}
