import { makeStyles, tokens } from '@fluentui/react-components';

/** Layout only: Card and Accordion retain ownership of surface and focus styling. */
const useStyles = makeStyles({
  root: { minWidth: 0 },
  headerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalXS,
    minWidth: 0,
  },
  heading: {
    // A zero flex basis lets the title shrink beside actions; it is a layout ratio, not spacing.
    flex: '1 1 0%',
    minWidth: 0,
    margin: 0,
  },
  button: {
    minWidth: 0,
    textAlign: 'start',
    // Fluent's button rule is inserted later. This own-slot guard wins without changing focus styles.
    ':enabled:not([aria-disabled="true"])': { fontWeight: tokens.fontWeightSemibold },
  },
  expandIcon: {
    '@media (prefers-reduced-motion: reduce)': {
      // The default icon has an inline transition. Override only this direct SVG, never caller icons.
      '& > svg': { transition: 'none !important' },
    },
  },
  title: { minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere' },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    maxWidth: '100%',
    minWidth: 0,
  },
  panel: {
    // Card already supplies the horizontal inset; do not add AccordionPanel's extra margin.
    marginInline: 0,
  },
  body: { paddingBlockStart: tokens.spacingVerticalS },
});

/** Classes attached to the component's own elements and public Fluent slots. */
export type CollapsibleSectionClasses = {
  /** Minimal sizing on the filled Card root. */
  root: string;
  /** Wrapping layout for the heading and independent actions. */
  headerRow: string;
  /** Shrinking semantic heading without browser heading margins. */
  heading: string;
  /** Semibold disclosure text without replacing Fluent's interaction styling. */
  button: string;
  /** Preference-scoped transition suppression on the default expand icon. */
  expandIcon: string;
  /** Wrapping content inside the disclosure button. */
  title: string;
  /** Wrapping sibling action controls. */
  actions: string;
  /** Panel inset adjustment to avoid duplicate Card padding. */
  panel: string;
  /** Token-based separation between header and body. */
  body: string;
};

/** Returns the local layout classes; visual header sizes remain Fluent's responsibility. */
export function useCollapsibleSectionStyles(): CollapsibleSectionClasses {
  return useStyles();
}
