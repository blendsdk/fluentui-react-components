import * as React from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { SelectionFieldValue } from '../../forms/FormField.types';
import type { FormComboboxFieldProps } from './FormComboboxField.types';
import { renderFormComboboxField } from './renderFormComboboxField';
import { useFormComboboxField } from './useFormComboboxField';

const FormComboboxFieldBase = <
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue>,
>(
  props: FormComboboxFieldProps<TFieldValues, TName>,
  ref: React.Ref<HTMLInputElement>
) => {
  const state = useFormComboboxField(props, ref);

  return renderFormComboboxField(state);
};

FormComboboxFieldBase.displayName = 'FormComboboxField';

/**
 * Single-select Combobox bound to a React Hook Form field.
 *
 * The form stores the selected option value; the empty string means no
 * selection. Typing filters the list but does not commit until an option is
 * selected. `getOptionText` resolves the text for a stored value after
 * `reset` or `setValue`. The wrapper is not freeform or multiselect.
 *
 * Fluent's clear affordance is pointer-only. For a keyboard-accessible clear,
 * include an option with an empty value, such as
 * `<Option value="">None</Option>`; selecting it stores the empty string and
 * clears the input.
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
export const FormComboboxField = React.forwardRef(FormComboboxFieldBase) as <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue> = FieldPathByValue<
    TFieldValues,
    SelectionFieldValue
  >,
>(
  props: FormComboboxFieldProps<TFieldValues, TName> & React.RefAttributes<HTMLInputElement>
) => React.ReactElement;
