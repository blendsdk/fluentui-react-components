// Template: src/components/<Name>/use<Name>Styles.styles.ts
// Replace <Name> and the classes with the real set. makeStyles at module
// scope; tokens for every value; variants merged in the hook. Comment any
// selector whose reason is not obvious.
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  rootBase: {
    // Structural declarations shared by every variant.
    display: 'grid',
    margin: 0,
  },
  rootDefault: {
    // The default variant.
    gridTemplateColumns: '1fr',
    rowGap: tokens.spacingVerticalXXS,
  },
  rootAlternative: {
    // The alternative variant; explain the layout decision when it is not
    // self-evident (column tracks, baseline alignment, subgrid, ...).
    gridTemplateColumns: 'max-content minmax(0, 1fr)',
    columnGap: tokens.spacingHorizontalL,
  },
  label: {
    // Document unusual token choices and every literal.
    color: tokens.colorNeutralForeground2,
    margin: 0,
  },
});

/**
 * Classes the component hands to {@link render<Name>}.
 */
export type <Name>Classes = {
  /** Root classes for the resolved variant. */
  root: string;
  /** Classes of the label element. */
  label: string;
};

/**
 * Resolves the component style classes.
 *
 * @param variant - the resolved variant the styles depend on
 * @returns the class names consumed by the component's render function
 */
export function use<Name>Styles(variant: '<variant-a>' | '<variant-b>'): <Name>Classes {
  const styles = useStyles();

  return {
    root: mergeClasses(styles.rootBase, variant === '<variant-b>' ? styles.rootAlternative : styles.rootDefault),
    label: styles.label,
  };
}
