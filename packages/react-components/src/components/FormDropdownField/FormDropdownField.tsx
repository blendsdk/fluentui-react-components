import * as React from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { SelectionFieldValue } from '../../forms/FormField.types';
import type { FormDropdownFieldProps } from './FormDropdownField.types';
import { renderFormDropdownField } from './renderFormDropdownField';
import { useFormDropdownField } from './useFormDropdownField';

const FormDropdownFieldBase = <
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue>,
>(
  props: FormDropdownFieldProps<TFieldValues, TName>,
  ref: React.Ref<HTMLButtonElement>
) => {
  const state = useFormDropdownField(props, ref);

  return renderFormDropdownField(state);
};

FormDropdownFieldBase.displayName = 'FormDropdownField';

/**
 * Single-select Dropdown bound to a React Hook Form field.
 *
 * The form stores the selected option value. `getOptionText` resolves the
 * display text when an option's value differs from its text; without it, the
 * raw value is displayed. The wrapper is not multiselect.
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
export const FormDropdownField = React.forwardRef(FormDropdownFieldBase) as <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue> = FieldPathByValue<
    TFieldValues,
    SelectionFieldValue
  >,
>(
  props: FormDropdownFieldProps<TFieldValues, TName> & React.RefAttributes<HTMLButtonElement>
) => React.ReactElement;
