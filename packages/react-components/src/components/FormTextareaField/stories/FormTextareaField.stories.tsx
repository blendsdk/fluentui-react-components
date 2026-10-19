import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { StoryForm } from '../../../forms/stories/formStoryHarness.story';
import { FormTextareaField } from '../FormTextareaField';

type StoryValues = {
  notes: string;
};

const meta: Meta<typeof FormTextareaField> = {
  title: 'Components/FormTextareaField',
  component: FormTextareaField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A Fluent UI Textarea bound to a React Hook Form field.',
          '',
          '`Field` owns the label, hint, required marker, and validation message. The textarea owns the value,',
          'focus, resize, read-only, and disabled behavior.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Label — clicking the label focuses the textarea.',
          '2. Hint and error — the hint is announced with the control; the error appears below it and is announced as an alert.',
          '3. Required — the asterisk is visible and the textarea exposes the required state.',
          '4. Read-only — the value stays readable, copyable, and focusable.',
          '5. Disabled — the textarea is not focusable and does not change.',
          '6. Resize — the Resizable story can be dragged vertically.',
          '7. Light and dark theme — the label, textarea, hint, and error stay legible.',
          '8. Accessibility addon — no violations.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormTextareaField>;

/**
 * A simple textarea with a default value.
 */
export const Default: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ notes: 'A short note' }}>
      {form => (
        <FormTextareaField<StoryValues, 'notes'>
          control={form.control}
          name="notes"
          label="Notes"
        />
      )}
    </StoryForm>
  ),
};

/**
 * The required marker and native required state.
 */
export const Required: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ notes: '' }}>
      {form => (
        <FormTextareaField<StoryValues, 'notes'>
          control={form.control}
          name="notes"
          label="Notes"
          required
        />
      )}
    </StoryForm>
  ),
};

/**
 * A helper hint associated with the textarea.
 */
export const WithHint: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ notes: '' }}>
      {form => (
        <FormTextareaField<StoryValues, 'notes'>
          control={form.control}
          name="notes"
          label="Notes"
          hint="Keep it under 500 characters"
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
      defaultValues={{ notes: '' }}
      error={{ name: 'notes', message: 'Notes are required' }}
    >
      {form => (
        <FormTextareaField<StoryValues, 'notes'>
          control={form.control}
          name="notes"
          label="Notes"
        />
      )}
    </StoryForm>
  ),
};

/**
 * A disabled textarea that cannot be edited.
 */
export const Disabled: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ notes: 'A short note' }}>
      {form => (
        <FormTextareaField<StoryValues, 'notes'>
          control={form.control}
          name="notes"
          label="Notes"
          disabled
        />
      )}
    </StoryForm>
  ),
};

/**
 * A read-only textarea whose value stays readable and focusable.
 */
export const ReadOnly: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ notes: 'A short note' }}>
      {form => (
        <FormTextareaField<StoryValues, 'notes'>
          control={form.control}
          name="notes"
          label="Notes"
          readOnly
        />
      )}
    </StoryForm>
  ),
};

/**
 * A vertically resizable textarea.
 */
export const Resizable: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ notes: '' }}>
      {form => (
        <FormTextareaField<StoryValues, 'notes'>
          control={form.control}
          name="notes"
          label="Notes"
          resize="vertical"
        />
      )}
    </StoryForm>
  ),
};
