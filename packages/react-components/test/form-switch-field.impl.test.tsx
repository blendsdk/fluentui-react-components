import { fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormSwitchField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
  enabled: boolean;
};

describe('FormSwitchField internals', () => {
  it('forwards the ref to the hidden input', () => {
    const ref = createRef<HTMLInputElement>();
    renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField control={form.control} name="enabled" label="Enable feature" ref={ref} />
    ));

    const control = screen.getByRole('switch', { name: 'Enable feature' });

    expect(ref.current).toBe(control);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('does not forward the RHF name as a DOM attribute', () => {
    renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField control={form.control} name="enabled" label="Enable feature" />
    ));

    expect(screen.getByRole('switch', { name: 'Enable feature' })).not.toHaveAttribute('name');
  });

  it('merges the caller class with the Switch root', () => {
    renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField
        control={form.control}
        name="enabled"
        label="Enable feature"
        className="caller"
      />
    ));

    const control = screen.getByRole('switch', { name: 'Enable feature' });

    expect(control.closest('div')).toHaveClass('caller');
  });

  it('merges the caller blur handler with the RHF blur handler', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField
        control={form.control}
        name="enabled"
        label="Enable feature"
        onBlur={onBlur}
      />
    ));

    fireEvent.blur(screen.getByRole('switch', { name: 'Enable feature' }));

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('enabled').isTouched).toBe(true);
  });

  it('passes disabledFocusable through to the primitive', () => {
    renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField
        control={form.control}
        name="enabled"
        label="Enable feature"
        disabledFocusable
      />
    ));

    const control = screen.getByRole('switch', { name: 'Enable feature' });

    expect(control).toHaveAttribute('aria-disabled', 'true');
    expect(control).not.toBeDisabled();
  });
});
