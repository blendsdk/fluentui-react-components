import { mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { AppBarState } from './useAppBar';

/**
 * Renders the application bar.
 *
 * A top-level `<header>` exposes the banner landmark without an explicit
 * role. The caller's props spread first, then the component's class and ref,
 * so the class is always merged and the ref always points at the header.
 *
 * @param state - resolved bar state
 * @returns the header element with the bar content
 */
export function renderAppBar(state: AppBarState): ReactElement {
  return (
    <header
      {...state.rootProps}
      className={mergeClasses(state.classes.root, state.rootProps.className)}
      ref={state.rootRef}
    >
      {state.children}
    </header>
  );
}
