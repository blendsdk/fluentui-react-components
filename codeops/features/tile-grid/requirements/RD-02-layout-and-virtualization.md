# RD-02: TileGrid Layout and Virtualization

> **Document**: RD-02-layout-and-virtualization.md
> **Status**: Preflighted — accepted fixes applied
> **Created**: 2026-10-20
> **Project**: fluentui-react-components
> **Depends On**: —
> **Provides**: internal geometry input contract consumed by RD-01
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

This RD defines the `TileGrid<T>` rendering core: four layout strategies, one geometry engine,
virtualized rendering for 20K items, the item rendering contract, optional tile-size zoom, and the
empty state.

The geometry engine converts items and container width into item rectangles, visible bands or
lanes, total scroll height, an index-at-point function, and a scroll anchor. RD-01's marquee and
RD-04's drag layer consume those rectangles instead of the DOM. The engine also owns the
shortest-column assignment for masonry, so layout and virtualization share one lane source. This
is what makes four layouts share one interaction model.

The core does not fetch data, filter items, load images, own selection, render a toolbar, or open a
lightbox. The application supplies already-filtered, already-ordered items.

---

## Functional Requirements

### Must Have (M)

- [ ] **Generic component.** `TileGrid<T>` accepts `items: readonly T[]`, `getItemId(item)`,
      `getItemLabel(item)`, and `renderItem(args)`.
- [ ] **Layout selection.** `layout` accepts `'fixed' | 'masonry' | 'justified' | 'mosaic'` and
      defaults to `'fixed'`.
- [ ] **Fixed layout.** Uniform tiles in rows. Columns are `columns` when supplied, otherwise
      `max(1, floor((containerWidth + gap) / (tileSize + gap)))`. The actual tile width is
      `(containerWidth - gap * (columns - 1)) / columns`; the height is `tileWidth / tileAspectRatio`.
- [ ] **Masonry layout.** Fixed column width with variable item heights. Columns use the same
      formula as fixed. Each item's height is `columnWidth / itemAspectRatio`. Items are placed in
      the shortest column, with the leftmost column winning ties. Item order is the source order.
      The geometry engine owns this lane assignment; the virtualizer consumes it and never
      recomputes lanes.
- [ ] **Justified layout.** Variable-width rows. `tileSize` is the target row height. Each item's
      width at the target height is `tileSize * itemAspectRatio`. A row closes when adding the next
      item would exceed the container width. Completed rows scale to fill the container width; the
      last row stays at the target height and is left-aligned.
- [ ] **Mosaic layout.** Dense base grid with optional 2×2 spans. `tileSize` is the base cell size.
      Columns use the fixed formula and therefore honor `columns` when supplied. `getItemSpan`
      returns `{ columns: 1 | 2, rows: 1 | 2 }`, default `{ columns: 1, rows: 1 }`. The packer scans
      row-major for the first free rectangle that fits the span; if none fits in existing rows, it
      appends rows. Invalid spans are clamped to the available columns and rows.
- [ ] **Aspect ratio.** `getItemAspectRatio(item)` returns a finite positive width/height ratio.
      It is required for masonry, justified, and mosaic. If it returns `undefined`, `null`, `NaN`,
      zero, a negative value, or any non-finite value including `Infinity`, `fallbackAspectRatio`
      (default `1`) is used. `fallbackAspectRatio` and `tileAspectRatio` must themselves be finite
      and positive; invalid values fall back to `1`. `tileAspectRatio` defaults to `1` for fixed
      layout. The grid never measures images on load and never reflows because an image loaded.
- [ ] **Span source.** `getItemSpan` is consulted only in mosaic layout. Fixed, masonry, and
      justified layouts ignore it.
- [ ] **Gap.** `gap` is a non-negative finite number of pixels, default `8`. Negative and
      non-finite values clamp to `0`.
- [ ] **tileSize bounds.** `tileSize` defaults to `160`; `minTileSize` defaults to `120`;
      `maxTileSize` defaults to `320`. Values outside the bounds clamp to the nearest bound. If
      `minTileSize` exceeds `maxTileSize`, `minTileSize` clamps to `maxTileSize` and the grid emits
      a development warning.
