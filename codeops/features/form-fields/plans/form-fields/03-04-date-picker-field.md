# Design — DatePicker field

> **Feature**: `form-fields`
> **Requirements**: FR-01, FR-09, FR-12
> **CodeOps Artifact Schema**: 1

## 1. Package decision

`@fluentui/react-components@9.74.9` does not export `DatePicker`. The supported component is in the separate `@fluentui/react-datepicker-compat` package (latest `0.6.39`).

| Dependency                               | Range     | Reason                                     |
| ---------------------------------------- | --------- | ------------------------------------------ |
| `@fluentui/react-datepicker-compat` peer | `^0.6.0`  | Consumers provide the 0.6.x implementation |
| `@fluentui/react-datepicker-compat` dev  | `^0.6.39` | Tests and Storybook                        |

The package is 0.x; a minor release can change behavior. The peer range stays inside 0.6.x (AR-02). The package README documents the extra peer and the 0.x status.

## 2. Field integration problem and solution

`DatePicker`'s root slot is `Input`. The DatePicker sets its own default input id (`datePicker-input_*`) before the Input consumes `FieldContext`. As a result:

- The label's `for` points at Field's generated id.
- The input id is the DatePicker default.
- The input receives `aria-labelledby` instead, so screen readers still announce the label, but clicking the label does not focus the input.

The verified fix is to use `Field`'s render-function child and pass only the generated `id`:

```tsx
<Field label={label} hint={hint} required={required} validationMessage={errorMessage}>
  {({ id }) => <DatePicker {...datePickerProps} id={id} ref={controlRef} />}
</Field>
```

Why only `id`:

- Spreading the whole `fieldProps` also passes `aria-describedby`; the Input then appends its own Field-context ids again, producing duplicates.
- Passing only `id` lets the Input consume `FieldContext` once for hint/error/required/invalid.

Isolated result: the input id matches the label `for`; `aria-describedby` is `validationMessage hint` exactly once; `required` and `aria-invalid` are present.

**Go/no-go rule:** Phase 7 starts by repeating this whole-Field/DatePicker check in the repository dependency tree. If the association fails, stop and return to the user before adding a workaround (AR-30).

## 3. Files

```text
src/components/FormDatePickerField/
├── FormDatePickerField.tsx
├── FormDatePickerField.types.ts
├── useFormDatePickerField.ts
├── renderFormDatePickerField.tsx
├── index.ts
└── stories/FormDatePickerField.stories.tsx
```

No styles file (AR-08).

## 4. Props

```ts
type DatePickerFieldValue = Date | null | undefined;

export type FormDatePickerFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, DatePickerFieldValue> = FieldPathByValue<
    TFieldValues,
    DatePickerFieldValue
  >,
> = Omit<DatePickerProps, 'value' | 'defaultValue' | 'onSelectDate' | 'name' | 'id' | 'required'> &
  FormFieldBaseProps<TFieldValues, TName>;
```

- `label` goes to `Field`.
- `hint` goes to `Field`.
- `required` goes to `Field`; DatePicker reads `FieldContext.required` for its own validation and the root Input receives native `required`.
- `id` is owned by the wrapper because the Field render-function id must win.
- Owned/omitted: `value`, `defaultValue`, `onSelectDate`, `name`, `id`, `required`.
- Pass-through: `disabled`, `allowTextInput`, `formatDate`, `parseDateFromString`, `minDate`, `maxDate`, `initialPickerDate`, `strings`, `onValidationResult`, `open`, `defaultOpen`, `onOpenChange`, `inlinePopup`, `positioning`, `today`, `showGoToToday`, `firstDayOfWeek`, `firstWeekOfYear`, `className`, `style`, `aria-*`.
- `onBlur` stays and is merged.
- `readOnly` is not exposed (AR-07).

## 5. State

`useFormDatePickerField(props, ref)`:

1. Destructures `control`, `name`, `label`, `hint`, `required`, `onBlur`, `disabled`, and the rest of the DatePicker props.
2. `useFormField(control, name, disabled)`.
3. `controlRef = useMergedRefs(ref, field.ref)`; ref type `HTMLInputElement`.
4. `value = field.value ?? null`.
5. `handleSelectDate = date => field.onChange(date ?? null)`.
6. `handleBlur = mergeCallbacks(onBlur, field.onBlur)`.
7. Returns `label`, `hint`, `required`, `errorMessage`, `datePickerProps` (`...rest`, `value`, `disabled: isDisabled`, `onSelectDate`, `onBlur`), `controlRef`.

