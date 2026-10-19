import { Option } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { StoryForm } from '../../../forms/stories/formStoryHarness.story';
import { FormComboboxField } from '../FormComboboxField';

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

const meta: Meta<typeof FormComboboxField> = {
  title: 'Components/FormComboboxField',
  component: FormComboboxField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A single-select Fluent UI Combobox bound to a React Hook Form field.',
          '',
          'The form stores the option value; the empty string means no selection. Typing filters the list and',
          'stays local until an option is selected. `getOptionText` resolves the text after `reset` or `setValue`.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Label — clicking the label focuses the input.',
          '2. Hint and error — the hint is announced with the input; the error is announced as an alert.',
          '3. Required — the asterisk is visible and the input exposes the required state.',
          '4. Typing — typing filters the list; the form value stays the previous selection until an option is chosen.',
          '5. Revert — type a non-matching string and blur: the input returns to the selected text.',
          '6. Clear — the clear affordance returns to the empty string and clears the input.',
          '7. Keyboard — ArrowDown opens the list, arrows move, Enter selects, Escape closes and returns focus.',
          '8. Disabled — the input is not focusable and does not open.',
          '9. Light and dark theme — the input, listbox, hint, and error stay legible.',
          '10. Accessibility addon — no violations. The Fluent clear affordance is decorative; note whether the keyboard clear path is discoverable.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormComboboxField>;

/**
 * An empty combobox.
 */
export const Default: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: '' }}>
      {form => (
        <FormComboboxField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          placeholder="Pick a color"
        >
          <ColorOptions />
        </FormComboboxField>
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
        <FormComboboxField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          getOptionText={getOptionText}
        >
          <ColorOptions />
        </FormComboboxField>
      )}
    </StoryForm>
  ),
};

/**
 * Type a non-matching string and blur; the input reverts to the selected
 * text and the form value stays `blue`.
 */
export const TypingAndRevert: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: 'blue' }}>
      {form => (
        <FormComboboxField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          getOptionText={getOptionText}
          inlinePopup
        >
          <ColorOptions />
        </FormComboboxField>
      )}
    </StoryForm>
  ),
};

/**
 * The required marker and native required state.
 */
export const Required: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: '' }}>
      {form => (
        <FormComboboxField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          required
        >
          <ColorOptions />
        </FormComboboxField>
      )}
    </StoryForm>
  ),
};

/**
 * A helper hint associated with the input.
 */
export const WithHint: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: 'blue' }}>
      {form => (
        <FormComboboxField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          hint="Choose the accent color"
          getOptionText={getOptionText}
        >
          <ColorOptions />
        </FormComboboxField>
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
        <FormComboboxField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
        >
          <ColorOptions />
        </FormComboboxField>
      )}
    </StoryForm>
  ),
};

/**
 * A disabled combobox.
 */
export const Disabled: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: 'blue' }}>
      {form => (
        <FormComboboxField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          getOptionText={getOptionText}
          disabled
        >
          <ColorOptions />
        </FormComboboxField>
      )}
    </StoryForm>
  ),
};

/**
 * A combobox with a clear affordance.
 */
export const Clearable: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: 'blue' }}>
      {form => (
        <FormComboboxField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          placeholder="Pick a color"
          getOptionText={getOptionText}
          clearable
          inlinePopup
        >
          <ColorOptions />
        </FormComboboxField>
      )}
    </StoryForm>
  ),
};

/**
 * The inline popup variant, so the listbox renders next to the input.
 */
export const InlinePopup: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ color: '' }}>
      {form => (
        <FormComboboxField<StoryValues, 'color'>
          control={form.control}
          name="color"
          label="Color"
          placeholder="Pick a color"
          inlinePopup
        >
          <ColorOptions />
        </FormComboboxField>
      )}
    </StoryForm>
  ),
};
