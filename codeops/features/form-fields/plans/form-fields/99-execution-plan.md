# Execution plan — React Hook Form field components

> **Feature**: `form-fields`
> **Implements**: `form-fields/RD-01`
> **Source**: [RD-01](../../requirements/RD-01-react-hook-form-fields.md)
> **CodeOps Artifact Schema**: 1
> **Progress**: 61/61 tasks (100%)
> **Reasoning**: high — generic TypeScript contracts, Fluent UI accessibility wiring, and a 0.x DatePicker peer dependency

## How to execute

- Run phases in order. Do not start a phase until the previous phase's verify passes.
- Each phase follows the same order: **spec tests → red → implementation → green → impl tests → harden**.
- The specification tests in `test/form-*.spec.test.tsx` are the immutable oracle. A failing spec means the implementation is wrong; never edit the spec to make it pass.
- Use `fireEvent`/`act`; do not add `@testing-library/user-event`.
- No styles files for the field wrappers; Fluent `Field` owns layout (AR-08).
- Do not touch issue #2 files: `skills/`, `scripts/check-skill.mjs`, `scripts/check-pack.mjs`, package `files`, `prepack`.
- Commit after each verified phase using the `git-commit` skill, per the execution mode. The plan contains no raw git commands.
- If Phase 7's compatibility spike fails, stop and return to the user before adding a workaround (AR-30).

## Session boundaries

| Phase            | Sessions                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| 0                | 2 sessions: P0-T1..P0-T4 (baseline/dependencies/spike), P0-T5..P0-T7 (shared helpers/harness/verify) |
| 1, 2, 4, 5, 6, 7 | 3 sessions each: specification tests; implementation + story; impl tests + export guard + verify     |
| 3                | 3 sessions: both spec files; both implementations + stories; both impl tests + export guard + verify |
| 8                | 2 sessions: P8-T1..P8-T4 (exports/docs/bundle), P8-T5..P8-T8 and P8-T10 (full gate/audit/commit)     |

The task list below is the single source of truth; the session split only groups the work.

## Phase 0 — Baseline, dependencies, and shared foundation

**Goal:** a clean baseline, the new peers installed, React Hook Form externalized, the DatePicker integration proven in the repository tree, and the shared internal helpers ready.

- [x] **P0-T1 — Record the baseline.** Run `pnpm install --frozen-lockfile` and `pnpm verify` on the starting branch; confirm both pass. Record the starting commit in the execution log. ✅ (completed: 2026-10-19 11:58)
  - Verify: both commands exit 0.
- [x] **P0-T2 — Add the dependencies.** In `packages/react-components/package.json`, add `react-hook-form` to `peerDependencies` (`^7.55.0`) and `devDependencies` (`^7.90.0`), and `@fluentui/react-datepicker-compat` to `peerDependencies` (`^0.6.0`) and `devDependencies` (`^0.6.39`). Run `pnpm install` and confirm one lockfile. ✅ (completed: 2026-10-19 12:01)
  - Verify: `pnpm install --frozen-lockfile` from a clean state; `pnpm why react-hook-form` resolves one version.
- [x] **P0-T3 — Externalize React Hook Form.** Add `/^react-hook-form($|\/)/` to the `external` list in `packages/react-components/vite.config.ts`; update the explanatory comment to name RHF and the DatePicker compat package. ✅ (completed: 2026-10-19 12:05)
  - Verify: `pnpm --filter @blendsdk/fluentui-react-components build`; inspect `dist/index.js` for an RHF import, not bundled RHF code. The source does not import RHF yet, so the bundle check is repeated in P8-T4 after the components use it.
- [x] **P0-T4 — DatePicker compatibility spike (go/no-go).** In the repository dependency tree, render `Field` + `DatePicker` twice: element child, then render-function child passing only `id`. Confirm the render-function form gives a matching label `for` and a single `hint`/`error` in `aria-describedby`. Put the temporary spike file under `$CODEOPS_TMPDIR` (fallback `/tmp/opencode`), using the repository's installed dependencies; remove it afterward. ✅ (completed: 2026-10-19 12:09)
  - Verify: the spike output shows `id` equality and no duplicated described-by ids; if not, stop and return to the user (AR-30).
