import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { DescriptionListLayout } from './DescriptionListItemLayoutContext';

/**
 * Styles of a description list item.
 *
 * The pair is laid out as a one-column grid by default — the label above the
 * value, separated by the smallest vertical spacing token. In a columns list
 * the pair instead spans the full width of the list's grid and takes its two
 * column tracks from that grid through `subgrid`, which is what keeps the
 * labels of all pairs aligned on one column and the values on the other. The
 * subgrid is deliberately unresized: it inherits the list's column tracks and
 * baseline alignment, and a browser without `subgrid` support drops the
 * declaration and falls back to the stacked arrangement.
 *
 * `dt` and `dd` carry user-agent margins (the definition is indented by
 * default); both are reset so the list's own grid owns the spacing.
 */
const useStyles = makeStyles({
  rootBase: {
    display: 'grid',
    margin: 0,
  },
  rootStacked: {
    gridTemplateColumns: '1fr',
    rowGap: tokens.spacingVerticalXXS,
  },
  rootColumns: {
    gridColumn: '1 / -1',
    gridTemplateColumns: 'subgrid',
  },
  label: {
    color: tokens.colorNeutralForeground2,
    margin: 0,
  },
  value: {
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
});

/**
 * Classes a description list item hands to {@link renderDescriptionListItem}.
 */
export type DescriptionListItemClasses = {
  /** Wrapper classes for the layout the surrounding list asks for. */
  root: string;
  /** Classes of the term element. */
  label: string;
  /** Classes of the definition element. */
  value: string;
};

/**
 * Resolves the item style classes for a layout.
 *
 * @param layout - layout provided by the surrounding list
 * @returns the class names consumed by the item's render function
 */
export function useDescriptionListItemStyles(
  layout: DescriptionListLayout
): DescriptionListItemClasses {
  const styles = useStyles();

  return {
    root: mergeClasses(
      styles.rootBase,
      layout === 'columns' ? styles.rootColumns : styles.rootStacked
    ),
    label: styles.label,
    value: styles.value,
  };
}
