# Geometry Engine: TileGrid Phase A

> **Document**: 03-01-geometry-engine.md
> **Parent**: [Index](00-index.md)
> **CodeOps Artifact Schema**: 1

## Overview

The geometry engine turns normalized items and a container width into deterministic rectangles for four layouts. It is pure: no React, no DOM, no image measurement, no logging. The renderer and the marquee controller consume its result; the virtualizer uses its bands or lane assignments only as a range hint.

The engine owns the shortest-column assignment for masonry. TanStack's `lanes` mode repeats the same shortest-column/leftmost rule; a parity test in `03-02` asserts agreement. Rendered positions always come from the geometry rectangles.

**References:** RD-02 §Fixed layout, §Masonry layout, §Justified layout, §Mosaic layout, §Aspect ratio, §Span source, §Gap, §tileSize bounds, §Columns, §Virtualized rendering, §Geometry result. **Decisions:** AR #7, AR #12, AR #19.

## Architecture

```
src/components/TileGrid/geometry/
├── types.ts              # internal input/result/rect/band types
├── normalize.ts          # item, number, ratio, span normalization
├── columnCount.ts        # automatic column formula
├── computeGeometry.ts    # normalize + dispatch by layout
├── fixedLayout.ts
├── masonryLayout.ts
├── justifiedLayout.ts
├── mosaicLayout.ts
└── geometryPort.ts       # live adapter type (implemented by the component)
```

`computeGeometry` is the only entry point the component calls. Each layout module exports one pure function and uses the shared normalization helpers. The engine never imports React or Fluent UI.

## Types

```ts
type TileGridLayout = 'fixed' | 'masonry' | 'justified' | 'mosaic';

interface TileGridItemRect {
  id: string;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TileGridBand {
  /** Top of the band in scroll-container coordinates. */
  start: number;
  /** Content height of the band, without the inter-band gap. */
  height: number;
  /** First item index whose top is in this band. */
  firstIndex: number;
  /** Last item index whose top is in this band. */
  lastIndex: number;
}

interface TileGridGeometryInput<T> {
  items: readonly T[];
  getItemId: (item: T) => string;
  getItemAspectRatio?: (item: T) => number | null | undefined;
  getItemSpan?: (item: T) => { columns?: 1 | 2; rows?: 1 | 2 } | undefined;
  layout: TileGridLayout;
  columns?: number;
  tileSize: number;
  tileAspectRatio: number;
  fallbackAspectRatio: number;
  gap: number;
  containerWidth: number;
}

interface TileGridGeometryResult {
  itemRects: readonly TileGridItemRect[];
  bands: readonly TileGridBand[];
  totalHeight: number;
  columnCount: number;
  laneCount: number;
  indexAtPoint(x: number, y: number): number | undefined;
  firstVisibleItem(scrollTop: number): TileGridItemRect | undefined;
  offsetForItem(id: string): number | undefined;
  itemsInRange(startY: number, endY: number): readonly number[];
}

interface TileGridGeometryPort {
  getItemRect(id: string): { x: number; y: number; width: number; height: number } | undefined;
  getVisibleItemIds(): readonly string[];
  getScrollContainer(): HTMLElement | null;
  getScrollOffset(): number;
  scrollBy(delta: number): void;
}
```

The geometry types are internal, not exported from the package root. `TileGridLayout` is the public layout union; the other types stay under `geometry/`.

## Normalization

`normalize.ts` owns every defensive rule. The component calls it before geometry and emits development warnings for the cases marked **warn**; the pure engine never warns.

