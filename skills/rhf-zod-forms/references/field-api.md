# Field API reference

The package exports eight field wrappers from
`@blendsdk/fluentui-react-components`. Each one binds a Fluent UI v9 primitive
to React Hook Form with one `useController` call. The application supplies the
form control, the typed field name and the schema.

## Shared contract

```tsx
import { useForm } from 'react-hook-form';
import { FormTextField } from '@blendsdk/fluentui-react-components';

type Values = { name: string };

const form = useForm<Values>({ defaultValues: { name: '' } });

<FormTextField control={form.control} name="name" label="Name" required />;
```

| Prop       | Type                                | Required | Meaning                                                |
| ---------- | ----------------------------------- | -------- | ------------------------------------------------------ |
| `control`  | `Control<TFieldValues>`             | yes      | The control returned by `useForm`.                     |
| `name`     | `FieldPathByValue<TFieldValues, T>` | yes      | A type-checked path to the field value.                |
| `label`    | `string`                            | yes      | The visible label or the primitive's label.            |
| `hint`     | `string`                            | no       | Helper text associated with the control.               |
| `required` | `boolean`                           | no       | Semantic required state; the resolver still validates. |

Every wrapper:

- reads the value from `field.value`,
- writes through `field.onChange`,
- calls `field.onBlur` so React Hook Form records touched state,
- renders `fieldState.error?.message` through Fluent `Field`,
- forwards a ref to the focusable control and merges the caller's `onBlur`.

The wrapper owns `value`, `defaultValue`, `onChange` and `name`. All other
primitive props pass through. Do not pass a controlled value separately.

## Text and textarea

```tsx
<FormTextField control={form.control} name="name" label="Name" required />
<FormTextareaField
  control={form.control}
  name="notes"
  label="Notes"
  hint="Keep it under 500 characters"
  resize="vertical"
/>
```

Both fields store a string by default. `readOnly` and `disabled` pass through.
The textarea accepts the usual `Textarea` props such as `resize`, `size` and
`appearance`.

### Numeric values

`FormTextField` and `FormTextareaField` accept `parse`:

```tsx
<FormTextField
  control={form.control}
  name="height"
  label="Height"
  hint="Whole centimeters"
  type="number"
  parse={value => (value === '' ? undefined : Number(value))}
/>
```

`parse` converts the raw string before `field.onChange`. The raw keystrokes stay
local and visible, so partial input such as `1.` or `-` is not erased. Return
`undefined` for an empty optional number. The Zod schema validates the parsed
number:

```ts
const schema = z.object({
  height: z.number().int().positive().optional(),
});
```

Do not also use `z.coerce.number()` for this field when `parse` already returns
a number; one conversion is enough.

## Checkbox and Switch

```tsx
<FormCheckboxField
  control={form.control}
  name="active"
  label="Enable feature"
  hint="This turns on the feature for your workspace"
/>

<FormSwitchField control={form.control} name="notifications" label="Notifications" />
```

- `FormCheckboxField` stores `boolean` or `'mixed'`. The checkbox primitive owns
  the visible label. `Checkbox`'s `checked` supports the mixed state; clicking
  clears it.
- `FormSwitchField` stores `boolean`. The switch primitive owns the label.
  `disabled` and `disabledFocusable` pass through.
- `Field` supplies the hint, validation message and required state for both.
- Do not add a second visible label. The primitive's label is the accessible
  name.

## Radio group

```tsx
<FormRadioGroupField control={form.control} name="plan" label="Plan" required>
  <Radio value="free" label="Free" />
  <Radio value="pro" label="Pro" />
</FormRadioGroupField>
```

The group label is rendered by `Field`; each `Radio` keeps its own label. The
form value is the selected string. Use `''` for no selection. The group exposes
its required state with `aria-required`.

## Dropdown and Combobox

```tsx
const optionLabels: Record<string, string> = {
  red: 'Red',
  blue: 'Blue',
};

<FormDropdownField
  control={form.control}
  name="color"
  label="Color"
  getOptionText={value => optionLabels[value]}
>
  <Option value="red">Red</Option>
  <Option value="blue">Blue</Option>
</FormDropdownField>;
```

Both wrappers are single-select. The form stores the option value, not the
visible text. The empty string means no selection. `getOptionText` resolves the
display text after `reset` or `setValue` when the value and the text differ.
Without it, the raw value is shown.

Dropdown behavior:

- Selecting an option commits `data.optionValue ?? ''`.
- The clear affordance commits `''`.
- `multiselect` is not supported.

Combobox behavior:

- Typing filters the list and updates local input text; it does not change the
  form value until an option is selected.
- Selecting an option commits the option value and displays its text.
- Blur or popup close reverts uncommitted text to the stored value.
- Fluent's change-driven clear while typing is ignored. A click clear or an
  explicit option with an empty value commits `''`.
- `freeform` and `multiselect` are not supported.

For a keyboard-accessible clear, include an empty-value option:

```tsx
<FormComboboxField control={form.control} name="color" label="Color">
  <Option value="red">Red</Option>
  <Option value="blue">Blue</Option>
  <Option value="">None</Option>
</FormComboboxField>
```

## DatePicker

```tsx
<FormDatePickerField
  control={form.control}
  name="startDate"
  label="Start date"
  formatDate={date => date?.toLocaleDateString() ?? ''}
  parseDateFromString={text => (text === '' ? null : new Date(text))}
  allowTextInput
/>
```

`FormDatePickerField` uses `@fluentui/react-datepicker-compat`. The form value is
`Date | null`. `Field` owns the label, hint, required marker and validation
message; the DatePicker owns the input and calendar.

- The input is read-only unless `allowTextInput` is set.
- `formatDate` and `parseDateFromString` must agree on the display format.
- `minDate`, `maxDate`, `strings` and `onValidationResult` pass through.
- Store `null` for an empty date. Do not mix `undefined` and `null` without a
  documented reason.
- The wrapper handles the compat package's label id so the `Field` label points
  at the input and `aria-describedby` is not duplicated.

## Value summary

| Field                 | Stored value             | Empty value |
| --------------------- | ------------------------ | ----------- |
| `FormTextField`       | `string` or parsed value | `''`        |
| `FormTextareaField`   | `string` or parsed value | `''`        |
| `FormCheckboxField`   | `boolean \| 'mixed'`     | `false`     |
| `FormSwitchField`     | `boolean`                | `false`     |
| `FormRadioGroupField` | `string`                 | `''`        |
| `FormDropdownField`   | `string`                 | `''`        |
| `FormComboboxField`   | `string`                 | `''`        |
| `FormDatePickerField` | `Date \| null`           | `null`      |

## Accessibility checklist

- The label and control are associated.
- The hint is associated with the control.
- The error message is associated and announced.
- `required` is exposed to assistive technology.
- `disabled` removes the control from interaction.
- Checkbox and Switch have exactly one label.
- RadioGroup has a group label and exposes required state.
- The Combobox has a keyboard-accessible clear option.
- Keyboard focus reaches the control and the visible focus indicator remains.
