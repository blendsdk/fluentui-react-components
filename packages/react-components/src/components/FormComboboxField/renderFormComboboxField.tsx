import { Combobox, Field } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { FormComboboxFieldState } from './useFormComboboxField';

/**
 * Renders a Combobox field from its resolved state.
 *
 * `Field` owns the label, hint, required marker, and validation message.
 * `Combobox` owns the input, filtering, selection, and popup. The wrapper
 * supplies the local input text and commits only selected option values.
 *
 * @param state - resolved field state
 * @returns the composed Field and Combobox
 */
export function renderFormComboboxField(state: FormComboboxFieldState): ReactElement {
  return (
    <Field
      label={state.label}
      hint={state.hint}
      required={state.required}
      size={state.fieldSize}
      validationMessage={state.errorMessage}
    >
      <Combobox {...state.comboboxProps} ref={state.controlRef}>
        {state.children}
      </Combobox>
    </Field>
  );
}
