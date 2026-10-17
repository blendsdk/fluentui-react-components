import type { SpinnerProps } from '@fluentui/react-components';
import type { LoadingProps } from './Loading.types';
import { resolveLoadingLabel } from './loadingLabel';
import { useDelayedVisibility } from './useDelayedVisibility';
import type { LoadingClasses } from './useLoadingStyles.styles';
import { useLoadingStyles } from './useLoadingStyles.styles';

/**
 * The resolved, render-ready view of a `Loading` instance.
 */
export type LoadingBaseState = {
  /** True once the delay has elapsed; controls the status text and indicator. */
  visible: boolean;
  /** The resolved, always non-empty label. */
  label: string;
  /** Fluent spinner size after defaulting. */
  size: NonNullable<SpinnerProps['size']>;
  /** Fluent spinner appearance after defaulting. */
  appearance: NonNullable<SpinnerProps['appearance']>;
  /** Fluent label placement after defaulting. */
  labelPosition: NonNullable<SpinnerProps['labelPosition']>;
  /** Griffel class names for the root, the hidden status text and the indicator wrapper. */
  classes: LoadingClasses;
  /** Native `div` props for the status root, excluding the component's own props. */
  rootProps: Omit<
    LoadingProps,
    'label' | 'size' | 'appearance' | 'labelPosition' | 'delay' | 'minHeight'
  >;
  /** Optional inline minimum block size; absent when the caller omitted it. */
  minHeight?: number | string;
};

/**
 * Resolves the filler's props into render state.
 *
 * Defaults are applied here so the styles, the render function and the tests
 * all read one resolved contract. The filler is always active while it is
 * mounted; the delayed-visibility hook decides when its status text and
 * indicator appear.
 *
 * @param props - props from this instance of the filler
 * @returns the state consumed by `renderLoading`
 */
export function useLoadingBase(props: LoadingProps): LoadingBaseState {
  const {
    label,
    size = 'large',
    appearance = 'primary',
    labelPosition = 'below',
    delay = 0,
    minHeight,
    ...rootProps
  } = props;

  const visible = useDelayedVisibility(true, delay);
  const classes = useLoadingStyles();

  return {
    visible,
    label: resolveLoadingLabel(label),
    size,
    appearance,
    labelPosition,
    classes,
    rootProps,
    minHeight,
  };
}
