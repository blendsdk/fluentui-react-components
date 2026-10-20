# RD-04: Arranging, Tile Shell, and Actions

> **Document**: RD-04-arranging-tile-shell-and-actions.md
> **Status**: Preflighted — accepted fixes applied
> **Created**: 2026-10-20
> **Project**: fluentui-react-components
> **Depends On**: RD-02, RD-03
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

This RD adds the optional arranging layer and the presentation layer that applications compose
inside `TileGrid`:

- optional single-item drag reordering with a handle, auto-scroll, a drop indicator, and a keyboard
  alternative;
- an optional `TileGridItem` shell with media, title, description, badges, actions, overflow
  actions, selection indicator, status overlay, and drag handle slots;
- the 20K photo-library recipe that proves filtering, seeded selection, zoom, actions, and arranging
  together.

Drag and the tile shell are opt-in. A grid with `reorderable={false}` renders no handles, drag
listeners, or keyboard reorder actions. The tile shell is a convenience; `renderItem` remains the
escape hatch for completely custom tile content.

The library does not hardcode CastingAppMT actions, does not open a lightbox, and does not fetch or
authenticate images. Those remain application concerns.

---

## Functional Requirements

### Must Have (M)

**Optional drag arranging**

- [ ] **Opt-in.** `reorderable` defaults to `false`. When false, no drag handle, listeners, drag
      overlay, keyboard reorder actions, or reorder announcements render.
- [ ] **Application disable.** `reorderDisabled` defaults to `false`. When true, drag handles,
      listeners, and the keyboard reorder actions are removed or disabled even if `reorderable` is
      true. The application sets it while a filter is active or while another constraint prevents
      arranging.
- [ ] **Single item.** Dragging moves exactly one item. Multi-item drag is out of scope.
- [ ] **Handle start.** Dragging starts from the dedicated drag handle. The library renders a real
      button by default; an application may replace it with the `dragHandle` render prop. The grid
      computes the accessible name from `strings.dragHandleLabel(itemLabel)`, defaulting to
      `"Reorder <item label>"`, and passes it as `dragHandleProps.label`. The render prop receives
      the library-owned drag listeners and state and never receives raw dnd-kit types.
- [ ] **All layouts.** Drag reorder works in fixed, masonry, justified, and mosaic layouts when
      enabled. The item order is linear; the layout recomputes after the drop.
- [ ] **Drag overlay.** The dragged tile is rendered in a portal overlay above the grid. The source
      tile remains in place with a visually reduced state until the drop.
- [ ] **No live reflow.** The grid does not recompute the full layout on every pointer move. It
      shows an insertion indicator and commits the new order on drop.
- [ ] **Drop indicator.** The insertion indicator is visible between tiles or at the end of the
      collection and follows the pointer.
- [ ] **Auto-scroll.** Dragging within 24px of the scroll container's edges auto-scrolls using
      `requestAnimationFrame`; auto-scroll stops at drop or cancel.
- [ ] **Drop callback.** `onReorder(args: TileGridReorderArgs)` fires once on drop when the index
      changed. `args` is `{ itemId, fromIndex, toIndex, orderedIds }`; `orderedIds` is the new ID
      order for the current `items` array.
- [ ] **No selection change.** Dragging does not select, deselect, or alter the selection set.
- [ ] **Drag cancel.** Escape or `pointercancel` cancels the drag, restores the original order, and
      fires no `onReorder`. A normal `pointerup` releases capture after commit; a later
      `lostpointercapture` must not cancel a committed drag.
- [ ] **Keyboard reorder.** Keyboard users reorder through `strings.moveUp` ("Move up") and
      `strings.moveDown` ("Move down") actions in the tile overflow menu. Each action moves the item
      one position, clamps at the collection ends, reports the same `onReorder` payload, and is
      absent or disabled when `reorderDisabled` is true. No hidden keyboard-only mode is used.
- [ ] **Announcement.** After a successful drop or keyboard move, a polite live region announces
      the item's new position through `strings.reorderPosition(position, totalCount)`, defaulting to
      `"Moved to position 4 of 20"`.
- [ ] **Action isolation.** Pointer-down on an action button, selection control, link, input, or
      menu does not start a drag.

**Tile shell**

- [ ] **Optional shell.** `TileGridItem` is exported for applications that want the house tile
      anatomy. `renderItem` remains available for custom content.
