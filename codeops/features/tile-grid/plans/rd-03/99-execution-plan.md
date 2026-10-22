# Execution Plan: TileGrid RD-03

> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-10-22 06:30
> **Progress**: 34/47 tasks (72%)
> **CodeOps Artifact Schema**: 1

## Overview

Implement the confirmed RD-03 plan on `feat/tile-grid-rd-03`. The scoped requirement corrections
passed review; before execution, confirm a passing current preflight for this plan. Read the governing specifications
and ST cases at each phase; do not infer behavior from current implementation.

Paths in task lines are relative to `packages/react-components/` unless prefixed by `codeops/`.
`03-01`, `03-02`, `03-03`, and `07` refer to the linked documents in [00-index.md](00-index.md).

## Implementation Phases

| Phase | Title                                                | Tasks |
| ----- | ---------------------------------------------------- | ----- |
| 1     | Selection and accessible controls                    | 12    |
| 2     | Navigation, focus, filtering, and zoom               | 15    |
| 3     | Mounted marquee                                      | 10    |
| 4     | Integration, stories, documentation, and final gates | 10    |

**Total: 47 tasks across 4 phases and 12 sessions.** Keep tasks reviewable (normally 1–3 files,
one concern). Split a task if implementation reveals more than roughly 200 lines or three concerns;
record new ordering in this document before executing the split.

> **Execution rule — single progress authority:** Update this document immediately after every
> task. On implementation mark `[~]` with `implemented: YYYY-MM-DD HH:MM`; after the appropriate
> verification passes promote to `[x]` with `completed: YYYY-MM-DD HH:MM`. Only `[x]` counts in
> the Progress header. Update that header and Last Updated each time. Resume the first `[~]`,
> otherwise the first `[ ]`. Mark a blocker `[!]` with its reason. Read timestamps from the
> system clock. Never duplicate tasks in another checklist or state file.

Each phase has three ordered sessions: specification tests and explicit red check; implementation
and green check; internal tests and hardening. A red-step result is expected evidence, not a green
verification claim. Commit handling belongs to `exec-plan`; any checkpoint uses the `git-commit`
skill with the selected execution mode. No automatic commit mode is selected by this plan.

### Active Execution Invocation

Run `rd03-20261022-0057`: user requested `--auto-commit --auto-design`; strict scope, policy
version 1. Eligible internal technical decisions use delegated authority; all reserved categories
remain user-owned. Existing plan/preflight work was verified and checkpointed as `b358e57`.
Expected-red specification and dependent implementation tasks remain `[~]` until the full gate
passes; their recorded red evidence permits the next specification-first step but never a commit
or a green completion claim. Verified tasks are promoted individually; runtime AR-16 authorizes
one coherent green commit/push for the mutually dependent red-to-green slice. Later independent
verified tasks retain per-task commits/pushes.

## Phase 1: Selection and Accessible Controls

> **Phase baseline tree**: `33fca8b92155dad524b30164ca6001f6ef972519`
> **Scope mode**: strict
> **Expected modification set**: Phase 1 task paths under `packages/react-components/`, this plan's execution/decision/review evidence, and derived TileGrid roadmap status. Original goal and smallest design: 00-index Minimum-Sufficient Baseline; approved local control integration only.
> **Lenses**: api-surface, perf
> **Risk tags**: performance-critical
> **Reasoning**: high — controlled selection and bounded rendering share one state authority
> **Review**: RV-001 fixed under AR-19 and verified by the one fix-scoped re-review; performance auditor reported no findings. Full evidence: 06-review-report.md. No open critical/major findings.

### Session 1.1 — Specification Tests

**Reference:** 03-01; AR-1, AR-5, AR-9, AR-12, AR-15; 07 ST-01–ST-13 and ST-40–ST-41. Preview/cancel assertions belong to Phase 3 ST-34.

