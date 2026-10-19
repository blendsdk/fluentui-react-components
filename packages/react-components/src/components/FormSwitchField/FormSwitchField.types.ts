import type { SwitchProps } from '@fluentui/react-components';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import type { FormFieldBaseProps, SwitchFieldValue } from '../../forms/FormField.types';

/**
 * Props of the switch field bound to React Hook Form.
 *
 * The primitive owns the visible label, so `label` is passed to `Switch`
 * rather than to `Field`; `Field` adds the hint, validation message, and
 * required state. The form owns the checked value.
 *
 * The wrapper omits `checked`, `defaultChecked`, `onChange`, `label`, `name`,
 * and `value`; every other `Switch` prop passes through, including `disabled`,
 * `disabledFocusable`, `labelPosition`, and `size`.
 *
 * @typeParam TFieldValues - the shape of the form values
 * @typeParam TName - a boolean field path inside `TFieldValues`
 *
 * @example
 * ```tsx
 * <FormSwitchField
 *     control={form.control}
 *     name="enabled"
 *     label="Enable feature"
 * />
 * ```
 */
export type FormSwitchFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, SwitchFieldValue> = FieldPathByValue<
    TFieldValues,
    SwitchFieldValue
  >,
> = Omit<SwitchProps, 'checked' | 'defaultChecked' | 'onChange' | 'label' | 'name' | 'value'> &
  FormFieldBaseProps<TFieldValues, TName>;
