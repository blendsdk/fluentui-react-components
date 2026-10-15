import { useContext } from 'react';
import type { Ref } from 'react';
import type { DescriptionListItemProps } from './DescriptionListItem.types';
import { DescriptionListItemLayoutContext } from './DescriptionListItemLayoutContext';
import type { DescriptionListItemClasses } from './useDescriptionListItemStyles.styles';
import { useDescriptionListItemStyles } from './useDescriptionListItemStyles.styles';

/**
 * State that {@link renderDescriptionListItem} renders.
 */
export type DescriptionListItemState = {
  /** Resolved term content. */
  label: DescriptionListItemProps['label'];
  /** Resolved definition content. */
  children: DescriptionListItemProps['children'];
  /** Remaining native props forwarded to the item's wrapper element. */
  rootProps: Omit<DescriptionListItemProps, 'label' | 'children'>;
  /** Ref to the wrapper element, forwarded to the applications. */
  itemRef: Ref<HTMLDivElement>;
  /** Resolved item style classes for the layout of the surrounding list. */
  classes: DescriptionListItemClasses;
};

/**
 * Resolves the item props into render state.
 *
 * The layout is read from the surrounding list only; all defaulting happens
 * here so that rendering stays declarative. The item keeps no state of its
 * own — it is presentation for one pair, and anything that needs to change
 * while the application runs belongs to the application.
 *
 * @param props - props from this instance of the item
 * @param ref - ref to the item's wrapper element
 * @returns the state consumed by {@link renderDescriptionListItem}
 */
export function useDescriptionListItem(
  props: DescriptionListItemProps,
  ref: Ref<HTMLDivElement>
): DescriptionListItemState {
  const { children, label, ...rootProps } = props;

  const layout = useContext(DescriptionListItemLayoutContext);
  const classes = useDescriptionListItemStyles(layout);

  return {
    label,
    children,
    rootProps,
    itemRef: ref,
    classes,
  };
}
