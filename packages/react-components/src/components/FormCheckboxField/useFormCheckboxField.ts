import { mergeCallbacks, useMergedRefs } from '@fluentui/react-components';
import type { CheckboxOnChangeData, CheckboxProps } from '@fluentui/react-components';
import type { ChangeEvent, FocusEventHandler, Ref } from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { CheckboxFieldValue } from '../../forms/FormField.types';
import { useFormField } from '../../forms/useFormField';
import type { FormCheckboxFieldProps } from './FormCheckboxField.types';

/**
 * State that {@link renderFormCheckboxField} renders.
 */
export type FormCheckboxFieldState = {
  /** Visible label owned by the primitive. */
  label: string;
  /** Optional hint owned by `Field`. */
  hint?: string;
  /** Optional required state and marker. */
  required?: boolean;
  /** Validation message, or `undefined` when there is no message. */
  errorMessage?: string;
  /** Checkbox props with the wrapper-owned checked value and handlers applied. */
  checkboxProps: Omit<
    CheckboxProps,
    'checked' | 'defaultChecked' | 'onChange' | 'label' | 'children' | 'name' | 'value'
  > & {
    /** Resolved checked state, including the mixed state. */
    checked: 'mixed' | boolean;
    /** Commits the primitive's checked state to the form. */
    onChange: (event: ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => void;
    /** Marks the field touched and calls the caller's blur handler. */
    onBlur: FocusEventHandler<HTMLInputElement>;
    /** Resolved disabled state. */
    disabled: boolean;
  };
  /** Ref merged from the forwarded ref and React Hook Form's field ref. */
  controlRef: Ref<HTMLInputElement>;
};

/**
 * Resolves the checkbox field props into render state.
 *
 * The value is derived from the form value without a cast: a mixed state is
 * preserved, a literal `true` is checked, and every other value is unchecked.
 *
 * @param props - props from this instance of the field
 * @param ref - ref forwarded by the component shell
 * @returns the state consumed by {@link renderFormCheckboxField}
 */
export function useFormCheckboxField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, CheckboxFieldValue>,
>(
  props: FormCheckboxFieldProps<TFieldValues, TName>,
  ref: Ref<HTMLInputElement>
): FormCheckboxFieldState {
  const { control, name, label, hint, required, onBlur, disabled, ...checkboxProps } = props;

  const { field, errorMessage, isDisabled } = useFormField(control, name, disabled);
  const controlRef = useMergedRefs(ref, field.ref);
  const checked = field.value === 'mixed' ? 'mixed' : field.value === true;

  const handleChange = (
    _event: ChangeEvent<HTMLInputElement>,
    data: CheckboxOnChangeData
  ): void => {
    field.onChange(data.checked);
  };

  const handleBlur = mergeCallbacks(onBlur, field.onBlur);

  return {
    label,
    hint,
    required,
    errorMessage,
    checkboxProps: {
      ...checkboxProps,
      checked,
      onChange: handleChange,
      onBlur: handleBlur,
      disabled: isDisabled,
    },
    controlRef,
  };
}
