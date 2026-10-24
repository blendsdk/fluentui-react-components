# Execution Plan: TileGrid RD-04

> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-10-24 23:55
> **Progress**: 27/41 tasks (66%)
> **CodeOps Artifact Schema**: 1

## Overview

Implement RD-04 on `feat/tile-grid-rd-04`: the optional reorder layer, the `TileGridItem` shell,
the 20K photo-library recipe, and the complete package surface. Read the governing 03 documents and
the ST cases at each phase; do not infer behavior from the current implementation.

Paths in task lines are relative to `packages/react-components/` unless prefixed by `codeops/`.
`03-01`, `03-02`, `03-03`, and `07` refer to the linked documents in [00-index.md](00-index.md).

## Implementation Phases

| Phase | Title                                      | Tasks |
| ----- | ------------------------------------------ | ----- |
| 1     | Reorder foundation and pointer drag        | 15    |
| 2     | Tile shell, actions, and keyboard menu     | 12    |
| 3     | Recipe, documentation, and package surface | 14    |

**Total: 41 tasks across 3 phases.** Keep tasks reviewable (normally 1–3 files, one concern).
Split a task if implementation reveals more than roughly 200 lines or three concerns; record the
new ordering here before executing the split.

> **Execution rule — single progress authority:** Update this document immediately after every
> task. On implementation mark `[~]` with `implemented: YYYY-MM-DD HH:MM`; after the appropriate
> verification passes promote to `[x]` with `completed: YYYY-MM-DD HH:MM`. Only `[x]` counts in the
> Progress header. Update that header and Last Updated each time. Resume the first `[~]`, otherwise
> the first `[ ]`. Mark a blocker `[!]` with its reason. Read timestamps from the system clock.
> Never duplicate tasks in another checklist or state file.

Each phase has three ordered sessions: specification tests and explicit red check; implementation
and green check; internal tests and hardening. A red-step result is expected evidence, not a green
verification claim. Commit handling belongs to `exec-plan`; any checkpoint uses the `git-commit`
skill with the selected execution mode.

---

## Phase 1: Reorder Foundation and Pointer Drag

> **Phase baseline tree**: `b4e2ccec38fdf32c23d2024f27a40b3fe421931c`
> **Scope mode**: strict
> **Expected modification set**: Phase 1 task paths under `packages/react-components/`, this plan's execution evidence, and the derived TileGrid roadmap status. Dependency approval is the existing requirements AR #11 packet; no new support surface.
> **Lenses**: api-surface, perf
> **Risk tags**: complex, performance-critical
> **Reasoning**: max — pointer geometry, virtualized mounting, and controlled order meet in one gesture path
> **Review**: RV-001..RV-013, PE-001..PE-004, PE-006, PE-007 and the re-review RV-101..RV-105 / PE-101 are fixed; PE-005 is deferred to Phase 3. No open critical/major findings. Evidence: [05-findings.md](05-findings.md).

### Session 1.1 — Specification Tests

**Reference:** 03-01; AR-3, AR-6, AR-9, AR-10, AR-13, AR-17, AR-18, AR-19, AR-31, AR-34; 07 ST-1–ST-23.

- [x] 1.1.1 [spec-author] Add reorder props, actions, payload, warning, and announcement oracles — `test/tile-grid-reorder.spec.test.tsx`; ST-1–ST-3, ST-5, ST-13–ST-16, ST-19, ST-22, ST-23 ✅ (completed: 2026-10-23 10:39; 12 cases, red 8 failed / 4 baseline absence passes)
- [x] 1.1.2 [spec-author] Add real-browser pointer drag, cancel, capture, indicator, auto-scroll, and layout oracles — `test/browser/tile-grid-drag.browser.test.tsx`; ST-4, ST-6–ST-12, ST-17, ST-18, ST-20, ST-21 ✅ (completed: 2026-10-23 10:39; 15 cases, red 15 failed; native provider click + stepped hover path because this runner exposes no page.mouse)
- [x] 1.1.3 Run the new targeted specs and type-check; record expected red failures and any already-passing regression cases without altering their assertions ✅ (completed: 2026-10-23 10:39; jsdom 8/4, browser 15/0, type-check 19 expected missing-reorder errors; no oracle changed)
- [x] 1.1.4 Confirm the dependency contract: `@dnd-kit/core` 6.3.1 exports `DndContext`, `useDraggable`, `useDroppable`, `PointerSensor`, and `useSensors`, and its pointer sensor cancels on Escape; record the check in the plan evidence ✅ (completed: 2026-10-23 10:40; exports present, Escape listener confirmed in the pointer sensor)

**Deliverable:** Immutable Phase 1 oracles and red evidence.
**Verify:** Targeted Vitest files and `pnpm type-check`; expected red before implementation.

