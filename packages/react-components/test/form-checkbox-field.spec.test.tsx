import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormCheckboxField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
  active: boolean;
  mixed?: 'mixed';
};

describe('FormCheckboxField', () => {
  it('renders the label and the unchecked state', () => {
    renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField control={form.control} name="active" label="Enable feature" />
    ));

    expect(screen.getByRole('checkbox', { name: 'Enable feature' })).not.toBeChecked();
  });

  it('updates the form value when the checkbox is toggled', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField control={form.control} name="active" label="Enable feature" />
    ));

    const checkbox = screen.getByRole('checkbox', { name: 'Enable feature' });

    fireEvent.click(checkbox);
    expect(form.getValues('active')).toBe(true);

    fireEvent.click(checkbox);
    expect(form.getValues('active')).toBe(false);
  });

  it('marks the field touched on blur and calls a caller onBlur', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField
        control={form.control}
        name="active"
        label="Enable feature"
        onBlur={onBlur}
      />
    ));

    const checkbox = screen.getByRole('checkbox', { name: 'Enable feature' });
    fireEvent.focus(checkbox);
    fireEvent.blur(checkbox);

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('active').isTouched).toBe(true);
  });

  it('shows a server error and associates it with the hidden input', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField control={form.control} name="active" label="Enable feature" />
    ));

    act(() => {
      form.setError('active', { type: 'server', message: 'Required' });
    });

    const checkbox = screen.getByRole('checkbox', { name: 'Enable feature' });
    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Required');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('exposes the required state with exactly one label', () => {
    renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField control={form.control} name="active" label="Enable feature" required />
    ));

    const checkbox = screen.getByRole('checkbox', { name: 'Enable feature' });
    const label = screen.getByText('Enable feature').closest('label');

    expect(checkbox).toHaveAttribute('required');
    expect(label).toHaveTextContent('*');
    expect(screen.getAllByText('Enable feature')).toHaveLength(1);
  });

  it('disables the checkbox', () => {
    renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField
        control={form.control}
        name="active"
        label="Enable feature"
        disabled
      />
    ));

    const checkbox = screen.getByRole('checkbox', { name: 'Enable feature' });

    expect(checkbox).toBeDisabled();
  });

  it('renders the hint as the accessible description', () => {
    renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField
        control={form.control}
        name="active"
        label="Enable feature"
        hint="This turns on the feature for your workspace"
      />
    ));

    expect(screen.getByRole('checkbox', { name: 'Enable feature' })).toHaveAccessibleDescription(
      'This turns on the feature for your workspace'
    );
  });

  it('associates the primitive label with the hidden input', () => {
    renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField control={form.control} name="active" label="Enable feature" />
    ));

    const checkbox = screen.getByRole('checkbox', { name: 'Enable feature' });
    const label = screen.getByText('Enable feature').closest('label');

    expect(label).toHaveAttribute('for', checkbox.id);
  });

  it('updates the checked state after reset', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { active: false } }, form => (
      <FormCheckboxField control={form.control} name="active" label="Enable feature" />
    ));

    act(() => {
      form.reset({ active: true });
    });

    expect(screen.getByRole('checkbox', { name: 'Enable feature' })).toBeChecked();
  });

  it('renders the mixed state as indeterminate', async () => {
    renderWithForm<Values>({ defaultValues: { mixed: 'mixed' } }, form => (
      <FormCheckboxField control={form.control} name="mixed" label="Partially selected" />
    ));

    const checkbox = screen.getByRole('checkbox', {
      name: 'Partially selected',
    }) as HTMLInputElement;

    await waitFor(() => expect(checkbox.indeterminate).toBe(true));
  });
});
