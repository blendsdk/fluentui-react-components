import { useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  MessageBar,
  MessageBarBody,
  Option,
} from '@fluentui/react-components';
import {
  FormCheckboxField,
  FormDatePickerField,
  FormDropdownField,
  FormTextareaField,
  FormTextField,
} from '@blendsdk/fluentui-react-components';
import type { ProjectFormValues } from './FormSchema';
import { useProjectForm } from './useFormLogic';

export type ProjectDialogProps = {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Values restored whenever the dialog opens. Keep this object stable. */
  defaultValues: ProjectFormValues;
  /** Notifies the parent when Fluent requests a close. */
  onOpenChange: (open: boolean) => void;
  /** Persists the validated values. Reject to keep the dialog open. */
  onSave: (values: ProjectFormValues) => Promise<void>;
};

/**
 * Dialog form that demonstrates the full RHF + Zod + field-wrapper workflow.
 *
 * The dialog resets when it opens, validates on submit, maps server failures
 * onto the matching field or a form-level message, and closes only after the
 * save succeeds.
 */
export function ProjectDialog({
  open,
  defaultValues,
  onOpenChange,
  onSave,
}: ProjectDialogProps) {
  const form = useProjectForm(defaultValues);
  const rootError = form.formState.errors.root?.server?.message;

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const submit = form.handleSubmit(async values => {
    try {
      await onSave(values);
      onOpenChange(false);
    } catch (error) {
      if (isFieldError(error)) {
        form.setError(error.field, {
          type: 'server',
          message: error.message,
        });
        form.setFocus(error.field);
        return;
      }

      form.setError('root.server', {
        type: 'server',
        message: 'The server could not save the form. Try again.',
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <form onSubmit={submit} noValidate>
          <DialogBody>
            <DialogTitle>Project</DialogTitle>
            <DialogContent>
              {rootError ? (
                <MessageBar intent="error">
                  <MessageBarBody>{rootError}</MessageBarBody>
                </MessageBar>
              ) : null}

              <FormTextField
                control={form.control}
                name="name"
                label="Name"
                hint="Shown in the project list"
                required
              />
              <FormTextareaField
                control={form.control}
                name="description"
                label="Description"
                resize="vertical"
              />
              <FormTextField
                control={form.control}
                name="budget"
                label="Budget"
                hint="Optional; whole units"
                type="number"
                parse={value => (value === '' ? undefined : Number(value))}
              />
              <FormDropdownField control={form.control} name="status" label="Status">
                <Option value="planned">Planned</Option>
                <Option value="active">Active</Option>
                <Option value="archived">Archived</Option>
              </FormDropdownField>
              <FormDatePickerField
                control={form.control}
                name="startDate"
                label="Start date"
              />
              <FormCheckboxField
                control={form.control}
                name="active"
                label="Active project"
              />
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
}

type FieldError = {
  field: keyof ProjectFormValues;
  message: string;
};

/**
 * Narrows an unknown server rejection to a field error.
 *
 * Replace this shape with the application's API error contract. Do not render
 * raw server messages without an explicit decision.
 *
 * @param error - the rejected value
 * @returns `true` when the value carries a field path and a message
 */
function isFieldError(error: unknown): error is FieldError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'field' in error &&
    'message' in error
  );
}
