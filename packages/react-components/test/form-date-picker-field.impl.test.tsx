import { fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
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

describe('FormDatePickerField internals', () => {
  it('forwards the ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    renderWithForm<Values>({ defaultValues: { startDate: new Date(2026, 0, 15) } }, form => (
      <FormDatePickerField
        control={form.control}
        name="startDate"
        label="Start date"
        formatDate={formatDate}
        ref={ref}
      />
    ));

    const input = screen.getByRole('combobox', { name: 'Start date' });

    expect(ref.current).toBe(input);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('does not forward the RHF name as a DOM attribute', () => {
    renderWithForm<Values>({ defaultValues: { startDate: new Date(2026, 0, 15) } }, form => (
      <FormDatePickerField
        control={form.control}
        name="startDate"
        label="Start date"
        formatDate={formatDate}
      />
    ));

    expect(screen.getByRole('combobox', { name: 'Start date' })).not.toHaveAttribute('name');
  });

  it('merges the caller class with the Input root', () => {
    renderWithForm<Values>({ defaultValues: { startDate: new Date(2026, 0, 15) } }, form => (
      <FormDatePickerField
        control={form.control}
        name="startDate"
        label="Start date"
        formatDate={formatDate}
        className="caller"
      />
    ));

    const input = screen.getByRole('combobox', { name: 'Start date' });

    expect(input.closest('span')).toHaveClass('caller');
  });

  it('merges the caller blur handler with the RHF blur handler', () => {
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
});
