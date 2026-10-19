# RD-01: React Hook Form Field Components

> **Document**: RD-01-react-hook-form-fields.md
> **Status**: Implemented
> **Created**: 2026-10-19
> **Project**: fluentui-react-components
> **Depends On**: —
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Applications using Fluent UI v9 and React Hook Form currently wire every field by hand: `useController`, the primitive's value and change handler, `Field` for the label and error, and the accessibility ids. The wiring is repetitive and easy to get subtly wrong, especially for toggles, selection fields and dates.

This feature adds eight thin field wrappers to `@blendsdk/fluentui-react-components`:

1. **`FormTextField`** — `Input`.
2. **`FormTextareaField`** — `Textarea`.
3. **`FormCheckboxField`** — `Checkbox`, including the mixed state.
4. **`FormSwitchField`** — `Switch`, including `disabledFocusable`.
5. **`FormRadioGroupField`** — `RadioGroup` with a Field-owned group label.
6. **`FormDropdownField`** — single-select `Dropdown`.
7. **`FormComboboxField`** — single-select, selection-only `Combobox`.
8. **`FormDatePickerField`** — `DatePicker` from `@fluentui/react-datepicker-compat`.

Every wrapper calls `useController` once, reads `field.value`, writes through `field.onChange`, merges a caller's `onBlur` with `field.onBlur`, and renders `fieldState.error?.message` through Fluent `Field`. The form engine, schema, resolver, DTO mapping and business rules stay in the application.

The implemented plan and verification evidence are in [`../plans/form-fields/00-index.md`](../plans/form-fields/00-index.md) and [`../plans/form-fields/08-acceptance.md`](../plans/form-fields/08-acceptance.md).

---

## Functional Requirements

### Must Have (M)

- [x] **R1 — Shared field contract.** Every wrapper accepts `control: Control<TFieldValues>`, `name: FieldPathByValue<TFieldValues, TValue>`, `label: string`, optional `hint`, and optional `required`. It uses `useController`, reads `field.value`, writes through `field.onChange`, calls `field.onBlur`, and renders `fieldState.error?.message` through `Field`. The forwarded ref points at the focusable control and is merged with `field.ref`.
- [x] **R2 — `FormTextField`.** Wraps `Input`; supports `readOnly`, `disabled` and native `Input` props. `parse` converts raw text to a non-string form value; raw partial input (`1.`, `-`) stays visible while the parsed value reaches the form.
- [x] **R3 — `FormTextareaField`.** Wraps `Textarea` with the same value, parse, read-only, disabled and external-sync behavior.
- [x] **R4 — `FormCheckboxField`.** Wraps `Checkbox`; the primitive owns the label. The form value supports `boolean` and `'mixed'`; the mixed state renders indeterminate and clicking clears it. `Field` supplies hint, validation and required state.
- [x] **R5 — `FormSwitchField`.** Wraps `Switch`; the primitive owns the label. Supports `boolean`, `disabled` and `disabledFocusable`; `Field` supplies hint, validation and required state.
- [x] **R6 — `FormRadioGroupField`.** Wraps `RadioGroup`; `Field` owns the group label and required state, while each `Radio` keeps its own label. The form value is the selected radio's string value; no selection is the empty string. `required` is exposed as `aria-required` on the group.
- [x] **R7 — `FormDropdownField`.** Single-select only. The form stores the option value; the empty string means no selection. `getOptionText` resolves the display text after `reset` or `setValue`; without it the raw value is shown. Selecting commits `data.optionValue ?? ''`; a click clear commits `''`.
- [x] **R8 — `FormComboboxField`.** Single-select, selection-only. Typing updates local input text but does not change the form value until an option is selected. Selecting commits the option value and displays its text; blur or popup close reverts uncommitted text. Fluent's change-driven clear is ignored; a click clear or an explicit empty-value option commits `''`. No `freeform` or `multiselect`.
- [x] **R9 — `FormDatePickerField`.** Uses `@fluentui/react-datepicker-compat`; the form value is `Date | null`. `Field` owns label, hint, required and validation. The Field render-function child passes only the generated `id` so the label `for` matches the input and `aria-describedby` is not duplicated. Editability follows `allowTextInput`.
- [x] **R10 — Public surface and peers.** The package root exports all eight components and their props types. `react-hook-form` (`^7.55.0`) and `@fluentui/react-datepicker-compat` (`^0.6.0`) are peers and dev dependencies. React Hook Form and the DatePicker package stay external in the build; the package still publishes only `dist`.
- [x] **R11 — Accessibility.** Labels, hints, required state, error messages and disabled state are associated with the control. Checkbox and Switch render exactly one label. RadioGroup exposes its group name through `aria-labelledby` and its required state through `aria-required`. The Combobox documents an empty-value option as the keyboard-accessible clear path.
- [x] **R12 — Tests and stories.** Each component has a specification test written before implementation, an implementation test, and a Storybook story. The package-export and type contract test pins the runtime surface and the `FieldPathByValue` checks.
- [x] **R13 — Documentation.** The package README documents the peers, the eight components, `parse`, `getOptionText`, the empty-string selection convention, the DatePicker compat package and the app-side Zod boundary. `AGENTS.md` records the no-styles exception and the `src/forms/` helpers.
- [x] **R14 — Verification.** `pnpm verify`, `pnpm storybook:build` and `pnpm pack:check` pass. No Fluent UI v8, Formik, Yup or application-specific business rules are introduced.
- [x] **R15 — Scope discipline.** No `useForm`, resolver, Zod, `FormProvider` or form engine in the component package. No multiselect, freeform Combobox, forms subpath export, SSR smoke test or DatePicker time picker in this RD.

