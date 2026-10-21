# Current State: TileGrid RD-03

> **Parent**: [Index](00-index.md)
> **Baseline**: `e71d26c` (`v0.3.0`), branch `feat/tile-grid-rd-03`

## Observed Implementation

| File under `packages/react-components/`                                      | Evidence and gap                                                                                                                                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/TileGrid/TileGrid.types.ts:61–119`                           | Core/selection props exist; RD-03 props and count formatter are missing. Native root tabindex currently passes through.                                                  |
| `src/components/TileGrid/useTileGrid.ts:116–226`                             | Geometry, current IDs, click mapping, handle methods, and anchor preservation are connected. No predicates, active-ID model, key handlers, reset key, or marquee host.   |
| `src/components/TileGrid/TileGridItemView.tsx:55–87`                         | Memoized labelled list item; no focus target or selection input.                                                                                                         |
| `src/components/TileGrid/renderTileGrid.tsx:17–48`                           | Root is the scroll container and tab stop; eligibility is hardcoded.                                                                                                     |
| `src/components/TileGrid/selection/useGridSelection.ts:62–78,144–165`        | Anchor is not seeded; mode follows rerenders; deselecting via toggle does not establish the latest anchor. Required invariants need new regression specifications first. |
| `src/components/TileGrid/selection/clickSelection.ts:4–76`                   | Existing interactive-target and prevented-event guards can be reused.                                                                                                    |
| `src/components/TileGrid/marquee/createMarqueeController.ts:140–190,313–337` | Visible-window preview and guarded commit/cancel exist. Rectangle-only changes do not notify React; final commit lacks full-rectangle reconciliation.                    |
| `src/components/TileGrid/virtualization/useAnchorPreservation.ts:38–75`      | Restores the old visible anchor on geometry/list changes. An explicit reset must take precedence in the same owner.                                                      |
| `src/components/TileGrid/virtualization/useTileGridVirtualizer.ts:44–74`     | Mounts current window only. Focus needs pending-target and removal recovery.                                                                                             |
| `src/components/TileGrid/geometry/types.ts:62–73`                            | Cached rectangles and query helpers suffice for navigation and one terminal selection pass.                                                                              |
| `test/browser/tile-grid-selection.browser.test.tsx:250–285`                  | Existing render-count oracle must survive focus/control additions.                                                                                                       |

## Dependencies and Conventions

The repo uses React 19, Fluent umbrella `9.74.9`, TanStack Virtual `3.14.21`, Vitest `5.0.5`, and
the already installed Playwright browser provider. The package remains version `0.3.0`. No new
dependency or build/test configuration is needed (AR-14).

The house pattern and existing generic callable/forwardRef wrapper remain applicable. New helpers
stay internal. Documentation is mandatory for public and non-trivial internal symbols, and code
comments must not contain planning IDs.

The `fluentui` reference bundle covers umbrella `9.74.1`. References used: `components/checkbox.md`,
`components/radio.md`, `foundation/accessibility.md`, and `index.md`. Standalone controlled Radio
is not covered by that skill's RadioGroup-only guidance; the installed public type and
`react-radio/lib/components/Radio/useRadio.js:39–75` explicitly accept native `checked` and `name`.
The focus challenger also verified installed Tabster group behavior rather than guessing API support.

## Verification Baseline

The previous release handoff recorded 541 unit tests, 18 Chromium browser tests, 11 performance
tests, green full CI, Storybook, and pack verification. Those are historical baseline evidence.
The first verification attempt in this planning session was cancelled by the server restart;
fresh results must be recorded before the planning run completes.

`pnpm` is installed through Node under `~/.nvm/versions/node/v24.21.0/bin`; that directory must be
on the shell PATH in this environment. The repository pins pnpm `12.11.2` through `packageManager`.

## Risks and Controls

| Risk                                                                    | Control                                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Native radio tab behavior skips an unchecked active radio               | Explicit wrapper-to-owned-input focus; three-browser oracle.                                     |
| React and tab-index suppression write the same attributes               | Local observer write isolation, current author intent, cleanup tests; AR-13.                     |
| A pending virtual focus target is mistaken for an unmounted active item | Explicit pending target before scrolling, resolved on ref mount; AR-13.                          |
| Reset, anchor restoration, and focus scroll compete                     | Reset priority in the existing anchor owner; focus uses `preventScroll`; 03-02.                  |
| Controlled parent rejects or replaces a marquee selection               | Preview separate from store, cancellation uses latest authority, terminal equality guard; 03-03. |
| Focus/control state rerenders every tile body                           | Stable event/ref functions and separately memoized content; existing render-count oracle.        |
| Repeated pointer frames scan all items                                  | Mounted-window preview and one full final geometry pass; AR-10.                                  |
| Plan silently weakens earlier tests or publishes unfinished types       | Additive specifications, existing oracle unchanged, final package-surface checks; AR-3/AR-14.    |
