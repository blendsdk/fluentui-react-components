import { mergeCallbacks, useMergedRefs } from '@fluentui/react-components';
import type {
  ComboboxProps,
  OptionOnSelectData,
  SelectionEvents,
} from '@fluentui/react-components';
import type { ChangeEvent, FocusEventHandler, ReactNode, Ref } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { SelectionFieldValue } from '../../forms/FormField.types';
import { resolveOptionText, toSelectedOptions } from '../../forms/formFieldValues';
import { useFormField } from '../../forms/useFormField';
import type { FormComboboxFieldProps } from './FormComboboxField.types';

/**
 * State that {@link renderFormComboboxField} renders.
 */
export type FormComboboxFieldState = {
  /** Visible label owned by `Field`. */
  label: string;
  /** Optional hint owned by `Field`. */
  hint?: string;
  /** Optional required state and marker. */
  required?: boolean;
  /** Validation message, or `undefined` when there is no message. */
  errorMessage?: string;
  /** Size shared by the Field label and the Combobox. */
  fieldSize: ComboboxProps['size'];
  /** The `Option` elements supplied by the caller. */
  children: ReactNode;
  /** Combobox props with the wrapper-owned value and handlers applied. */
  comboboxProps: Omit<
    ComboboxProps,
    | 'value'
    | 'defaultValue'
    | 'selectedOptions'
    | 'defaultSelectedOptions'
    | 'onOptionSelect'
    | 'onInput'
    | 'onChange'
    | 'multiselect'
    | 'freeform'
    | 'name'
  > & {
    /** Local input text while the user types or filters. */
    value: string;
    /** Selected option values, derived from the form value. */
    selectedOptions: string[];
    /** Updates the local text without committing a value. */
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** Commits the selected option value to the form. */
    onOptionSelect: (event: SelectionEvents, data: OptionOnSelectData) => void;
    /** Marks the field touched, reverts uncommitted text, and calls the caller's handler. */
    onBlur: FocusEventHandler<HTMLInputElement>;
    /** Resolved disabled state. */
    disabled: boolean;
  };
  /** Ref merged from the forwarded ref and React Hook Form's field ref. */
  controlRef: Ref<HTMLInputElement>;
};

/**
 * Resolves the Combobox field props into render state.
 *
 * The input text is local presentation state: typing filters the list but
 * does not change the form value. Selecting an option commits its value and
 * sets the text to its display text. Blur reverts uncommitted text to the
 * selected value's text.
 *
 * @param props - props from this instance of the field
 * @param ref - ref forwarded by the component shell
 * @returns the state consumed by {@link renderFormComboboxField}
 */
export function useFormComboboxField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue>,
>(
  props: FormComboboxFieldProps<TFieldValues, TName>,
  ref: Ref<HTMLInputElement>
): FormComboboxFieldState {
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
    ...comboboxProps
  } = props;

  const { field, errorMessage, isDisabled } = useFormField(control, name, disabled);
  const controlRef = useMergedRefs(ref, field.ref);
  const [inputText, setInputText] = useState(() =>
    resolveOptionText(field.value, getOptionText)
  );
  const lastEmitted = useRef<string>(String(field.value ?? ''));

  useLayoutEffect(() => {
    const current = String(field.value ?? '');
    if (current !== lastEmitted.current) {
      setInputText(resolveOptionText(field.value, getOptionText));
      lastEmitted.current = current;
    }
  }, [field.value, getOptionText]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setInputText(event.target.value);
  };

  const handleOptionSelect = (event: SelectionEvents, data: OptionOnSelectData): void => {
    // Fluent clears a single-select value when typed text stops matching an
    // option. A selection-only field keeps the stored value until an actual
    // option or the clear button is activated, so ignore those change-driven
    // clears. A click with no option value is the clear affordance.
    if (data.optionValue === undefined && event.type !== 'click') {
      return;
    }

    const next = data.optionValue ?? '';
    lastEmitted.current = next;
    field.onChange(next);
    setInputText(data.optionText ?? resolveOptionText(next, getOptionText));
  };

  const handleBlur = mergeCallbacks(onBlur, () => {
    field.onBlur();
    setInputText(resolveOptionText(field.value, getOptionText));
  });

  return {
    label,
    hint,
    required,
    errorMessage,
    fieldSize: comboboxProps.size,
    children,
    comboboxProps: {
      ...comboboxProps,
      value: inputText,
      selectedOptions: toSelectedOptions(field.value),
      onChange: handleChange,
      onOptionSelect: handleOptionSelect,
      onBlur: handleBlur,
      disabled: isDisabled,
    },
    controlRef,
  };
}