- [x] 1.1.1 [spec-author] Add selection-invariant oracles — `test/tile-grid-selection-invariants.spec.test.tsx`; ST-01–ST-04. ✅ (completed: 2026-10-22 01:47; red 8/1, now green in full 590-test gate)
- [x] 1.1.2 [spec-author] Add interaction/control oracles — `test/tile-grid-interaction.spec.test.tsx`; ST-05–ST-09. ✅ (completed: 2026-10-22 01:47; red 16/5, now green in full 590-test gate)
- [x] 1.1.3 [spec-author] Add accessible-state/count/type/security and owned-control composition oracles — `test/tile-grid-accessibility.spec.test.tsx`, `test/tile-grid-control-composition.spec.test.tsx`; ST-10–ST-13, ST-40–ST-41, and the two development warnings. Actual preview is excluded until Phase 3. ✅ (completed: 2026-10-22 01:47; red 18/1; AR-17 narrowly authorized correction; full runtime/type gate green)
- [x] 1.1.4 Run the new targeted specs/type-check and record expected red failures; identify already-passing regression cases without altering their assertions. ✅ (completed: 2026-10-22 01:47; independent red runs: 42 failed / 7 baseline passes, no fixture failures; all 49 now green)

**Deliverable:** Immutable Phase 1 oracles and red evidence.
**Verify:** Targeted Vitest files and type-check; expected red before implementation.

### Session 1.2 — Implementation

- [x] 1.2.1 Correct fixed mode, seed/toggle anchors, and add the internal full-set commit path — `src/components/TileGrid/selection/useGridSelection.ts`, `selection/types.ts`; 03-01 Selection Store Integration. ✅ (completed: 2026-10-22 01:47; full gate 590 passed; documentation checked)
- [x] 1.2.2 Add the implemented RD-03 type/default contract and local barrel types — `src/components/TileGrid/TileGrid.types.ts`, `index.ts`, `useTileGrid.ts`, `TileGrid.tsx` API documentation; 03-01 Contract Delta. ✅ (completed: 2026-10-22 01:47; full gate 590 passed after initial timeout; type and export checks green)
- [x] 1.2.3 Connect predicates, event composition, activation, and native summary/editing isolation — `src/components/TileGrid/selection/useTileGridInteractions.ts`, `selection/clickSelection.ts`, `useTileGrid.ts`, `renderTileGrid.tsx`; 03-01 Interaction Mapping. ✅ (completed: 2026-10-22 01:47; root delegation preserves consumer prevention; full gate 590 passed)
- [x] 1.2.4 Compose selection controls with context isolation, reset-default synchronization, and item eligibility/descriptions — `src/components/TileGrid/TileGridSelectionControl.tsx`, `TileGridItemView.tsx`, `useTileGridStyles.styles.ts`; 03-01 Controls and Item Rendering. ✅ (completed: 2026-10-22 01:47; native-control/reset/context oracles and full 590-test gate pass)
- [x] 1.2.5 Add committed-count announcements and resolved list rendering — `src/components/TileGrid/selection/useSelectionAnnouncement.ts`, `useTileGrid.ts`, `renderTileGrid.tsx`, `useTileGridStyles.styles.ts`; 03-01 Announcements. ✅ (completed: 2026-10-22 01:47; committed-count, hostile-text, unchanged empty semantics and full gate pass)
- [x] 1.2.6 Run the Phase 1 specs to green and preserve every existing selection/layout/export/SSR oracle. ✅ (completed: 2026-10-22 01:47; pnpm verify: 61 files / 590 tests pass; all pre-existing tests unchanged; AR-17 correction scoped to one newly authored assertion)

**Deliverable:** Selection/control behavior matching ST-01–ST-13 and ST-40–ST-41, with preview-specific assertions reserved for Phase 3.
**Verify:** Targeted green checks, then `pnpm verify`.

### Session 1.3 — Internal Tests and Hardening

