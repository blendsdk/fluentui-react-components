# Design — shared contract and text fields

> **Feature**: `form-fields`
> **Requirements**: FR-01, FR-02, FR-03, FR-10, FR-12
> **CodeOps Artifact Schema**: 1

## 1. Shared internal module

### 1.1 Files

```text
packages/react-components/src/forms/
├── FormField.types.ts        public shared prop aliases
├── useFormField.ts           useController wrapper + error/disabled resolution
├── formFieldValues.ts        formatInputValue, resolveOptionText, toSelectedOptions
└── useTextValueState.ts      raw text state for parsed text fields
```

The folder is internal. It is not exported from `src/index.ts` and not listed in `package-exports.spec.test.ts`.

### 1.2 `FormField.types.ts`

```ts
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

/**
 * Props every form field wrapper shares.
 *
 * The application owns the form engine: it creates the control with
 * `useForm`, supplies the validation resolver, and maps the values to its
 * API. The wrapper only binds the control to a Fluent UI primitive.
 */
export type FormFieldBaseProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  /** React Hook Form control from `useForm`. */
  control: Control<TFieldValues>;
  /** Type-checked field path; the source of the value and error state. */
  name: TName;
  /** Visible label; the wrapper decides whether Field or the primitive owns it. */
  label: string;
  /** Optional helper text, associated with the control by Field. */
  hint?: string;
  /** Semantic required state; validation stays in the application schema. */
  required?: boolean;
};
```

Rules:

- `label` is a string, not a `ReactNode`. The package ships no string resources; callers pass translated strings.
- `control` is required. `FormProvider`/`useFormContext` is not supported.
- No `rules`, `defaultValue`, `value`, or `onChange` in the base type. The wrapper owns them or RHF owns them.
- Each component narrows `TName` with `FieldPathByValue` to the value types it supports; the base type only requires a valid path.

### 1.3 `useFormField.ts`

```ts
import { useController } from 'react-hook-form';
import type {
  Control,
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';

export type FormFieldController<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
  /** Validation message, or undefined when there is no message. */
  errorMessage: string | undefined;
  /** True when the prop or the form-level state disables the control. */
  isDisabled: boolean;
};

export function useFormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(
  control: Control<TFieldValues>,
  name: TName,
  disabled?: boolean
): FormFieldController<TFieldValues, TName> {
  const { field, fieldState } = useController({ control, name, disabled });

  return {
    field,
    fieldState,
    errorMessage: fieldState.error?.message || undefined,
    isDisabled: disabled ?? field.disabled ?? false,
  };
}
```

Why a shared hook:

- One `useController` call and one error-source rule for all eight components.
- No duplicated form state; the hook only re-exposes RHF state.
- The component hooks still own their primitive-specific mapping.

### 1.4 `formFieldValues.ts`

| Function                                                    | Contract                                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `formatInputValue(value: unknown): string`                  | `null`/`undefined` → `''`; otherwise `String(value)`. Used to display parsed text values. |
| `resolveOptionText(value: unknown, getOptionText?): string` | Empty/nullish → `''`; otherwise `getOptionText?.(String(value)) ?? String(value)`.        |
| `toSelectedOptions(value: unknown): string[]`               | Empty/nullish → `[]`; otherwise `[String(value)]`.                                        |

All three are pure and documented. They are covered indirectly by the component spec tests; a small impl test may cover the fallback rules.

### 1.5 `useTextValueState.ts`

```ts
export type TextFieldValue = string | number | null | undefined;

export type TextValueState = {
  /** Raw text shown by the input; keeps partial numeric input intact. */
  text: string;
  /** Commits a raw keystroke: updates the text and calls onChange with the parsed value. */
  commit: (raw: string) => void;
};

export function useTextValueState(
  value: TextFieldValue,
  parse: ((raw: string) => TextFieldValue) | undefined,
  onChange: (value: TextFieldValue) => void
): TextValueState;
```

Behavior:

