import type { ComboboxProps } from '@fluentui/react-components';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { FormFieldBaseProps, SelectionFieldValue } from '../../forms/FormField.types';

/**
 * Props of the single-select Combobox bound to React Hook Form.
 *
 * The form stores the selected option value; the empty string means no
 * selection. The input text is local while the user types and is committed
 * only when an option is selected. `getOptionText` resolves the text for a
 * stored value after `reset` or `setValue`.
 *
 * The wrapper omits `value`, `defaultValue`, `selectedOptions`,
 * `defaultSelectedOptions`, `onOptionSelect`, `onInput`, `onChange`,
 * `multiselect`, `freeform`, and `name`; every other `Combobox` prop passes
 * through, including `clearable`, `disabled`, `size`, `appearance`, `open`,
 * and `inlinePopup`.
 *
 * @typeParam TFieldValues - the shape of the form values
 * @typeParam TName - a string field path inside `TFieldValues`
 *
 * @example
 * ```tsx
 * <FormComboboxField
 *     control={form.control}
 *     name="color"
 *     label="Color"
 *     getOptionText={value => optionLabels[value]}
 * >
 *     <Option value="red">Red</Option>
 *     <Option value="blue">Blue</Option>
 * </FormComboboxField>
 * ```
 */
export type FormComboboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue> = FieldPathByValue<
    TFieldValues,
    SelectionFieldValue
  >,
> = Omit<
    ComboboxProps,
    | 'value'
    | 'defaultValue'
    | 'selectedOptions'
    | 'defaultSelectedOptions'
    | 'onOptionSelect'
    | 'onInput'
    | 'onChange'
    | 'multiselect'
    | 'freeform'
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
