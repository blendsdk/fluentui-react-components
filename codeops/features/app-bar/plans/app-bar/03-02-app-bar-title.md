# AppBarTitle: AppBar Implementation Plan

> **Document**: 03-02-app-bar-title.md
> **Parent**: [Index](00-index.md)
> **Contract**: [RD-01 §Public API](../../requirements/RD-01-app-bar-shell.md#public-api-m)

## Overview

`AppBarTitle` renders the product or application name. It has three mutually exclusive roots:
a default `<span>`, a heading (`<h1>`–`<h6>`) when `headingLevel` is set, or an anchor when
`href` is set. The union in `AppBarTitleProps` makes the heading-plus-link combination
unrepresentable.

## Architecture

### File inventory

| File                              | Responsibility                                            |
| --------------------------------- | --------------------------------------------------------- |
| `AppBarTitle.types.ts`            | The text-vs-link union and its JSDoc                      |
| `useAppBarTitle.ts`               | Resolve the mode, heading level, root props, classes, ref |
| `renderAppBarTitle.tsx`           | Render the selected root and merge classes                |
| `useAppBarTitleStyles.styles.ts`  | Root typography, margins, truncation, link states         |
| `AppBarTitle.tsx`                 | `forwardRef` shell, display name and JSDoc example        |
| `index.ts`                        | Export `AppBarTitle` and `AppBarTitleProps`               |
| `stories/AppBarTitle.stories.tsx` | Plain, heading, link and long-title stories               |

### State hook

```ts
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
  children: ReactNode;
  rootRef: RefCallback<HTMLElement>;
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

export type AppBarTitleState =
  AppBarTitleTextState | AppBarTitleHeadingState | AppBarTitleLinkState;

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
```

The hook is pure. The mode is derived from the presence of `href`/`headingLevel`; the public union
guarantees they are never both present (AR-02). The internal `AppBarTitleTextProps` and
`AppBarTitleLinkProps` are exported from the types module for this state union but are **not**
exported from the folder barrel or the package root. The callback ref adapts the public
`Ref<HTMLElement>` to the span, heading and anchor roots without a cast (PF-003).

### Render

```tsx
const HEADING_ELEMENTS = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
} as const;

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
```

The `HEADING_ELEMENTS` lookup is a typed constant, not a cast. The `?? HEADING_ELEMENTS[1]`
fallback protects a JavaScript caller from a level outside 1–6 (PF-017). The render branches so
each root gets the correct intrinsic element type; the callback ref is attached to that root; the
link branch merges `classes.link` so the link rules actually reach the anchor (PF-002).

### Styles

`useAppBarTitleStyles(link: boolean)` returns `{ root: string, link: string | undefined }`.

| Property            | Value                             |
| ------------------- | --------------------------------- |
| `fontSize`          | `tokens.fontSizeBase300` (14px)   |
| `lineHeight`        | unitless `1.4286` (20px at 14px)  |
| `fontWeight`        | `tokens.fontWeightSemibold` (600) |
| `color`             | `inherit`                         |
| `marginBlock`       | `0`                               |
| `marginInlineStart` | `tokens.spacingHorizontalS` (8px) |
| `marginInlineEnd`   | `tokens.spacingHorizontalS` (8px) |
| `display`           | `block`                           |
| `minWidth`          | `0`                               |
| `whiteSpace`        | `nowrap`                          |
| `overflow`          | `hidden`                          |
| `textOverflow`      | `ellipsis`                        |

The link class adds `color: inherit`, `textDecorationLine: 'none'`,
`:hover { textDecorationLine: 'underline' }` and
`:focus-visible { outline: '2px solid ' + tokens.colorNeutralForegroundOnBrand, outlineOffset: '2px' }`.
The root's `overflow: hidden` does not clip the root's own focus outline; it only clips the text
(AR-06, AR-11). The unitless line-height keeps the normal 14px/20px look and scales the line box
at 200% text-only zoom; the title may ellipsize horizontally but does not clip vertically
(PF-004). The value is the unitless equivalent of `lineHeightBase300` and is recorded in AR-13.

The heading branch resets the browser's heading margins through `marginBlock: 0` and applies the
same 14px semibold ramp, so an `h1` does not render at 2em (AR-06).

## Implementation Details

### Class names

`AppBarTitleClasses = { root: string; link?: string }`. The render merges `classes.link` only in
link mode; the heading and span modes use the root class alone (AR-04, AR-06). The impl test
asserts the link class is present in link mode and absent in the other modes (PF-002).

### Ref

The public ref is `Ref<HTMLElement>`. The state exposes a `RefCallback<HTMLElement>` that forwards
to the caller's ref; the callback is assignable to the span, heading and anchor roots without a
cast. The spec test checks all three cases (AR-06, PF-003).

### Truncation

The title is a flex item with `min-width: 0`, `overflow: hidden`, `white-space: nowrap` and
`text-overflow: ellipsis`. The full text stays in the DOM and remains the accessible name; the
`TitleVariants` story shows the narrow-width result (AR-06, AR-11).

## Error Handling

| Error case                              | Handling strategy                                                                                          | AR Ref        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------- |
| `headingLevel` plus `href`              | TypeScript error; the union makes it unrepresentable                                                       | AR-02         |
| `href` without a string                 | TypeScript error; the link variant requires `href`                                                         | AR-02         |
| Missing children                        | TypeScript error; `children` is required                                                                   | AR-04         |
| A heading level outside 1–6             | TypeScript error; the literal union excludes it; the runtime falls back to `h1` for a JavaScript caller    | AR-06, PF-017 |
| A caller nests a link in the title text | Link mode expects plain, non-interactive children; a nested link is invalid HTML and is documented against | AR-06, PF-019 |

The `dangerouslySetInnerHTML` omission is a type-level guard, not a runtime guard; a JavaScript
caller can still pass it. The component does not inspect or sanitize children beyond React's
normal escaping.

## Testing Requirements

- Spec cases ST-7..ST-13 in [07-testing-strategy.md](07-testing-strategy.md).
- Type test `test/app-bar-title.types.test.tsx`: heading+link and heading level 7 are errors.
- Impl checks: the root class is applied, the link class appears only in link mode, and the
  callback ref points at the selected root in all three modes.
- Story: `AppBarTitle / Plain`, `Heading`, `Link`, `Long`; the `Link` variant is included in the
  manual checklist even though it is not one of the three formal composed stories (PF-002).
