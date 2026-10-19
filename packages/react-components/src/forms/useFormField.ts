import { useController } from 'react-hook-form';
import type {
  Control,
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';

/**
 * Controller state a field wrapper needs from React Hook Form.
 *
 * The wrapper re-exposes the controller's field and error state; it never
 * keeps a second copy of the form value.
 *
 * @typeParam TFieldValues - the shape of the form values
 * @typeParam TName - the field path inside `TFieldValues`
 */
export type FormFieldController<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  /** Controller field: value, change handler, blur handler, name, ref, disabled. */
  field: ControllerRenderProps<TFieldValues, TName>;
  /** Validation and touched state for the field. */
  fieldState: ControllerFieldState;
  /** Validation message, or `undefined` when there is no message. */
  errorMessage: string | undefined;
  /** True when the prop or the form-level state disables the control. */
  isDisabled: boolean;
};

/**
 * Binds one field to React Hook Form with `useController`.
 *
 * The hook has two jobs: it keeps the controller wiring in one place, and it
 * resolves the two values every wrapper renders — the validation message and
 * the effective disabled state. The form value itself stays in React Hook
 * Form.
 *
 * A form-level `disabled` state applies unless the field passes an explicit
 * `disabled` prop. An empty error message is treated as no message so
 * `Field` does not render an empty alert.
 *
 * @param control - React Hook Form control
 * @param name - field path
 * @param disabled - optional field-level disabled state
 * @returns the controller field, its state, the message, and the disabled state
 */
export function useFormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(
  control: Control<TFieldValues>,
  name: TName,
  disabled?: boolean
): FormFieldController<TFieldValues, TName> {
  const { field, fieldState } = useController({ control, name, disabled });

  return {
    field,
    fieldState,
    errorMessage: fieldState.error?.message || undefined,
    isDisabled: disabled ?? field.disabled ?? false,
  };
}
