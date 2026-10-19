import { Field } from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import type { ReactElement } from 'react';
import type { FormDatePickerFieldState } from './useFormDatePickerField';

/**
 * Renders a DatePicker field from its resolved state.
 *
 * `Field` owns the label, hint, required marker, and validation message.
 * `DatePicker` owns the input, calendar, and date formatting. The Field
 * render-function child passes only the generated `id`, so the label's `for`
 * attribute matches the input and the Field context supplies the described-by
 * ids exactly once.
 *
 * @param state - resolved field state
 * @returns the composed Field and DatePicker
 */
export function renderFormDatePickerField(state: FormDatePickerFieldState): ReactElement {
  return (
    <Field
      label={state.label}
      hint={state.hint}
      required={state.required}
      size={state.fieldSize}
      validationMessage={state.errorMessage}
    >
      {({ id }) => <DatePicker {...state.datePickerProps} id={id} ref={state.controlRef} />}
    </Field>
  );
}
