import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { projectSchema, type ProjectFormValues } from './FormSchema';

/**
 * Creates the React Hook Form controller for the project form.
 *
 * The application owns the schema and the default values. If the schema later
 * gains transforms, change the generics to
 * `useForm<ProjectFormInput, unknown, ProjectFormOutput>` and submit the
 * resolver's output, not the raw field values.
 *
 * @param defaultValues - complete values for a new or loaded project
 * @returns the controller shared by the fields and the submit handler
 */
export function useProjectForm(
  defaultValues: ProjectFormValues
): UseFormReturn<ProjectFormValues> {
  return useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
}
