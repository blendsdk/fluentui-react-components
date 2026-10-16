/**
 * Serialization of unknown error values into the text the details area shows.
 *
 * The serializer is pure and never throws. Every step executes host-provided
 * code — property reads, `toJSON`, getters, `toString` — so each step is
 * wrapped and the chain falls back until a defined string is produced:
 * strings pass through, error-like values become pretty-printed JSON, other
 * values are stringified by `JSON.stringify` with a replacer that maps
 * `bigint` and function values and marks circular references, and anything
 * that still fails falls back to `String(value)`. Only when even that throws
 * does the serializer return `undefined`, which callers map to the
 * no-details text.
 */

/** The shape the serializer treats as carryable error information. */
type ErrorLike = { name: string; message: string; stack?: unknown };

/**
 * Decides whether a value carries error-like information: an `Error`
 * instance, or any object whose `name` and `message` read as strings.
 *
 * Property reads may run host-provided getters and can throw; callers invoke
 * this inside their containment chain.
 */
function isErrorLike(value: unknown): value is ErrorLike {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  if (value instanceof Error) {
    return true;
  }
  const record = value as Record<string, unknown>;
  return typeof record.name === 'string' && typeof record.message === 'string';
}

/**
 * Builds the structured object serialized for error-like values: the name and
 * message first, the stack when present, then every other own enumerable
 * property (`code`, ...) without duplicating the named keys.
 */
function buildStructuredError(error: ErrorLike): Record<string, unknown> {
  const { name, message, stack, ...own } = error;
  const structured: Record<string, unknown> = { name, message };
  if (stack !== undefined) {
    structured.stack = stack;
  }
  return Object.assign(structured, own);
}

/**
 * Serializes an unknown error value for display.
 *
 * @param error - the value to serialize; any type is accepted
 * @returns the serialized text, or `undefined` when even `String(error)`
 * throws (the caller then shows its no-details text)
 */
export function serializeError(error: unknown): string | undefined {
  if (typeof error === 'string') {
    return error;
  }

  const seen = new WeakSet<object>();
  const replacer = (_key: string, value: unknown): unknown => {
    if (typeof value === 'bigint') {
      return String(value);
    }
    if (typeof value === 'function') {
      return '[Function]';
    }
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };

  try {
    const subject = isErrorLike(error) ? buildStructuredError(error) : error;
    const serialized = JSON.stringify(subject, replacer, 2);
    if (serialized !== undefined) {
      return serialized;
    }
    // `undefined` means the JSON algorithm produced no text (for example a
    // bare symbol): fall through to the string form.
  } catch {
    // Host-provided accessors threw: fall through to the string form.
  }

  try {
    return String(error);
  } catch {
    // Even the string form is unavailable; the caller shows its fallback text.
    return undefined;
  }
}