### Session 1.2 — Implementation

- [x] 1.2.1 Add the approved dependency and externalization — `package.json`, `pnpm-lock.yaml`, `vite.config.ts`; 03-01 Architecture, AR-3 ✅ (completed: 2026-10-23 10:40; exact 6.3.1, frozen install passes, `@dnd-kit/` externalized)
- [x] 1.2.2 Add the public reorder types, props, strings, and render-argument fields; update the existing render-args type fixture — `src/components/TileGrid/TileGrid.types.ts`, `src/components/TileGrid/index.ts`, `test/tile-grid-selection.types.test.tsx`; 03-01 Public Contract Additions, AR-14, AR-31 ✅ (completed: 2026-10-23 10:43; type-check passes; render-arg fields are temporarily optional until the view supplies them in 1.2.7, then become required)
- [x] 1.2.3 Add pure insertion and payload helpers — `src/components/TileGrid/reorder/insertion.ts`, `src/components/TileGrid/reorder/payload.ts`, `src/components/TileGrid/reorder/types.ts`; 03-01 Insertion calculation ✅ (completed: 2026-10-23 10:46; type-check passes; insertion uses mounted rectangles and clamps to the collection)
- [x] 1.2.4 Add proportional RAF auto-scroll — `src/components/TileGrid/reorder/useAutoScroll.ts`; 03-01 Auto-scroll, AR-6 ✅ (completed: 2026-10-23 10:58; 4–18 px/frame, vertical edges, frame-by-frame insertion refresh)
- [x] 1.2.5 Add the reorder controller, shared announcement channel, and keyboard actions — `src/components/TileGrid/reorder/useTileGridReorder.ts`, `src/components/TileGrid/useLiveAnnouncement.ts`, `src/components/TileGrid/selection/useSelectionAnnouncement.ts`; 03-01 Lifecycle, Keyboard reorder, Announcement ✅ (completed: 2026-10-23 10:58; single polite channel, stable per-index actions, Escape delegated to the pointer sensor)
- [x] 1.2.6 Add the custom portal overlay and drop indicator — `src/components/TileGrid/reorder/TileGridDragOverlay.tsx`, `src/components/TileGrid/reorder/TileGridDropIndicator.tsx`, `src/components/TileGrid/useTileGridStyles.styles.ts`; 03-01 Overlay, Drop indicator, AR-34 ✅ (completed: 2026-10-23 10:58; fixed body portal, clipped indicator canvas, forced-colors line)
- [x] 1.2.7 Wire state, items, the `TileGridRoot` droppable component, and the renderer — `src/components/TileGrid/useTileGrid.ts`, `src/components/TileGrid/TileGridItemView.tsx`, `src/components/TileGrid/renderTileGrid.tsx`; 03-01 Integration Points ✅ (completed: 2026-10-23 10:58; stable merged root ref, inert hidden dnd-kit live region, render args now required)
- [x] 1.2.8 Add the missing-callback development warning and confirm arranging stays absent — `src/components/TileGrid/useTileGrid.ts`, `src/components/TileGrid/devWarnings.ts`; 03-01 Enablement, AR-12 ✅ (completed: 2026-10-23 10:58; one warning key, no handle or actions without the callback)
- [x] 1.2.9 Run the Phase 1 specification tests to green and preserve every existing layout, selection, focus, marquee, and export oracle ✅ (completed: 2026-10-23 10:58; jsdom 12/12, Chromium drag 15/15; type-check green)

**Deliverable:** Reorder behavior matching ST-1–ST-23 with no regression.
**Verify:** Targeted green checks, then `pnpm verify`.

### Session 1.3 — Internal Tests and Hardening

- [x] 1.3.1 Add insertion, boundary conversion, payload, auto-scroll, and announcement internals — `test/tile-grid-reorder.impl.test.tsx`; 03-01, 07 Implementation Tests ✅ (completed: 2026-10-23 11:02; 17 internal cases pass)
- [x] 1.3.2 Run `pnpm verify && pnpm test:browser && pnpm test:perf`; record results and complete the strict independent phase-review loop ✅ (completed: 2026-10-24 10:29; 828 unit / 108 Chromium / 17 performance; RV-001..RV-105 and PE-001..PE-101 closed, PE-005 deferred)

**Deliverable:** Verified Phase 1 and closed or authorized review findings.
**Verify:** `pnpm verify && pnpm test:browser && pnpm test:perf`.

---

## Phase 2: Tile Shell, Actions, and Keyboard Menu

