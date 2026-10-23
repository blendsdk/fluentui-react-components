# Testing Strategy: TileGrid RD-04

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type                      | Target |
| ------------------------------ | ------ |
| Reorder model and pure helpers | 90%    |
| Tile shell state and actions   | 90%    |
| Grid integration and rendering | 80%    |
| Storybook recipe and stories   | 60%    |

- Test names state behavior: `should [expected behavior] when [condition]`.
- Browser tests use the existing Vitest browser mode and Playwright provider. No new runner or
  harness is introduced.
- Drag input uses Playwright mouse movement with intermediate steps so pointer events and collision
  updates run as they do for a user.
- The shared 20K fixture is the only data source; no network requests are made.

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

> These cases derive from RD-04, the component specs, and the Ambiguity Register. They are the
> immutable oracle: a failure means the implementation is wrong.

### Reorder behavior

| #     | Input / Scenario                                                      | Expected Output / Behavior                                                                                                                | Source                              |
| ----- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| ST-1  | `reorderable` omitted or false                                        | No drag handle, reorder menu action, overlay, indicator, or reorder announcement renders                                                  | RD-04 AC1                           |
| ST-2  | `reorderable` true and `reorderDisabled` true                         | No handle, listener, overlay, indicator, or keyboard reorder action renders                                                               | RD-04 AC2                           |
| ST-3  | `reorderable` true without `onReorder`                                | No handle or reorder action renders; one development warning is emitted                                                                   | AR-12                               |
| ST-4  | Drag the item at index 5 to before the item at index 2                | `onReorder` fires once with `{ itemId, fromIndex: 5, toIndex: 2, orderedIds }`; ordered IDs match the moved order; selection is unchanged | RD-04 AC3                           |
| ST-5  | Drop an item at its current index                                     | No `onReorder` call and no announcement                                                                                                   | RD-04 AC3, AR-10                    |
| ST-6  | Press Escape during a drag                                            | No `onReorder` call; the order is unchanged; the drag surface clears                                                                      | RD-04 AC4                           |
| ST-7  | Release the pointer, then dispatch `lostpointercapture`               | The committed order stays; `onReorder` fired once                                                                                         | RD-04 AC4                           |
| ST-8  | Drag across an insertion boundary                                     | A 2px vertical line appears before and after row-flow tiles and at the collection end                                                     | RD-04 AC5                           |
| ST-9  | Drag across a masonry lane boundary                                   | A 2px horizontal line appears before and after tiles in the lane                                                                          | RD-04 AC5, AR-8                     |
| ST-10 | Drag within 24px of the bottom edge                                   | `scrollTop` increases while the pointer stays in the zone; scrolling stops at drop                                                        | RD-04 AC6                           |
| ST-11 | Drag within 24px of the top edge                                      | `scrollTop` decreases while the pointer stays in the zone; scrolling stops at cancel                                                      | RD-04 AC6                           |
| ST-12 | Repeat the index-5-to-2 drag in fixed, masonry, justified, and mosaic | Every layout reports the same payload shape and final order                                                                               | RD-04 AC8                           |
| ST-13 | Keyboard Move down on index 2 of 20                                   | `onReorder` reports index 3; the live region reads `Moved to position 4 of 20`                                                            | RD-04 AC7                           |
| ST-14 | Keyboard Move up at index 0                                           | The action is disabled; no callback and no announcement                                                                                   | RD-04 AC7                           |
| ST-15 | Keyboard Move down at the last index                                  | The action is disabled; no callback and no announcement                                                                                   | RD-04 AC7                           |
| ST-16 | `reorderDisabled` true                                                | The overflow menu contains no Move up or Move down entry                                                                                  | RD-04 AC2, AC7                      |
| ST-17 | Pointer-down on an action button                                      | No drag starts; no marquee starts; the tile is not activated                                                                              | RD-04 AC9                           |
| ST-18 | Pointer-down on the selection control                                 | No drag starts; no marquee starts; selection behavior is unchanged                                                                        | RD-04 AC9                           |
| ST-19 | Drag an item while three items are selected                           | The selection set is byte-for-byte unchanged                                                                                              | RD-04 AC3                           |
| ST-20 | Drag start                                                            | The source tile has reduced opacity; the portal copy has no actions and no handle                                                         | RD-04 §Drag overlay                 |
| ST-21 | Drop outside the grid bounds                                          | The insertion clamps to the nearest collection boundary and fires a normal `onReorder` if the index changes                               | AR-10                               |
| ST-22 | Successful drop or keyboard move                                      | The shared polite region shows the reorder position; a later selection change replaces the message                                        | RD-04 AC7, AR-13                    |
| ST-23 | Item is disabled by `isDisabled`                                      | No handle and no reorder actions render for that item                                                                                     | RD-04 §Opt-in, §Application disable |

### Tile shell

