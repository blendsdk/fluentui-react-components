import type { DropdownProps } from '@fluentui/react-components';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { FormFieldBaseProps, SelectionFieldValue } from '../../forms/FormField.types';

/**
 * Props of the single-select Dropdown bound to React Hook Form.
 *
 * The form stores the selected option value; the empty string means no
 * selection. The primitive shows option text, so `getOptionText` resolves the
 * display text when the option value differs from its text. Without it, the
 * raw value is shown.
 *
 * The wrapper omits `value`, `defaultValue`, `selectedOptions`,
 * `defaultSelectedOptions`, `onOptionSelect`, `multiselect`, and `name`; every
 * other `Dropdown` prop passes through, including `clearable`, `disabled`,
 * `size`, `appearance`, `open`, and `inlinePopup`.
 *
 * @typeParam TFieldValues - the shape of the form values
 * @typeParam TName - a string field path inside `TFieldValues`
 *
 * @example
 * ```tsx
 * <FormDropdownField
 *     control={form.control}
 *     name="color"
 *     label="Color"
 *     getOptionText={value => optionLabels[value]}
 * >
 *     <Option value="red">Red</Option>
 *     <Option value="blue">Blue</Option>
 * </FormDropdownField>
 * ```
 */
export type FormDropdownFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue> = FieldPathByValue<
    TFieldValues,
    SelectionFieldValue
  >,
> = Omit<
  DropdownProps,
  | 'value'
  | 'defaultValue'
  | 'selectedOptions'
  | 'defaultSelectedOptions'
  | 'onOptionSelect'
  | 'multiselect'
  | 'name'
> &
  FormFieldBaseProps<TFieldValues, TName> & {
    /**
     * Resolves the visible text for a stored option value.
     *
     * @param value - the stored option value
     * @returns the text to show, or `undefined` to fall back to the raw value
     */
    getOptionText?: (value: string) => string | undefined;
  };
