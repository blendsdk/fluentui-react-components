import * as React from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { SwitchFieldValue } from '../../forms/FormField.types';
import type { FormSwitchFieldProps } from './FormSwitchField.types';
import { renderFormSwitchField } from './renderFormSwitchField';
import { useFormSwitchField } from './useFormSwitchField';

const FormSwitchFieldBase = <
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, SwitchFieldValue>,
>(
  props: FormSwitchFieldProps<TFieldValues, TName>,
  ref: React.Ref<HTMLInputElement>
) => {
  const state = useFormSwitchField(props, ref);

  return renderFormSwitchField(state);
};

FormSwitchFieldBase.displayName = 'FormSwitchField';

/**
 * Switch bound to a React Hook Form field.
 *
 * The primitive owns the visible label and its required marker; `Field` adds
 * the hint, validation message, error state, and required state. The form
 * value stays in React Hook Form.
 *
 * @example
 * ```tsx
 * <FormSwitchField
 *     control={form.control}
 *     name="enabled"
 *     label="Enable feature"
 * />
 * ```
 */
export const FormSwitchField = React.forwardRef(FormSwitchFieldBase) as <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, SwitchFieldValue> = FieldPathByValue<
    TFieldValues,
    SwitchFieldValue
  >,
>(
  props: FormSwitchFieldProps<TFieldValues, TName> & React.RefAttributes<HTMLInputElement>
) => React.ReactElement;
