# TileGrid Phase A Implementation Plan

> **Feature**: Generic Fluent UI v9 tile collection — geometry, four layouts, 20K virtualization, selection foundation, and internal marquee engine
> **Status**: Done — Phase A (internal; RD-03/RD-04 pending, release gate held)
> **Created**: 2026-10-20 20:07
> **Last Updated**: 2026-10-21 11:19
> **Implements**: tile-grid/RD-01, tile-grid/RD-02
> **CodeOps Artifact Schema**: 1

## Overview

This plan delivers the foundation of `TileGrid<T>`: a pure geometry engine for fixed, masonry, justified, and mosaic layouts; a virtualized, scroll-container-based renderer that mounts fewer than 120 item wrappers at 20K items; controlled `tileSize` with anchor preservation; a shared 20K benchmark fixture; and the RD-01 selection store plus marquee controller.

It also adds the minimal public selection wiring needed to exercise RD-01: controlled and uncontrolled selected IDs, plain/Ctrl/Cmd/Shift click mapping, and a small imperative handle. Focus, keyboard navigation, selection controls, live announcements, the marquee overlay, arranging, the tile shell, and the full photo-library recipe remain for the RD-03 and RD-04 plans.

The plan is intentionally a Phase A plan. RD-02's final public contract and export pin are completed by the later plans; this plan implements only the behavior it can test end to end. Phase A is internal and does not authorize publishing the TileGrid surface until the final contract freeze (PF-001).

## Minimum-Sufficient Baseline

**Original goal:** A reusable Fluent UI v9 tile grid that lays out 20K items with four layouts and stays responsive while scrolling, resizing, and changing tile size.

**Smallest viable design:** One pure geometry engine, one TanStack Virtual range calculator over geometry-produced bands/items, one `TileGrid` component that owns a scroll container, and one internal selection store. Reuse the existing house pattern (`TileGrid.tsx`, types, state hook, render function, Griffel styles), the existing Vitest/Storybook/CI setup, and the approved `@tanstack/react-virtual` dependency. No custom virtualization framework, no second browser runner, no CSS-grid masonry approximation.

**Excluded machinery:** No new design system, state manager, animation framework, or public geometry API. No `@dnd-kit/core` until RD-04. No separate Playwright test runner. No full SSR render harness; a minimal node-environment import smoke is in scope for RD-02 AC 16 (PF-002).

**Approved complexity:** AR #7 (TanStack lane assignment with a geometry parity test), AR #9 (browser matrix plus performance job), AR #10 (separate browser/perf configs), AR #18 (pinned dependencies and Vite externals). The RD-01/RD-02/RD-03 split and the staged marquee controller are recorded in AR #1–AR #4.

## Phase A Scope

**In this plan:** RD-02 core, RD-01 selection store and marquee controller, minimal RD-03 selection wiring, the browser/performance harness, the 20K benchmark story, and the Phase A package surface.

**Deferred:** RD-03 focus/keyboard/accessibility/marquee overlay/filtering, RD-04 arranging/shell/actions/full recipe, the full final `TileGridProps`/export pin, `zoomable`/`onTileSizeChange`, and `@dnd-kit/core`. See [01-requirements.md](01-requirements.md) for the delta view.

## Domain Lenses

The requirements README selects two lenses; this plan carries both.

| Lens                                                 | Selected | Evidence                                                                                                                                                                                                         |
| ---------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web application                                      | ✅       | Browser UI collection with virtualized layout, selection, list semantics, accessibility, image rendering, and 20K interaction performance.                                                                       |
| Data and migration                                   | ✅       | Replaces the consuming application's v8 `TilesList`/`ActorTile` contract, preserves seeded selection and order across filters/pages, and adds a new public component API alongside the existing package surface. |
| Compiler/language, financial, distributed/concurrent | —        | No parser, ledger, queue, replica, or background worker.                                                                                                                                                         |

**Compatibility boundary:** the package stores no persistent data and performs no migration. The consuming application owns the v8 `TilesList`/`ActorTile` replacement, persisted selection/order mapping, and rollback. There is no v8 compatibility layer inside the package; the package's compatibility surface is its public component API. Phase A is internal; the TileGrid surface is not part of a public release.

## Release and Contract Freeze

Phase A is an internal delivery phase for the TileGrid surface, not a v1 public release. No `@blendsdk/fluentui-react-components` publish, release tag, or release-workflow dispatch may include the TileGrid surface until RD-03 and RD-04 are complete and the final composed contract is frozen. The package may release its other components while the TileGrid surface stays internal.

- The final `TileGridProps<T>`, `TileGridStrings`, `TileGridItemRenderArgs`, export pin, and full runtime dependency set (`@tanstack/react-virtual` + `@dnd-kit/core`) are finalized in the RD-03/RD-04 plans.
- The Phase A package README section is marked “Phase A — unreleased” (or the public README update waits for v1); the TileGrid package-root export stays closed until the final freeze.
- Phase 6 task 6.3.3 verifies this gate. The Phase A `pnpm pack:check` is an artifact guard, not release authorization.
- The release gate is owned by the v1 planning/preflight; it is not a substitute for the RD-03/RD-04 plans.

