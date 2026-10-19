# Current state — repository, Fluent UI, and React Hook Form

> **Feature**: `form-fields`
> **CodeOps Artifact Schema**: 1

## 1. Repository baseline

### 1.1 Package and build

| Fact                                                                                                                                                              | Evidence                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| The publishable package is `@blendsdk/fluentui-react-components@0.2.1`.                                                                                           | `packages/react-components/package.json`                              |
| It publishes only `dist`.                                                                                                                                         | `files: ["dist"]`                                                     |
| Peers are React 19, React DOM 19, `@fluentui/react-components ^9.0.0`, `@fluentui/react-icons ^2.0.0`, and `@types/react ^19.0.0`.                                | `peerDependencies`                                                    |
| Dev Fluent UI is `9.74.9`; installed primitive versions are Input 9.8.7, Textarea 9.7.7, Combobox 9.17.7, Checkbox 9.6.5, Switch 9.7.6, Radio 9.6.6, Field 9.5.5. | `node_modules/.pnpm` and the package's `node_modules/@fluentui` links |
| The build is a single ESM bundle; externals are `/^react($                                                                                                        | \/)/`, `/^react-dom($                                                 | \/)/`, and `/^@fluentui\//`. | `packages/react-components/vite.config.ts:22` |
| Declarations come from `tsc -p tsconfig.build.json`; stories and scenario files are excluded.                                                                     | `packages/react-components/tsconfig.build.json`                       |
| There is no `react-hook-form`, `@hookform/resolvers`, or datepicker package in the lockfile.                                                                      | `pnpm-lock.yaml`                                                      |
| `package.json` has no `skills` or `prepack`; those belong to issue #2.                                                                                            | `packages/react-components/package.json`                              |

**Critical gap:** `react-hook-form` is not externalized. Adding it as a peer without changing `vite.config.ts` would bundle a second RHF instance into `dist`. The plan adds the external (AR-16).

### 1.2 Component anatomy

Every component follows the house pattern:

```text
src/components/<Name>/
├── <Name>.tsx                 forwardRef shell: state hook → render
├── <Name>.types.ts            public props contract
├── use<Name>.ts               pure state hook
├── render<Name>.tsx           pure render
├── use<Name>Styles.styles.ts  Griffel + tokens (optional; recorded exceptions exist)
├── index.ts                   component + props type
└── stories/<Name>.stories.tsx
```

Recorded exceptions currently include `SystemErrorProvider` (no styles file; state and render in one file), `ConfirmProvider` (no render or styles layers), `AppLauncherTrigger` (no styles layer), and `Loading` (`useLoadingBase` internal hook name). `AGENTS.md` requires new deviations to be recorded. The field wrappers add another exception: **no styles layer** (AR-08).

### 1.3 Tests

| File                                | Purpose                                                         |
| ----------------------------------- | --------------------------------------------------------------- |
| `test/<kebab>.spec.test.tsx`        | Contract; written first; immutable oracle                       |
| `test/<kebab>.impl.test.tsx`        | Internals: wiring, class composition, structure                 |
| `test/package-exports.spec.test.ts` | Exact runtime export surface; type-only exports compile-checked |
| `test/setup.ts`                     | jest-dom matchers and `cleanup()` after each test               |

- Vitest runs in jsdom; `test/**/*.{test,spec}.{ts,tsx}` is the include pattern.
- Tests import `describe`, `expect`, `it` from Vitest explicitly.
- Every rendered component is wrapped in `FluentProvider` with `webLightTheme`.
- `fireEvent` and `act` are used; `@testing-library/user-event` is not installed.
- Portal and focus behavior is covered in stories where jsdom cannot observe it.

### 1.4 Stories

- Storybook is configured with `stories: ['../src/**/stories/*.stories.@(ts|tsx)']`.
- The global preview decorator wraps every story in `FluentProvider`.
- Scenario helpers can live beside the entry story as `*.story.tsx`; they are excluded from the build and are not auto-discovered.
- Each story's `parameters.docs.description.component` may include a manual review checklist, as `Loading.stories.tsx` does.

## 2. Fluent UI v9 primitive contracts

### 2.1 `Field`

`Field` is presentation-only. It generates a control id and provides, through `FieldContext`:

