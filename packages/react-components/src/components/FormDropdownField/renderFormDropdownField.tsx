import { Dropdown, Field } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { FormDropdownFieldState } from './useFormDropdownField';

/**
 * Renders a Dropdown field from its resolved state.
 *
 * `Field` owns the label, hint, required marker, and validation message.
 * `Dropdown` owns the trigger, selection, and popup. The wrapper supplies the
 * stored value as the selected option and the resolved text as the display.
 *
 * @param state - resolved field state
 * @returns the composed Field and Dropdown
 */
export function renderFormDropdownField(state: FormDropdownFieldState): ReactElement {
  return (
    <Field
      label={state.label}
      hint={state.hint}
      required={state.required}
      size={state.fieldSize}
      validationMessage={state.errorMessage}
    >
      <Dropdown {...state.dropdownProps} ref={state.controlRef}>
        {state.children}
      </Dropdown>
    </Field>
  );
}
