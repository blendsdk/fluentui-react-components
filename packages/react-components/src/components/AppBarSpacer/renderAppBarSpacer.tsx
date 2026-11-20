import { mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { AppBarSpacerState } from './useAppBarSpacer';

/**
 * Renders the application bar spacer.
 *
 * The div is deliberately empty: it has no accessible name, no tab stop and
 * no content of its own. The caller's props spread first, then the component
 * class and ref.
 *
 * @param state - resolved spacer state
 * @returns the empty spacer div
 */
export function renderAppBarSpacer(state: AppBarSpacerState): ReactElement {
  return (
    <div
      {...state.rootProps}
      className={mergeClasses(state.classes.root, state.rootProps.className)}
      ref={state.rootRef}
    />
  );
}
