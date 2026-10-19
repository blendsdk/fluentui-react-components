import * as React from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { SelectionFieldValue } from '../../forms/FormField.types';
import type { FormRadioGroupFieldProps } from './FormRadioGroupField.types';
import { renderFormRadioGroupField } from './renderFormRadioGroupField';
import { useFormRadioGroupField } from './useFormRadioGroupField';

const FormRadioGroupFieldBase = <
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue>,
>(
  props: FormRadioGroupFieldProps<TFieldValues, TName>,
  ref: React.Ref<HTMLDivElement>
) => {
  const state = useFormRadioGroupField(props, ref);

  return renderFormRadioGroupField(state);
};

FormRadioGroupFieldBase.displayName = 'FormRadioGroupField';

/**
 * Radio group bound to a React Hook Form field.
 *
 * `Field` owns the group label, hint, required marker, and validation
 * message. Each `Radio` child keeps its own label. The form value is the
 * selected radio's string value; an empty string means no selection.
 *
 * React Hook Form's focus-on-error cannot focus the group `div`; the error is
 * associated and announced instead.
 *
 * @example
 * ```tsx
 * <FormRadioGroupField control={form.control} name="plan" label="Plan">
 *     <Radio value="free" label="Free" />
 *     <Radio value="pro" label="Pro" />
 * </FormRadioGroupField>
 * ```
 */
export const FormRadioGroupField = React.forwardRef(FormRadioGroupFieldBase) as <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue> = FieldPathByValue<
    TFieldValues,
    SelectionFieldValue
  >,
>(
  props: FormRadioGroupFieldProps<TFieldValues, TName> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement;