| #     | Input / Scenario                                      | Expected Output / Behavior                                                                                                                          | Source                     |
| ----- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| ST-24 | Render every documented slot                          | Media, title, description, badges, actions, overflow actions, selection indicator, status overlay, and drag handle appear in the documented regions | RD-04 AC10                 |
| ST-25 | Choose an action for an item                          | `onSelect` receives the original item exactly once                                                                                                  | RD-04 AC10                 |
| ST-26 | Pass `children` through the shell                     | The type rejects it and no second content channel is rendered                                                                                       | RD-04 §Tile content        |
| ST-27 | Click an inline action on a selected tile             | The action runs once; selection and drag state do not change                                                                                        | RD-04 AC10                 |
| ST-28 | Render an action with an icon and no visible text     | The button has the action label as its accessible name                                                                                              | RD-04 AC11                 |
| ST-29 | Render an action with a blank label                   | The visible and accessible label is the action `id`                                                                                                 | RD-04 AC11                 |
| ST-30 | Render the drag handle                                | Its accessible name contains the item label                                                                                                         | RD-04 AC11                 |
| ST-31 | Supply a custom `dragHandle`                          | The render prop receives the library listeners, node ref, attributes, dragging state, disabled state, and label                                     | RD-04 AC11                 |
| ST-32 | Simulate a touch or `hover: none` environment         | Inline actions are not visible; every `actions` entry is present in the overflow menu                                                               | RD-04 AC12, AR-5           |
| ST-33 | Supply actions, overflow actions, and reorder actions | Menu order is actions, then overflow actions, then reorder actions                                                                                  | AR-5, RD-04 §Tile shell    |
| ST-34 | Mark the shell disabled                               | The root has `aria-disabled="true"`; actions are disabled; no handle or menu actions render                                                         | RD-04 §State props         |
| ST-35 | `selected` true and `selectable` true                 | The default selection badge renders                                                                                                                 | RD-04 §Selection indicator |
| ST-36 | `selected` true and `selectable` false                | The selection badge is absent                                                                                                                       | RD-04 §State props         |
| ST-37 | Supply a status overlay with a button                 | The overlay sits above media; only its interactive descendants receive pointer events                                                               | RD-04 §Status overlay      |
| ST-38 | Supply `fit="contain"` and a valid `aspectRatio`      | Descendant media uses `object-fit: contain` and the container uses the ratio                                                                        | RD-04 §State props         |
| ST-39 | Supply an invalid `aspectRatio`                       | The media ratio falls back to 1                                                                                                                     | RD-04 §State props         |
| ST-40 | Render the overlay copy                               | Actions and the drag handle are absent; pointer events are ignored                                                                                  | RD-04 §Drag overlay        |
| ST-41 | Supply a `danger` action                              | Inline and menu entries use the red foreground token                                                                                                | RD-04 §Action model        |
| ST-42 | Open the overflow menu                                | The trigger is named by `strings.moreActions`; focus returns to the trigger after an action                                                         | RD-04 §Keyboard reorder    |
| ST-43 | Supply caller `className` and `style`                 | Both merge with the shell values and the caller wins                                                                                                | RD-04 §Tile shell          |
| ST-44 | Supply native `div` props                             | They pass through; `aria-disabled` cannot be overridden                                                                                             | RD-04 §Tile shell          |

### Recipe and integration

| #     | Input / Scenario                              | Expected Output / Behavior                                                                  | Source                       |
| ----- | --------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------- |
| ST-45 | Type into the recipe SearchBox                | `items` shrink to matching labels, `scrollResetKey` advances, and seeded selection persists | RD-04 AC13                   |
| ST-46 | Choose an orientation filter                  | Only matching aspect ratios remain; selection persists; the scroll position resets          | RD-04 AC13, AR-27            |
| ST-47 | Activate a filter                             | `reorderDisabled` is true; no handle or keyboard reorder renders                            | RD-04 AC13                   |
| ST-48 | Clear every filter                            | Arranging is enabled again                                                                  | RD-04 AC13                   |
| ST-49 | Activate a tile                               | The app-owned preview dialog opens with the item image and label                            | RD-04 AC13                   |
| ST-50 | Measure the recipe at 1440×900 in each layout | Fewer than 120 tiles are mounted                                                            | RD-04 AC14                   |
| ST-51 | Count mounted recipe images on first paint    | The count stays below 120 and every image has `loading="lazy"`                              | RD-04 AC14, §Image rendering |
| ST-52 | Filter to an empty result                     | The grid empty state renders; the toolbar remains usable                                    | AR-27                        |
| ST-53 | Remove the previewed item through a filter    | The preview closes without an error                                                         | AR-27                        |
| ST-54 | Reorder the unfiltered recipe                 | The story applies `orderedIds`; the new order survives a re-render                          | AR-9                         |

### Package surface and security