- [ ] **Slots and item binding.** `TileGridItem<T>` supports `item: T`, `media`, `title`,
      `description`, `badges`, `actions`, `overflowActions`, `selectionIndicator`, `statusOverlay`,
      `dragHandle`, `dragHandleProps`, `reorderActions`, `strings`, `isDragging`, and `isOverlay`.
      `item` is the value passed to `onSelect(item)` and `isDisabled(item)`. `dragHandle` is a render
      prop; it is not an arbitrary pre-wired node. The shell renders the default handle from
      `dragHandleProps` and merges `reorderActions` into its overflow menu. The application forwards
      the shell-relevant render args (`item`, `selected`, `selectable`, `disabled`, `isDragging`,
      `isOverlay`, `dragHandleProps`, `reorderActions`, `strings`) and uses `index`, `tileSize`,
      `width`, and `height` for its own content.
- [ ] **State props.** `selected` drives the visual selection indicator; the grid owns the
      accessible selected state on the selection control. `selectable` hides the shell's visual
      selection affordance when false; the grid owns the accessible control and uses `isSelectable`
      to decide whether it renders.
      `disabled` sets `aria-disabled="true"` and suppresses activation, actions, drag, and marquee
      for the tile; the grid decides whether the tile remains focusable. `isDragging` applies the
      source tile's reduced state; `isOverlay` suppresses actions and the drag handle in the portal
      copy. `fit` (`'cover'` or `'contain'`, default `'cover'`) controls how media fills its
      container. `aspectRatio` is a finite positive number for the media container; invalid values
      fall back to `1`.
- [ ] **Media.** The shell renders media inside a fixed-aspect container. The application supplies
      an `<img>` or Fluent `Image`; the shell does not use CSS background images and does not
      validate image URLs or attributes. The application owns `alt`, `srcSet`/`sizes`, `loading`,
      `decoding`, `fetchPriority`, and URL protocol allowlisting.
- [ ] **Actions.** `actions` render inline on hover/focus; `overflowActions` render in the menu.
      When inline actions are hidden (for example on touch), the shell also includes the `actions`
      entries in the overflow menu, so no action becomes unreachable. Menu-only additions belong in
      `overflowActions`.
- [ ] **Action model.** `TileGridAction<T>` has a stable `id`, visible `label`, optional `icon`,
      optional `intent`, `onSelect(item)`, and optional `isDisabled(item)`. A blank label falls back
      to the action `id`, so an action never renders unnamed.
- [ ] **Action isolation.** Action activation never selects, activates, or drags the tile. The
      action callback runs once.
- [ ] **Accessible names.** Every action button and menu item has an accessible name. Icon-only
      actions use their `label`.
- [ ] **Status overlay.** The overlay renders above media but below menus and the drag handle, and
      does not intercept pointer events except on its own controls.
- [ ] **Selection indicator.** The shell renders a visual indicator from `selected`; the accessible
      selection control is owned by `TileGrid` per RD-03.
- [ ] **No hardcoded domain actions.** The package does not include actor-specific actions such as
      “Set primary” or “Delete”. The application supplies them.

**Integration recipe**

- [ ] **20K photo-library story.** A Storybook story composes `TileGrid` with a v9 `Toolbar`,
      `SearchBox`, `Dropdown`, `TagGroup`, controlled zoom controls, selected count, clear-selection
      action, and a filter that changes the `items` array and `scrollResetKey`. It uses the shared
      20K benchmark fixture so the story, browser tests, and performance job measure the same data.
- [ ] **Image rendering.** The story uses real `<img>` elements with `loading="lazy"`,
      `decoding="async"`, `srcSet`/`sizes` when available, explicit aspect ratios, and an
      application-owned URL allowlist.
- [ ] **Lightbox boundary.** The story opens an application-owned preview (a Fluent `Dialog` with an
      image is sufficient) from `onItemActivate`; the library does not include a lightbox.
- [ ] **Filtering and arranging.** The story sets `reorderDisabled` while a filter is active and
      enables arranging when the filter is cleared; the keyboard reorder actions are also disabled.
- [ ] **Browser verification.** `test/browser/**/*.browser.test.tsx` runs through `pnpm test:browser`
      and covers drag, keyboard reorder, marquee, zoom anchoring, the per-layout mounted-tile count,
      and initial image requests. The browser matrix is Chromium, Firefox, and WebKit (WebKit is the
      Safari proxy; Edge is covered by Chromium).
