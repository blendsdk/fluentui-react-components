import type { CheckboxProps } from '@fluentui/react-components';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { CheckboxFieldValue, FormFieldBaseProps } from '../../forms/FormField.types';

/**
 * Props of the checkbox field bound to React Hook Form.
 *
 * The primitive owns the visible label, so `label` is passed to `Checkbox`
 * rather than to `Field`; `Field` adds the hint, validation message, and
 * required state. The form owns the checked value.
 *
 * The wrapper omits `checked`, `defaultChecked`, `onChange`, and `label`; every
 * other `Checkbox` prop passes through, including `disabled`, `labelPosition`,
 * `shape`, and `size`.
 *
 * @typeParam TFieldValues - the shape of the form values
 * @typeParam TName - a boolean or `'mixed'` field path inside `TFieldValues`
 *
 * @example
 * ```tsx
 * <FormCheckboxField
 *     control={form.control}
 *     name="active"
 *     label="Enable feature"
 *     hint="This turns on the feature for your workspace"
 * />
 * ```
 */
export type FormCheckboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, CheckboxFieldValue> = FieldPathByValue<
    TFieldValues,
    CheckboxFieldValue
  >,
> = Omit<
  CheckboxProps,
  'checked' | 'defaultChecked' | 'onChange' | 'label' | 'children' | 'name' | 'value'
> &
  FormFieldBaseProps<TFieldValues, TName>;
