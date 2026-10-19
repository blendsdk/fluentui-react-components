import * as React from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { TextFieldValue } from '../../forms/FormField.types';
import type { FormTextFieldProps } from './FormTextField.types';
import { renderFormTextField } from './renderFormTextField';
import { useFormTextField } from './useFormTextField';

const FormTextFieldBase = <
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, TextFieldValue>,
>(
  props: FormTextFieldProps<TFieldValues, TName>,
  ref: React.Ref<HTMLInputElement>
) => {
  const state = useFormTextField(props, ref);

  return renderFormTextField(state);
};

FormTextFieldBase.displayName = 'FormTextField';

/**
 * Text input bound to a React Hook Form field.
 *
 * The component renders a Fluent `Input` inside a Fluent `Field`. `Field`
 * supplies the label, hint, required marker, and validation message; the
 * input supplies the value, focus, and read-only/disabled state. The form
 * value stays in React Hook Form.
 *
 * Use `parse` for non-string values. It receives the raw string and returns
 * the value stored in the form, so partial input such as `1.` remains visible
 * while the parsed value reaches the form.
 *
 * @example
 * ```tsx
 * const form = useForm<{ name: string; height?: number }>({
 *     defaultValues: { name: '' },
 * });
 *
 * <FormTextField control={form.control} name="name" label="Name" required />
 * <FormTextField
 *     control={form.control}
 *     name="height"
 *     label="Height"
 *     hint="Whole centimeters"
 *     parse={value => (value === '' ? undefined : Number(value))}
 * />
 * ```
 */
export const FormTextField = React.forwardRef(FormTextFieldBase) as <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, TextFieldValue> = FieldPathByValue<
    TFieldValues,
    TextFieldValue
  >,
>(
  props: FormTextFieldProps<TFieldValues, TName> & React.RefAttributes<HTMLInputElement>
) => React.ReactElement;