| #     | Input / Scenario                                            | Expected Output / Behavior                                                           | Source            |
| ----- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------- |
| ST-55 | Import the package root                                     | Runtime exports include `TileGrid` and `TileGridItem` and no internal module         | AR-4              |
| ST-56 | Import every documented TileGrid type from the package root | The type check compiles, including a rejected wrong-generic `TileGridItemProps`      | AR-4              |
| ST-57 | Build declarations                                          | `dist/index.d.ts` and the TileGrid declaration files exist; `pnpm pack:check` passes | AR-4              |
| ST-58 | Build the library bundle                                    | `@dnd-kit` imports stay external                                                     | AR-3              |
| ST-59 | Server-render TileGrid and TileGridItem                     | Module evaluation and rendering succeed without browser globals                      | AR-29             |
| ST-60 | Render a hostile action label                               | The text renders as text; no HTML is parsed and no URL is logged                     | RD-04 AC16, AR-32 |
| ST-61 | Invoke an action through the menu                           | The callback fires once                                                              | RD-04 AC16        |
| ST-62 | Pointer-down on the drag handle                             | No marquee starts; no tile activation occurs                                         | RD-04 AC9         |

## Test Categories

### Specification Tests

| Test File                                        | ST Cases Covered                                              | Component                                         |
| ------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------- |
| `test/tile-grid-reorder.spec.test.tsx`           | ST-1..ST-5, ST-13..ST-16, ST-19, ST-22, ST-23                 | Reorder props, actions, announcements             |
| `test/browser/tile-grid-drag.browser.test.tsx`   | ST-4, ST-6..ST-12, ST-17, ST-18, ST-20, ST-21                 | Pointer drag in a real browser                    |
| `test/tile-grid-item.spec.test.tsx`              | ST-24..ST-29, ST-33..ST-39, ST-41, ST-43, ST-44, ST-60, ST-61 | Tile shell                                        |
| `test/browser/tile-grid-item.browser.test.tsx`   | ST-30..ST-32, ST-37, ST-40, ST-42, ST-62                      | Handle, touch reachability, menu focus, isolation |
| `test/browser/tile-grid-recipe.browser.test.tsx` | ST-45..ST-54                                                  | Photo-library recipe                              |
| `test/tile-grid-item-ssr.spec.test.ts`           | ST-59                                                         | Shell SSR                                         |
| `test/package-exports.spec.test.ts`              | ST-55..ST-57                                                  | Export pin and types                              |

### Implementation Tests

| Test File                              | Description                                                                                                     | Priority |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| `test/tile-grid-reorder.impl.test.tsx` | Insertion math, boundary conversion, payload derivation, auto-scroll speed, RAF start/stop, shared announcement | High     |
| `test/tile-grid-item.impl.test.tsx`    | Label fallback, menu composition, aspect-ratio normalization, attribute filtering                               | Medium   |

### Integration Tests

| Test                | Components                   | Description                                                     |
| ------------------- | ---------------------------- | --------------------------------------------------------------- |
| Reorder + selection | TileGrid, selection store    | Drag and keyboard moves leave selection untouched               |
| Reorder + focus     | TileGrid, focus controller   | Handle and menu actions participate in tab order                |
| Shell + reorder     | TileGrid, TileGridItem       | Default handle and menu actions render from grid args           |
| Recipe + filtering  | PhotoLibraryRecipe, TileGrid | Filtering, reset key, selection persistence, disabled arranging |

### End-to-End Tests

N/A. The browser suite mounts the real components under the real Playwright engine and is the
project's end-to-end boundary; no separate application harness exists.

## Test Data

### Fixtures Needed

- `test/fixtures/tileGridFixture.ts`: deterministic 20K items with data-URL thumbnails.
- A small ordered fixture for drag payloads (10 items, known labels).
- A tile-shell fixture with one item and representative action/overflow/reorder arrays.
- A recipe filter fixture with known portrait, square, and landscape items.

### Mock Requirements

- No network mocks: the fixture uses data URLs.
- Spy on `console.warn` to assert the missing-callback warning once.
- Use the real Fluent components and the real dnd-kit dependency.
- Use Playwright mouse input; no synthetic dnd-kit event shortcuts.

## Verification Checklist

- [ ] All specification test cases (ST-*) are defined with concrete input/output pairs
- [ ] Every ST case traces to RD-04, a 03 document, or an AR entry
- [ ] Specification tests are written before implementation and verified to fail
- [ ] Specification tests pass after implementation
- [ ] Implementation tests cover edge cases and internals
- [ ] `pnpm verify` passes
- [ ] `pnpm test:browser` and `pnpm test:browser:all` pass
- [ ] `pnpm test:perf` shows no regression
- [ ] `pnpm storybook:build` passes
- [ ] `pnpm pack:check` passes
- [ ] No regressions in the existing 793 unit tests
