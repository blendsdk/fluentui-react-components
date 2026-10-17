/**
 * Resolves the label shown by the loading primitives.
 *
 * A missing or blank label would leave the status region silent, so the
 * English fallback is used instead. Localized applications pass their own
 * label; the package ships no string resource files.
 *
 * @param label - caller-supplied label, if any
 * @returns the caller's label, or `Loading…` when it is missing or blank
 */
export function resolveLoadingLabel(label?: string): string {
  return normalizeLabel(label) ?? 'Loading…';
}

/**
 * Normalizes a caller-supplied label for state and message resolution.
 *
 * Returns `undefined` for a missing, empty or whitespace-only label. A label
 * with content is returned unchanged, including its surrounding whitespace,
 * because the caller may have laid it out deliberately.
 *
 * @param label - caller-supplied label, if any
 * @returns the original label when it has content, otherwise `undefined`
 */
export function normalizeLabel(label?: string): string | undefined {
  if (label === undefined || label.trim().length === 0) {
    return undefined;
  }
  return label;
}
