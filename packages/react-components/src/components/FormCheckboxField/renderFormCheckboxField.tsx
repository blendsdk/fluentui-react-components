import { Checkbox, Field } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { FormCheckboxFieldState } from './useFormCheckboxField';

/**
 * Renders a checkbox field from its resolved state.
 *
 * `Field` has no label here: the primitive renders its own label and required
 * marker. `Field` still supplies the hint, validation message, error state,
 * and required state through its context.
 *
 * @param state - resolved field state
 * @returns the composed Field and Checkbox
 */
export function renderFormCheckboxField(state: FormCheckboxFieldState): ReactElement {
  return (
    <Field hint={state.hint} required={state.required} validationMessage={state.errorMessage}>
      <Checkbox {...state.checkboxProps} label={state.label} ref={state.controlRef} />
    </Field>
  );
}