- [ ] **Columns.** `columns` is clamped to `max(1, trunc(value))`; a non-finite or missing value
      falls back to the automatic formula. Mosaic honors `columns` in the same way as fixed and
      masonry; only justified ignores it.
- [ ] **Optional zoom.** `zoomable` defaults to `false`. When false, the grid renders at the
      supplied or default `tileSize` and exposes no zoom affordance. When true, `tileSize` is
      controlled: `onTileSizeChange` receives the next value and the application applies it. The
      grid never owns, persists, or defaults the zoom state; there is no uncontrolled zoom or
      `defaultTileSize`.
- [ ] **Anchor preservation.** Changing `layout` or `tileSize` preserves the first visible item ID
      and its pixel offset when that item still exists; otherwise the grid scrolls to the top.
- [ ] **Container measurement.** The grid measures its scroll container width with a
      `ResizeObserver` and recomputes geometry when the width, layout, items, span, ratio, gap, or
      tile size changes. The jsdom test setup provides a controllable `ResizeObserver` stub; the
      component assumes a browser that supports the API.
- [ ] **Virtualized rendering.** Only the visible item window plus two rows of overscan is
      mounted. Fixed, justified, and mosaic virtualize bands/rows. Masonry uses `lanes = columns`
      and a vertical item window; it never mounts whole columns. The geometry engine's lane
      assignment is the single source for both layout and virtualization. On the shared benchmark
      fixture (20K items, 1440×900, 160px `tileSize`, 8px gap, aspect ratios 0.8–2.0, two-row
      overscan), every layout mounts fewer than 120 item wrappers.
- [ ] **Stable keys and duplicate IDs.** Rendered item wrappers use `getItemId(item)` as their
      React key. Duplicate IDs are an application contract violation: the grid emits a development
      warning and renders and selects only the first occurrence in display order, so later
      duplicates never share DOM or selection state.
- [ ] **Item rendering contract.** `renderItem` receives
      `{ item, index, tileSize, width, height, selected, selectable, disabled, isDragging, isOverlay, dragHandleProps, reorderActions, strings }`.
      RD-03 supplies the selection and disabled values; RD-04 supplies the drag, overlay, and reorder
      values. The core does not interpret the returned React content.
- [ ] **Public handle and internal scroll helpers.** The forwarded ref exposes the
      `TileGridHandle` defined in the final contract below. `scrollToItem(id)`,
      `scrollToIndex(index)`, and `scrollToOffset(offset)` are internal helpers used by focus and
      anchor restoration; they are not public. The public `scrollToSelected()` is defined in RD-03.
- [ ] **Empty state.** When `items` is empty, the grid renders `renderEmpty()` when supplied, else
      `strings.emptyMessage` (default `'No items'`). The empty state is inside the same accessible
      root as the collection.
- [ ] **No internal data fetching.** The component never calls an API, reads storage, or loads
      images itself. The application supplies items and image content.
- [ ] **No internal filtering or sorting.** The application supplies the filtered, sorted order.
- [ ] **Storybook.** `TileGrid.stories.tsx` shows fixed, masonry, justified, and mosaic layouts,
      `zoomable` on/off with controlled `tileSize`, the empty state, and the named
      `TwentyThousandBenchmark` story.
- [ ] **Documentation.** The package README documents the component, layouts, `tileSize`, aspect
      ratio requirements, zoom, performance guidance, and the image rendering contract.
- [ ] **Package surface.** The package root exports `TileGrid`, `TileGridItem`, `TileGridProps`,
      `TileGridItemProps`, `TileGridAction`, `TileGridLayout`, `TileGridSelectionMode`,
      `TileGridInteractionMode`, `TileGridHandle`, `TileGridItemRenderArgs`, `TileGridReorderArgs`,
      `TileGridDragHandleProps`, and `TileGridStrings`. The export pin test is updated.

### Should Have