- [x] 1.3.1 Add store/handler/control lifecycle tests — `test/tile-grid-selection.impl.test.tsx`, `test/tile-grid-interaction.impl.test.tsx`; stable methods, no duplicate notifications, and warning privacy. ✅ (completed: 2026-10-22 01:56; bounded cancellation correction per AR-18; 17 targeted internals and full 599-test gate pass; documentation checked)
- [x] 1.3.2 Run `pnpm verify && pnpm test:browser && pnpm test:perf`; record results and complete the strict independent phase-review loop. ✅ (completed: 2026-10-22 02:10; 611 unit / 18 Chromium / 11 performance tests; RV-001 regression first, fix verified and re-reviewed; no open major findings)

**Deliverable:** Verified Phase 1 and closed/authorized review findings.
**Verify:** `pnpm verify && pnpm test:browser && pnpm test:perf`.

## Phase 2: Navigation, Focus, Filtering, and Zoom

> **Phase baseline tree**: `3c098ae509ae38134d58c5ea9d249f8132a54f98`
> **Scope mode**: strict
> **Expected modification set**: Phase 2 task paths under `packages/react-components/`, existing `test/setup.ts` cleanup under AR-21 and `selection/clickSelection.ts` under AR-22, this plan's execution/decision/review evidence, and derived TileGrid roadmap status. Approved mounted-local focus helper only; no global portal registry or new framework.
> **Lenses**: api-surface, perf
> **Risk tags**: complex, performance-critical
> **Reasoning**: max — native tab order, observer writes, and virtual focus recovery interact
> **Review**: RV-002/RV-003 and PE-001 fixed under AR-23; the one correctness/performance fix-scoped re-review confirms closure. No unresolved critical/major findings. Evidence: 06-review-report.md.

### Session 2.1 — Specification Tests

**Reference:** 03-02; AR-6–AR-9, AR-13, runtime AR-20; 07 ST-14–ST-25 and ST-42.

- [x] 2.1.1 [spec-author] Add hand-computed navigation, focus, and range-anchor contracts — `test/tile-grid-navigation.spec.test.ts`, `test/tile-grid-focus.spec.test.tsx`, `test/tile-grid-range-anchor.spec.test.tsx`; ST-14–ST-17, ST-19–ST-25 DOM portions, and ST-42. ✅ (completed: 2026-10-22 03:34; 44 navigation + 33 focus + 2 anchor cases pass unchanged; red evidence recorded)
- [x] 2.1.2 [spec-author] Add controlled zoom/reset oracles — `test/tile-grid-keyboard-zoom.spec.test.tsx`; ST-18, ST-23–ST-24. ✅ (completed: 2026-10-22 03:34; 23 cases pass unchanged after 13 red / 10 baseline passes)
- [x] 2.1.3 [spec-author] Add real Tab/radio/menu/removal/virtual-target oracles — `test/browser/tile-grid-focus.browser.test.tsx`; ST-19–ST-25. ✅ (completed: 2026-10-22 03:34; all 25 Chromium cases pass unchanged; native observer isolation corrected under AR-21)
- [x] 2.1.4 Run targeted unit/browser specs and record expected red results, distinguishing passing inherited anchor behavior. ✅ (completed: 2026-10-22 03:34; red 44 missing-module cases, 46 behavior failures / 12 baseline passes, 25 browser failures; all now green)

**Deliverable:** Immutable focus/navigation oracles, including native browser edge cases.
**Verify:** Targeted unit and Chromium browser cases; expected red.

### Session 2.2 — Implementation

