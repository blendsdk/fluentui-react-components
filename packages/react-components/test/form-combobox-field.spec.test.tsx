import { Option } from '@fluentui/react-components';
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormComboboxField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
  color?: string;
};

const optionText: Record<string, string> = {
  red: 'Red',
  blue: 'Blue',
  green: 'Green',
};

const getOptionText = (value: string): string | undefined => optionText[value];

function ColorOptions() {
  return (
    <>
      <Option value="red">Red</Option>
      <Option value="blue">Blue</Option>
      <Option value="green">Green</Option>
    </>
  );
}

describe('FormComboboxField', () => {
  it('renders the label and the resolved selected text', () => {
    renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    const input = screen.getByRole('combobox', { name: 'Color' });

    expect(input).toHaveValue('Blue');
  });

  it('updates the input text without committing while typing', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        inlinePopup
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    const input = screen.getByRole('combobox', { name: 'Color' });
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'blu' } });

    expect(input).toHaveValue('blu');
    expect(form.getValues('color')).toBe('blue');
  });

  it('commits the option value and displays its text when an option is selected', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { color: '' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        inlinePopup
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    const input = screen.getByRole('combobox', { name: 'Color' });
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'Blu' } });
    fireEvent.click(screen.getByRole('option', { name: 'Blue' }));

    expect(form.getValues('color')).toBe('blue');
    expect(input).toHaveValue('Blue');
  });

  it('reverts uncommitted typing on blur', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        inlinePopup
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    const input = screen.getByRole('combobox', { name: 'Color' });
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'xyz' } });
    expect(input).toHaveValue('xyz');

    fireEvent.blur(input);

    expect(input).toHaveValue('Blue');
    expect(form.getValues('color')).toBe('blue');
  });

  it('clears the selection and the input text', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        clearable
        inlinePopup
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    const input = screen.getByRole('combobox', { name: 'Color' });
    // Fluent renders the Combobox clear affordance as a decorative span, not
    // a button, so the test targets its documented class rather than a role.
    const clearIcon = input.parentElement?.querySelector('.fui-Combobox__clearIcon');

    expect(clearIcon).not.toBeNull();
    fireEvent.click(clearIcon!);

    expect(form.getValues('color')).toBe('');
    expect(input).toHaveValue('');
  });

  it('clears through an explicit empty-value option', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        inlinePopup
      >
        <ColorOptions />
        <Option value="">None</Option>
      </FormComboboxField>
    ));

    const input = screen.getByRole('combobox', { name: 'Color' });
    fireEvent.click(input);
    fireEvent.click(screen.getByRole('option', { name: 'None' }));

    expect(form.getValues('color')).toBe('');
    expect(input).toHaveValue('');
  });

  it('marks the field touched on blur and calls a caller onBlur', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        onBlur={onBlur}
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    fireEvent.blur(screen.getByRole('combobox', { name: 'Color' }));

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('color').isTouched).toBe(true);
  });

  it('shows a server error and associates it with the input', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    act(() => {
      form.setError('color', { type: 'server', message: 'Pick a color' });
    });

    const input = screen.getByRole('combobox', { name: 'Color' });
    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Pick a color');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('exposes the required state on the input', () => {
    renderWithForm<Values>({ defaultValues: { color: '' } }, form => (
      <FormComboboxField control={form.control} name="color" label="Color" required>
        <ColorOptions />
      </FormComboboxField>
    ));

    const input = screen.getByRole('combobox', { name: 'Color' });
    const label = screen.getByText('Color').closest('label');

    expect(input).toHaveAttribute('required');
    expect(label).toHaveTextContent('*');
  });

  it('disables the input through the prop and the form-level state', () => {
    const first = renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        disabled
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    expect(screen.getByRole('combobox', { name: 'Color' })).toBeDisabled();
    first.unmount();

    renderWithForm<Values>({ defaultValues: { color: 'blue' }, disabled: true }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    expect(screen.getByRole('combobox', { name: 'Color' })).toBeDisabled();
  });

  it('renders the hint and associates the label with the input', () => {
    renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        hint="Choose the accent color"
        getOptionText={getOptionText}
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    const input = screen.getByRole('combobox', { name: 'Color' });
    const label = screen.getByText('Color').closest('label');

    expect(input).toHaveAccessibleDescription('Choose the accent color');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('updates the input text after reset and setValue', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    act(() => {
      form.reset({ color: 'red' });
    });
    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveValue('Red');

    act(() => {
      form.setValue('color', 'green');
    });
    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveValue('Green');
  });
});