- [x] **P0-T5 — Create the shared helpers.** Add `src/forms/FormField.types.ts`, `src/forms/useFormField.ts`, `src/forms/formFieldValues.ts`, and `src/forms/useTextValueState.ts` per `03-01-shared-and-text-fields.md`. JSDoc every exported symbol; no plan or issue references in comments. ✅ (completed: 2026-10-19 12:12)
  - Verify: `pnpm --filter @blendsdk/fluentui-react-components type-check`.
- [x] **P0-T6 — Create the test harness.** Add `test/form-test-utils.tsx` with `renderWithForm`, importing `useForm` from `react-hook-form` and wrapping in `FluentProvider`. ✅ (completed: 2026-10-19 12:15)
  - Verify: `pnpm --filter @blendsdk/fluentui-react-components type-check`; the file is not picked up as a test.
- [x] **P0-T7 — Phase verify and commit.** Run format, type-check, and the existing test suite. Commit via the `git-commit` skill. ✅ (completed: 2026-10-19 12:18)
  - Verify: `pnpm format:check && pnpm type-check && pnpm test`.

## Phase 1 — `FormTextField`

**Goal:** the first complete field, proving the shared contract, the generic `forwardRef`, Field composition, parse behavior, tests, and story.

- [x] **P1-T1 — Write the spec tests (red).** Add `test/form-text-field.spec.test.tsx` covering ST-01..ST-12 from `07-testing-strategy.md`. Import `FormTextField` from `../src/index`; run the focused spec and confirm it fails because the export/implementation is missing. ✅ (completed: 2026-10-19 12:21)
  - Verify: `pnpm --filter @blendsdk/fluentui-react-components exec vitest run test/form-text-field.spec.test.tsx` fails for the expected reason. (12/12 failed: `FormTextField` is undefined.)
- [x] **P1-T2 — Implement the component.** Add `src/components/FormTextField/{FormTextField.tsx,FormTextField.types.ts,useFormTextField.ts,renderFormTextField.tsx,index.ts}` per `03-01` §2. No styles file. JSDoc the props and the generic `forwardRef` bridge. ✅ (completed: 2026-10-19 12:04)
  - Verify: the focused spec's import resolves; type-check reports the remaining red failures, not syntax errors.
- [x] **P1-T3 — Export and turn green.** Add `FormTextField` and `FormTextFieldProps` to `src/index.ts`; run the focused spec until all ST-01..ST-12 pass. Do not edit the spec. ✅ (completed: 2026-10-19 12:04)
  - Verify: focused spec passes.
- [x] **P1-T4 — Add the story.** Add `src/components/FormTextField/stories/FormTextField.stories.tsx` with Default, Required, WithHint, WithError, Disabled, ReadOnly, Numeric, and Filled. Use a concrete story wrapper for Storybook's `Meta` type. ✅ (completed: 2026-10-19 12:08)
  - Verify: `pnpm --filter @blendsdk/fluentui-react-components storybook:build` succeeds.
- [x] **P1-T5 — Add impl tests.** Add `test/form-text-field.impl.test.tsx` covering the FormTextField row in `07-testing-strategy.md` §4. ✅ (completed: 2026-10-19 12:07)
  - Verify: focused impl test passes.
- [x] **P1-T6 — Guard the export and types.** Add `FormTextField` to the sorted runtime list in `test/package-exports.spec.test.ts` and add a type assertion for `FormTextFieldProps` with a concrete form type. ✅ (completed: 2026-10-19 12:07)
  - Verify: `pnpm --filter @blendsdk/fluentui-react-components exec vitest run test/package-exports.spec.test.ts`.
- [x] **P1-T7 — Phase verify and commit.** Run format, type-check, focused specs/impls, and the full test suite. Commit via the `git-commit` skill. ✅ (completed: 2026-10-19 12:08)
  - Verify: `pnpm format:check && pnpm type-check && pnpm test`. (Full `pnpm verify`: 307 tests passing.)

