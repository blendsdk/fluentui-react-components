import { fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormTextField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
  name: string;
};

describe('FormTextField internals', () => {
  it('forwards the ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    renderWithForm<Values>({ defaultValues: { name: 'Ada' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" ref={ref} />
    ));

    const input = screen.getByRole('textbox', { name: 'Name' });

    expect(ref.current).toBe(input);

    input.focus();
    expect(input).toHaveFocus();
  });

  it('does not forward the RHF name as a DOM attribute', () => {
    renderWithForm<Values>({ defaultValues: { name: 'Ada' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" />
    ));

    expect(screen.getByRole('textbox', { name: 'Name' })).not.toHaveAttribute('name');
  });

  it('merges the caller class with the Input root', () => {
    renderWithForm<Values>({ defaultValues: { name: 'Ada' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" className="caller" />
    ));

    const input = screen.getByRole('textbox', { name: 'Name' });
    const root = input.closest('span');

    expect(root).toHaveClass('caller');
  });

  it('merges the caller blur handler with the RHF blur handler', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>({ defaultValues: { name: 'Ada' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" onBlur={onBlur} />
    ));

    fireEvent.blur(screen.getByRole('textbox', { name: 'Name' }));

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('name').isTouched).toBe(true);
  });

  it('passes native input props through', () => {
    renderWithForm<Values>({ defaultValues: { name: 'ada@example.com' } }, form => (
      <FormTextField
        control={form.control}
        name="name"
        label="Email"
        type="email"
        autoComplete="email"
        data-testid="email-field"
      />
    ));

    const input = screen.getByTestId('email-field');

    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });
});