## Partial RD Coverage

| RD    | Phase A coverage                                                                                                                        | Deferred                                                                                                                                                                                       |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RD-01 | Selection store, click mapping, handle methods, internal marquee controller                                                             | Grid-level marquee overlay/pointer host and integration tests (RD-03)                                                                                                                          |
| RD-02 | Core geometry, four layouts, virtualization, controlled `tileSize`, anchor, empty state, list semantics, Phase A stories, 20K benchmark | `zoomable`/`onTileSizeChange` (RD-03); full final contract, RD-04 shell/reorder types, full export pin (RD-03/RD-04)                                                                           |
| RD-03 | Minimal selection wiring: modes, controlled/uncontrolled IDs, click mapping, handle, list semantics, selected render args               | Selection controls, roving focus, keyboard, announcements, `isSelectable`/`isDisabled`, `interactionMode`, `enableMarquee`, overlay, `onItemActivate`, `scrollResetKey`, filtering persistence |
| RD-04 | None                                                                                                                                    | Tile shell, actions, drag/reorder, full recipe                                                                                                                                                 |

The `Implements` line names the RD baseline this plan is based on; the partial coverage above is authoritative. The minimal RD-03 subset is plan-local and does not advance the RD-03 roadmap row.

## Document Index

| #     | Document                                                              | Description                                                                    |
| ----- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| AR    | [Ambiguity Register](00-ambiguity-register.md)                        | Zero-Ambiguity Gate decisions and the confirmed Phase A scope (audit trail)    |
| 00    | [Index](00-index.md)                                                  | This document — overview, baseline, decisions, specialist check                |
| 01    | [Requirements](01-requirements.md)                                    | Phase A delta view: in scope, deferred, plan-local decisions, acceptance       |
| 02    | [Current State](02-current-state.md)                                  | Existing component patterns, affected files, gaps, dependencies, risks         |
| 03-01 | [Geometry Engine](03-01-geometry-engine.md)                           | Pure layout types, normalization, four strategies, geometry port               |
| 03-02 | [Virtualization and Scrolling](03-02-virtualization-and-scrolling.md) | Scroll container, TanStack integration, masonry parity, anchor, scroll helpers |
| 03-03 | [Selection and Marquee](03-03-selection-and-marquee.md)               | RD-01 store, click mapping, handle methods, staged marquee controller          |
| 03-04 | [TileGrid Component](03-04-tile-grid-component.md)                    | Public types, DOM/list semantics, styles, stories, package surface             |
| 03-05 | [Test Harness and Performance](03-05-test-harness-and-performance.md) | Browser/perf configs, scripts, CI jobs, fixture, stubs, budgets                |
| 07    | [Testing Strategy](07-testing-strategy.md)                            | ST cases, test file map, fixtures, verification checklist                      |
| 99    | [Execution Plan](99-execution-plan.md)                                | Phases, steps, task checklist, dependencies, success criteria                  |

## Quick Reference

### Usage

```tsx
import { useCallback, useState } from 'react';
import { TileGrid } from '@blendsdk/fluentui-react-components';
import type { TileGridItemRenderArgs } from '@blendsdk/fluentui-react-components';
import type { Photo } from './photos';

export function PhotoGrid({ photos }: { photos: readonly Photo[] }) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [tileSize, setTileSize] = useState(160);

  // Keep renderItem stable so the memoized item cell can skip unaffected tiles.
  const renderItem = useCallback(
    ({ item, selected: isSelected }: TileGridItemRenderArgs<Photo>) => (
      <img
        src={item.thumbnailUrl}
        alt={item.title}
        loading="lazy"
        decoding="async"
        style={{ outline: isSelected ? '2px solid #0f6cbd' : undefined }}
      />
    ),
    []
  );

  return (
    <div style={{ height: 600 }}>
      <TileGrid
        items={photos}
        getItemId={photo => photo.id}
        getItemLabel={photo => photo.title}
        getItemAspectRatio={photo => photo.width / photo.height}
        layout="masonry"
        tileSize={tileSize}
        selectionMode="multiselect"
        selectedIds={selected}
        onSelectionChange={setSelected}
        strings={{ emptyMessage: 'No photos' }}
        renderItem={renderItem}
      />
    </div>
  );
}
```

The grid root is the scroll container. The application supplies a sized parent or a native `style` height; the 20K story uses a fixed-height wrapper.

### Key Decisions

