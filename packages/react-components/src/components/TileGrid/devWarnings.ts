declare const process: { env: { NODE_ENV?: string } };

const warnedKeys = new Set<string>();

/**
 * Emits a development-only warning once per key.
 *
 * The key must be stable and must not contain item IDs, labels, URLs, or
 * selected IDs. Production bundlers replace `process.env.NODE_ENV` and remove
 * the warning path; an unbundled browser must provide `process` when a warning
 * fires.
 */
export function devWarn(key: string, message: string): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (warnedKeys.has(key)) {
    return;
  }

  warnedKeys.add(key);
  console.warn(message);
}

/** Clears the warning cache so tests can assert each warning independently. */
export function resetDevWarningsForTests(): void {
  warnedKeys.clear();
}
