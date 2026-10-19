import { Field, Switch } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { FormSwitchFieldState } from './useFormSwitchField';

/**
 * Renders a switch field from its resolved state.
 *
 * `Field` has no label here: the primitive renders its own label and required
 * marker. `Field` still supplies the hint, validation message, error state,
 * and required state through its context.
 *
 * @param state - resolved field state
 * @returns the composed Field and Switch
 */
export function renderFormSwitchField(state: FormSwitchFieldState): ReactElement {
  return (
    <Field
      hint={state.hint}
      required={state.required}
      validationMessage={state.errorMessage}
    >
      <Switch {...state.switchProps} label={state.label} ref={state.controlRef} />
    </Field>
  );
}
