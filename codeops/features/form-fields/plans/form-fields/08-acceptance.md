# Acceptance audit — form fields

> **Feature**: `form-fields`
> **Date**: 2026-10-19
> **CodeOps Artifact Schema**: 1

## Verification evidence

| Check                   | Result                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `pnpm verify`           | Passing — 46 test files, 425 tests                                                      |
| `pnpm storybook:build`  | Passing                                                                                 |
| `pnpm pack:check`       | Passing — 146 files, no source or story files                                           |
| `dist/index.js`         | Imports `react-hook-form` and `@fluentui/react-datepicker-compat`; does not bundle them |
| Generated declarations  | Nested `dist/components/**/*.d.ts` reference the RHF and DatePicker peer types          |
| Issue #2 files          | No changes to `skills/`, `scripts/check-skill.mjs`, or `scripts/check-pack.mjs`         |
| Downstream applications | No changes                                                                              |

## Acceptance criteria

| ID    | Criterion                                                                     | Evidence                                                    | Status |
| ----- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- | ------ |
| AC-01 | All eight components implemented, exported, and typed                         | `src/index.ts`; `test/package-exports.spec.test.ts`         | ✅     |
| AC-02 | Every component uses `useController` with `control`/`name`                    | `src/forms/useFormField.ts`; impl tests                     | ✅     |
| AC-03 | Label, hint, error, required, and disabled associations                       | Spec tests for all eight components                         | ✅     |
| AC-04 | Checkbox and Switch do not render duplicate labels                            | Checkbox/Switch specs assert exactly one label              | ✅     |
| AC-05 | Text fields support read-only; others do not claim it                         | Text/textarea specs; public types omit `readOnly` elsewhere | ✅     |
| AC-06 | Numeric parse stores a number and keeps partial input                         | Text and textarea parse specs (`42`, `1.`, `-`)             | ✅     |
| AC-07 | Dropdown/Combobox store the option value and display resolved text            | Selection specs; `getOptionText`; reset/setValue cases      | ✅     |
| AC-08 | DatePicker label `for` matches the input and no duplicate described-by        | DatePicker spec and compatibility check                     | ✅     |
| AC-09 | `fieldState.error?.message` is the only error source; server `setError` works | All specs use `setError`; shared hook                       | ✅     |
| AC-10 | Spec, impl, and package export tests pass                                     | 425 tests passing                                           | ✅     |
| AC-11 | Stories cover the required variants                                           | Eight story files; Storybook build                          | ✅     |
| AC-12 | `pnpm verify`, `pnpm storybook:build`, and `pnpm pack:check` pass             | Commands above                                              | ✅     |
| AC-13 | README and `AGENTS.md` document peers, API, and anatomy exception             | `packages/react-components/README.md`; `AGENTS.md`          | ✅     |
| AC-14 | No issue #2 files or downstream changes                                       | `git diff --name-only 924a0bc..HEAD` review                 | ✅     |

## Deferred follow-ups

- Multiselect Dropdown/Combobox.
- Freeform Combobox.
- A forms subpath export to make the peers optional.
- SSR smoke tests for the field wrappers.
- DatePicker time picker.
- RadioGroup focus-on-error target.

## Separate follow-up

The feature implementation is Done. The GitHub verification comment and closure are tracked as `T-01` in `codeops/features/form-fields/00-roadmap.md`; they are a project-management action, not an implementation task. Closing the issue remains a separate user decision.
