# Tile Shell: TileGrid RD-04

> **Document**: 03-02-tile-shell.md
> **Parent**: [Index](00-index.md)

## Overview

`TileGridItem` is the optional house tile shell. It renders media, title, description, badges,
inline and overflow actions, a visual selection indicator, a status overlay, and the drag handle
inside the positioned tile wrapper owned by TileGrid. `renderItem` remains the escape hatch for
custom content.

The shell is presentation-only. It receives `item` so action callbacks and `isDisabled` can use the
original value; it never selects, activates, drags, or reorders on its own.

## Architecture

### Proposed Files

```text
src/components/TileGridItem/
├── TileGridItem.tsx                 callable generic wrapper and forwardRef
├── TileGridItem.types.ts            TileGridItemProps<T>
├── useTileGridItem.ts               resolved state, strings, actions, classes
├── renderTileGridItem.tsx           pure render function
├── useTileGridItemStyles.styles.ts  Griffel styles and tokens
├── index.ts                         barrel
└── stories/TileGridItem.stories.tsx every slot and state
```

Public shared types live in `src/components/TileGrid/TileGrid.types.ts`:
`TileGridAction<T>`, `TileGridDragHandleProps`, and `TileGridStrings`. The shell imports them; the
grid never imports the shell. This keeps the dependency one-way and avoids a cycle.

### Public Props

```ts
export interface TileGridItemProps<T> extends Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'children' | 'aria-disabled'
> {
  /** Original item passed to action callbacks and predicates. */
  item: T;
  /** Media node, typically an `<img>` or Fluent `Image`. */
  media?: React.ReactNode;
  /** Primary text. */
  title?: React.ReactNode;
  /** Secondary text. */
  description?: React.ReactNode;
  /** Badge row. */
  badges?: React.ReactNode;
  /** Actions shown inline and duplicated in the overflow menu. */
  actions?: readonly TileGridAction<T>[];
  /** Menu-only actions. */
  overflowActions?: readonly TileGridAction<T>[];
  /** Replaces the default visual selection indicator. */
  selectionIndicator?: React.ReactNode;
  /** Overlay above media. */
  statusOverlay?: React.ReactNode;
  /** Replaces the default drag handle. */
  dragHandle?: (props: TileGridDragHandleProps) => React.ReactNode;
  /** Library-owned handle wiring; absent when arranging is unavailable. */
  dragHandleProps?: TileGridDragHandleProps;
  /** Move up / Move down actions supplied by the grid. */
  reorderActions?: readonly TileGridAction<T>[];
  /** Localized strings; partial over English defaults. */
  strings?: Partial<TileGridStrings>;
  /** Visual selection state. */
  selected?: boolean;
  /** Hides the visual selection affordance when false. */
  selectable?: boolean;
  /** Disables activation, actions, drag, and marquee for the tile. */
  disabled?: boolean;
  /** Reduced source state during a drag. */
  isDragging?: boolean;
  /** Portal overlay copy; suppresses actions and the handle. */
  isOverlay?: boolean;
  /** Media fit; defaults to cover. */
  fit?: 'cover' | 'contain';
  /** Media aspect ratio; invalid values fall back to 1. */
  aspectRatio?: number;
}
```

## Implementation Details

### State Hook

`useTileGridItem` returns a render-ready object:

| Field           | Meaning                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `rootProps`     | Native `div` props minus `children` and `aria-disabled`                                                   |
| `classes`       | Griffel classes for the root and slots                                                                    |
| `strings`       | Merged strings (`dragHandleLabel`, `moveUp`, `moveDown`, `reorderPosition`, `moreActions`, existing keys) |
| `inlineActions` | `actions`, or empty when disabled or `isOverlay`                                                          |
| `menuActions`   | `actions`, then `overflowActions`, then `reorderActions`; empty when disabled or `isOverlay`              |
| `showMenu`      | `menuActions.length > 0`                                                                                  |
| `showHandle`    | `dragHandleProps` is present and the tile is neither disabled nor an overlay                              |
| `showSelection` | `selected && selectable`                                                                                  |
| `aspectRatio`   | Finite positive number or `1`                                                                             |
| `fit`           | `cover` or `contain`                                                                                      |

A blank action label is rendered as the action `id`. Duplicate action ids are allowed; keys include
the list position. The shell never mutates the supplied action objects.

### Render Structure

```text
<div data-tile-grid-item-shell aria-disabled>
  <div media>
    {media}
    {statusOverlay}
    {selectionIndicator}
  </div>
  <div content>
    {title}
    {description}
    {badges}
  </div>
  <div actions>
    <div inline>{actions}</div>
    <Menu trigger>{menuActions}</Menu>
  </div>
  {dragHandle}
</div>
```

The root is a flex column that fills the tile, clips overflow, and merges caller `className` and
`style` last. Native `div` props pass through. `aria-disabled` is written from `disabled` and cannot
be overridden through props.

### Media

- The media container is `position: relative`, `width: 100%`, and uses the resolved `aspectRatio`.
- `fit` applies `object-fit` to descendant `img` and `video` elements. The application still owns
  `src`, `srcSet`, `sizes`, `loading`, `decoding`, `fetchPriority`, `alt`, and URL validation.
- The shell never fetches, parses, or logs a URL and never renders HTML.
- Invalid `aspectRatio` values (zero, negative, `NaN`, infinite) fall back to `1`.
- The media background uses `colorNeutralBackground3` so a missing image has a stable surface.