- [ ] **Storybook and documentation.** `TileGridItem.stories.tsx` shows every slot and the selected,
      disabled, and non-selectable states; the README documents the action model, drag rules,
      keyboard reorder, strings/localization, and the photo-library recipe.
- [ ] **Package surface.** The package root also exports `TileGridItem`, `TileGridItemProps`,
      `TileGridAction`, `TileGridReorderArgs`, and `TileGridDragHandleProps`; the export pin test is
      updated.

### Should Have

- [ ] A drag story that shows auto-scroll and the drop indicator in all four layouts.

### Won't Have (Out of Scope)

- Multi-item drag.
- Cross-grid or cross-group drag.
- Drag while a filter is active.
- Built-in lightbox, upload, image editing, or crop.
- Hardcoded CastingAppMT actions.
- Touch long-press drag.
- RTL mirroring.
- Server persistence of order.

---

## Technical Requirements

### Drag layer

- Use `@dnd-kit/core` 6.3.x as a direct dependency, externalized in the Vite build and declared in
  `dependencies` with the lockfile and README install notes updated. Do not use
  `@dnd-kit/sortable`; its strategies do not fit a virtualized grid.
- Use a custom model-based collision function:
  1. convert the pointer position to layout coordinates;
  2. find the nearest item rectangle;
  3. choose the insertion index before or after that item using the layout's reading order:
     horizontally within a row for fixed, justified, and mosaic, and vertically within a lane for
     masonry;
  4. clamp to the collection bounds.
- The library owns the drag handle wiring. `TileGridDragHandleProps` carries the in-house
  `setNodeRef`, `attributes`, `listeners`, `isDragging`, `disabled`, and `label` values; the shell
  renders a default button and an application may replace it through the `dragHandle` render prop.
  Raw dnd-kit types never appear in the public API.
- The drag overlay renders a presentational copy of the tile through the same `renderItem` content
  with `isOverlay: true` and `isDragging: true`, without mounting a second draggable. Applications
  use those flags to hide actions and handles in the overlay.
- Auto-scroll uses the grid's scroll container and `requestAnimationFrame`; it never calls
  `getBoundingClientRect()` per item.
- The keyboard path uses `strings.moveUp` and `strings.moveDown` actions in the overflow menu rather
  than a hidden keyboard-only mode. Each action moves one position, clamps at the ends, respects
  `reorderDisabled`, and calls the same reorder handler.
- The drag layer is not mounted and the keyboard reorder actions are absent or disabled when
  `reorderable` is false or `reorderDisabled` is true.

### Tile shell

```ts
interface TileGridAction<T> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  intent?: 'default' | 'danger';
  onSelect: (item: T) => void;
  isDisabled?: (item: T) => boolean;
}

interface TileGridDragHandleProps {
  setNodeRef: (node: HTMLElement | null) => void;
  attributes: Record<string, string | number | boolean | undefined>;
  listeners: Record<string, (event: React.SyntheticEvent) => void>;
  isDragging: boolean;
  disabled: boolean;
  label: string;
}

interface TileGridItemProps<T>
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children' | 'aria-disabled'> {
  item: T;
  media?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: readonly TileGridAction<T>[];
  overflowActions?: readonly TileGridAction<T>[];
  selectionIndicator?: React.ReactNode;
  statusOverlay?: React.ReactNode;
  dragHandle?: (props: TileGridDragHandleProps) => React.ReactNode;
  dragHandleProps?: TileGridDragHandleProps;
  reorderActions?: readonly TileGridAction<T>[];
  strings?: Partial<TileGridStrings>;
  selected?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
  fit?: 'cover' | 'contain';
  aspectRatio?: number;
}
```

The shell follows the house component pattern: typed props, state hook, render function, Griffel
styles with tokens, merged classes, forwarded ref, and JSDoc. The exact file names are decided during
planning. Native `div` props pass through except `children`, which is replaced by the slots and
`renderItem`; `className` and `style` merge with the shell's own values (the caller wins). `strings`
merges over English defaults, and `reorderActions` are appended to `overflowActions` after the
application's menu-only entries. `dragHandleProps` is absent when reorder is disabled; the shell
renders no handle in that case, even when a `dragHandle` render prop is supplied.

### Image guidance

