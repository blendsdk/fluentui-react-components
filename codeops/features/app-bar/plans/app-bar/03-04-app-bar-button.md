# AppBarButton: AppBar Implementation Plan

> **Document**: 03-04-app-bar-button.md
> **Parent**: [Index](00-index.md)
> **Contract**: [RD-02 §Public API](../../requirements/RD-02-app-bar-commands.md#public-api-m)

## Overview

`AppBarButton` is the on-brand command button. It wraps Fluent `Button`, forces the transparent,
square, medium treatment, and supplies the M365 states: white foreground, 12% white hover, 22%
white pressed/open, white 2px inset focus, muted disabled. It is also the component applications
pass as the existing `AppLauncher` trigger.

## Architecture

### File inventory

| File                               | Responsibility                                                        |
| ---------------------------------- | --------------------------------------------------------------------- |
| `AppBarButton.types.ts`            | `AppBarButtonProps` — forced props omitted, accessible-name union     |
| `useAppBarButton.ts`               | Resolve children, aria-label, default type, root props, classes, ref  |
| `renderAppBarButton.tsx`           | Render Fluent `Button` with forced props and `data-app-bar-button`    |
| `useAppBarButtonStyles.styles.ts`  | M365 base, hover, pressed, open, focus and disabled rules             |
| `AppBarButton.tsx`                 | `forwardRef` shell, display name and JSDoc example                    |
| `index.ts`                         | Export `AppBarButton` and `AppBarButtonProps`                         |
| `stories/AppBarButton.stories.tsx` | Icon-only, text, icon+text, disabled, disabledFocusable, open gallery |

### State hook

```ts
import type { ReactNode, Ref } from 'react';
import type { AppBarButtonBase, AppBarButtonProps } from './AppBarButton.types';
import type { AppBarButtonClasses } from './useAppBarButtonStyles.styles';
import { useAppBarButtonStyles } from './useAppBarButtonStyles.styles';

export type AppBarButtonState = {
  children: ReactNode | undefined;
  ariaLabel: string | undefined;
  type: 'button' | 'submit' | 'reset';
  rootProps: Omit<AppBarButtonBase, 'children' | 'aria-label' | 'type'>;
  rootRef: Ref<HTMLButtonElement>;
  classes: AppBarButtonClasses;
};

export function useAppBarButton(
  props: AppBarButtonProps,
  ref: Ref<HTMLButtonElement>
): AppBarButtonState {
  const { children, 'aria-label': ariaLabel, type = 'button', ...rootProps } = props;

  return {
    children,
    ariaLabel,
    type,
    rootProps,
    rootRef: ref,
    classes: useAppBarButtonStyles(),
  };
}
```

The hook is pure. `type` defaults to `"button"` so a bar command never submits a surrounding
form; a caller may still pass `type="submit"` when that is intentional (AR-07). The
`rootProps` retain `icon`, `iconPosition`, `onClick`, `disabled`, `disabledFocusable`, `className`,
`style`, `aria-expanded` and the other native button props. `AppBarButtonBase` is exported from the
types module for this state type but is **not** exported from the folder barrel or the package
root. The public type is button-only: `as` and `href` are not part of it (PF-001).

### Render

```tsx
import { Button, mergeClasses } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { AppBarButtonState } from './useAppBarButton';

export function renderAppBarButton(state: AppBarButtonState): ReactElement {
  return (
    <Button
      {...state.rootProps}
      ref={state.rootRef}
      appearance="transparent"
      shape="square"
      size="medium"
      type={state.type}
      aria-label={state.ariaLabel}
      data-app-bar-button=""
      className={mergeClasses(state.classes.root, state.rootProps.className)}
    >
      {state.children}
    </Button>
  );
}
```

The forced props come after the spread, so a JavaScript caller cannot override them. The
`data-app-bar-button` attribute is the styling hook; `aria-expanded` from `PopoverTrigger` arrives
in `rootProps` and reaches the DOM (AR-07, AR-17).

### Styles

`AppBarButtonClasses = { root: string }`. The base rules are qualified with
`&[data-app-bar-button]` so they outrank Fluent's `.fui-Button` rules:

```ts
const useStyles = makeStyles({
  root: {
    '&[data-app-bar-button]': {
      minWidth: '48px',
      minHeight: '48px',
      padding: `0 ${tokens.spacingHorizontalM}`,
      border: 'none',
      borderRadius: 0,
      backgroundColor: 'transparent',
      color: tokens.colorNeutralForegroundOnBrand,
      fontSize: tokens.fontSizeBase300,
      lineHeight: 1.4286,
      fontWeight: tokens.fontWeightRegular,
      whiteSpace: 'nowrap',
      flexShrink: 0,
    },
    '&[data-app-bar-button] svg': {
      color: tokens.colorNeutralForegroundOnBrand,
    },
    '&[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      color: tokens.colorNeutralForegroundOnBrand,
    },
    '&[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):hover:active, &[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):active:focus-visible':
      {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        color: tokens.colorNeutralForegroundOnBrand,
      },
    '&[data-app-bar-button]:not(:disabled):not([aria-disabled="true"])[aria-expanded="true"]': {
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      color: tokens.colorNeutralForegroundOnBrand,
    },
    '&[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):hover[aria-expanded="true"]':
      {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        color: tokens.colorNeutralForegroundOnBrand,
      },
    '&[data-app-bar-button][data-fui-focus-visible]': {
      border: 'none',
      borderRadius: 0,
      boxShadow: `0 0 0 ${tokens.strokeWidthThick} ${tokens.colorNeutralForegroundOnBrand} inset`,
      outline: `${tokens.strokeWidthThick} solid ${tokens.colorTransparentStroke}`,
    },
    '&[data-app-bar-button]:disabled, &[data-app-bar-button][aria-disabled="true"]': {
      color: tokens.colorNeutralForegroundDisabled,
      backgroundColor: 'transparent',
    },
    '&[data-app-bar-button]:disabled svg, &[data-app-bar-button][aria-disabled="true"] svg': {
      color: tokens.colorNeutralForegroundDisabled,
    },
  },
});
```

The exact selector strings are the implementation's responsibility; the required outcomes are
the state table in RD-02. The `rgba` values are the only literals besides `48px` and the unitless
`1.4286` line-height; the styles file carries the comment that no Fluent token represents a
translucent white overlay (AR-13, AR-17). The hover-plus-open rule is more specific than the plain
hover rule, so an open trigger keeps 22% while the pointer remains over it. The pressed rule also
covers `:active:focus-visible` for keyboard activation (PF-006).

`border: 'none'` is deliberate: Griffel's `UNSUPPORTED_CSS_PROPERTIES` includes `borderWidth` and
`borderColor`, so the earlier `borderWidth: 0` was logged and skipped. The supported `border:
'none'` plus `borderRadius: 0` removes both the resting border and Fluent's 1px focus border
(PF-007).

### Focus

Fluent's `Button` already sets `data-fui-focus-visible` and a focus box-shadow. The component's
attribute-qualified rule replaces the visible shadow with a white inset ring and resets the
`border`/`borderRadius` to `none`/`0` so Fluent's dark 1px focus border and medium radius do not
show. The transparent outline mirrors Fluent's own focus contract and keeps the browser's default
outline from appearing. The ring is inside the button, so Fluent's `overflow: hidden` does not clip
it (AR-11, AR-17, PF-007). `data-fui-focus-visible` is Fluent's internal focus-visible attribute,
not a public contract; the dependency is documented and the `States` focus check verifies it
(PF-025).

### Icon color

The rule `&[data-app-bar-button] svg { color: colorNeutralForegroundOnBrand }` keeps a Fluent icon
on-brand in every enabled state, even if Fluent's icon slot would repaint it on hover. Disabled
variants override it with `colorNeutralForegroundDisabled`. A caller-supplied logo with fixed
colors is not affected by `color` unless it uses `currentColor` (AR-17).

## Implementation Details

### Accessible name

The public union requires `aria-label` when `children` is absent and `NonNullable<ReactNode>` when
the children branch is used. The render passes `aria-label` after the spread, so the required name
wins over an injected `undefined`. When children are present, the visible text is the accessible
name and `aria-label` remains optional. TypeScript cannot reject `children=""` or `aria-label=""`;
the JSDoc and README state that both must be non-empty (AR-07, AR-11, PF-016).

### Disabled semantics

`disabled` and `disabledFocusable` are native Fluent `Button` props and are forwarded unchanged.
The visual rules only change colors and backgrounds; they never change activation. The hover and
open selectors exclude both disabled states (AR-07).

### Launcher integration

`PopoverTrigger` injects `aria-expanded`, `onClick` and its anchor ref into the trigger element.
`AppBarButton` forwards the ref to the Fluent `Button` root and spreads the injected props, so the
launcher works without a change. The open-state selector reads the injected `aria-expanded`
(AR-10, AR-17).

## Error Handling

| Error case                                    | Handling strategy                                                                | AR Ref        |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ------------- |
| Icon-only button without `aria-label`         | TypeScript error; the union requires a name                                      | AR-07         |
| Caller passes `appearance`, `shape` or `size` | TypeScript error; the props are omitted                                          | AR-07         |
| Caller passes `as` or `href`                  | TypeScript error; the command is button-only                                     | AR-07         |
| Caller passes `dangerouslySetInnerHTML`       | Omitted from the type; this is type-level, not a runtime guard                   | AR-13         |
| Caller passes an invalid `type`               | TypeScript error; the narrow `'button' \| 'submit' \| 'reset'` union applies     | AR-07         |
| Caller passes `children={null}`/`undefined`   | TypeScript error in the children branch; empty strings are documented as invalid | AR-07, PF-016 |
| A disabled button is hovered                  | The hover rule excludes disabled states; no feedback                             | AR-07         |
| Fluent repaints the icon                      | The svg rule pins the on-brand color; the story verifies                         | AR-17         |
| Keyboard activation uses no pointer           | The `:active:focus-visible` rule applies the 22% state                           | AR-17, PF-006 |

Fluent `Button` owns the DOM and activation behavior. The type-level omissions are not runtime
sanitization: a JavaScript caller can still pass omitted props, so the JSDoc states the intended
contract (PF-017).

## Testing Requirements

- Spec cases ST-16..ST-26 in [07-testing-strategy.md](07-testing-strategy.md).
- Type test `test/app-bar-button.types.test.tsx`: icon-only without a name, any forced prop,
  `as`/`href`, and `children={null}` are errors.
- Impl checks: `data-app-bar-button` is present, the root class is merged, the type defaults to
  `button`, and the launcher integration exposes `aria-expanded`.
- Story: `AppBarButton / Gallery`; composed `AppBar / Geometry` with dashed outlines and a ruler,
  `States` with hover, pointer press, keyboard press, focus and disabled states, and
  `WithLauncher` with the pointer left over the open trigger; a11y addon no violations.