### Selection Indicator

- Default: a small circular badge at the bottom-right with `CheckmarkCircleFilled` and
  `colorBrandForeground1` on `colorNeutralBackground1`.
- Rendered only when `selected && selectable`.
- A supplied `selectionIndicator` replaces the default node and follows the same
  `selected && selectable` gate.
- The accessible selection control remains owned by TileGrid; the shell badge is visual only.

### Status Overlay

- Positioned over the media container, `pointer-events: none`, `aria-hidden` is not set because the
  application may provide meaningful content.
- Interactive descendants (`button`, `a`, `input`, `select`, `textarea`, `[role="button"]`,
  `[role="menuitem"]`) re-enable pointer events.
- It renders above media and the selection badge, and below the inline action layer, menu trigger,
  and drag handle.
- In forced-colors mode it keeps a visible border using `Highlight`.

### Actions

Inline actions render at the top-right, in a row beside the menu trigger:

- If an action has an `icon`, the button is icon-only with `aria-label` set to the resolved label.
- If no icon exists, the button renders the label as text.
- The inline row is visible on root `:hover` and `:focus-within`, and hidden under
  `@media (hover: none)`. Hidden actions are not focusable until the row is revealed; the overflow
  menu always contains the same actions, so touch users never lose access.
- The menu trigger is always visible when `showMenu` is true, regardless of hover.
- `intent: 'danger'` uses `colorPaletteRedForeground1` for inline and menu entries.
- `isDisabled(item)` disables the individual action. A disabled tile disables all actions.
- Each callback runs once per activation. Action clicks never select, activate, or drag the tile.
- Every inline action button and the menu trigger uses `type="button"` so a surrounding form is
  never submitted.

### Overflow Menu

- Fluent `Menu`, `MenuTrigger`, `MenuPopover`, `MenuList`, and `MenuItem`.
- The trigger is a transparent icon button using `MoreHorizontalRegular`, named by
  `strings.moreActions` (default "More actions").
- Menu order is `actions`, then `overflowActions`, then `reorderActions`.
- Menu items show the icon when supplied and always show the resolved text label.
- Focus returns to the trigger when the menu closes; the menu renders in a portal and never reaches
  TileGrid's delegated tile handlers.
- A menu action callback runs once; it does not change selection or start a drag.

### Drag Handle

- The default handle is a transparent icon button using `ReorderRegular`, named by
  `dragHandleProps.label`, with `type="button"` so a surrounding form is never submitted. It is
  pointer-only (`tabIndex={-1}`), because keyboard reorder lives in the action menu, and carries
  `data-tile-grid-drag-handle` for test and styling hooks.
- It applies `dragHandleProps.setNodeRef`, `listeners`, and filtered `attributes`. The shell removes
  dnd-kit's screen-reader keyboard-drag instructions and its tab stop because keyboard reorder uses
  the menu; the label and disabled state remain. A custom `dragHandle` render prop decides its own
  focus policy.
- A supplied `dragHandle` render prop replaces the button and receives the same props. When
  `dragHandleProps` is absent, no handle renders even if a render prop is supplied.
- The handle is absent when the tile is disabled or rendered as the overlay.

### Visual States

| State                | Effect                                                                               |
| -------------------- | ------------------------------------------------------------------------------------ |
| `selected`           | Shows the default selection badge                                                    |
| `selectable={false}` | Hides the selection badge                                                            |
| `disabled`           | `aria-disabled="true"`; actions and handle removed; content stays readable           |
| `isDragging`         | Source tile opacity `0.5`                                                            |
| `isOverlay`          | Fills the overlay, adds `shadow16`, hides actions and handle, ignores pointer events |

## Error Handling

| Error Case                                      | Handling Strategy                                  | AR Ref |
| ----------------------------------------------- | -------------------------------------------------- | ------ |
| Blank action label                              | Render the action `id`                             | AR-24  |
| Duplicate action ids                            | Render all entries; keys include position          | AR-24  |
| Action callback throws                          | Propagate to the application; tile state unchanged | AR-24  |
| Invalid `aspectRatio`                           | Fall back to `1`                                   | AR-21  |
| `dragHandle` supplied without `dragHandleProps` | Render no handle                                   | AR-26  |
| Empty `moreActions` string                      | Fall back to "More actions"                        | AR-14  |
| Empty drag-handle label                         | Fall back to `Reorder <item label>`                | AR-14  |
| `isOverlay` copy                                | Suppress actions, menu, and handle                 | AR-26  |

## Accessibility

- Every action button and menu item has an accessible name from the resolved label.
- The menu trigger has `aria-label` from `strings.moreActions`.
- The drag handle has an accessible name containing the item label.
- The shell root is not another list item; TileGrid's wrapper owns `role="listitem"`,
  `aria-setsize`, `aria-posinset`, and the item label.
- The shell adds no live region; reorder and selection announcements stay in TileGrid.
- Focus order follows the native DOM: the grid's selection control, then any focusable media or
  content supplied by the application, then the shell's inline actions, menu trigger, and drag
  handle in that order. The wrapper's Tab/Escape handling stays in TileGrid.

## Testing Requirements

[07-testing-strategy.md](07-testing-strategy.md) owns the specification cases. The shell needs
jsdom coverage for every slot, action path, disabled state, fallback, and accessible name, plus an
SSR smoke and browser coverage for touch reachability and action isolation.
