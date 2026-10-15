import * as React from 'react';
import type { DescriptionListItemProps } from './DescriptionListItem.types';
import { renderDescriptionListItem } from './renderDescriptionListItem';
import { useDescriptionListItem } from './useDescriptionListItem';

/**
 * One term/definition pair of a description list.
 *
 * Renders the label as the term and the children as the definition, in a
 * wrapper that the surrounding `DescriptionList` places: the label above the
 * value in a stacked list, beside it in a columns list. The item is
 * presentation only — which pairs exist and what they show is a decision of
 * the application.
 *
 * @example
 * ```tsx
 * <DescriptionList layout="columns">
 *     <DescriptionListItem label="Plan">Pro</DescriptionListItem>
 * </DescriptionList>
 * ```
 */
export const DescriptionListItem = React.forwardRef<HTMLDivElement, DescriptionListItemProps>(
  (props, ref) => {
    const state = useDescriptionListItem(props, ref);

    return renderDescriptionListItem(state);
  }
);

DescriptionListItem.displayName = 'DescriptionListItem';
