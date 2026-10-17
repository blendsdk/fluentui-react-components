# Loading: Loading Primitives

> **Document**: 03-01-loading.md
> **Parent**: [Index](00-index.md)

## Overview

`Loading` is the standalone filler: a transparent, centered, indeterminate spinner with a visible
label and a polite status announcement. It is used when a region has no content to cover, or as the
visual primitive that `LoadingOverlay` composes. It holds no application state and performs no I/O.

## Architecture

### Current Architecture

There is no loading component in the package. Applications currently compose a local wrapper around
the Fluent `Spinner` or port the v8 `fui8` component, repeating layout, label and announcement
decisions at each call site.

### Proposed Changes

Create `packages/react-components/src/components/Loading/` with the repository's component anatomy
plus two internal helpers:

| File                         | Responsibility                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `Loading.tsx`                | `forwardRef` shell; calls the state hook and render function; sets `displayName`.                      |
| `Loading.types.ts`           | `LoadingProps` contract and documentation.                                                             |
| `useLoadingBase.ts`          | Resolves defaults, label, visibility, delay, classes and root props; no JSX.                           |
| `useLoading.ts`              | Public `useLoading()` controller hook (specified in `03-03`, same folder to keep one loading feature). |
| `useLoading.types.ts`        | `LoadingOptions` and `LoadingController` public types (specified in `03-03`).                          |
| `renderLoading.tsx`          | Pure render of the status root and the decorative indicator.                                           |
| `renderLoadingIndicator.tsx` | Internal pure render of the visual spinner + visible label; shared with `LoadingOverlay`.              |
| `useLoadingStyles.styles.ts` | Griffel styles for the root, the visually hidden label and the indicator wrapper.                      |
| `useDelayedVisibility.ts`    | Internal shared hook: `active` + `delay` → visible boolean.                                            |
| `loadingLabel.ts`            | Internal English default resolver and blank/whitespace normalizer.                                     |
| `index.ts`                   | Barrel: `Loading`, `useLoading` and public types only.                                                 |
| `Loading.stories.tsx`        | Storybook variants.                                                                                    |

`useLoadingBase` is a recorded naming exception: the public hook is `useLoading`, so the component's
internal state hook cannot use the standard `useLoading.ts` name (AR-2).

## Implementation Details

### New Types/Interfaces

```ts
import type { ComponentPropsWithoutRef } from 'react';
import type { SpinnerProps } from '@fluentui/react-components';

export type LoadingProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'role' | 'aria-live' | 'aria-atomic' | 'dangerouslySetInnerHTML'
> & {
  /** Visible/announced message; blank or whitespace falls back to "Loading…". */
  label?: string;
  /** Fluent Spinner size; default "large". */
  size?: SpinnerProps['size'];
  /** Fluent Spinner appearance; default "primary". */
  appearance?: SpinnerProps['appearance'];
  /** Label placement relative to the ring; default "below". */
  labelPosition?: SpinnerProps['labelPosition'];
  /** Milliseconds before the indicator appears; default 0. */
  delay?: number;
  /** Optional minimum block size for an otherwise empty parent. */
  minHeight?: number | string;
};

/** The resolved, render-ready view of a `Loading` instance. */
export type LoadingBaseState = {
  /** True once the delay has elapsed; controls the status text and indicator. */
  visible: boolean;
  /** The resolved, always non-empty label. */
  label: string;
  /** Fluent Spinner size after defaulting. */
  size: NonNullable<SpinnerProps['size']>;
  /** Fluent Spinner appearance after defaulting. */
  appearance: NonNullable<SpinnerProps['appearance']>;
  /** Fluent Spinner label placement after defaulting. */
  labelPosition: NonNullable<SpinnerProps['labelPosition']>;
  /** Griffel class names for the root, the hidden status text and the indicator wrapper. */
  classes: { root: string; visuallyHidden: string; indicator: string };
  /** Native div props to spread on the status root, excluding the component's own props. */
  rootProps: Omit<
    LoadingProps,
    'label' | 'size' | 'appearance' | 'labelPosition' | 'delay' | 'minHeight'
  >;
  /** Optional inline minimum block size; absent when the caller omitted it. */
  minHeight?: number | string;
};
```

