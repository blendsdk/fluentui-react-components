# Testing strategy — form fields

> **Feature**: `form-fields`
> **Requirements**: FR-01..FR-12, NFR-01..NFR-08
> **CodeOps Artifact Schema**: 1

## 1. Test layers

| Layer          | File                                | Purpose                                                                   |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| Specification  | `test/form-<name>.spec.test.tsx`    | The public contract; written first and kept unchanged                     |
| Implementation | `test/form-<name>.impl.test.tsx`    | Internals: `useController` wiring, ref merge, pass-through, raw-text sync |
| Export surface | `test/package-exports.spec.test.ts` | Exact runtime exports and props types                                     |
| Build/pack     | Commands                            | Externalization, Storybook build, pack contents                           |

## 2. Shared harness

`test/form-test-utils.tsx`:

```tsx
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { render } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import type { FieldValues, UseFormProps, UseFormReturn } from 'react-hook-form';
import type { ReactElement } from 'react';

export function renderWithForm<TFieldValues extends FieldValues>(
  options: UseFormProps<TFieldValues>,
  renderField: (form: UseFormReturn<TFieldValues>) => ReactElement
) {
  let form!: UseFormReturn<TFieldValues>;

  function Harness() {
    form = useForm<TFieldValues>(options);
    return <FluentProvider theme={webLightTheme}>{renderField(form)}</FluentProvider>;
  }

  const view = render(<Harness />);
  return { form, ...view };
}
```

Rules:

- Tests use `fireEvent` and `act`; no `@testing-library/user-event` dependency.
- Form mutations (`reset`, `setValue`, `setError`) are wrapped in `act`.
- Queries use roles and accessible names, not class names or selectors.
- Portal lists use `inlinePopup`; DatePicker value tests use `allowTextInput`.
- jsdom does not simulate native read-only edit prevention or real focus management; assert the attribute and cover behavior in a story.

## 3. Specification test cases

### 3.1 `FormTextField` — ST-01..ST-12

Form values: `type Values = { name: string; height?: number }`.

| ID    | Input → expected output                                                                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ST-01 | Render `<FormTextField control name="name" label="Name" />` with `defaultValues: { name: 'Ada' }` → textbox accessible name `Name`, value `Ada`.                                 |
| ST-02 | Type `Lovelace` → `form.getValues('name') === 'Lovelace'`; textbox value updated.                                                                                                |
| ST-03 | Focus then blur → `form.getFieldState('name').isTouched === true`; a caller `onBlur` also runs.                                                                                  |
| ST-04 | `setError('name', { type: 'server', message: 'Name is taken' })` → `role="alert"` text `Name is taken`; textbox `aria-invalid="true"`; `aria-describedby` includes the alert id. |
| ST-05 | `required` → textbox has native `required`; label shows the required marker.                                                                                                     |
| ST-06 | `disabled` and form-level disabled → textbox disabled; `fireEvent.change` does not change the form value.                                                                        |
| ST-07 | `readOnly` → textbox has `readOnly`; value remains visible; the control stays focusable.                                                                                         |
| ST-08 | `hint="Whole centimeters"` → textbox accessible description contains the hint; `aria-describedby` points at the hint id.                                                         |
| ST-09 | Render with `label="Height"` → `screen.getByRole('textbox', { name: 'Height' })`; the label's `for` matches the input id.                                                        |
| ST-10 | `parse={v => v === '' ? undefined : Number(v)}`; type `42` → form value `42`; type `1.` → textbox still shows `1.` and the form value is `1`.                                    |
| ST-11 | Type `Ada`, then `act(() => form.reset({ name: 'Grace' }))` → textbox shows `Grace`; numeric reset shows the formatted number.                                                   |
| ST-12 | `setError` then `clearErrors` → alert disappears; `aria-invalid` removed.                                                                                                        |

### 3.2 `FormTextareaField` — ST-13..ST-22

| ID    | Input → expected output                                                                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| ST-13 | Render with `label="Notes"` and `defaultValues: { notes: 'Hello' }` → textbox role is `textbox`, accessible name `Notes`, value `Hello`. |
| ST-14 | Type `World` → `form.getValues('notes') === 'World'`.                                                                                    |
| ST-15 | Blur → touched state true; caller `onBlur` runs.                                                                                         |
| ST-16 | `setError('notes', { message: 'Too long' })` → alert `Too long`; textarea `aria-invalid`; error association.                             |
| ST-17 | `required` → native `required`; label marker.                                                                                            |
| ST-18 | `disabled` → textarea disabled; interaction does not change the value.                                                                   |
| ST-19 | `readOnly` → `readOnly` attribute; value visible; focusable.                                                                             |
| ST-20 | `hint` → accessible description contains the hint.                                                                                       |
| ST-21 | `reset({ notes: 'Reset' })` → textarea shows `Reset`.                                                                                    |
| ST-22 | `setError` then `clearErrors` → message clears; association updates.                                                                     |

