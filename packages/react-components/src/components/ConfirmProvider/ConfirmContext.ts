import { createContext } from 'react';
import type { ConfirmOptions, ConfirmOptionsWithActions } from './ConfirmProvider.types';

/**
 * The imperative API the provider exposes to its subtree.
 */
export interface ConfirmContextValue {
  /** Requests a decision from the default pair; resolves the boolean outcome. */
  confirm(options: ConfirmOptions): Promise<boolean>;
  /**
   * Requests a decision from a custom action set; resolves the chosen value,
   * or `false` when the request was superseded or the provider unmounted —
   * the safe "not confirmed" direction.
   */
  confirm<V extends string>(options: ConfirmOptionsWithActions<V>): Promise<V>;
}

/**
 * Context object carrying the provider's API; it holds `null` everywhere
 * outside a `ConfirmProvider`, which is what makes `useConfirm()` fail
 * loudly on misuse.
 */
export const ConfirmContext = createContext<ConfirmContextValue | null>(null);
