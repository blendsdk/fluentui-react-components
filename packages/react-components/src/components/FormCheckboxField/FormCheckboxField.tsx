import * as React from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { CheckboxFieldValue } from '../../forms/FormField.types';
import type { FormCheckboxFieldProps } from './FormCheckboxField.types';
import { renderFormCheckboxField } from './renderFormCheckboxField';
import { useFormCheckboxField } from './useFormCheckboxField';

const FormCheckboxFieldBase = <
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, CheckboxFieldValue>,
>(
  props: FormCheckboxFieldProps<TFieldValues, TName>,
  ref: React.Ref<HTMLInputElement>
) => {
  const state = useFormCheckboxField(props, ref);

  return renderFormCheckboxField(state);
};

FormCheckboxFieldBase.displayName = 'FormCheckboxField';

/**
 * Checkbox bound to a React Hook Form field.
 *
 * The primitive owns the visible label and its required marker; `Field` adds
 * the hint, validation message, error state, and required state. The form
 * value stays in React Hook Form and supports the mixed state.
 *
 * @example
 * ```tsx
 * <FormCheckboxField
 *     control={form.control}
 *     name="active"
 *     label="Enable feature"
 *     hint="This turns on the feature for your workspace"
 * />
 * ```
 */
export const FormCheckboxField = React.forwardRef(FormCheckboxFieldBase) as <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, CheckboxFieldValue> = FieldPathByValue<
    TFieldValues,
    CheckboxFieldValue
  >,
>(
  props: FormCheckboxFieldProps<TFieldValues, TName> & React.RefAttributes<HTMLInputElement>
) => React.ReactElement;
