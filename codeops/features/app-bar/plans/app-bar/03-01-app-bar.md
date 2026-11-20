# AppBar: AppBar Implementation Plan

> **Document**: 03-01-app-bar.md
> **Parent**: [Index](00-index.md)
> **Contract**: [RD-01 §Public API](../../requirements/RD-01-app-bar-shell.md#public-api-m)

## Overview

`AppBar` is the semantic brand header. It owns the 48px flex row, the brand surface, the
foreground inheritance and the forwarded ref. It does not own the title, spacer, commands or
launcher; those are children.

## Architecture

### File inventory

| File                         | Responsibility                                             |
| ---------------------------- | ---------------------------------------------------------- |
| `AppBar.types.ts`            | `AppBarProps` — native header props plus required children |
| `useAppBar.ts`               | Resolve `children`, remaining props, ref and classes       |
| `renderAppBar.tsx`           | Render the `<header>` and merge classes                    |
| `useAppBarStyles.styles.ts`  | Griffel root style and `AppBarClasses`                     |
| `AppBar.tsx`                 | `forwardRef` shell, display name and JSDoc example         |
| `index.ts`                   | Export `AppBar` and `AppBarProps`                          |
| `stories/AppBar.stories.tsx` | Shell stories; composed M365 stories are added in RD-02    |

### State hook

```ts
import type { ReactNode, Ref } from 'react';
import type { AppBarProps } from './AppBar.types';
import type { AppBarClasses } from './useAppBarStyles.styles';
import { useAppBarStyles } from './useAppBarStyles.styles';

export type AppBarState = {
  children: ReactNode;
  rootProps: Omit<AppBarProps, 'children'>;
  rootRef: Ref<HTMLElement>;
  classes: AppBarClasses;
};

export function useAppBar(props: AppBarProps, ref: Ref<HTMLElement>): AppBarState {
  const { children, ...rootProps } = props;

  return {
    children,
    rootProps,
    rootRef: ref,
    classes: useAppBarStyles(),
  };
}
```

The hook has no state and no effects. It only separates the owned `children` from the native
props and resolves the style classes (AR-04, AR-11).

### Render

```tsx
import { mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { AppBarState } from './useAppBar';

export function renderAppBar(state: AppBarState): ReactElement {
  return (
    <header
      {...state.rootProps}
      className={mergeClasses(state.classes.root, state.rootProps.className)}
      ref={state.rootRef}
    >
      {state.children}
    </header>
  );
}
```

The caller's props spread first; `className` and `ref` come after so the component's class is
always merged and the ref always points at the header. `role` is not set: a top-level `<header>`
already exposes the banner landmark (AR-11).

### Styles

`useAppBarStyles.styles.ts` exports `AppBarClasses = { root: string }` and a `makeStyles` block:

| Property          | Value                                  |
| ----------------- | -------------------------------------- |
| `display`         | `flex`                                 |
| `flexDirection`   | `row`                                  |
| `alignItems`      | `center`                               |
| `flexWrap`        | `nowrap`                               |
| `boxSizing`       | `border-box`                           |
| `width`           | `100%`                                 |
| `minHeight`       | `'48px'`                               |
| `flexShrink`      | `0`                                    |
| `padding`         | `0`                                    |
| `gap`             | `0`                                    |
| `border`          | `'none'`                               |
| `boxShadow`       | `'none'`                               |
| `borderRadius`    | `0`                                    |
| `backgroundColor` | `tokens.colorBrandBackground`          |
| `color`           | `tokens.colorNeutralForegroundOnBrand` |

The `48px` value is the only height literal; Fluent has no bar-height token. A comment in the
styles file states that and points at the M365 reference (AR-05, AR-13). No `overflow` property is
set; the default `visible` prevents focus-ring and popover clipping (AR-05).

The title and command text use a unitless line-height (`1.4286` = 20px at 14px) so the line box
scales at 200% text-only zoom; the bar's `min-height` lets it grow when the content exceeds 48px.
The manual `Geometry` check covers both normal-text 48px and text-only zoom without clipping.

## Implementation Details

### Class names

The component exports no class constants. The root class comes from Griffel via
`useAppBarStyles`; callers merge their own `className` through the render (AR-04).

### Ref

`AppBar` forwards `HTMLElement` because the root is a `<header>`. The same ref is what the
application passes to `AppLauncher`'s `dockTarget`; no launcher change is needed (AR-10).

### Composition order

The component does not enforce child order. The documented order is: launcher, title, spacer,
commands. A trailing command is flush only when it is the last 48px child; the application owns
that composition (AR-05).

## Error Handling

| Error case                                | Handling strategy                                                             | AR Ref       |
| ----------------------------------------- | ----------------------------------------------------------------------------- | ------------ |
| Missing `children`                        | TypeScript error; the prop is required                                        | AR-04        |
| A caller passes `dangerouslySetInnerHTML` | Omitted from the public type; this is a type-level guard, not a runtime guard | AR-13        |
| A caller nests `AppBar` in a section      | The header is not a banner; the component does not force the role             | AR-11        |
| A caller overrides the background         | The style passes through; the caller owns contrast                            | AR-03, AR-13 |

There are no runtime error paths: the component renders caller-owned React children.

## Testing Requirements

- Spec cases ST-1..ST-6 in [07-testing-strategy.md](07-testing-strategy.md).
- Impl checks: the root class is applied, the caller class is merged, the ref points at the
  header, and no `data-app-bar-button` is added to arbitrary children.
- Story: `AppBar / Default` and a shell-only `Geometry` (48px placeholder blocks, dashed outlines
  and a narrow title case) in Phase 1; the user reviews them before Phase 2. The composed M365
  stories, including the `AppBarButton`, are added in RD-02.