## Phase 2 — `FormTextareaField`

**Goal:** the textarea variant reuses the shared text state and Field composition.

- [x] **P2-T1 — Write the spec tests (red).** Add `test/form-textarea-field.spec.test.tsx` covering ST-13..ST-22; confirm red for the missing export. ✅ (completed: 2026-10-19 12:18)
  - Verify: focused spec fails for the expected reason. (10/10 failed: `FormTextareaField` is undefined.)
- [x] **P2-T2 — Implement and export.** Add `src/components/FormTextareaField/**` per `03-01` §3; export the component and props type from `src/index.ts`; run the focused spec green. ✅ (completed: 2026-10-19 12:19)
  - Verify: focused spec passes.
- [x] **P2-T3 — Add the story.** Add `stories/FormTextareaField.stories.tsx` with Default, Required, WithHint, WithError, Disabled, ReadOnly, Resizable. ✅ (completed: 2026-10-19 12:21)
  - Verify: `pnpm --filter @blendsdk/fluentui-react-components storybook:build`.
- [x] **P2-T4 — Add impl tests.** Add `test/form-textarea-field.impl.test.tsx` covering the FormTextareaField row in `07` §4. ✅ (completed: 2026-10-19 12:21)
  - Verify: focused impl test passes.
- [x] **P2-T5 — Guard the export and types.** Add the runtime export and props type assertion to `test/package-exports.spec.test.ts`. ✅ (completed: 2026-10-19 12:21)
  - Verify: package-exports spec passes.
- [x] **P2-T6 — Phase verify and commit.** Format, type-check, focused tests, full test suite; commit via `git-commit`. ✅ (completed: 2026-10-19 12:22)
  - Verify: `pnpm format:check && pnpm type-check && pnpm test`. (Full `pnpm verify`: 324 tests passing.)

## Phase 3 — `FormCheckboxField` and `FormSwitchField`

**Goal:** the toggle fields, including the primitive-owned label resolution and mixed/disabledFocusable behavior.

- [x] **P3-T1 — Write the spec tests (red).** Add `test/form-checkbox-field.spec.test.tsx` (ST-23..ST-32) and `test/form-switch-field.spec.test.tsx` (ST-33..ST-41); confirm both fail for the missing exports. ✅ (completed: 2026-10-19 12:28)
  - Verify: both focused specs fail for the expected reason. (19/19 failed: both components undefined.)
- [x] **P3-T2 — Implement and export Checkbox.** Add `src/components/FormCheckboxField/**` per `03-02` §2; export it; run the checkbox spec green. ✅ (completed: 2026-10-19 12:30)
  - Verify: `vitest run test/form-checkbox-field.spec.test.tsx`.
- [x] **P3-T3 — Implement and export Switch.** Add `src/components/FormSwitchField/**` per `03-02` §3; export it; run the switch spec green. ✅ (completed: 2026-10-19 12:30)
  - Verify: `vitest run test/form-switch-field.spec.test.tsx`.
- [x] **P3-T4 — Add the stories.** Add both story files with the variants in `07` §6, including Checkbox Mixed and Switch DisabledFocusable. ✅ (completed: 2026-10-19 12:32)
  - Verify: `pnpm --filter @blendsdk/fluentui-react-components storybook:build`.
- [x] **P3-T5 — Add impl tests.** Add both impl test files covering their rows in `07` §4. ✅ (completed: 2026-10-19 12:32)
  - Verify: both focused impl tests pass.
- [x] **P3-T6 — Guard the exports and types.** Add both runtime exports and both props type assertions to `test/package-exports.spec.test.ts`. ✅ (completed: 2026-10-19 12:32)
  - Verify: package-exports spec passes.
- [x] **P3-T7 — Phase verify and commit.** Format, type-check, focused tests, full test suite; commit via `git-commit`. ✅ (completed: 2026-10-19 12:34)
  - Verify: `pnpm format:check && pnpm type-check && pnpm test`. (Full `pnpm verify`: 356 tests passing.)

## Phase 4 — `FormRadioGroupField`

