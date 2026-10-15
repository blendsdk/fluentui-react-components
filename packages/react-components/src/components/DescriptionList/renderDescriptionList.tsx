import { mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import { DescriptionListItemLayoutContext } from '../DescriptionListItem/DescriptionListItemLayoutContext';
import type { DescriptionListState } from './useDescriptionList';

/**
 * Renders the description list.
 *
 * The layout travels to the items through a context provider that wraps them
 * without rendering an element of its own, so every `DescriptionListItem`
 * stays a direct child of the `dl` element — the placement the HTML
 * specification defines for pairs and the one assistive technology expects.
 * The caller's class name is merged after the layout classes, so an
 * application can adjust the list without losing its layout.
 *
 * @param state - resolved list state
 * @returns the description list with its pairs
 */
export function renderDescriptionList(state: DescriptionListState): ReactElement {
  return (
    <dl
      {...state.rootProps}
      className={mergeClasses(state.classes.root, state.rootProps.className)}
      ref={state.listRef}
    >
      <DescriptionListItemLayoutContext.Provider value={state.layout}>
        {state.children}
      </DescriptionListItemLayoutContext.Provider>
    </dl>
  );
}
