import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormDatePickerField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
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

describe('FormDatePickerField', () => {
  it('renders the label and an empty value', () => {
    renderWithForm<Values>({ defaultValues: { startDate: null } }, form => (
      <FormDatePickerField control={form.control} name="startDate" label="Start date" />
    ));

    const input = screen.getByRole('combobox', { name: 'Start date' });

    expect(input).toHaveValue('');
  });

  it('displays the selected date with the supplied formatter', () => {
    renderWithForm<Values>({ defaultValues: { startDate: new Date(2026, 0, 15) } }, form => (
      <FormDatePickerField
        control={form.control}
        name="startDate"
        label="Start date"
        formatDate={formatDate}
      />
    ));

    expect(screen.getByRole('combobox', { name: 'Start date' })).toHaveValue('2026-01-15');
  });

  it('stores a typed date when text input is allowed', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { startDate: null } }, form => (
      <FormDatePickerField
        control={form.control}
        name="startDate"
        label="Start date"
        allowTextInput
        formatDate={formatDate}
        parseDateFromString={parseDateFromString}
      />
    ));

    const input = screen.getByRole('combobox', { name: 'Start date' });

    fireEvent.change(input, { target: { value: '2026-02-20' } });
    fireEvent.blur(input);

    const value = form.getValues('startDate');

    expect(value).toBeInstanceOf(Date);
    expect(formatDate(value ?? undefined)).toBe('2026-02-20');
  });

  it('keeps the form value when typed text is invalid', () => {
    const onValidationResult = vi.fn();
    const { form } = renderWithForm<Values>(
      { defaultValues: { startDate: new Date(2026, 0, 15) } },
      form => (
        <FormDatePickerField
          control={form.control}
          name="startDate"
          label="Start date"
          allowTextInput
          formatDate={formatDate}
          parseDateFromString={parseDateFromString}
          onValidationResult={onValidationResult}
        />
      )
    );

    const input = screen.getByRole('combobox', { name: 'Start date' });

    fireEvent.change(input, { target: { value: 'not-a-date' } });
    fireEvent.blur(input);

    expect(onValidationResult).toHaveBeenCalled();
    expect(formatDate(form.getValues('startDate') ?? undefined)).toBe('2026-01-15');
  });

  it('marks the field touched on blur and calls a caller onBlur', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>(
      { defaultValues: { startDate: new Date(2026, 0, 15) } },
      form => (
        <FormDatePickerField
          control={form.control}
          name="startDate"
          label="Start date"
          formatDate={formatDate}
          onBlur={onBlur}
        />
      )
    );

    fireEvent.blur(screen.getByRole('combobox', { name: 'Start date' }));

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('startDate').isTouched).toBe(true);
  });

  it('shows a server error and associates it with the input', () => {
    const { form } = renderWithForm<Values>(
      { defaultValues: { startDate: new Date(2026, 0, 15) } },
      form => (
        <FormDatePickerField
          control={form.control}
          name="startDate"
          label="Start date"
          formatDate={formatDate}
        />
      )
    );

    act(() => {
      form.setError('startDate', { type: 'server', message: 'Date is required' });
    });

    const input = screen.getByRole('combobox', { name: 'Start date' });
    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Date is required');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('exposes the required state', () => {
    renderWithForm<Values>({ defaultValues: { startDate: null } }, form => (
      <FormDatePickerField control={form.control} name="startDate" label="Start date" required />
    ));

    const input = screen.getByRole('combobox', { name: 'Start date' });
    const label = screen.getByText('Start date').closest('label');

    expect(input).toHaveAttribute('required');
    expect(label).toHaveTextContent('*');
  });

  it('disables the input through the prop and the form-level state', () => {
    const first = renderWithForm<Values>(
      { defaultValues: { startDate: new Date(2026, 0, 15) } },
      form => (
        <FormDatePickerField
          control={form.control}
          name="startDate"
          label="Start date"
          formatDate={formatDate}
          disabled
        />
      )
    );

    expect(screen.getByRole('combobox', { name: 'Start date' })).toBeDisabled();
    first.unmount();

    renderWithForm<Values>(
      { defaultValues: { startDate: new Date(2026, 0, 15) }, disabled: true },
      form => (
        <FormDatePickerField
          control={form.control}
          name="startDate"
          label="Start date"
          formatDate={formatDate}
        />
      )
    );

    expect(screen.getByRole('combobox', { name: 'Start date' })).toBeDisabled();
  });

  it('renders the hint and associates the label with the input', () => {
    renderWithForm<Values>({ defaultValues: { startDate: null } }, form => (
      <FormDatePickerField
        control={form.control}
        name="startDate"
        label="Start date"
        hint="Choose the first day"
      />
    ));

    const input = screen.getByRole('combobox', { name: 'Start date' });
    const label = screen.getByText('Start date').closest('label');

    expect(input).toHaveAccessibleDescription('Choose the first day');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('does not duplicate the described-by ids', () => {
    renderWithForm<Values>({ defaultValues: { startDate: null } }, form => (
      <FormDatePickerField
        control={form.control}
        name="startDate"
        label="Start date"
        hint="Choose the first day"
      />
    ));

    const input = screen.getByRole('combobox', { name: 'Start date' });
    const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);

    expect(ids).toHaveLength(1);
    expect(new Set(ids).size).toBe(1);
  });

  it('updates the displayed date after reset', () => {
    const { form } = renderWithForm<Values>(
      { defaultValues: { startDate: new Date(2026, 0, 15) } },
      form => (
        <FormDatePickerField
          control={form.control}
          name="startDate"
          label="Start date"
          formatDate={formatDate}
        />
      )
    );

    act(() => {
      form.reset({ startDate: new Date(2026, 2, 1) });
    });

    expect(screen.getByRole('combobox', { name: 'Start date' })).toHaveValue('2026-03-01');
  });
});
