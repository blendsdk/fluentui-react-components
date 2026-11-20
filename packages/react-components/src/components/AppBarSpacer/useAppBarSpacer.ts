import type { Ref } from 'react';
import type { AppBarSpacerProps } from './AppBarSpacer.types';
import type { AppBarSpacerClasses } from './useAppBarSpacerStyles.styles';
import { useAppBarSpacerStyles } from './useAppBarSpacerStyles.styles';

/**
 * State that {@link renderAppBarSpacer} renders.
 */
export type AppBarSpacerState = {
  /** Remaining native div props forwarded to the spacer. */
  rootProps: AppBarSpacerProps;
  /** Ref to the spacer `<div>`, forwarded to the applications. */
  rootRef: Ref<HTMLDivElement>;
  /** Resolved style classes. */
  classes: AppBarSpacerClasses;
};

/**
 * Resolves the spacer props into render state.
 *
 * The spacer has no state and no derived props: it only resolves the class and
 * forwards the caller's props and ref.
 *
 * @param props - props from this instance of the spacer
 * @param ref - ref to the spacer `<div>`
 * @returns the state consumed by {@link renderAppBarSpacer}
 */
export function useAppBarSpacer(
  props: AppBarSpacerProps,
  ref: Ref<HTMLDivElement>
): AppBarSpacerState {
  const classes = useAppBarSpacerStyles();

  return {
    rootProps: props,
    rootRef: ref,
    classes,
  };
}
