import { useId, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { resolveLoadingLabel } from '../Loading/loadingLabel';
import { useDelayedVisibility } from '../Loading/useDelayedVisibility';
import type { LoadingOverlayProps } from './LoadingOverlay.types';
import { useLoadingOverlayFocus } from './useLoadingOverlayFocus';
import type { LoadingOverlayClasses } from './useLoadingOverlayStyles.styles';
import { useLoadingOverlayStyles } from './useLoadingOverlayStyles.styles';

/**
 * The resolved, render-ready view of a `LoadingOverlay` instance.
 */
export type LoadingOverlayState = {
  /** Whether the covered operation is pending. */
  loading: boolean;
  /** True once the delay has elapsed; controls inert, the scrim and the status text. */
  visible: boolean;
  /** The resolved, always non-empty label. */
  resolvedLabel: string;
  /** The covered content, kept mounted in both states. */
  children: ReactNode;
  /** Stable id shared by the root's `aria-labelledby` and the persistent status node. */
  statusId: string;
  /** Ref for the focusable overlay root. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Ref for the content wrapper that becomes inert. */
  contentRef: RefObject<HTMLDivElement | null>;
  /** Griffel class names for root, content, scrim, indicator wrapper and hidden status. */
  classes: LoadingOverlayClasses;
  /** Native `div` props for the root, excluding the component's own props. */
  rootProps: Omit<LoadingOverlayProps, 'loading' | 'label' | 'delay' | 'children'>;
};

/**
 * Resolves the overlay's props into render state.
 *
 * Defaults and the delayed-visibility decision live here so the render
 * function and the focus hook read one resolved contract. The busy marker
 * follows `loading` immediately; only the scrim, inert state, focus move and
 * status text wait for the delay. The status id is stable for the lifetime of
 * the instance, so the root's accessible name always points at the persistent
 * status node.
 *
 * @param props - props from this instance of the overlay
 * @returns the state consumed by `renderLoadingOverlay`
 */
export function useLoadingOverlay(props: LoadingOverlayProps): LoadingOverlayState {
  const { loading, label, delay = 300, children, ...rootProps } = props;

  const visible = useDelayedVisibility(loading, delay);
  const statusId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const classes = useLoadingOverlayStyles();

  useLoadingOverlayFocus({ rootRef, contentRef, loading, visible });

  return {
    loading,
    visible,
    resolvedLabel: resolveLoadingLabel(label),
    children,
    statusId,
    rootRef,
    contentRef,
    classes,
    rootProps,
  };
}
