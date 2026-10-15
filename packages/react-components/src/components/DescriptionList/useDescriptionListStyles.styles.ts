import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { DescriptionListLayout } from '../DescriptionListItem/DescriptionListItemLayoutContext';

/**
 * Styles of a description list.
 *
 * Both layouts are grids. The stacked layout is a single column with the
 * medium vertical spacing between pairs, and each pair keeps its own label
 * and value stacked. The columns layout owns two column tracks — as wide as
 * the widest label, then the remaining width for the values — and each pair
 * spans them and takes its internal columns from this grid through `subgrid`,
 * which is what aligns the labels of all pairs on one column. Items align on
 * their baseline, so a value next to a differently sized label still sits on
 * the same line.
 *
 * `dl` carries a user-agent margin; the list resets it because it is a layout
 * container, not prose.
 */
const useStyles = makeStyles({
  rootBase: {
    color: tokens.colorNeutralForeground1,
    margin: 0,
    padding: 0,
  },
  rootStacked: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    rowGap: tokens.spacingVerticalM,
  },
  rootColumns: {
    display: 'grid',
    gridTemplateColumns: 'max-content minmax(0, 1fr)',
    alignItems: 'baseline',
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalS,
  },
});

/**
 * Classes a description list hands to {@link renderDescriptionList}.
 */
export type DescriptionListClasses = {
  /** Root classes for the resolved layout. */
  root: string;
};

/**
 * Resolves the list style classes for a layout.
 *
 * @param layout - layout the list was given
 * @returns the class names consumed by the list's render function
 */
export function useDescriptionListStyles(layout: DescriptionListLayout): DescriptionListClasses {
  const styles = useStyles();

  return {
    root: mergeClasses(
      styles.rootBase,
      layout === 'columns' ? styles.rootColumns : styles.rootStacked
    ),
  };
}
