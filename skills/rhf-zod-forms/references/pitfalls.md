# Form pitfalls

These are the failures that survive a quick review. Each one has a small fix.
Read this before declaring a form finished.

## Selection fields store `undefined` instead of `''`

A cleared Dropdown or Combobox must store the empty string, not `undefined`.
React Hook Form treats `undefined` as "no value supplied" and can fall back to
the field default, so the cleared selection reappears on the next render.

```ts
// Correct default for a selection field
const defaultValues = { color: '' };

// Avoid this when the field is meant to be clearable
const defaultValues = { color: undefined };
```

Keep the schema aligned: use `z.string()` or `z.enum([...])` with a valid
empty-value option, or `z.string().optional()` when "not chosen" is genuinely
absent. Do not mix both conventions in one form.

## Combobox typing is not a form change

`FormComboboxField` is selection-only. Typing filters the list and keeps local
input text; it commits only when an option is selected. If you validate the
field on every keystroke, the value is still the previous selection. That is
intentional: a half-typed search term is not a selected value.

- Do not add `onChange` validation that assumes typing commits.
- Do not use Combobox for freeform input. Use `FormTextField` instead.
- For a keyboard-accessible clear, include an option with `value=""`.
- The Fluent clear affordance is pointer-only; do not make it the only way to
  clear the field.

## `isValid` is stale until validation runs

`form.formState.isValid` reflects the last validation pass. With
`mode: 'onSubmit'`, it can be `false` before the first submit even when the
values are valid, or stale after a change.

- Use `isValid` for a disabled submit button only when the form mode validates
  eagerly (`mode: 'onChange'` or `'onTouched'`), or call `await form.trigger()`.
- Do not use `isValid` as the only guard in the submit handler. `handleSubmit`
  already runs the resolver.
- For a multi-step form, call `await form.trigger(stepFields)` before moving to
  the next step.

## Reset loops and lost edits

`reset` is a write. Calling it on every render discards user input.

- Reset when a dialog opens or when a loaded entity arrives, not on every
  render.
- Keep `defaultValues` stable. An object literal created in the component body
  changes identity on every render.
- Include the form in the effect dependency list; `useForm` returns a stable
  object, so this is safe.
- Do not reset a form because a parent re-rendered. Pass a stable key or an
  explicit `open` transition instead.

## Double parsing and coercion

`FormTextField`'s `parse` already converts the raw string. If the Zod schema
also uses `z.coerce.number()`, the value is converted twice and invalid input
can become a different value than the user saw.

- Use `parse` for field-level conversion, then validate the resulting type in
  Zod.
- Use `z.coerce` only when the form value really arrives as a string and the
  field has no `parse`.
- Keep partial input visible. Returning `undefined` for `''` is fine; returning
  `NaN` for `'-'` is not.
- Test `''`, `'0'`, `'-1'`, `'1.'` and a non-numeric string.

## Server errors that never clear

A field error set with `setError` stays until the next validation pass or an
explicit clear. A corrected field can still show the old server message.

- Clear the field's server error when the user edits it, or on the next
  successful validation.
- Keep client errors that still apply; do not `clearErrors()` the whole form
  just to remove one server message.
- Render root errors in a `MessageBar`, not on the first field.
- Map unknown server errors to a safe generic message. Do not render raw
  server text.

## DTO drift

The form and the API often start with the same shape and then diverge. The
result is a payload with UI-only fields, a missing field, or a date in the wrong
format.

- Write one explicit `toDto` and one `fromDto`.
- Do not spread form values into the request body.
- Test form-only fields are absent from the payload.
- Test the empty representation (`''`, `null`, `undefined`) at the boundary.
- Keep the API type in the application, not in the shared skill or the
  component package.

## Date and timezone surprises

`FormDatePickerField` stores a `Date`. A date picker selects a calendar day, not
an instant, and `toISOString()` converts to UTC.

- Decide whether the value represents a calendar day or an instant.
- For a calendar day, format it without a timezone shift, for example
  `YYYY-MM-DD` built from local parts.
- For an instant, keep the `Date` and convert with `toISOString()`.
- Make `formatDate` and `parseDateFromString` agree; a round trip must preserve
  the day the user picked.
- Test around midnight and across a daylight-saving transition.

## Required is not validation

`required` renders the marker and exposes the semantic state. It does not make
the field pass validation.

- Put the rule in the schema: `.min(1)`, `.nonempty()`, `z.enum([...])`, or a
  custom refinement.
- Keep the visible required marker and the schema rule aligned; a field that
  looks required but validates as optional is a defect.
- For optional fields, use `.optional()` and a matching empty value.

## Disabled fields and stale values

A disabled field still has a value in the form model. When a field becomes
disabled because of another choice, decide whether its old value should be
cleared, kept, or submitted.

- Clear hidden or inapplicable values explicitly.
- Do not rely on the visual disabled state to remove a value.
- If the server must not receive the value, remove it in the DTO mapper.
- Test the transition in both directions, not only the disabled state.

## Validation mode surprises

`mode` controls when validation first runs; `reValidateMode` controls the
revalidation after that. A form that feels wrong usually has a mismatch here.

- `onSubmit` + `onChange` is a calm first submit with fast correction
  afterwards.
- `onTouched` is useful for long forms where early errors are noisy.
- `all` validates on change and blur; use it only when the product wants
  immediate feedback.
- Changing `mode` can change the `isValid` timing. Update the submit-button
  logic with it.
