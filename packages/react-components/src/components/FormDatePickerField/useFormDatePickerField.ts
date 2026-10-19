import { mergeCallbacks, useMergedRefs } from '@fluentui/react-components';
import type { DatePickerProps } from '@fluentui/react-datepicker-compat';
import type { FocusEventHandler, Ref } from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { DatePickerFieldValue } from '../../forms/FormField.types';
import { useFormField } from '../../forms/useFormField';
import type { FormDatePickerFieldProps } from './FormDatePickerField.types';

/**
 * State that {@link renderFormDatePickerField} renders.
 */
export type FormDatePickerFieldState = {
  /** Visible label owned by `Field`. */
  label: string;
  /** Optional hint owned by `Field`. */
  hint?: string;
  /** Optional required state and marker. */
  required?: boolean;
  /** Validation message, or `undefined` when there is no message. */
  errorMessage?: string;
  /** Size shared by the Field label and the DatePicker. */
  fieldSize: DatePickerProps['size'];
  /** DatePicker props with the wrapper-owned value and handlers applied. */
  datePickerProps: Omit<
    DatePickerProps,
    'value' | 'defaultValue' | 'onSelectDate' | 'name' | 'id' | 'required' | 'readOnly'
  > & {
    /** Controlled date value; `null` means no date. */
    value: Date | null;
    /** Commits a selected or parsed date to the form. */
    onSelectDate: (date: Date | null | undefined) => void;
    /** Marks the field touched and calls the caller's blur handler. */
    onBlur: FocusEventHandler<HTMLInputElement>;
    /** Resolved disabled state. */
    disabled: boolean;
  };
  /** Ref merged from the forwarded ref and React Hook Form's field ref. */
  controlRef: Ref<HTMLInputElement>;
};

/**
 * Resolves the DatePicker field props into render state.
 *
 * The form value is normalized to `Date | null`: the primitive can report
 * `undefined` when the date is cleared, while a controlled `null` keeps the
 * input unambiguous. The forwarded ref is merged with React Hook Form's ref.
 *
 * @param props - props from this instance of the field
 * @param ref - ref forwarded by the component shell
 * @returns the state consumed by {@link renderFormDatePickerField}
 */
export function useFormDatePickerField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, DatePickerFieldValue>,
>(
  props: FormDatePickerFieldProps<TFieldValues, TName>,
  ref: Ref<HTMLInputElement>
): FormDatePickerFieldState {
  const { control, name, label, hint, required, onBlur, disabled, ...datePickerProps } = props;

  const { field, errorMessage, isDisabled } = useFormField(control, name, disabled);
  const controlRef = useMergedRefs(ref, field.ref);

  const handleSelectDate = (date: Date | null | undefined): void => {
    field.onChange(date ?? null);
  };

  const handleBlur = mergeCallbacks(onBlur, field.onBlur);

  return {
    label,
    hint,
    required,
    errorMessage,
    fieldSize: datePickerProps.size,
    datePickerProps: {
      ...datePickerProps,
      value: field.value ?? null,
      onSelectDate: handleSelectDate,
      onBlur: handleBlur,
      disabled: isDisabled,
    },
    controlRef,
  };
}
