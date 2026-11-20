import * as React from 'react';
import type { AppBarProps } from './AppBar.types';
import { renderAppBar } from './renderAppBar';
import { useAppBar } from './useAppBar';

/**
 * Application bar: the brand header that hosts the launcher, the product name
 * and global commands.
 *
 * The bar is presentation-only. The application decides what it contains and
 * owns the launcher state; the bar forwards its ref so the application can
 * pass it to `AppLauncher`'s `dockTarget`.
 *
 * @example
 * ```tsx
 * const barRef = useRef<HTMLElement>(null);
 *
 * <AppBar ref={barRef} aria-label="Application">
 *     <AppLauncher dockTarget={barRef}>…</AppLauncher>
 *     <AppBarTitle>Contoso</AppBarTitle>
 *     <AppBarSpacer />
 * </AppBar>
 * ```
 */
export const AppBar = React.forwardRef<HTMLElement, AppBarProps>((props, ref) => {
  const state = useAppBar(props, ref);

  return renderAppBar(state);
});

AppBar.displayName = 'AppBar';
