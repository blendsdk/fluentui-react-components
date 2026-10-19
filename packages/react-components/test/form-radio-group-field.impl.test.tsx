import { Radio } from '@fluentui/react-components';
import { fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { FormRadioGroupField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
  plan: string;
};

function renderPlan(
  form: UseFormReturn<Values>,
  props: Partial<{ className: string; onBlur: () => void; disabled: boolean }> = {}
) {
  return (
    <FormRadioGroupField
      control={form.control}
      name="plan"
      label="Plan"
      className={props.className}
      onBlur={props.onBlur}
      disabled={props.disabled}
    >
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
    </FormRadioGroupField>
  );
}

describe('FormRadioGroupField internals', () => {
  it('forwards the ref to the group root', () => {
    const ref = createRef<HTMLDivElement>();
    renderWithForm<Values>({ defaultValues: { plan: '' } }, form => (
      <FormRadioGroupField control={form.control} name="plan" label="Plan" ref={ref}>
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
      </FormRadioGroupField>
    ));

    const group = screen.getByRole('radiogroup', { name: 'Plan' });

    expect(ref.current).toBe(group);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('does not forward the RHF name to the group or the radios', () => {
    renderWithForm<Values>({ defaultValues: { plan: '' } }, form => renderPlan(form));

    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    const radio = screen.getByRole('radio', { name: 'Free' });

    expect(group).not.toHaveAttribute('name');
    expect(radio.getAttribute('name')).not.toBe('plan');
  });

  it('merges the caller class with the group root', () => {
    renderWithForm<Values>({ defaultValues: { plan: '' } }, form =>
      renderPlan(form, { className: 'caller' })
    );

    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toHaveClass('caller');
  });

  it('merges the caller blur handler with the RHF blur handler', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>({ defaultValues: { plan: '' } }, form =>
      renderPlan(form, { onBlur })
    );

    fireEvent.blur(screen.getByRole('radio', { name: 'Free' }));

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('plan').isTouched).toBe(true);
  });

  it('disables the group through the form-level state', () => {
    renderWithForm<Values>({ defaultValues: { plan: '' }, disabled: true }, form =>
      renderPlan(form)
    );

    expect(screen.getByRole('radio', { name: 'Free' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeDisabled();
  });
});
