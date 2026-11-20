import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Props of the application bar.
 *
 * The bar renders a top-level `<header>` and owns only its children and class
 * names; the application decides what the bar contains. All native header
 * props (`id`, `aria-label`, `style`, event handlers, ...) pass through.
 *
 * @example
 * ```tsx
 * <AppBar aria-label="Application">
 *     <AppBarTitle>Contoso</AppBarTitle>
 * </AppBar>
 * ```
 */
export type AppBarProps = Omit<
  ComponentPropsWithoutRef<'header'>,
  'children' | 'dangerouslySetInnerHTML'
> & {
  /** Bar content: launcher, title, spacer and commands. */
  children: ReactNode;
};
