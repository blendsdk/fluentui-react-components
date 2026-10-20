# tile-grid — Requirements Documents

> **Feature**: tile-grid — a generic Fluent UI v9 collection component for viewing, selecting, filtering, arranging, and zooming profile pictures and photos at 20K-item scale
> **Status**: Preflighted — accepted fixes applied
> **Created**: 2026-10-20
> **Architecture**: React 19, Fluent UI v9, TypeScript, Griffel with design tokens, direct dependencies `@tanstack/react-virtual` and `@dnd-kit/core`, Vitest + Testing Library + Vitest browser mode with Playwright, Storybook 10
> **CodeOps Artifact Schema**: 1

---

## Overview

`TileGrid` is the Fluent UI v9 replacement for CastingAppMT's `TilesList` and `ActorTile`
pattern. The old implementation renders every tile, loads images through CSS backgrounds, couples
tile content to a Fluent UI v8 `Selection` object, and has no zoom or arranging pipeline. At 20K
thumbnails it is both slow and difficult to extend.

The new component is a generic collection engine with four layout strategies:

- **Fixed** — uniform tiles in rows.
- **Masonry** — fixed column width with variable item heights.
- **Justified** — variable-width rows at a target height.
- **Mosaic** — a dense base grid with optional 2×2 spans.

All four modes share one geometry engine, one virtualizer, one selection model, one focus model,
and optional marquee, drag arranging, and tile-size zoom. The grid is presentation-only: the
application owns data, filtering, sorting, persistence, image authentication, the lightbox, and
tile actions.

## Minimum-Sufficient Baseline

**Original goal:** replace the slow v8 tile grid with a v1 component that supports 20K items, four
layouts, seeded single/multi selection, optional marquee, optional single-item drag reorder,
optional tile-size zoom, and a configurable tile shell with actions.

**Smallest viable design:** four RDs covering the generic selection/marquee internals, the layout
and virtualization engine, selection/focus/accessibility integration, and drag plus tile
presentation. The component uses `@tanstack/react-virtual` for virtualization, `@dnd-kit/core` for
drag sensors, and one browser test runner for real geometry.

**Excluded support machinery:** no server-side data fetching, no built-in filter toolbar, no
built-in lightbox, no upload transport, no multi-item drag, no touch-specific marquee or pinch
gestures, no RTL sweep, no SSR, no saved views, no image editing, and no v8 compatibility inside
the package.

**Approved complexity:** AR #11 — the simplified packet keeps two direct dependencies
(`@tanstack/react-virtual`, `@dnd-kit/core`, externalized in the Vite build) and one browser runner,
and keeps the generic selection/marquee modules internal rather than public.

## Domain Lenses

| Lens                     | Selected | Evidence                                                                                                                                                                           |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web application**      | ✅        | Browser UI collection with selection, focus, keyboard, announcements, responsive layout, image loading, and 20K-item performance.                                                  |
| **Data and migration**   | ✅        | Replaces the v8 `TilesList` contract, preserves seeded selection and order across filters/pages, and introduces a new public component API alongside the existing package surface. |
| Compiler / language      | —        | No grammar, parser, IR, codec, or evaluator.                                                                                                                                       |
| Financial system         | —        | No money, balances, pricing, or ledger concepts.                                                                                                                                   |
| Distributed / concurrent | —        | Client-side rendering only; no queues, replicas, or background workers.                                                                                                            |

**Data-and-migration boundary:** the package stores no persistent data and performs no migration. The consuming
application owns the v8 `TilesList`/`ActorTile` replacement, including any persisted selection or
order mapping and its rollback path. The package's compatibility surface is the public component API;
there is no v8 compatibility layer inside the package. The public-package concerns (API surface,
dependencies, bundle behavior, stories, and README) are covered by the public-contract and dependency
requirements rather than a separate lens.

## Domain Glossary

| Term                      | Definition                                                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TileGrid**              | The public collection component that owns layout, virtualization, selection integration, focus, optional marquee, optional drag, and optional zoom.                    |
| **TileGridItem**          | The optional built-in tile shell with media, title, description, badges, actions, overflow actions, selection indicator, status overlay, and drag handle slots.        |
| **Layout mode**           | One of `fixed`, `masonry`, `justified`, or `mosaic`.                                                                                                                   |
| **tileSize**              | The mode-specific density value: tile width/height in fixed mode, column width in masonry, target row height in justified, and base cell size in mosaic.               |
| **Aspect ratio**          | Intrinsic item width divided by height; required for masonry, justified, and mosaic layout stability.                                                                  |
| **Span**                  | A mosaic item's optional column/row footprint, limited to 2×2.                                                                                                         |
| **Band / lane**           | A virtualized row (fixed, justified, mosaic) or a packing column (masonry). Masonry virtualization uses a vertical item window across lanes, never whole columns.      |
| **Selection seed**        | Selected IDs supplied by the application before or after items load; the grid never discards unknown IDs.                                                              |
| **Interaction mode**      | `browse` (click opens, Ctrl/Shift selects) or `select` (click selects, double-click/Enter opens).                                                                      |
| **Anchor**                | The item ID from which Shift range selection extends.                                                                                                                  |
| **Marquee**               | Optional pointer-drag rectangular selection; pointer-only, with keyboard range selection as the accessible equivalent.                                                 |
| **Drag handle**           | The dedicated control that starts single-item reordering.                                                                                                              |
| **Hidden selection**      | Selected IDs that are not present in the current filtered or paged `items` array.                                                                                      |
| **Reorder disabled**      | An application-controlled state that removes drag handles, listeners, and keyboard reorder actions while a filter or other constraint is active.                       |
| **Scroll reset key**      | An application-supplied value that resets the scroll position only when it changes; used to distinguish a filter change from a page append.                            |
| **Strings**               | Partial `TileGridStrings` overrides for the empty message, selection count, reorder position, drag-handle label, and Move up/Move down labels; English defaults apply. |
| **Fallback aspect ratio** | The configured ratio used when an item has no intrinsic dimensions; avoids measuring 20K images on load.                                                               |