- The application supplies media; the library never fetches images and never receives a URL.
- The application validates image URL protocols against its allowlist and owns authenticated image
  access. The shell cannot inspect or validate an arbitrary `ReactNode`.
- The recommended image is `<img>` or Fluent `Image` with `loading="lazy"`, `decoding="async"`,
  `srcSet`/`sizes` when multiple sizes exist, and `alt` text.
- Use `object-fit: cover` for fixed tiles and `contain` when the full image must remain visible.
- Use an explicit aspect ratio and a muted placeholder or `Skeleton` to prevent layout shift.
- Use `fetchPriority="high"` only for the first visible rows.
- Provide an error fallback; do not retry aggressively.

### Recipe and browser tests

- The 20K story uses the shared generated fixture (aspect ratios 0.8–2.0, a small set of thumbnail
  URLs) and must not snapshot the DOM. The same fixture feeds the browser tests and the performance
  job.
- Browser tests use Vitest browser mode with `@vitest/browser-playwright` and a Playwright install.
  They live in `test/browser/**/*.browser.test.tsx`, run through `pnpm test:browser`, and use
  Chromium, Firefox, and WebKit projects.
- Test cases:
  - drag one item from index 5 to index 2 and assert the callback payload;
  - drag with Escape and assert no callback and unchanged order;
  - a normal `pointerup` followed by `lostpointercapture` keeps the committed order;
  - keyboard Move up/Move down through the overflow menu, assert the exact new position and the
    announcement;
  - keyboard reorder actions are absent or disabled when `reorderDisabled=true`;
  - marquee selection and commit;
  - zoom anchor preservation;
  - per-layout mounted tile count under 120 on the shared fixture;
  - initial image request count bounded by visible plus overscan;
  - action click does not change selection;
  - drag handle absent when `reorderable=false` or `reorderDisabled=true`;
  - inline actions hidden on touch remain reachable through the overflow menu.

### Security

