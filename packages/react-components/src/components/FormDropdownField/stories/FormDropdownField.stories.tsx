import { Option } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { StoryForm } from '../../../forms/stories/formStoryHarness.story';
import { FormDropdownField } from '../FormDropdownField';

type StoryValues = {
  color?: string;
};

const optionLabels: Record<string, string> = {
  red: 'Red',
  blue: 'Blue',
  green: 'Green',
};

const getOptionText = (value: string): string | undefined => optionLabels[value];

function ColorOptions(): ReactElement {
  return (
    <>
      <Option value="red">Red</Option>
      <Option value="blue">Blue</Option>
      <Option value="green">Green</Option>
    </>
  );
}

const meta: Meta<typeof FormDropdownField> = {
  id: 'components-formdropdownfield',
  title: 'Forms/FormDropdownField',
  component: FormDropdownField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A single-select Fluent UI Dropdown bound to a React Hook Form field.',
          '',
          'The form stores the option value. `getOptionText` resolves the display text when an option value differs',
          'from its text; the empty string means no selection.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Label — clicking the label focuses the trigger.',
          '2. Hint and error — the hint is announced with the trigger; the error is announced as an alert.',
          '3. Required — the asterisk is visible and the trigger exposes `aria-required`.',
          '4. Selection — choosing an option updates the button text and the values preview.',
          '5. Clear — the clearable story returns to the placeholder and the form value becomes the empty string.',
          '6. Keyboard — ArrowDown opens the list, arrows move, Enter selects, Escape closes and returns focus.',
          '7. Disabled — the trigger is not focusable and does not open.',
          '8. Light and dark theme — the trigger, listbox, hint, and error stay legible.',
          '9. Accessibility addon — no violations.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormDropdownField>;

/**
 * An empty dropdown with a placeholder.
 */
export const Default: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: '' }}>
      {form => (
        <FormDropdownField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          placeholder="Pick a color"
        >
          <ColorOptions />
        </FormDropdownField>
      )}
    </StoryForm>
  ),
};

/**
 * A selected value whose option value differs from its display text.
 */
export const Selected: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: 'blue' }}>
      {form => (
        <FormDropdownField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          getOptionText={getOptionText}
        >
          <ColorOptions />
        </FormDropdownField>
      )}
    </StoryForm>
  ),
};

/**
 * The required marker and trigger-level required state.
 */
export const Required: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: '' }}>
      {form => (
        <FormDropdownField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          required
        >
          <ColorOptions />
        </FormDropdownField>
      )}
    </StoryForm>
  ),
};

/**
 * A helper hint associated with the trigger.
 */
export const WithHint: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: 'blue' }}>
      {form => (
        <FormDropdownField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          hint="Choose the accent color"
          getOptionText={getOptionText}
        >
          <ColorOptions />
        </FormDropdownField>
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
      defaultValues={{ color: '' }}
      error={{ name: 'color', message: 'Pick a color' }}
    >
      {form => (
        <FormDropdownField<StoryValues, 'color'> control={form.control} name="color" label="Color">
          <ColorOptions />
        </FormDropdownField>
      )}
    </StoryForm>
  ),
};

/**
 * A disabled dropdown.
 */
export const Disabled: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: 'blue' }}>
      {form => (
        <FormDropdownField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          getOptionText={getOptionText}
          disabled
        >
          <ColorOptions />
        </FormDropdownField>
      )}
    </StoryForm>
  ),
};

/**
 * A dropdown with a clear button.
 */
export const Clearable: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: 'blue' }}>
      {form => (
        <FormDropdownField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          placeholder="Pick a color"
          getOptionText={getOptionText}
          clearable
        >
          <ColorOptions />
        </FormDropdownField>
      )}
    </StoryForm>
  ),
};

/**
 * The inline popup variant, so the listbox renders next to the trigger.
 */
export const InlinePopup: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: '' }}>
      {form => (
        <FormDropdownField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          placeholder="Pick a color"
          inlinePopup
        >
          <ColorOptions />
        </FormDropdownField>
      )}
    </StoryForm>
  ),
};
