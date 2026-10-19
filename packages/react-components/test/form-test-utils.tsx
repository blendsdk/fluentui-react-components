import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import type { FieldValues, UseFormProps, UseFormReturn } from 'react-hook-form';

/**
 * Result of {@link renderWithForm}.
 *
 * The form instance is returned so a test can read values, reset the form,
 * or set a server error after the field is rendered.
 *
 * @typeParam TFieldValues - the shape of the form values
 */
export type RenderedForm<TFieldValues extends FieldValues> = {
  /** The React Hook Form instance created by the harness. */
  form: UseFormReturn<TFieldValues>;
} & ReturnType<typeof render>;

/**
 * Renders a form field inside a real `useForm` instance and `FluentProvider`.
 *
 * The helper mirrors how an application mounts a field: the form owns the
 * control and the provider supplies the theme. A render prop receives the
 * form so the test can place one or more fields with the right concrete
 * `name` types. The form is exposed on the result for value assertions and
 * `reset`/`setValue`/`setError` calls.
 *
 * Assigning the form during render is safe in this test-only harness; the
 * component renders once and the reference is stable for the test.
 *
 * @param options - `useForm` options, usually `{ defaultValues }`
 * @param renderField - renders the field tree from the created form
 * @returns the form and the Testing Library render result
 */
export function renderWithForm<TFieldValues extends FieldValues>(
  options: UseFormProps<TFieldValues>,
  renderField: (form: UseFormReturn<TFieldValues>) => ReactElement
): RenderedForm<TFieldValues> {
  let form!: UseFormReturn<TFieldValues>;

  function Harness() {
    form = useForm<TFieldValues>(options);

    return <FluentProvider theme={webLightTheme}>{renderField(form)}</FluentProvider>;
  }

  const view = render(<Harness />);

  return { form, ...view };
}