1. Initializes `text` from `formatInputValue(value)`.
2. Keeps `lastEmitted` in a ref.
3. On `commit(raw)`:
   - `setText(raw)`.
   - `next = parse ? parse(raw) : raw`.
   - `lastEmitted.current = next`.
   - `onChange(next)`.
4. On `value` change, if `!Object.is(value, lastEmitted.current)`, sets `text` to `formatInputValue(value)` and updates `lastEmitted`.
5. This preserves `1.`, `-`, and `1.0` while the form stores `1`, `NaN`, and `1`.

The `onChange` type is `(value: TextFieldValue) => void`; `undefined` (or `null`) represents a cleared parsed field. For string fields, callers pass a string and the empty string is the clear value.

### 1.6 Field composition rules

| Component             | Label owner | Hint/error owner | Required wiring                                                                        |
| --------------------- | ----------- | ---------------- | -------------------------------------------------------------------------------------- |
| `FormTextField`       | `Field`     | `Field`          | `Field required` → native `required` on Input                                          |
| `FormTextareaField`   | `Field`     | `Field`          | `Field required` → native `required` on Textarea                                       |
| `FormCheckboxField`   | Primitive   | `Field`          | `Field required` → native `required` on hidden input; primitive label shows the marker |
| `FormSwitchField`     | Primitive   | `Field`          | Same as Checkbox                                                                       |
| `FormRadioGroupField` | `Field`     | `Field`          | `Field required` → `aria-required` on the group                                        |
| `FormDropdownField`   | `Field`     | `Field`          | `Field required` → `aria-required` on the button                                       |
| `FormComboboxField`   | `Field`     | `Field`          | `Field required` → native `required` on the input                                      |
| `FormDatePickerField` | `Field`     | `Field`          | `Field required` → DatePicker's own required validation + native `required`            |

Shared render conventions:

- Spread primitive props first; set `value`/`checked`, `onChange`, `onBlur`, `disabled`, and `ref` after the spread.
- `className`/`style` go to the primitive, not to the `Field` root. A caller who needs outer spacing wraps the field in a layout element.
- `validationMessage={errorMessage}`; an empty message is `undefined`.
- `size` is passed to `Field` when `Field` owns the label and the primitive has a `size` prop (AR-26). Checkbox, Switch, and RadioGroup do not pass `size` to `Field` because they own their labels or have no size prop.

### 1.7 Ref semantics

| Component             | Forwarded ref element                |
| --------------------- | ------------------------------------ |
| `FormTextField`       | `HTMLInputElement`                   |
| `FormTextareaField`   | `HTMLTextAreaElement`                |
| `FormCheckboxField`   | `HTMLInputElement` (hidden checkbox) |
| `FormSwitchField`     | `HTMLInputElement` (hidden switch)   |
| `FormRadioGroupField` | `HTMLDivElement` (group root)        |
| `FormDropdownField`   | `HTMLButtonElement` (trigger)        |
| `FormComboboxField`   | `HTMLInputElement`                   |
| `FormDatePickerField` | `HTMLInputElement`                   |

The hook merges the forwarded ref with RHF's `field.ref`:

```ts
const controlRef = useMergedRefs(ref, field.ref);
```

`useMergedRefs` is re-exported by `@fluentui/react-components`. This keeps focus-on-error working for all focusable controls. The RadioGroup root is not natively focusable; that limitation is documented in FR-06.

Every component shell follows the `FormTextField` generic `forwardRef` pattern shown below, with its own `TName` constraint (`FieldPathByValue<…>`) and its own ref element type. Set `displayName` on the inner render function so React DevTools reports `ForwardRef(FormTextField)` and the same for the other fields.

## 2. `FormTextField`

### 2.1 Files

```text
src/components/FormTextField/
├── FormTextField.tsx
├── FormTextField.types.ts
├── useFormTextField.ts
├── renderFormTextField.tsx
├── index.ts
└── stories/FormTextField.stories.tsx
```

No styles file (AR-08).