> **Phase baseline tree**: `7f757e299b2f4fce33092e008b7d41cdb7723b3e`
> **Scope mode**: strict
> **Expected modification set**: Phase 2 task paths under `packages/react-components/`, this plan's execution evidence, and the derived TileGrid roadmap status. The shell reuses Fluent Menu, Button, and Griffel; no new dependency.
> **Lenses**: api-surface
> **Risk tags**: complex
> **Reasoning**: high — action semantics, menu focus, touch reachability, and drag isolates meet in one small surface
> **Review**: RV-201..RV-212 fixed; the single scoped re-review closed every finding with no new findings. Evidence: [05-findings.md](05-findings.md).

### Session 2.1 — Specification Tests

**Reference:** 03-02; AR-5, AR-7, AR-14, AR-21–AR-26, AR-32; 07 ST-24–ST-44 and ST-60–ST-62.

- [x] 2.1.1 [spec-author] Add shell slot, action, state, fallback, and security oracles — `test/tile-grid-item.spec.test.tsx`; ST-24–ST-29, ST-33–ST-39, ST-41, ST-43, ST-44, ST-60, ST-61 ✅ (completed: 2026-10-24 12:38; 23 invocations, red at missing shell module)
- [x] 2.1.2 [spec-author] Add handle, touch reachability, menu focus, and isolation oracles — `test/browser/tile-grid-item.browser.test.tsx`; ST-30–ST-32, ST-37, ST-40, ST-42, ST-62 ✅ (completed: 2026-10-24 12:38; 8 cases after the keyboard-menu integration addition; red at missing shell module; touch media verified through the emitted `(hover: none)` rule; the over-specific initial `aria-expanded=false` assertion was removed because ST-42 requires naming and focus return, not the initial expanded value)
- [x] 2.1.3 [spec-author] Add the shell server-render smoke — `test/tile-grid-item-ssr.spec.test.ts`; ST-59 ✅ (completed: 2026-10-24 12:38; node renderToString smoke, red at missing shell module)
- [x] 2.1.4 Run the targeted specs and type-check; record expected red failures ✅ (completed: 2026-10-24 12:38; jsdom/SSR 2 files failed before collection, browser 0 collected, type-check reports the expected missing-module errors and the not-yet-exercised negative type cases)

**Deliverable:** Immutable Phase 2 oracles and red evidence.
**Verify:** Targeted Vitest files and `pnpm type-check`; expected red before implementation.

### Session 2.2 — Implementation

- [x] 2.2.1 Add shell types, the callable generic wrapper, and the barrel — `src/components/TileGridItem/TileGridItem.types.ts`, `src/components/TileGridItem/TileGridItem.tsx`, `src/components/TileGridItem/index.ts`; 03-02 Public Props ✅ (completed: 2026-10-24 21:06; native `title` omitted because the title slot owns that name)
- [x] 2.2.2 Add state resolution, strings, action/menu composition, and label fallbacks — `src/components/TileGridItem/useTileGridItem.ts`; 03-02 State Hook, Actions ✅ (completed: 2026-10-24 21:06)
- [x] 2.2.3 Add the pure renderer and Griffel styles — `src/components/TileGridItem/renderTileGridItem.tsx`, `src/components/TileGridItem/useTileGridItemStyles.styles.ts`; 03-02 Render Structure, Media, Visual States ✅ (completed: 2026-10-24 21:06)
- [x] 2.2.4 Add the overflow menu, default drag handle, status overlay, and selection indicator — `src/components/TileGridItem/renderTileGridItem.tsx`, `src/components/TileGridItem/useTileGridItem.ts`; 03-02 Overflow Menu, Drag Handle, Selection Indicator ✅ (completed: 2026-10-24 21:06)
- [x] 2.2.5 Connect grid handle props and reorder actions to the shell through render arguments; verify keyboard Move up/Move down and the shared announcement — `src/components/TileGrid/TileGridItemView.tsx`, `src/components/TileGrid/renderTileGrid.tsx`; 03-01 Keyboard reorder, 03-02 Drag Handle ✅ (completed: 2026-10-24 21:06; shell menu Move down reports the payload and announces "Moved to position 2 of 3")
- [x] 2.2.6 Run the Phase 2 specification tests to green and preserve the Phase 1 oracles ✅ (completed: 2026-10-24 21:06; 75 jsdom / 26 browser targeted)

**Deliverable:** Shell behavior matching ST-24–ST-44 and ST-59–ST-62.
**Verify:** Targeted green checks, then `pnpm verify`.

### Session 2.3 — Internal Tests and Hardening

- [x] 2.3.1 Add label fallback, menu composition, aspect-ratio, and attribute-filtering internals — `test/tile-grid-item.impl.test.tsx`; 03-02, 07 Implementation Tests ✅ (completed: 2026-10-24 21:06; 16 internal cases)
- [x] 2.3.2 Run `pnpm verify && pnpm test:browser && pnpm test:perf`; record results and complete the strict independent phase-review loop ✅ (completed: 2026-10-24 23:55; 871 unit / 121 browser / 17 performance; RV-201..RV-212 closed; re-review no new findings)