### Should Have

- None. The RD is deliberately limited to the eight wrappers and their shared binding.

### Won't Have (Out of Scope)

- Multiselect Dropdown or Combobox.
- Freeform Combobox.
- A forms subpath export or optional-peer strategy.
- `FormProvider`/`useFormContext` support; `control` is required.
- React Hook Form transformed output types (`useForm<TInput, TContext, TOutput>`).
- SSR smoke tests for the field wrappers.
- DatePicker time picker or calendar customization beyond pass-through props.
- Formik, Yup, Fluent UI v8.
- Application DTOs, business rules, schema definitions or localized string resources.

---

## Technical Requirements

### Compatibility

- React 19 and Fluent UI v9 (`@fluentui/react-components ^9.0.0`) are peers supplied by the application.
- React Hook Form peer `^7.55.0`; the repository tests `7.90.0`.
- DatePicker uses `@fluentui/react-datepicker-compat` `^0.6.x`; its 0.x status is documented. The compat package's Field context was verified in the repository tree.
- No Fluent UI v8 or Formik code.

### Type safety

- `control` and `name` are generic; `FieldPathByValue` rejects a path whose value type does not match the field.
- No `any`, `as any`, `as unknown`, `@ts-ignore` or unsafe cast in the implementation. The only typed assertion is the documented generic `forwardRef` bridge.
- The package-export test pins the runtime surface and the props type contracts.

### Accessibility

- `Field` supplies the label, hint, required marker and validation message except where the primitive owns its label (Checkbox, Switch, individual Radio children).
- Errors render through `Field`'s alert region and set `aria-invalid` on the control.
- `disabled` removes the control from interaction; `readOnly` keeps text values readable and focusable.
- The DatePicker's label `for` matches the input id; its `aria-describedby` is not duplicated.
- The Combobox's Fluent clear affordance is pointer-only; the empty-value option is the documented keyboard path.

### Performance

- Each field subscribes through `useController` only; no `watch`, no `formState` subscription, no duplicated form value.
- Local text state exists only for parsed text fields and Combobox filtering.
- The wrappers add no stylesheet, animation, portal or global state.

### Security

- The wrappers add no network, storage, authentication, authorization, server input path or rate limiting. They render strings as text; React escapes them.
- `parse`, `formatDate` and `parseDateFromString` are caller-supplied pure functions; the package does not evaluate or transmit their results.

### Localization

- `label` and `hint` are plain string props; the package ships no string resources. Applications pass translated text.
- DatePicker `strings`, `formatDate` and `parseDateFromString` pass through so applications can localize the calendar and the input format.

### Documentation

- Every public component, prop, hook and internal non-trivial helper has a documentation comment in teaching tone.
- The package README documents the field API and the DatePicker compat peer.
- Storybook stories cover the documented variants and include a manual review checklist.

---

## Scope Decisions