Form value contract: `Date | null`. `undefined` is normalized to `null` so the controlled value is unambiguous (AR-27). Document this in the props JSDoc.

## 6. Render

```tsx
<Field
  label={state.label}
  hint={state.hint}
  required={state.required}
  validationMessage={state.errorMessage}
>
  {({ id }) => <DatePicker {...state.datePickerProps} id={id} ref={state.controlRef} />}
</Field>
```

## 7. Behavior

| Case                                       | Result                                                                                                |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| No value                                   | Input empty; calendar starts at `today`/`initialPickerDate` when opened.                              |
| Select a date in the calendar              | `field.onChange(date)`; input shows `formatDate(date)`.                                               |
| `allowTextInput` and a valid typed date    | On blur/Enter, DatePicker validates and calls `onSelectDate`; form stores the `Date`.                 |
| `allowTextInput` and an invalid typed date | DatePicker resets the input and reports `onValidationResult`; the form value is unchanged.            |
| `allowTextInput` false                     | Input is read-only; the calendar is the only input path.                                              |
| `reset({ startDate: new Date(...) })`      | Controlled `value` updates; input displays the formatted date.                                        |
| `setValue('startDate', null)`              | Input clears.                                                                                         |
| Server `setError`                          | `Field` alert updates; input gets `aria-invalid`.                                                     |
| `required`                                 | `Field` provides required; DatePicker validates `required-input` and the input has native `required`. |
| `disabled`                                 | DatePicker input and calendar trigger disabled.                                                       |
| Caller `onBlur`                            | Both the caller handler and `field.onBlur` run; DatePicker also runs its internal validation blur.    |
| `id` supplied by caller                    | Not accepted; the wrapper owns it.                                                                    |

## 8. Accessibility

- The label's `for` matches the input id (the workaround).
- Hint and error are associated through `aria-describedby`; an error sets `aria-invalid`.
- `required` is native on the input and also drives DatePicker's own required validation.
- The calendar is a modal dialog with `role="dialog"`, `aria-modal`, and focus trapping from Fluent.
- Keyboard behavior (Enter, Escape, ArrowDown, calendar navigation) comes from Fluent; do not reimplement.
- The calendar popup is portaled. jsdom spec tests use `allowTextInput` for the value path; the story covers the calendar selection and keyboard flow.

## 9. Testing notes

- Spec tests:
  - Renders the label and the formatted current date.
  - Typing a valid date with `allowTextInput` and blurring stores a `Date`.
  - Typing an invalid date does not change the form value.
  - Blur marks the field touched.
  - Error message appears and is associated.
  - `required` is exposed.
  - Disabled prevents interaction.
  - Hint is associated.
  - Label `for` matches the input id.
  - `aria-describedby` contains the hint/error ids exactly once.
  - Reset updates the displayed date.
  - Server `setError` updates the message.
- Impl tests:
  - `useController` wiring.
  - `field.ref` and forwarded ref merge.
  - `onBlur` merge.
  - Only `id` from the Field render function reaches DatePicker; the other `fieldProps` do not duplicate aria attributes.
  - Pass-through props reach DatePicker.
  - Owned props are not forwarded.
- Story:
  - Default, Selected, Required, WithHint, WithError, Disabled, `allowTextInput`, Localized (`strings`/`formatDate`), Inline popup (if supported) and a manual calendar/keyboard checklist.

## 10. Risks

| Risk                                                    | Mitigation                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| 0.x package changes                                     | Pin dev to `^0.6.39`; peer `^0.6.0`; review on upgrade                |
| Duplicate `@fluentui/react-field` context in a consumer | Regression test; document; pnpm dedupe verified                       |
| DatePicker id override regresses                        | Test label `for` vs input id; keep the render-function form           |
| Calendar popup in jsdom                                 | Use `allowTextInput` for value tests; cover the calendar in Storybook |
| Required peer burden                                    | Document in the README; accepted for v1                               |

## 11. Definition of done for this document

- [ ] DatePicker compat peer/dev dependencies are in `package.json`.
- [ ] The compatibility spike passes in the repository tree.
- [ ] The label `for` matches the input id.
- [ ] Hint/error/required associations are not duplicated.
- [ ] The component is exported with its props type and story.
- [ ] The README documents the extra peer and the 0.x status.
- [ ] Spec tests are green and unchanged after implementation.
