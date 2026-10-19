# Form fields — requirements and implementation plan

> **Implements**: `form-fields/RD-01`
> **Source**: [RD-01](../../requirements/RD-01-react-hook-form-fields.md) · [GitHub issue #1](https://github.com/blendsdk/fluentui-react-components/issues/1)
> **Feature**: `form-fields`
> **CodeOps Artifact Schema**: 1
> **Status**: Done — implementation and verification complete; the GitHub hand-off is tracked as `T-01`
> **Date**: 2026-10-19

## Why this plan exists

Issue #1 asks for React Hook Form field wrappers around the Fluent UI v9 primitives. The issue is a strong specification, but five points conflict with the real library contracts. This plan resolves them before implementation:

1. DatePicker is not part of `@fluentui/react-components`; it needs the separate compat package.
2. Checkbox and Switch render their own labels; `Field` must not add a second one.
3. Only Input and Textarea support `readOnly`; the other primitives do not.
4. Dropdown and Combobox split the stored option value from the displayed text.
5. Parsing on every keystroke breaks numeric typing unless the raw text is kept locally.

The decisions and their evidence are in [`00-ambiguity-register.md`](./00-ambiguity-register.md). The gate passed; there are no open material items.

## Document map

| Document                                                                 | Owns                                                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| [`00-ambiguity-register.md`](./00-ambiguity-register.md)                 | Every decision, its evidence, and the Zero-Ambiguity Gate proof                               |
| [`01-requirements.md`](./01-requirements.md)                             | Functional requirements, non-functional requirements, acceptance criteria, out-of-scope items |
| [`02-current-state.md`](./02-current-state.md)                           | Repository analysis, Fluent UI primitive contracts, RHF types, DatePicker spike, risks        |
| [`03-01-shared-and-text-fields.md`](./03-01-shared-and-text-fields.md)   | Shared field contract, `FormTextField`, `FormTextareaField`                                   |
| [`03-02-toggle-and-radio-fields.md`](./03-02-toggle-and-radio-fields.md) | `FormCheckboxField`, `FormSwitchField`, `FormRadioGroupField`                                 |
| [`03-03-selection-fields.md`](./03-03-selection-fields.md)               | `FormDropdownField`, `FormComboboxField`                                                      |
| [`03-04-date-picker-field.md`](./03-04-date-picker-field.md)             | `FormDatePickerField`, DatePicker compat integration                                          |
| [`07-testing-strategy.md`](./07-testing-strategy.md)                     | Specification test cases (ST-*), implementation tests, verification                           |
| [`08-acceptance.md`](./08-acceptance.md)                                 | Acceptance evidence and deferred follow-ups                                                   |
| [`99-execution-plan.md`](./99-execution-plan.md)                         | Phases, sessions, task checklist, progress authority                                          |

## Scope baseline

### In scope

- Eight field components: `FormTextField`, `FormTextareaField`, `FormCheckboxField`, `FormSwitchField`, `FormRadioGroupField`, `FormDropdownField`, `FormComboboxField`, `FormDatePickerField`.
- A shared internal field contract in `src/forms/`.
- React Hook Form peer and dev dependencies; DatePicker compat peer and dev dependencies.
- Vite externalization for React Hook Form.
- Spec tests, impl tests, stories, package exports, and documentation.
- Package README and `AGENTS.md` updates.

### Out of scope

- Formik, Yup, Fluent UI v8.
- `useForm`, resolvers, Zod, or DTO mapping inside the library.
- Multiselect Dropdown or Combobox, and freeform Combobox.
- `FormProvider`/`useFormContext` support; `control` is required.
- A separate package subpath for forms.
- Changes to `blendsdk`, `blendsdk/react`, or downstream applications.
- Issue #2 files: `skills/`, `scripts/check-skill.mjs`, `scripts/check-pack.mjs`, package `files`/`prepack`.
- SSR smoke tests for the field wrappers.
- DatePicker time picker or calendar customization beyond pass-through props.

## Key decisions

| Decision                       | Resolution                                                          | Ref          |
| ------------------------------ | ------------------------------------------------------------------- | ------------ |
| Field count                    | All eight, including DatePicker                                     | AR-01, AR-02 |
| Checkbox/Switch label          | Primitive owns the label; `Field` owns hint/error/required          | AR-06        |
| Read-only                      | Text fields only; DatePicker uses `allowTextInput`                  | AR-07        |
| Dropdown/Combobox display text | Optional `getOptionText` resolver                                   | AR-04        |
| Numeric parse                  | Local raw text; parsed value on change                              | AR-09        |
| Styles layer                   | No per-component styles file; Fluent `Field` owns layout            | AR-08        |
| DatePicker id                  | `Field` render-function child passes only the generated `id`        | AR-03        |
| Build                          | `react-hook-form` externalized; DatePicker covered by `@fluentui/*` | AR-16        |

## Phase summary

| Phase | Work                                                                     | Sessions |
| ----- | ------------------------------------------------------------------------ | -------- |
| 0     | Baseline, dependencies, Vite external, shared form helpers, test harness | 2        |
| 1     | `FormTextField`                                                          | 3        |
| 2     | `FormTextareaField`                                                      | 3        |
| 3     | `FormCheckboxField` and `FormSwitchField`                                | 3        |
| 4     | `FormRadioGroupField`                                                    | 3        |
| 5     | `FormDropdownField`                                                      | 3        |
| 6     | `FormComboboxField`                                                      | 3        |
| 7     | `FormDatePickerField` (starts with the go/no-go spike)                   | 3        |
| 8     | Integration, docs, full verification, issue hand-off                     | 2        |

Total: 9 phases, 25 sessions. Session count is an execution estimate, not a deadline.

## Specialist check

**None.** The work follows the repository's existing Fluent UI component pattern and adds no new domain: it is generic TypeScript, Fluent UI composition, accessibility wiring, and build configuration. The repository's specialist coverage is current; no reviewer role is warranted. The DatePicker compatibility spike covers the only external risk.

## Verification

Detected from `AGENTS.md` and `.github/workflows/ci.yml`:

```bash
pnpm verify
pnpm storybook:build
pnpm pack:check
```

Focused loops:

```bash
pnpm --filter @blendsdk/fluentui-react-components exec vitest run test/form-text-field.spec.test.tsx
pnpm --filter @blendsdk/fluentui-react-components exec vitest run test/form-text-field.impl.test.tsx
```

## Execution note

These documents are the durable execution record at `codeops/features/form-fields/plans/form-fields/`. The feature roadmap is [`../../00-roadmap.md`](../../00-roadmap.md); the requirement is [`../../requirements/RD-01-react-hook-form-fields.md`](../../requirements/RD-01-react-hook-form-fields.md).

## Outcome

The implementation is complete. `pnpm verify` (425 tests), `pnpm storybook:build` and `pnpm pack:check` pass; the acceptance evidence is in [`08-acceptance.md`](./08-acceptance.md). The GitHub verification comment and closure are tracked separately as `T-01` in the feature roadmap.
