import * as z from 'zod';

/**
 * Application-owned schema for the project form.
 *
 * Keep messages next to the rule they describe. The field wrappers render the
 * message from `fieldState.error?.message`; no second error mapping is needed.
 */
export const projectSchema = z.object({
  name: z
    .string()
    .min(1, { error: 'Name is required' })
    .max(120, { error: 'Name must be 120 characters or fewer' }),
  description: z
    .string()
    .max(2000, { error: 'Description must be 2000 characters or fewer' })
    .optional(),
  budget: z.number().nonnegative({ error: 'Budget cannot be negative' }).optional(),
  status: z.enum(['planned', 'active', 'archived']),
  startDate: z.date().nullable(),
  active: z.boolean(),
});

/** Values used by the fields and by React Hook Form. */
export type ProjectFormValues = z.infer<typeof projectSchema>;

/** Input type of the schema; equal to the output until transforms are added. */
export type ProjectFormInput = z.input<typeof projectSchema>;

/** Output type of the schema; submit this type when transforms are added. */
export type ProjectFormOutput = z.output<typeof projectSchema>;

/** Default values for a new project. */
export const projectFormDefaults: ProjectFormValues = {
  name: '',
  description: '',
  budget: undefined,
  status: 'planned',
  startDate: null,
  active: false,
};