- [ ] Development warning when `columns` is supplied for justified layout, where it is ignored.
- [ ] Development warning when `minTileSize > maxTileSize`; the grid clamps `minTileSize` to
      `maxTileSize`.
- [ ] Development warning when a duplicate `getItemId` value is encountered.

### Won't Have (Out of Scope)

- A built-in filter/search/sort toolbar.
- A built-in lightbox or photo viewer.
- Server-side data fetching, pagination, or infinite-scroll orchestration.
- Image upload or upload-progress transport.
- Masonry drag reordering with live reflow during the drag; RD-04 commits on drop.
- RTL layout in v1; logical CSS properties are used where free.
- SSR rendering; the target is a browser application.
- A public geometry or virtualizer API.

---

## Technical Requirements

### Public props and types

```ts
type TileGridLayout = 'fixed' | 'masonry' | 'justified' | 'mosaic';
type TileGridSelectionMode = 'none' | 'single' | 'multiselect';
type TileGridInteractionMode = 'browse' | 'select';

interface TileGridItemRenderArgs<T> {
  item: T;
  index: number;
  tileSize: number;
  width: number;
  height: number;
  selected: boolean;
  selectable: boolean;
  disabled: boolean;
  isDragging: boolean;
  isOverlay: boolean;
  dragHandleProps?: TileGridDragHandleProps;
  reorderActions: readonly TileGridAction<T>[];
  strings: TileGridStrings;
}

interface TileGridReorderArgs {
  itemId: string;
  fromIndex: number;
  toIndex: number;
  orderedIds: readonly string[];
}

interface TileGridStrings {
  emptyMessage: string;
  selectionCount: (selectedCount: number, totalCount: number) => string;
  reorderPosition: (position: number, totalCount: number) => string;
  dragHandleLabel: (itemLabel: string) => string;
  moveUp: string;
  moveDown: string;
}

interface TileGridHandle {
  selectAll(): void;
  clearSelection(): void;
  scrollToSelected(): void;
}

interface TileGridProps<T>
  extends Omit<
    React.ComponentPropsWithoutRef<'div'>,
    'children' | 'role' | 'aria-label' | 'dangerouslySetInnerHTML'
  > {
  items: readonly T[];
  getItemId: (item: T) => string;
  getItemLabel: (item: T) => string;
  getItemAspectRatio?: (item: T) => number | null | undefined;
  getItemSpan?: (item: T) => { columns?: 1 | 2; rows?: 1 | 2 } | undefined;
  isSelectable?: (item: T) => boolean;
  isDisabled?: (item: T) => boolean;
  renderItem: (args: TileGridItemRenderArgs<T>) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  layout?: TileGridLayout;
  tileSize?: number;
  minTileSize?: number;
  maxTileSize?: number;
  zoomable?: boolean;
  onTileSizeChange?: (tileSize: number) => void;
  tileAspectRatio?: number;
  fallbackAspectRatio?: number;
  columns?: number;
  gap?: number;
  ariaLabel?: string;
  strings?: Partial<TileGridStrings>;
  selectionMode?: TileGridSelectionMode;
  selectedIds?: ReadonlySet<string>;
  defaultSelectedIds?: Iterable<string>;
  onSelectionChange?: (next: ReadonlySet<string>) => void;
  interactionMode?: TileGridInteractionMode;
  enableMarquee?: boolean;
  onItemActivate?: (item: T) => void;
  scrollResetKey?: unknown;
  reorderable?: boolean;
  reorderDisabled?: boolean;
  onReorder?: (args: TileGridReorderArgs) => void;
}
```

This is the single final public props type. The RD-03 selection fields and the RD-04 reorder
fields are subsets of it and do not create separate public interfaces. `TileGridItemProps<T>`,
`TileGridAction<T>`, and `TileGridDragHandleProps` are defined in RD-04. The render args carry
`dragHandleProps`, `reorderActions`, and the resolved `strings`, so an application can spread them
into `TileGridItem` and get the default drag handle and keyboard reorder actions without rebuilding
them.

`strings` merges key by key over English defaults. A blank static label (`emptyMessage`, `moveUp`,
`moveDown`) falls back to the default; dynamic messages receive counts and are rendered as React
text.

