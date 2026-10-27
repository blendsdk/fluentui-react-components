# Component Specification: CollapsibleSection

> **Document**: 03-01-collapsible-section.md
> **Parent**: [Index](00-index.md)

## Overview

Implement R1–R12 through one component. This specification owns API details, state transitions,
composition, accessibility, styling and failure handling. The confirmed authority is recorded in
AR-4–AR-28; no implementation decision is delegated to CastingAppMT.

## Public Contract

Export only `CollapsibleSection` and `CollapsibleSectionProps` (AR-20). The ref points to the
root `HTMLDivElement`. Owned native names are omitted explicitly (house type convention):

```ts
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/** Props of an independent disclosure card; the application owns its content and persistence. */
export type CollapsibleSectionProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'title' | 'children' | 'dangerouslySetInnerHTML'
> & {
  /** Meaningful, non-interactive content naming the disclosure; not a native tooltip. */
  title: ReactNode;
  /** Body content; local state is reset after Fluent's collapse exit unmounts it. */
  children: ReactNode;
  /** Header controls rendered beside the disclosure, only while expanded. */
  actions?: ReactNode;
  /** Authoritative controlled value; overrides the uncontrolled initial value. */
  collapsed?: boolean;
  /** Uncontrolled initial value, false when omitted; later changes do not reset state. */
  defaultCollapsed?: boolean;
  /** Reports a requested user change once; prop updates and mount do not notify. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Real title heading level, independent from visual size; defaults to 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Accordion header size, not Card size; defaults to large. */
  size?: 'small' | 'medium' | 'large' | 'extra-large';
};
```

Native `title` is replaced by the rich heading contract; do not serialize it into a tooltip.
`dangerouslySetInnerHTML` conflicts with owned structured children and the no-HTML-parsing
contract (AR-15, AR-22). Other native props pass through to the root, including `id`, `aria-*`,
`data-*`, events, `className` and `style`. Caller root roles/labels do not rename or replace the
internal disclosure's title. Caller events keep normal React propagation and cancellation.

No public `appearance`, Card size, keepMounted, loading or disabled contract is added (AR-9,
AR-10). Runtime validation of incorrectly typed heading/size values is not a feature; TypeScript
pins the accepted values. A meaningful title is an application precondition, not a generated
English fallback or runtime warning (AR-24).

### Usage

```tsx
<CollapsibleSection
  title="Personal details"
  headingLevel={2}
  actions={<Button aria-label="Edit personal details">Edit</Button>}
>
  <DescriptionList layout="columns">
    <DescriptionListItem label="Name">Alex Morgan</DescriptionListItem>
  </DescriptionList>
</CollapsibleSection>
```

The example belongs in the package docs/stories with imports from the public entry points.
It is not an instruction to modify an application.

## Architecture and Files

Paths below are relative to `packages/react-components/src/components/CollapsibleSection/`.

| File                                     | Responsibility                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `CollapsibleSection.tsx`                 | `React.forwardRef<HTMLDivElement, CollapsibleSectionProps>` shell; state hook then render; displayName and example JSDoc. |
| `CollapsibleSection.types.ts`            | Documented public props only.                                                                                             |
| `useCollapsibleSection.ts`               | Defaults, state adapter, typed heading mapping, stable IDs, focus ownership and classes.                                  |
| `renderCollapsibleSection.tsx`           | Pure state-to-elements composition; no hooks or side effects.                                                             |
| `useCollapsibleSectionStyles.styles.ts`  | Module-scope Griffel styles, typed class map, token-based layout.                                                         |
| `index.ts`                               | Two exports: component and props type.                                                                                    |
| `stories/CollapsibleSection.stories.tsx` | All variants in a single Storybook file.                                                                                  |

No context is needed. Internal state/style/render types remain private to the package root.
Use top-level imports, public Fluent entry points, no unsafe casts, and durable documentation.
Split the hook only if its actual implementation approaches the repository file-size limit;
do not pre-create a focus subsystem (AR-20, AR-25).

## Composition

Render this structure using public component APIs (AR-4, AR-5, AR-16, AR-27):

```text
Card div (native root props + forwarded ref, filled, small, focusMode=off)
  Accordion (collapsible, controlled openItems, onToggle)
    AccordionItem (one private constant item value)
      div header row
        AccordionHeader as h2…h6
          Fluent native button (id, aria-controls, Fluent aria-expanded)
            Fluent decorative expand icon + caller title
        optional div actions (only when expanded)
      div content host (stable id; persists while collapsed)
        AccordionPanel (role=group, aria-labelledby=disclosure button id)
          div body (caller children)
```

