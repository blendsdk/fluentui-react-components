import { mergeCallbacks, useMergedRefs } from '@fluentui/react-components';
import type { RadioGroupOnChangeData, RadioGroupProps } from '@fluentui/react-components';
import type { FocusEventHandler, FormEvent, ReactNode, Ref } from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { SelectionFieldValue } from '../../forms/FormField.types';
import { useFormField } from '../../forms/useFormField';
import type { FormRadioGroupFieldProps } from './FormRadioGroupField.types';

/**
 * State that {@link renderFormRadioGroupField} renders.
 */
export type FormRadioGroupFieldState = {
  /** Visible group label owned by `Field`. */
  label: string;
  /** Optional hint owned by `Field`. */
  hint?: string;
  /** Optional required state and marker. */
  required?: boolean;
  /** Validation message, or `undefined` when there is no message. */
  errorMessage?: string;
  /** The `Radio` elements supplied by the caller. */
  children: ReactNode;
  /** Radio group props with the wrapper-owned value and handlers applied. */
  groupProps: Omit<RadioGroupProps, 'value' | 'defaultValue' | 'onChange' | 'name' | 'required'> & {
    /** Selected radio value, or the empty string when nothing is selected. */
    value: string;
    /** Commits the selected radio value to the form. */
    onChange: (event: FormEvent<HTMLDivElement>, data: RadioGroupOnChangeData) => void;
    /** Marks the field touched and calls the caller's blur handler. */
    onBlur: FocusEventHandler<HTMLDivElement>;
    /** Resolved disabled state. */
    disabled: boolean;
  };
  /** Ref merged from the forwarded ref and React Hook Form's field ref. */
  controlRef: Ref<HTMLDivElement>;
};

/**
 * Resolves the radio group field props into render state.
 *
 * The empty string represents no selection because `RadioGroup` uses string
 * values. The group root receives the ref; React Hook Form's focus-on-error
 * cannot focus a plain `div`, so the group is announced and its error is
 * associated rather than focused.
 *
 * @param props - props from this instance of the field
 * @param ref - ref forwarded by the component shell
 * @returns the state consumed by {@link renderFormRadioGroupField}
 */
export function useFormRadioGroupField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue>,
>(
  props: FormRadioGroupFieldProps<TFieldValues, TName>,
  ref: Ref<HTMLDivElement>
): FormRadioGroupFieldState {
  const { control, name, label, hint, required, onBlur, disabled, children, ...groupProps } = props;

  const { field, errorMessage, isDisabled } = useFormField(control, name, disabled);
  const controlRef = useMergedRefs(ref, field.ref);

  const handleChange = (_event: FormEvent<HTMLDivElement>, data: RadioGroupOnChangeData): void => {
    field.onChange(data.value);
  };

  const handleBlur = mergeCallbacks(onBlur, field.onBlur);

  return {
    label,
    hint,
    required,
    errorMessage,
    children,
    groupProps: {
      ...groupProps,
      value: field.value ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
      disabled: isDisabled,
    },
    controlRef,
  };
}
