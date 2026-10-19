import { useLayoutEffect, useRef, useState } from 'react';
import type { TextFieldValue } from './FormField.types';
import { formatInputValue } from './formFieldValues';

/**
 * Raw text and commit handler for a parsed text field.
 */
export type TextValueState = {
  /** Raw text shown by the input; it keeps partial numeric input intact. */
  text: string;
  /**
   * Commits a raw keystroke: updates the visible text and sends the parsed
   * value to the form.
   *
   * @param raw - the input's raw string value
   */
  commit: (raw: string) => void;
};

/**
 * Keeps raw input text next to a parsed form value.
 *
 * A controlled input that displays the parsed value would erase partial input
 * such as `1.` or `-` on every keystroke. This hook keeps those keystrokes in
 * local presentation state while the form receives the parsed value. External
 * changes from `reset` or `setValue` update the text when the form value
 * changes.
 *
 * A reset to the exact same parsed value does not reformat different raw text
 * (for example `1.0` when the value is already `1`); the form value did not
 * change, so there is nothing to synchronize. A reset to a different value
 * reformats normally.
 *
 * @param value - current form value
 * @param parse - optional value converter; omitted for string fields
 * @param onChange - form change handler
 * @returns the raw text and the commit handler
 */
export function useTextValueState(
  value: TextFieldValue,
  parse: ((raw: string) => TextFieldValue) | undefined,
  onChange: (value: TextFieldValue) => void
): TextValueState {
  const [text, setText] = useState(() => formatInputValue(value));
  const lastEmitted = useRef(value);

  useLayoutEffect(() => {
    if (!Object.is(value, lastEmitted.current)) {
      setText(formatInputValue(value));
      lastEmitted.current = value;
    }
  }, [value]);

  const commit = (raw: string): void => {
    setText(raw);

    const next = parse ? parse(raw) : raw;
    lastEmitted.current = next;
    onChange(next);
  };

  return { text, commit };
}