### 2.2 Props

```ts
import type { FieldPathByValue } from 'react-hook-form';

type TextFieldValue = string | number | null | undefined;

export type FormTextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, TextFieldValue> = FieldPathByValue<
    TFieldValues,
    TextFieldValue
  >,
> = Omit<InputProps, 'value' | 'defaultValue' | 'onChange' | 'name' | 'children'> &
  FormFieldBaseProps<TFieldValues, TName> & {
    /**
     * Converts the input's string value before it reaches the form.
     * Use it for numeric or other non-string field values.
     * Return `undefined` for an empty input when the field is optional.
     */
    parse?: (value: string) => FieldPathValue<TFieldValues, TName> | undefined;
  };
```

Owned (omitted) props: `value`, `defaultValue`, `onChange`, `name`, `children`.

Pass-through examples: `type`, `readOnly`, `disabled`, `size`, `appearance`, `placeholder`, `contentBefore`, `contentAfter`, `inputMode`, `autoComplete`, `aria-*`, `className`, `style`.

`onBlur` stays in the type and is merged with `field.onBlur`.

### 2.3 State and render

`useFormTextField(props, ref)`:

1. Destructures `control`, `name`, `label`, `hint`, `required`, `parse`, `onBlur`, `disabled`, and the rest of the Input props.
2. Calls `useFormField(control, name, disabled)`.
3. Creates `controlRef = useMergedRefs(ref, field.ref)`.
4. Calls `useTextValueState(field.value, parse, field.onChange)`.
5. Creates `handleChange = (_event, data) => commit(data.value)`.
6. Creates `handleBlur = mergeCallbacks(onBlur, field.onBlur)`.
7. Returns `label`, `hint`, `required`, `errorMessage`, `fieldSize` (`inputProps.size`), `inputProps` (rest + `value: text`, `onChange`, `onBlur`, `disabled: isDisabled`), and `controlRef`.

`renderFormTextField(state)`:

```tsx
<Field
  label={state.label}
  hint={state.hint}
  required={state.required}
  size={state.fieldSize}
  validationMessage={state.errorMessage}
>
  <Input {...state.inputProps} ref={state.controlRef} />
</Field>
```

Shell:

```tsx
const FormTextFieldBase = <
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string | number | null | undefined>,
>(
  props: FormTextFieldProps<TFieldValues, TName>,
  ref: React.Ref<HTMLInputElement>
) => {
  const state = useFormTextField(props, ref);
  return renderFormTextField(state);
};

FormTextFieldBase.displayName = 'FormTextField';

export const FormTextField = React.forwardRef(FormTextFieldBase) as <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, string | number | null | undefined> =
    FieldPathByValue<TFieldValues, string | number | null | undefined>,
>(
  props: FormTextFieldProps<TFieldValues, TName> & React.RefAttributes<HTMLInputElement>
) => React.ReactElement;
```

The cast is the documented `forwardRef` generic bridge (see `02-current-state.md` §3.4). No `any`/`unknown` cast.

### 2.4 Behavior details

