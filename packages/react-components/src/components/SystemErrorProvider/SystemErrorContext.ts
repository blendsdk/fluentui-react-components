import { createContext } from 'react';
import type { CatchErrorOptions } from './SystemErrorProvider.types';

/**
 * The imperative API the provider exposes to its subtree.
 */
export type SystemErrorContextValue = {
  /** Reports an error: stores it and opens the dialog (last report wins). */
  catchError: (error: unknown, options?: CatchErrorOptions) => void;
  /** Closes and clears the dialog; a no-op when nothing is shown. */
  clearError: () => void;
};

/**
 * Context object carrying the provider's API; it holds `null` everywhere
 * outside a `SystemErrorProvider`, which is what makes `useSystemError()`
 * fail loudly on misuse.
 */
export const SystemErrorContext = createContext<SystemErrorContextValue | null>(null);
