import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { DescriptionListLayout } from '../DescriptionListItem/DescriptionListItemLayoutContext';

/**
 * Props of a description list.
 *
 * The list groups term/definition pairs and decides how they read: with the
 * labels above the values or in a column of their own beside them. It renders
 * a `dl` element and tells every `DescriptionListItem` inside it which layout
 * to use, so items never carry layout props of their own.
 *
 * All native list props (`className`, `aria-*`, event handlers, ...) pass
 * through to the `dl` element.
 *
 * @example
 * ```tsx
 * <DescriptionList layout="columns">
 *     <DescriptionListItem label="Plan">Pro</DescriptionListItem>
 *     <DescriptionListItem label="Seats">12</DescriptionListItem>
 * </DescriptionList>
 * ```
 */
export type DescriptionListProps = Omit<ComponentPropsWithoutRef<'dl'>, 'children'> & {
  /** The pairs to render; pass `DescriptionListItem` elements. */
  children: ReactNode;

  /**
   * Layout of the pairs. `'stacked'` (the default) places each label above
   * its value, which suits narrow surfaces and long values; `'columns'`
   * places the labels in a column of their own, aligned across all pairs,
   * with the values beside them.
   */
  layout?: DescriptionListLayout;
};
