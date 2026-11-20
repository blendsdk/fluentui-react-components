import { Button, mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { AppBarButtonState } from './useAppBarButton';

/**
 * Renders an application bar command.
 *
 * The forced appearance, shape, size and type come after the caller props, so
 * a JavaScript caller cannot override the M365 treatment. The
 * `data-app-bar-button` attribute is the styling hook; `aria-expanded` from
 * `PopoverTrigger` arrives in the spread and reaches the button.
 *
 * @param state - resolved command state
 * @returns the Fluent Button with the bar command treatment
 */
export function renderAppBarButton(state: AppBarButtonState): ReactElement {
  return (
    <Button
      {...state.rootProps}
      ref={state.rootRef}
      appearance="transparent"
      shape="square"
      size="medium"
      type={state.type}
      aria-label={state.ariaLabel}
      data-app-bar-button=""
      className={mergeClasses(state.classes.root, state.rootProps.className)}
    >
      {state.children}
    </Button>
  );
}