- [x] 2.2.1 Implement deterministic rectangle navigation — `src/components/TileGrid/focus/navigation.ts`; 03-02 Pure Navigation. ✅ (completed: 2026-10-22 03:34; 44 hand-computed cases and full gate pass; documentation checked)
- [x] 2.2.2 Implement bounded descendant discovery and author-tabindex records for tile and empty content — `src/components/TileGrid/focus/useTileGridTabOrder.ts`; 03-02 Tab Order in Custom Content. ✅ (completed: 2026-10-22 03:34; unit/native traversal cases and full gate pass; mounted-local scope and documentation checked)
- [x] 2.2.3 Add observer write isolation, dynamic reconciliation, and cleanup to the tab-order helper — `src/components/TileGrid/focus/useTileGridTabOrder.ts`; AR-13. ✅ (completed: 2026-10-22 03:34; dynamic author changes, detached restoration and native eligibility cases pass; full gate green)
- [x] 2.2.4 Implement active-ID/ref registration, immediate focus for connected overscan targets, and guarded pending focus for absent targets — `src/components/TileGrid/focus/useTileGridFocus.ts`; 03-02 Active Target and Physical Focus. ✅ (completed: 2026-10-22 03:34; real overscan/unmounted/pending-cancellation cases and full gate pass)
- [x] 2.2.5 Add removal, visible-fallback, empty-root, and external-focus recovery — `src/components/TileGrid/focus/useTileGridFocus.ts`; ST-23–ST-25. ✅ (completed: 2026-10-22 03:34; wheel/removal/root/external-focus regressions and full gate pass)
- [x] 2.2.6 Wire wrapper/owned-input focus including symmetric radio Tab boundaries, memoized content, and token focus styles — `src/components/TileGrid/TileGridItemView.tsx`, `TileGridSelectionControl.tsx`, `useTileGridStyles.styles.ts`; 03-02 Tab Order. ✅ (completed: 2026-10-22 03:34; native forward/reverse radio and checkbox traversal pass; full gate green)
- [x] 2.2.7 Give explicit reset priority over anchor restoration — `src/components/TileGrid/virtualization/useAnchorPreservation.ts`, `useTileGrid.ts`; 03-02 Reset and Controlled Zoom. ✅ (completed: 2026-10-22 03:34; Object.is, simultaneous reset/layout/items, stable append and browser cases pass)
- [x] 2.2.8 Compose wrapper keyboard/controlled zoom and root fallback props; preserve missing range anchors per AR-20 — `src/components/TileGrid/useTileGrid.ts`, `renderTileGrid.tsx`, `selection/useTileGridInteractions.ts`, `selection/useGridSelection.ts`; 03-02 Keyboard Mapping and ST-42. ✅ (completed: 2026-10-22 03:34; keyboard, zoom, range recovery and full gate pass; documentation checked)
- [x] 2.2.9 Run Phase 2 unit/browser oracles to green without editing expected behavior; restore the original ResizeObserver in existing `test/setup.ts` cleanup per AR-21. ✅ (completed: 2026-10-22 03:34; pnpm verify: 713 unit tests; full Chromium suite: 43 tests; all oracles unchanged; diagnostic instrumentation and generated repo screenshots removed)

**Deliverable:** Geometry-owned navigation, bounded tab order, and stable reset/zoom focus behavior.
**Verify:** Targeted green checks, then `pnpm verify && pnpm test:browser`.

### Session 2.3 — Internal Tests and Hardening

- [x] 2.3.1 Add observer/ref/memoization internals — `test/tile-grid-focus.impl.test.tsx`, `test/tile-grid-interaction.impl.test.tsx`; author changes, feedback prevention, pending target cleanup, ownerDocument, and content render counts. ✅ (completed: 2026-10-22 03:50; AR-22 iframe guard correction; 14 targeted internals and full 720-test gate pass; documentation checked)
- [x] 2.3.2 Run `pnpm verify && pnpm test:browser && pnpm test:perf`; record results and complete strict independent review with the focus-challenger risks in the packet. ✅ (completed: 2026-10-22 04:55; 722 unit / 48 Chromium / 11 performance cases; RV-002/RV-003/PE-001 fixed and re-review passed; no open critical/major finding)

**Deliverable:** Verified Phase 2 and resolved/authorized review findings.
**Verify:** `pnpm verify && pnpm test:browser && pnpm test:perf`.

## Phase 3: Mounted Marquee

> **Phase baseline tree**: `5e54aec635e969d00092afa1dd60089680c6aa78`
> **Scope mode**: strict
> **Expected modification set**: Phase 3 task paths under `packages/react-components/`, existing controller/types/intersection helpers, and this plan's execution/decision/review evidence. Existing geometry and one committed selection store remain authoritative; no new input framework.
> **Lenses**: concurrency, perf
> **Risk tags**: performance-critical
> **Reasoning**: high — pointer terminal ordering and controlled updates must commit once