## Document Index

| #         | Document                                                                                              | Description                                                                                                               | Depends On                                     |
| --------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **AR**    | [Ambiguity Register](00-ambiguity-register.md)                                                        | Zero-Ambiguity Gate decisions and complexity approval (audit trail)                                                       | —                                              |
| **PF**    | [Preflight Report](00-preflight-report.md)                                                            | Accepted audit findings, resolutions, and the applied-fix verification                                                    | RD-01..RD-04                                   |
| **RD-01** | [RD-01 — Selection and marquee internals](RD-01-selection-and-marquee.md)                             | Internal controlled selection model, range selection, marquee geometry, and commit/cancel rules                           | RD-02 (geometry port); RD-03 integration tests |
| **RD-02** | [RD-02 — TileGrid layout and virtualization](RD-02-layout-and-virtualization.md)                      | Four layout strategies, geometry engine, internal geometry port, 20K virtualization, image contract, and controlled zoom  | —                                              |
| **RD-03** | [RD-03 — Selection integration, focus, and accessibility](RD-03-selection-focus-and-accessibility.md) | Seeded selection integration, interaction modes, keyboard model, list semantics, announcements, and filtering persistence | RD-01, RD-02                                   |
| **RD-04** | [RD-04 — Arranging, tile shell, and actions](RD-04-arranging-tile-shell-and-actions.md)               | Optional single-item drag reorder, tile shell slots, inline/overflow actions, and the 20K photo-library recipe            | RD-02, RD-03                                   |

## Dependency Graph

```text
RD-02 (geometry port + layout + virtualization + zoom)
  ├── RD-01 (selection + marquee internals; consumes the geometry port)
  │     └── RD-03 (selection integration, focus, accessibility)
  │           └── RD-04 (drag + tile shell + actions)
  └── RD-03
        └── RD-04
```

RD-02 defines the internal geometry port and can start first. RD-01 can proceed in parallel once the
port is named, using synthetic rectangles in its unit tests; its grid-level marquee tests live in
RD-03. RD-03 joins the two, and RD-04 builds on the layout geometry and the selection/focus contract.

## Suggested Implementation Order

| Phase                              | Documents    | Description                                                                                                          |
| ---------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------- |
| **A: Core geometry and selection** | RD-02, RD-01 | Name the geometry port first (RD-02), then layout/virtualization and selection/marquee internals in parallel.        |
| **B: Selection integration**       | RD-03        | Seeded selection, interaction modes, keyboard, list semantics, announcements, `scrollResetKey`, marquee integration. |
| **C: Arranging and presentation**  | RD-04        | Drag reorder, tile shell, actions, touch/overflow fallback, keys, 20K photo-library recipe and browser verification. |

All phases are release-blocking for v1. The phases are internal delivery order, not a partial
public release.

## Key Architecture Decisions

