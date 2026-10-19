# Design — dropdown and combobox fields

> **Feature**: `form-fields`
> **Requirements**: FR-01, FR-07, FR-08, FR-12
> **CodeOps Artifact Schema**: 1

## 1. Shared model

Both fields are **single-select** and store the selected **option value** in the form:

```ts
/** Stored option value; the empty string means no selection. */
type Selection = string | undefined;
```

- `''` means no selection; an undefined initial value is treated the same and displays as no selection.
- The displayed text is resolved separately with `getOptionText`.
- `multiselect` is not in either public props type (AR-05).
- `FormComboboxField` does not support `freeform` (AR-05).

`getOptionText`:

```ts
getOptionText?: (value: string) => string | undefined;
```

- Called with the stored option value.
- Returns the display text for that value, or `undefined` if unknown.
- When omitted, the wrapper displays `String(value)`.
- Must be pure and cheap; it is called during render when the value changes.
- Needed when an `Option`'s `value` differs from its text, and for `reset`/`setValue` to show the correct text.

Both wrappers use `useFormField` and `useMergedRefs(ref, field.ref)`, and merge a caller's `onBlur` with `field.onBlur`.

## 2. Why the value and the text are separate

Fluent's `Dropdown`/`Combobox` controlled contract:

- `selectedOptions: string[]` is the selection.
- `value: string` is the text shown in the button/input.
- `onOptionSelect(ev, data)` returns `{ optionValue, optionText, selectedOptions }`.
- If `selectedOptions` is controlled, `value` must also be controlled.

Passing the option value as `value` works only when `Option value === Option text`. The wrapper therefore stores the option value and resolves the text with `getOptionText`. This is the smallest API that keeps `reset`, `setValue`, and stable option IDs correct (AR-04).

## 3. `FormDropdownField`

### 3.1 Files

```text
src/components/FormDropdownField/
├── FormDropdownField.tsx
├── FormDropdownField.types.ts
├── useFormDropdownField.ts
├── renderFormDropdownField.tsx
├── index.ts
└── stories/FormDropdownField.stories.tsx
```

### 3.2 Props

```ts
type SelectionFieldValue = string | undefined;

export type FormDropdownFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue> = FieldPathByValue<
    TFieldValues,
    SelectionFieldValue
  >,
> = Omit<
  DropdownProps,
  | 'value'
  | 'defaultValue'
  | 'selectedOptions'
  | 'defaultSelectedOptions'
  | 'onOptionSelect'
  | 'multiselect'
  | 'name'
> &
  FormFieldBaseProps<TFieldValues, TName> & {
    /** Resolves the visible text for a stored option value. */
    getOptionText?: (value: string) => string | undefined;
  };
```

- `children` stays; pass `Option` and optional `OptionGroup` elements.
- `label` goes to `Field`.
- Owned/omitted: `value`, `defaultValue`, `selectedOptions`, `defaultSelectedOptions`, `onOptionSelect`, `multiselect`, `name`.
- Pass-through: `disabled`, `size`, `appearance`, `placeholder`, `clearable`, `open`, `defaultOpen`, `onOpenChange`, `inlinePopup`, `positioning`, `className`, `style`, `aria-*`.
- `onBlur` stays and is merged.

### 3.3 State

1. Destructure `control`, `name`, `label`, `hint`, `required`, `getOptionText`, `onBlur`, `disabled`, and the rest of the Dropdown props.
2. `useFormField(control, name, disabled)`.
3. `controlRef = useMergedRefs(ref, field.ref)`; ref type `HTMLButtonElement`.
4. `displayText = resolveOptionText(field.value, getOptionText)`.
5. `selectedOptions = toSelectedOptions(field.value)`.
6. `handleOptionSelect = (_event, data) => field.onChange(data.optionValue ?? '')`.
7. `handleBlur = mergeCallbacks(onBlur, field.onBlur)`.
8. Return `label`, `hint`, `required`, `errorMessage`, `fieldSize`, `children`, `dropdownProps` (`...rest`, `value: displayText`, `selectedOptions`, `disabled: isDisabled`, `onOptionSelect`, `onBlur`), `controlRef`.