### Session 3.1 — Specification Tests

**Reference:** 03-03; AR-10–AR-12; 07 ST-26–ST-34.

- [x] 3.1.1 [spec-author] Add host/preview/commit/cancel oracles with test-local stateful capture and active-preview preconditions — `test/tile-grid-marquee-integration.spec.test.tsx`; ST-26–ST-34, including preview/reset silence deferred from Phase 1. ✅ (completed: 2026-10-22 06:30; all 43 cases pass unchanged after 42 red / 1 baseline pass)
- [x] 3.1.2 [spec-author] Add real capture, auto-scroll, and final-rectangle browser oracles — `test/browser/tile-grid-marquee.browser.test.tsx`; ST-26–ST-34. ✅ (completed: 2026-10-22 06:30; all 31 native cases pass; original 22 red / 8 baseline passes plus AR-24 red boundary regression; mechanical typed getter preserved all expectations)
- [x] 3.1.3 Run targeted specs and record expected red failures; existing controller unit behavior must still pass. ✅ (completed: 2026-10-22 06:30; independent red evidence recorded; all old controller oracles and new mounted oracles now green)

**Deliverable:** Immutable marquee integration oracles and red evidence.
**Verify:** Targeted unit/browser cases; expected red for the unmounted integration.

### Session 3.2 — Implementation

- [x] 3.2.1 Extend rectangle notifications, border-aware coordinates, release sampling, and optional terminal resolver — `src/components/TileGrid/marquee/types.ts`, `createMarqueeController.ts`; 03-03 Existing Controller, Mounted Host / Geometry and Selection Flow. ✅ (completed: 2026-10-22 06:30; existing controller contracts and full 765-test gate pass; documentation checked)
- [x] 3.2.2 Implement geometry port, bounded rectangle-derived preview, final reconciliation, cancellation, and gesture-scoped document Escape lifecycle — `src/components/TileGrid/marquee/useTileGridMarquee.ts`; 03-03 Geometry / Event Ownership / Cleanup. ✅ (completed: 2026-10-22 06:30; captured native/unit gesture, cancellation, committed-source and final-rectangle oracles pass; documentation checked)
- [x] 3.2.3 Wire root pointer/Escape composition and token overlay rendering with duplicate-cancellation guards — `src/components/TileGrid/useTileGrid.ts`, `renderTileGrid.tsx`, `useTileGridStyles.styles.ts`, `selection/useTileGridInteractions.ts` Escape composition; 03-03 Event Ownership. ✅ (completed: 2026-10-22 06:30; AR-24 canvas clipping preserves scroll extent and exact inner coordinates; all unit/browser gates pass)
- [x] 3.2.4 Run Phase 3 unit/browser oracles to green and preserve existing controller expectations. ✅ (completed: 2026-10-22 06:30; full gate 765 unit / 79 Chromium tests; existing controller expectations unchanged and boundary regression green)

**Deliverable:** Mounted marquee following ST-26–ST-34.
**Verify:** Targeted green checks, then `pnpm verify && pnpm test:browser`.

### Session 3.3 — Internal Tests and Hardening

- [ ] 3.3.1 Extend controller internal tests — `test/tile-grid-marquee.impl.test.ts`; resolver timing, rectangle-only notifications, duplicate terminals, and no full per-frame pass.
- [ ] 3.3.2 Add mounted-host cleanup tests — `test/tile-grid-marquee-integration.impl.test.tsx`; stable geometry refs, capture failure, equal-membership parent updates, and no stale snapshot restoration.
- [ ] 3.3.3 Run `pnpm verify && pnpm test:browser && pnpm test:perf`; record results and complete strict independent review.

**Deliverable:** Verified Phase 3 and resolved/authorized review findings.
**Verify:** `pnpm verify && pnpm test:browser && pnpm test:perf`.

