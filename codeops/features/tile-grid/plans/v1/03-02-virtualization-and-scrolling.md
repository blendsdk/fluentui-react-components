# Virtualization and Scrolling: TileGrid Phase A

> **Document**: 03-02-virtualization-and-scrolling.md
> **Parent**: [Index](00-index.md)
> **CodeOps Artifact Schema**: 1

## Overview

`TileGrid` owns one scroll container and mounts only the visible item window plus two rows of overscan. Fixed, justified, and mosaic layouts virtualize bands; masonry virtualizes items with TanStack's `lanes` mode. Geometry remains the source of rendered rectangles and masonry lane assignment; the virtualizer is a range calculator and a parity-checked consumer.

The grid measures its root with `ResizeObserver`, preserves the first visible item and pixel offset when the layout or `tileSize` changes, and exposes internal scroll helpers that the Phase A handle and the RD-03 focus/keyboard work can reuse.

**References:** RD-02 §Virtualized rendering, §Container measurement, §Anchor preservation, §Performance, §Security; RD-02 AC 1, 4, 8, 11, 12, 14. **Decisions:** AR #6, AR #7, AR #12.

## Architecture

```
src/components/TileGrid/virtualization/
├── options.ts             # buildBandVirtualizerOptions / buildMasonryVirtualizerOptions
├── useTileGridVirtualizer.ts
├── useContainerSize.ts
├── useAnchorPreservation.ts
├── scrollHelpers.ts
└── types.ts
```

The component passes the geometry result, the root ref, and the normalized options to these hooks. The hooks do not know about selection or rendering.

## Scroll container contract

- The root element is a `div` with `role="list"`, `position: relative`, `overflow: auto`, `height: 100%`, and `min-height: 0`.
- The application supplies a sized parent or a native `style` height. The Phase A story and the 20K benchmark use a fixed-height wrapper (`height: 900px`).
- The root is the only scroll container. Window/page scrolling is not supported in Phase A.
- `className` and `style` merge with the component's root classes/styles; the caller's values win. The package README documents that the root must remain a scroll container with a bounded height.
- The root's direct children are a presentation spacer and the visible `listitem` wrappers. The spacer is `aria-hidden="true"` and `role="presentation"`; it has `height={geometry.totalHeight}`. The item wrappers are absolutely positioned from geometry rectangles.

## Container measurement

`useContainerSize(rootRef)` observes the root with `ResizeObserver` and returns `{ width, height }`. It reads `root.clientWidth`/`root.clientHeight` inside the observer callback, not the entry `contentRect`, so padding/border differences cannot skew the geometry. It sets the initial size in a layout effect and updates on resize. The observer disconnects on unmount.

The test setup installs a controllable `ResizeObserver` stub when the API is missing. The browser tests use the real API. If the root has no measured width, the component renders the spacer at height `0` and no item wrappers; the first observer callback produces the layout.

## Virtualizer integration

### Band layouts: fixed, justified, mosaic

```ts
const virtualizer = useVirtualizer(
  buildBandVirtualizerOptions({
    geometry,
    getScrollElement: () => rootRef.current,
    overscan: 2,
  })
);
```

`buildBandVirtualizerOptions` returns:

```ts
{
  count: geometry.bands.length,
  getScrollElement,
  estimateSize: index => geometry.bands[index].height,
  getItemKey: index => `${geometry.bands[index].firstIndex}:${geometry.bands[index].lastIndex}`,
  gap: normalizedGap,
  overscan: 2,
}
```

The virtualizer's cumulative band starts equal the geometry band starts because the band heights and `gap` are the same. A unit test asserts this for all three band layouts. The rendered band range is `virtualizer.getVirtualItems()`. The rendered item set is `geometry.itemsInRange(firstBand.start, lastBand.start + lastBand.height)`, which also returns mosaic items that start in an earlier band and span into the range. Each item wrapper is positioned from its geometry rectangle, not from the virtualizer's `start`.

The spacer height is `geometry.totalHeight`, not `virtualizer.getTotalSize()`. The two values must agree; a parity assertion in the virtualizer test catches drift.

