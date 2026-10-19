import { Radio } from '@fluentui/react-components';
import { act, fireEvent, screen } from '@testing-library/react';
import type { UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { FormRadioGroupField } from '../src/index';
import { renderWithForm } from './form-test-utils';

type Values = {
  plan: string;
};

function PlanField({ form }: { form: UseFormReturn<Values> }) {
  return (
    <FormRadioGroupField control={form.control} name="plan" label="Plan">
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
    </FormRadioGroupField>
  );
}

describe('FormRadioGroupField', () => {
  it('renders the group label and no selection', () => {
    renderWithForm<Values>({ defaultValues: { plan: '' } }, form => <PlanField form={form} />);

    const group = screen.getByRole('radiogroup', { name: 'Plan' });

    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Free' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Pro' })).not.toBeChecked();
  });

  it('updates the form value when a radio is selected', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { plan: '' } }, form => (
      <PlanField form={form} />
    ));

    fireEvent.click(screen.getByRole('radio', { name: 'Pro' }));

    expect(form.getValues('plan')).toBe('pro');
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked();
  });

  it('replaces the selection when another radio is chosen', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { plan: 'free' } }, form => (
      <PlanField form={form} />
    ));

    fireEvent.click(screen.getByRole('radio', { name: 'Pro' }));

    expect(form.getValues('plan')).toBe('pro');
    expect(screen.getByRole('radio', { name: 'Free' })).not.toBeChecked();
  });

  it('marks the field touched on blur and calls a caller onBlur', () => {
    const onBlur = vi.fn();
    const { form } = renderWithForm<Values>({ defaultValues: { plan: '' } }, form => (
      <FormRadioGroupField control={form.control} name="plan" label="Plan" onBlur={onBlur}>
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
      </FormRadioGroupField>
    ));

    const radio = screen.getByRole('radio', { name: 'Free' });
    fireEvent.focus(radio);
    fireEvent.blur(radio);

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form.getFieldState('plan').isTouched).toBe(true);
  });

  it('shows a server error and associates it with the group', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { plan: '' } }, form => (
      <PlanField form={form} />
    ));

    act(() => {
      form.setError('plan', { type: 'server', message: 'Choose a plan' });
    });

    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Choose a plan');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('exposes the required state on the group', () => {
    renderWithForm<Values>({ defaultValues: { plan: '' } }, form => (
      <FormRadioGroupField control={form.control} name="plan" label="Plan" required>
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
      </FormRadioGroupField>
    ));

    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    const label = screen.getByText('Plan').closest('label');

    expect(group).toHaveAttribute('aria-required', 'true');
    expect(label).toHaveTextContent('*');
  });

  it('disables every radio through the prop and the form-level state', () => {
    const first = renderWithForm<Values>({ defaultValues: { plan: '' } }, form => (
      <FormRadioGroupField control={form.control} name="plan" label="Plan" disabled>
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
      </FormRadioGroupField>
    ));

    expect(screen.getByRole('radio', { name: 'Free' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeDisabled();
    first.unmount();

    renderWithForm<Values>({ defaultValues: { plan: '' }, disabled: true }, form => (
      <FormRadioGroupField control={form.control} name="plan" label="Plan">
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
      </FormRadioGroupField>
    ));

    expect(screen.getByRole('radio', { name: 'Free' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeDisabled();
  });

  it('renders the hint as the group description', () => {
    renderWithForm<Values>({ defaultValues: { plan: '' } }, form => (
      <FormRadioGroupField
        control={form.control}
        name="plan"
        label="Plan"
        hint="You can change this later"
      >
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
      </FormRadioGroupField>
    ));

    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toHaveAccessibleDescription(
      'You can change this later'
    );
  });

  it('keeps the group name and the individual radio names', () => {
    renderWithForm<Values>({ defaultValues: { plan: 'pro' } }, form => <PlanField form={form} />);

    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Free' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked();
  });

  it('updates the selection after reset', () => {
    const { form } = renderWithForm<Values>({ defaultValues: { plan: 'pro' } }, form => (
      <PlanField form={form} />
    ));

    act(() => {
      form.reset({ plan: 'free' });
    });

    expect(screen.getByRole('radio', { name: 'Free' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Pro' })).not.toBeChecked();
  });
});
