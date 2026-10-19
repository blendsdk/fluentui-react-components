import { Option } from '@fluentui/react-components';
import { fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormDropdownField } from '../src/index';
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

describe('FormDropdownField internals', () => {
  it('forwards the ref to the trigger button', () => {
    const ref = createRef<HTMLButtonElement>();
    renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormDropdownField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        ref={ref}
      >
        <ColorOptions />
      </FormDropdownField>
    ));

    const button = screen.getByRole('combobox', { name: 'Color' });

    expect(ref.current).toBe(button);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('does not forward the RHF name as a DOM attribute', () => {
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

    expect(screen.getByRole('combobox', { name: 'Color' })).not.toHaveAttribute('name');
  });

  it('merges the caller class with the Dropdown root', () => {
    renderWithForm<Values>({ defaultValues: { color: 'blue' } }, form => (
      <FormDropdownField
        control={form.control}
        name="color"
        label="Color"
        getOptionText={getOptionText}
        className="caller"
      >
        <ColorOptions />
      </FormDropdownField>
    ));

    const button = screen.getByRole('combobox', { name: 'Color' });

    expect(button.closest('div')).toHaveClass('caller');
  });

  it('merges the caller blur handler with the RHF blur handler', () => {
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

    fireEvent.blur(screen.getByRole('combobox', { name: 'Color' }));

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('color').isTouched).toBe(true);
  });

  it('uses the resolved text for the trigger value', () => {
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

    const button = screen.getByRole('combobox', { name: 'Color' });

    expect(button).toHaveAttribute('value', 'Blue');
    expect(button).toHaveTextContent('Blue');
  });
});
