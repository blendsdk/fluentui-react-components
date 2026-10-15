import * as React from 'react';
import type { DescriptionListProps } from './DescriptionList.types';
import { renderDescriptionList } from './renderDescriptionList';
import { useDescriptionList } from './useDescriptionList';

/**
 * Description list: term/definition pairs with an aligned layout.
 *
 * Groups `DescriptionListItem` children and tells them how to render — the
 * label above the value, or the labels in a column of their own beside the
 * values, aligned across all pairs. The list holds no data and no state:
 * which pairs exist and what they show is a decision of the application.
 *
 * @example
 * ```tsx
 * <DescriptionList layout="columns">
 *     <DescriptionListItem label="Plan">Pro</DescriptionListItem>
 *     <DescriptionListItem label="Seats">12</DescriptionListItem>
 * </DescriptionList>
 * ```
 */
export const DescriptionList = React.forwardRef<HTMLDListElement, DescriptionListProps>(
  (props, ref) => {
    const state = useDescriptionList(props, ref);

    return renderDescriptionList(state);
  }
);

DescriptionList.displayName = 'DescriptionList';
