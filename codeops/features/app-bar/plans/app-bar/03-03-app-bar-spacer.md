# AppBarSpacer: AppBar Implementation Plan

> **Document**: 03-03-app-bar-spacer.md
> **Parent**: [Index](00-index.md)
> **Contract**: [RD-01 §Public API](../../requirements/RD-01-app-bar-shell.md#public-api-m)

## Overview

`AppBarSpacer` is the flex layout helper that pushes trailing commands to the end of the bar. It
renders an empty `<div>` with no children and no accessible content. It replaces the fui9 spacer's
dead `flexSize` state with one fixed flex behavior (AR-04, AR-05).

## Architecture

### File inventory

| File                               | Responsibility                                      |
| ---------------------------------- | --------------------------------------------------- |
| `AppBarSpacer.types.ts`            | `AppBarSpacerProps` — native div props, no children |
| `useAppBarSpacer.ts`               | Resolve root props, ref and classes                 |
| `renderAppBarSpacer.tsx`           | Render the empty `<div>` and merge classes          |
| `useAppBarSpacerStyles.styles.ts`  | Flex-grow/shrink/basis, min-width and stretch       |
| `AppBarSpacer.tsx`                 | `forwardRef` shell, display name and JSDoc          |
| `index.ts`                         | Export `AppBarSpacer` and `AppBarSpacerProps`       |
| `stories/AppBarSpacer.stories.tsx` | Leading/trailing alignment story                    |

### State hook

```ts
export type AppBarSpacerState = {
  rootProps: AppBarSpacerProps;
  rootRef: Ref<HTMLDivElement>;
  classes: AppBarSpacerClasses;
};

export function useAppBarSpacer(
  props: AppBarSpacerProps,
  ref: Ref<HTMLDivElement>
): AppBarSpacerState {
  return {
    rootProps: props,
    rootRef: ref,
    classes: useAppBarSpacerStyles(),
  };
}
```

The hook has no state, effects or derived values beyond the classes. The spacer has no children
and no mode (AR-04).

### Render

```tsx
import { mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { AppBarSpacerState } from './useAppBarSpacer';

export function renderAppBarSpacer(state: AppBarSpacerState): ReactElement {
  return (
    <div
      {...state.rootProps}
      className={mergeClasses(state.classes.root, state.rootProps.className)}
      ref={state.rootRef}
    />
  );
}
```

There are no children: the div is empty and therefore has no accessible name and no tab stop.

### Styles

`AppBarSpacerClasses = { root: string }`.

| Property     | Value     |
| ------------ | --------- |
| `flexGrow`   | `1`       |
| `flexShrink` | `1`       |
| `flexBasis`  | `auto`    |
| `minWidth`   | `0`       |
| `alignSelf`  | `stretch` |

The spacer stretches the bar's height but is invisible; it does not add a background or border.
`alignSelf: stretch` is safe because the bar's `align-items: center` would otherwise size it to
its empty content height (AR-05).

## Implementation Details

### Class names

The component exports no class constants; the root class comes from Griffel and the caller's
`className` is merged in the render (AR-04).

### Ref

The ref is the `HTMLDivElement` root. No other element is rendered.

## Error Handling

| Error case                                | Handling strategy                                    | AR Ref |
| ----------------------------------------- | ---------------------------------------------------- | ------ |
| A caller passes children                  | TypeScript error; children are omitted from the type | AR-04  |
| A caller passes `dangerouslySetInnerHTML` | Omitted from the type; the spacer is empty           | AR-13  |

There are no runtime error paths.

## Testing Requirements

- Spec cases ST-14..ST-15 in [07-testing-strategy.md](07-testing-strategy.md).
- Impl check: the root class is applied, the caller class is merged and the ref points at the
  div.
- Story: `AppBarSpacer / Alignment`.
