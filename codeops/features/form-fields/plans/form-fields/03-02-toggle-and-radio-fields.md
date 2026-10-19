# Design — checkbox, switch, and radio group fields

> **Feature**: `form-fields`
> **Requirements**: FR-01, FR-04, FR-05, FR-06, FR-12
> **CodeOps Artifact Schema**: 1

## 1. Shared rules for this group

- All three use `useFormField` from `src/forms/useFormField.ts`.
- All three use `useMergedRefs(ref, field.ref)`.
- All three merge a caller's `onBlur` with `field.onBlur` using `mergeCallbacks`.
- None exposes `readOnly` (AR-07).
- None has a styles file (AR-08).

## 2. `FormCheckboxField`

### 2.1 Files

```text
src/components/FormCheckboxField/
├── FormCheckboxField.tsx
├── FormCheckboxField.types.ts
├── useFormCheckboxField.ts
├── renderFormCheckboxField.tsx
├── index.ts
└── stories/FormCheckboxField.stories.tsx
```

### 2.2 Props

```ts
type CheckboxFieldValue = boolean | 'mixed' | undefined;

export type FormCheckboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, CheckboxFieldValue> = FieldPathByValue<
    TFieldValues,
    CheckboxFieldValue
  >,
> = Omit<
  CheckboxProps,
  'checked' | 'defaultChecked' | 'onChange' | 'label' | 'children' | 'name' | 'value'
> &
  FormFieldBaseProps<TFieldValues, TName>;
```

- `label` comes from `FormFieldBaseProps` as a `string` and is passed to the primitive, not to `Field`.
- Owned/omitted: `checked`, `defaultChecked`, `onChange`, `label`, `children`, `name`, `value`.
- Pass-through: `disabled`, `labelPosition`, `shape`, `size`, `className`, `style`, `aria-*`.
- `onBlur` stays and is merged.

### 2.3 State

`useFormCheckboxField(props, ref)`:

1. Destructures `control`, `name`, `label`, `hint`, `required`, `onBlur`, `disabled`, and the rest of the Checkbox props.
2. Calls `useFormField(control, name, disabled)`.
3. `controlRef = useMergedRefs(ref, field.ref)`.
4. `checked = field.value === 'mixed' ? 'mixed' : field.value === true`.
5. `handleChange = (_event, data) => field.onChange(data.checked)`.
6. `handleBlur = mergeCallbacks(onBlur, field.onBlur)`.
7. Returns `label`, `hint`, `required`, `errorMessage`, `checkboxProps` (`...rest`, `checked`, `disabled: isDisabled`, `onChange`, `onBlur`), `controlRef`.

Why `field.value === true`: the generic field value is not constrained to boolean. A runtime comparison renders any non-true value as unchecked without a cast. `'mixed'` is preserved.

### 2.4 Render

```tsx
<Field hint={state.hint} required={state.required} validationMessage={state.errorMessage}>
  <Checkbox {...state.checkboxProps} label={state.label} ref={state.controlRef} />
</Field>
```

There is deliberately no `label` on `Field`. The primitive renders the label, the required marker, and the label/control association. `Field` still supplies the hint, the error message, the error state, and the required state through `FieldContext`; Fluent `Checkbox` consumes both with `supportsLabelFor` and `supportsRequired`.

### 2.5 Behavior

| Case                           | Result                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Default `false` or `undefined` | Unchecked.                                                                        |
| Default `true`                 | Checked.                                                                          |
| Default `'mixed'`              | Indeterminate (`checked="mixed"`).                                                |
| Click/Space                    | `field.onChange(true/false)`.                                                     |
| Blur                           | `field.onBlur()` plus caller `onBlur`.                                            |
| `required`                     | Native `required` on the hidden input; primitive label shows the required marker. |
| Error                          | `Field` sets `aria-invalid` on the hidden input and renders the alert.            |
| Hint                           | `Field` associates it with the hidden input.                                      |
| `disabled`                     | Primitive disables the input; not focusable.                                      |
| Form-level disabled            | `field.disabled` propagates.                                                      |
| `readOnly`                     | Not in the props type.                                                            |

