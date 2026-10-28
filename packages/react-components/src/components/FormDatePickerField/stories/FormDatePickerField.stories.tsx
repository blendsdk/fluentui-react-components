import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { StoryForm } from '../../../forms/stories/formStoryHarness.story';
import { FormDatePickerField } from '../FormDatePickerField';

type StoryValues = {
  startDate?: Date | null;
};

const formatDate = (date?: Date): string =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`
    : '';

const parseDateFromString = (value: string): Date | null => {
  const parts = value.split('-').map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null;
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
};

const meta: Meta<typeof FormDatePickerField> = {
  id: 'components-formdatepickerfield',
  title: 'Forms/FormDatePickerField',
  component: FormDatePickerField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A Fluent UI DatePicker bound to a React Hook Form field.',
          '',
          'The form value is a Date, or null when there is no date. `Field` owns the label, hint, required marker,',
          'and validation message. Editability follows `allowTextInput`; the input is read-only when it is false.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Label — clicking the label focuses the input.',
          '2. Hint and error — the hint is announced with the input; the error is announced as an alert.',
          '3. Required — the asterisk is visible and the input exposes the required state.',
          '4. Calendar — open the calendar, move with the keyboard, select a day, and confirm the input updates.',
          '5. Typed date — in AllowTextInput, type a valid date and blur; type an invalid date and confirm it resets.',
          '6. Localized — the Localized story formats the date for the locale.',
          '7. Disabled — the input and calendar trigger are not focusable and the calendar does not open.',
          '8. Light and dark theme — the input, calendar, hint, and error stay legible.',
          '9. Accessibility addon — no violations.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormDatePickerField>;

/**
 * An empty date picker.
 */
export const Default: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ startDate: null }}>
      {form => (
        <FormDatePickerField<StoryValues, 'startDate'>
          control={form.control}
          name="startDate"
          label="Start date"
          formatDate={formatDate}
        />
      )}
    </StoryForm>
  ),
};

/**
 * A selected date.
 */
export const Selected: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ startDate: new Date(2026, 0, 15) }}>
      {form => (
        <FormDatePickerField<StoryValues, 'startDate'>
          control={form.control}
          name="startDate"
          label="Start date"
          formatDate={formatDate}
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
    <StoryForm<StoryValues> defaultValues={{ startDate: null }}>
      {form => (
        <FormDatePickerField<StoryValues, 'startDate'>
          control={form.control}
          name="startDate"
          label="Start date"
          formatDate={formatDate}
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
    <StoryForm<StoryValues> defaultValues={{ startDate: null }}>
      {form => (
        <FormDatePickerField<StoryValues, 'startDate'>
          control={form.control}
          name="startDate"
          label="Start date"
          hint="Choose the first day of the period"
          formatDate={formatDate}
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
      defaultValues={{ startDate: null }}
      error={{ name: 'startDate', message: 'Choose a start date' }}
    >
      {form => (
        <FormDatePickerField<StoryValues, 'startDate'>
          control={form.control}
          name="startDate"
          label="Start date"
          formatDate={formatDate}
        />
      )}
    </StoryForm>
  ),
};

/**
 * A disabled date picker.
 */
export const Disabled: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ startDate: new Date(2026, 0, 15) }}>
      {form => (
        <FormDatePickerField<StoryValues, 'startDate'>
          control={form.control}
          name="startDate"
          label="Start date"
          formatDate={formatDate}
          disabled
        />
      )}
    </StoryForm>
  ),
};

/**
 * A date picker that accepts typed dates.
 */
export const AllowTextInput: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ startDate: null }}>
      {form => (
        <FormDatePickerField<StoryValues, 'startDate'>
          control={form.control}
          name="startDate"
          label="Start date"
          hint="Type a date as YYYY-MM-DD or open the calendar"
          allowTextInput
          formatDate={formatDate}
          parseDateFromString={parseDateFromString}
        />
      )}
    </StoryForm>
  ),
};

/**
 * A localized date format.
 */
export const Localized: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ startDate: new Date(2026, 0, 15) }}>
      {form => (
        <FormDatePickerField<StoryValues, 'startDate'>
          control={form.control}
          name="startDate"
          label="Startdatum"
          formatDate={date => date?.toLocaleDateString('de-DE') ?? ''}
        />
      )}
    </StoryForm>
  ),
};

/**
 * The calendar is open for a manual keyboard and focus review.
 */
export const Calendar: Story = {
  render: (): ReactElement => (
    <StoryForm<StoryValues> defaultValues={{ startDate: new Date(2026, 0, 15) }}>
      {form => (
        <FormDatePickerField<StoryValues, 'startDate'>
          control={form.control}
          name="startDate"
          label="Start date"
          formatDate={formatDate}
          defaultOpen
          inlinePopup
        />
      )}
    </StoryForm>
  ),
};
