import { mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { AppBarTitleState } from './useAppBarTitle';

/**
 * The heading elements by level.
 *
 * A typed lookup keeps the render branch free of casts. The `?? h1` fallback
 * protects a JavaScript caller that bypasses the type union with an invalid
 * level.
 */
const HEADING_ELEMENTS = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
} as const;

/**
 * Renders the application title.
 *
 * The link branch merges the link class so the no-underline, hover underline
 * and white focus ring actually reach the anchor. The heading and span
 * branches use the root class alone. Every root receives the callback ref that
 * forwards the caller's `HTMLElement` ref.
 *
 * @param state - resolved title state
 * @returns the selected span, heading or anchor
 */
export function renderAppBarTitle(state: AppBarTitleState): ReactElement {
  if (state.mode === 'link') {
    return (
      <a
        {...state.rootProps}
        className={mergeClasses(state.classes.root, state.classes.link, state.rootProps.className)}
        href={state.href}
        target={state.target}
        rel={state.rel}
        ref={state.rootRef}
      >
        {state.children}
      </a>
    );
  }

  if (state.mode === 'heading') {
    const Heading = HEADING_ELEMENTS[state.headingLevel] ?? HEADING_ELEMENTS[1];

    return (
      <Heading
        {...state.rootProps}
        className={mergeClasses(state.classes.root, state.rootProps.className)}
        ref={state.rootRef}
      >
        {state.children}
      </Heading>
    );
  }

  return (
    <span
      {...state.rootProps}
      className={mergeClasses(state.classes.root, state.rootProps.className)}
      ref={state.rootRef}
    >
      {state.children}
    </span>
  );
}
