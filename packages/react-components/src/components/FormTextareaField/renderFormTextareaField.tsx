import { Field, Textarea } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { FormTextareaFieldState } from './useFormTextareaField';

/**
 * Renders a textarea field from its resolved state.
 *
 * `Field` owns the label, hint, required marker, and validation message, and
 * wires them to the textarea. `Textarea` owns the value and focus behavior.
 *
 * @param state - resolved field state
 * @returns the composed Field and Textarea
 */
export function renderFormTextareaField(state: FormTextareaFieldState): ReactElement {
  return (
    <Field
      label={state.label}
      hint={state.hint}
      required={state.required}
      size={state.fieldSize}
      validationMessage={state.errorMessage}
    >
      <Textarea {...state.textareaProps} ref={state.controlRef} />
    </Field>
  );
}
