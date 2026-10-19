// Template: src/components/<Name>/use<Name>.ts
// Replace <Name>, <element> and the fields with the resolved state the render
// function needs. No JSX, no effects, no decisions that belong to the caller.
import type { Ref } from 'react';
import type { <Name>Props } from './<Name>.types';
import type { <Name>Classes } from './use<Name>Styles.styles';
import { use<Name>Styles } from './use<Name>Styles.styles';

/**
 * State that {@link render<Name>} renders.
 */
export type <Name>State = {
  /** What the caller passed, after defaulting. */
  label: <Name>Props['label'];
  /** Remaining native props forwarded to the root element. */
  rootProps: Omit<<Name>Props, 'label' | 'children'>;
  /** Ref to the root element, forwarded to the applications. */
  rootRef: Ref<<element>>;
  /** Resolved style classes. */
  classes: <Name>Classes;
};

/**
 * Resolves the props into render state.
 *
 * Explain the non-obvious parts of the resolution: where a value may come from
 * (props, context), what precedence applies, and why a default exists. Keep
 * the obvious steps unexplained.
 *
 * @param props - props from this instance of the component
 * @param ref - ref to the root element
 * @returns the state consumed by {@link render<Name>}
 */
export function use<Name>(props: <Name>Props, ref: Ref<<element>>): <Name>State {
  const { children, label, ...rootProps } = props;

  const classes = use<Name>Styles();

  return {
    label,
    children,
    rootProps,
    rootRef: ref,
    classes,
  };
}
