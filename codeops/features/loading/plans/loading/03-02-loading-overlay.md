# LoadingOverlay: Loading Primitives

> **Document**: 03-02-loading-overlay.md
> **Parent**: [Index](00-index.md)

## Overview

`LoadingOverlay` is the region-scoped shim. It keeps its children mounted, covers them with a themed
scrim and a centered spinner while `loading` is true, makes the covered content inert and announces
the loading label once. It is controlled and presentation-only: the caller owns `loading`, the async
work and every side effect.

## Architecture

### Current Architecture

No equivalent exists in the package. Applications either replace content with a spinner (layout
shift, lost scroll/form state) or hand-roll an absolute layer without `aria-busy`, `inert` or focus
handling. The legacy `fui8` `Loading` was used as a replacement in all 47 call sites (external
evidence; the figures are not verifiable in this repository).

### Proposed Changes

Create `packages/react-components/src/components/LoadingOverlay/`:

| File                                | Responsibility                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `LoadingOverlay.tsx`                | `forwardRef` shell; calls the state hook and render function; sets `displayName`.                                 |
| `LoadingOverlay.types.ts`           | `LoadingOverlayProps` contract and documentation.                                                                 |
| `useLoadingOverlay.ts`              | Delay visibility, label resolution, status id, focus wiring, classes, refs and root props; no JSX.                |
| `useLoadingOverlayFocus.ts`         | Internal focus capture/move/restore hook; captures on `loading`, moves and restores on `visible`.                 |
| `renderLoadingOverlay.tsx`          | Pure render of the resolved `LoadingOverlayState`: root, persistent status, content wrapper, scrim and indicator. |
| `useLoadingOverlayStyles.styles.ts` | Griffel styles for root, content wrapper, scrim and focus-ring suppression.                                       |
| `index.ts`                          | Barrel: `LoadingOverlay` and `LoadingOverlayProps` only.                                                          |
| `LoadingOverlay.stories.tsx`        | Storybook async/fast/app-owned/custom-label stories.                                                              |

## Implementation Details

### New Types/Interfaces

```ts
import type { ComponentPropsWithoutRef, ReactNode, Ref, RefObject } from 'react';

export type LoadingOverlayProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  | 'children'
  | 'aria-busy'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-live'
  | 'aria-atomic'
  | 'dangerouslySetInnerHTML'
  | 'inert'
  | 'role'
  | 'tabIndex'
> & {
  /** Whether the covered operation is pending. */
  loading: boolean;
  /** Visible/announced message; blank or whitespace falls back to "Loading…". */
  label?: string;
  /** Milliseconds before the overlay appears; default 300. */
  delay?: number;
  /** Content that stays mounted and becomes inert while the overlay is visible. */
  children: ReactNode;
};
```

`aria-busy`, `aria-live`, `aria-atomic`, `role`, `inert` and `tabIndex` are omitted because the
component owns the busy, announcement and focus contract (AR-9); accepting `aria-live` would let a
caller create a second live region, and accepting `inert` on the root would inert the overlay itself.
`aria-label` and `aria-labelledby` are omitted because the root's accessible name is managed through
the persistent status node. `dangerouslySetInnerHTML` is omitted because `children` are required and
the component never parses HTML. `children` is required. `className`, `style`, `ref` and all other
native props reach the root. This is the plan-level reading of R10's pass-through rule: the managed
root name is an explicit exception, recorded for the next RD revision.

```ts
/** The resolved, render-ready view of a `LoadingOverlay` instance. */
export type LoadingOverlayState = {
  /** Whether the covered operation is pending. */
  loading: boolean;
  /** True once the delay has elapsed; controls inert, the scrim and the status text. */
  visible: boolean;
  /** The resolved, always non-empty label. */
  resolvedLabel: string;
  /** The covered content, kept mounted in both states. */
  children: ReactNode;
  /** Stable id shared by the root's `aria-labelledby` and the persistent status node. */
  statusId: string;
  /**
   * Merged root ref: the render function attaches it, the focus algorithm
   * keeps the same element, and the caller's forwarded ref receives the node.
   */
  rootRef: Ref<HTMLDivElement>;
  /** Ref for the content wrapper that becomes inert. */
  contentRef: RefObject<HTMLDivElement | null>;
  /** Griffel class names for root, content, scrim, indicator wrapper and hidden status. */
  classes: {
    root: string;
    content: string;
    scrim: string;
    indicator: string;
    visuallyHidden: string;
  };
  /** Native div props to spread on the root, excluding the component's own props. */
  rootProps: Omit<LoadingOverlayProps, 'loading' | 'label' | 'delay' | 'children'>;
};

/** Renders the resolved overlay state; no hooks are called here. */
export function renderLoadingOverlay(state: LoadingOverlayState): ReactElement; // internal
```

