import type { Ref } from 'react';
import type { DescriptionListLayout } from '../DescriptionListItem/DescriptionListItemLayoutContext';
import type { DescriptionListProps } from './DescriptionList.types';
import type { DescriptionListClasses } from './useDescriptionListStyles.styles';
import { useDescriptionListStyles } from './useDescriptionListStyles.styles';

/**
 * State that {@link renderDescriptionList} renders.
 */
export type DescriptionListState = {
  /** Resolved layout, provided to every item in the list. */
  layout: DescriptionListLayout;
  /** The pairs to render, untouched. */
  children: DescriptionListProps['children'];
  /** Remaining native list props forwarded to the `dl` element. */
  rootProps: Omit<DescriptionListProps, 'children' | 'layout'>;
  /** Ref to the `dl` element, forwarded to the applications. */
  listRef: Ref<HTMLDListElement>;
  /** Resolved list style classes for the layout. */
  classes: DescriptionListClasses;
};

/**
 * Resolves the list props into render state.
 *
 * The layout defaults to `'stacked'` here, so both the styles and the context
 * the items read receive an explicit value and never have to repeat the
 * default. The list keeps no state of its own: which pairs exist is the
 * application's decision.
 *
 * @param props - props from this instance of the list
 * @param ref - ref to the `dl` element
 * @returns the state consumed by {@link renderDescriptionList}
 */
export function useDescriptionList(
  props: DescriptionListProps,
  ref: Ref<HTMLDListElement>
): DescriptionListState {
  const { children, layout = 'stacked', ...rootProps } = props;

  const classes = useDescriptionListStyles(layout);

  return {
    layout,
    children,
    rootProps,
    listRef: ref,
    classes,
  };
}