| Value                       | Rule                                                                                                                                                                      | Warning                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `items` / `getItemId`       | Keep the first occurrence of each ID; drop later duplicates and report the duplicate IDs                                                                                  | Warn in development                    |
| `containerWidth`            | Non-finite or negative → `0`; geometry returns empty rectangles until measured                                                                                            | No                                     |
| `tileSize`                  | Missing → `160`; non-finite → `160`; clamp to `[minTileSize, maxTileSize]`                                                                                                | No                                     |
| `minTileSize`               | Missing → `120`; non-finite → `120`; clamp to `[1, maxTileSize]`                                                                                                          | If supplied greater than `maxTileSize` |
| `maxTileSize`               | Missing → `320`; non-finite → `320`; clamp to `>= 1`                                                                                                                      | No                                     |
| `gap`                       | Missing → `8`; non-finite or negative → `0`                                                                                                                               | No                                     |
| `columns`                   | Missing or non-finite → automatic formula; otherwise `max(1, trunc(value))`, capped at `floor(containerWidth / gap) + 1` when `gap > 0` so no column is narrower than `0` | If supplied for `justified`            |
| `tileAspectRatio`           | Missing → `1`; non-finite or `<= 0` → `1`                                                                                                                                 | No                                     |
| `fallbackAspectRatio`       | Missing → `1`; non-finite or `<= 0` → `1`                                                                                                                                 | No                                     |
| `getItemAspectRatio` result | Non-finite (including `Infinity`), `undefined`, `null`, `<= 0` → `fallbackAspectRatio`                                                                                    | No                                     |
| `getItemSpan` result        | Only mosaic; columns/rows clamp to `1..2` and to available columns; invalid → `1×1`                                                                                       | No                                     |
| Scroll offsets              | Finite, clamped to `[0, maxScroll]` by the scroll helper                                                                                                                  | No                                     |

`normalizeItems` returns the unique items in source order and the duplicate IDs. The component renders and selects only the unique items; `aria-setsize` uses the unique count.

## Column count

The automatic formula is shared by fixed, masonry, and mosaic:

```ts
function automaticColumnCount(containerWidth: number, tileSize: number, gap: number): number {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return 1;
  if (!Number.isFinite(tileSize) || tileSize <= 0) return 1;
  return Math.max(1, Math.floor((containerWidth + gap) / (tileSize + gap)));
}
```

`columns` overrides the formula. Justified ignores it and warns in development. Mosaic honors it like fixed and masonry.

## Layout algorithms

### Fixed

- Column count: `columns ?? automaticColumnCount(width, tileSize, gap)`.
- Column width: `(width - gap * (columns - 1)) / columns`.
- Item height: `columnWidth / tileAspectRatio`.
- Item `x`: `column * (columnWidth + gap)`; `y`: `row * (itemHeight + gap)`.
- Source order is row-major.
- Each row is a band `{ start: rowY, height: itemHeight, firstIndex, lastIndex }`.
- `totalHeight`: last row bottom, or `0` for no items.

Hand-computed example: width `440`, `tileSize=100`, `gap=10`, `tileAspectRatio=1` → 4 columns, item `102.5 × 102.5`, row 0 `y=0`, row 1 `y=112.5`, 5 items → `totalHeight=215`.

### Masonry

- Column count and column width use the fixed formula.
- Item height: `columnWidth / itemAspectRatio`.
- Maintain `laneEnds[columns]`, initially `0`.
- For each item in source order: choose the lane with the smallest `laneEnds`; ties choose the lowest lane index (leftmost); `x = lane * (columnWidth + gap)`; `y = laneEnds[lane]`; `laneEnds[lane] = y + height + gap`.
- The last gap is not included in `totalHeight`: `max(y + height)`.
- Items are not sorted by `y`; `itemRects` stays in source order.
- `bands` is empty; `laneCount = columnCount`; the virtualizer uses item/lane mode.
- `firstVisibleItem(scrollTop)` chooses the visible rectangle with the smallest `y`, then `x`, then `index`.
- `itemsInRange(startY, endY)` returns every item whose `[y, y+height)` intersects the range.

Hand-computed example: 3 lanes, column width `100`, `gap=0`, four items with aspect ratio `1` → items 0–2 at `y=0` in lanes 0, 1, 2; item 3 at `y=100` in lane 0.

### Justified

- `tileSize` is the target row height; `gap` separates items and rows.
- Item width at target height: `tileSize * itemAspectRatio`.
- Add items to the current row until adding the next item would exceed `containerWidth`; then close the row.
- For a completed row with `itemWidths` and `n` items, `available = containerWidth - gap * (n - 1)`; `sum = Σ itemWidths`; `scale = available / sum`; `rowHeight = tileSize * scale`; item widths become `itemWidth * scale`.
- The last row (when all items are placed) stays at `tileSize` and is left-aligned; it is not scaled.
- Item `x` is the cumulative scaled widths plus gaps; `y` is the row top.
- Each row is a band `{ start: rowY, height: rowHeight, firstIndex, lastIndex }`.
- `totalHeight` is the last row bottom.

### Mosaic