Native `div` props pass through except `children`, `role`, `aria-label`, and
`dangerouslySetInnerHTML`: the grid owns the list role and content, uses `ariaLabel` for the
accessible name, and never parses HTML. `aria-labelledby` remains available through the native
props; when both `ariaLabel` and `aria-labelledby` are supplied, `aria-labelledby` wins. A
development warning is emitted when neither is supplied. `className` and `style` merge with the
component's own values (the caller wins). The forwarded ref has type `TileGridHandle`.

The exact generic names may be refined during implementation, but the public members and
behaviour in this RD are fixed.

### Geometry result

Each layout strategy returns a result with:

- item rectangles `{ id, index, x, y, width, height }`;
- band or lane count and heights;
- total scroll height;
- `indexAtPoint(x, y)` for marquee and drag;
- `firstVisibleItem(scrollTop)` and `offsetForItem(id)`;
- visible index range for the current scroll offset and viewport.

The result is pure and testable without a DOM. The renderer uses absolute positioning or transforms
inside a spacer of the total height; offscreen items are not mounted.

### Internal geometry input contract

RD-01's marquee consumes a narrow, read-only subset of the geometry result. This port is internal
and is not exported:

```ts
interface TileGridGeometryPort {
  getItemRect(id: string): { x: number; y: number; width: number; height: number } | undefined;
  getVisibleItemIds(): readonly string[];
  getScrollContainer(): HTMLElement | null;
  getScrollOffset(): number;
  scrollBy(delta: number): void;
}
```

The geometry engine owns lane assignment and supplies the rectangles. RD-01 uses this port with
synthetic rectangles in unit tests; RD-03 supplies the real instance when it mounts the marquee.
RD-01 does not depend on RD-02's layout internals beyond this contract.

### Virtualization

- Use `@tanstack/react-virtual` 3.14.x as a direct dependency, externalized in the Vite build and
  declared in `dependencies` with the lockfile and README install notes updated.
- Fixed, justified, and mosaic virtualize bands/rows.
- Masonry uses `lanes = columns` with a vertical item window. The geometry engine owns the
  shortest-column assignment; the virtualizer consumes those assignments and does not recompute
  them. No dynamic measurement is required when aspect ratios are available.
- Overscan defaults to two rows of items; for masonry, two rows across all lanes.
- Mounted item wrappers are bounded by the visible vertical window plus overscan, never by whole
  columns.
- The internal `scrollToItem` helper resolves the item index from the current item array and calls
  the virtualizer's scroll API. The public handle exposes only `scrollToSelected`.
- The virtualizer's item keys come from `getItemId`; no index keys.
- Scroll updates are coalesced by the virtualizer; the component must not add a second per-pixel
  render loop.

### Image rendering contract

`TileGrid` does not render images directly and never receives a URL. The component cannot inspect or
validate an arbitrary `ReactNode`, so URL protocol validation, authenticated image access, `alt`
text, `srcSet`/`sizes`, `loading`, `decoding`, and `fetchPriority` are application
responsibilities. The public recipe and the application should:

- render a real `<img>` or Fluent `Image`, never a CSS `background-image`;
- pass `loading="lazy"`, `decoding="async"`, and `srcSet`/`sizes` when the application has multiple
  thumbnail sizes;
- use `fetchPriority="high"` only for the first visible rows;
- use `width`/`height` or an explicit aspect ratio to reserve layout space;
- pass `tileSize` into the application's `sizes` calculation when useful;
- provide an error fallback and an accessible `alt`;
- validate image URL protocols in the application before passing media to the recipe.

The RD-04 shell only sizes the media container; it cannot validate or forward attributes on an
arbitrary `ReactNode`.

Only mounted items may request images. A 20K grid must not create 20K `<img>` elements. The
component guarantees only that it never fetches, never parses HTML, and never logs image URLs or
labels.

### Optional zoom

- `zoomable=false` means no zoom affordance and no geometry change from a zoom control.
- `zoomable=true` requires controlled `tileSize`: `onTileSizeChange` receives the next value and
  the application applies it. The application renders the slider/buttons and owns persistence.
  There is no uncontrolled zoom and no `defaultTileSize`.
