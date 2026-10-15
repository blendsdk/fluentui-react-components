import { mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { DescriptionListItemState } from './useDescriptionListItem';

/**
 * Renders one term/definition pair.
 *
 * The wrapper is a plain `div`, which is the grouping element the HTML
 * specification defines for term/definition pairs inside a `dl`; assistive
 * technology still reads the pair as a term and its definition. The label
 * lands in a `dt` and the value in a `dd`, so the semantics live in the
 * markup rather than in ARIA attributes. The caller's class name is merged
 * after the layout classes, so an application can adjust a pair without
 * losing the layout the surrounding list asked for.
 *
 * @param state - resolved pair state
 * @returns the term/definition pair
 */
export function renderDescriptionListItem(state: DescriptionListItemState): ReactElement {
  return (
    <div
      {...state.rootProps}
      className={mergeClasses(state.classes.root, state.rootProps.className)}
      ref={state.itemRef}
    >
      <dt className={state.classes.label}>{state.label}</dt>
      <dd className={state.classes.value}>{state.children}</dd>
    </div>
  );
}