The permanent content host gives `aria-controls` a connected target even after the animated
panel unmounts. It does not preserve body children or disable motion. It is not an added landmark
or a focus target. The mounted panel uses public `role="group"` and `aria-labelledby` props
to expose a named, non-landmark group. Keep the persistent host generic and unlabeled; it must
not leave an empty named group after the panel unmounts.
The root `id` supplied by the application is independent from the private IDs.

Do not conditionally remove `AccordionPanel` on collapse: that would bypass Fluent's exit
animation. Do not implement a second button, expand icon, key handler or click toggle on the
Card/header row. The header button toggles; actions do not toggle (AR-4, AR-8, AR-17).

Spread native root props before owned Fluent props and merged class/ref assignment. Explicit
`focusMode="off"` is required even if root native handlers make Card interactive internally.
Preserve supplied `tabIndex` on the root if present; the component itself adds no root tab stop.

## State Transitions

AR-11, AR-12 and AR-24 govern this adapter:

| Situation                         | Resolution                                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First render                      | Initialize internal boolean once from `defaultCollapsed ?? false`.                                                                                                 |
| Each render                       | Visible collapsed value is `collapsed ?? internalCollapsed`; controlled false is authoritative.                                                                    |
| Accordion state                   | Expanded maps to `[ITEM_VALUE]`; collapsed maps to `[]`. Values use one private constant, not random IDs.                                                          |
| User toggle                       | Read the requested membership of `ITEM_VALUE` in Fluent's `data.openItems`, invert to collapsed, update the internal mirror, then call the optional callback once. |
| Controlled parent does not update | Rendered state remains controlled; notifications are requests, not a second source of truth.                                                                       |
| No callback                       | Uncontrolled use still changes; controlled use remains fixed by the supplied prop.                                                                                 |
| Mount or prop rerender            | Never notify the callback. Changing defaultCollapsed after mount does not reset the internal value.                                                                |
| Nested instance                   | Its own Accordion owns its request; it must not toggle the outer disclosure or notify its callback.                                                                |

This does not promise controlled/uncontrolled mode switching during one mounted lifetime. The
internal mirror follows the house pattern; do not add synchronization effects that copy every
controlled prop into state or trigger notifications during rendering.

Use Fluent's exported typed toggle callback, a typed heading lookup and React state/refs.
Do not infer the next value by toggling a possibly stale captured boolean.

## Accessibility and Focus

### Primitive responsibilities

Fluent owns the native button type, `aria-expanded`, chevron, focus-visible outline, Enter/Space
activation, panel inert state and motion. Use real `h2`–`h6` roots on `AccordionHeader`; size is
not heading level. No deprecated Accordion arrow-navigation API is enabled (AR-4, AR-14, AR-17).

### Local association

Generate stable, distinct disclosure/content IDs with React `useId` in the hook. Return them as
state; pass the button ID and `aria-controls` via `AccordionHeader.button`, and the label ID via
the public `AccordionPanel` props together with `role="group"`. A plain generic `div` cannot
be named with `aria-labelledby`; the group role permits the intended panel name without adding
a landmark. Root native identifiers cannot overwrite these internal targets. Multiple and
nested instances must remain isolated (AR-27).

### Conditional focus recovery

Implement only the accepted local repair (AR-28):

- Refs and focus-capture bookkeeping distinguish this instance's actions/body from the header,
  external controls and nested disclosures. Preserve caller native focus handlers.
- On an expanded-to-collapsed committed transition, if actual focus was in body/actions that
  are becoming inert or being removed, focus this instance's disclosure button.
- Account for actions being removed in the same commit: retained ownership evidence may be
  needed after the active element falls back to the document. A stale captured descendant alone
  never authorizes stealing focus from another connected focused control.
- Do not move focus on mount, expansion, an unrelated rerender, another section's toggle, or
  collapse while focus is already outside this instance. Unmounting the whole component does
  not focus a removed/disconnected disclosure.
- Collapse through the header naturally leaves focus there. Do not force another focus move
  when it is already the active element.

