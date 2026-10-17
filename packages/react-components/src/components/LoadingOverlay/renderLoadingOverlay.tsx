import { mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import { renderLoadingIndicator } from '../Loading/renderLoadingIndicator';
import type { LoadingOverlayState } from './useLoadingOverlay';

/**
 * Renders the loading overlay from its resolved state.
 *
 * The DOM has four regions with distinct jobs:
 *
 * - the root is the positioning context, the programmatic focus target and
 *   the element named by the persistent status node;
 * - the content wrapper keeps the children mounted and carries `aria-busy`
 *   from the first render plus `inert` while the overlay is visible;
 * - the status node is a sibling of that wrapper, so its text change is
 *   announced while the content is busy;
 * - the scrim covers the region only while visible and owns the decorative
 *   indicator.
 *
 * `aria-busy` is deliberately not on the root: it tells assistive technology
 * to defer changes inside its subtree, and the announcement must not be
 * deferred. The status node stays outside the busy subtree for the same
 * reason.
 *
 * @param state - resolved overlay state
 * @returns the overlay root with the persistent status node and optional scrim
 */
export function renderLoadingOverlay(state: LoadingOverlayState): ReactElement {
  const {
    statusId,
    rootRef,
    contentRef,
    classes,
    rootProps,
    loading,
    visible,
    resolvedLabel,
    children,
  } = state;

  return (
    <div
      {...rootProps}
      ref={rootRef}
      className={mergeClasses(classes.root, rootProps.className)}
      style={rootProps.style}
      tabIndex={-1}
      aria-labelledby={statusId}
    >
      <div
        ref={contentRef}
        className={classes.content}
        aria-busy={loading}
        inert={visible ? true : undefined}
      >
        {children}
      </div>

      <div
        id={statusId}
        className={classes.visuallyHidden}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {visible ? resolvedLabel : ''}
      </div>

      {visible ? (
        <div className={classes.scrim}>
          {renderLoadingIndicator({
            label: resolvedLabel,
            size: 'large',
            appearance: 'primary',
            labelPosition: 'below',
            className: classes.indicator,
          })}
        </div>
      ) : null}
    </div>
  );
}
