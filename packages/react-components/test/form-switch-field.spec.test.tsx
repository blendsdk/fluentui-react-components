import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormSwitchField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
  enabled: boolean;
};

describe('FormSwitchField', () => {
  it('renders the label and the unchecked state', () => {
    renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField control={form.control} name="enabled" label="Enable feature" />
    ));

    expect(screen.getByRole('switch', { name: 'Enable feature' })).not.toBeChecked();
  });

  it('updates the form value when the switch is toggled', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField control={form.control} name="enabled" label="Enable feature" />
    ));

    const control = screen.getByRole('switch', { name: 'Enable feature' });

    fireEvent.click(control);
    expect(form.getValues('enabled')).toBe(true);

    fireEvent.click(control);
    expect(form.getValues('enabled')).toBe(false);
  });

  it('marks the field touched on blur and calls a caller onBlur', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField
        control={form.control}
        name="enabled"
        label="Enable feature"
        onBlur={onBlur}
      />
    ));

    const control = screen.getByRole('switch', { name: 'Enable feature' });
    fireEvent.focus(control);
    fireEvent.blur(control);

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('enabled').isTouched).toBe(true);
  });

  it('shows a server error and associates it with the hidden input', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField control={form.control} name="enabled" label="Enable feature" />
    ));

    act(() => {
      form.setError('enabled', { type: 'server', message: 'Must be on' });
    });

    const control = screen.getByRole('switch', { name: 'Enable feature' });
    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Must be on');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('exposes the required state with exactly one label', () => {
    renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField control={form.control} name="enabled" label="Enable feature" required />
    ));

    const control = screen.getByRole('switch', { name: 'Enable feature' });
    const label = screen.getByText('Enable feature').closest('label');

    expect(control).toHaveAttribute('required');
    expect(label).toHaveTextContent('*');
    expect(screen.getAllByText('Enable feature')).toHaveLength(1);
  });

  it('supports disabled and disabledFocusable', () => {
    const first = renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField control={form.control} name="enabled" label="Enable feature" disabled />
    ));

    expect(screen.getByRole('switch', { name: 'Enable feature' })).toBeDisabled();
    first.unmount();

    const focusable = renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
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
    control.focus();
    expect(control).toHaveFocus();
    focusable.unmount();

    renderWithForm<Values>({ defaultValues: { enabled: false }, disabled: true }, form => (
      <FormSwitchField control={form.control} name="enabled" label="Enable feature" />
    ));

    expect(screen.getByRole('switch', { name: 'Enable feature' })).toBeDisabled();
  });

  it('renders the hint as the accessible description', () => {
    renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField
        control={form.control}
        name="enabled"
        label="Enable feature"
        hint="This turns on the feature for your workspace"
      />
    ));

    expect(screen.getByRole('switch', { name: 'Enable feature' })).toHaveAccessibleDescription(
      'This turns on the feature for your workspace'
    );
  });

  it('associates the primitive label with the hidden input', () => {
    renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField control={form.control} name="enabled" label="Enable feature" />
    ));

    const control = screen.getByRole('switch', { name: 'Enable feature' });
    const label = screen.getByText('Enable feature').closest('label');

    expect(label).toHaveAttribute('for', control.id);
  });

  it('updates the checked state after reset', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { enabled: false } }, form => (
      <FormSwitchField control={form.control} name="enabled" label="Enable feature" />
    ));

    act(() => {
      form.reset({ enabled: true });
    });

    expect(screen.getByRole('switch', { name: 'Enable feature' })).toBeChecked();
  });
});