- `id` (generated control id)
- `aria-labelledby` when the label cannot use `htmlFor`
- `aria-describedby` for hint and validation message
- `aria-invalid` when `validationState === 'error'`
- native `required` or `aria-required`, depending on the control's support
- `size`

`useFieldControlProps_unstable` merges these into the child's props. The implementation (`@fluentui/react-field/lib/contexts/useFieldControlProps.js`) shows the exact rules:

```js
if (required) {
  if (options.supportsRequired) props.required ??= true;
  else props['aria-required'] ??= true;
}
```

It also appends the validation/hint ids to `aria-describedby` and sets `aria-invalid` on error.

### 2.2 Which primitives support what

| Primitive             | Controlled value                                     | Change callback                                                    | `readOnly`                                         | Field integration                                                                                               |
| --------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Input`               | `value: string`                                      | `onChange(ev, { value })`                                          | Native `readOnly`                                  | `supportsLabelFor`, `supportsRequired`                                                                          |
| `Textarea`            | `value: string`                                      | `onChange(ev, { value })`                                          | Native `readOnly`                                  | `supportsLabelFor`, `supportsRequired`                                                                          |
| `Checkbox`            | `checked: boolean \| 'mixed'`                        | `onChange(ev, { checked })`                                        | **No**                                             | `supportsLabelFor`, `supportsRequired`; renders its own label                                                   |
| `Switch`              | `checked: boolean`                                   | `onChange(ev, { checked })`                                        | **No**                                             | `supportsLabelFor`, `supportsRequired`; renders its own label                                                   |
| `RadioGroup`          | `value: string`                                      | `onChange(ev, { value })`                                          | **No**                                             | No options; Field sets `aria-labelledby`, `aria-describedby`, `aria-invalid`, `aria-required` on the group root |
| `Dropdown`            | `selectedOptions: string[]`, display `value: string` | `onOptionSelect(ev, { optionValue, optionText, selectedOptions })` | **No** (button)                                    | `supportsLabelFor`; Field sets `aria-required`                                                                  |
| `Combobox`            | `selectedOptions: string[]`, display `value: string` | `onOptionSelect`, `onInput`                                        | Not documented                                     | `supportsLabelFor`, `supportsRequired`                                                                          |
| `DatePicker` (compat) | `value: Date \| null`                                | `onSelectDate(date)`                                               | Implicit `readOnly` when `allowTextInput` is false | Root is `Input`; reads `FieldContext.required`; label id needs the render-function workaround                   |

### 2.3 Label ownership evidence

Fluent's `field.md` guidance says:

> For Checkbox, Switch, and Radio inside RadioGroup, the controls render their own labels, so use Field there only for hint or validation message text rather than a duplicate label.

An isolated server render confirmed:

- **Checkbox:** `Field` without a `label` plus `<Checkbox label="Enable feature" />` renders the hidden input with the Field-generated id, `aria-describedby`, `aria-invalid`, and `required`. The primitive label's `for` matches.
- **Switch:** same structure; the input has `role="switch"`.
- **RadioGroup:** `<Field label="Plan"><RadioGroup>...` renders the group with `aria-labelledby` and `aria-required`; the child radios keep their own labels.

### 2.4 Dropdown/Combobox control model

`DropdownProps` and `ComboboxProps` share `ComboboxBaseProps`:

- `selectedOptions?: string[]` is the controlled selection.
- `value?: string` is the **display text**, not the selected value.
- If `selectedOptions` is set, `value` must also be controlled.
- `onOptionSelect` returns `{ optionValue, optionText, selectedOptions }`.
- `Dropdown` is a button with `role="combobox"`; `Combobox` has an editable input.

Therefore `field.value` (the option value) cannot be passed to `value` directly when an option's value differs from its display text. The wrapper needs `getOptionText` (AR-04).

An isolated render confirmed:

- `Field` label `for` matches the Dropdown button id; the button receives `aria-describedby`, `aria-invalid`, and `aria-required`.
- `Field` label `for` matches the Combobox input id; the input receives `aria-describedby`, `aria-invalid`, and native `required`.
- A controlled `value="Red"` with `selectedOptions={['red']}` renders the expected display text.

### 2.5 DatePicker compat package

`@fluentui/react-datepicker-compat@0.6.39`:

- Is a separate 0.x package, not exported by `@fluentui/react-components`.
- Peer dependencies: React `>=16.14 <20` and optional `@types/react`.
- Depends on `@fluentui/react-field`, `@fluentui/react-input`, and other Fluent packages as regular dependencies.
- `DatePickerProps` includes `value: Date | null`, `onSelectDate`, `required`, `disabled`, `allowTextInput`, `formatDate`, `parseDateFromString`, `minDate`, `maxDate`, `strings`, and `onValidationResult`.
- The root slot is `Input`; the input is `readOnly` when `allowTextInput` is false.
- `useDatePicker_unstable` reads `fieldContext.required` for its own validation and relies on the root `Input` for the rest of the Field wiring.

**Isolated integration result** (temporary spike, removed after the analysis; React 19.3.1, React DOM 19.3.1, Fluent UI 9.74.9, DatePicker 0.6.39):

- Element-child form:

  ```tsx
  <Field label="Start date" hint="Pick a day" required validationMessage="An error">
    <DatePicker />
  </Field>
  ```

  The input receives `required`, `aria-invalid`, `aria-describedby` (`validationMessage hint`), and `aria-labelledby`. However, the label's `for` points at `field-...control`, while the input id is the DatePicker default (`datePicker-input_...`), so the `for` target is missing.

- Render-function form:

  ```tsx
  <Field label="Start date" hint="Pick a day" required validationMessage="An error">
    {({ id }) => <DatePicker id={id} />}
  </Field>
  ```

  The input id becomes `field-...control`; the label's `for` matches; `aria-describedby` is exactly `validationMessage hint` (no duplication); `required` and `aria-invalid` are present.

**Decision:** use the render-function form for `FormDatePickerField` and pass only `id` (AR-03). Spreading the full `fieldProps` duplicates `aria-describedby`, so it is forbidden.

**Risk:** the DatePicker package depends on `@fluentui/react-field` as a regular dependency. If a consumer's package manager installs a second copy, the `FieldContext` identity can differ and the associations can break. The pnpm spike deduplicated `9.5.5` and passed. The plan keeps a regression test and documents the risk (AR-22).

## 3. React Hook Form contracts

### 3.1 `useController`

From `react-hook-form@7.55.0/dist/types/controller.d.ts`:

```ts
export type UseControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues
> = {
  name: TName;
  rules?: ...;
  shouldUnregister?: boolean;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  control?: Control<TFieldValues, any, TTransformedValues>;
  disabled?: boolean;
};