- Column count: `columns ?? automaticColumnCount(width, tileSize, gap)`.
- Base cell width: `(width - gap * (columns - 1)) / columns`; base cell height equals the base cell width (square cells).
- `tileSize` determines the automatic column count; it does not override the derived cell width.
- `getItemSpan` returns `{ columns, rows }`, each `1` or `2`; clamp to available columns and rows.
- Maintain an occupancy grid of rows × columns. For each item in source order, scan row-major for the first free `span.columns × span.rows` block; if none fits in existing rows, append rows until it fits.
- Rectangle: `x = column * (cellWidth + gap)`; `y = row * (cellHeight + gap)`; `width = span.columns * cellWidth + (span.columns - 1) * gap`; `height = span.rows * cellHeight + (span.rows - 1) * gap`.
- `bands` are base rows `{ start: row * (cellHeight + gap), height: cellHeight, ... }`. An item spanning two rows starts in its first row; `itemsInRange` must include spanning items from earlier bands.
- `getItemAspectRatio` is accepted for API consistency but does not change cell placement (AR #19).
- `totalHeight` is the bottom of the last occupied row.

### Shared result helpers

- `indexAtPoint(x, y)`: return the item index whose rectangle contains the point; if several (should not happen), the highest index. Return `undefined` outside all rectangles.
- `firstVisibleItem(scrollTop)`: return the first item at or below `scrollTop`; choose the smallest `y`, then `x`, then `index`, including an item whose rectangle starts above the line but extends below it. If `scrollTop` falls in a row gap, return the next row's first item. For mosaic this can be a span that started in an earlier band.
- `offsetForItem(id)`: the item's `y`; `undefined` for an unknown ID.
- `itemsInRange(startY, endY)`: all item indices whose vertical span intersects the range; include spans. The band layouts may scan bands; masonry scans rectangles. The result is sorted by index.

The result is a plain object with methods. It is deterministic: the same input produces the same output, with no `Date`, random, DOM, or measurement calls.

## Error handling

| Error case                                 | Handling strategy                                                                                            | AR Ref        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------- |
| Container width is `0` or not finite       | Return empty `itemRects`/`bands`, `totalHeight=0`, `columnCount=1`; the component waits for `ResizeObserver` | AR #6         |
| Item has no aspect ratio or an invalid one | Use `fallbackAspectRatio` (default `1`)                                                                      | RD-02         |
| Item span is invalid or exceeds the grid   | Clamp to `1..2` and to available columns/rows                                                                | RD-02         |
| Duplicate IDs                              | First occurrence wins; return duplicates for the component warning                                           | RD-02, AR #13 |
| `columns` supplied for justified           | Ignore it and warn in development                                                                            | RD-02         |
| `minTileSize > maxTileSize`                | Clamp `minTileSize` to `maxTileSize` and warn in development                                                 | RD-02         |
| `getItemAspectRatio` throws                | Do not catch in the pure engine; the application's callback error surfaces at the call site                  | Standards     |
| Empty items                                | Empty result; the component renders `renderEmpty()` or `strings.emptyMessage`                                | RD-02         |

## Integration points

- `TileGrid` calls `normalizeItems`, then `computeGeometry` with normalized options.
- `03-02` consumes `bands` for fixed/justified/mosaic and `itemRects`/`laneCount` for masonry; it uses `itemsInRange` for the rendered set.
- `03-03` consumes `TileGridGeometryPort` for marquee hit testing; the component implements the port from the current geometry and scroll container.
- The internal scroll helpers use `offsetForItem` and `firstVisibleItem`.
- No module here imports React, Fluent UI, or the package root.

## Testing requirements

- Hand-computed rectangle tests for one fixed, one masonry, one justified, and one mosaic fixture.
- Invariant tests on a larger fixture: no overlap, container bounds, source-order indices, total-height consistency, row fill for justified, span occupancy for mosaic, and lane shortest/leftmost for masonry.
- Normalization tests for every row in the normalization table, including `Infinity`, `NaN`, negative gaps, columns, and duplicate IDs.
- `firstVisibleItem`/`offsetForItem`/`indexAtPoint`/`itemsInRange` tests, including masonry ties and mosaic spans.
- No snapshot files; the hand-computed values and invariants are the oracle (RD-02 AC 2).
- The geometry tests are pure and run in jsdom or node without mounting a component.