**Goal:** the grouped radio field with a Field-owned group label, aria-required, and the documented focus limitation.

- [x] **P4-T1 — Write the spec tests (red).** Add `test/form-radio-group-field.spec.test.tsx` covering ST-42..ST-51; confirm red. ✅ (completed: 2026-10-19 12:40)
  - Verify: focused spec fails for the expected reason. (10/10 failed: `FormRadioGroupField` is undefined.)
- [x] **P4-T2 — Implement and export.** Add `src/components/FormRadioGroupField/**` per `03-02` §4; export it; run the spec green. ✅ (completed: 2026-10-19 12:41)
  - Verify: focused spec passes.
- [x] **P4-T3 — Add the story.** Add `stories/FormRadioGroupField.stories.tsx` with Default, Selected, Required, WithHint, WithError, Disabled, Layouts. ✅ (completed: 2026-10-19 12:43)
  - Verify: `pnpm --filter @blendsdk/fluentui-react-components storybook:build`.
- [x] **P4-T4 — Add impl tests.** Add `test/form-radio-group-field.impl.test.tsx` covering the RadioGroup row in `07` §4. ✅ (completed: 2026-10-19 12:42)
  - Verify: focused impl test passes.
- [x] **P4-T5 — Guard the export and types.** Add the runtime export and props type assertion to `test/package-exports.spec.test.ts`. ✅ (completed: 2026-10-19 12:43)
  - Verify: package-exports spec passes.
- [x] **P4-T6 — Phase verify and commit.** Format, type-check, focused tests, full test suite; commit via `git-commit`. ✅ (completed: 2026-10-19 12:45)
  - Verify: `pnpm format:check && pnpm type-check && pnpm test`. (Full `pnpm verify`: 372 tests passing.)

## Phase 5 — `FormDropdownField`

**Goal:** single-select Dropdown with option-value storage and `getOptionText` display resolution.

- [x] **P5-T1 — Write the spec tests (red).** Add `test/form-dropdown-field.spec.test.tsx` covering ST-52..ST-62; use `inlinePopup`; confirm red. ✅ (completed: 2026-10-19 12:53)
  - Verify: focused spec fails for the expected reason. (11/11 failed: `FormDropdownField` is undefined.)
- [x] **P5-T2 — Implement and export.** Add `src/components/FormDropdownField/**` per `03-03` §3; export it; run the spec green. ✅ (completed: 2026-10-19 12:56)
  - Verify: focused spec passes.
- [x] **P5-T3 — Add the story.** Add `stories/FormDropdownField.stories.tsx` with Default, Selected (value ≠ text), Required, WithHint, WithError, Disabled, Clearable, InlinePopup. ✅ (completed: 2026-10-19 12:58)
  - Verify: `pnpm --filter @blendsdk/fluentui-react-components storybook:build`.
- [x] **P5-T4 — Add impl tests.** Add `test/form-dropdown-field.impl.test.tsx` covering the Dropdown row in `07` §4. ✅ (completed: 2026-10-19 12:58)
  - Verify: focused impl test passes.
- [x] **P5-T5 — Guard the export and types.** Add the runtime export and props type assertion to `test/package-exports.spec.test.ts`. ✅ (completed: 2026-10-19 12:58)
  - Verify: package-exports spec passes.
- [x] **P5-T6 — Phase verify and commit.** Format, type-check, focused tests, full test suite; commit via `git-commit`. ✅ (completed: 2026-10-19 13:00)
  - Verify: `pnpm format:check && pnpm type-check && pnpm test`. (Full `pnpm verify`: 389 tests passing.)

## Phase 6 — `FormComboboxField`

**Goal:** selection-only Combobox with local filter text, commit-on-select, and blur revert.

- [x] **P6-T1 — Write the spec tests (red).** Add `test/form-combobox-field.spec.test.tsx` covering ST-63..ST-73; use `inlinePopup`; confirm red. ✅ (completed: 2026-10-19 13:07)
  - Verify: focused spec fails for the expected reason. (11/11 failed: `FormComboboxField` is undefined.)