### 2.6 Accessibility

- The accessible name comes from the primitive `label` (`<label for>` → hidden input).
- The role is `checkbox`.
- The required state is native `required`.
- Error and hint are associated through `aria-describedby` and `aria-invalid`.
- The label click toggles the checkbox because `for` matches the hidden input id.

### 2.7 Test cases

See `07-testing-strategy.md` ST-23..ST-32.

## 3. `FormSwitchField`

### 3.1 Files

```text
src/components/FormSwitchField/
├── FormSwitchField.tsx
├── FormSwitchField.types.ts
├── useFormSwitchField.ts
├── renderFormSwitchField.tsx
├── index.ts
└── stories/FormSwitchField.stories.tsx
```

### 3.2 Props

```ts
type SwitchFieldValue = boolean | undefined;

export type FormSwitchFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, SwitchFieldValue> = FieldPathByValue<
    TFieldValues,
    SwitchFieldValue
  >,
> = Omit<SwitchProps, 'checked' | 'defaultChecked' | 'onChange' | 'label' | 'name' | 'value'> &
  FormFieldBaseProps<TFieldValues, TName>;
```

- `label` goes to the primitive.
- Owned/omitted: `checked`, `defaultChecked`, `onChange`, `label`, `name`, `value`.
- Pass-through: `disabled`, `disabledFocusable`, `labelPosition`, `size`, `className`, `style`, `aria-*`.
- `onBlur` stays and is merged.

### 3.3 State

1. Calls `useFormField(control, name, disabled)`.
2. `controlRef = useMergedRefs(ref, field.ref)`.
3. `checked = field.value === true`.
4. `handleChange = (_event, data) => field.onChange(data.checked)`.
5. `handleBlur = mergeCallbacks(onBlur, field.onBlur)`.
6. Returns `label`, `hint`, `required`, `errorMessage`, `switchProps` (`...rest`, `checked`, `disabled: isDisabled`, `onChange`, `onBlur`), `controlRef`.

### 3.4 Render

```tsx
<Field hint={state.hint} required={state.required} validationMessage={state.errorMessage}>
  <Switch {...state.switchProps} label={state.label} ref={state.controlRef} />
</Field>
```

No `label` on `Field`.

### 3.5 Behavior

| Case                   | Result                                                                |
| ---------------------- | --------------------------------------------------------------------- |
| `field.value === true` | Switch checked.                                                       |
| Any other value        | Unchecked.                                                            |
| Toggle                 | `field.onChange(data.checked)`; boolean.                              |
| `disabledFocusable`    | Passed through; the switch stays focusable and is announced disabled. |
| `required`             | Native `required` on the hidden input; primitive label marker.        |
| Error/hint             | Field association on the hidden input.                                |
| `readOnly`             | Not in the props type.                                                |

### 3.6 Accessibility

- Role is `switch` (Fluent sets it on the hidden input).
- Accessible name comes from the primitive label.
- `disabledFocusable` keeps the control in the tab order with `aria-disabled="true"`; the primitive handles it.
- Error and hint use `Field` associations.

### 3.7 Test cases

See `07-testing-strategy.md` ST-33..ST-41.

## 4. `FormRadioGroupField`

### 4.1 Files

```text
src/components/FormRadioGroupField/
├── FormRadioGroupField.tsx
├── FormRadioGroupField.types.ts
├── useFormRadioGroupField.ts
├── renderFormRadioGroupField.tsx
├── index.ts
└── stories/FormRadioGroupField.stories.tsx
```

### 4.2 Props

