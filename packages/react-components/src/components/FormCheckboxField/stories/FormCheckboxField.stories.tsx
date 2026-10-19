import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { StoryForm } from '../../../forms/stories/formStoryHarness.story';
import { FormCheckboxField } from '../FormCheckboxField';

type StoryValues = {
  active: boolean;
  mixed?: 'mixed';
};

const meta: Meta<typeof FormCheckboxField> = {
  title: 'Components/FormCheckboxField',
  component: FormCheckboxField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A Fluent UI Checkbox bound to a React Hook Form field.',
          '',
          'The primitive owns the visible label and required marker. `Field` adds the hint, validation message,',
          'error state, and required state through its context. The form value supports `boolean` and `mixed`.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Label — clicking the label toggles the checkbox.',
          '2. Hint and error — the hint is announced with the checkbox; the error is announced as an alert.',
          '3. Required — the asterisk is visible and the hidden input exposes the required state.',
          '4. Mixed — the Mixed story shows the indeterminate indicator and clicking it clears the mixed state.',
          '5. Disabled — the checkbox is not focusable and does not toggle.',
          '6. Keyboard — Space toggles the checkbox; Tab reaches it once.',
          '7. Light and dark theme — the label, indicator, hint, and error stay legible.',
          '8. Accessibility addon — no violations.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormCheckboxField>;

/**
 * An unchecked checkbox.
 */
export const Default: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ active: false }}>
      {form => (
        <FormCheckboxField<StoryValues, 'active'>
          control={form.control}
          name="active"
          label="Enable feature"
        />
      )}
    </StoryForm>
  ),
};

/**
 * A checked checkbox.
 */
export const Checked: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ active: true }}>
      {form => (
        <FormCheckboxField<StoryValues, 'active'>
          control={form.control}
          name="active"
          label="Enable feature"
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
    <StoryForm<StoryValues> defaultValues={{ active: false }}>
      {form => (
        <FormCheckboxField<StoryValues, 'active'>
          control={form.control}
          name="active"
          label="Enable feature"
          required
        />
      )}
    </StoryForm>
  ),
};

/**
 * A helper hint associated with the checkbox.
 */
export const WithHint: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ active: false }}>
      {form => (
        <FormCheckboxField<StoryValues, 'active'>
          control={form.control}
          name="active"
          label="Enable feature"
          hint="This turns on the feature for your workspace"
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
      defaultValues={{ active: false }}
      error={{ name: 'active', message: 'Accept the terms to continue' }}
    >
      {form => (
        <FormCheckboxField<StoryValues, 'active'>
          control={form.control}
          name="active"
          label="Enable feature"
        />
      )}
    </StoryForm>
  ),
};

/**
 * A disabled checkbox.
 */
export const Disabled: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ active: true }}>
      {form => (
        <FormCheckboxField<StoryValues, 'active'>
          control={form.control}
          name="active"
          label="Enable feature"
          disabled
        />
      )}
    </StoryForm>
  ),
};

/**
 * The mixed state.
 */
export const Mixed: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ mixed: 'mixed' }}>
      {form => (
        <FormCheckboxField<StoryValues, 'mixed'>
          control={form.control}
          name="mixed"
          label="Partially selected"
        />
      )}
    </StoryForm>
  ),
};
