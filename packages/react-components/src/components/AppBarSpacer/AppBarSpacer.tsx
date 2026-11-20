import * as React from 'react';
import type { AppBarSpacerProps } from './AppBarSpacer.types';
import { renderAppBarSpacer } from './renderAppBarSpacer';
import { useAppBarSpacer } from './useAppBarSpacer';

/**
 * Application bar spacer: the empty flex element that pushes trailing
 * commands to the end of the bar.
 *
 * @example
 * ```tsx
 * <AppBarTitle>Contoso</AppBarTitle>
 * <AppBarSpacer />
 * <span>Trailing</span>
 * ```
 */
export const AppBarSpacer = React.forwardRef<HTMLDivElement, AppBarSpacerProps>((props, ref) => {
  const state = useAppBarSpacer(props, ref);

  return renderAppBarSpacer(state);
});

AppBarSpacer.displayName = 'AppBarSpacer';