## Phase 4: Integration, Stories, Documentation, and Final Gates

> **Phase baseline tree**: Recorded by exec-plan at phase start.
> **Lenses**: api-surface, perf
> **Risk tags**: performance-critical
> **Reasoning**: high — cross-feature behavior must retain the 20K budget and release boundary

### Session 4.1 — Specification Tests

**Reference:** 03-01–03-03; AR-2, AR-3, AR-14; 07 ST-35–ST-41.

- [ ] 4.1.1 [spec-author] Add combined application-flow and release-boundary guards — `test/tile-grid-integration.spec.test.tsx`; ST-36, ST-38–ST-39.
- [ ] 4.1.2 [spec-author] Add combined browser/native-control and performance oracles using existing infrastructure — `test/browser/tile-grid-interaction.browser.test.tsx`, `test/perf/tile-grid.perf.test.tsx`; browser ST-35–ST-41 and existing ST-35/ST-38 performance measurements.
- [ ] 4.1.3 Run the new cases before further implementation; record red findings or justified passes from Phases 1–3. Never fabricate failures for already delivered behavior.

**Deliverable:** Cross-feature regression oracles and baseline red/pass evidence.
**Verify:** Targeted unit/browser/performance cases.

### Session 4.2 — Integration and Documentation

- [ ] 4.2.1 Add KeyboardNavigation and InteractionModes scenarios — `src/components/TileGrid/stories/TileGridKeyboardNavigation.story.tsx`, `TileGridInteractionModes.story.tsx`; 03-01–03-02.
- [ ] 4.2.2 Add MarqueeSelection and FilteringAndZoom scenarios — `src/components/TileGrid/stories/TileGridMarqueeSelection.story.tsx`, `TileGridFilteringAndZoom.story.tsx`; 03-02–03-03.
- [ ] 4.2.3 Register stories and document controls, keys, stable predicates, filtering, app-owned portals, and the accepted singleton-radio conformance exception — `src/components/TileGrid/stories/TileGrid.stories.tsx`, `README.md`; AR-3, AR-13–AR-15 and PF-013.
- [ ] 4.2.4 Run all new integration oracles to green; if they expose a defect, record a bounded implementation task against the owning 03 specification before fixing it.

**Deliverable:** Complete examples and documentation with the TileGrid unreleased marker retained.
**Verify:** `pnpm verify && pnpm storybook:build` plus the new browser cases.

### Session 4.3 — Final Hardening and Evidence

- [ ] 4.3.1 Add final lifecycle/memoization regression internals — `test/tile-grid-focus.impl.test.tsx`, `test/tile-grid-marquee-integration.impl.test.tsx`; ST-35/ST-38 implementation details without mirroring the public oracles.
- [ ] 4.3.2 Run `pnpm verify && pnpm test:browser:all && pnpm test:perf && pnpm storybook:build && pnpm pack:check` plus 07's existing coverage command; record measurements/coverage, package/SSR checks, and complete strict independent review.
- [ ] 4.3.3 Record aggregate RD-01/RD-03 acceptance evidence and RD-02's remaining final-contract work in this plan; synchronize `codeops/features/tile-grid/00-roadmap.md` and `codeops/00-roadmap.md` through the roadmap workflow.

**Deliverable:** Verified completion evidence and accurate derived roadmap, with the release gate held.
**Verify:** Full final sequence above; artifact/link/progress validation for the final evidence update.

## Dependencies and Success Criteria

Phase 1 → Phase 2 → Phase 3 → Phase 4. Each session depends on the preceding session in its phase.
Specification tasks depend on the approved contract, not on implementation. Keep existing immutable
specifications unchanged and do not publish TileGrid as part of any phase.

Completion requires all 47 tasks verified, all applicable ST cases green, all full gates passed,
authorized closure of critical/major findings, complete public/internal documentation, no unused
new helpers, and correct roadmap coverage. RD-02's final composed API and RD-04 remain pending.
Follow exec-plan's post-completion analysis protocol; architecture-doc automation is not opted in.
