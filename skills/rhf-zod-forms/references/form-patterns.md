# Form patterns

These patterns cover the common application shapes: an inline form, a dialog
form, dependent fields, server validation and the DTO boundary. They use the
same field wrappers and the same React Hook Form control.

## Inline form

```tsx
import { Button } from '@fluentui/react-components';
import { FormTextField } from '@blendsdk/fluentui-react-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, type ProjectFormValues } from './FormSchema';

const defaultValues: ProjectFormValues = {
  name: '',
  description: '',
  budget: undefined,
  status: 'planned',
  startDate: null,
  active: false,
};

type ProjectFormProps = {
  onSave: (values: ProjectFormValues) => Promise<void>;
};

export function ProjectForm({ onSave }: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const submit = form.handleSubmit(async values => {
    await onSave(values);
  });

  return (
    <form onSubmit={submit} noValidate>
      <FormTextField
        control={form.control}
        name="name"
        label="Name"
        hint="Shown in the project list"
        required
      />
      <Button type="submit" appearance="primary" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
```

- `noValidate` turns off the browser's native validation bubble. Zod is the
  validation source, and the field wrappers show its messages.
- `isSubmitting` comes from `form.formState`; do not keep a parallel boolean.
- `handleSubmit` only runs the callback after the resolver accepts the values.

## Dialog form

```tsx
export function ProjectDialog({ open, defaultValues, onOpenChange, onSave }: ProjectDialogProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const submit = form.handleSubmit(async values => {
    try {
      await onSave(values);
      onOpenChange(false);
    } catch (error) {
      mapServerError(form, error);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <form onSubmit={submit} noValidate>
          <DialogBody>
            <DialogTitle>Project</DialogTitle>
            <DialogContent>{/* fields */}</DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button appearance="primary" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
}
```

Rules:

- Reset when the dialog opens, not only when it mounts.
- Keep `defaultValues` stable. Define it outside the component or memoize it;
  a fresh object on every render can make the reset effect run repeatedly.
- Close after a successful save. On failure, keep the dialog open and map the
  error.
- Disable cancel while saving unless the product supports cancellation. A
  disabled cancel button is clearer than a request that finishes after the
  dialog is gone.
- Use `await form.trigger()` only when the product requires validating before
  an intermediate action, such as moving to the next step.

## Dependent fields

Use `watch` or `useWatch` when one field's options or value depend on another.

```tsx
const country = form.watch('country');
const states = statesByCountry[country] ?? [];

useEffect(() => {
  if (!states.some(state => state.value === form.getValues('state'))) {
    form.setValue('state', '', { shouldDirty: true, shouldValidate: false });
  }
}, [country, form, states]);
```

- Prefer `useWatch` when only a small part of the UI needs the value; `watch`
  re-renders the whole form.
- `setValue` with `shouldDirty` marks a dependent change. Decide whether the
  dependent field should validate immediately; `shouldValidate: false` avoids a
  premature error while the user is still choosing.
- If the dependent field is hidden, remove its value or clear it explicitly.
  A hidden required field blocks submit and confuses the user.
- Do not derive the dependent value from `formState` during render. Write it in
  an event handler or an effect.

## Server errors

```tsx
type FieldError = {
  field: keyof ProjectFormValues;
  message: string;
};

function mapServerError(form: UseFormReturn<ProjectFormValues>, error: unknown) {
  if (isFieldError(error)) {
    form.setError(error.field, { type: 'server', message: error.message });
    form.setFocus(error.field);
    return;
  }

  form.setError('root.server', {
    type: 'server',
    message: 'The server could not save the form. Try again.',
  });
}

function isFieldError(error: unknown): error is FieldError {
  return typeof error === 'object' && error !== null && 'field' in error && 'message' in error;
}
```

- `setError` takes a field path and an error object. The field wrapper reads
  `fieldState.error?.message`.
- Root errors do not belong to a field. Render
  `form.formState.errors.root?.server?.message` in a `MessageBar`.
- Clear a stale server error when the user edits the field. A field-level
  server error can remain until the next submit, but it should not survive a
  correction.
- Server validation is authoritative. Client validation improves the
  experience; it does not replace authorization or server-side checks.

## DTO mapping

```ts
type ProjectDto = {
  name: string;
  description: string | null;
  budget: number | null;
  status: 'planned' | 'active' | 'archived';
  startDate: string | null;
  active: boolean;
};

function toProjectDto(values: ProjectFormValues): ProjectDto {
  return {
    name: values.name,
    description: values.description ?? null,
    budget: values.budget ?? null,
    status: values.status,
    startDate: values.startDate?.toISOString() ?? null,
    active: values.active,
  };
}

function fromProjectDto(dto: ProjectDto): ProjectFormValues {
  return {
    name: dto.name,
    description: dto.description ?? '',
    budget: dto.budget ?? undefined,
    status: dto.status,
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    active: dto.active,
  };
}
```

- Write both directions explicitly. The inverse mapper is what makes an edit
  dialog predictable.
- Keep form-only values (search text, confirmation flags, open state) out of
  the DTO.
- Convert `Date` to an agreed wire format. Use ISO strings or epoch values, not
  a locale-formatted display string.
- If the API uses `null` and the field uses `''`, normalize at this boundary.
  Do not make every field choose between two empty representations.
- Validate the DTO again on the server. The form schema is a client contract,
  not a server trust boundary.

## Async defaults

An edit form often loads its values after the component mounts.

```tsx
const form = useForm<ProjectFormValues>({ defaultValues });

useEffect(() => {
  if (project) {
    form.reset(fromProjectDto(project));
  }
}, [form, project]);
```

- Start with a complete default object so the fields remain controlled.
- Reset when the server data arrives.
- Include the loaded entity in the effect dependency list, not only the mount
  event.
- Do not call `reset` on every render; it discards user edits.
