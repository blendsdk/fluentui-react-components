import { Radio } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { StoryForm } from '../../../forms/stories/formStoryHarness.story';
import { FormRadioGroupField } from '../FormRadioGroupField';

type StoryValues = {
  plan: string;
};

const meta: Meta<typeof FormRadioGroupField> = {
  id: 'components-formradiogroupfield',
  title: 'Forms/FormRadioGroupField',
  component: FormRadioGroupField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A Fluent UI RadioGroup bound to a React Hook Form field.',
          '',
          '`Field` owns the group label, hint, required marker, and validation message. Each `Radio` child',
          'keeps its own label. The form value is the selected radio value.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Label — clicking the group label does not break focus; the group has an accessible name.',
          '2. Hint and error — the hint is announced with the group; the error is announced as an alert.',
          '3. Required — the asterisk is visible and the group exposes `aria-required`.',
          '4. Disabled — every radio is disabled and cannot be selected.',
          '5. Keyboard — Tab reaches the group once; arrow keys move the selection; Space selects.',
          '6. Layouts — vertical, horizontal, and horizontal-stacked arrange without overlap.',
          '7. Light and dark theme — labels, indicators, hint, and error stay legible.',
          '8. Accessibility addon — no violations.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormRadioGroupField>;

function PlanOptions(): ReactElement {
  return (
    <>
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
      <Radio value="team" label="Team" />
    </>
  );
}

/**
 * A radio group with no selection.
 */
export const Default: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ plan: '' }}>
      {form => (
        <FormRadioGroupField<StoryValues, 'plan'> control={form.control} name="plan" label="Plan">
          <PlanOptions />
        </FormRadioGroupField>
      )}
    </StoryForm>
  ),
};

/**
 * A radio group with a selected value.
 */
export const Selected: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ plan: 'pro' }}>
      {form => (
        <FormRadioGroupField<StoryValues, 'plan'> control={form.control} name="plan" label="Plan">
          <PlanOptions />
        </FormRadioGroupField>
      )}
    </StoryForm>
  ),
};

/**
 * The required marker and group-level required state.
 */
export const Required: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ plan: '' }}>
      {form => (
        <FormRadioGroupField<StoryValues, 'plan'>
          control={form.control}
          name="plan"
          label="Plan"
          required
        >
          <PlanOptions />
        </FormRadioGroupField>
      )}
    </StoryForm>
  ),
};

/**
 * A helper hint associated with the group.
 */
export const WithHint: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ plan: '' }}>
      {form => (
        <FormRadioGroupField<StoryValues, 'plan'>
          control={form.control}
          name="plan"
          label="Plan"
          hint="You can change this later"
        >
          <PlanOptions />
        </FormRadioGroupField>
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
      defaultValues={{ plan: '' }}
      error={{ name: 'plan', message: 'Choose a plan' }}
    >
      {form => (
        <FormRadioGroupField<StoryValues, 'plan'> control={form.control} name="plan" label="Plan">
          <PlanOptions />
        </FormRadioGroupField>
      )}
    </StoryForm>
  ),
};

/**
 * A disabled group.
 */
export const Disabled: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ plan: 'pro' }}>
      {form => (
        <FormRadioGroupField<StoryValues, 'plan'>
          control={form.control}
          name="plan"
          label="Plan"
          disabled
        >
          <PlanOptions />
        </FormRadioGroupField>
      )}
    </StoryForm>
  ),
};

/**
 * The three Fluent radio group layouts.
 */
export const Layouts: Story = {
  render: (): ReactElement => (
    <div style={{ display: 'grid', gap: 24 }}>
      <StoryForm<StoryValues> defaultValues={{ plan: 'pro' }}>
        {form => (
          <FormRadioGroupField<StoryValues, 'plan'>
            control={form.control}
            name="plan"
            label="Vertical"
            layout="vertical"
          >
            <PlanOptions />
          </FormRadioGroupField>
        )}
      </StoryForm>
      <StoryForm<StoryValues> defaultValues={{ plan: 'pro' }}>
        {form => (
          <FormRadioGroupField<StoryValues, 'plan'>
            control={form.control}
            name="plan"
            label="Horizontal"
            layout="horizontal"
          >
            <PlanOptions />
          </FormRadioGroupField>
        )}
      </StoryForm>
      <StoryForm<StoryValues> defaultValues={{ plan: 'pro' }}>
        {form => (
          <FormRadioGroupField<StoryValues, 'plan'>
            control={form.control}
            name="plan"
            label="Horizontal stacked"
            layout="horizontal-stacked"
          >
            <PlanOptions />
          </FormRadioGroupField>
        )}
      </StoryForm>
    </div>
  ),
};
