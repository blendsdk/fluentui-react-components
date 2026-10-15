import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Props of a description list item.
 *
 * The item renders one term/definition pair of a `DescriptionList`: the
 * `label` as the term (`dt`) and `children` as the definition (`dd`). The
 * surrounding list decides the layout — the label above the value in a
 * stacked list, beside it in a columns list — and the item follows that
 * layout on its own.
 *
 * All native props of the item's wrapper element (`className`, `aria-*`,
 * event handlers, ...) pass through to the `div` that groups the term and the
 * definition.
 *
 * @example
 * ```tsx
 * <DescriptionListItem label="Plan">Pro</DescriptionListItem>
 * ```
 */
export type DescriptionListItemProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  /**
   * Term of the pair, rendered in a `dt` element and read by assistive
   * technology as the name of the value below or beside it. Accepts any
   * content the application wants to show as the term.
   */
  label: ReactNode;

  /**
   * Definition of the pair, rendered in a `dd` element. Accepts any content:
   * plain text, a `Badge`, a `Link`, or another component. The item does not
   * interpret the content, so empty or placeholder values are an application
   * decision.
   */
  children: ReactNode;
};
