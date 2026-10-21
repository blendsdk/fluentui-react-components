# TileGrid Component: TileGrid Phase A

> **Document**: 03-04-tile-grid-component.md
> **Parent**: [Index](00-index.md)
> **CodeOps Artifact Schema**: 1

## Overview

`TileGrid<T>` is the public Phase A component: a generic, controlled-first tile collection with four layouts, a virtualized scroll container, controlled `tileSize`, a minimal selection surface, and a small imperative handle. It follows the house pattern — props contract, state hook, pure render function, Griffel styles, barrel — and exports only the Phase A surface. RD-03/RD-04 extend the type and export pin later.

**References:** RD-02 §Generic component, §Layout selection, §Optional zoom (controlled part), §Item rendering contract, §Public handle, §Empty state, §Package surface, §Storybook, §Security; RD-03 §Selection modes, §Controlled selection, §Multiselect clicks, §Single-select clicks, §None mode, §List semantics. **Decisions:** AR #2, AR #3, AR #5, AR #6, AR #13, AR #17, AR #20, AR #22, AR #23, AR #24.

## Public types

```ts
type TileGridLayout = 'fixed' | 'masonry' | 'justified' | 'mosaic';
type TileGridSelectionMode = 'none' | 'single' | 'multiselect';

interface TileGridItemRenderArgs<T> {
  item: T;
  index: number;
  tileSize: number;
  width: number;
  height: number;
  selected: boolean;
  selectable: boolean;
  disabled: boolean;
}

interface TileGridStrings {
  emptyMessage: string;
}

interface TileGridHandle {
  selectAll(): void;
  clearSelection(): void;
  scrollToSelected(): void;
}

interface TileGridProps<T> extends Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'children' | 'role' | 'aria-label' | 'dangerouslySetInnerHTML'
> {
  items: readonly T[];
  getItemId: (item: T) => string;
  getItemLabel: (item: T) => string;
  getItemAspectRatio?: (item: T) => number | null | undefined;
  getItemSpan?: (item: T) => { columns?: 1 | 2; rows?: 1 | 2 } | undefined;
  renderItem: (args: TileGridItemRenderArgs<T>) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  layout?: TileGridLayout;
  tileSize?: number;
  minTileSize?: number;
  maxTileSize?: number;
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
}
```

