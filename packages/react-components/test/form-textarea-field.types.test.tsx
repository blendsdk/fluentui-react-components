import { describe, expect, it } from 'vitest';
import type { Control } from 'react-hook-form';
import type { FormTextareaFieldProps } from '../src/index';
import { FormTextareaField } from '../src/index';

type Values = {
  notes: string;
  count?: number;
  when: Date;
};

type CountParse = NonNullable<FormTextareaFieldProps<Values, 'count'>['parse']>;

const control = {} as Control<Values>;

describe('FormTextareaField type contract', () => {
  it('rejects non-text paths and wrong parse return types', () => {
    const validText = (
      <FormTextareaField<Values, 'notes'> control={control} name="notes" label="Notes" />
    );
    const validNumber = (
      <FormTextareaField<Values, 'count'>
        control={control}
        name="count"
        label="Count"
        parse={value => (value === '' ? undefined : Number(value))}
      />
    );

    // @ts-expect-error A Date path is not a text field.
    const InvalidPathField = FormTextareaField<Values, 'when'>;
    // @ts-expect-error A text parse cannot return a string for a numeric path.
    const invalidParse: CountParse = value => value;

    expect(validText).toBeTruthy();
    expect(validNumber).toBeTruthy();
    expect(InvalidPathField).toBeTruthy();
    expect(invalidParse).toBeTruthy();
  });
});