### Masonry: item/lane mode

```ts
const virtualizer = useVirtualizer(
  buildMasonryVirtualizerOptions({
    geometry,
    getScrollElement: () => rootRef.current,
    overscan: 2,
  })
);
```

`buildMasonryVirtualizerOptions` returns:

```ts
{
  count: geometry.itemRects.length,
  getScrollElement,
  estimateSize: index => geometry.itemRects[index].height,
  getItemKey: index => geometry.itemRects[index].id,
  lanes: geometry.laneCount,
  gap: normalizedGap,
  overscan: 2,
}
```

The rendered set is `virtualizer.getVirtualItems()` mapped to geometry rectangles. TanStack's lane assignment must match the geometry engine's shortest-column/leftmost rule. `test/tile-grid-virtualizer.impl.test.tsx` uses the same `buildMasonryVirtualizerOptions` helper with a test host and compares `virtualizer.measurementsCache[i].lane` and `.start` to the geometry rect for every item. If the library changes its lane rule, the parity test fails; the geometry rectangles remain the rendered source.

`overscan: 2` with lanes is two rows of lanes. At 1440×900, 160px `tileSize`, 8px gap, and aspect ratios 0.8–2.0, the visible window plus overscan stays under 120 mounted wrappers.

## Anchor preservation

`useAnchorPreservation` captures the first visible item and pixel offset before a geometry-changing render, then restores it after the new geometry is committed.

- Track a geometry key: `layout`, normalized `tileSize`, `columns`, `gap`, `tileAspectRatio`, `fallbackAspectRatio`, and the unique item IDs.
- When the key changes (and it is not the first render), capture `scrollTop = root.scrollTop`, `anchor = previousGeometry.firstVisibleItem(scrollTop)`, and `offset = anchor ? scrollTop - anchor.y : 0`.
- After the new geometry is available, find the new rectangle by `anchor.id`.
  - If found: clamp `offset` to `[0, newRect.height]`, then set `root.scrollTop = clamp(newRect.y + offset, 0, maxScroll)`.
  - If not found: set `root.scrollTop = 0`.
- A plain scroll does not change the geometry key and must not run the restore.
- A `tileSize` change from 160 to 200 on the 20K fixture keeps the same first visible item and the same pixel offset (clamped to the new item height). The browser test records the item ID and offset before and after.
- The effect uses `useLayoutEffect` so the browser paints the restored position.

## Internal scroll helpers

`scrollHelpers.ts` exports pure/clamped helpers around the root element and geometry result:

| Helper                                            | Behavior                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `scrollToItem(id)`                                | `geometry.offsetForItem(id)`; unknown ID is a no-op; clamp to `[0, maxScroll]`       |
| `scrollToIndex(index)`                            | Resolve the item rect by index; out-of-range is a no-op; use its `y`                 |
| `scrollToOffset(offset)`                          | Clamp a finite offset to `[0, maxScroll]`; non-finite is a no-op                     |
| `scrollToSelected(selectedIds, items, getItemId)` | First selected ID in current item order; `scrollToItem`; no selected item is a no-op |
| `maxScroll(root)`                                 | `Math.max(0, root.scrollHeight - root.clientHeight)`                                 |

The public `TileGridHandle` exposes only `selectAll`, `clearSelection`, and `scrollToSelected`. The other helpers stay internal. `scrollToSelected()` is a no-op when no selected ID is present in the current items.

## Item wrapper rendering

- Every rendered item wrapper is a direct child of the root with `role="listitem"`, `data-tile-grid-item`, `data-index={index}`, `aria-setsize={uniqueItemCount}`, `aria-posinset={index + 1}`, and `aria-label={getItemLabel(item)}`.
- The wrapper style is `position: absolute; left: x; top: y; width: width; height: height; box-sizing: border-box`. It does not clip the application's content unless the application styles it.
- The wrapper's child is the result of `renderItem({ item, index, tileSize, width, height, selected, selectable: true, disabled: false })`.
- The spacer is the only non-listitem child; it is presentation-only.
- The empty state replaces the spacer/items inside the root. The default empty state uses `strings.emptyMessage`; `renderEmpty()` wins when supplied.
- The root has `aria-label` from `ariaLabel` or a native `aria-labelledby`; the latter wins when both are present. A development warning fires when neither is present.