Phase A deliberately omits `zoomable`, `onTileSizeChange`, `isSelectable`, `isDisabled`, `interactionMode`, `enableMarquee`, `onItemActivate`, `scrollResetKey`, `reorderable`, `reorderDisabled`, `onReorder`, and every RD-04 shell type. The full contract is assembled by the RD-03/RD-04 plans (AR #2, AR #13). Phase A is internal; the final contract/export pin/dependency set is frozen before v1, and no public release occurs before then (PF-001).

Defaults: `layout='fixed'`, `tileSize=160`, `minTileSize=120`, `maxTileSize=320`, `tileAspectRatio=1`, `fallbackAspectRatio=1`, `columns` automatic, `gap=8`, `selectionMode='none'`, `strings.emptyMessage='No items'`. `selectionMode` defaults to `none`, matching RD-03.

Native `div` props pass through except `children`, `role`, `aria-label`, and `dangerouslySetInnerHTML`. The root owns the list role and content, uses `ariaLabel` for the accessible name, and never parses HTML. `aria-labelledby` remains available through the native props; when both are supplied, `aria-labelledby` wins. `className` and `style` merge with the component's values; the caller wins.

## Component files

```
src/components/TileGrid/
├── TileGrid.tsx
├── TileGrid.types.ts
├── TileGridItemView.tsx   # internal memoized item cell (PF-005)
├── useTileGrid.ts
├── renderTileGrid.tsx
├── useTileGridStyles.styles.ts
├── index.ts
├── devWarnings.ts
├── geometry/          # 03-01
├── virtualization/    # 03-02
├── selection/         # 03-03
├── marquee/           # 03-03
└── stories/
    ├── TileGrid.stories.tsx
    ├── TileGridLayouts.story.tsx
    ├── TileGridControlledTileSize.story.tsx
    ├── TileGridEmpty.story.tsx
    ├── TileGridSelection.story.tsx
    └── TileGridTwentyThousandBenchmark.story.tsx
```

`TileGrid.tsx` is the `forwardRef` shell. `useTileGrid` composes the normalized props, selection store, container size, geometry, virtualizer, anchor preservation, scroll helpers, and handle. `renderTileGrid` is pure and receives a resolved state object. Internal submodules are not exported from the package root.

The execution plan stages the ref layer: Phase 2 builds the generic component shell without a handle; Phase 4 adds `forwardRef` and `TileGridHandle` once the selection store and scroll helper exist. The final Phase A shape is the one documented here.

### Generic `forwardRef`

```tsx
const TileGridBase = <T,>(props: TileGridProps<T>, ref: React.Ref<TileGridHandle>) => {
  const state = useTileGrid(props);
  return renderTileGrid(state);
};

const TileGridForwardRef = React.forwardRef(TileGridBase) as <T>(
  props: TileGridProps<T> & React.RefAttributes<TileGridHandle>
) => React.ReactElement;

const TileGridCallable = <T,>(
  props: TileGridProps<T> & React.RefAttributes<TileGridHandle>
): React.ReactElement => {
  const { ref, ...rest } = props;
  return <TileGridForwardRef {...rest} ref={ref} />;
};

export const TileGrid = TileGridCallable;
```

The inner component follows the existing `FormTextField` generic `forwardRef` pattern; no `as any`/`as unknown` is used. React 19 passes `ref` as a regular prop to the callable wrapper, which forwards it to the inner component. The public export stays callable while the inner component owns `useImperativeHandle` (AR #22, AR-28).

## State hook

`useTileGrid` resolves:

1. **Normalization** — unique items/duplicate IDs, numeric bounds, ratios, columns, gap, strings. Warnings go through `devWarnings.ts`.
2. **Selection** — `useGridSelection` with the current unique IDs. The selected/selectable/disabled render values come from the store and the Phase A defaults (`selectable: true`, `disabled: false`).
3. **Measurement** — `useContainerSize(rootRef)` returns `{ width, height }`.
4. **Geometry** — `useMemo` over the unique items, normalized options, and container width.
5. **Virtualization** — `useTileGridVirtualizer` returns the visible band/item indexes from `03-02`.
6. **Anchor preservation** — `useAnchorPreservation` restores the first visible item/offset after a geometry-key change.
7. **Scroll helpers** — `scrollToItem`, `scrollToIndex`, `scrollToOffset`, `scrollToSelected`.
8. **Handle** — `useImperativeHandle(ref, () => ({ selectAll, clearSelection, scrollToSelected }))`.
9. **Render state** — root props, classes, unique items, item lookup, geometry, visible indexes, empty node, stable click handler, and the app’s `renderItem` prop passed to the cell.
10. **Memoized cell** — `TileGridItemView` receives item/rect/label/selected/selectable/disabled/render/click props; with a stable `renderItem` identity only the cell whose `selected` changes re-renders. ST-49 verifies the affected-cell `renderItem` count.

The hook should be split into the internal hooks listed above so no file grows past the reviewable size.

## DOM and list semantics

```tsx
<div
  {...rootProps}
  ref={rootRef}
  role="list"
  aria-label={ariaLabel}
  className={mergeClasses(classes.root, rootProps.className)}
  style={{ ...componentStyle, ...rootProps.style }}
>
  {empty ? (
    renderEmpty ? (
      renderEmpty()
    ) : (
      <div className={classes.empty}>{strings.emptyMessage}</div>
    )
  ) : (
    <>
      <div className={classes.spacer} style={{ height: geometry.totalHeight }} aria-hidden="true" />
      {visibleItems.map(rect => (
        <TileGridItemView
          key={rect.id}
          rect={rect}
          item={uniqueItems[rect.index]}
          index={rect.index}
          setSize={uniqueItems.length}
          tileSize={normalized.tileSize}
          selected={selection.isSelected(rect.id)}
          selectable
          disabled={false}
          label={getItemLabel(uniqueItems[rect.index])}
          renderItem={renderItem}
          onItemClick={stableItemClick}
          className={classes.item}
        />
      ))}
    </>
  )}
</div>
```

- The spacer is presentation-only; the item wrappers are direct `listitem` children.
- `TileGridItemView` is an internal `React.memo` cell. It renders the `listitem` wrapper and calls `renderItem` with the Phase A args; it is not exported from the package root.
- `onItemClick` is stable via `useCallback`; `renderItem` is the app’s prop. A stable `renderItem` identity (`useCallback`) is required for the affected-cell optimization; an unstable identity re-renders all visible cells (the app’s choice). The tests use a stable spy. Item, rect, and label props are stable for a virtual range. A selection change updates only the affected cell, satisfying RD-03’s render-counter criterion (PF-005; ST-49).
- `aria-setsize` is the unique item count; `aria-posinset` is one-based.
- `getItemLabel` supplies the listitem's accessible name. The application's content may add its own controls/labels.
- The empty state is inside the named root; `renderEmpty()` wins over `strings.emptyMessage`. A blank/whitespace message falls back to `'No items'`.
- The root's accessible name comes from `ariaLabel` or the native `aria-labelledby`. A development warning fires when neither is present.
- The root is the scroll container; the application supplies a bounded height (AR #6).

### Memoized item cell

```ts
interface TileGridItemViewProps<T> {
  rect: TileGridItemRect;
  item: T;
  index: number;
  setSize: number;
  tileSize: number;
  selected: boolean;
  selectable: boolean;
  disabled: boolean;
  label: string;
  renderItem: (args: TileGridItemRenderArgs<T>) => React.ReactNode;
  onItemClick: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  className?: string;
}
```

`TileGridItemView` is a module-level `React.memo` component. `onItemClick` is stable via `useCallback`; `rect`/`item`/`label` are stable for a virtual range. `renderItem` is the app’s prop; the grid documents that a stable identity (`useCallback`) is required for the affected-cell optimization, and an unstable identity re-renders all visible cells. The cell renders the `listitem` wrapper and calls `renderItem` with the Phase A args. Because only the affected cell’s `selected` prop changes when the renderer is stable, a selection toggle re-renders only that mounted cell (ST-49); the parent does not call `renderItem` for every visible tile.

## Click selection

`renderTileGrid` attaches `applyItemClick` to each item wrapper. The guard and mapping live in `03-03`; Phase A behavior:

- `selectionMode='none'` (default): click is ignored for selection.
- `selectionMode='single'`: plain/Ctrl/Cmd click selects or keeps the selected item; radio semantics, no deselect by clicking.
- `selectionMode='multiselect'`: plain click replaces with the clicked ID; Ctrl/Cmd toggles; Shift selects the anchor-to-target range.
- Clicks on buttons, links, inputs, selects, textareas, menu items, checkboxes, radios, switches, contenteditable elements, or `[data-tile-grid-interactive]` do not select.
- The click handler never calls `preventDefault` or `stopPropagation`.
- `onSelectionChange` fires only when the set changes, never on mount/prop/items change.

## Styles

`useTileGridStyles.styles.ts` uses `makeStyles` with Fluent tokens only:

- `root`: `position: relative`, `overflow: auto`, `height: 100%`, `minHeight: 0`, `boxSizing: border-box`, `padding: 0`.
- `spacer`: `position: relative`, `width: 100%`, `pointerEvents: none`.
- `item`: `position: absolute`, `boxSizing: border-box`, `minWidth: 0`, `minHeight: 0`.
- `empty`: centered flex, `padding` from spacing tokens, `color: tokens.colorNeutralForeground2`, `fontSize: tokens.fontSizeBase300`, `lineHeight: tokens.lineHeightBase300`, `textAlign: center`.

The application's `renderItem` content owns its own colors, radii, and media styles. The grid does not impose a card look.

## Empty state and strings

- `strings?: Partial<TileGridStrings>`; Phase A has only `emptyMessage`.
- Default `{ emptyMessage: 'No items' }`.
- `strings` merges key by key; a blank/whitespace `emptyMessage` falls back to the default.
- `renderEmpty()` wins when supplied.
- The empty state is rendered inside the `role="list"` root. It is not a fake listitem.

## Handle

`TileGridHandle` exposes `selectAll`, `clearSelection`, and `scrollToSelected`. The handle is created with `useImperativeHandle`; it uses the current selection store and internal scroll helper. `selectAll` is multiselect-only; single/none are no-ops with the store's development warning. `clearSelection` clears hidden IDs too. `scrollToSelected` scrolls to the first selected item in current item order; no selected item is a no-op.

## Dev warnings

`devWarnings.ts` provides:

```ts
function devWarn(key: string, message: string): void;
function resetDevWarningsForTests(): void;
```

- Guarded by `process.env.NODE_ENV !== 'production'`.
- Deduplicated by `key` so StrictMode/re-renders do not spam.
- Messages never include item labels, image URLs, item IDs, or selected IDs (RD-01/RD-02 security; PF-009).
- Duplicate-ID warnings use a generic message and a non-identifying dedupe key.
- Warnings: duplicate `getItemId`, `minTileSize > maxTileSize`, `columns` on justified, no `ariaLabel`/`aria-labelledby`, single-mode seed >1, `selectAll` in single/none.
- `resetDevWarningsForTests` is internal, not package-root exported.

## Stories

`TileGrid.stories.tsx` has the `Components/TileGrid` title, the component, `tags: ['autodocs']`, and a docs description with a manual checklist (layouts, scroll performance, tile-size anchor, empty, selection). Scenario files under `stories/`:

- `TileGridLayouts.story.tsx` — fixed, masonry, justified, mosaic with a small shared fixture; selected border when selected.
- `TileGridControlledTileSize.story.tsx` — local `useState(160)` and a Fluent slider/buttons; updates `tileSize`; fixed-height wrapper; demonstrates anchor preservation.
- `TileGridEmpty.story.tsx` — `items={[]}`, default `strings.emptyMessage` and `renderEmpty`.
- `TileGridSelection.story.tsx` — controlled multiselect, plain/Ctrl/Shift clicks, a ref with Select all/Clear buttons, selected border; no selection controls (RD-03).
- `TileGridTwentyThousandBenchmark.story.tsx` — the named `TwentyThousandBenchmark` story, 20K fixture, fixed 900px wrapper, data-URL images, visible labels; the benchmark fixture is shared with browser/perf tests.

The full photo-library recipe (toolbar, search, filter, actions, preview) is RD-04; it is not part of this story set.

## Package surface and documentation

Update `src/index.ts` with:

```ts
export { TileGrid } from './components/TileGrid';
export type {
  TileGridHandle,
  TileGridItemRenderArgs,
  TileGridLayout,
  TileGridProps,
  TileGridSelectionMode,
  TileGridStrings,
} from './components/TileGrid';
```

Update `test/package-exports.spec.test.ts`:

- Add `'TileGrid'` to the runtime export list, keeping the sorted order.
- Import the Phase A types and compile a `TileGridProps<{ id: string; label: string }>` value, a `TileGridItemRenderArgs` value, a `TileGridHandle` value, `TileGridLayout`, `TileGridSelectionMode`, and `TileGridStrings`.
- The full final pin (`TileGridItem`, etc.) stays deferred.

Update the package README with an **internal Phase A** `TileGrid` section:

- Mark the section “Phase A — unreleased; v1 pending RD-03/RD-04” (or defer the public README update to v1). Phase A does not authorize a publish/tag (PF-001).
- Install note: `@tanstack/react-virtual` is a direct dependency, installed with the package; no peer addition.
- Scroll contract: the grid root is the scroll container; wrap it in a sized parent or pass a native `style` height.
- Four layouts, aspect ratio/fallback, `columns`, `gap`, `tileSize` bounds, controlled `tileSize` (no built-in zoom controls in Phase A).
- Selection basics: `selectionMode` default `none`; controlled/uncontrolled IDs; plain/Ctrl/Cmd/Shift clicks; handle methods.
- Performance: use a stable `renderItem` identity (`useCallback`) so the memoized item cell can skip unaffected tiles; an unstable renderer re-renders all visible cells.
- Empty state and `strings.emptyMessage`; `renderEmpty`.
- List semantics and `ariaLabel`/`aria-labelledby`.
- The 20K benchmark story and the Phase A limitations (no focus/keyboard/selection controls yet; RD-03 follows). The public release waits for the final contract freeze.

## Integration points

- `03-01` supplies `computeGeometry` and the geometry result; the component normalizes items, calls the engine, and maps `itemRects` to memoized `TileGridItemView` cells.
- `03-02` supplies container measurement, the virtualizer range, anchor preservation, and the scroll helpers.
- `03-03` supplies the selection store, click mapping, handle methods, and the staged marquee controller. The component implements `TileGridGeometryPort` from the current geometry and root so RD-03 can mount the controller.
- `03-05` supplies the browser/perf configs, fixture, jsdom stubs, scripts, and CI jobs.
- The memoized cell is the renderer boundary that lets RD-03 add focus/keyboard/controls without reworking geometry or store contracts; ST-49 proves one toggle calls `renderItem` only for the affected mounted cell.
- The Phase A component does not import RD-04 shell/action/drag types; those arrive with the RD-04 plan.

## Error handling

| Error case                                     | Handling strategy                                          | AR Ref                    |
| ---------------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| No `ariaLabel` and no `aria-labelledby`        | Development warning; root still renders                    | RD-02, AR #13             |
| `renderItem` throws                            | Do not catch; the application error surfaces through React | Standards                 |
| `getItemId`/`getItemLabel` throws              | Do not catch; application callback error                   | Standards                 |
| Duplicate IDs                                  | First occurrence wins; development warning                 | RD-02                     |
| Empty items                                    | `renderEmpty()` or `strings.emptyMessage`                  | RD-02                     |
| Root not measured                              | Spacer `0`, no items; wait for observer                    | AR #6                     |
| Caller overrides the scroll container style    | Caller owns the override; README documents the contract    | AR #6                     |
| Selection click on interactive content         | Ignore selection                                           | AR #3                     |
| `selectAll` in single/none                     | No-op + development warning                                | AR #23                    |
| Module evaluation accesses `window`/`document` | ST-46 node import smoke fails; keep module scope DOM-free  | RD-02 AC 16, PF-002       |
| Selection change re-renders all visible cells  | ST-49 fails; inspect `TileGridItemView` memoization/props  | RD-03 performance, PF-005 |

## Testing requirements

- Public layout spec: list/listitem semantics, empty state, `strings.emptyMessage`, `ariaLabel`/`aria-labelledby`, duplicate IDs, invalid numeric warnings, render args, and hostile text rendering (ST-44). The spec is the immutable oracle; the ST-44 no-ID-logging/no-fetch half is asserted in `test/tile-grid-layout.impl.test.tsx`.
- Public selection spec: controlled/uncontrolled, click mapping, hidden IDs, no mount callback, handle methods, interactive guard.
- Node import smoke: import the package/`TileGrid` in `test/tile-grid-ssr.spec.test.ts` with `// @vitest-environment node`; no `renderToString` (ST-46).
- Browser: four layouts, 20K mounted count, anchor preservation, scrollToSelected, image count; renderer DOM-read/offscreen (ST-48); 20K public selection proxy (ST-47).
- Render count: one selection toggle calls `renderItem` only for the affected mounted cell; mounted count unchanged (ST-49).
- Type/export pin: Phase A runtime and type exports.
- Storybook: all Phase A stories render without console errors; the 20K story builds. Final Phase A check (2026-10-21): 11 stories, axe WCAG A/AA clean, no console errors.
