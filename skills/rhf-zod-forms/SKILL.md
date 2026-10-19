---
name: rhf-zod-forms
description: Compose application forms with React Hook Form 7, Zod 4, @hookform/resolvers/zod, and the @blendsdk/fluentui-react-components Form*Field wrappers. Use when building or changing a Fluent UI v9 form, dialog, validation flow, server-error mapping, or form-to-DTO boundary.
---

# React Hook Form + Zod forms

This skill is the application-side form workflow for Fluent UI v9. It combines
the `Form*Field` components from `@blendsdk/fluentui-react-components` with
React Hook Form 7 and Zod 4. The component package owns the field binding; the
application owns the schema, the form lifecycle, the API payload and the
business rules.

## When to use this skill

Use it when you are:

- building a new application form, settings page or dialog,
- adding or changing validation on an existing form,
- mapping server validation errors onto fields,
- separating form values from an API DTO,
- reviewing a form for accessibility, reset behavior or async submit safety.

Do **not** use it to:

- build or change a component in the component library — use the
  `fluentui-components` skill for that,
- add a form engine, schema or resolver to the component package,
- design a page layout or navigation — use the Fluent UI design guidance.

## Hard boundaries

1. The application owns `useForm`, the Zod schema, `zodResolver`, default
   values, DTO mapping and business rules.
2. The component package owns the field wrappers. Do not re-implement a
   `Form*Field` with a raw Fluent primitive in application code.
3. `fieldState.error?.message` is the single field-error source. Do not invent
   a second error object or parse error strings.
4. Business rules, API DTOs and app-specific conventions stay in the
   application or an app-local skill. They do not belong in this shared skill.
5. Do not use Formik, Yup or Fluent UI v8.

## Stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| UI         | React 19 and Fluent UI v9                                     |
| Fields     | `Form*Field` from `@blendsdk/fluentui-react-components`       |
| Form state | React Hook Form 7                                             |
| Validation | Zod 4                                                         |
| Resolver   | `@hookform/resolvers/zod`                                     |
| Date input | `FormDatePickerField` and `@fluentui/react-datepicker-compat` |

`zod` and `@hookform/resolvers` are application dependencies. The component
package declares React Hook Form as a peer, not Zod.

## Routing map

| Topic                                           | Read                                                       |
| ----------------------------------------------- | ---------------------------------------------------------- |
| Field props and values                          | [references/field-api.md](references/field-api.md)         |
| Inline, dialog, dependent fields, server errors | [references/form-patterns.md](references/form-patterns.md) |
| Test strategy                                   | [references/testing.md](references/testing.md)             |
| Common failures                                 | [references/pitfalls.md](references/pitfalls.md)           |
| Starting files                                  | [templates/](templates/)                                   |

## Workflow

Follow the steps in order. Settle the contract before writing JSX.

1. **Model the form values.** List every field, its type, whether it is
   required, and its default. Decide which values are form-only and which
   belong in the API DTO.
2. **Write the Zod schema.** Use one object schema. Add field messages at the
   schema edge, not as scattered checks in the component.
3. **Infer the type.** Use `z.infer<typeof schema>` for the form values. When
   the schema transforms input, use `z.input` for the form and `z.output` for
   the submitted value.
4. **Choose the field wrappers.** Use the wrapper that matches the value type:
   text, textarea, checkbox, switch, radio group, dropdown, combobox or date
   picker.
5. **Create the form.** Call `useForm` with `zodResolver(schema)`,
   `defaultValues`, `mode` and `reValidateMode`. Do not duplicate field state
   in `useState`.
6. **Compose the fields.** Pass `control` and a type-checked `name`; pass
   `label`, `hint` and `required` through the wrapper. Keep labels and messages
   translated.
7. **Handle submit.** Use `handleSubmit`, show `isSubmitting`, prevent double
   submits, and decide whether the dialog closes before or after the request.
8. **Map server errors.** Use `setError` for field errors and `root.server` for
   a form-level error. Clear stale server errors when the field changes.
9. **Map the DTO.** Convert the validated form values to the API payload in one
   explicit function. Do not send form-only fields.
