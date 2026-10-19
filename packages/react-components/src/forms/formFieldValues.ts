/**
 * Formats a form value for display in a text-like control.
 *
 * `null` and `undefined` become the empty string; every other value uses its
 * string form. Text fields can therefore display a parsed number without
 * storing a second value in the form.
 *
 * @param value - form value to display
 * @returns the text shown by the control
 */
export function formatInputValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

/**
 * Resolves the visible text for a single-select field.
 *
 * The form stores the option value, while the primitive displays option text.
 * A caller-supplied resolver maps the value to its text; without one, the
 * value itself is the display text.
 *
 * @param value - stored option value
 * @param getOptionText - optional value-to-text resolver
 * @returns the text shown by the control
 */
export function resolveOptionText(
  value: unknown,
  getOptionText?: (value: string) => string | undefined
): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const key = String(value);
  return getOptionText?.(key) ?? key;
}

/**
 * Converts a single-select form value to the primitive's selected options.
 *
 * The empty string is treated as no selection, matching the empty display
 * text. `null` and `undefined` also mean no selection.
 *
 * @param value - stored option value
 * @returns a one-element option list, or an empty list when there is no value
 */
export function toSelectedOptions(value: unknown): string[] {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  return [String(value)];
}