### 3.3 `FormCheckboxField` — ST-23..ST-32

Form values: `type Values = { active: boolean; mixed?: 'mixed' }`.

| ID    | Input → expected output                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------- |
| ST-23 | `defaultValues: { active: false }` → checkbox accessible name from `label`, unchecked.                                |
| ST-24 | Click/Space → `form.getValues('active') === true`; click again → `false`.                                             |
| ST-25 | Blur → touched true; caller `onBlur` runs.                                                                            |
| ST-26 | `setError('active', { message: 'Required' })` → alert `Required`; hidden input `aria-invalid="true"`; association.    |
| ST-27 | `required` → hidden input native `required`; primitive label shows the required marker; exactly one label in the DOM. |
| ST-28 | `disabled` → checkbox disabled; click does not change the value.                                                      |
| ST-29 | `hint` → hidden input accessible description contains the hint.                                                       |
| ST-30 | `getByRole('checkbox', { name: 'Enable feature' })`; primitive label `for` matches the hidden input id.               |
| ST-31 | `reset({ active: true })` → checked.                                                                                  |
| ST-32 | `defaultValues: { mixed: 'mixed' }` → input is indeterminate; `checked` prop is `'mixed'`.                            |

### 3.4 `FormSwitchField` — ST-33..ST-41

| ID    | Input → expected output                                                                                                                              |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| ST-33 | `defaultValues: { enabled: false }` → switch role, accessible name from `label`, unchecked.                                                          |
| ST-34 | Click/Space → `form.getValues('enabled') === true`; click again → `false`.                                                                           |
| ST-35 | Blur → touched true; caller `onBlur` runs.                                                                                                           |
| ST-36 | `setError('enabled', { message: 'Must be on' })` → alert; hidden input `aria-invalid`; association.                                                  |
| ST-37 | `required` → native `required`; label marker; exactly one label.                                                                                     |
| ST-38 | `disabled` → not focusable; click does not change value. `disabledFocusable` → `aria-disabled="true"`, still focusable, click does not change value. |
| ST-39 | `hint` → accessible description contains the hint.                                                                                                   |
| ST-40 | `getByRole('switch', { name: 'Enable feature' })`; primitive label `for` matches the hidden input id.                                                |
| ST-41 | `reset({ enabled: true })` → checked.                                                                                                                |

### 3.5 `FormRadioGroupField` — ST-42..ST-51

Form values: `type Values = { plan: string }`.

| ID    | Input → expected output                                                                                                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ST-42 | Render with `label="Plan"`, two radios, no value → `getByRole('radiogroup', { name: 'Plan' })`; no radio selected.                                                                              |
| ST-43 | Click `Pro` → `form.getValues('plan') === 'pro'`; `Pro` checked.                                                                                                                                |
| ST-44 | Focus a radio, blur the group → touched true; caller `onBlur` runs.                                                                                                                             |
| ST-45 | `setError('plan', { message: 'Choose a plan' })` → alert; group `aria-invalid="true"`; association.                                                                                             |
| ST-46 | `required` → group `aria-required="true"`; label marker.                                                                                                                                        |
| ST-47 | `disabled` → all radios disabled; click does not change value.                                                                                                                                  |
| ST-48 | `hint` → group/radio accessible description contains the hint.                                                                                                                                  |
| ST-49 | Group accessible name is `Plan` via `aria-labelledby`; child radios keep their own names (`Free`, `Pro`).                                                                                       |
| ST-50 | `reset({ plan: 'free' })` → `Free` checked.                                                                                                                                                     |
| ST-51 | Arrow keys move selection according to Fluent's radio-group keyboard model; `form.getValues` follows. If jsdom cannot drive it, cover it in the story and keep the test on selection via click. |

### 3.6 `FormDropdownField` — ST-52..ST-62

Form values: `type Values = { color?: string }`; options `Red` value `red`, `Blue` value `blue`, `Green` value `green`.