10. **Test and verify.** Add schema tests, interaction tests, accessibility
    assertions and a server-error test. Run the application's verification
    command.

## Schema and types

A schema is the source of truth for both runtime validation and the form value
type.

```ts
import * as z from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, { error: 'Name is required' }).max(120),
  description: z.string().max(2000).optional(),
  budget: z.number().nonnegative().optional(),
  status: z.enum(['planned', 'active', 'archived']),
  startDate: z.date().nullable(),
  active: z.boolean(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
```

Conventions:

- Use `optional()` when the key may be absent or `undefined`; use `nullable()`
  when the API and the field both use `null`.
- A required selection field should use the empty string as its default, not
  `undefined`. The field wrappers treat `''` as "no selection".
- A required date field uses `Date`; an empty date is `null`.
- Keep transforms (trim, uppercase, number coercion) out of field values unless
  the field wrapper already produces the target type. Map in the DTO instead.
- Put the message next to the rule it belongs to. The field wrapper renders the
  message without any extra mapping.

When the schema has different input and output types, make the difference
explicit:

```ts
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const form = useForm<FormInput, unknown, FormOutput>({
  resolver: zodResolver(schema),
});
```

## Form setup

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormTextField } from '@blendsdk/fluentui-react-components';
import { projectSchema, type ProjectFormValues } from './FormSchema';

const defaultValues: ProjectFormValues = {
  name: '',
  description: '',
  budget: undefined,
  status: 'planned',
  startDate: null,
  active: false,
};

export function ProjectForm() {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  return (
    <form onSubmit={form.handleSubmit(values => save(values))} noValidate>
      <FormTextField control={form.control} name="name" label="Name" required />
      <FormTextField
        control={form.control}
        name="budget"
        label="Budget"
        hint="Optional; whole units"
        parse={value => (value === '' ? undefined : Number(value))}
      />
    </form>
  );
}
```

- `mode: 'onSubmit'` keeps a new form calm until the first submit;
  `reValidateMode: 'onChange'` gives fast feedback afterwards. Choose a stricter
  mode only when the product needs it.
- `defaultValues` must satisfy the schema. An optional numeric field can start
  as `undefined`; a selection field starts as `''`; a date starts as `null`.
- Field wrappers call `useController` themselves. Do not call `useController`
  again for the same field.
- `required` is a semantic marker. It does not run validation; the resolver
  does.

## Field composition

| Value                 | Component                 | Default form value |
| --------------------- | ------------------------- | ------------------ |
| `string`              | `FormTextField`           | `''`               |
| `string`              | `FormTextareaField`       | `''`               |
| `number`, `undefined` | `FormTextField` + `parse` | `undefined`        |
| `boolean`             | `FormCheckboxField`       | `false`            |
| `boolean`             | `FormSwitchField`         | `false`            |
| `'mixed'`             | `FormCheckboxField`       | `false`            |
| `string`              | `FormRadioGroupField`     | `''`               |
| `string`              | `FormDropdownField`       | `''`               |
| `string`              | `FormComboboxField`       | `''`               |
| `Date \| null`        | `FormDatePickerField`     | `null`             |

Field wrapper rules:

- `control` and `name` are required. `name` is checked against the form values.
- `label` is required. `hint` and `required` are optional.
- Text fields support `readOnly`; the other wrappers do not claim it.
- Checkbox and Switch render their own label; use `Field` only through the
  wrapper for the hint and validation message.
- Dropdown and Combobox store the option value, not its text. Pass
  `getOptionText` when they differ.
- For a keyboard-accessible Combobox clear, include an option with an empty
  value. Fluent's clear affordance is pointer-only.
- `FormDatePickerField` stores a `Date | null`; set `allowTextInput` to accept
  typed dates and pass `formatDate` and `parseDateFromString` when the format is
  application-specific.

## Dialog lifecycle

A dialog form has three extra problems: resetting on open, closing only after a
successful submit, and protecting the close action while saving.

```tsx
useEffect(() => {
  if (open) {
    form.reset(defaultValues);
  }
}, [open, defaultValues, form]);

