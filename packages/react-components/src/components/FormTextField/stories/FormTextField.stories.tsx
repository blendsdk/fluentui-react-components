import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { StoryForm } from '../../../forms/stories/formStoryHarness.story';
import { FormTextField } from '../FormTextField';

type StoryValues = {
  name: string;
  height?: number;
};

const meta: Meta<typeof FormTextField> = {
  title: 'Components/FormTextField',
  component: FormTextField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A Fluent UI Input bound to a React Hook Form field.',
          '',
          '`Field` owns the label, hint, required marker, and validation message. The input owns the value,',
          'focus, read-only, and disabled behavior. `parse` converts the raw string to a non-string form value',
          'while the raw keystrokes stay visible.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Label — clicking the label focuses the input.',
          '2. Hint and error — the hint is announced with the input; the error appears below it and is announced as an alert.',
          '3. Required — the asterisk is visible and the input exposes the required state.',
          '4. Read-only — the value stays readable, copyable, and focusable.',
          '5. Disabled — the input is not focusable and does not change.',
          '6. Numeric parse — typing `1.` keeps the dot visible while the form value is `1`.',
          '7. Light and dark theme — the label, input, hint, and error stay legible.',
          '8. Accessibility addon — no violations.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormTextField>;

/**
 * A simple text field with a default value.
 */
export const Default: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ name: 'Ada' }}>
      {form => (
        <FormTextField<StoryValues, 'name'> control={form.control} name="name" label="Name" />
      )}
    </StoryForm>
  ),
};

/**
 * The required marker and native required state.
 */
export const Required: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ name: '' }}>
      {form => (
        <FormTextField<StoryValues, 'name'>
          control={form.control}
          name="name"
          label="Name"
          required
        />
      )}
    </StoryForm>
  ),
};

/**
 * A helper hint associated with the input.
 */
export const WithHint: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ name: '' }}>
      {form => (
        <FormTextField<StoryValues, 'name'>
          control={form.control}
          name="name"
          label="Name"
          hint="Use the name on your passport"
        />
      )}
    </StoryForm>
  ),
};

/**
 * A validation message rendered through Field.
 */
export const WithError: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues>
      defaultValues={{ name: '' }}
      error={{ name: 'name', message: 'Name is required' }}
    >
      {form => (
        <FormTextField<StoryValues, 'name'> control={form.control} name="name" label="Name" />
      )}
    </StoryForm>
  ),
};

/**
 * A disabled input that cannot be edited.
 */
export const Disabled: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ name: 'Ada' }}>
      {form => (
        <FormTextField<StoryValues, 'name'>
          control={form.control}
          name="name"
          label="Name"
          disabled
        />
      )}
    </StoryForm>
  ),
};

/**
 * A read-only input whose value stays readable and focusable.
 */
export const ReadOnly: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ name: 'Ada' }}>
      {form => (
        <FormTextField<StoryValues, 'name'>
          control={form.control}
          name="name"
          label="Name"
          readOnly
        />
      )}
    </StoryForm>
  ),
};

/**
 * A numeric field whose raw keystrokes stay visible while the form stores a
 * number.
 */
export const Numeric: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ height: 5 }}>
      {form => (
        <FormTextField<StoryValues, 'height'>
          control={form.control}
          name="height"
          label="Height"
          hint="Whole centimeters"
          parse={value => (value === '' ? undefined : Number(value))}
        />
      )}
    </StoryForm>
  ),
};

/**
 * The filled appearance with a default value.
 */
export const Filled: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ name: 'Ada' }}>
      {form => (
        <FormTextField<StoryValues, 'name'>
          control={form.control}
          name="name"
          label="Name"
          appearance="filled-darker"
        />
      )}
    </StoryForm>
  ),
};