export type ControllerRenderProps<TFieldValues, TName> = {
  onChange: (...event: any[]) => void;
  onBlur: Noop;
  value: FieldPathValue<TFieldValues, TName>;
  disabled?: boolean;
  name: TName;
  ref: RefCallBack;
};
```

- `field.onChange` is variadic and accepts the parsed value, `boolean`, `string`, `Date`, or `undefined`.
- `field.value` is typed by the field path.
- `field.disabled` reflects the form-level disabled state.
- `field.ref` is a callback ref for focus management.

### 3.2 `FieldPathValue`

From `react-hook-form@7.55.0/dist/types/path/eager.d.ts`:

```ts
export type FieldPathValue<TFieldValues, TFieldPath> = PathValue<TFieldValues, TFieldPath>;
```

For `{ height?: number }`, `FieldPathValue<Values, 'height'>` is `number | undefined`. This is why `parse` can return `undefined` for an empty input, and why the form type must include `undefined` when clearing is allowed.

`FieldPathByValue<TFieldValues, TValue>` collects only the paths whose value extends `TValue`. The component props use it to reject a path of the wrong type at compile time: `FormTextField` accepts `string | number | null | undefined` paths, `FormCheckboxField` accepts `boolean | 'mixed' | undefined`, `FormSwitchField` accepts `boolean | undefined`, `FormRadioGroupField`/`FormDropdownField`/`FormComboboxField` accept `string | undefined`, and `FormDatePickerField` accepts `Date | null | undefined`. This preserves `name` checking and adds value-type checking without a cast.

### 3.3 Versions

- Latest published version at the time of planning: `7.90.0`.
- The required types (`FieldPathValue`, `FieldPathByValue`, `UseControllerProps`, three-generic `Control`) exist in `7.55.0`.
- Peer range: `^7.55.0`; dev dependency: `^7.90.0` (AR-15).

### 3.4 Generic `forwardRef`

The repository pattern uses `React.forwardRef`, which does not preserve generics. The plan uses the minimal typed bridge:

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

This compiles under TypeScript 7.0.2 with `strict`, `verbatimModuleSyntax`, and `noUnusedLocals`. It uses no `any` or `unknown` cast. The cast is the documented bridge for `forwardRef` (NFR-01).

## 4. Gaps and risks

| Risk                                                                   | Impact                                           | Mitigation                                                                                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| DatePicker compat is 0.x                                               | API can change in a patch/minor                  | Peer `^0.6.0`, dev `^0.6.39`; pin the dev version; document the 0.x status; compatibility spike each upgrade        |
| DatePicker duplicates `@fluentui/react-field` in some package managers | Field label/hint/error association can break     | Regression test for label `for` and `aria-describedby`; document the risk; keep the render-function `id` workaround |
| RHF and DatePicker become required peers for every consumer            | Consumers who never use forms still install them | Accepted for v1; document; a subpath export is a separate change                                                    |
| RHF bundled instead of externalized                                    | Duplicate form instance and larger bundle        | Add `react-hook-form` to Vite externals; inspect `dist/index.js` after build                                        |
| Numeric parse on change                                                | Decimal/negative input can disappear             | Local raw text state; test `1.` and `-`                                                                             |
| Dropdown/Combobox display text                                         | Reset/setValue can show the raw value            | `getOptionText`; test reset with value ≠ text                                                                       |
| Portaled popups in jsdom                                               | Selection tests can be flaky                     | Use `inlinePopup` for Dropdown/Combobox tests; use `allowTextInput` for DatePicker; cover the calendar in a story   |
| No `user-event`                                                        | Tests must use `fireEvent`                       | Follow existing tests; do not add a dependency                                                                      |
| RadioGroup group is not focusable                                      | RHF focus-on-error cannot focus the group        | Document; keep the group's accessible name and error association; story covers keyboard flow                        |
| `Field` label `for` on a RadioGroup                                    | The `for` points at a div (Fluent behavior)      | Use `aria-labelledby` for the accessible name; do not assert the `for` target in tests                              |
| Required peer types in declarations                                    | Consumers need the peers to type-check           | Document the install command; peers are in `package.json`                                                           |

## 5. Files that will change

| File                                                                     | Change                                                                  |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `packages/react-components/package.json`                                 | Add RHF and DatePicker peer/dev dependencies                            |
| `pnpm-lock.yaml`                                                         | Resolve the new dependencies                                            |
| `packages/react-components/vite.config.ts`                               | Externalize `react-hook-form`; update the comment                       |
| `packages/react-components/src/forms/*`                                  | New shared field types, controller hook, value helpers, text-state hook |
| `packages/react-components/src/components/Form*/**`                      | Eight component folders                                                 |
| `packages/react-components/src/index.ts`                                 | Export the eight components and props types                             |
| `packages/react-components/test/form-*.spec.test.tsx`                    | New spec tests                                                          |
| `packages/react-components/test/form-*.impl.test.tsx`                    | New impl tests                                                          |
| `packages/react-components/test/form-test-utils.tsx`                     | Shared test harness                                                     |
| `packages/react-components/test/package-exports.spec.test.ts`            | Runtime list and type assertions                                        |
| `packages/react-components/src/components/Form*/stories/*.stories.tsx`   | Stories                                                                 |
| `packages/react-components/src/forms/stories/formStoryHarness.story.tsx` | Shared story harness (excluded from build)                              |
| `packages/react-components/README.md`                                    | Peers, field API, examples, DatePicker note                             |
| `AGENTS.md`                                                              | Field-wrapper exception and `src/forms/` helpers                        |

## 6. Explicitly unchanged

- `scripts/check-skill.mjs`, `scripts/check-pack.mjs`, package `files`, and `prepack` (issue #2).
- Any file under `.opencode/` other than the plan documents outside the repository.
- `blendsdk`, `blendsdk/react`, or downstream applications.
- Existing components and their tests.
