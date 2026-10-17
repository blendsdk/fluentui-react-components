import * as React from 'react';
import type { LoadingProps } from './Loading.types';
import { renderLoading } from './renderLoading';
import { useLoadingBase } from './useLoadingBase';

/**
 * Loading filler: a centered, indeterminate spinner for a region with no
 * content to cover.
 *
 * The filler is transparent and fills its parent, shows a visible label and
 * announces that label through a polite status region. It holds no data and
 * performs no I/O: the application decides when it is mounted. When a region
 * has content to cover instead, use `LoadingOverlay` so the content stays
 * mounted and becomes inert.
 *
 * A `delay` postpones both the visible indicator and the announcement, so a
 * fast operation never flashes a loader. The label falls back to `Loading…`
 * for a missing or blank value; pass a translated string from the call site.
 *
 * @example
 * ```tsx
 * <Loading label="Loading records…" />
 * ```
 *
 * @example
 * ```tsx
 * <div style={{ height: 240 }}>
 *     <Loading label="Saving…" delay={300} minHeight={240} />
 * </div>
 * ```
 */
export const Loading = React.forwardRef<HTMLDivElement, LoadingProps>((props, ref) => {
  const state = useLoadingBase(props);

  return renderLoading(state, ref);
});

Loading.displayName = 'Loading';
