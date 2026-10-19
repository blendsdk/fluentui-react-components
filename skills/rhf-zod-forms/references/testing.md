# Testing forms

Test the schema, the field interaction, the server-error mapping and the DTO
boundary separately. A form can pass an interaction test and still lose data at
the DTO boundary, so do not stop at "the button was clicked".

The examples use Vitest and Testing Library. Use the test runner the
application already has; the assertions are portable.

## Schema tests

Schema tests are pure and fast. They cover every rule and the messages the user
will see.

```ts
import { describe, expect, it } from 'vitest';
import { projectSchema } from './FormSchema';

describe('projectSchema', () => {
  it('accepts a complete project', () => {
    const result = projectSchema.safeParse({
      name: 'Apollo',
      description: '',
      budget: 10,
      status: 'active',
      startDate: new Date('2026-01-01'),
      active: true,
    });

    expect(result.success).toBe(true);
  });

  it('reports the name path and message', () => {
    const result = projectSchema.safeParse({
      name: '',
      description: '',
      status: 'planned',
      startDate: null,
      active: false,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ path: ['name'], message: 'Name is required' })
    );
  });
});
```

- Test valid values, each invalid rule and the edge values (empty string,
  `null`, `undefined`, zero).
- Assert the `path` as well as the message. A correct message on the wrong
  field is still a bug.
- Do not mock Zod. The schema is the unit under test.

## Interaction tests

Render the form with a real `useForm` and a real resolver. Mock only the API
boundary.

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { describe, expect, it, vi } from 'vitest';
import { ProjectForm } from './ProjectForm';
import type { ProjectFormValues } from './FormSchema';

function renderForm(onSave: (values: ProjectFormValues) => Promise<void>) {
  return render(
    <FluentProvider theme={webLightTheme}>
      <ProjectForm onSave={onSave} />
    </FluentProvider>
  );
}

it('validates the name and does not call the API on an invalid submit', async () => {
  const save = vi.fn();
  renderForm(save);

  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(await screen.findByText('Name is required')).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
});

it('submits the parsed number and the selected value', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  renderForm(save);

  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Apollo' },
  });
  fireEvent.change(screen.getByLabelText('Budget'), {
    target: { value: '42' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Apollo', budget: 42 }));
});
```

- Use accessible queries (`getByLabelText`, `getByRole`) before test ids.
- Use `findBy*` for messages that appear after an async submit.
- Use `waitFor` around the API assertion; `handleSubmit` is asynchronous.
- Do not assert implementation details such as the number of `useController`
  calls. Assert what the user and the API observe.
- For a controlled field, change it with `fireEvent.change`; for a toggle,
  click it; for a dialog, open it before querying its contents.

If the project already uses `@testing-library/user-event`, prefer it for typing
and keyboard paths. The field wrappers are ordinary controls; they do not need
special test helpers.

## Server-error tests

```tsx
import { ProjectDialog } from './FormDialog';
import { projectFormDefaults } from './FormSchema';

it('shows a server error on the matching field', async () => {
  const save = vi.fn().mockRejectedValue({
    field: 'name',
    message: 'That name is already taken',
  });

  render(
    <FluentProvider theme={webLightTheme}>
      <ProjectDialog
        open
        defaultValues={projectFormDefaults}
        onOpenChange={vi.fn()}
        onSave={save}
      />
    </FluentProvider>
  );
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Apollo' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(await screen.findByText('That name is already taken')).toBeInTheDocument();
  expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
});
```

- Assert the message and its association with the control.
- Test a form-level error separately; it should appear in the `MessageBar`, not
  on an arbitrary field.
- Test that editing the field clears a stale server error when the product
  requires that behavior.

## Accessibility assertions

```tsx
const name = screen.getByLabelText('Name');
expect(name).toHaveAccessibleDescription('Shown in the project list');

fireEvent.click(screen.getByRole('button', { name: 'Save' }));
expect(await screen.findByText('Name is required')).toBeInTheDocument();
expect(name).toHaveAttribute('aria-invalid', 'true');
```

Also check:

- `required` is exposed on the control or group.
- `disabled` prevents focus and activation.
- Checkbox and Switch have one accessible name.
- RadioGroup has a group name and exposes required state.
- The Combobox can be cleared from the keyboard with the empty-value option.
- The dialog returns focus to the trigger after it closes.

Use the application's accessibility checker in addition to these assertions;
automated checks do not replace a keyboard pass.

## DTO tests

```ts
it('maps form values to the API payload', () => {
  const dto = toProjectDto({
    name: 'Apollo',
    description: '',
    budget: undefined,
    status: 'active',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    active: true,
  });

  expect(dto).toEqual({
    name: 'Apollo',
    description: null,
    budget: null,
    status: 'active',
    startDate: '2026-01-01T00:00:00.000Z',
    active: true,
  });
});
```

- Test both `toDto` and `fromDto` when the app edits existing data.
- Assert that form-only fields do not appear in the payload.
- Test `null`/`undefined`/empty-string normalization explicitly.
- Test the round trip when the API and the form use different date formats.

## Verification

Run the application's full command after the focused loops, for example:

```bash
pnpm format:check
pnpm type-check
pnpm test
pnpm build
```

The exact command is application-specific. Do not declare a form complete while
any test fails or while the type checker rejects the schema or field names.
