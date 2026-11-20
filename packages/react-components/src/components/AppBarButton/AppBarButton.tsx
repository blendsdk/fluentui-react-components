import * as React from 'react';
import type { AppBarButtonProps } from './AppBarButton.types';
import { renderAppBarButton } from './renderAppBarButton';
import { useAppBarButton } from './useAppBarButton';

/**
 * Application bar command: the on-brand action button for the 48px bar.
 *
 * The command forces Fluent's transparent, square, medium treatment and supplies
 * the Microsoft 365 interaction states: white foreground, a 12% white hover, a
 * 22% white pressed/open state, a white 2px inset focus ring and a muted
 * disabled state. It works as the existing `AppLauncher` trigger because it
 * forwards the props and ref that `PopoverTrigger` injects.
 *
 * An icon-only command must have a non-empty `aria-label`; a labelled command
 * uses its visible text as the accessible name. Text commands on the 12%/22%
 * overlays carry the documented contrast exception; icon-only commands meet
 * the 3:1 non-text threshold.
 *
 * @example
 * ```tsx
 * <AppBarButton aria-label="Settings" icon={<Settings20Regular />} />
 * <AppBarButton>Settings</AppBarButton>
 * ```
 */
export const AppBarButton = React.forwardRef<HTMLButtonElement, AppBarButtonProps>((props, ref) => {
  const state = useAppBarButton(props, ref);

  return renderAppBarButton(state);
});

AppBarButton.displayName = 'AppBarButton';