| ID    | Input → expected output                                                                                                                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ST-52 | No value → button accessible name `Color`, placeholder visible, `aria-expanded="false"`.                                                                                                                                         |
| ST-53 | `defaultValues: { color: 'blue' }`, `getOptionText={v => ({ red: 'Red', blue: 'Blue', green: 'Green' })[v]}` → button displays `Blue`; `selectedOptions` is `['blue']`.                                                          |
| ST-54 | Same value, no `getOptionText` → button displays `blue`.                                                                                                                                                                         |
| ST-55 | `inlinePopup`, open, click `Green` → `form.getValues('color') === 'green'`; button displays `Green`; popup closes.                                                                                                               |
| ST-56 | `clearable`, selected value, click clear → `form.getValues('color') === ''`; the clear button disappears. The placeholder return is covered in the story because Fluent's controlled trigger does not repaint reliably in jsdom. |
| ST-57 | Open, select, then blur → touched true; caller `onBlur` runs.                                                                                                                                                                    |
| ST-58 | `setError('color', { message: 'Pick a color' })` → alert; button `aria-invalid="true"`; association.                                                                                                                             |
| ST-59 | `required` → button `aria-required="true"`; label marker.                                                                                                                                                                        |
| ST-60 | `disabled` → button disabled; opening/selection does nothing.                                                                                                                                                                    |
| ST-61 | `hint` → button accessible description contains the hint; label `for` matches the button id.                                                                                                                                     |
| ST-62 | `reset({ color: 'red' })` and `setValue('color', 'green')` → display updates to `Red`/`Green`.                                                                                                                                   |

### 3.7 `FormComboboxField` — ST-63..ST-73

| ID    | Input → expected output                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------- |
| ST-63 | `defaultValues: { color: 'blue' }`, `getOptionText` maps to `Blue` → input value `Blue`; selected option `blue`. |
| ST-64 | Type `blu` → input shows `blu`; `form.getValues('color')` is still `blue`.                                       |
| ST-65 | Type `Blu`, click `Blue` → `form.getValues('color') === 'blue'`; input shows `Blue`.                             |
| ST-66 | Type `xyz`, blur → input reverts to `Blue` (or empty if no selection); no form value is committed.               |
| ST-67 | `clearable`, selected value, click clear → `form.getValues('color') === ''`; input empty.                        |
| ST-68 | Blur after selection → touched true; caller `onBlur` runs.                                                       |
| ST-69 | `setError('color', { message: 'Pick a color' })` → alert; input `aria-invalid`; association.                     |
| ST-70 | `required` → input native `required`; label marker.                                                              |
| ST-71 | `disabled` → input disabled; typing/selection does nothing.                                                      |
| ST-72 | `hint` → input accessible description contains the hint; label `for` matches the input id.                       |
| ST-73 | `reset({ color: 'red' })` and `setValue('color', 'green')` → input text updates to `Red`/`Green`.                |

### 3.8 `FormDatePickerField` — ST-74..ST-84

Form values: `type Values = { startDate?: Date | null }`.

| ID    | Input → expected output                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| ST-74 | No value → input visible, label `Start date`, empty; input id equals the label `for`.                                                      |
| ST-75 | `defaultValues: { startDate: new Date(2026, 0, 15) }`, `formatDate={d => d?.toISOString().slice(0, 10) ?? ''}` → input shows `2026-01-15`. |
| ST-76 | `allowTextInput`, `parseDateFromString`, type `2026-02-20`, blur → form value is a `Date` for 2026-02-20.                                  |
| ST-77 | `allowTextInput`, type invalid text, blur → `onValidationResult` error; form value unchanged; input reverts.                               |
| ST-78 | Select/validate a date then blur → touched true; caller `onBlur` runs.                                                                     |
| ST-79 | `setError('startDate', { message: 'Date is required' })` → alert; input `aria-invalid="true"`; association.                                |
| ST-80 | `required` → input native `required`; label marker.                                                                                        |
| ST-81 | `disabled` → input and calendar trigger disabled; no calendar opens.                                                                       |
| ST-82 | `hint` → input accessible description contains the hint.                                                                                   |
| ST-83 | Label `for` equals the input id; `aria-describedby` contains the validation and hint ids exactly once (no duplicates).                     |
| ST-84 | `reset({ startDate: new Date(2026, 2, 1) })` → input updates to the formatted date.                                                        |

## 4. Implementation test cases