- [x] **P6-T2 — Implement and export.** Add `src/components/FormComboboxField/**` per `03-03` §4; export it; run the spec green. ✅ (completed: 2026-10-19 13:10)
  - Verify: focused spec passes.
- [x] **P6-T3 — Add the story.** Add `stories/FormComboboxField.stories.tsx` with Default, Selected (value ≠ text), TypingAndRevert, Required, WithHint, WithError, Disabled, Clearable, InlinePopup. ✅ (completed: 2026-10-19 13:12)
  - Verify: `pnpm --filter @blendsdk/fluentui-react-components storybook:build`.
- [x] **P6-T4 — Add impl tests.** Add `test/form-combobox-field.impl.test.tsx` covering the Combobox row in `07` §4. ✅ (completed: 2026-10-19 13:11)
  - Verify: focused impl test passes.
- [x] **P6-T5 — Guard the export and types.** Add the runtime export and props type assertion to `test/package-exports.spec.test.ts`. ✅ (completed: 2026-10-19 13:12)
  - Verify: package-exports spec passes.
- [x] **P6-T6 — Phase verify and commit.** Format, type-check, focused tests, full test suite; commit via `git-commit`. ✅ (completed: 2026-10-19 13:13)
  - Verify: `pnpm format:check && pnpm type-check && pnpm test`. (Full `pnpm verify`: 406 tests passing.)

## Phase 7 — `FormDatePickerField`

**Goal:** the DatePicker wrapper with the render-function id workaround and the extra peer.

- [x] **P7-T1 — Re-run the compatibility spike and decide.** Repeat P0-T4 in the repository tree using a temporary file under `$CODEOPS_TMPDIR`; confirm label `for` matches the input id and `aria-describedby` is not duplicated. If it fails, stop and return to the user before writing the component. ✅ (completed: 2026-10-19 13:28)
  - Verify: spike assertions pass; the wrapper spec also asserts label `for` equality and a single described-by id.
- [x] **P7-T2 — Write the spec tests (red).** Add `test/form-date-picker-field.spec.test.tsx` covering ST-74..ST-84; use `allowTextInput` for value-path tests; confirm red. ✅ (completed: 2026-10-19 13:28)
  - Verify: focused spec fails for the expected reason. (11/11 failed: `FormDatePickerField` is undefined.)
- [x] **P7-T3 — Implement and export.** Add `src/components/FormDatePickerField/**` per `03-04`; export it; run the spec green. ✅ (completed: 2026-10-19 13:29)
  - Verify: focused spec passes.
- [x] **P7-T4 — Add the story.** Add `stories/FormDatePickerField.stories.tsx` with Default, Selected, Required, WithHint, WithError, Disabled, AllowTextInput, Localized, Calendar. ✅ (completed: 2026-10-19 13:31)
  - Verify: `pnpm --filter @blendsdk/fluentui-react-components storybook:build`.
- [x] **P7-T5 — Add impl tests.** Add `test/form-date-picker-field.impl.test.tsx` covering the DatePicker row in `07` §4, including the “only `id` from `fieldProps`” assertion. ✅ (completed: 2026-10-19 13:30)
  - Verify: focused impl test passes.
- [x] **P7-T6 — Guard the export and types.** Add the runtime export and props type assertion to `test/package-exports.spec.test.ts`. ✅ (completed: 2026-10-19 13:31)
  - Verify: package-exports spec passes.
- [x] **P7-T7 — Phase verify and commit.** Format, type-check, focused tests, full test suite; commit via `git-commit`. ✅ (completed: 2026-10-19 13:32)
  - Verify: `pnpm format:check && pnpm type-check && pnpm test`. (Full `pnpm verify`: 424 tests passing.)

## Phase 8 — Integration, documentation, and full gate

**Goal:** all eight components on the public surface, the docs accurate, the bundle externalized, and the full repository gate green.

- [x] **P8-T1 — Finalize the export guard.** Confirm the runtime list in `test/package-exports.spec.test.ts` contains exactly all eight components in sorted order; add the remaining props type assertions and the `@ts-expect-error` wrong-name check from ST-86. ✅ (completed: 2026-10-19 13:44)
  - Verify: package-exports spec passes; `pnpm type-check`.
