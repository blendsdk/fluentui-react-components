import { Field, Input } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { FormTextFieldState } from './useFormTextField';

/**
 * Renders a text field from its resolved state.
 *
 * `Field` owns the label, hint, required marker, and validation message, and
 * wires them to the input. `Input` owns the value and focus behavior; the
 * wrapper only supplies the controlled value and handlers.
 *
 * @param state - resolved field state
 * @returns the composed Field and Input
 */
export function renderFormTextField(state: FormTextFieldState): ReactElement {
  return (
    <Field
      label={state.label}
      hint={state.hint}
      required={state.required}
      size={state.fieldSize}
      validationMessage={state.errorMessage}
    >
      <Input {...state.inputProps} ref={state.controlRef} />
    </Field>
  );
}
