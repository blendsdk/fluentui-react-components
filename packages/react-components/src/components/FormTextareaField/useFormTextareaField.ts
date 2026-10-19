import { mergeCallbacks, useMergedRefs } from '@fluentui/react-components';
import type { TextareaOnChangeData, TextareaProps } from '@fluentui/react-components';
import type { ChangeEvent, FocusEventHandler, Ref } from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { TextFieldValue } from '../../forms/FormField.types';
import { useFormField } from '../../forms/useFormField';
import { useTextValueState } from '../../forms/useTextValueState';
import type { FormTextareaFieldProps } from './FormTextareaField.types';

/**
 * State that {@link renderFormTextareaField} renders.
 */
export type FormTextareaFieldState = {
  /** Visible label owned by `Field`. */
  label: string;
  /** Optional hint owned by `Field`. */
  hint?: string;
  /** Optional required marker and native required state. */
  required?: boolean;
  /** Validation message, or `undefined` when there is no message. */
  errorMessage?: string;
  /** Size shared by the Field label and the Textarea. */
  fieldSize: TextareaProps['size'];
  /** Textarea props with the wrapper-owned value and handlers applied. */
  textareaProps: Omit<
    TextareaProps,
    'value' | 'defaultValue' | 'onChange' | 'name' | 'children'
  > & {
    /** Raw text shown by the textarea. */
    value: string;
    /** Commits the textarea's string value to the form. */
    onChange: (event: ChangeEvent<HTMLTextAreaElement>, data: TextareaOnChangeData) => void;
    /** Marks the field touched and calls the caller's blur handler. */
    onBlur: FocusEventHandler<HTMLTextAreaElement>;
    /** Resolved disabled state. */
    disabled: boolean;
  };
  /** Ref merged from the forwarded ref and React Hook Form's field ref. */
  controlRef: Ref<HTMLTextAreaElement>;
};

/**
 * Resolves the textarea field props into render state.
 *
 * The form value stays in React Hook Form and the raw keystrokes stay in the
 * text-value helper. The forwarded ref is merged with React Hook Form's ref
 * so focus management keeps working.
 *
 * @param props - props from this instance of the field
 * @param ref - ref forwarded by the component shell
 * @returns the state consumed by {@link renderFormTextareaField}
 */
export function useFormTextareaField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, TextFieldValue>,
>(
  props: FormTextareaFieldProps<TFieldValues, TName>,
  ref: Ref<HTMLTextAreaElement>
): FormTextareaFieldState {
  const { control, name, label, hint, required, parse, onBlur, disabled, ...textareaProps } = props;

  const { field, errorMessage, isDisabled } = useFormField(control, name, disabled);
  const controlRef = useMergedRefs(ref, field.ref);
  const { text, commit } = useTextValueState(field.value, parse, field.onChange);

  const handleChange = (
    _event: ChangeEvent<HTMLTextAreaElement>,
    data: TextareaOnChangeData
  ): void => {
    commit(data.value);
  };

  const handleBlur = mergeCallbacks(onBlur, field.onBlur);

  return {
    label,
    hint,
    required,
    errorMessage,
    fieldSize: textareaProps.size,
    textareaProps: {
      ...textareaProps,
      value: text,
      onChange: handleChange,
      onBlur: handleBlur,
      disabled: isDisabled,
    },
    controlRef,
  };
}
