import { Option } from '@fluentui/react-components';
import { fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormComboboxField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
  color?: string;
};

const getOptionText = (value: string): string | undefined =>
  ({ red: 'Red', blue: 'Blue', green: 'Green' })[value];

function ColorOptions() {
  return (
    <>
      <Option value="red">Red</Option>
      <Option value="blue">Blue</Option>
      <Option value="green">Green</Option>
    </>
  );
}

describe('FormComboboxField internals', () => {
  it('forwards the ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        ref={ref}
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    const input = screen.getByRole('combobox', { name: 'Color' });

    expect(ref.current).toBe(input);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('does not forward the RHF name as a DOM attribute', () => {
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

    expect(screen.getByRole('combobox', { name: 'Color' })).not.toHaveAttribute('name');
  });

  it('merges the caller class with the Combobox root', () => {
    renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormComboboxField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        className="caller"
      >
        <ColorOptions />
      </FormComboboxField>
    ));

    const input = screen.getByRole('combobox', { name: 'Color' });

    expect(input.closest('div')).toHaveClass('caller');
  });

  it('merges the caller blur handler with the RHF blur handler', () => {
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

  it('keeps typed text local until an option is selected', () => {
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

  it('reverts typed text when the popup closes without a selection', () => {
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

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input).toHaveValue('Blue');
    expect(form.getValues('color')).toBe('blue');
  });
});
