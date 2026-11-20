import type { ComponentPropsWithoutRef } from 'react';

/**
 * Props of the application bar spacer.
 *
 * The spacer is an empty layout element that pushes trailing commands to the
 * end of the bar. It renders a `<div>`; all native div props (`className`,
 * `id`, `aria-*`, event handlers, ...) pass through. It has no children and
 * no accessible content.
 *
 * @example
 * ```tsx
 * <AppBarTitle>Contoso</AppBarTitle>
 * <AppBarSpacer />
 * <span>Trailing</span>
 * ```
 */
export type AppBarSpacerProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'dangerouslySetInnerHTML'
>;