| Decision               | Chosen                                                               | Rationale                                                                              | AR Ref |
| ---------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------ |
| DatePicker             | Include with `@fluentui/react-datepicker-compat`                     | The user chose all eight fields; the compat package is the supported v9 implementation | AR-02  |
| DatePicker id          | Field render-function child passes only `id`                         | Fixes the label `for` without duplicating `aria-describedby`                           | AR-03  |
| Selection display text | Optional `getOptionText`                                             | Keeps stable option values and resolves display after reset/setValue                   | AR-04  |
| Selection cardinality  | Single-select only                                                   | The issue's field contract is single-value; multiselect needs a separate contract      | AR-05  |
| Labels                 | Field owns labels except Checkbox/Switch/individual Radios           | Fluent primitives own those labels; a second label would be wrong                      | AR-06  |
| Read-only              | Text fields only; DatePicker follows `allowTextInput`                | The other primitives have no read-only state                                           | AR-07  |
| Styles                 | No per-component styles layer                                        | Fluent `Field` owns layout and validation styling                                      | AR-08  |
| Numeric parse          | Local raw text; parsed value on change                               | Keeps `1.` and `-` typable                                                             | AR-09  |
| No selection           | Empty string                                                         | `undefined` did not re-render through `useController`/`useWatch`                       | AR-31  |
| Combobox typing        | Ignore change-driven clears; commit click clears and defined options | A selection-only field must not commit while the user types                            | AR-32  |

---

## Acceptance Criteria

| ID    | Criterion                                                                     | Evidence                                         |
| ----- | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| AC-01 | All eight components implemented, exported and typed                          | Package export test; `src/index.ts`              |
| AC-02 | Every component uses `useController` with the supplied `control`/`name`       | Shared `useFormField`; impl tests                |
| AC-03 | Label, hint, error, required and disabled associations work                   | Spec tests for all eight components              |
| AC-04 | Checkbox and Switch render exactly one label                                  | Checkbox/Switch specs                            |
| AC-05 | Text fields support read-only; other fields do not claim it                   | Text/textarea specs; public types                |
| AC-06 | Numeric parse stores a number and keeps partial input                         | Text/textarea parse specs                        |
| AC-07 | Dropdown/Combobox store the option value and resolve display text             | Selection specs; `getOptionText`; reset/setValue |
| AC-08 | DatePicker label `for` matches the input and no duplicate described-by        | DatePicker spec                                  |
| AC-09 | `fieldState.error?.message` is the only error source; server `setError` works | Specs; shared hook                               |
| AC-10 | Spec, impl and package export tests pass                                      | 425 tests                                        |
| AC-11 | Storybook covers the required variants                                        | Eight story files; Storybook build               |
| AC-12 | `pnpm verify`, `pnpm storybook:build`, `pnpm pack:check` pass                 | Acceptance evidence                              |
| AC-13 | README and `AGENTS.md` document peers, API and anatomy exception              | Repository docs                                  |
| AC-14 | No issue #2 files or downstream changes                                       | Git diff review                                  |

---

## Verification Evidence

| Check                  | Result                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm verify`          | 46 test files, 425 tests passing                                                                     |
| `pnpm storybook:build` | Passing                                                                                              |
| `pnpm pack:check`      | 146 files, no source or story files                                                                  |
| Bundle externalization | `react-hook-form` and `@fluentui/react-datepicker-compat` imported, not bundled                      |
| Type declarations      | Nested `dist/components/**/*.d.ts` reference the peer types                                          |
| Review                 | One major Combobox accessibility finding fixed and re-reviewed; all minor findings fixed or accepted |

---

## References

- Plan: [`../plans/form-fields/00-index.md`](../plans/form-fields/00-index.md)
- Acceptance evidence: [`../plans/form-fields/08-acceptance.md`](../plans/form-fields/08-acceptance.md)
- Findings ledger: [`../plans/form-fields/05-findings.md`](../plans/form-fields/05-findings.md)
- GitHub issue #1: <https://github.com/blendsdk/fluentui-react-components/issues/1>
- Fluent UI v9 `Field`: <https://react.fluentui.dev/?path=/docs/components-field--docs>
- React Hook Form `useController`: <https://react-hook-form.com/docs/usecontroller>
- DatePicker compat: `@fluentui/react-datepicker-compat@0.6.x`