**Deliverable:** Verified Phase 2 and closed or authorized review findings.
**Verify:** `pnpm verify && pnpm test:browser && pnpm test:perf`.

---

## Phase 3: Recipe, Documentation, and Package Surface

> **Phase baseline tree**: _(recorded by the exec-plan skill)_
> **Scope mode**: strict
> **Expected modification set**: Phase 3 task paths under `packages/react-components/`, the feature roadmap link, this plan's execution evidence, and the derived TileGrid roadmap status. No npm publication.
> **Lenses**: api-surface, perf
> **Risk tags**: complex
> **Reasoning**: high — the recipe, export pin, and declaration build must agree at 20K scale
> **Review**: pending post-phase review

### Session 3.1 — Specification Tests

**Reference:** 03-03; AR-4, AR-9, AR-27, AR-28, AR-29, AR-30, AR-33; 07 ST-45–ST-59.

- [ ] 3.1.1 [spec-author] Add recipe filtering, selection persistence, disabled arranging, preview, mounted-count, and image-count oracles — `test/browser/tile-grid-recipe.browser.test.tsx`; ST-45–ST-54
- [ ] 3.1.2 [spec-author] Update the exact export pin and type contract — `test/package-exports.spec.test.ts`; ST-55–ST-57
- [ ] 3.1.3 Run the targeted specs and type-check; record expected red failures

**Deliverable:** Immutable Phase 3 oracles and red evidence.
**Verify:** Targeted Vitest files and `pnpm type-check`; expected red before implementation.

### Session 3.2 — Implementation

- [ ] 3.2.1 Add the 20K photo-library recipe with toolbar, filters, zoom, selection count, preview, and shell content — `src/components/TileGrid/stories/TileGridPhotoLibrary.story.tsx`; 03-03 Recipe
- [ ] 3.2.2 Add the drag story and register both stories — `src/components/TileGrid/stories/TileGridDrag.story.tsx`, `src/components/TileGrid/stories/TileGrid.stories.tsx`; 03-03 Drag Story
- [ ] 3.2.3 Add the shell story set — `src/components/TileGridItem/stories/TileGridItem.stories.tsx`; 03-03 TileGridItem Stories
- [ ] 3.2.4 Document the shipped contract and recipe — `README.md`; 03-03 README Updates
- [ ] 3.2.5 Complete the package exports and declaration build — `src/index.ts`, `src/components/TileGrid/index.ts`, `src/components/TileGridItem/index.ts`, `tsconfig.build.json`; 03-03 Package Surface, AR-4
- [ ] 3.2.6 Run the Phase 3 specification tests to green and preserve every prior oracle

**Deliverable:** Recipe and package surface matching ST-45–ST-57.
**Verify:** Targeted green checks, then `pnpm verify`.

### Session 3.3 — Hardening and Final Gates

- [ ] 3.3.1 Run `pnpm verify`; record the full unit/type/build result
- [ ] 3.3.2 Run `pnpm test:browser` and `pnpm test:browser:all`; record Chromium, Firefox, and WebKit results
- [ ] 3.3.3 Run `pnpm test:perf` and `pnpm storybook:build`; confirm no regression and a complete story index
- [ ] 3.3.4 Run `pnpm pack:check`; confirm the tarball contains the TileGrid and TileGridItem declarations, both skills, and no source or story files
- [ ] 3.3.5 Complete the strict independent final review, record acceptance evidence, and update the feature roadmap link and stage

**Deliverable:** Full acceptance evidence and a release-ready, still-unpublished package surface.
**Verify:** `pnpm verify && pnpm test:browser:all && pnpm test:perf && pnpm storybook:build && pnpm pack:check`.

---

## Dependencies

```text
Phase 1 (reorder foundation and pointer drag)
    ↓
Phase 2 (tile shell and keyboard menu)
    ↓
Phase 3 (recipe, documentation, and package surface)
```

Phase 2 consumes the Phase 1 render arguments and reorder actions. Phase 3 consumes both phases and
freezes the package surface.

## Success Criteria

**Feature is complete when:**

1. ✅ All phases and all 41 tasks are complete
2. ✅ All RD-04 acceptance criteria 1–17 and the plan-local criteria are covered by passing tests
3. ✅ `pnpm verify`, `pnpm test:browser:all`, `pnpm test:perf`, `pnpm storybook:build`, and `pnpm pack:check` pass
4. ✅ No dead code, no unused exports, and no internal module in the package-root export surface
5. ✅ Security requirements verified: no HTML parsing, no image fetching or logging, one action callback per activation
6. ✅ README and both story sets document the shipped behavior
7. ✅ The feature roadmap links this plan and records RD-04 as planned; npm publication remains a separate release step