The component owns `role`, `aria-live` and `aria-atomic` on its root. Those attributes and
`dangerouslySetInnerHTML` are omitted from the props type because the component controls them and
never parses HTML; accepting them would let a caller silently break the announcement contract.
`aria-label` and other native props remain available; `className` and `style` merge. `children` is
omitted because the component owns the indicator; a caller supplies a label, not content.

### New Functions/Methods

```ts
/** Resolves the English default and the blank/whitespace fallback; always non-empty. */
export function resolveLoadingLabel(label?: string): string; // internal

/** Returns undefined for a blank/whitespace label; otherwise the original string. */
export function normalizeLabel(label?: string): string | undefined; // internal

/** Returns true after `delay` ms while `active`; false immediately when inactive. */
export function useDelayedVisibility(active: boolean, delay: number): boolean; // internal

/** Resolves defaults, visibility and classes; no JSX. */
export function useLoadingBase(props: LoadingProps): LoadingBaseState; // internal

/** Renders the visual indicator inside its own aria-hidden wrapper; the caller supplies the wrapper class. */
export function renderLoadingIndicator(props: {
  label: string;
  size: NonNullable<SpinnerProps['size']>;
  appearance: NonNullable<SpinnerProps['appearance']>;
  labelPosition: NonNullable<SpinnerProps['labelPosition']>;
  className?: string;
}): ReactElement; // internal

/** Renders the status root and the indicator. */
export function renderLoading(state: LoadingBaseState, ref: Ref<HTMLDivElement>): ReactElement; // internal
```

`LoadingBaseState` is the single internal contract shared by the state hook, the render function
and the two implementation tasks that build them. `renderLoadingIndicator` owns its wrapper, so both
`Loading` and `LoadingOverlay` get the same `aria-hidden` treatment without repeating the attribute
at each call site.

### Defaults and Resolution

| Input                 | Resolution                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `label`               | `undefined`, empty or whitespace → `Loading…`; otherwise the trimmed check keeps the original value                            |
| `size`                | `large`                                                                                                                        |
| `appearance`          | `primary`                                                                                                                      |
| `labelPosition`       | `below`                                                                                                                        |
| `delay`               | finite `> 0` → that value; otherwise `0`                                                                                       |
| `minHeight`           | applied to the root's inline `style` only when defined; no default                                                             |
| `className` / `style` | merged onto the root; the caller's style wins on conflicts, except that a defined `minHeight` prop wins over `style.minHeight` |
| other native props    | spread onto the root                                                                                                           |

When `minHeight` is `undefined`, the resolver must not write the key: spreading
`{ minHeight: undefined }` after the caller's style would erase a legitimate
`style={{ minHeight: 120 }}`. The renderer therefore spreads the key conditionally.

### DOM and Accessibility Structure

```tsx
<div
  {...rootProps}
  ref={ref}
  className={mergeClasses(classes.root, rootProps.className)}
  style={{ ...rootProps.style, ...(minHeight !== undefined ? { minHeight } : null) }}
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <span className={classes.visuallyHidden}>{visible ? label : ''}</span>
  {visible &&
    renderLoadingIndicator({
      label,
      size,
      appearance,
      labelPosition,
      className: classes.indicator,
    })}
</div>
```

- The root is the single live region. It is mounted immediately, but its text is empty until the
  delayed visibility hook reveals the label (AR-5, AR-12).
- `renderLoadingIndicator` renders the Fluent `Spinner` and its visible label inside an
  `aria-hidden` wrapper that the renderer itself owns, so the visible label and progressbar cannot
  produce a second announcement (AR-3). The caller passes the wrapper class (the `indicator` class
  from the styles hook) so the renderer stays layout-agnostic.
