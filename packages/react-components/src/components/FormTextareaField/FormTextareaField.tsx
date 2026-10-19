import * as React from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { TextFieldValue } from '../../forms/FormField.types';
import type { FormTextareaFieldProps } from './FormTextareaField.types';
import { renderFormTextareaField } from './renderFormTextareaField';
import { useFormTextareaField } from './useFormTextareaField';

const FormTextareaFieldBase = <
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, TextFieldValue>,
>(
  props: FormTextareaFieldProps<TFieldValues, TName>,
  ref: React.Ref<HTMLTextAreaElement>
) => {
  const state = useFormTextareaField(props, ref);

  return renderFormTextareaField(state);
};

FormTextareaFieldBase.displayName = 'FormTextareaField';

/**
 * Multi-line text input bound to a React Hook Form field.
 *
 * The component renders a Fluent `Textarea` inside a Fluent `Field`. `Field`
 * supplies the label, hint, required marker, and validation message; the
 * textarea supplies the value, focus, and read-only/disabled state. The form
 * value stays in React Hook Form.
 *
 * Use `parse` for non-string values. It receives the raw string and returns
 * the value stored in the form, so partial input stays visible.
 *
 * @example
 * ```tsx
 * const form = useForm<{ notes: string }>({
 *     defaultValues: { notes: '' },
 * });
 *
 * <FormTextareaField
 *     control={form.control}
 *     name="notes"
 *     label="Notes"
 *     hint="Keep it under 500 characters"
 *     resize="vertical"
 * />
 * ```
 */
export const FormTextareaField = React.forwardRef(FormTextareaFieldBase) as <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, TextFieldValue> = FieldPathByValue<
    TFieldValues,
    TextFieldValue
  >,
>(
  props: FormTextareaFieldProps<TFieldValues, TName> & React.RefAttributes<HTMLTextAreaElement>
) => React.ReactElement;
