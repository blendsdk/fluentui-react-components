import { mergeCallbacks, useMergedRefs } from '@fluentui/react-components';
import type { InputOnChangeData, InputProps } from '@fluentui/react-components';
import type { ChangeEvent, FocusEventHandler, Ref } from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { TextFieldValue } from '../../forms/FormField.types';
import { useFormField } from '../../forms/useFormField';
import { useTextValueState } from '../../forms/useTextValueState';
import type { FormTextFieldProps } from './FormTextField.types';

/**
 * State that {@link renderFormTextField} renders.
 */
export type FormTextFieldState = {
  /** Visible label owned by `Field`. */
  label: string;
  /** Optional hint owned by `Field`. */
  hint?: string;
  /** Optional required marker and native required state. */
  required?: boolean;
  /** Validation message, or `undefined` when there is no message. */
  errorMessage?: string;
  /** Size shared by the Field label and the Input. */
  fieldSize: InputProps['size'];
  /** Input props with the wrapper-owned value and handlers applied. */
  inputProps: Omit<
    InputProps,
    'value' | 'defaultValue' | 'onChange' | 'name' | 'children'
  > & {
    /** Raw text shown by the input. */
    value: string;
    /** Commits the input's string value to the form. */
    onChange: (event: ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void;
    /** Marks the field touched and calls the caller's blur handler. */
    onBlur: FocusEventHandler<HTMLInputElement>;
    /** Resolved disabled state. */
    disabled: boolean;
  };
  /** Ref merged from the forwarded ref and React Hook Form's field ref. */
  controlRef: Ref<HTMLInputElement>;
};

/**
 * Resolves the text field props into render state.
 *
 * The hook keeps the form value in React Hook Form and the raw keystrokes in
 * the text-value helper. It also merges the forwarded ref with React Hook
 * Form's ref so focus management keeps working.
 *
 * @param props - props from this instance of the field
 * @param ref - ref forwarded by the component shell
 * @returns the state consumed by {@link renderFormTextField}
 */
export function useFormTextField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, TextFieldValue>,
>(props: FormTextFieldProps<TFieldValues, TName>, ref: Ref<HTMLInputElement>): FormTextFieldState {
  const { control, name, label, hint, required, parse, onBlur, disabled, ...inputProps } = props;

  const { field, errorMessage, isDisabled } = useFormField(control, name, disabled);
  const controlRef = useMergedRefs(ref, field.ref);
  const { text, commit } = useTextValueState(field.value, parse, field.onChange);

  const handleChange = (
    _event: ChangeEvent<HTMLInputElement>,
    data: InputOnChangeData
  ): void => {
    commit(data.value);
  };

  const handleBlur = mergeCallbacks(onBlur, field.onBlur);

  return {
    label,
    hint,
    required,
    errorMessage,
    fieldSize: inputProps.size,
    inputProps: {
      ...inputProps,
      value: text,
      onChange: handleChange,
      onBlur: handleBlur,
      disabled: isDisabled,
    },
    controlRef,
  };
}