- The grid clamps the value, recomputes geometry, and restores the first visible item anchor.
- Keyboard zoom is owned by RD-03 and reports through the same controlled callback.
- No wheel or pinch handling in v1.
- No layout animation by default; respect `prefers-reduced-motion` if an application adds one.

### Performance

- Shared 20K benchmark fixture: generated items, aspect ratios cycling 0.8–2.0, a small set of
  thumbnail URLs, a 1440×900 viewport, 160px `tileSize`, 8px gap, and two-row overscan.
- Every layout mounts fewer than 120 item wrappers on that fixture. Fixed, masonry, and mosaic use
  the automatic eight-column layout at 1440px/160px/gap 8; justified uses a 160px target row height
  and the same aspect-ratio range.
- Geometry recomputation for 20K items completes within 200ms on the target desktop browser.
- Scrolling targets 60fps; no long task caused by layout recomputation during normal scroll.
- Only visible and overscan images are requested on first paint.
- The performance job records p95 selection toggle time (target under 16ms), geometry recompute
  (under 200ms), and frame timing for a scripted scroll (target 60fps). The filter budget is
  application-owned and is not measured by the component.

### Security

- **Data sensitivity:** items may reference profile pictures or photos. The component does not
  inspect, log, or persist item content, labels, or image URLs.
- **Input validation:** `getItemId` must return stable strings; duplicates are warned in
  development and only the first occurrence is rendered and selected. Ratios, `columns`, `gap`,
  tile-size bounds, and scroll offsets are normalized to finite, positive, in-range values.
- **Injection:** `renderItem` is React content; the component never uses `innerHTML`,
  `dangerouslySetInnerHTML`, or `eval`.
- **Authentication/authorization:** N/A in the component; the application owns authenticated image
  access, URL protocol allowlisting, and image attributes. The component accepts no URLs and never
  fetches images.
- **Encryption/rate limiting/infrastructure:** N/A for this client-side rendering module.

---

## Integration Points

### With RD-01 (Selection and marquee)

- RD-02 owns the internal `TileGridGeometryPort`; RD-01 consumes it with synthetic rectangles in
  unit tests. Grid-level marquee acceptance tests live in RD-03.
- The layout result provides `indexAtPoint` and visible item ranges for marquee hit testing.

### With RD-03 (Selection integration, focus, accessibility)

- RD-03 adds selection props, focus, list semantics, and keyboard navigation.
- RD-03 supplies `selected`, `selectable`, and `disabled` to `renderItem`, owns the public
  `TileGridHandle` selection methods, and calls the internal scroll helpers.
- RD-02 provides the rendered item wrapper positions, current order, and geometry port.

### With RD-04 (Arranging, tile shell, actions)

- RD-04 uses `indexAtPoint` and item rectangles for drag targets.
- The tile shell consumes `tileSize`, `width`, `height`, `isDragging`, and `isOverlay` to size media
  and suppress duplicate actions in the overlay.

---

## Scope Decisions

| Decision                | Options Considered                  | Chosen                                      | Rationale                                                                       | AR Ref        |
| ----------------------- | ----------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------- | ------------- |
| Layout engine           | One CSS grid vs four strategies     | Four strategies over one geometry contract  | Fixed, masonry, justified, and mosaic pack differently                          | AR #3         |
| Virtualizer             | Custom vs `@tanstack/react-virtual` | TanStack                                    | Smaller than a four-layout custom virtualizer; supports lanes and dynamic sizes | AR #11        |
| Masonry virtualization  | Whole-column lanes vs item window   | Geometry-owned lanes + vertical item window | Keeps the 20K mounted bound; one lane source                                    | PF-001        |
| Public contract         | Fragmented vs consolidated types    | One `TileGridProps<T>` and full export pin  | Spec tests compile; no cross-RD drift                                           | PF-002        |
| Mixed-layout dimensions | Measure on load vs metadata         | Required aspect ratio with fallback         | Avoids 20K measurement reflow and layout jumps                                  | AR #13        |
| Mosaic packing          | CSS dense grid vs custom packer     | Custom row-major packer                     | Virtualization and drag need deterministic rectangles                           | AR #14        |
| Zoom controls           | Built-in toolbar vs app-owned       | App-owned, controlled `tileSize`            | Keeps the component generic; app owns persistence                               | AR #8         |
| Dependencies            | Peer vs direct                      | Direct dependencies, externalized           | Implementation details stay with the package                                    | PF-011        |
| Image rendering         | Component-owned vs app-owned        | App-owned via `renderItem`/tile shell       | Component accepts no URLs; app owns validation and image attributes             | AR #9, PF-008 |
| RTL                     | Full RTL support in v1 vs later     | Later                                       | Confirmed out of v1                                                             | AR #12        |

