import type { Control, FieldPath, FieldValues } from 'react-hook-form';

/**
 * Props every form field wrapper shares.
 *
 * The application owns the form engine: it creates the control with
 * `useForm`, supplies the validation resolver, and maps the values to its
 * API. The wrapper only binds the control to a Fluent UI primitive.
 *
 * @typeParam TFieldValues - the shape of the form values
 * @typeParam TName - the field path inside `TFieldValues`
 */
export type FormFieldBaseProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  /** React Hook Form control returned by `useForm`. */
  control: Control<TFieldValues>;

  /**
   * Type-checked field path. It is the single source of the value and of the
   * validation error rendered by the wrapper.
   */
  name: TName;

  /** Visible label. The wrapper decides whether `Field` or the primitive owns it. */
  label: string;

  /** Optional helper text, associated with the control by `Field`. */
  hint?: string;

  /**
   * Semantic required state. It marks the control and exposes the required
   * state to assistive technology; it does not validate the field. Validation
   * belongs to the application's schema.
   */
  required?: boolean;
};

/**
 * Values a text-like field wrapper can bind.
 *
 * `null` and `undefined` represent a cleared parsed value. A string field
 * normally uses the empty string instead.
 */
export type TextFieldValue = string | number | null | undefined;

/** Values a single-select field wrapper can bind. */
export type SelectionFieldValue = string | undefined;

/** Values a checkbox field wrapper can bind. */
export type CheckboxFieldValue = boolean | 'mixed' | undefined;

/** Values a switch field wrapper can bind. */
export type SwitchFieldValue = boolean | undefined;

/** Values a date picker field wrapper can bind. */
export type DatePickerFieldValue = Date | null | undefined;
