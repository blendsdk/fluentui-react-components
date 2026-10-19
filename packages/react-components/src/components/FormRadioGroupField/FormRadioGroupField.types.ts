import type { RadioGroupProps } from '@fluentui/react-components';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { FormFieldBaseProps } from '../../forms/FormField.types';

/**
 * Props of the radio group field bound to React Hook Form.
 *
 * `Field` owns the group label, hint, validation message, and required state;
 * each `Radio` child keeps its own label. Pass `Radio` elements as children.
 *
 * The wrapper omits `value`, `defaultValue`, `onChange`, `name`, and
 * `required`; every other `RadioGroup` prop passes through, including
 * `disabled` and `layout`.
 *
 * @typeParam TFieldValues - the shape of the form values
 * @typeParam TName - a string field path inside `TFieldValues`
 *
 * @example
 * ```tsx
 * <FormRadioGroupField control={form.control} name="plan" label="Plan">
 *     <Radio value="free" label="Free" />
 *     <Radio value="pro" label="Pro" />
 * </FormRadioGroupField>
 * ```
 */
export type FormRadioGroupFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, string | undefined> = FieldPathByValue<
    TFieldValues,
    string | undefined
  >,
> = Omit<RadioGroupProps, 'value' | 'defaultValue' | 'onChange' | 'name' | 'required'> &
  FormFieldBaseProps<TFieldValues, TName>;
