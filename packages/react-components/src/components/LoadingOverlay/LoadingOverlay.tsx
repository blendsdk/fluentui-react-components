import * as React from 'react';
import type { LoadingOverlayProps } from './LoadingOverlay.types';
import { renderLoadingOverlay } from './renderLoadingOverlay';
import { useLoadingOverlay } from './useLoadingOverlay';

/**
 * Loading overlay: a region-scoped blocking layer that keeps its content
 * mounted.
 *
 * While `loading` is true the overlay waits for its delay (300 ms by default),
 * then covers the region with a themed scrim and a spinner, marks the content
 * inert and announces the label once. A response that settles before the
 * delay never flashes the overlay. The content stays mounted in both states,
 * so scroll position, form state and focus context survive a save or a
 * refresh.
 *
 * The component is controlled and presentation-only: the application owns the
 * boolean, the async work and every side effect. The boolean can come from
 * `useLoading().isLoading`, `useTransition`, `useActionState`, a store or any
 * existing `fetching` flag. The overlay is local to its region and does not
 * portal; portaled or fixed descendants are outside its blocking guarantee.
 *
 * @example
 * ```tsx
 * <LoadingOverlay loading={isFetching} label="Loading records…">
 *     <DataGrid records={records} />
 * </LoadingOverlay>
 * ```
 *
 * @example
 * ```tsx
 * const { isLoading, label, run } = useLoading({ label: 'Please wait…' });
 *
 * <LoadingOverlay loading={isLoading} label={label}>
 *     <ActorForm />
 * </LoadingOverlay>;
 * ```
 */
export const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  (props, forwardedRef) => {
    const state = useLoadingOverlay(props);

    // The focus algorithm owns the internal root ref; the application's ref
    // must point at the same node. Mirroring it through useImperativeHandle
    // keeps one element owner and avoids a second ref object.
    React.useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
      forwardedRef,
      () => state.rootRef.current,
      [state.rootRef]
    );

    return renderLoadingOverlay(state);
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';