| Case                                                                               | Result                                                                                                                                                           |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parse` omitted                                                                    | `field.onChange(data.value)`; form value is a string.                                                                                                            |
| `parse` provided, `"42"`                                                           | `field.onChange(42)`; input text stays `"42"`.                                                                                                                   |
| `parse` provided, `"1."`                                                           | `field.onChange(1)`; input text stays `"1."`.                                                                                                                    |
| `parse` provided, `""` and parse returns `undefined`                               | `field.onChange(undefined)`; input text stays `""`.                                                                                                              |
| `parse` returns `NaN`                                                              | `field.onChange(NaN)`; input text stays raw; Zod reports the error.                                                                                              |
| External `reset({ height: 10 })`                                                   | `value` changes; effect sets text to `"10"`.                                                                                                                     |
| External `setValue('height', 20)`                                                  | Same as reset.                                                                                                                                                   |
| Reset to the same parsed value with different raw text (for example `"1.0"` → `1`) | The raw text is not reformatted because the form value did not change. This presentation edge case is accepted; a reset to a different value reformats normally. |
| Server `setError('height', ...)`                                                   | `errorMessage` updates; Field renders the alert.                                                                                                                 |
| `readOnly`                                                                         | Passed to Input; text remains visible; no wrapper override.                                                                                                      |
| `disabled` prop                                                                    | Passed to `useController` and Input.                                                                                                                             |
| Form-level disabled                                                                | `field.disabled` is true; Input receives true.                                                                                                                   |
| Caller `onBlur`                                                                    | Merged with `field.onBlur`; both run.                                                                                                                            |

### 2.5 Accessibility

- `Field` labels the input with `htmlFor`; the input gets the generated id.
- `Field` associates `hint` and `validationMessage` through `aria-describedby`.
- An error sets `aria-invalid="true"` on the input and renders a `role="alert"` message.
- `required` sets native `required` on the input and renders the label marker.
- `readOnly` keeps the input focusable and readable.
- `disabled` removes the input from the tab order.

### 2.6 Test cases

See `07-testing-strategy.md` ST-01..ST-12 and ST-89 (export/type guard).

## 3. `FormTextareaField`

### 3.1 Files

```text
src/components/FormTextareaField/
├── FormTextareaField.tsx
├── FormTextareaField.types.ts
├── useFormTextareaField.ts
├── renderFormTextareaField.tsx
├── index.ts
└── stories/FormTextareaField.stories.tsx
```

### 3.2 Props

```ts
type TextFieldValue = string | number | null | undefined;

export type FormTextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, TextFieldValue> = FieldPathByValue<
    TFieldValues,
    TextFieldValue
  >,
> = Omit<TextareaProps, 'value' | 'defaultValue' | 'onChange' | 'name' | 'children'> &
  FormFieldBaseProps<TFieldValues, TName> & {
    /** Same parse contract as FormTextField. */
    parse?: (value: string) => FieldPathValue<TFieldValues, TName> | undefined;
  };
```

Pass-through examples: `resize`, `readOnly`, `disabled`, `size`, `appearance`, `placeholder`, `rows`, `aria-*`, `className`, `style`.

### 3.3 State and render

- Reuses `useFormField` and `useTextValueState`.
- `controlRef` is `useMergedRefs(ref, field.ref)` with `HTMLTextAreaElement`.
- `renderFormTextareaField` composes `Field` + `Textarea` exactly like the text field.
- `fieldSize` is `TextareaProps['size']` and is passed to `Field`.

### 3.4 Behavior and accessibility

- Same parse, external-sync, error, required, disabled, read-only, and blur behavior as `FormTextField`.
- `Textarea` consumes `FieldContext` with `supportsLabelFor` and `supportsRequired`.
- The native `<textarea>` supports `readOnly`; the value remains focusable and copyable.

### 3.5 Test cases

See `07-testing-strategy.md` ST-13..ST-22.

## 4. Shared story harness

`src/forms/stories/formStoryHarness.story.tsx`:

- Exports a `StoryForm` component with a `useForm` instance, a submit button, and a values preview.
- Accepts a render prop `(form) => ReactElement` and `defaultValues`.
- Is named `.story.tsx` so `tsconfig.build.json` excludes it and Storybook does not auto-discover it.
- Each component story uses a concrete wrapper component for Storybook's `Meta` type; the wrapper instantiates the generic field with a concrete `StoryValues` type.

## 5. Definition of done for this document

- [ ] Shared types, hook, and helpers compile under `strict`.
- [ ] No `any`, `as any`, `as unknown`, or `@ts-ignore`.
- [ ] `FormTextField` and `FormTextareaField` follow the file anatomy and have no styles file.
- [ ] Spec tests for both are green and unchanged after implementation.
- [ ] Impl tests cover `useController` wiring, ref merge, blur merge, pass-through, and raw-text sync.
- [ ] Both components are exported with types and stories.