| Decision        | Outcome                                                                                                                                    | Ref                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| Phase A target  | RD-02 core + RD-01 selection/marquee + minimal RD-03 selection wiring; RD-03/RD-04 remainder deferred                                      | AR #1                        |
| Public contract | Phase A internal subset; RD-03/RD-04 extend; no public TileGrid release until the final contract freeze                                    | AR #2, PF-001                |
| Selection       | Controlled/uncontrolled IDs, plain/Ctrl/Cmd/Shift clicks, handle methods; no controls/focus/keyboard yet                                   | AR #3                        |
| Renderer        | Memoized item cells; stable `renderItem` identity; one selection change re-renders only the affected mounted cell                          | PF-005                       |
| Marquee         | Controller built and tested internally; overlay/host in RD-03                                                                              | AR #4                        |
| Zoom            | Controlled `tileSize` only; `zoomable`/`onTileSizeChange` in RD-03                                                                         | AR #5                        |
| Scroll          | Grid root is the scroll container; application sizes it                                                                                    | AR #6                        |
| Masonry         | TanStack `lanes` + geometry parity test                                                                                                    | AR #7                        |
| Geometry        | Pure layout strategies; band virtualization for fixed/justified/mosaic; item/lane for masonry                                              | AR #12                       |
| Tests           | jsdom unit, Chromium browser per task, full matrix + performance in CI; node import smoke, 20K selection, DOM-read/offscreen, render-count | AR #9, AR #10, PF-002–PF-005 |
| Dependencies    | `@tanstack/react-virtual` 3.14.21; browser/perf dev dependencies; `vitest` pinned 5.0.5; dnd-kit later                                     | AR #18, PF-008               |
| Release         | No public TileGrid release/tag until RD-03/RD-04 complete and the final contract/export pin/dependency set is frozen                       | PF-001                       |
| Domain lenses   | Web application + Data and migration; no v8 compatibility layer inside the package                                                         | PF-006                       |
| Partial RDs     | RD-02 AC 14/17 and RD-03 controls/focus/keyboard remain preflighted; see Partial RD Coverage                                               | PF-007                       |

## Specialist Agents

**None** — the capability-gap check ran against this repository's evidence and found no gap a standing specialist would close.

_Detection evidence: the package already carries the `fluentui-components` skill, the `rhf-zod-forms` skill, and dynamic plan packets; `AGENTS.md` records the specialist check as up to date with no specialist warranted; the plan's own 03 documents carry the Fluent UI/TanStack conventions; no recurring review findings or isolated large-context capability justify a new role. The base lenses (`correctness`, `maintainability`, `standards`) plus the per-phase add-ons (`api-surface`, `perf`) cover this work._

## Quality Profile

The repository sets `quality.independentReview: true`, `minimumReviewers: 1`, and `stopOnMajorFinding: true` in `codeops/codeops.json`. Every executed phase gets an independent phase review; the phase-level `Lenses` lines add `api-surface` to the contract/selection phases and `perf` to the geometry/virtualization/performance phases. The `performance` phase also dispatches the performance auditor when code changes. No security auditor is required: the component accepts no URLs, performs no fetch, and has no auth surface; the security acceptance criteria are covered by the phase reviewer, including the no-label/URL/item-ID/selected-ID logging rule (PF-009). Domain lenses: **Web application** + **Data and migration** (see Domain Lenses); the package is not a v8 migration layer, and the release/contract-freeze gate is PF-001.

## Related Files

**Create**

- `packages/react-components/src/components/TileGrid/` — component, types, state hook, render, styles, index
- `packages/react-components/src/components/TileGrid/TileGridItemView.tsx` — internal memoized item cell (PF-005)
- `packages/react-components/src/components/TileGrid/geometry/` — pure layout engine and geometry port
- `packages/react-components/src/components/TileGrid/virtualization/` — TanStack integration and band/lane types
- `packages/react-components/src/components/TileGrid/selection/` — RD-01 selection store
- `packages/react-components/src/components/TileGrid/marquee/` — RD-01 marquee controller
- `packages/react-components/src/components/TileGrid/devWarnings.ts`
- `packages/react-components/src/components/TileGrid/stories/` — `TileGrid.stories.tsx` and scenario files
- `packages/react-components/test/tile-grid-*.spec.test.tsx` / `*.impl.test.tsx`
- `packages/react-components/test/tile-grid-ssr.spec.test.ts` — node-environment import smoke (PF-002)
- `packages/react-components/test/browser/tile-grid-*.browser.test.tsx` — layout/selection/virtualization
- `packages/react-components/test/perf/tile-grid.perf.test.tsx`
- `packages/react-components/test/fixtures/tileGridFixture.ts`
- `packages/react-components/vitest.browser.config.ts`
- `packages/react-components/vitest.browser-matrix.config.ts`
- `packages/react-components/vitest.perf.config.ts`

**Modify**

- `package.json` (root command wrappers)
- `packages/react-components/src/index.ts`
- `packages/react-components/test/package-exports.spec.test.ts`
- `packages/react-components/test/setup.ts`
- `packages/react-components/vitest.config.ts`
- `packages/react-components/tsconfig.json`
- `packages/react-components/vite.config.ts`
- `packages/react-components/package.json`
- `packages/react-components/README.md`
- `README.md` (root commands table)
- `.github/workflows/ci.yml`
- `turbo.json`
- `pnpm-lock.yaml` (through `pnpm install`; never hand-edited)