| Decision          | Choice                                                            | Rationale                                                                                                                          | AR Ref         |
| ----------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Layout engine     | Four strategies over one geometry contract                        | Fixed, masonry, justified, and mosaic need different packing but share selection, marquee, drag, zoom, and virtualization.         | AR #3          |
| Rendering scale   | Vertical item window with `@tanstack/react-virtual`               | 20K items cannot mount; geometry owns masonry lane assignment and the virtualizer consumes it.                                     | AR #4, AR #11  |
| Selection         | Controlled IDs first; seeded IDs preserved                        | CastingAppMT almost always seeds selection; item objects are not stable selection identity.                                        | AR #6          |
| Interaction       | Configurable `browse`/`select` modes                              | The current app supports both single- and double-click behaviour depending on selection mode.                                      | AR #5          |
| Marquee           | Optional, multi-select only, geometry-driven                      | Not every grid needs it; DOM-centric marquee libraries do not fit virtualized mixed layouts.                                       | AR #6          |
| Drag              | Optional, handle-based, single item, linear order                 | Whole-tile drag conflicts with selection, activation, and inner actions; the library owns the handle wiring through a render prop. | AR #7, PF-006  |
| Zoom              | Optional, controlled `tileSize`, no built-in toolbar              | The application owns density controls and persistence; the grid owns geometry and anchoring.                                       | AR #8          |
| Tile presentation | Generic `TileGridItem` shell plus `renderItem`                    | Supports a consistent casting tile and arbitrary custom content.                                                                   | AR #9          |
| Accessibility     | List semantics with checkbox/radio controls and roving focus      | Masonry, justified, and mosaic have no stable row/column model; list semantics keep selection and actions honest.                  | AR #15         |
| Public contract   | One composed `TileGridProps<T>` and full export pin               | Spec tests compile against one contract; no cross-RD type drift.                                                                   | PF-002         |
| Filtering reset   | Explicit `scrollResetKey`                                         | Distinguishes a filter change from a page append; array identity cannot.                                                           | PF-005         |
| Dependencies      | Direct `@tanstack/react-virtual` + `@dnd-kit/core`; no `sortable` | Implementation details stay with the package; both are externalized and declared in `dependencies`.                                | AR #11, PF-011 |
| Test harness      | Vitest browser project + separate performance job                 | jsdom cannot verify drag, marquee, zoom anchoring, or virtualization geometry; browser and perf gates are separate.                | AR #11, AR #12 |

## Traceability

- The feature target and v1 completeness follow AR #1 and AR #2.
- The four-RD decomposition follows AR #17.
- Image URL ownership, PII handling, and rendering safety follow AR #18 and PF-008: the component
  accepts no URLs; the application owns URL allowlisting, authenticated image access, and image
  attributes.
- Dependency, browser-test, and internal-module boundaries follow AR #11 and PF-004/PF-011.
- App-owned filtering and the `scrollResetKey` contract follow AR #10 and PF-005.
- The accepted preflight resolutions are recorded in `00-preflight-report.md` (PF-001..PF-018) and
  are reflected in the RD text.

## Quality and Verification

| Surface              | Requirement                                                                                                                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Specification tests  | Public contracts get requirement-derived `*.spec.test.tsx` files written before implementation: `tile-grid-layout`, `tile-grid-selection`, `tile-grid-focus-a11y`, `tile-grid-item`, and `tile-grid-reorder`. A failing spec test means the implementation is wrong.                                                                                         |
| Implementation tests | Geometry, selection state, focus math, and marquee internals get `*.impl.test.tsx` coverage; RD-01's selection transitions live in `tile-grid-selection.impl.test.tsx` and its marquee geometry in `tile-grid-marquee.impl.test.tsx`. The jsdom setup provides a controllable `ResizeObserver` stub; real pointer capture is covered in the browser project. |
| Browser tests        | `test/browser/**/*.browser.test.tsx` runs through `pnpm test:browser` with `@vitest/browser-playwright` and Playwright installed. Chromium, Firefox, and WebKit projects cover drag, marquee, zoom anchoring, mounted counts, and image requests.                                                                                                            |
| Performance          | `pnpm test:perf` uses the shared 20K fixture and records p95 selection toggle (target under 16ms), geometry recompute (under 200ms), frame timing (target 60fps), and per-layout mounted wrappers (under 120). Filter timing is application-owned.                                                                                                           |
| Storybook            | `TileGrid.stories.tsx` covers all four layouts, controlled zoom, empty, and the named `TwentyThousandBenchmark` story; `TileGridItem.stories.tsx` covers shell variants and actions. The photo-library recipe uses the same shared fixture.                                                                                                                  |
| Export pin           | `test/package-exports.spec.test.ts` pins `TileGrid`, `TileGridItem`, `TileGridProps`, `TileGridItemProps`, `TileGridAction`, `TileGridLayout`, `TileGridSelectionMode`, `TileGridInteractionMode`, `TileGridHandle`, `TileGridItemRenderArgs`, `TileGridReorderArgs`, `TileGridDragHandleProps`, and `TileGridStrings`.                                      |
| Documentation        | The package README documents props, layouts, aspect ratio requirements, app-owned images and URL validation, controlled zoom, selection, disabled items, `scrollResetKey`, drag, keyboard reorder, actions, strings/localization, and the photo-library recipe.                                                                                              |
| Full gate            | `pnpm verify`, `pnpm storybook:build`, `pnpm test:browser`, and `pnpm test:perf` pass before completion; CI runs the same sequence.                                                                                                                                                                                                                          |

## How to Use These Documents

1. Pick a requirements document, starting with RD-02 and RD-01. RD-02 names the geometry port first;
   the two can then proceed in parallel.
2. Run the `make-plan` skill for that RD; it will derive implementation tasks and spec tests.
3. Run `exec-plan` to implement the plan.
4. Verify with `pnpm verify`, `pnpm storybook:build`, `pnpm test:browser`, and `pnpm test:perf`.

## Specialist Agents

**None** — the capability-gap check found no project-specific specialist that a generic role plus
the existing `fluentui-components` skill would not already cover. The feature is a Fluent UI v9
component with established repository conventions; no recurring domain evidence supports a standing
specialist.