---

## Acceptance Criteria

1. [ ] On the shared 20K benchmark fixture (1440×900, 160px `tileSize`, 8px gap, aspect ratios 0.8–2.0, two-row overscan), fixed, masonry, justified, and mosaic each mount fewer than 120 item wrappers after initial paint.
2. [ ] Each layout mode returns the hand-computed rectangles for a small fixed item fixture, and a larger fixture satisfies the no-overlap, container-bounds, total-height, row-fill, span-occupancy, and source-order invariants. No generated snapshot is the oracle.
3. [ ] In fixed layout, `columns=4`, `gap=8`, and `tileSize=160` produce four columns and a row height derived from `tileAspectRatio`.
4. [ ] In masonry layout, items are placed in the shortest column, the leftmost column wins ties, and at 20K items the mounted wrappers are bounded by the visible vertical window rather than by whole columns.
5. [ ] In justified layout, completed rows fill the container width and the last row remains at the target height, left-aligned.
6. [ ] In mosaic layout, a 2×2 span occupies two columns and two rows; an invalid 3×3 span clamps to 2×2 or the available columns; `columns` is honored like fixed and masonry, while justified ignores it with a development warning.
7. [ ] `getItemAspectRatio` returning `undefined`, `null`, `NaN`, zero, a negative value, or `Infinity` uses `fallbackAspectRatio` without measuring the image or reflowing after load; invalid `fallbackAspectRatio`/`tileAspectRatio` values fall back to `1`.
8. [ ] Changing `layout` or `tileSize` preserves the first visible item ID and offset when that item still exists.
9. [ ] The internal scroll helpers bring an item into view; an unknown ID is a no-op. The public handle exposes only `selectAll`, `clearSelection`, and `scrollToSelected`.
10. [ ] `items=[]` renders `renderEmpty()` when supplied, otherwise `strings.emptyMessage`, with the default `'No items'`.
11. [ ] A 20K geometry recomputation on `tileSize` change completes within 200ms in the target browser.
12. [ ] Scrolling the 20K benchmark fixture does not render offscreen item wrappers and does not call `getBoundingClientRect()` per item.
13. [ ] Only visible and overscan items render `<img>` elements in the image-story fixture.
14. [ ] `zoomable=false` exposes no zoom affordance; `zoomable=true` requires controlled `tileSize`, reports through `onTileSizeChange`, updates geometry and anchor, and exposes no uncontrolled zoom or `defaultTileSize`.
15. [ ] Invalid numeric props and scroll offsets normalize to finite, positive, in-range values; `minTileSize > maxTileSize` clamps with a warning; `columns` clamps to at least one integer; duplicate IDs render and select only the first occurrence with a development warning.
16. [ ] No HTML injection, no item or image URL logging, no image fetching by the component, and no SSR/window access during module evaluation.
17. [ ] The package root exports `TileGrid`, `TileGridItem`, `TileGridProps`, `TileGridItemProps`, `TileGridAction`, `TileGridLayout`, `TileGridSelectionMode`, `TileGridInteractionMode`, `TileGridHandle`, `TileGridItemRenderArgs`, `TileGridReorderArgs`, `TileGridDragHandleProps`, and `TileGridStrings`, and the export pin test matches.
