import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormTextField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
  name: string;
  height?: number;
};

describe('FormTextField', () => {
  it('renders the label and the current value', () => {
    renderWithForm<Values>({ defaultValues: { name: 'Ada' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" />
    ));

    const input = screen.getByRole('textbox', { name: 'Name' });

    expect(input).toHaveValue('Ada');
  });

  it('updates the form value when the user types', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { name: '' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" />
    ));

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Lovelace' },
    });

    expect(form.getValues('name')).toBe('Lovelace');
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Lovelace');
  });

  it('marks the field touched on blur and calls a caller onBlur', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>({ defaultValues: { name: 'Ada' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" onBlur={onBlur} />
    ));

    const input = screen.getByRole('textbox', { name: 'Name' });
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('name').isTouched).toBe(true);
  });

  it('shows a server error and associates it with the control', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { name: 'Ada' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" />
    ));

    act(() => {
      form.setError('name', { type: 'server', message: 'Name is taken' });
    });

    const input = screen.getByRole('textbox', { name: 'Name' });
    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Name is taken');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('exposes the required state and marker', () => {
    renderWithForm<Values>({ defaultValues: { name: '' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" required />
    ));

    const input = screen.getByRole('textbox', { name: 'Name' });
    const label = screen.getByText('Name').closest('label');

    expect(input).toHaveAttribute('required');
    expect(label).toHaveTextContent('*');
  });

  it('disables the input through the prop and the form-level state', () => {
    const first = renderWithForm<Values>({ defaultValues: { name: 'Ada' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" disabled />
    ));

    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
    first.unmount();

    const second = renderWithForm<Values>(
      { defaultValues: { name: 'Ada' }, disabled: true },
      form => <FormTextField control={form.control} name="name" label="Name" />
    );

    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
    expect(second.form.getValues('name')).toBe('Ada');
  });

  it('keeps a read-only value visible and focusable', () => {
    renderWithForm<Values>({ defaultValues: { name: 'Ada' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" readOnly />
    ));

    const input = screen.getByRole('textbox', { name: 'Name' });

    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveValue('Ada');

    input.focus();
    expect(input).toHaveFocus();
  });

  it('renders the hint as the accessible description', () => {
    renderWithForm<Values>({ defaultValues: { name: '' } }, form => (
      <FormTextField
        control={form.control}
        name="name"
        label="Name"
        hint="Use the name on your passport"
      />
    ));

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription(
      'Use the name on your passport'
    );
  });

  it('associates the label with the control', () => {
    renderWithForm<Values>({ defaultValues: { name: '' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" />
    ));

    const input = screen.getByRole('textbox', { name: 'Name' });
    const label = screen.getByText('Name').closest('label');

    expect(label).toHaveAttribute('for', input.id);
  });

  it('parses numeric input while keeping partial text visible', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { height: 5 } }, form => (
      <FormTextField
        control={form.control}
        name="height"
        label="Height"
        parse={value => (value === '' ? undefined : Number(value))}
      />
    ));

    const input = screen.getByRole('textbox', { name: 'Height' });

    fireEvent.change(input, { target: { value: '42' } });
    expect(form.getValues('height')).toBe(42);
    expect(input).toHaveValue('42');

    fireEvent.change(input, { target: { value: '1.' } });
    expect(form.getValues('height')).toBe(1);
    expect(input).toHaveValue('1.');

    fireEvent.change(input, { target: { value: '-' } });
    expect(form.getValues('height')).toBeNaN();
    expect(input).toHaveValue('-');
  });

  it('updates the displayed value after reset', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { name: 'Ada', height: 5 } }, form => (
      <>
        <FormTextField control={form.control} name="name" label="Name" />
        <FormTextField
          control={form.control}
          name="height"
          label="Height"
          parse={value => (value === '' ? undefined : Number(value))}
        />
      </>
    ));

    act(() => {
      form.reset({ name: 'Grace', height: 12 });
    });

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Grace');
    expect(screen.getByRole('textbox', { name: 'Height' })).toHaveValue('12');
  });

  it('clears the error when the form clears it', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { name: 'Ada' } }, form => (
      <FormTextField control={form.control} name="name" label="Name" />
    ));

    act(() => {
      form.setError('name', { type: 'server', message: 'Name is taken' });
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Name is taken');

    act(() => {
      form.clearErrors('name');
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).not.toHaveAttribute('aria-invalid');
  });
});
