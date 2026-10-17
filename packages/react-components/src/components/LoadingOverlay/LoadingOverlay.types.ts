import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Props of the loading overlay.
 *
 * The overlay keeps its children mounted, covers them with a themed scrim and
 * a spinner while `loading` is true, makes the covered content inert and
 * announces one label. It is controlled and presentation-only: the
 * application owns `loading`, the async work and every side effect.
 *
 * The component owns the busy, announcement, focus and accessible-name
 * contract. `aria-busy`, `aria-live`, `aria-atomic`, `role`, `inert`,
 * `tabIndex`, `aria-label` and `aria-labelledby` are therefore omitted from
 * this type: an override would break the busy subtree, the single live region
 * or the named focus target. `dangerouslySetInnerHTML` is omitted because the
 * component never parses HTML. `children` is required and stays mounted.
 * Every other native `div` prop passes through, and `className` and `style`
 * merge onto the root.
 *
 * @example
 * ```tsx
 * <LoadingOverlay loading={isFetching} label="Loading records…">
 *     <DataGrid records={records} />
 * </LoadingOverlay>
 * ```
 *
 * @example
 * ```tsx
 * <LoadingOverlay loading={isSaving} delay={0} label="Saving…">
 *     <ActorForm />
 * </LoadingOverlay>
 * ```
 */
export type LoadingOverlayProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  | 'children'
  | 'aria-busy'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-live'
  | 'aria-atomic'
  | 'dangerouslySetInnerHTML'
  | 'inert'
  | 'role'
  | 'tabIndex'
> & {
  /** Whether the covered operation is pending. The application owns this state. */
  loading: boolean;

  /**
   * Visible and announced message. A missing, empty or whitespace-only label
   * falls back to the English default `Loading…`; localized applications pass
   * their own translated string.
   */
  label?: string;

  /**
   * Milliseconds to wait before showing the scrim, the spinner and the status
   * text, so a fast response never flashes the overlay. Defaults to `300`; a
   * negative, `NaN` or `Infinity` value is treated as `0`. A change applies to
   * the next activation and never restarts a visible overlay.
   */
  delay?: number;

  /** Content that stays mounted and becomes inert while the overlay is visible. */
  children: ReactNode;
};
