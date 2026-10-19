import { Field, RadioGroup } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { FormRadioGroupFieldState } from './useFormRadioGroupField';

/**
 * Renders a radio group field from its resolved state.
 *
 * `Field` labels the group and supplies the hint, required marker, and
 * validation message. `RadioGroup` owns the roving focus and the individual
 * `Radio` children keep their own labels.
 *
 * @param state - resolved field state
 * @returns the composed Field and RadioGroup
 */
export function renderFormRadioGroupField(state: FormRadioGroupFieldState): ReactElement {
  return (
    <Field
      label={state.label}
      hint={state.hint}
      required={state.required}
      validationMessage={state.errorMessage}
    >
      <RadioGroup {...state.groupProps} ref={state.controlRef}>
        {state.children}
      </RadioGroup>
    </Field>
  );
}
