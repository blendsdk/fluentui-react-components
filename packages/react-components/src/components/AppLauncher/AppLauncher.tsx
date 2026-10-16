import * as React from 'react';
import type { AppLauncherProps } from './AppLauncher.types';
import { renderAppLauncher } from './renderAppLauncher';
import { useAppLauncher } from './useAppLauncher';

/**
 * Application launcher: the waffle trigger that opens a popover surface.
 *
 * Compose it with the surface content in the same way a `Popover` is used;
 * the launcher adds the trigger and the docking default. Pass `trigger` to
 * replace the built-in waffle button with your own element; the forwarded ref
 * points at the built-in trigger button.
 *
 * @example
 * ```tsx
 * <AppLauncher label="App launcher">…panel content…</AppLauncher>
 * ```
 */
export const AppLauncher = React.forwardRef<HTMLButtonElement, AppLauncherProps>((props, ref) => {
  const state = useAppLauncher(props, ref);

  return renderAppLauncher(state);
});

AppLauncher.displayName = 'AppLauncher';
