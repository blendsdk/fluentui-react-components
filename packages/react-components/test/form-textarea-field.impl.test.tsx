import { fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormTextareaField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
  notes: string;
};

describe('FormTextareaField internals', () => {
  it('forwards the ref to the textarea', () => {
    const ref = createRef<HTMLTextAreaElement>();
    renderWithForm<Values>({ defaultValues: { notes: 'Hello' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" ref={ref} />
    ));

    const textarea = screen.getByRole('textbox', { name: 'Notes' });

    expect(ref.current).toBe(textarea);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('does not forward the RHF name as a DOM attribute', () => {
    renderWithForm<Values>({ defaultValues: { notes: 'Hello' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" />
    ));

    expect(screen.getByRole('textbox', { name: 'Notes' })).not.toHaveAttribute('name');
  });

  it('merges the caller class with the Textarea root', () => {
    renderWithForm<Values>({ defaultValues: { notes: 'Hello' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" className="caller" />
    ));

    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    const root = textarea.closest('span');

    expect(root).toHaveClass('caller');
  });

  it('merges the caller blur handler with the RHF blur handler', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>({ defaultValues: { notes: 'Hello' } }, form => (
      <FormTextareaField control={form.control} name="notes" label="Notes" onBlur={onBlur} />
    ));

    fireEvent.blur(screen.getByRole('textbox', { name: 'Notes' }));

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('notes').isTouched).toBe(true);
  });

  it('passes native textarea props through', () => {
    renderWithForm<Values>({ defaultValues: { notes: '' } }, form => (
      <FormTextareaField
        control={form.control}
        name="notes"
        label="Notes"
        rows={6}
        resize="vertical"
        data-testid="notes-field"
      />
    ));

    const textarea = screen.getByTestId('notes-field');

    expect(textarea).toHaveAttribute('rows', '6');
    expect(textarea).toHaveClass('fui-Textarea__textarea');
  });
});
