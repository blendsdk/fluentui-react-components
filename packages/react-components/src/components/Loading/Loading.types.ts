import type { SpinnerProps } from '@fluentui/react-components';
import type { ComponentPropsWithoutRef } from 'react';

/**
 * Props of the loading filler.
 *
 * `Loading` renders a centered, indeterminate spinner with a visible label
 * and a polite status announcement. It is presentation-only: it holds no data
 * and performs no I/O, so the application decides when to render it.
 *
 * The component owns the live-region role and the announcement attributes.
 * `role`, `aria-live` and `aria-atomic` are omitted from this type because a
 * caller override would break the single-announcement contract;
 * `dangerouslySetInnerHTML` is omitted because the component owns its content
 * and never parses HTML. `children` is omitted because the caller supplies a
 * label, not content. Every other native `div` prop passes through, and
 * `className` and `style` merge onto the root.
 *
 * @example
 * ```tsx
 * <Loading label="Loading records…" />
 * ```
 *
 * @example
 * ```tsx
 * <Loading label="Saving…" delay={300} minHeight={240} />
 * ```
 */
export type LoadingProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'role' | 'aria-live' | 'aria-atomic' | 'dangerouslySetInnerHTML'
> & {
  /**
   * Visible and announced message. A missing, empty or whitespace-only label
   * falls back to the English default `Loading…`; localized applications pass
   * their own translated string.
   */
  label?: string;

  /** Fluent `Spinner` size. Defaults to `'large'`. */
  size?: SpinnerProps['size'];

  /** Fluent `Spinner` appearance. Defaults to `'primary'`. */
  appearance?: SpinnerProps['appearance'];

  /** Placement of the visible label relative to the spinner ring. Defaults to `'below'`. */
  labelPosition?: SpinnerProps['labelPosition'];

  /**
   * Milliseconds to wait before showing both the status text and the visual
   * indicator, so a fast response never flashes a loader. Defaults to `0`.
   */
  delay?: number;

  /**
   * Minimum block size for an otherwise empty parent, applied as an inline
   * style. When omitted, a caller-supplied `style.minHeight` passes through
   * unchanged; when defined, this prop wins over the style value.
   */
  minHeight?: number | string;
};
