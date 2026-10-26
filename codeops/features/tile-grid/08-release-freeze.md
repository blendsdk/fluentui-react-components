# TileGrid Release Freeze Evidence

> **CodeOps Artifact Schema**: 1
> **Verified**: 2026-10-26
> **Scope**: RD-02 final composed contract, export pin, dependency set, package artifact, and
> the 0.4.0 release freeze.
> **Decision**: Per-module ESM output; 0.4.0 minor release; freeze and merge now, publication
> is a separate release workflow dispatch.

The [feature roadmap](00-roadmap.md) and the [execution plans](plans/v1/00-index.md) remain the
task-progress authorities. This document records the final gate that closes RD-02 and settles
the package surface that RD-03 and RD-04 completed.

## Final Contract

The public contract is one composed generic surface:

- `TileGrid<T>` and `TileGridItem<T>` are exported from the package root.
- `TileGridProps<T>` carries the final RD-02 layout, measurement, virtualization, controlled-size,
  selection, focus, marquee, reorder, activation, and strings fields.
- `TileGridItemProps<T>`, `TileGridAction<T>`, `TileGridDragHandleProps`,
  `TileGridItemRenderArgs<T>`, `TileGridReorderArgs`, `TileGridHandle`, `TileGridLayout`,
  `TileGridSelectionMode`, `TileGridInteractionMode`, and `TileGridStrings` are exported from the
  package root.
- Geometry, virtualizer, selection store, marquee controller, focus helpers, reorder internals,
  and tile-shell internals stay private. The package `exports` map exposes only `dist/index.js`
  and `dist/index.d.ts`.

The package-surface oracle is `test/package-exports.spec.test.ts`; the built-output oracle is
`test/tile-grid-integration.spec.test.tsx`.

## RD-02 Acceptance

| #   | Acceptance criterion                                                                 | Evidence                                                                                                                        |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Every layout mounts fewer than 120 wrappers on the 20K fixture                       | `test/perf/tile-grid.perf.test.tsx`; measured fixed 64, masonry 72, justified 50, mosaic 45; browser layout window bound tests  |
| 2   | Hand-computed rectangles and no-overlap/bounds/order invariants, no generated oracle | `test/tile-grid-geometry.spec.test.ts`, `test/tile-grid-geometry.impl.test.ts`, `test/tile-grid-layout.spec.test.tsx`           |
| 3   | Fixed columns and aspect-ratio-derived row height                                    | `test/tile-grid-geometry.spec.test.ts` explicit fixed-column case                                                               |
| 4   | Masonry shortest-lane placement and bounded vertical window                          | `test/tile-grid-geometry.spec.test.ts`, `test/tile-grid-virtualizer.impl.test.tsx` 20K masonry parity                           |
| 5   | Justified rows fill width; last row stays at target height                           | `test/tile-grid-geometry.spec.test.ts` justified case                                                                           |
| 6   | Mosaic 2x2 spans, invalid-span clamping, columns honored, justified warning          | `test/tile-grid-geometry.spec.test.ts`, `test/tile-grid-geometry.impl.test.ts`, `test/tile-grid-layout.spec.test.tsx`           |
| 7   | Invalid intrinsic ratios use the fallback without image measurement                  | `test/tile-grid-geometry.spec.test.ts` ratio fallback and normalization cases                                                   |
| 8   | Layout or size change preserves the first visible item and offset                    | `test/tile-grid-keyboard-zoom.spec.test.tsx`, `test/tile-grid-layout.spec.test.tsx`, `test/tile-grid-integration.spec.test.tsx` |
| 9   | Internal scroll helpers work; public handle exposes only the three methods           | `test/tile-grid-virtualizer.impl.test.tsx`, `test/tile-grid-integration.spec.test.tsx`                                          |
| 10  | Empty state prefers `renderEmpty`, then custom text, then `No items`                 | `test/tile-grid-layout.spec.test.tsx`                                                                                           |
| 11  | 20K geometry recomputation stays under 200ms                                         | `test/perf/tile-grid.perf.test.tsx` geometry p95 assertions                                                                     |
| 12  | Scrolling mounts only the window and performs no per-item DOM reads                  | `test/perf/tile-grid.perf.test.tsx`, `test/browser/tile-grid-layout.browser.test.tsx`                                           |
| 13  | Only mounted tiles request images                                                    | `test/browser/tile-grid-layout.browser.test.tsx`, `test/browser/tile-grid-recipe.browser.test.tsx`                              |
| 14  | Zoom is controlled; no uncontrolled or default size                                  | `test/tile-grid-keyboard-zoom.spec.test.tsx`, `test/browser/tile-grid-focus.browser.test.tsx`                                   |
| 15  | Invalid numerics, spans, IDs, and duplicate IDs normalize safely                     | `test/tile-grid-geometry.spec.test.ts`, `test/tile-grid-layout.spec.test.tsx`                                                   |
| 16  | No injection, URL/image fetching, unsafe logging, or module-evaluation browser use   | `test/tile-grid-layout.spec.test.tsx`, `test/tile-grid-integration.spec.test.tsx`, `test/tile-grid-ssr.spec.test.ts`            |
| 17  | Complete package-root export and export pin                                          | `test/package-exports.spec.test.ts`, `test/tile-grid-integration.spec.test.tsx`                                                 |

## Dependencies and Artifact

- `@dnd-kit/core` 6.3.1 and `@tanstack/react-virtual` 3.14.21 are direct dependencies and are
  externalized by the build.
- React, React DOM, React Hook Form, `@fluentui/react-components`,
  `@fluentui/react-datepicker-compat`, and `@fluentui/react-icons` remain peers.
- The build emits per-module ESM under `dist/`; the package root remains a single entry and deep
  imports stay blocked.
- A `Loading`-only consumer build measures 3.4 kB raw / 1.35 kB gzip and contains no TileGrid or
  `@dnd-kit` reference. The former single bundle measured about 29.4 kB gzip with TileGrid.
- `pnpm pack:check` inventories 500 files in a dry run: the public runtime and declaration files,
  both skills, and no source or story files. The guard now requires the TileGrid and TileGridItem
  runtime and type files, and keeps `@dnd-kit` behind the TileGrid modules. Published source maps
  embed original source for debugging; they are generated assets, not source files in the pack list.

## Final Gate

| Gate                    | Result                                                             |
| ----------------------- | ------------------------------------------------------------------ |
| `pnpm verify`           | 872 tests, 77 files; format, skills, type-check and build pass     |
| `pnpm test:browser`     | 130 Chromium tests                                                 |
| `pnpm test:browser:all` | 390 tests across Chromium, Firefox and WebKit                      |
| `pnpm test:perf`        | 17 tests                                                           |
| `pnpm storybook:build`  | Successful; TileGrid and TileGridItem stories remain indexed       |
| `pnpm pack:check`       | 500 files; required dist surface present; no source or story files |

## Release Metadata

- Published npm latest: `0.3.0`; tag `v0.3.0`.
- Release target: `0.4.0` minor, selected by the release workflow's conventional-commit analysis.
- `main` is an ancestor of the feature branch; the branch lands by fast-forward merge.
- No publish, release dispatch, or tag is part of this freeze. Publication remains an explicit
  release decision.

## Known Limitation

The published declarations use extensionless relative specifiers and target
`moduleResolution: "bundler"`. A `nodenext` consumer with `skipLibCheck: false` reports
extension errors. This predates the 0.4.0 freeze and is documented in the package README;
it is not a blocker for the release.