## Performance and 20K bound

- Fixed, masonry, and mosaic use the automatic eight-column layout at 1440×900, 160px `tileSize`, 8px gap. Justified uses a 160px target row height. The shared fixture cycles aspect ratios 0.8–2.0.
- The visible viewport is about six rows; two rows of overscan above and below yield about ten rows. Eight columns × ten rows is about 80 wrappers; justified rows contain at most about eleven items at the fixture ratios, still under 120.
- The renderer never calls `getBoundingClientRect()` per item per frame. It uses geometry rectangles and the virtualizer's range. The marquee controller also uses the geometry port, not DOM rects. ST-48 verifies this with a DOM-read spy and per-layout scroll/offscreen assertions.
- `test/perf/tile-grid.perf.test.tsx` records geometry recompute, mounted wrappers, and scripted-scroll frame timing. The public 20K selection proxy is in the Phase 4 browser selection suite (ST-47); the pure set-copy microbenchmark is a supplement. The budgets are defined in `03-05`.

## Error handling

| Error case                                                   | Handling strategy                                                                        | AR Ref      |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------- |
| Root not measured yet                                        | Render spacer height `0`, no items; wait for `ResizeObserver`                            | AR #6       |
| Root removed or unmounted                                    | Disconnect observer, cancel pending scroll/anchor work, no state update after unmount    | Standards   |
| `ResizeObserver` unavailable                                 | The browser target supports it; jsdom installs the stub. No production fallback is added | AR #20      |
| Geometry anchor ID disappears                                | Scroll to top (`scrollTop = 0`)                                                          | RD-02       |
| Scroll helper receives a non-finite offset                   | No-op                                                                                    | RD-02       |
| Virtualizer total and geometry total diverge                 | Parity test fails; the spacer and item positions remain geometry-driven                  | AR #7       |
| 20K fixture exceeds the mounted bound                        | Performance test fails; inspect overscan, band grouping, or mosaic span handling         | RD-02 AC 1  |
| Renderer starts measuring item DOM during scroll             | ST-48 fails; inspect the wrapper/render path and remove per-item `getBoundingClientRect` | RD-02 AC 12 |
| Caller overrides `overflow`/height and breaks virtualization | README documents the scroll contract; the caller owns the override                       | AR #6       |

## Integration points

- `03-01` provides the geometry result and `itemsInRange`; this document consumes it.
- `03-03` receives a `TileGridGeometryPort` implemented with `rootRef`, the current geometry, and the internal scroll helpers.
- `03-04` renders the root, spacer, item wrappers, and empty state from the state these hooks return.
- `03-05` runs the browser mounted-count, anchor, and scroll tests and the performance job.

## Testing requirements

- Pure virtualizer-option tests: band starts/total match geometry; masonry lanes/starts match geometry for the 20K fixture.
- Browser: four layouts at 1440×900 mount under 120 wrappers; masonry does not mount whole columns.
- Browser: scrolling each layout keeps mounted indexes within the visible-plus-overscan window and never calls `getBoundingClientRect()` on a `[data-tile-grid-item]` (ST-48).
- Browser: tileSize 160 → 200 preserves the first visible item ID and offset; an item removed from the middle scrolls to top when it was the anchor.
- Browser: `scrollToItem`/`scrollToSelected` bring the target into view; unknown IDs are no-ops.
- Browser selection: 20K public select/clear/read, p95 under 16ms, mounted wrappers unchanged (ST-47).
- jsdom: empty state, list semantics, setsize/posinset, ariaLabel precedence, duplicate-ID first occurrence.
- Performance: geometry recompute, mounted wrappers, scripted scroll frame trace; public selection proxy ST-47; pure transition supplement ST-33.
