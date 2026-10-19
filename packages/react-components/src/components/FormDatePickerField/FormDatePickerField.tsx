import * as React from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { DatePickerFieldValue } from '../../forms/FormField.types';
import type { FormDatePickerFieldProps } from './FormDatePickerField.types';
import { renderFormDatePickerField } from './renderFormDatePickerField';
import { useFormDatePickerField } from './useFormDatePickerField';

const FormDatePickerFieldBase = <
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, DatePickerFieldValue>,
>(
  props: FormDatePickerFieldProps<TFieldValues, TName>,
  ref: React.Ref<HTMLInputElement>
) => {
  const state = useFormDatePickerField(props, ref);

  return renderFormDatePickerField(state);
};

FormDatePickerFieldBase.displayName = 'FormDatePickerField';

/**
 * DatePicker bound to a React Hook Form field.
 *
 * The form value is a `Date`, or `null` when there is no date. `Field` owns
 * the label, hint, required marker, and validation message; `DatePicker`
 * owns the input, calendar, formatting, and date parsing.
 *
 * Editability follows `allowTextInput`; the primitive is read-only when it is
 * false. For typed dates, pass `formatDate` and `parseDateFromString` so the
 * input and the form agree on the date format.
 *
 * @example
 * ```tsx
 * <FormDatePickerField
 *     control={form.control}
 *     name="startDate"
 *     label="Start date"
 *     formatDate={date => date?.toLocaleDateString() ?? ''}
 * />
 * ```
 */
export const FormDatePickerField = React.forwardRef(FormDatePickerFieldBase) as <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, DatePickerFieldValue> = FieldPathByValue<
    TFieldValues,
    DatePickerFieldValue
  >,
>(
  props: FormDatePickerFieldProps<TFieldValues, TName> & React.RefAttributes<HTMLInputElement>
) => React.ReactElement;
