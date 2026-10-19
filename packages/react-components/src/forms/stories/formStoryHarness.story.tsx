import { Button, Text } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { DefaultValues, FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

/**
 * Options for the story-only form harness.
 *
 * @typeParam TFieldValues - the shape of the form values
 */
export type StoryFormProps<TFieldValues extends FieldValues> = {
  /** Initial values for the story form. */
  defaultValues: DefaultValues<TFieldValues>;
  /** Optional error to set after mount, for an error story. */
  error?: { name: FieldPath<TFieldValues>; message: string };
  /** Renders the fields from the created form. */
  children: (form: UseFormReturn<TFieldValues>) => ReactElement;
};

/**
 * A small form harness for stories.
 *
 * It creates a real `useForm` instance, renders the fields through a render
 * prop, adds a submit button, and shows the current values. It is a story
 * helper, not a public component, and is excluded from the package build by
 * its `.story.tsx` suffix.
 *
 * @param props - initial values, optional error, and render prop
 * @returns the story form
 */
export function StoryForm<TFieldValues extends FieldValues>({
  defaultValues,
  error,
  children,
}: StoryFormProps<TFieldValues>): ReactElement {
  const form = useForm<TFieldValues>({ defaultValues });
  const values = form.watch();

  useEffect(() => {
    if (error) {
      form.setError(error.name, { type: 'story', message: error.message });
    }
  }, [error, form]);

  return (
    <form
      onSubmit={form.handleSubmit(() => undefined)}
      style={{ display: 'grid', gap: 16, maxWidth: 420 }}
    >
      {children(form)}
      <Button type="submit" appearance="primary">
        Submit
      </Button>
      <Text size={200}>
        <pre style={{ margin: 0 }}>{JSON.stringify(values, null, 2)}</pre>
      </Text>
    </form>
  );
}