### State Machine

```
idle (loading=false)
  └─ loading=true ──► content wrapper aria-busy=true (immediately)
                       └─ delay (default 300ms)
                             ├─ loading=false before timer ──► idle (no overlay, no inert, no focus move)
                             └─ timer elapses ──► visible
                                                   ├─ content wrapper inert
                                                   ├─ scrim + spinner + visible label
                                                   ├─ status text becomes the label
                                                   └─ focus moves if it was inside / blurred to body
visible
  └─ loading=false ──► idle
                        ├─ status text becomes empty
                        ├─ inert removed and aria-busy=false
                        └─ focus restored if this component moved it
```

The state hook owns `visible` through the shared `useDelayedVisibility(loading, delay)` hook. The
visibility boolean starts `false` on the server and on the first client render; an effect sets it to
`true` immediately for `delay <= 0` or after the timer. This one-effect reveal is what guarantees the
persistent status node exists before its text appears (AR-5, AR-12).

### DOM Structure

```tsx
const {
  statusId,
  rootRef,
  contentRef,
  classes,
  rootProps,
  loading,
  visible,
  resolvedLabel,
  children,
} = state; // renderLoadingOverlay(state)

<div
  {...rootProps}
  ref={rootRef}
  className={mergeClasses(classes.root, rootProps.className)}
  style={rootProps.style}
  tabIndex={-1}
  aria-labelledby={statusId}
>
  <div
    ref={contentRef}
    className={classes.content}
    aria-busy={loading}
    inert={visible ? true : undefined}
  >
    {children}
  </div>

  <div
    id={statusId}
    className={classes.visuallyHidden}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {visible ? resolvedLabel : ''}
  </div>

  {visible && (
    <div className={classes.scrim}>
      {renderLoadingIndicator({
        label: resolvedLabel,
        size: 'large',
        appearance: 'primary',
        labelPosition: 'below',
        className: classes.indicator,
      })}
    </div>
  )}
</div>;
```

- The root is `position: relative`, `isolation: isolate`, `minWidth: 0` and has `tabIndex={-1}`.
  It is named by `aria-labelledby` pointing at the persistent status node, so the programmatic focus
  target has an accessible name instead of announcing as an unnamed group.
- The root does **not** carry `aria-busy`. The content wrapper does, because `aria-busy` tells
  assistive technology to defer changes inside its subtree. The status node is a sibling of that
  wrapper, so its text change is announced while the region is busy (AR-3).
- The content wrapper uses `display: contents` so it introduces no layout box; `inert` on it removes
  the children from the tab order and accessibility tree only while the overlay is visible (AR-4).
  `aria-busy` reflects `loading` from the first render, including the delay window.
