import { fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormCheckboxField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
  active: boolean;
};

describe('FormCheckboxField internals', () => {
  it('forwards the ref to the hidden input', () => {
    const ref = createRef<HTMLInputElement>();
    renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField control={form.control} name="active" label="Enable feature" ref={ref} />
    ));

    const checkbox = screen.getByRole('checkbox', { name: 'Enable feature' });

    expect(ref.current).toBe(checkbox);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('does not forward the RHF name as a DOM attribute', () => {
    renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField control={form.control} name="active" label="Enable feature" />
    ));

    expect(screen.getByRole('checkbox', { name: 'Enable feature' })).not.toHaveAttribute('name');
  });

  it('merges the caller class with the Checkbox root', () => {
    renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField
        control={form.control}
        name="active"
        label="Enable feature"
        className="caller"
      />
    ));

    const checkbox = screen.getByRole('checkbox', { name: 'Enable feature' });

    expect(checkbox.closest('span')).toHaveClass('caller');
  });

  it('merges the caller blur handler with the RHF blur handler', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField
        control={form.control}
        name="active"
        label="Enable feature"
        onBlur={onBlur}
      />
    ));

    fireEvent.blur(screen.getByRole('checkbox', { name: 'Enable feature' }));

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('active').isTouched).toBe(true);
  });
});