Use a guarded local layout effect/ref lifecycle where needed for DOM synchronization; document
why the effect exists. Browser globals are read only in handlers/effects, never at module scope
or during render. No document-wide listener, focus registry, public focus option or global
helper is needed. Tests assert the outcome, not a particular effect implementation.

### Action and content lifecycle

Actions are immediately absent from the rendered header once effective collapsed becomes true;
the body follows Fluent's exit completion. No hidden action tab stops remain. All body state is
lost once unmounted; reopening mounts fresh children. Content may contain fields, grids or nested
sections, but its data fetching and durable state remain application-owned (AR-8, AR-9, AR-24).

## Styling

Use module-scope `makeStyles` and tokens; class names merge with caller classes. Card already
provides the accepted surface, radius, shadow, gap and padding: do not add another surface or
copy literal v8 dimensions (AR-5, AR-7, AR-10).

| Part            | Rule                                                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Root            | Minimal sizing/layout only; preserve caller class/style, allow narrow container shrinking.                                                     |
| Header row      | Flex layout with title area able to shrink; keep actions independent and permit action wrapping rather than clipping the title.                |
| AccordionHeader | Flexing title area, `minWidth: 0`; heading element has no extra browser default margins.                                                       |
| Button slot     | Semibold token under a guarded own-slot selector so it beats Fluent's regular-weight rule; preserve Fluent focus and ordinary chevron styling. |
| Title           | Normal text wrapping, with overflow wrapping for long unbroken labels; no forced one-line truncation or fixed width.                           |
| Actions         | Token gap; ordinary caller buttons, not a newly invented toolbar keyboard model.                                                               |
| Body            | Token spacing only where Card/Accordion leave a real gap; avoid duplicate horizontal padding.                                                  |

Use logical/direction-neutral properties. Render the Fluent chevron at its default start
position. In ordinary motion mode, preserve Fluent's default chevron transition and panel
animation. Do not add timers, hard-coded durations, custom animations or a motion engine.

Under `prefers-reduced-motion: reduce`, use a component-local Griffel media rule to suppress
only the default chevron SVG's transition. Scope it through an own class on the public
`AccordionHeader.expandIcon` slot to that slot's direct SVG child; never target arbitrary SVGs
inside caller title, actions or body content. The installed transition is inline on the SVG,
so changing only its wrapper is insufficient: a narrowly scoped `transition: none !important`
override is permitted for this preference-only correction. Preserve the icon's final rotation
and let Fluent's panel motion keep its own reduced-motion handling. Add no global stylesheet,
custom icon or public motion prop. Verify actual ordinary/reduced-motion outcomes manually;
a Storybook build alone is not evidence.

## Error Handling and Security

| Situation                                          | Treatment                                                                                                                     | Authority    |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Missing/blank title at runtime                     | Caller contract violation; no invented label, warning system or new fallback API. Document the meaningful-title precondition. | AR-15, AR-24 |
| `null`/`undefined` actions                         | Omit action wrapper. A caller's opaque component/fragment may itself render nothing; do not inspect arbitrary React trees.    | AR-24        |
| Markup-looking strings                             | Render as React text in title/actions/body; never parse HTML.                                                                 | AR-22        |
| Caller React elements                              | Caller owns their trust and behavior; the component is not a sanitizer of arbitrary React code.                               | AR-22        |
| Caller callback throws                             | Normal React/event error propagation; no swallowing, logging or retry layer.                                                  | AR-11, AR-22 |
| External collapse while another control is focused | No focus move; parent remains state authority.                                                                                | AR-12, AR-28 |

No auth, network, file, URL, persistence or secret-handling surface is added. Do not introduce
server/security machinery for nonexistent inputs.

## Tests and Documentation

The [ST table](07-testing-strategy.md#specification-test-cases) owns expected observations.
The [execution checklist](99-execution-plan.md) owns test-first order and verification tasks.
Do not put ST/AR/RD identifiers or planning paths into shipped code or test comments.

JSDoc must cover all props, state/class fields, non-trivial functions and focus rationale. README
gets one section with the exact props, uncontrolled and controlled examples, DescriptionList
composition, localization, action naming, title constraints and lifecycle warning (AR-26).
Storybook uses `Components/CollapsibleSection` and the existing provider/decorators, showing
default, initially collapsed, controlled/external controls, actions, all four sizes, heading
levels/nesting and rich/long content. Include a stateful body demonstrating reset on reopen.
