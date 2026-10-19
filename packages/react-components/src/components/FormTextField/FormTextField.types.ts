import type { InputProps } from '@fluentui/react-components';
import type { FieldPathByValue, FieldPathValue, FieldValues } from 'react-hook-form';
import type { FormFieldBaseProps, TextFieldValue } from '../../forms/FormField.types';

/**
 * Props of the text field bound to React Hook Form.
 *
 * The wrapper owns the value, change handler, name, and default value. Every
 * other `Input` prop passes through, including `readOnly`, `disabled`, `type`,
 * `size`, `appearance`, `contentBefore`, and `contentAfter`.
 *
 * `parse` converts the primitive's string value before it reaches the form.
 * Use it when the field stores a number or another non-string value; return
 * `undefined` for an empty input when the field is optional. The raw
 * keystrokes stay visible, so partial input such as `1.` or `-` is not lost.
 *
 * @typeParam TFieldValues - the shape of the form values
 * @typeParam TName - a text-compatible field path inside `TFieldValues`
 *
 * @example
 * ```tsx
 * <FormTextField
 *     control={form.control}
 *     name="height"
 *     label="Height"
 *     hint="Whole centimeters"
 *     required
 *     parse={value => (value === '' ? undefined : Number(value))}
 * />
 * ```
 */
export type FormTextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, TextFieldValue> = FieldPathByValue<
    TFieldValues,
    TextFieldValue
  >,
> = Omit<InputProps, 'value' | 'defaultValue' | 'onChange' | 'name' | 'children'> &
  FormFieldBaseProps<TFieldValues, TName> & {
    /**
     * Converts the input's string value before it reaches the form.
     *
     * @param value - the raw string from the input
     * @returns the value stored in the form
     */
    parse?: (value: string) => FieldPathValue<TFieldValues, TName> | undefined;
  };
