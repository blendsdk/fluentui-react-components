import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { StoryForm } from '../../../forms/stories/formStoryHarness.story';
import { FormSwitchField } from '../FormSwitchField';

type StoryValues = {
  enabled: boolean;
};

const meta: Meta<typeof FormSwitchField> = {
  id: 'components-formswitchfield',
  title: 'Forms/FormSwitchField',
  component: FormSwitchField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A Fluent UI Switch bound to a React Hook Form field.',
          '',
          'The primitive owns the visible label and required marker. `Field` adds the hint, validation message,',
          'error state, and required state through its context.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Label — clicking the label toggles the switch.',
          '2. Hint and error — the hint is announced with the switch; the error is announced as an alert.',
          '3. Required — the asterisk is visible and the hidden input exposes the required state.',
          '4. DisabledFocusable — the switch stays in the tab order, is announced disabled, and does not toggle.',
          '5. Disabled — the switch is not focusable and does not toggle.',
          '6. Keyboard — Space toggles the switch; Tab reaches it once.',
          '7. Light and dark theme — the label, track, hint, and error stay legible.',
          '8. Accessibility addon — no violations.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormSwitchField>;

/**
 * An off switch.
 */
export const Default: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ enabled: false }}>
      {form => (
        <FormSwitchField<StoryValues, 'enabled'>
          control={form.control}
          name="enabled"
          label="Enable feature"
        />
      )}
    </StoryForm>
  ),
};

/**
 * An on switch.
 */
export const On: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ enabled: true }}>
      {form => (
        <FormSwitchField<StoryValues, 'enabled'>
          control={form.control}
          name="enabled"
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
    <StoryForm<StoryValues> defaultValues={{ enabled: false }}>
      {form => (
        <FormSwitchField<StoryValues, 'enabled'>
          control={form.control}
          name="enabled"
          label="Enable feature"
          required
        />
      )}
    </StoryForm>
  ),
};

/**
 * A helper hint associated with the switch.
 */
export const WithHint: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ enabled: false }}>
      {form => (
        <FormSwitchField<StoryValues, 'enabled'>
          control={form.control}
          name="enabled"
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
      defaultValues={{ enabled: false }}
      error={{ name: 'enabled', message: 'This setting is required' }}
    >
      {form => (
        <FormSwitchField<StoryValues, 'enabled'>
          control={form.control}
          name="enabled"
          label="Enable feature"
        />
      )}
    </StoryForm>
  ),
};

/**
 * A disabled switch.
 */
export const Disabled: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ enabled: true }}>
      {form => (
        <FormSwitchField<StoryValues, 'enabled'>
          control={form.control}
          name="enabled"
          label="Enable feature"
          disabled
        />
      )}
    </StoryForm>
  ),
};

/**
 * A switch that stays focusable while announced disabled.
 */
export const DisabledFocusable: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ enabled: false }}>
      {form => (
        <FormSwitchField<StoryValues, 'enabled'>
          control={form.control}
          name="enabled"
          label="Enable feature"
          disabledFocusable
        />
      )}
    </StoryForm>
  ),
};
