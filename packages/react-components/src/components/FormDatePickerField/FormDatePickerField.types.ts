import type { DatePickerProps } from '@fluentui/react-datepicker-compat';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { DatePickerFieldValue, FormFieldBaseProps } from '../../forms/FormField.types';

/**
 * Props of the DatePicker field bound to React Hook Form.
 *
 * The form value is a `Date`, or `null` when there is no date. `Field` owns
 * the label, hint, required marker, and validation message; `DatePicker`
 * owns the input, calendar, formatting, and date parsing.
 *
 * The wrapper omits `value`, `defaultValue`, `onSelectDate`, `name`, `id`,
 * `required`, and `readOnly`; every other `DatePicker` prop passes through,
 * including `allowTextInput`, `formatDate`, `parseDateFromString`, `minDate`,
 * `maxDate`, `strings`, and `onValidationResult`. Editability follows
 * `allowTextInput`; the primitive is read-only when it is false.
 *
 * @typeParam TFieldValues - the shape of the form values
 * @typeParam TName - a `Date` field path inside `TFieldValues`
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
export type FormDatePickerFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, DatePickerFieldValue> = FieldPathByValue<
    TFieldValues,
    DatePickerFieldValue
  >,
> = Omit<
  DatePickerProps,
  'value' | 'defaultValue' | 'onSelectDate' | 'name' | 'id' | 'required' | 'readOnly'
> &
  FormFieldBaseProps<TFieldValues, TName>;
