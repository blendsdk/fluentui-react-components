import { mergeCallbacks, useMergedRefs } from '@fluentui/react-components';
import type { SwitchOnChangeData, SwitchProps } from '@fluentui/react-components';
import type { ChangeEvent, FocusEventHandler, Ref } from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { SwitchFieldValue } from '../../forms/FormField.types';
import { useFormField } from '../../forms/useFormField';
import type { FormSwitchFieldProps } from './FormSwitchField.types';

/**
 * State that {@link renderFormSwitchField} renders.
 */
export type FormSwitchFieldState = {
  /** Visible label owned by the primitive. */
  label: string;
  /** Optional hint owned by `Field`. */
  hint?: string;
  /** Optional required state and marker. */
  required?: boolean;
  /** Validation message, or `undefined` when there is no message. */
  errorMessage?: string;
  /** Switch props with the wrapper-owned checked value and handlers applied. */
  switchProps: Omit<
    SwitchProps,
    'checked' | 'defaultChecked' | 'onChange' | 'label' | 'name' | 'value'
  > & {
    /** Resolved checked state. */
    checked: boolean;
    /** Commits the primitive's checked state to the form. */
    onChange: (event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => void;
    /** Marks the field touched and calls the caller's blur handler. */
    onBlur: FocusEventHandler<HTMLInputElement>;
    /** Resolved disabled state. */
    disabled: boolean;
  };
  /** Ref merged from the forwarded ref and React Hook Form's field ref. */
  controlRef: Ref<HTMLInputElement>;
};

/**
 * Resolves the switch field props into render state.
 *
 * Only a literal `true` is checked; any other form value is off. The value is
 * derived without a cast and the form value stays in React Hook Form.
 *
 * @param props - props from this instance of the field
 * @param ref - ref forwarded by the component shell
 * @returns the state consumed by {@link renderFormSwitchField}
 */
export function useFormSwitchField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, SwitchFieldValue>,
>(
  props: FormSwitchFieldProps<TFieldValues, TName>,
  ref: Ref<HTMLInputElement>
): FormSwitchFieldState {
  const { control, name, label, hint, required, onBlur, disabled, ...switchProps } = props;

  const { field, errorMessage, isDisabled } = useFormField(control, name, disabled);
  const controlRef = useMergedRefs(ref, field.ref);

  const handleChange = (
    _event: ChangeEvent<HTMLInputElement>,
    data: SwitchOnChangeData
  ): void => {
    field.onChange(data.checked);
  };

  const handleBlur = mergeCallbacks(onBlur, field.onBlur);

  return {
    label,
    hint,
    required,
    errorMessage,
    switchProps: {
      ...switchProps,
      checked: field.value === true,
      onChange: handleChange,
      onBlur: handleBlur,
      disabled: isDisabled,
    },
    controlRef,
  };
}
