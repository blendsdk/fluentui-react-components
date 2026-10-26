# Requirements: TileGrid RD-04

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-04](../../requirements/RD-04-arranging-tile-shell-and-actions.md) — the OWNING requirements document

## Scope of this plan (delta view)

### In this plan

- RD-04 Must Have, arranging: opt-in `reorderable`, `reorderDisabled`, single-item handle drag,
  all four layouts, overlay, no live reflow, drop indicator, auto-scroll, `onReorder`, selection
  isolation, cancel and pointer-capture ordering, keyboard Move up / Move down, and the polite
  reorder announcement.
- RD-04 Must Have, shell: `TileGridItem` with all named slots and state props, media container,
  inline and overflow actions, the action model, accessible names, status overlay, selection
  indicator, and no hardcoded domain actions.
- RD-04 Must Have, integration: the 20K photo-library story, image guidance, app-owned preview,
  filter-disabled arranging, browser verification, Storybook, README, and the package surface.
- RD-04 Should Have: the drag story across all four layouts.

### Deferred / out of this plan

- Every RD-04 Won't Have item stays out: multi-item or cross-grid drag, drag while filtered,
  built-in lightbox/upload/editing, hardcoded CastingAppMT actions, touch long-press drag, RTL, and
  server persistence.
- npm publication and version bump are not part of this plan. RD-04 leaves the package export
  surface complete; the dependency and pack freeze remains a separate release step.
- The portfolio roadmap is not synchronized while this work stays on a feature branch.

## Plan-local decisions

| Decision                   | Chosen                                                              | AR Ref |
| -------------------------- | ------------------------------------------------------------------- | ------ |
| Branch                     | `feat/tile-grid-rd-04` from the RD-03 HEAD                          | AR-2   |
| Package-root export timing | Complete TileGrid + TileGridItem surface at RD-04 completion        | AR-4   |
| Overflow reachability      | Always duplicate `actions` into the menu                            | AR-5   |
| Auto-scroll speed          | Proportional 4–18 px/frame within the 24px edge zone                | AR-6   |
| Inline action presentation | Icon-only when an icon exists, text otherwise                       | AR-7   |
| Drop indicator             | 2px accent line, orientation by layout                              | AR-8   |
| Missing `onReorder`        | Arranging disabled; one development warning                         | AR-12  |
| Announcement channel       | One polite region shared by selection and reorder                   | AR-13  |
| Insertion lookup           | Mounted droppable rectangles, nearest by clamped distance           | AR-17  |
| Verification               | `pnpm verify` plus the browser matrix, performance, Storybook, pack | AR-30  |

## Acceptance Criteria

RD-04 owns acceptance criteria 1–17. This plan adds only:

1. [x] Every RD-04 acceptance criterion 1–17 is covered by at least one spec test or browser test in `07-testing-strategy.md`.
2. [x] The package export pin contains the complete TileGrid and TileGridItem surface and no internal module.
3. [x] `pnpm verify`, `pnpm test:browser`, `pnpm test:browser:all`, `pnpm test:perf`, `pnpm storybook:build`, and `pnpm pack:check` pass.
4. [x] No dependency beyond `@dnd-kit/core` 6.3.x is added, and it is externalized in the Vite build.
5. [x] README and both Storybook story sets document the shipped behavior without referencing planning artifacts.
