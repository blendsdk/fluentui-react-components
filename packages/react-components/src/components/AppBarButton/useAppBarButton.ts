import type { ReactNode, Ref } from 'react';
import type { AppBarButtonBase, AppBarButtonProps } from './AppBarButton.types';
import type { AppBarButtonClasses } from './useAppBarButtonStyles.styles';
import { useAppBarButtonStyles } from './useAppBarButtonStyles.styles';

/**
 * State that {@link renderAppBarButton} renders.
 */
export type AppBarButtonState = {
  /** Visible command label, when the caller provided one. */
  children: ReactNode | undefined;
  /** Accessible name for an icon-only command. */
  ariaLabel: string | undefined;
  /** Resolved button type, defaulting to `button`. */
  type: 'button' | 'submit' | 'reset';
  /** Remaining native and Fluent button props forwarded to the button. */
  rootProps: Omit<AppBarButtonBase, 'children' | 'aria-label' | 'type'>;
  /** Ref to the button element, forwarded to the applications. */
  rootRef: Ref<HTMLButtonElement>;
  /** Resolved style classes. */
  classes: AppBarButtonClasses;
};

/**
 * Resolves the command props into render state.
 *
 * The command has no state and no effects. It separates the owned
 * `children`, `aria-label` and `type` from the remaining button props, and
 * defaults `type` to `button` so a command never submits a surrounding form.
 *
 * @param props - props from this instance of the command
 * @param ref - ref to the button element
 * @returns the state consumed by {@link renderAppBarButton}
 */
export function useAppBarButton(
  props: AppBarButtonProps,
  ref: Ref<HTMLButtonElement>
): AppBarButtonState {
  const { children, 'aria-label': ariaLabel, type = 'button', ...rootProps } = props;
  const classes = useAppBarButtonStyles();

  return {
    children,
    ariaLabel,
    type,
    rootProps,
    rootRef: ref,
    classes,
  };
}
