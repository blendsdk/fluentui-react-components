import type { HTMLAttributeAnchorTarget, ReactNode, Ref, RefCallback } from 'react';
import { useCallback } from 'react';
import type {
  AppBarTitleLinkProps,
  AppBarTitleProps,
  AppBarTitleTextProps,
} from './AppBarTitle.types';
import type { AppBarTitleClasses } from './useAppBarTitleStyles.styles';
import { useAppBarTitleStyles } from './useAppBarTitleStyles.styles';

type AppBarTitleBaseState = {
  /** The visible title content, untouched. */
  children: ReactNode;
  /** Callback ref that adapts the public `HTMLElement` ref to the selected root. */
  rootRef: RefCallback<HTMLElement>;
  /** Resolved style classes. */
  classes: AppBarTitleClasses;
};

type AppBarTitleTextState = AppBarTitleBaseState & {
  mode: 'text';
  headingLevel: undefined;
  rootProps: Omit<AppBarTitleTextProps, 'children' | 'headingLevel' | 'href' | 'target' | 'rel'>;
};

type AppBarTitleHeadingState = AppBarTitleBaseState & {
  mode: 'heading';
  headingLevel: 1 | 2 | 3 | 4 | 5 | 6;
  rootProps: Omit<AppBarTitleTextProps, 'children' | 'headingLevel' | 'href' | 'target' | 'rel'>;
};

type AppBarTitleLinkState = AppBarTitleBaseState & {
  mode: 'link';
  href: string;
  target: HTMLAttributeAnchorTarget | undefined;
  rel: string | undefined;
  rootProps: Omit<AppBarTitleLinkProps, 'children' | 'href' | 'target' | 'rel' | 'headingLevel'>;
};

/**
 * State that {@link renderAppBarTitle} renders.
 *
 * The union keeps the root props correlated with the selected mode: span and
 * heading props for the text modes, anchor props for the link mode.
 */
export type AppBarTitleState =
  AppBarTitleTextState | AppBarTitleHeadingState | AppBarTitleLinkState;

/**
 * Resolves the title props into render state.
 *
 * The mode is derived from `href`/`headingLevel`; the public union guarantees
 * they are never both present. The callback ref is stable across renders and
 * forwards to the caller's `Ref<HTMLElement>`, which is assignable to the
 * span, heading and anchor roots without a cast.
 *
 * @param props - props from this instance of the title
 * @param ref - public ref to the selected root element
 * @returns the state consumed by {@link renderAppBarTitle}
 */
export function useAppBarTitle(props: AppBarTitleProps, ref: Ref<HTMLElement>): AppBarTitleState {
  const isLink = props.href !== undefined;
  const classes = useAppBarTitleStyles(isLink);

  const rootRef = useCallback<RefCallback<HTMLElement>>(
    node => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  if (props.href !== undefined) {
    const { children, href, target, rel, ...rootProps } = props;

    return { mode: 'link', href, target, rel, children, rootProps, rootRef, classes };
  }

  const { children, headingLevel, ...rootProps } = props;

  if (headingLevel !== undefined) {
    return { mode: 'heading', headingLevel, children, rootProps, rootRef, classes };
  }

  return { mode: 'text', headingLevel: undefined, children, rootProps, rootRef, classes };
}
