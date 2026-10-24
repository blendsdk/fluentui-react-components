# Recipe and Package Surface: TileGrid RD-04

> **Document**: 03-03-recipe-and-package.md
> **Parent**: [Index](00-index.md)

## Overview

This document owns the 20K photo-library recipe, the Storybook story sets, the README updates, and
the package surface that RD-04 completes. The recipe proves the component composition; the package
surface makes the completed contract reachable from the package root.

## 20K Photo-Library Recipe

### Story Placement

| File                                                             | Export                                        | Purpose                                                    |
| ---------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `src/components/TileGrid/stories/TileGridPhotoLibrary.story.tsx` | `PhotoLibraryRecipe`                          | Renderable composition used by Storybook and browser tests |
| `src/components/TileGrid/stories/TileGridDrag.story.tsx`         | `Drag`                                        | Auto-scroll and drop indicator across all four layouts     |
| `src/components/TileGrid/stories/TileGrid.stories.tsx`           | re-exports                                    | Adds both stories to the existing workbench                |
| `src/components/TileGridItem/stories/TileGridItem.stories.tsx`   | `AllSlots`, `States`, `Actions`, `DragHandle` | Shell documentation                                        |

`PhotoLibraryRecipe` is a component export so `test/browser/tile-grid-recipe.browser.test.tsx` can
mount the exact story composition instead of a parallel fixture.

### State and Data

- Items start as `createTileGridFixture(20_000)` from `test/fixtures/tileGridFixture.ts`.
- The order is application state: `orderedItems` starts as the fixture and is replaced from
  `onReorder`'s `orderedIds` by mapping IDs back to items.
- Filter state is `query` (label search) and `orientation` (`all`, `portrait`, `square`,
  `landscape`, derived from the fixture aspect ratio).
- Selection is seeded with two known IDs and stays controlled through `selectedIds` /
  `onSelectionChange`.
- `scrollResetKey` is the filter signature (`query` plus `orientation`).
- `tileSize` is controlled between 120 and 320; toolbar buttons change it, and the grid's keyboard
  zoom reports through `onTileSizeChange`.
- Arranging is enabled only while both filters are empty. `reorderDisabled` is true otherwise.

### Composition

```text
Toolbar
├── SearchBox            label filter
├── Dropdown             orientation filter
├── Button zoom out      decrements tileSize by 20, clamped
├── Button zoom in       increments tileSize by 20, clamped
├── Text                 "<n> selected"
└── Button clear         ref.clearSelection()

TagGroup                 active filters, dismissible

TileGrid
├── items                filtered ordered items
├── selectionMode        multiselect
├── enableMarquee        true
├── reorderable          true
├── reorderDisabled      !arrangingEnabled
├── strings              reorder and selection strings
├── onReorder            apply orderedIds
├── onItemActivate       open the preview dialog
└── renderItem           TileGridItem shell

Dialog                   application-owned preview
```

### Tile Content

`renderItem` forwards only the shell-relevant arguments to `TileGridItem`; the layout arguments
stay with the application:

```tsx
function renderPhotoTile(args: TileGridItemRenderArgs<TileGridFixtureItem>): ReactElement {
  const {
    item,
    selected,
    selectable,
    disabled,
    isDragging,
    isOverlay,
    dragHandleProps,
    reorderActions,
    strings,
  } = args;

  return (
    <TileGridItem
      item={item}
      selected={selected}
      selectable={selectable}
      disabled={disabled}
      isDragging={isDragging}
      isOverlay={isOverlay}
      dragHandleProps={dragHandleProps}
      reorderActions={reorderActions}
      strings={strings}
      media={
        <img
          src={item.thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          width={item.width}
          height={item.height}
        />
      }
      title={item.label}
      description={`${item.width} × ${item.height}`}
      badges={<Badge appearance="tint">{orientationOf(item)}</Badge>}
      actions={[{ id: 'preview', label: 'Preview', icon: <EyeRegular />, onSelect: openPreview }]}
      overflowActions={[
        { id: 'favorite', label: 'Favorite', icon: <StarRegular />, onSelect: toggleFavorite },
      ]}
    />
  );
}
```

The recipe demonstrates app-owned actions only. It does not add actor-specific actions to the
package. The favorite state is local story state and is reflected in a badge.

### Images and Requests

- The fixture provides five deterministic data-URL SVG thumbnails, so the recipe is offline.
- Images use `loading="lazy"`, `decoding="async"`, explicit `width`/`height`, and empty `alt`
  because the tile label is the accessible name.
- No `srcSet`/`sizes` is used because the fixture has one size. The README states the rule for
  applications that have multiple sizes.
- The browser test counts mounted `img` elements, not network requests: with data URLs the request
  boundary is the number of mounted images. The count must stay below 120 per layout.

### Preview Boundary

`onItemActivate` opens a Fluent `Dialog` containing the image, the label, and a close action.
The dialog is application-owned; the package contains no lightbox, upload, or editing surface.
Closing the dialog returns focus according to Fluent Dialog behavior.

### Filtering and Arranging

- Typing or changing orientation replaces `items` and advances `scrollResetKey`; the grid scrolls
  to the top and keeps selected IDs.
- While filtered, `reorderDisabled` removes handles, listeners, and the keyboard reorder actions.
- Clearing both filters restores arranging.
- An empty result shows the grid's empty state and the toolbar remains usable.

## Drag Story

`TileGridDrag.story.tsx` renders a bounded-height frame with enough items to scroll. It provides a
layout dropdown for `fixed`, `masonry`, `justified`, and `mosaic`, keeps a local order, and enables
arranging. The story's manual checklist covers:

1. A handle starts a drag; the rest of the tile does not.
2. The source tile stays in place with reduced opacity.
3. The overlay follows the pointer and shows the tile content without actions or a handle.
4. The 2px indicator moves between tiles and to the collection end.
5. Dragging into the top or bottom 24px auto-scrolls and stops at drop or cancel.
6. Escape cancels without a callback.

## TileGridItem Stories

`TileGridItem.stories.tsx` renders the shell outside a grid with a fixed-size frame. Named exports:

| Export       | Covers                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| `AllSlots`   | Media, title, description, badges, status overlay, selection indicator |
| `States`     | Default, selected, non-selectable, disabled, dragging, overlay         |
| `Actions`    | Inline actions, icon-only labels, overflow actions, danger intent      |
| `DragHandle` | Default handle, custom render prop, absent handle                      |

The stories are documentation, not a second test suite. Behavior assertions stay in the spec and
browser tests.

## README Updates

The TileGrid section keeps the unreleased banner until the release commit. Within the section:

- Add the arranging contract: `reorderable`, `reorderDisabled`, `onReorder`, handle, overlay,
  indicator, auto-scroll, cancel, keyboard Move up / Move down, and the shared announcement.
- Add the `TileGridItem` contract: every slot, state prop, action model, menu order, touch
  reachability, accessible names, and drag-handle replacement.
- Document the string keys and their English defaults.
- Document the photo-library recipe: filter ownership, `scrollResetKey`, selection persistence,
  preview boundary, image attributes, URL validation ownership, and arranging while filtered.
- Update the dependency notes: `@dnd-kit/core` is a direct dependency; React, Fluent UI, and React
  Hook Form stay peers.
- Replace the current “later work” notes with the shipped behavior, but do not claim an npm release
  before the freeze step.

## Package Surface

### Exports

`src/components/TileGrid/index.ts` adds:

```ts
export type {
  TileGridAction,
  TileGridDragHandleProps,
  TileGridReorderArgs,
} from './TileGrid.types';
```

`src/components/TileGridItem/index.ts` exports the component and its props type.
`src/index.ts` adds:

```ts
export { TileGrid } from './components/TileGrid';
export type {
  TileGridAction,
  TileGridDragHandleProps,
  TileGridHandle,
  TileGridInteractionMode,
  TileGridItemRenderArgs,
  TileGridLayout,
  TileGridProps,
  TileGridReorderArgs,
  TileGridSelectionMode,
  TileGridStrings,
} from './components/TileGrid';
export { TileGridItem } from './components/TileGridItem';
export type { TileGridItemProps } from './components/TileGridItem';
```

Runtime keys in `test/package-exports.spec.test.ts` gain `TileGrid` and `TileGridItem`. The same file
adds compile-time checks for every new type, including a wrong-generic rejection for
`TileGridItemProps`.

### Declaration Build

`tsconfig.build.json` currently excludes `src/components/TileGrid/**` and
`src/components/TileGridItem/**`. Removing both exclusions in Phase 3 makes
the declaration build emit the TileGrid and TileGridItem modules, so `dist/index.d.ts` resolves the
new exports. Story files remain excluded by the existing patterns. TypeScript also emits declarations
for internal TileGrid modules that the public barrel does not re-export; the package `exports` map
still exposes only the root, so deep imports remain blocked. `pack:check` continues to reject source
and story files.

### Dependency and Bundle

- Add `"@dnd-kit/core": "6.3.1"` to `packages/react-components/package.json` dependencies.
- Update `pnpm-lock.yaml` through the package manager, not by hand.
- Add `/^@dnd-kit\//` to the Vite external list so the dependency stays a single application copy.
- No peer dependency changes.

## Security Boundary

| Concern                           | Handling                                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Server-side input validation      | N/A — this is a client-only component library. Action labels, ids, and item labels render as React text; blank labels fall back to ids. |
| Injection                         | No `innerHTML`, `eval`, or `dangerouslySetInnerHTML`. Media is a React node; the package never parses HTML or URLs.                     |
| Authentication and authorization  | N/A — the application supplies only authorized actions and media and owns URL allowlisting.                                             |
| Rate limiting                     | N/A — no endpoint or transport is introduced.                                                                                           |
| Secrets                           | None stored, read, or logged.                                                                                                           |
| Encryption at rest and in transit | N/A — the package stores and transmits no data.                                                                                         |
| Error responses                   | No server responses. Application callback errors propagate to the application.                                                          |
| Infrastructure hardening          | N/A — no container, deployment, or CI change.                                                                                           |

## Error Handling

| Error Case                                       | Handling Strategy                                                                         | AR Ref |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------ |
| Export target missing from the declaration build | Remove the TileGrid build exclusion; `pack:check` catches an empty or incomplete artifact | AR-4   |
| Filter produces zero items                       | Grid empty state; toolbar remains usable                                                  | AR-27  |
| Selected IDs filtered out                        | Keep IDs; the count includes hidden IDs                                                   | AR-27  |
| Preview item removed by a filter                 | Close the dialog when the previewed ID leaves the filtered set                            | AR-27  |
| `onReorder` receives a stale order               | Apply `orderedIds` by ID map; ignore unknown IDs                                          | AR-9   |
| Image fails to load                              | The application supplies the fallback; the shell keeps a neutral media background         | AR-21  |

## Testing Requirements

[07-testing-strategy.md](07-testing-strategy.md) owns the cases. The recipe needs browser coverage
for filtering, selection persistence, arranging disabled while filtered, the preview boundary, the
per-layout mounted count, and image element count. The package surface needs the export pin and the
declaration build check.