const submit = form.handleSubmit(async values => {
  await save(values);
  onOpenChange(false);
});
```

- `defaultValues` must be stable. Memoize it in the parent or define it outside
  the component; an inline object on every render makes `reset` loop.
- Reset on open, not only on mount. A dialog is often mounted before it opens.
- Close only after the request succeeds. On failure, keep the dialog open so
  the user can correct the input.
- Disable the cancel button while `isSubmitting`, or make cancellation explicit
  and abort the request if the product supports it.
- If the dialog validates before closing, call `await form.trigger()` and check
  its result.

## Server errors

The server remains authoritative for validation that only it can perform.

```tsx
async function submit(values: ProjectFormValues) {
  try {
    await api.save(values);
  } catch (error) {
    if (isFieldError(error)) {
      form.setError(error.field, {
        type: 'server',
        message: error.message,
      });
      return;
    }

    form.setError('root.server', {
      type: 'server',
      message: 'The server could not save the form. Try again.',
    });
  }
}
```

- Use `setError` with `type: 'server'` for field errors. The field wrapper renders
  `fieldState.error?.message`.
- Use `root.server` for a form-level error. The fields do not render root
  errors; render `form.formState.errors.root?.server?.message` in a
  `MessageBar`.
- Clear a stale server error when the user edits the field. The usual pattern
  is `form.clearErrors(name)` inside an `onChange` wrapper or an effect on
  `form.watch(name)`. Do not clear a client error that still applies.
- Never trust client validation alone for security or authorization.

## DTO mapping

Keep the form model and the API model separate:

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
```

- Do not spread form values into the request body. Form-only fields (search
  text, confirmation flags, UI state) must not leak into the API.
- Convert dates and numbers deliberately. A `Date` is not an API payload; an
  ISO string or epoch is.
- Keep the inverse mapper for edit forms. `fromProjectDto` must fill every
  default the form expects, including `''` and `null`.
- If the schema transforms input, submit the transformed output, not the raw
  field values.

## i18n and accessibility

- Labels, hints, placeholders and validation messages come from the
  application's translation layer. The shared skill has no business strings.
- Use the `Field`-based wrappers so labels, hints, required markers and error
  messages are associated with the control.
- Check the keyboard path for toggles, selection fields and dialogs. The
  Combobox clear path is the empty-value option; do not rely on the pointer-only
  clear affordance.
- On a failed submit, move focus to the first invalid field with
  `form.setFocus`. Field wrappers expose the underlying focusable control.
- In dialogs, let Fluent manage initial focus and restore focus on close.
- Test with a screen reader or the accessibility tooling the application
  already uses.

## Testing and verification

Minimum test set for a form:

| Case          | What to assert                                                                             |
| ------------- | ------------------------------------------------------------------------------------------ |
| Schema        | Valid values parse; each invalid rule returns the expected path and message                |
| Interaction   | Typing, blur, selection and submit update the form value                                   |
| Validation    | Invalid submit renders the field message and does not call the API                         |
| Server error  | A field error appears on the matching field; a root error appears in the form-level region |
| Reset         | Reopening a dialog restores the documented defaults                                        |
| Accessibility | Label, hint, required and error are associated with the control                            |

Read [references/testing.md](references/testing.md) for concrete patterns.
Run the application's full verification command before declaring the work done.
No form is complete while its tests fail.

## References

- [references/field-api.md](references/field-api.md) — the eight field
  components, value types and prop rules.
- [references/form-patterns.md](references/form-patterns.md) — inline forms,
  dialogs, dependent fields, server errors and DTO mapping.
- [references/testing.md](references/testing.md) — schema, interaction,
  accessibility and async tests.
- [references/pitfalls.md](references/pitfalls.md) — stale values, reset loops,
  number parsing and DTO drift.

## Templates

- [templates/FormSchema.ts](templates/FormSchema.ts)
- [templates/useFormLogic.ts](templates/useFormLogic.ts)
- [templates/FormDialog.tsx](templates/FormDialog.tsx)
- [templates/form.spec.test.tsx](templates/form.spec.test.tsx)

Replace the placeholder names and fields with the application's contract.
Templates are starting points, not a runtime dependency.