- **Data sensitivity:** actions may expose PII or destructive operations. The application owns the
  authorization and confirmation rules (AR #18).
- **Input validation:** action ids, labels, and item ids are application-supplied; the shell renders
  them as React text and never as HTML. A blank action label falls back to the action `id`.
- **Injection:** no `innerHTML`, `eval`, or `dangerouslySetInnerHTML`; media nodes are React nodes.
- **Authentication/authorization:** N/A in the library; the application supplies only authorized
  media, validates URL protocols against its allowlist, and supplies authorized actions. The
  component accepts no URLs and never fetches images.
- **Encryption/rate limiting/infrastructure:** N/A for this client-side module.
- **Security tests:** action labels with hostile-looking text render as text; action callbacks fire
  once; drag cannot be started from an action control; the component never fetches or logs an image
  URL.

---

## Integration Points

### With RD-02 (Layout and virtualization)

- Drag uses the geometry port's item rectangles and insertion index.
- The application uses `tileSize`, width, and height from `renderItem` to size its own media; the
  shell consumes `isDragging`, `isOverlay`, `dragHandleProps`, `reorderActions`, and `strings`.
- Auto-scroll uses the grid's scroll container.

### With RD-03 (Selection integration, focus, accessibility)

- Drag never changes selection.
- Action and selection controls are independent.
- The keyboard reorder action participates in the tile action menu and focus model and is disabled
  by `reorderDisabled`.
- The reorder and selection announcements use the same polite live region and the same
  `TileGridStrings` object.

### With the application

- The application owns filter state, actions, image URLs, URL protocol validation, image
  attributes, lightbox, and order persistence.
- The application sets `reorderDisabled` while a filter is active and changes `scrollResetKey` when
  the filter changes.

---

## Scope Decisions

| Decision         | Options Considered                 | Chosen                                             | Rationale                                                      | AR Ref |
| ---------------- | ---------------------------------- | -------------------------------------------------- | -------------------------------------------------------------- | ------ |
| Drag surface     | Whole tile vs handle               | Handle                                             | Avoids conflict with selection, activation, and actions        | AR #7  |
| Drag count       | Single vs multi                    | Single                                             | User confirmed one item at a time                              | AR #7  |
| Filtered drag    | Enable with mapping vs disable     | Disable with `reorderDisabled`                     | Avoids ambiguous order semantics                               | AR #7  |
| Layout reflow    | Live reflow vs commit on drop      | Commit on drop                                     | Performance and stable geometry                                | AR #7  |
| Drag dependency  | `@dnd-kit/core` vs custom          | `@dnd-kit/core`                                    | Sensors, overlay, auto-scroll, keyboard and a11y are real work | AR #11 |
| Tile shell       | Generic only vs shell + renderItem | Shell + renderItem                                 | Supports consistent casting tiles and custom content           | AR #9  |
| Actions          | Hardcoded vs app-supplied          | App-supplied                                       | Keeps CastingAppMT business rules out of the package           | AR #9  |
| Drag handle      | App node vs library wiring         | Library-owned listeners; optional render prop      | Keeps dnd-kit private and the handle accessible                | PF-006 |
| Keyboard reorder | Hidden mode vs menu actions        | Move up / Move down menu actions                   | Smallest testable keyboard path; respects `reorderDisabled`    | PF-006 |
| Touch actions    | Inline-only vs overflow fallback   | Inline actions also appear in the menu when hidden | No action becomes unreachable on touch                         | PF-003 |
| Tile content     | `children` vs slots + `renderItem` | Slots + `renderItem`                               | One content model; no undefined second channel                 | PF-003 |
| Action binding   | Closure vs `item` prop             | `item: T` on the shell                             | Makes `onSelect(item)`/`isDisabled(item)` callable             | PF-003 |
| Lightbox         | Built-in vs app-owned              | App-owned                                          | Preview UX is application-specific                             | AR #9  |

---

## Acceptance Criteria

1. [ ] With `reorderable={false}`, no drag handle, drag listener, overlay, reorder announcement, or keyboard reorder action renders.
2. [ ] With `reorderable={true}` and `reorderDisabled={true}`, no drag handle or listener renders and the keyboard reorder actions are absent or disabled.
3. [ ] Dragging one item from index 5 to index 2 calls `onReorder` once with `{ itemId, fromIndex: 5, toIndex: 2, orderedIds }` and does not change the selection set.
4. [ ] Escape during a drag cancels the drag, leaves the order unchanged, and fires no `onReorder`; a normal `pointerup` followed by `lostpointercapture` keeps the committed order.
5. [ ] The drop indicator appears between tiles and at the end of the collection.
6. [ ] Dragging near the top or bottom edge auto-scrolls and stops at drop or cancel.
7. [ ] Keyboard Move up/Move down through the overflow menu moves the item one position, clamps at the collection ends, announces the exact new position through `strings.reorderPosition`, and reports the same `onReorder` payload.
8. [ ] Drag reorder works in fixed, masonry, justified, and mosaic layouts.
9. [ ] A pointer-down on an action button, selection control, or drag handle never starts a marquee or tile activation.
10. [ ] `TileGridItem` renders all documented slots, passes `item` to every action, renders no `children` channel, and an action click calls its `onSelect` once and never selects or drags the tile.
11. [ ] Icon-only actions have accessible names; a blank action label falls back to its `id`; the drag handle has an accessible name that includes the item label; the custom `dragHandle` render prop receives the library-owned listeners and drag state.
12. [ ] On touch (or whenever inline actions are hidden), every `actions` entry remains reachable through the overflow menu; `overflowActions` add menu-only entries.
13. [ ] The 20K photo-library story filters items through `scrollResetKey`, preserves seeded selection, disables arranging while filtered (including keyboard reorder), and opens an app-owned preview from `onItemActivate`.
14. [ ] The 20K story mounts fewer than 120 tiles in every layout at 1440×900 on the shared fixture and requests only visible/overscan images on first paint.
15. [ ] Browser tests in `test/browser/**/*.browser.test.tsx` cover drag, drag cancel, pointer-capture ordering, keyboard reorder, marquee, zoom anchor, action isolation, touch action reachability, and the per-layout mounted-tile count across Chromium, Firefox, and WebKit.
16. [ ] Security requirements verified: no hardcoded CastingAppMT actions, no HTML injection, no image URL fetching or logging by the library, application-owned URL validation, and action callbacks fire once.
17. [ ] Forwarding the shell-relevant `TileGridItemRenderArgs` (`item`, `selected`, `selectable`, `disabled`, `isDragging`, `isOverlay`, `dragHandleProps`, `reorderActions`, `strings`) into `TileGridItem` renders the default drag handle and the Move up/Move down overflow actions; when `reorderable` is false or `reorderDisabled` is true, no handle and no reorder actions render.
