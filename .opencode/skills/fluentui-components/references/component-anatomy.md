# Component anatomy

Every component lives in `src/components/<Name>/` and consists of files with a
single responsibility each. The split exists so that reading one file answers
one question: what is the contract (types), what does it remember and resolve
(hook), what does it look like (styles), what does it render (render function),
and how is it mounted (component).

The living example in this repository is
`src/components/DescriptionListItem/` — a leaf component — and
`src/components/DescriptionList/` — its container. Read them beside this
document; the launcher-style container/item pairs follow the same shape.

## The seven files

| File                        | Question it answers                         | Must not contain                                                 |
| --------------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| `<Name>.tsx`                | How is the component mounted?               | Logic, JSX beyond the render call                                |
| `<Name>.types.ts`           | What is the public contract?                | Values, defaults, imports of React                               |
| `use<Name>.ts`              | What state and classes does rendering need? | JSX, side effects                                                |
| `render<Name>.tsx`          | What elements are produced?                 | Hooks, conditionals on props that the state should have resolved |
| `use<Name>Styles.styles.ts` | What does it look like?                     | Selectors that depend on runtime JS state                        |
| `<Name>Context.ts`          | What does a container tell its children?    | Rendering, defaults that belong to a component                   |
| `index.ts`                  | What does the folder export?                | Anything beyond the component and its props type                 |

## Skeleton: `<Name>.tsx`

````tsx
import * as React from 'react';
import type { <Name>Props } from './<Name>.types';
import { render<Name> } from './render<Name>';
import { use<Name> } from './use<Name>';

/**
 * One or two sentences: what the component renders and who decides its
 * content. Mention when *not* to use it, if that is not obvious.
 *
 * @example
 * ```tsx
 * <<Name> label="Example" />
 * ```
 */
export const <Name> = React.forwardRef<<Element>, <Name>Props>((props, ref) => {
  const state = use<Name>(props, ref);

  return render<Name>(state);
});

<Name>.displayName = '<Name>';
````

Rules that are easy to get wrong:

- `import * as React from 'react'` for the component shell (the classic
  Fluent UI style); `import type { … } from 'react'` everywhere else.
- The shell has exactly three statements: state, render, return. Nothing else.
- `displayName` is always set — it is what React DevTools and error messages
  show.

## Skeleton: `<Name>.types.ts`

````ts
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Props of <the noun the component represents>.
 *
 * One paragraph for the whole contract: what the component renders, which part
 * the application owns, and what follows the surrounding context. Then note
 * the pass-through: "All native props of the root element (`className`,
 * `aria-*`, event handlers, ...) pass through."
 *
 * @example
 * ```tsx
 * <<Name> label="Example" />
 * ```
 */
export type <Name>Props = Omit<ComponentPropsWithoutRef<'<element>'>, 'children'> & {
  /** Document every prop: meaning, default, precedence, accessibility effect. */
  children: ReactNode;
};
````

- Base the type on the element the component actually renders, so consumers
  get correct `aria-*`, `style`, `onClick` and `className` typing for free.
- `Omit` the props the component owns (for example `children` when the
  component defines its own shape, or `onChange` when the component replaces
  its semantics). Omitting for convenience is forbidden.
- Defaults live in the hook, not in the type — but they are documented here.

## Skeleton: `use<Name>.ts`

```ts
import type { Ref } from 'react';
import type { <Name>Props } from './<Name>.types';
import type { <Name>Classes } from './use<Name>Styles.styles';
import { use<Name>Styles } from './use<Name>Styles.styles';

/**
 * State that {@link render<Name>} renders.
 */
export type <Name>State = {
  /** What the caller sees. */
  label: <Name>Props['label'];
  /** Remaining native props forwarded to the root element. */
  rootProps: Omit<<Name>Props, 'label'>;
  /** Ref to the root element, forwarded to the applications. */
  rootRef: Ref<<Element>>;
  /** Resolved style classes. */
  classes: <Name>Classes;
};

/**
 * Resolves the props into render state.
 *
 * Explain the non-obvious parts: where the layout comes from, how a
 * controlled prop pairs with its change callback, what precedence applies.
 *
 * @param props - props from this instance of the component
 * @param ref - ref to the root element
 * @returns the state consumed by {@link render<Name>}
 */
export function use<Name>(props: <Name>Props, ref: Ref<<Element>>): <Name>State {
  const { children, label, ...rootProps } = props;

  const classes = use<Name>Styles();

  return { label, children, rootProps, rootRef: ref, classes };
}
```

## Skeleton: `render<Name>.tsx`

```tsx
import { mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { <Name>State } from './use<Name>';

/**
 * Renders <the thing>, optionally explaining the element choice (semantics!
 * specificity!) and any Fluent UI prop with surprising behavior.
 *
 * @param state - resolved component state
 * @returns the rendered element
 */
export function render<Name>(state: <Name>State): ReactElement {
  return (
    <div
      {...state.rootProps}
      className={mergeClasses(state.classes.root, state.rootProps.className)}
      ref={state.rootRef}
    >
      {state.children}
    </div>
  );
}
```

Ordering in the JSX matters: spread the caller's props first, then override the
attributes the component owns (`className`, `ref`, controlled values). Anything
that must not be overridable comes after the spread.

## Skeleton: `<Name>Context.ts` (containers and their children only)

```ts
import { createContext } from 'react';

/**
 * What a container asks its children to render with.
 */
export type <Name>Layout = 'default' | 'compact';

/**
 * <Description of the negotiation.> The container provides the value; children
 * that render outside a container fall back to `'default'`.
 */
export const <Name>LayoutContext = createContext<<Name>Layout>('default');
```

Conventions:

- The context file lives next to the **child** that consumes it, as in the
  living example; the container imports it from there.
- The default value is the child's standalone behavior, so a child rendered
  outside a container still renders sensibly.
- Contexts are internal: they are not exported from the package root.

## Skeleton: `index.ts`

```ts
export { <Name> } from './<Name>';
export type { <Name>Props } from './<Name>.types';
```

Two lines, no more. Every component also gets its export in the package barrel
`src/index.ts`, in the same two-line shape, grouped under the component.

## Naming recap

| Thing                       | Convention                        | Example                                                                                           |
| --------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| Folder, component, files    | PascalCase                        | `DescriptionList/DescriptionList.tsx`                                                             |
| Hook, state, render, styles | camelCase with the component name | `useDescriptionList`, `DescriptionListState`, `renderDescriptionList`, `useDescriptionListStyles` |
| Classes type                | `<Name>Classes`                   | `DescriptionListItemClasses`                                                                      |
| Test files                  | kebab-case with the test role     | `description-list-item.spec.test.tsx`                                                             |
| Context type/value          | `<Name>…Context`                  | `DescriptionListItemLayoutContext`                                                                |
