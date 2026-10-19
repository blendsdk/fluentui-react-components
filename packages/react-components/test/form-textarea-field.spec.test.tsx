import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormTextareaField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
  notes: string;
};

describe('FormTextareaField', () => {
  it('renders the label and the current value', () => {
    renderWithForm<Values>({ defaultValues: { notes: 'Hello' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" />
    ));

    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('Hello');
  });

  it('updates the form value when the user types', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { notes: '' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" />
    ));

    fireEvent.change(screen.getByRole('textbox', { name: 'Notes' }), {
      target: { value: 'World' },
    });

    expect(form.getValues('notes')).toBe('World');
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('World');
  });

  it('marks the field touched on blur and calls a caller onBlur', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>({ defaultValues: { notes: 'Hello' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" onBlur={onBlur} />
    ));

    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    fireEvent.focus(textarea);
    fireEvent.blur(textarea);

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('notes').isTouched).toBe(true);
  });

  it('shows a server error and associates it with the control', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { notes: 'Hello' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" />
    ));

    act(() => {
      form.setError('notes', { type: 'server', message: 'Too long' });
    });

    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Too long');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('exposes the required state and marker', () => {
    renderWithForm<Values>({ defaultValues: { notes: '' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" required />
    ));

    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    const label = screen.getByText('Notes').closest('label');

    expect(textarea).toHaveAttribute('required');
    expect(label).toHaveTextContent('*');
  });

  it('disables the textarea through the prop and the form-level state', () => {
    const first = renderWithForm<Values>({ defaultValues: { notes: 'Hello' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" disabled />
    ));

    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeDisabled();
    first.unmount();

    const second = renderWithForm<Values>(
      { defaultValues: { notes: 'Hello' }, disabled: true },
      form => <FormTextareaField control={form.control} name="notes" label="Notes" />
    );

    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeDisabled();
    expect(second.form.getValues('notes')).toBe('Hello');
  });

  it('keeps a read-only value visible and focusable', () => {
    renderWithForm<Values>({ defaultValues: { notes: 'Hello' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" readOnly />
    ));

    const textarea = screen.getByRole('textbox', { name: 'Notes' });

    expect(textarea).toHaveAttribute('readonly');
    expect(textarea).toHaveValue('Hello');

    textarea.focus();
    expect(textarea).toHaveFocus();
  });

  it('renders the hint as the accessible description', () => {
    renderWithForm<Values>({ defaultValues: { notes: '' } }, form => (
      <FormTextareaField
        control={form.control}
        name="notes"
        label="Notes"
        hint="Keep it under 500 characters"
      />
    ));

    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveAccessibleDescription(
      'Keep it under 500 characters'
    );
  });

  it('updates the displayed value after reset', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { notes: 'Hello' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" />
    ));

    act(() => {
      form.reset({ notes: 'Reset' });
    });

    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('Reset');
  });

  it('clears the error when the form clears it', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { notes: 'Hello' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" />
    ));

    act(() => {
      form.setError('notes', { type: 'server', message: 'Too long' });
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Too long');

    act(() => {
      form.clearErrors('notes');
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Notes' })).not.toHaveAttribute('aria-invalid');
  });
});