```ts
type RadioGroupFieldValue = string | undefined;

export type FormRadioGroupFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, RadioGroupFieldValue> = FieldPathByValue<
    TFieldValues,
    RadioGroupFieldValue
  >,
> = Omit<RadioGroupProps, 'value' | 'defaultValue' | 'onChange' | 'name' | 'required'> &
  FormFieldBaseProps<TFieldValues, TName>;
```

- `label` goes to `Field`; it labels the group, not an individual radio.
- `children` stays: pass `Radio` elements.
- Owned/omitted: `value`, `defaultValue`, `onChange`, `name`, `required`.
- Pass-through: `disabled`, `layout`, `className`, `style`, `aria-*`.
- `onBlur` stays and is merged.

### 4.3 State

1. Calls `useFormField(control, name, disabled)`.
2. `controlRef = useMergedRefs(ref, field.ref)`. The group root is a `div`; RHF focus-on-error cannot focus it (documented).
3. `value = field.value === undefined || field.value === null ? '' : String(field.value)`.
4. `handleChange = (_event, data) => field.onChange(data.value)`.
5. `handleBlur = mergeCallbacks(onBlur, field.onBlur)`.
6. Returns `label`, `hint`, `required`, `errorMessage`, `children`, `groupProps` (`...rest`, `value`, `disabled: isDisabled`, `onChange`, `onBlur`), `controlRef`.

### 4.4 Render

```tsx
<Field
  label={state.label}
  hint={state.hint}
  required={state.required}
  validationMessage={state.errorMessage}
>
  <RadioGroup {...state.groupProps} ref={state.controlRef}>
    {state.children}
  </RadioGroup>
</Field>
```

### 4.5 Behavior

| Case                          | Result                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| No value                      | No radio selected.                                                                        |
| Value matches a `Radio value` | That radio selected.                                                                      |
| Select                        | `field.onChange(data.value)`; string.                                                     |
| Blur out of the group         | `field.onBlur()` plus caller `onBlur`; React's blur bubbles from the radios to the group. |
| `required`                    | `Field` sets `aria-required="true"` on the group root.                                    |
| `disabled`                    | `RadioGroup` disables all child radios.                                                   |
| Error                         | `Field` sets `aria-invalid` on the group root and associates the message.                 |
| Hint                          | `Field` associates it with the group root (and Fluent also passes it to the radios).      |
| `readOnly`                    | Not in the props type.                                                                    |

### 4.6 Accessibility

- The group has `role="radiogroup"` and an accessible name from `Field`'s `aria-labelledby`.
- The individual `Radio` children keep their own labels.
- `required` is exposed as `aria-required` on the group; the group does not use native `required` because it is a `div`.
- Fluent renders `<label for>` on the group id as well. A `<label for>` targeting a `div` is inert; the real association is `aria-labelledby`. Tests assert the accessible name, not the `for` target.
- Arrow-key navigation and roving focus come from Fluent's `RadioGroup`; do not reimplement.

### 4.7 Test cases

See `07-testing-strategy.md` ST-42..ST-51.

## 5. Stories

Each component gets one `stories/<Name>.stories.tsx` with:

| Story              | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `Default`          | Empty/default value, submit and values preview                 |
| `Selected`         | A preset value/checked state                                   |
| `Required`         | The required marker and native/ARIA required state             |
| `WithHint`         | Hint associated with the control/group                         |
| `WithError`        | `setError` message and error styling/association               |
| `Disabled`         | Disabled interaction and appearance                            |
| Component-specific | Checkbox mixed; Switch `disabledFocusable`; RadioGroup layouts |

No `ReadOnly` story for these three; the field does not support it.

## 6. Definition of done for this document

- [ ] Checkbox and Switch render exactly one label.
- [ ] RadioGroup uses the Field label for the group, not for individual radios.
- [ ] Required/error/hint associations are verified in tests.
- [ ] No `readOnly` prop leaks into these public types.
- [ ] All three are exported with types and stories.
- [ ] Spec tests are green and unchanged after implementation.