- Some browsers remove `display: contents` elements from the accessibility tree, so the busy marker
  is verified manually (M-9). If a supported browser does not expose it, the fallback is a normal
  content wrapper with a recorded layout change (RD-01 §Compatibility's fallback), not runtime
  detection. The status announcement remains outside the wrapper, so it works either way.
- The status node is always mounted and is visually hidden. Its text changes from empty to the label
  when the overlay appears; this is the announcement. The visual indicator is `aria-hidden`; the
  shared renderer owns that wrapper.
- The scrim is absolute `inset: 0`, uses `tokens.colorNeutralBackgroundAlpha2` (white at 80% in the
  light theme, dark gray at 70% in the dark theme), `borderRadius: inherit`,
  `zIndex: 1`, and centers the indicator. It blocks pointer interaction for in-flow content because
  it covers the region.
- **Test lookup:** the scrim is the root's only direct child that is neither the content wrapper nor
  the status node, and it contains the decorative indicator. Tests assert its presence/absence by
  that structure; they do not assert generated Griffel class names (AR-10).
- The scrim and `inert` cover in-flow DOM descendants only. Content that portals (for example a
  Fluent `MenuPopover`), uses `position: fixed`, or establishes a higher stacking context can paint
  and operate above the scrim; the overlay does not install a global blocker (RD-01 Won't Have). The
  limitation is documented in the README and checked manually with an open `Menu` and a sticky
  header.
- There is no portal, no fixed positioning, no global stacking context and no global application
  state. The overlay is bounded by its parent region.

### Delay and Visibility

`useDelayedVisibility(active, delay)`:

| Input                        | Result                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `active=false`               | `false`; any pending timer is cleared.                                                     |
| `active=true`, `delay<=0`    | `true` after the mount/change effect; the first render is `false`.                         |
| `active=true`, `delay>0`     | `true` after `delay` ms.                                                                   |
| `delay` changes while active | Applies to the next activation; the current timer and a visible overlay are not restarted. |
| Unmount                      | Cleanup clears the timer; no state update after unmount.                                   |

`LoadingOverlay` defaults `delay` to `300`; negative, `NaN` and `Infinity` normalize to `0`.
Interaction is not blocked during the delay; applications that must prevent a second submission
disable their own trigger (for example with `useLoading().isLoading`). A live `delay` change never
hides or re-reveals an already visible overlay, which would churn `inert` and focus.

### Focus Algorithm

`useLoadingOverlayFocus` takes the root ref, the content ref, `loading` and `visible`:

1. When `loading` becomes true, capture the element that has focus (`document.activeElement`, call it
   A) if it is an `HTMLElement`. A passive effect is sufficient because the render that first sees
   `loading=true` still has `visible=false`, so the content is not yet inert.
2. When `visible` becomes true:
   - Read the current active element (call it B).
   - If B is inside the content wrapper, remember B and focus the overlay root.
   - Otherwise, if B is `document.body`, use the last element that received focus inside the
     content while the overlay waited (the loading-start element when focus never moved), provided
     it is still connected; remember it and focus the overlay root. This covers browsers that blur
     an inert focused element to `body`, including a focus move the user made during the delay;
     jsdom does not reproduce that blur, so the fallback is tested explicitly.
   - Otherwise, leave focus alone and remember that this component did not move it.
3. When `visible` becomes false:
   - Clear the status text and remove `inert`/`aria-busy` in the render.
   - If this component moved focus, restore the remembered target in this order: the reveal-time
     element B when it is still connected, otherwise the captured element A when it is still
     connected. Restore only while the active element is still the overlay root or `document.body`;
     otherwise do not steal focus. Restoring B first follows the position the user last occupied
     when focus moved inside the content during the delay. This is the plan's interpretation of
     R9's "captured element"; the RD wording is recorded for the next revision.
4. On unmount, clear refs; no focus restoration is attempted because the content unmounts with the
   overlay.

The root is programmatically focusable but has `outline: none` on `:focus`; it is not a tab stop. Its
accessible name comes from the persistent status node. The status announcement provides the context
for keyboard and screen-reader users, and the manual checklist verifies that the name does not
double-announce with the live region. The root remains inside any parent dialog's focus scope because
it is not portaled (AR-6).

### Styles

| Class            | Purpose                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `root`           | `position: relative`, `isolation: isolate`, `minWidth: 0`, `:focus { outline: none }`                                          |
| `content`        | `display: contents`; no box; carries `aria-busy` while `loading` is true and `inert` while visible                             |
| `scrim`          | absolute `inset: 0`, flex center, `backgroundColor: tokens.colorNeutralBackgroundAlpha2`, `zIndex: 1`, `borderRadius: inherit` |
| `indicator`      | the wrapper class passed to `renderLoadingIndicator`; no background, no extra spacing                                          |
| `visuallyHidden` | the shared one-pixel/`clip` screen-reader-only recipe, imported from the `Loading` styles module                               |

No background, border, spacing or animation is added to the root. The scrim color comes from the
theme; dark and custom themes follow automatically. The shared indicator draws its visible label in
`tokens.colorNeutralForeground1`, so the text stays readable on the light veil and on a page
background in both themes; Fluent's static white spinner label would fall below the normal-text
contrast requirement on light content (AR-18). The spinner is the only motion; no fade or scale
transition is added, so reduced-motion behavior is unchanged from Fluent's spinner.

`visuallyHidden` is exported by `Loading/useLoadingStyles.styles.ts`; the overlay imports it and does
not duplicate the recipe. The import is listed in the Phase 2 expected modification set.

### Integration Points

- The overlay composes `renderLoadingIndicator` from the `Loading` folder and imports the
  `visuallyHidden` class from `Loading/useLoadingStyles.styles.ts`; it does not render the `Loading`
  status root because it needs a persistent status node (AR-3, AR-5).
- The `loading` boolean can come from `useLoading().isLoading`, `useTransition`, `useActionState`, a
  store or existing application state. The overlay does not know or care which.
- The `label` can come from `useLoading().label`; when it is undefined, the overlay's default
  resolver applies.
- The overlay is local to its region; it does not portal and does not coordinate with other overlays.
  Portaled or fixed descendants are outside its blocking guarantee (documented limitation).

## Code Examples

### Existing boolean

```tsx
<LoadingOverlay loading={state.fetching} label={t('please_wait')}>
  <DataGrid records={state.records} />
</LoadingOverlay>
```

### Controller hook

```tsx
const { isLoading, label, run } = useLoading({ label: t('please_wait') });

<LoadingOverlay loading={isLoading} label={label}>
  <ActorForm />
</LoadingOverlay>

<Button onClick={() => run(saveActor, { label: t('saving') }).catch(catchError)}>
  {t('save')}
</Button>
```

### Immediate overlay

```tsx
<LoadingOverlay loading={isSaving} delay={0} label={t('saving')}>
  <Form />
</LoadingOverlay>
```

## Error Handling

| Error Case                                     | Handling Strategy                                                                                                                                                                                                              | AR Ref |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| `loading` true, then false before the delay    | Clear the timer and stay idle; no scrim, no inert, no announcement.                                                                                                                                                            | AR-5   |
| `delay` negative, `NaN` or `Infinity`          | Normalize to `0`; the overlay reveals on the next effect.                                                                                                                                                                      | AR-5   |
| `delay` changes while active                   | Apply to the next activation; do not restart an in-flight timer or a visible overlay.                                                                                                                                          | AR-5   |
| `label` blank or whitespace                    | Fall back to `Loading…`; the status never has an empty accessible name.                                                                                                                                                        | AR-7   |
| Focused element unmounts during loading        | Do not restore to a disconnected node; the `isConnected` guard prevents a stale focus.                                                                                                                                         | AR-6   |
| Browser blurs an inert focused element to body | Use the captured element when it was inside and still connected; focus the overlay root.                                                                                                                                       | AR-6   |
| User moves focus outside during the delay      | Do not move focus; the overlay only moves focus when it was inside the covered content.                                                                                                                                        | AR-6   |
| Component unmounts while visible               | Clear timers and refs; no state update or focus restoration after unmount.                                                                                                                                                     | AR-5   |
| `display: contents`/`inert` browser difference | The current Chromium, Firefox and Safari releases support `display: contents`; no runtime fallback is used. A normal wrapper is the RD-01 §Compatibility fallback, applied manually and recorded if a supported browser fails. | AR-4   |
| `aria-busy` not exposed on `display: contents` | Verified manually (M-9). If the browser drops the wrapper from the accessibility tree, use the normal-wrapper fallback and record the layout change.                                                                           | AR-4   |
| Portaled or fixed content above the scrim      | Documented region-scoped limitation; no global blocker. Covered by the manual checklist, not by `inert`.                                                                                                                       | AR-4   |

## Testing Requirements

- Specification tests (`test/loading-overlay.spec.test.tsx`): idle/loading, delay, label resolution,
  `aria-busy` on the content wrapper, inert, status text, scrim presence/absence, focus
  move/outside/restore/fallback, native props/ref and no portal.
- Implementation tests (`test/loading-overlay.impl.test.tsx`): class merge, DOM structure, timer
  cleanup, capture-before-inert ordering with `loading` and `visible`, body-focus fallback,
  ownership-guarded restore and unmount-while-visible teardown.
- Story (`LoadingOverlay.stories.tsx`): async save, fast operation (no flash), app-owned boolean,
  custom label, fixed-height card.
- SSR smoke (`test/loading.ssr.test.tsx`): children and structural root render without browser access;
  the status is empty before hydration.
- Manual story checklist: real-browser inert blur, focus restore, focus target name, pointer
  blocking, idle no-scrim, no focus ring, `aria-busy` exposure, dark theme, forced colors, reduced
  motion, no double announcement, and the portaled `Menu`/sticky-header limitation.
