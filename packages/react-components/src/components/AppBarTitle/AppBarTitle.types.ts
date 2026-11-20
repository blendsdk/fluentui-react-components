import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Props of the application title in its text or heading form.
 *
 * The default root is a `<span>`; `headingLevel` switches it to `<h1>`–`<h6>`.
 * The link form is a separate union member, so a heading and a link cannot be
 * combined. All native span props (`className`, `id`, `aria-*`, event
 * handlers, ...) pass through.
 *
 * This type is internal: the package root exports only `AppBarTitleProps`.
 */
export type AppBarTitleTextProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'children' | 'dangerouslySetInnerHTML'
> & {
  /** The visible product or application name. */
  children: ReactNode;

  /** Renders `h1`–`h6` instead of a span when set. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;

  href?: never;
  target?: never;
  rel?: never;
};

/**
 * Props of the application title in its link form.
 *
 * The root is an `<a>`; all native anchor props pass through. `headingLevel`
 * is not available here, so the title cannot be both a heading and a link.
 *
 * This type is internal: the package root exports only `AppBarTitleProps`.
 */
export type AppBarTitleLinkProps = Omit<
  ComponentPropsWithoutRef<'a'>,
  'children' | 'dangerouslySetInnerHTML' | 'href'
> & {
  /** The visible product or application name. */
  children: ReactNode;

  /** Renders an anchor instead of a span. */
  href: string;

  headingLevel?: never;
};

/**
 * Props of the application title.
 *
 * The title is presentation-only: the application owns the name and where a
 * link points. The union makes the heading and link forms mutually exclusive;
 * the default is a non-heading span so the page keeps control of its heading
 * hierarchy. The link form expects plain, non-interactive children.
 *
 * @example
 * ```tsx
 * <AppBarTitle>Contoso</AppBarTitle>
 * <AppBarTitle headingLevel={1}>Contoso</AppBarTitle>
 * <AppBarTitle href="/">Contoso</AppBarTitle>
 * ```
 */
export type AppBarTitleProps = AppBarTitleTextProps | AppBarTitleLinkProps;
