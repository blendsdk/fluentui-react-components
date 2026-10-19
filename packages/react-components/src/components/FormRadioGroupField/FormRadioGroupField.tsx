import * as React from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { FormRadioGroupFieldProps } from './FormRadioGroupField.types';
import { renderFormRadioGroupField } from './renderFormRadioGroupField';
import { useFormRadioGroupField } from './useFormRadioGroupField';

const FormRadioGroupFieldBase = <
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string | undefined>,
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
 * selected radio's string value.
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
  TName extends FieldPathByValue<TFieldValues, string | undefined> = FieldPathByValue<
    TFieldValues,
    string | undefined
  >,
>(
  props: FormRadioGroupFieldProps<TFieldValues, TName> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement;