| Component             | Impl cases                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FormTextField`       | `useController` receives `control`/`name`; `field.ref` and forwarded ref merge; caller `onBlur` and `field.onBlur` both run; `value`/`defaultValue`/`onChange`/`name` are not forwarded to the DOM; `className`/`style` reach Input; raw text survives a parsed change; external reset syncs the text. |
| `FormTextareaField`   | Same as text, plus `resize` pass-through and `HTMLTextAreaElement` ref.                                                                                                                                                                                                                                |
| `FormCheckboxField`   | `useController` wiring; hidden input ref; `Field` has no label; `label` reaches Checkbox; `value`/`name` not forwarded as invalid attributes; mixed mapping.                                                                                                                                           |
| `FormSwitchField`     | `useController` wiring; hidden input ref; `Field` has no label; `disabledFocusable` pass-through; checked mapping.                                                                                                                                                                                     |
| `FormRadioGroupField` | `useController` wiring; group ref; `Field` label present; `name` not forwarded; `value` mapping; child radios untouched.                                                                                                                                                                               |
| `FormDropdownField`   | `useController` wiring; button ref; `selectedOptions`/display split; `getOptionText` used for display; owned props not forwarded; `onBlur` merge.                                                                                                                                                      |
| `FormComboboxField`   | `useController` wiring; input ref; local text sync; `onInput` does not commit; `onOptionSelect` commits; blur reverts; owned props not forwarded.                                                                                                                                                      |
| `FormDatePickerField` | `useController` wiring; input ref; `Field` render-function receives `id`; only `id` reaches DatePicker from `fieldProps`; `aria-describedby` not duplicated; `value` normalization; `onBlur` merge.                                                                                                    |

## 5. Export and type tests — ST-85..ST-92

| ID    | Check                                                                                                                                                                                                                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ST-85 | `Object.keys(api).sort()` equals the documented sorted list including all eight `Form*Field` components and the existing exports.                                                                                                                                                                  |
| ST-86 | Type-level assertions compile for each props type with a concrete `FormValues`; a wrong `name` is rejected with `@ts-expect-error`; a `Date` path passed to `FormTextField` is rejected; `parse` accepts `number \| undefined`; `getOptionText` returns string; DatePicker accepts `Date \| null`. |
| ST-87 | After `pnpm build`, `dist/index.js` imports `react-hook-form` instead of bundling it; `dist/index.d.ts` references RHF and DatePicker types.                                                                                                                                                       |
| ST-88 | `pnpm pack:check` passes and the pack list contains `dist/**` only; no `src/`, `stories/`, or `.story.` entries.                                                                                                                                                                                   |
| ST-89 | Package README contains the RHF peer, DatePicker peer, the eight component names, `parse`, `getOptionText`, and the `useForm` example.                                                                                                                                                             |
| ST-90 | `pnpm storybook:build` succeeds; each component has a story file; the a11y addon reports no violations in the default story.                                                                                                                                                                       |
| ST-91 | `pnpm verify` passes (format, skill check, type-check, build, tests).                                                                                                                                                                                                                              |
| ST-92 | Review confirms no changes to issue #2 files (`skills/`, `scripts/check-skill.mjs`, `scripts/check-pack.mjs`, package `files`/`prepack`) and no downstream app changes.                                                                                                                            |

## 6. Storybook variants

| Component             | Stories                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `FormTextField`       | Default, Required, WithHint, WithError, Disabled, ReadOnly, Numeric, Filled                                        |
| `FormTextareaField`   | Default, Required, WithHint, WithError, Disabled, ReadOnly, Resizable                                              |
| `FormCheckboxField`   | Default, Checked, Required, WithHint, WithError, Disabled, Mixed                                                   |
| `FormSwitchField`     | Default, On, Required, WithHint, WithError, Disabled, DisabledFocusable                                            |
| `FormRadioGroupField` | Default, Selected, Required, WithHint, WithError, Disabled, Layouts                                                |
| `FormDropdownField`   | Default, Selected (value ≠ text), Required, WithHint, WithError, Disabled, Clearable, InlinePopup                  |
| `FormComboboxField`   | Default, Selected (value ≠ text), TypingAndRevert, Required, WithHint, WithError, Disabled, Clearable, InlinePopup |
| `FormDatePickerField` | Default, Selected, Required, WithHint, WithError, Disabled, AllowTextInput, Localized, Calendar (manual)           |

Each story's docs description includes a manual checklist: label/hint/error association, keyboard path, light/dark/forced-colors, and the a11y addon.

## 7. Verification commands

```bash
# Focused loops
pnpm --filter @blendsdk/fluentui-react-components exec vitest run test/form-text-field.spec.test.tsx
pnpm --filter @blendsdk/fluentui-react-components exec vitest run test/form-text-field.impl.test.tsx

# Full gate
pnpm verify
pnpm storybook:build
pnpm pack:check
```

## 8. jsdom limits and how they are covered

| Limit                                   | Coverage                                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| No native read-only edit prevention     | Assert the `readOnly` attribute; cover the browser behavior in the story.                                              |
| Portaled popups                         | Dropdown/Combobox tests use `inlinePopup`; the story covers the portal.                                                |
| DatePicker calendar/focus trap          | Value tests use `allowTextInput`; the story covers calendar selection and keyboard flow.                               |
| No layout engine                        | Assert roles, names, attributes, and structure; visual behavior is in Storybook.                                       |
| No real focus management for RadioGroup | Assert the accessible name and error association; cover keyboard/arrow behavior in the story if jsdom cannot drive it. |