- [x] **P8-T2 — Update the package README.** Add the install command with `react-hook-form` and `@fluentui/react-datepicker-compat`; document the eight components, `parse`, `getOptionText`, `Date \| null`, the app-side Zod boundary, and the DatePicker 0.x note. See ST-89. ✅ (completed: 2026-10-19 13:46)
  - Verify: review against the ST-89 checklist.
- [x] **P8-T3 — Update `AGENTS.md`.** Record the field-wrapper anatomy exception (no styles file), the internal `src/forms/` helpers, and the new peer dependencies. ✅ (completed: 2026-10-19 13:47)
  - Verify: the exception is explicit; no installer-managed `.opencode/` file is edited.
- [x] **P8-T4 — Verify externalization.** Run the build; confirm `dist/index.js` imports `react-hook-form` and does not embed its implementation; confirm the generated declarations reference RHF and DatePicker types. ✅ (completed: 2026-10-19 13:48)
  - Verify: ST-87. (`dist/index.js` imports both peers; the nested `dist/components/**/*.d.ts` files reference the peer types.)
- [x] **P8-T5 — Full format and verify.** Run `pnpm format` if needed, then `pnpm verify`. ✅ (completed: 2026-10-19 13:50)
  - Verify: `pnpm verify` exits 0. (425 tests passing.)
- [x] **P8-T6 — Storybook build.** Run `pnpm storybook:build`; confirm every component story builds and the a11y addon has no violations in the default stories. ✅ (completed: 2026-10-19 13:50)
  - Verify: ST-90.
- [x] **P8-T7 — Pack guard.** Run `pnpm pack:check`; confirm the pack list is `dist/**` only and contains no source, story, or `.story.` files. ✅ (completed: 2026-10-19 13:50)
  - Verify: ST-88. (146 files, no source or story files.)
- [x] **P8-T8 — Acceptance audit.** Walk AC-01..AC-14 in `01-requirements.md` and record evidence for each. Any unmet criterion blocks completion. ✅ (completed: 2026-10-19 13:51)
  - Verify: every AC has a passing test or a documented manual check.
- [x] **P8-T10 — Final commit.** Commit via the `git-commit` skill, per the execution mode. Do not push unless the user explicitly asks for push mode. ✅ (completed: 2026-10-19 13:52)
  - Verify: clean working tree; commit message follows Conventional Commits.

## Definition of done

- [x] All eight components implemented and exported with props types.
- [x] RHF is a peer and a dev dependency; DatePicker compat is a peer and a dev dependency.
- [x] Zod is not a package dependency.
- [x] Every component follows the anatomy with the documented no-styles exception.
- [x] Spec tests (ST-01..ST-92) pass; impl tests pass; package exports are exact.
- [x] Accessibility associations pass for label, hint, error, required, disabled, and no duplicate labels.
- [x] Numeric parse keeps partial input; Dropdown/Combobox display text survives reset/setValue; DatePicker label `for` matches.
- [x] Storybook builds with all story variants.
- [x] `pnpm verify`, `pnpm storybook:build`, and `pnpm pack:check` pass.
- [x] README and `AGENTS.md` updated.
- [x] No issue #2 files or downstream applications changed.
- [x] The GitHub hand-off is tracked as `T-01` in the feature roadmap; closure is a separate user decision.

## Deferred follow-ups

| Item                          | Reason                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------- |
| Multiselect Dropdown/Combobox | Different value type (`string[]`); not in issue #1                            |
| Freeform Combobox             | Changes the stored value from option value to text; needs a separate contract |
| Form subpath export           | Would let consumers avoid the RHF/DatePicker peers; packaging change          |
| SSR smoke tests               | No browser-only behavior introduced; RHF and DatePicker server-render         |
| DatePicker time picker        | Separate compat package and scope                                             |
| RadioGroup focus-on-error     | The group root is not natively focusable; needs a focus-target decision       |
