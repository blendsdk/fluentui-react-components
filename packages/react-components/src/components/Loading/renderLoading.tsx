import { mergeClasses } from '@fluentui/react-components';
import type { ReactElement, Ref } from 'react';
import { renderLoadingIndicator } from './renderLoadingIndicator';
import type { LoadingBaseState } from './useLoadingBase';

/**
 * Renders the loading filler from its resolved state.
 *
 * The root is the single polite status region. Its announced text is a
 * visually hidden copy of the label; the visible spinner and its own label
 * sit in an `aria-hidden` wrapper, so assistive technology hears the label
 * once. The status node is mounted immediately and its text appears only
 * after the delay, which turns the reveal into a text change in an existing
 * live region rather than the insertion of a new one.
 *
 * `minHeight` is spread conditionally: writing the key as `undefined` after
 * the caller's style would erase a legitimate `style.minHeight`.
 *
 * @param state - resolved filler state
 * @param ref - ref to the root element
 * @returns the status root with the optional indicator
 */
export function renderLoading(state: LoadingBaseState, ref: Ref<HTMLDivElement>): ReactElement {
  const { rootProps, classes, visible, label, size, appearance, labelPosition, minHeight } = state;

  return (
    <div
      {...rootProps}
      ref={ref}
      className={mergeClasses(classes.root, rootProps.className)}
      style={{ ...rootProps.style, ...(minHeight !== undefined ? { minHeight } : {}) }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={classes.visuallyHidden}>{visible ? label : ''}</span>
      {visible
        ? renderLoadingIndicator({
            label,
            size,
            appearance,
            labelPosition,
            className: classes.indicator,
          })
        : null}
    </div>
  );
}
