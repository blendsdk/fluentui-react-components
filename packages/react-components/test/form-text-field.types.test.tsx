import { describe, expect, it } from 'vitest';
import type { Control } from 'react-hook-form';
import type { FormTextFieldProps } from '../src/index';
import { FormTextField } from '../src/index';

type Values = {
  name: string;
  height?: number;
  when: Date;
};

type HeightParse = NonNullable<FormTextFieldProps<Values, 'height'>['parse']>;

const control = {} as Control<Values>;

describe('FormTextField type contract', () => {
  it('rejects non-text paths and wrong parse return types', () => {
    const validText = <FormTextField<Values, 'name'> control={control} name="name" label="Name" />;
    const validNumber = (
      <FormTextField<Values, 'height'>
        control={control}
        name="height"
        label="Height"
        parse={value => (value === '' ? undefined : Number(value))}
      />
    );

    // @ts-expect-error A Date path is not a text field.
    const InvalidPathField = FormTextField<Values, 'when'>;
    // @ts-expect-error A text parse cannot return a string for a numeric path.
    const invalidParse: HeightParse = value => value;

    expect(validText).toBeTruthy();
    expect(validNumber).toBeTruthy();
    expect(InvalidPathField).toBeTruthy();
    expect(invalidParse).toBeTruthy();
  });
});
