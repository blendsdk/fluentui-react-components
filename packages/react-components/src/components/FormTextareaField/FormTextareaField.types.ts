import type { TextareaProps } from '@fluentui/react-components';
import type { FieldPathByValue, FieldPathValue, FieldValues } from 'react-hook-form';
import type { FormFieldBaseProps, TextFieldValue } from '../../forms/FormField.types';

/**
 * Props of the textarea field bound to React Hook Form.
 *
 * The form owns the value and the default value; the wrapper binds the field
 * name and the change handler. Every other `Textarea` prop passes through,
 * including `readOnly`, `disabled`, `resize`, `size`, and `appearance`.
 *
 * `parse` follows the same contract as the text field: it converts the raw
 * string to a non-string form value while the raw text stays visible.
 *
 * @typeParam TFieldValues - the shape of the form values
 * @typeParam TName - a text-compatible field path inside `TFieldValues`
 *
 * @example
 * ```tsx
 * <FormTextareaField
 *     control={form.control}
 *     name="notes"
 *     label="Notes"
 *     hint="Keep it under 500 characters"
 *     resize="vertical"
 * />
 * ```
 */
export type FormTextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, TextFieldValue> = FieldPathByValue<
    TFieldValues,
    TextFieldValue
  >,
> = Omit<TextareaProps, 'value' | 'defaultValue' | 'onChange' | 'name' | 'children'> &
  FormFieldBaseProps<TFieldValues, TName> & {
    /**
     * Converts the textarea's string value before it reaches the form.
     *
     * @param value - the raw string from the textarea
     * @returns the value stored in the form
     */
    parse?: (value: string) => FieldPathValue<TFieldValues, TName> | undefined;
  };
