// Template: src/components/<Name>/<Name>.types.ts
// Replace <Name>, <element> and the placeholder props with the real contract.
// Delete the pass-through note when the component renders no DOM element.
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Props of <the noun this component represents>.
 *
 * One paragraph: what the component renders, which part the application owns,
 * and what follows its surroundings (context). Then the pass-through note:
 * "All native props of the root element (`className`, `aria-*`, event
 * handlers, ...) pass through."
 *
 * @example
 * ```tsx
 * <<Name> label="Example" />
 * ```
 */
export type <Name>Props = Omit<ComponentPropsWithoutRef<'<element>'>, 'children'> & {
  /**
   * Every prop: meaning, default, precedence when two props interact, and the
   * accessibility effect when it has one.
   */
  label: ReactNode;

  /** Children: document what they should be (text, items, elements). */
  children: ReactNode;
};
