import type { Ref } from 'react';
import type { AppBarProps } from './AppBar.types';
import type { AppBarClasses } from './useAppBarStyles.styles';
import { useAppBarStyles } from './useAppBarStyles.styles';

/**
 * State that {@link renderAppBar} renders.
 */
export type AppBarState = {
  /** The bar content, untouched. */
  children: AppBarProps['children'];
  /** Remaining native header props forwarded to the root element. */
  rootProps: Omit<AppBarProps, 'children'>;
  /** Ref to the `<header>` element, forwarded to the applications. */
  rootRef: Ref<HTMLElement>;
  /** Resolved style classes. */
  classes: AppBarClasses;
};

/**
 * Resolves the bar props into render state.
 *
 * The bar has no state and no effects: it separates its children from the
 * native header props and resolves the root style. The forwarded ref is the
 * same element an application passes to `AppLauncher`'s `dockTarget`.
 *
 * @param props - props from this instance of the bar
 * @param ref - ref to the `<header>` element
 * @returns the state consumed by {@link renderAppBar}
 */
export function useAppBar(props: AppBarProps, ref: Ref<HTMLElement>): AppBarState {
  const { children, ...rootProps } = props;
  const classes = useAppBarStyles();

  return {
    children,
    rootProps,
    rootRef: ref,
    classes,
  };
}
