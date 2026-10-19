# Requirements — React Hook Form field components

> **Source**: [RD-01](../../requirements/RD-01-react-hook-form-fields.md) · [GitHub issue #1](https://github.com/blendsdk/fluentui-react-components/issues/1)
> **Feature**: `form-fields`
> **CodeOps Artifact Schema**: 1

## 1. Purpose

Provide React Hook Form field wrappers for the Fluent UI v9 primitives in `@blendsdk/fluentui-react-components`. The wrappers connect a form field (`control` + `name`) to a Fluent UI control, render the label, hint, required state, and validation message through `Field`, and expose the control's value and change/blur events to React Hook Form.

The library owns the binding only. The application owns the form engine, the validation schema, DTO mapping, business rules, and localized strings.

## 2. Users and use cases

| User                   | Use case                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Application developer  | Build a React 19 form with React Hook Form and Fluent UI v9 controls without rewriting the `useController` wiring for every field. |
| Component maintainer   | Add a field wrapper that follows the repository's component anatomy and test conventions.                                          |
| Accessibility reviewer | Verify label, hint, error, required, disabled, and keyboard behavior through `Field` and the primitive, not through ad-hoc ARIA.   |

## 3. Functional requirements

### FR-01 — Shared field contract

Every field wrapper accepts:

| Prop       | Type                      | Required | Behavior                                                              |
| ---------- | ------------------------- | -------- | --------------------------------------------------------------------- |
| `control`  | `Control<TFieldValues>`   | Yes      | The React Hook Form control from `useForm`.                           |
| `name`     | `FieldPath<TFieldValues>` | Yes      | Type-checked field path; the wrapper passes it to `useController`.    |
| `label`    | `string`                  | Yes      | Visible label. Goes to `Field` or to the primitive, per AR-06.        |
| `hint`     | `string`                  | No       | Helper text rendered and associated by `Field`.                       |
| `required` | `boolean`                 | No       | Semantic required state and visual marker; not validation.            |
| `disabled` | primitive prop            | No       | Disables the control. A form-level disabled state also applies.       |
| `ref`      | control element ref       | No       | Points to the focusable control and is merged with RHF's `field.ref`. |

Every wrapper:

- Uses `useController` (not `Controller`, not `register`).
- Reads the value from `field.value` and writes through `field.onChange`.
- Calls `field.onBlur` on blur, merging a caller-supplied `onBlur`.
- Renders `fieldState.error?.message` through `Field`'s `validationMessage`.
- Passes the primitive's props through except the props the wrapper owns.
- Does not keep a second copy of the form value.
- Uses no `as any` or `as unknown` cast.
- Has a public props type exported from the package root.
- Has no styles file; Fluent `Field` owns layout and validation styling (AR-08).

### FR-02 — `FormTextField`

- Wraps Fluent `Input` and refs `HTMLInputElement`.
- `value` is the input's string value, or the parsed value when `parse` is supplied.
- `parse?: (value: string) => FieldPathValue<TFieldValues, TName> | undefined`.
- Local raw text keeps partial numeric input visible (`1.`, `-`, `1.0`); the form receives the parsed value on each change.
- External changes from `reset`, `setValue`, or `setError` update the displayed text.
- Supports `readOnly`, `disabled`, `type`, `size`, `appearance`, `contentBefore`, `contentAfter`, and other `Input` props.

### FR-03 — `FormTextareaField`

- Wraps Fluent `Textarea` and refs `HTMLTextAreaElement`.
- Same value, parse, raw-text, and external-sync behavior as FR-02.
- Supports `resize`, `readOnly`, `disabled`, `size`, `appearance`, and other `Textarea` props.

### FR-04 — `FormCheckboxField`

- Wraps Fluent `Checkbox` and refs the hidden `HTMLInputElement`.
- `label` goes to the primitive; `Field` supplies hint, validation message, and required state.
- `field.value` is `boolean` or `'mixed'`; `'mixed'` renders the indeterminate state.
- Toggling calls `field.onChange` with `boolean` or `'mixed'`.
- Does not expose `readOnly`.
- Supports `disabled`, `labelPosition`, `shape`, `size`, and other `Checkbox` props.

### FR-05 — `FormSwitchField`

- Wraps Fluent `Switch` and refs the hidden `HTMLInputElement`.
- `label` goes to the primitive; `Field` supplies hint, validation message, and required state.
- `field.value` is `boolean`; `checked` is true only for `true`.
- Toggling calls `field.onChange` with `boolean`.
- Supports `disabled`, `disabledFocusable`, `labelPosition`, `size`, and other `Switch` props.
- Does not expose `readOnly`.

### FR-06 — `FormRadioGroupField`

- Wraps Fluent `RadioGroup` and refs the group `HTMLDivElement`.
- `label` goes to `Field` and labels the group; each `Radio` child keeps its own label.
- `field.value` is the selected radio's string value; no selection renders no selected radio.
- Selecting calls `field.onChange` with the radio value.
- `required` is exposed as `aria-required` on the group.
- Supports `disabled`, `layout`, and `Radio` children.
- Does not expose `readOnly`.
- Documented limitation: RHF focus-on-error targets the group, which is not natively focusable; the accessible name and error message still work.

### FR-07 — `FormDropdownField`

- Wraps Fluent `Dropdown` and refs the trigger `HTMLButtonElement`.
- Single-select only. `field.value` is the selected option value (`string`); the empty string means no selection. An undefined initial value is treated as no selection.
- `selectedOptions` is derived from `field.value`; the display `value` is derived from `getOptionText`.
- `getOptionText?: (value: string) => string | undefined` resolves the visible text after `reset` or `setValue`. When omitted, the raw value is displayed.
- Selecting calls `field.onChange` with `data.optionValue`, or `''` when cleared.
- Supports `clearable`, `placeholder`, `disabled`, `size`, `appearance`, `open`, `onOpenChange`, and other `Dropdown` props.
- Omits `multiselect`, `defaultSelectedOptions`, `defaultValue`, `selectedOptions`, `value`, `onOptionSelect`, and `name`.
- Does not expose `readOnly`.

### FR-08 — `FormComboboxField`

- Wraps Fluent `Combobox` and refs the `HTMLInputElement`.
- Single-select, selection-only. `field.value` is the selected option value (`string`); the empty string means no selection.
- Local input text mirrors the selected text and allows the user to type to filter.
- `onInput` updates only the local text; `onOptionSelect` commits `data.optionValue` and sets the text to `data.optionText`.
- On blur, uncommitted typed text reverts to the selected option's text; the wrapper is not freeform.
- `getOptionText` has the same contract as FR-07.
- Supports `clearable`, `placeholder`, `disabled`, `size`, `appearance`, `open`, `onOpenChange`, and other `Combobox` props.
- Omits `freeform`, `multiselect`, `defaultSelectedOptions`, `defaultValue`, `selectedOptions`, `value`, `onOptionSelect`, `onInput`, and `name`.
- Does not expose `readOnly`.

### FR-09 — `FormDatePickerField`

- Wraps `DatePicker` from `@fluentui/react-datepicker-compat` and refs the `HTMLInputElement`.
- `field.value` is `Date | null`; the wrapper normalizes the primitive's `undefined` to `null`.
- `label`, `hint`, `required`, and `validationMessage` go through `Field`.
- Uses `Field`'s render-function child to pass only the generated `id` to `DatePicker`; this keeps the label's `for` attribute matched to the input id (AR-03).
- Selecting or validating a date calls `field.onChange(date ?? null)`.
- Supports `allowTextInput`, `formatDate`, `parseDateFromString`, `minDate`, `maxDate`, `strings`, `onValidationResult`, `disabled`, and other `DatePicker` props.
- Omits `value`, `defaultValue`, `onSelectDate`, `name`, and `id`.
- Does not expose `readOnly`; editability follows `allowTextInput`.
- The primitive's calendar popup is covered by a story; jsdom spec tests use `allowTextInput` for the value path.

### FR-10 — Exports and dependencies

- `src/index.ts` exports all eight components and their props types.
- `test/package-exports.spec.test.ts` lists all eight runtime components exactly and type-checks each props type.
- `package.json` adds:
  - `react-hook-form` to `peerDependencies` (`^7.55.0`) and `devDependencies` (`^7.90.0`).
  - `@fluentui/react-datepicker-compat` to `peerDependencies` (`^0.6.0`) and `devDependencies` (`^0.6.39`).
- `vite.config.ts` externalizes `react-hook-form`.
- The published package still contains only `dist`.

### FR-11 — Documentation and stories

- Package README documents the new peer dependencies, the field API, a `useForm` example, numeric parsing, `getOptionText`, and the DatePicker compat package.
- `AGENTS.md` records the field-wrapper anatomy exception and the internal `src/forms/` helpers.
- Each component has one `stories/<Name>.stories.tsx` with the variants listed in `07-testing-strategy.md`.
- Stories mount inside the global `FluentProvider` decorator and include a manual review checklist for accessibility and theme behavior.

### FR-12 — Tests

- Each component has `test/<kebab-name>.spec.test.tsx` written before implementation.
- Each component has `test/<kebab-name>.impl.test.tsx` after the spec is green.
- A shared `test/form-test-utils.tsx` harness provides a real `useForm` and `FluentProvider`.
- The spec tests cover the matrix in `07-testing-strategy.md`; a missing behavior is a failing requirement, not a test edit.
- The package export surface is guarded by the existing `test/package-exports.spec.test.ts`.

## 4. Non-functional requirements

| ID     | Requirement                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-01 | **Type safety.** Generic `Control<TFieldValues>` and `FieldPathByValue<TFieldValues, TValue>` preserve `name` checking and reject a path whose value type does not match the field (for example a Date path passed to `FormTextField`). No `any`, no `as any`, no `as unknown`, no `@ts-ignore`. The generic `forwardRef` cast is the only typed assertion and is documented. |
| NFR-02 | **Accessibility.** Label/control association, hint association, error association, required state, disabled state, and keyboard behavior follow the primitive and `Field`. Errors render through `Field`'s alert region.                                                                                                                                                      |
| NFR-03 | **Styling.** No colors, spacing, or typography literals. No styles layer; Fluent `Field` and the primitive tokens own the visual result.                                                                                                                                                                                                                                      |
| NFR-04 | **Performance.** Each field subscribes through `useController` only. No `watch`, no `formState` subscription, no duplicated value state. Local text state exists only for parsed text and Combobox filtering.                                                                                                                                                                 |
| NFR-05 | **Compatibility.** React 19, Fluent UI v9 (`^9.0.0` peer), React Hook Form 7.55+, DatePicker compat 0.6.x. No Fluent UI v8 or Formik.                                                                                                                                                                                                                                         |
| NFR-06 | **Packaging.** The new peers are documented; RHF and DatePicker stay external in the bundle; `pnpm pack:check` still rejects source and story files.                                                                                                                                                                                                                          |
| NFR-07 | **Documentation.** Public components, props, hooks, and non-trivial internals have JSDoc written for a junior developer. No plan, requirement, or task identifiers in code comments.                                                                                                                                                                                          |
| NFR-08 | **Security.** No network, storage, authentication, or HTML injection. `label` and `hint` are text. Validation remains app-side.                                                                                                                                                                                                                                               |

## 5. Acceptance criteria

| ID    | Criterion                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | All eight components are implemented, exported, and have props types.                                                     |
| AC-02 | Every component uses `useController` with the supplied `control` and `name`.                                              |
| AC-03 | Labels, hints, validation messages, required state, and disabled state are correctly associated for assistive technology. |
| AC-04 | Checkbox and Switch do not render a duplicate label.                                                                      |
| AC-05 | Text fields support `readOnly`; the other fields do not claim to.                                                         |
| AC-06 | Numeric `parse` stores a number and keeps partial input visible.                                                          |
| AC-07 | Dropdown and Combobox store the option value and display the resolved text; `reset` and `setValue` update the display.    |
| AC-08 | DatePicker label `for` matches the input id and hint/error associations are not duplicated.                               |
| AC-09 | `fieldState.error?.message` is the only error source; server `setError` updates the field.                                |
| AC-10 | Spec tests, impl tests, and package export tests pass.                                                                    |
| AC-11 | Stories cover default, required, hint, error, disabled, and the component-specific variants.                              |
| AC-12 | `pnpm verify`, `pnpm storybook:build`, and `pnpm pack:check` pass.                                                        |
| AC-13 | README and `AGENTS.md` document the new peers, field API, and anatomy exception.                                          |
| AC-14 | No changes to issue #2 files or downstream applications.                                                                  |

## 6. Out of scope

- Formik, Yup, Fluent UI v8.
- Zod or `@hookform/resolvers` in the component package.
- `useForm`, `FormProvider`, `useFormContext`, or form engines in the library.
- Multiselect Dropdown/Combobox, freeform Combobox, tag picker.
- DatePicker time picker, calendar customization beyond pass-through.
- A subpath export for forms or an optional peer strategy.
- React Hook Form transformed output types (`useForm<TInput, TContext, TOutput>`); the form value type is the field value type.
- SSR smoke tests.
- Application DTOs, business rules, or localized string resources.

## 7. Traceability

| Requirement | Design document          | Test cases          |
| ----------- | ------------------------ | ------------------- |
| FR-01       | `03-01` §2               | ST-01..ST-84, ST-86 |
| FR-02       | `03-01` §3               | ST-01..ST-12        |
| FR-03       | `03-01` §4               | ST-13..ST-22        |
| FR-04       | `03-02` §3               | ST-23..ST-32        |
| FR-05       | `03-02` §4               | ST-33..ST-41        |
| FR-06       | `03-02` §5               | ST-42..ST-51        |
| FR-07       | `03-03` §3               | ST-52..ST-62        |
| FR-08       | `03-03` §4               | ST-63..ST-73        |
| FR-09       | `03-04` §3               | ST-74..ST-84        |
| FR-10       | `03-01` §2, `99` Phase 8 | ST-85..ST-88        |
| FR-11       | `99` Phase 8             | ST-89..ST-90        |
| FR-12       | `07-testing-strategy.md` | All ST-*            |
