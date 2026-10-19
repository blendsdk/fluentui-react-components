// Template: src/components/<Name>/render<Name>.tsx
// Replace <Name> and <element>. Pure mapping from state to elements: no hooks,
// no state, no decisions. Explain the element choice and any Fluent UI prop
// with surprising behavior in the doc comment.
import { mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { <Name>State } from './use<Name>';

/**
 * Renders <the component>.
 *
 * The caller's class name is merged after the component's own classes, so an
 * application can adjust the component without losing the pattern.
 *
 * @param state - resolved component state
 * @returns the rendered element
 */
export function render<Name>(state: <Name>State): ReactElement {
  return (
    <<element>
      {...state.rootProps}
      className={mergeClasses(state.classes.root, state.rootProps.className)}
      ref={state.rootRef}
    >
      {state.children}
    </<element>>
  );
}
