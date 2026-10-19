import { Option } from '@fluentui/react-components';
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormDropdownField } from '../src/index';
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

describe('FormDropdownField', () => {
  it('renders the label and the placeholder when there is no value', () => {
    renderWithForm<Values>({ defaultValues: { color: undefined } }, form => (
      <FormDropdownField
        control={form.control}
        name="color"
        label="Color"
        placeholder="Pick a color"
      >
        <ColorOptions />
      </FormDropdownField>
    ));

    const button = screen.getByRole('combobox', { name: 'Color' });

    expect(button).toHaveTextContent('Pick a color');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays the resolved text for the stored option value', () => {
    renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormDropdownField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
      >
        <ColorOptions />
      </FormDropdownField>
    ));

    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveTextContent('Blue');
  });

  it('falls back to the raw value when no resolver is supplied', () => {
    renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormDropdownField control={form.control} name="color" label="Color">
        <ColorOptions />
      </FormDropdownField>
    ));

    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveTextContent('blue');
  });

  it('commits an option value and displays its text', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { color: undefined } }, form => (
      <FormDropdownField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        inlinePopup
      >
        <ColorOptions />
      </FormDropdownField>
    ));

    const button = screen.getByRole('combobox', { name: 'Color' });
    fireEvent.click(button);
    fireEvent.click(screen.getByRole('option', { name: 'Green' }));

    expect(form.getValues('color')).toBe('green');
    expect(button).toHaveTextContent('Green');
  });

  it('clears the value and removes the selection', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormDropdownField
        control={form.control}
        name="color"
        label="Color"
        placeholder="Pick a color"
        getOptionText={getOptionText}
        clearable
      >
        <ColorOptions />
      </FormDropdownField>
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(form.getValues('color')).toBe('');
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
  });

  it('marks the field touched on blur and calls a caller onBlur', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormDropdownField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        onBlur={onBlur}
      >
        <ColorOptions />
      </FormDropdownField>
    ));

    const button = screen.getByRole('combobox', { name: 'Color' });
    fireEvent.focus(button);
    fireEvent.blur(button);

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('color').isTouched).toBe(true);
  });

  it('shows a server error and associates it with the trigger', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormDropdownField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
      >
        <ColorOptions />
      </FormDropdownField>
    ));

    act(() => {
      form.setError('color', { type: 'server', message: 'Pick a color' });
    });

    const button = screen.getByRole('combobox', { name: 'Color' });
    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Pick a color');
    expect(button).toHaveAttribute('aria-invalid', 'true');
    expect(button.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('exposes the required state on the trigger', () => {
    renderWithForm<Values>({ defaultValues: { color: undefined } }, form => (
      <FormDropdownField control={form.control} name="color" label="Color" required>
        <ColorOptions />
      </FormDropdownField>
    ));

    const button = screen.getByRole('combobox', { name: 'Color' });
    const label = screen.getByText('Color').closest('label');

    expect(button).toHaveAttribute('aria-required', 'true');
    expect(label).toHaveTextContent('*');
  });

  it('disables the trigger', () => {
    renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormDropdownField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        disabled
      >
        <ColorOptions />
      </FormDropdownField>
    ));

    expect(screen.getByRole('combobox', { name: 'Color' })).toBeDisabled();
  });

  it('renders the hint and associates the label with the trigger', () => {
    renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormDropdownField
        control={form.control}
        name="color"
        label="Color"
        hint="Choose the accent color"
        getOptionText={getOptionText}
      >
        <ColorOptions />
      </FormDropdownField>
    ));

    const button = screen.getByRole('combobox', { name: 'Color' });
    const label = screen.getByText('Color').closest('label');

    expect(button).toHaveAccessibleDescription('Choose the accent color');
    expect(label).toHaveAttribute('for', button.id);
  });

  it('updates the display after reset and setValue', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormDropdownField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
      >
        <ColorOptions />
      </FormDropdownField>
    ));

    act(() => {
      form.reset({ color: 'red' });
    });
    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveTextContent('Red');

    act(() => {
      form.setValue('color', 'green');
    });
    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveTextContent('Green');
  });
});
