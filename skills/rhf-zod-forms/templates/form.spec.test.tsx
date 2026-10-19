import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { describe, expect, it, vi } from 'vitest';
import { ProjectDialog } from './FormDialog';
import { projectFormDefaults, type ProjectFormValues } from './FormSchema';

function renderDialog(
  onSave: (values: ProjectFormValues) => Promise<void>,
  defaultValues: ProjectFormValues = projectFormDefaults
) {
  return render(
    <FluentProvider theme={webLightTheme}>
      <ProjectDialog
        open
        defaultValues={defaultValues}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />
    </FluentProvider>
  );
}

describe('ProjectDialog', () => {
  it('rejects an empty required field without saving', async () => {
    const onSave = vi.fn();

    renderDialog(onSave);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits the parsed number and the selected values', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderDialog(onSave);
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Apollo' },
    });
    fireEvent.change(screen.getByLabelText('Budget'), {
      target: { value: '42' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Apollo',
        budget: 42,
        status: 'planned',
        startDate: null,
        active: false,
      })
    );
  });

  it('keeps the dialog open and shows the mapped server error', async () => {
    const onSave = vi.fn().mockRejectedValue({
      field: 'name',
      message: 'That name is already taken',
    });

    renderDialog(onSave);
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Apollo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('That name is already taken')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
  });
});
