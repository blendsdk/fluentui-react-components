import * as React from 'react';
import type { AppBarTitleProps } from './AppBarTitle.types';
import { renderAppBarTitle } from './renderAppBarTitle';
import { useAppBarTitle } from './useAppBarTitle';

/**
 * Application title: the product or application name in the bar.
 *
 * The default is a plain span, so the page keeps control of its heading
 * hierarchy. Use `headingLevel` when the product name is the document
 * heading, or `href` when it links home; the two forms cannot be combined.
 * The title truncates with an ellipsis when the bar is narrow and keeps the
 * full text in the DOM.
 *
 * @example
 * ```tsx
 * <AppBarTitle>Contoso</AppBarTitle>
 * <AppBarTitle headingLevel={1}>Contoso</AppBarTitle>
 * <AppBarTitle href="/">Contoso</AppBarTitle>
 * ```
 */
export const AppBarTitle = React.forwardRef<HTMLElement, AppBarTitleProps>((props, ref) => {
  const state = useAppBarTitle(props, ref);

  return renderAppBarTitle(state);
});

AppBarTitle.displayName = 'AppBarTitle';