- The root is not focusable and is not in the tab order.
- `Loading` does not set `aria-busy`: it is a status indicator, not a content region that is updating.
  `LoadingOverlay` owns `aria-busy` for its region.

### Styles

The root is a full-width/full-height flex container that centers the indicator:

```ts
root: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
}
```

- No background, no border, no global `z-index`, no portal.
- `minHeight` is applied by inline style when the caller passes it. There is no default, because a
  default minimum could overflow a short region; the parent or the caller owns the region height.
- The visually hidden class uses the standard one-pixel/`clip` recipe with structural literals (no
  design token exists for a screen-reader-only box); the comment in the styles file records why.
- The styles hook exposes `root`, `visuallyHidden` and `indicator`. `visuallyHidden` is the single
  shared recipe: `LoadingOverlay` imports it from `Loading/useLoadingStyles.styles.ts` instead of
  re-declaring the class (see Integration Points).
- The Fluent `Spinner` owns the ring animation, label typography and label spacing. The component
  does not add motion, so there is no extra reduced-motion concern.
- The root's colors inherit from the theme; the spinner uses Fluent's brand stroke and label color.

### Integration Points

- `LoadingOverlay` imports the internal `renderLoadingIndicator` and the `visuallyHidden` class from
  `Loading/useLoadingStyles.styles.ts`; it does not render the `Loading` status root, because the
  overlay needs a persistent status node with a text update rather than a newly mounted status
  (AR-4, AR-5).
- The overlay's styles module imports that class; it does not duplicate the screen-reader recipe.
- The overlay's scrim and `inert` guarantee is region-scoped; portaled or fixed content is a
  documented limitation of the overlay and is checked manually (see the overlay spec).
- `useLoading` is independent of `Loading`; it only supplies `isLoading` and `label` to the caller,
  which passes them to `LoadingOverlay` or `Loading`.
- The package barrel exports `Loading`, `useLoading` and the public types; `renderLoadingIndicator`,
  `useDelayedVisibility`, `loadingLabel`, `normalizeLabel` and `useLoadingBase` remain private.

## Code Examples

### Standalone filler

```tsx
<Loading label="Loading records…" />
```

### Empty parent with a minimum height

```tsx
<div style={{ height: 240 }}>
  <Loading label="Loading records…" minHeight={240} />
</div>
```

### Caller style with a minimum height

```tsx
<Loading style={{ minHeight: 120 }} />
```

When the `minHeight` prop is omitted, `style.minHeight` passes through unchanged.

### Localized label

```tsx
<Loading label={t('please_wait')} />
```

## Error Handling

| Error Case                               | Handling Strategy                                                                      | AR Ref |
| ---------------------------------------- | -------------------------------------------------------------------------------------- | ------ |
| `delay` is negative, `NaN` or `Infinity` | Normalize to `0`; the loader appears after the first effect.                           | AR-5   |
| `label` is empty or whitespace           | Fall back to `Loading…`; the status never has an empty accessible name.                | AR-7   |
| `minHeight` is a non-positive number     | Pass through as the caller requested; no validation, because it is a CSS layout value. | AR-9   |
| Component unmounts before delay expires  | The delayed-visibility hook clears its timer; no state update after unmount.           | AR-5   |

## Testing Requirements

- Specification tests (`test/loading.spec.test.tsx`): default/custom/blank label, status semantics,
  delay with fake timers, native props, ref, `minHeight` precedence (prop and caller style), single
  status region and no tab stop.
- Implementation tests (`test/loading.impl.test.tsx`): class merge, root structure, indicator
  `aria-hidden` ownership, default size/label position mapping where observable, timer cleanup on
  unmount and delay normalization.
- Story (`Loading.stories.tsx`): default, sizes, label positions, fixed-height parent, delayed reveal.
- SSR smoke (`test/loading.ssr.test.tsx`): render to string without browser access; the status root
  is present and empty before hydration.
- Visual size/label position and the live announcement are checked in the story and a real browser;
  jsdom has no layout engine and cannot prove the visual contract.
