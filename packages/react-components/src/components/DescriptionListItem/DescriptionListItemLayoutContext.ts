import { createContext } from 'react';

/**
 * Layout the surrounding description list asks its items to render with.
 *
 * `'stacked'` places the label above the value; `'columns'` places the label
 * in a column of its own beside the value, with the labels of all pairs in
 * the list aligned with each other.
 */
export type DescriptionListLayout = 'stacked' | 'columns';

/**
 * Layout description list items render with.
 *
 * `DescriptionList` provides the layout it was given, so the innermost list
 * wins for the items it wraps. Items rendered outside any list fall back to
 * `'stacked'`, the layout of the first description list.
 */
export const DescriptionListItemLayoutContext = createContext<DescriptionListLayout>('stacked');
