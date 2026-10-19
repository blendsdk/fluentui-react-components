import { mergeCallbacks, useMergedRefs } from '@fluentui/react-components';
import type { DropdownProps, OptionOnSelectData, SelectionEvents } from '@fluentui/react-components';
import type { FocusEventHandler, ReactNode, Ref } from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { SelectionFieldValue } from '../../forms/FormField.types';
import {
  resolveOptionText,
  toSelectedOptions,
} from '../../forms/formFieldValues';
import { useFormField } from '../../forms/useFormField';
import type { FormDropdownFieldProps } from './FormDropdownField.types';

/**
 * State that {@link renderFormDropdownField} renders.
 */
export type FormDropdownFieldState = {
  /** Visible label owned by `Field`. */
  label: string;
  /** Optional hint owned by `Field`. */
  hint?: string;
  /** Optional required state and marker. */
  required?: boolean;
  /** Validation message, or `undefined` when there is no message. */
  errorMessage?: string;
  /** Size shared by the Field label and the Dropdown. */
  fieldSize: DropdownProps['size'];
  /** The `Option` elements supplied by the caller. */
  children: ReactNode;
  /** Dropdown props with the wrapper-owned value and handlers applied. */
  dropdownProps: Omit<
    DropdownProps,
    | 'value'
    | 'defaultValue'
    | 'selectedOptions'
    | 'defaultSelectedOptions'
    | 'onOptionSelect'
    | 'multiselect'
    | 'name'
  > & {
    /** Display text resolved from the stored option value. */
    value: string;
    /** Selected option values, derived from the form value. */
    selectedOptions: string[];
    /** Commits the selected option value to the form. */
    onOptionSelect: (event: SelectionEvents, data: OptionOnSelectData) => void;
    /** Marks the field touched and calls the caller's blur handler. */
    onBlur: FocusEventHandler<HTMLButtonElement>;
    /** Resolved disabled state. */
    disabled: boolean;
  };
  /** Ref merged from the forwarded ref and React Hook Form's field ref. */
  controlRef: Ref<HTMLButtonElement>;
};

/**
 * Resolves the Dropdown field props into render state.
 *
 * The form stores the option value while the primitive displays text. The
 * display text comes from `getOptionText`, with the raw value as the fallback.
 * The forwarded ref is merged with React Hook Form's ref on the trigger.
 *
 * @param props - props from this instance of the field
 * @param ref - ref forwarded by the component shell
 * @returns the state consumed by {@link renderFormDropdownField}
 */
export function useFormDropdownField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue>,
>(
  props: FormDropdownFieldProps<TFieldValues, TName>,
  ref: Ref<HTMLButtonElement>
): FormDropdownFieldState {
  const {
    control,
    name,
    label,
    hint,
    required,
    getOptionText,
    onBlur,
    disabled,
    children,
    ...dropdownProps
  } = props;

  const { field, errorMessage, isDisabled } = useFormField(control, name, disabled);
  const controlRef = useMergedRefs(ref, field.ref);

  const handleOptionSelect = (_event: SelectionEvents, data: OptionOnSelectData): void => {
    field.onChange(data.optionValue ?? '');
  };

  const handleBlur = mergeCallbacks(onBlur, field.onBlur);

  return {
    label,
    hint,
    required,
    errorMessage,
    fieldSize: dropdownProps.size,
    children,
    dropdownProps: {
      ...dropdownProps,
      value: resolveOptionText(field.value, getOptionText),
      selectedOptions: toSelectedOptions(field.value),
      onOptionSelect: handleOptionSelect,
      onBlur: handleBlur,
      disabled: isDisabled,
    },
    controlRef,
  };
}