### 3.4 Render

```tsx
<Field
  label={state.label}
  hint={state.hint}
  required={state.required}
  size={state.fieldSize}
  validationMessage={state.errorMessage}
>
  <Dropdown {...state.dropdownProps} ref={state.controlRef}>
    {state.children}
  </Dropdown>
</Field>
```

### 3.5 Behavior

| Case                                                  | Result                                                 |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `field.value = 'blue'`, `getOptionText = v => map[v]` | Button shows `Blue`; `selectedOptions=['blue']`.       |
| `getOptionText` omitted                               | Button shows `blue`.                                   |
| Select an Option                                      | `field.onChange('blue')`; next render resolves `Blue`. |
| Clear (with `clearable`)                              | `field.onChange('')`; button shows the placeholder.    |
| `reset({ color: 'red' })`                             | Display resolves `Red`; selection is `['red']`.        |
| `setValue('color', 'green')`                          | Same as reset.                                         |
| Server `setError`                                     | `Field` alert updates; button gets `aria-invalid`.     |
| `required`                                            | `Field` sets `aria-required` on the button.            |
| `disabled`                                            | Dropdown button disabled.                              |
| `onBlur`                                              | Caller handler and `field.onBlur` both run.            |
| `multiselect`                                         | Not accepted by the type.                              |

### 3.6 Accessibility

- `Field` label `for` targets the Dropdown trigger button (a labelable element).
- The button has `role="combobox"`, `aria-expanded`, `aria-controls`, and the accessible name from the label.
- Hint/error are associated through `aria-describedby`; an error sets `aria-invalid`.
- `required` is `aria-required` on the button (buttons do not support native `required`).
- Keyboard behavior (ArrowDown, Enter, Escape, type-ahead) comes from Fluent; do not reimplement.
- The popup is portaled by default. jsdom tests pass `inlinePopup` to render the listbox inline; the story covers the portaled popup.

### 3.7 Test cases

See `07-testing-strategy.md` ST-52..ST-62.

## 4. `FormComboboxField`

### 4.1 Files

```text
src/components/FormComboboxField/
├── FormComboboxField.tsx
├── FormComboboxField.types.ts
├── useFormComboboxField.ts
├── renderFormComboboxField.tsx
├── index.ts
└── stories/FormComboboxField.stories.tsx
```

### 4.2 Props

```ts
type SelectionFieldValue = string | undefined;

export type FormComboboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, SelectionFieldValue> = FieldPathByValue<
    TFieldValues,
    SelectionFieldValue
  >,
> = Omit<
  ComboboxProps,
  | 'value'
  | 'defaultValue'
  | 'selectedOptions'
  | 'defaultSelectedOptions'
  | 'onOptionSelect'
  | 'onInput'
  | 'multiselect'
  | 'freeform'
  | 'name'
> &
  FormFieldBaseProps<TFieldValues, TName> & {
    /** Resolves the visible text for a stored option value. */
    getOptionText?: (value: string) => string | undefined;
  };
```

- `children` stays; pass `Option` elements.
- `label` goes to `Field`.
- Owned/omitted: `value`, `defaultValue`, `selectedOptions`, `defaultSelectedOptions`, `onOptionSelect`, `onInput`, `multiselect`, `freeform`, `name`.
- Pass-through: `disabled`, `size`, `appearance`, `placeholder`, `clearable`, `open`, `defaultOpen`, `onOpenChange`, `inlinePopup`, `positioning`, `onChange` (filter side effect), `className`, `style`, `aria-*`.
- `onBlur` stays and is merged.

### 4.3 State

The input text is local presentation state, not form state.

```ts
const [inputText, setInputText] = useState(() => resolveOptionText(field.value, getOptionText));
const lastEmitted = useRef(field.value);

useEffect(() => {
  if (!Object.is(field.value, lastEmitted.current)) {
    setInputText(resolveOptionText(field.value, getOptionText));
    lastEmitted.current = field.value;
  }
}, [field.value, getOptionText]);
```

Handlers:

- `handleInput(event)` → `setInputText(event.target.value)`. Does not call `field.onChange`.
- `handleOptionSelect(event, data)`:
  - Ignore `data.optionValue === undefined` when `event.type !== 'click'`; Fluent clears the selection on non-matching typed text, but a selection-only field must keep the stored value until an actual selection or clear.
  - `next = data.optionValue ?? ''`; `lastEmitted.current = next`; `field.onChange(next)`.
  - `setInputText(data.optionText ?? resolveOptionText(next, getOptionText))`.
- `handleBlur`:
  - `field.onBlur()`.
  - `setInputText(resolveOptionText(field.value, getOptionText))` to revert uncommitted typing.
  - Caller `onBlur` also runs.
- `selectedOptions = toSelectedOptions(field.value)`.

Why the local state:

- The controlled input must show typed text while filtering.
- The value should not change until an option is committed.
- The `lastEmitted` ref prevents the external-sync effect from overwriting the selected text on the same render.

### 4.4 Render

```tsx
<Field
  label={state.label}
  hint={state.hint}
  required={state.required}
  size={state.fieldSize}
  validationMessage={state.errorMessage}
>
  <Combobox {...state.comboboxProps} ref={state.controlRef}>
    {state.children}
  </Combobox>
</Field>
```

### 4.5 Behavior

| Case                                                   | Result                                                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `field.value = 'blue'`, `getOptionText` maps to `Blue` | Input shows `Blue`; `selectedOptions=['blue']`.                                              |
| Type `"blu"`                                           | Input shows `blu`; form value unchanged; options filter through Fluent's built-in filtering. |
| Click `Blue`                                           | `field.onChange('blue')`; input shows `Blue`.                                                |
| Type `"xyz"` and blur                                  | Input reverts to the selected text (or empty); no freeform value is stored.                  |
| Clear (with `clearable`)                               | `field.onChange('')`; input empty.                                                           |
| `reset({ color: 'red' })`                              | Effect sets input text to resolved `Red`.                                                    |
| `setValue('color', 'green')`                           | Same as reset.                                                                               |
| Server `setError`                                      | `Field` alert updates; input gets `aria-invalid`.                                            |
| `required`                                             | Native `required` on the input.                                                              |
| `disabled`                                             | Input disabled.                                                                              |
| `freeform` / `multiselect`                             | Not accepted by the type.                                                                    |

### 4.6 Accessibility

- `Field` label `for` targets the Combobox input.
- The input has `role="combobox"`, `aria-expanded`, `aria-controls`, and the accessible name from the label.
- Hint/error are associated through `aria-describedby`; an error sets `aria-invalid`.
- `required` is native on the input.
- Keyboard behavior (typing, ArrowDown, Enter, Escape) comes from Fluent; do not reimplement.
- jsdom tests pass `inlinePopup` for deterministic listbox rendering; the story covers the portaled popup.

### 4.7 Test cases

See `07-testing-strategy.md` ST-63..ST-73.

## 5. Stories

Each component gets one `stories/<Name>.stories.tsx` with:

| Story           | Purpose                                                           |
| --------------- | ----------------------------------------------------------------- |
| `Default`       | No selection, placeholder                                         |
| `Selected`      | Preset value; display text from `getOptionText` when value ≠ text |
| `Required`      | Required state                                                    |
| `WithHint`      | Hint association                                                  |
| `WithError`     | `setError` message                                                |
| `Disabled`      | Disabled interaction                                              |
| `Clearable`     | Clear sets `''`                                                   |
| `InlinePopup`   | Deterministic open listbox for review                             |
| `ValuesPreview` | Shows `form.getValues()` after each change                        |

Combobox additionally gets a `TypingAndRevert` story: type a non-matching string, blur, and observe the revert.

## 6. Definition of done for this document

- [ ] The form stores option values, not display text.
- [ ] `getOptionText` is optional; the raw-value fallback is documented and tested.
- [ ] `reset` and `setValue` update the display.
- [ ] Combobox typing does not commit until an option is selected.
- [ ] `multiselect` and `freeform` are absent from the public types.
- [ ] Popup behavior is covered by stories; deterministic tests use `inlinePopup`.
- [ ] Both components are exported with types and stories.
