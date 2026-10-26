# TileGrid Interaction Acceptance Evidence

> **CodeOps Artifact Schema**: 1
> **Verified**: 2026-10-22
> **Scope**: Aggregate RD-01 and RD-03 behavior, combining the completed foundation and this plan

The [execution plan](99-execution-plan.md) remains the only task-progress authority. This document
maps delivered behavior to its oracles; requirement checkboxes are not a second execution checklist.
All test paths below are relative to `packages/react-components/test/`.

## Final Verification

| Gate                  | Evidence                                                                                                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Full repository       | `pnpm verify`: 793 tests, format, skills, types and build pass.                                                                                                                                                                                        |
| Native browser matrix | `pnpm test:browser:all`: 270 tests pass, 90 per Chromium/Firefox/WebKit.                                                                                                                                                                               |
| Performance           | `pnpm test:perf`: 16 tests pass; controls-enabled windows remain 64/72/50/45 for fixed/masonry/justified/mosaic. Focus-only content calls: 0; one toggle: 1. Pure selection p95: 0.30ms against 16ms.                                                  |
| Scroll/geometry       | Final geometry p95: 8.10/13.80/9.20/28.80ms against 200ms. Original/controls-enabled scroll p95: 33.30/16.70ms against the 50ms regression guard; 30 intervals each. This is not a claim that every path reaches 60fps.                                |
| Storybook/package     | `pnpm storybook:build` and `pnpm pack:check` pass. New scenarios are registered; runtime/declaration exclusion is tested.                                                                                                                              |
| Coverage/media        | Existing unit and Chromium V8 reports meet changed-module targets; all three engines verify forced-colors/reduced-motion focus and marquee styling in built stories. Detailed metrics are in [review evidence](06-review-report.md#coverage-evidence). |
| Quality review        | Four phases reviewed independently; all accepted findings fixed. Final correctness/API/standards and performance reviews report no findings. No unresolved critical/major finding or risk waiver.                                                      |

The final gate command also disables failure screenshots and directs any attachments to the
runtime temporary directory. Those options do not change the test set or assertions.

## RD-01 — Selection and Marquee Internals

Authority: [RD-01](../../requirements/RD-01-selection-and-marquee.md). All 16 acceptance criteria
are covered by the foundation plus the completed interaction integration.

| Acceptance criteria                                          | Delivered evidence                                                                                                                                                                                                                |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–2, 7: seed/load/parent updates stay silent                 | `tile-grid-selection.spec.test.tsx`, `tile-grid-selection-invariants.spec.test.tsx`; controlled and uncontrolled seeds, hidden IDs, rejected proposals.                                                                           |
| 3–6: transitions, range, handles and single mode             | Same selection oracles plus `tile-grid-range-anchor.spec.test.tsx`, `tile-grid-single-range.spec.test.tsx`, and `tile-grid-interaction.spec.test.tsx`; seeds/removal/fallback/single ranges preserve the specified anchor.        |
| 8–10: rectangle commit, additive selection and cancellation  | `tile-grid-marquee.spec.test.ts`, `tile-grid-marquee-integration.spec.test.tsx`, `browser/tile-grid-marquee.browser.test.tsx`; terminal resolver and capture-loss ordering additionally covered by internals.                     |
| 11–12, 15: threshold, edge scrolling and bounded hit testing | Same controller/native oracles; trusted capture and cross-window scrolling preserve complete final intersections, with no per-tile DOM measurement. Decorative overflow cannot expand the canvas.                                 |
| 13: 20K selection budget                                     | `perf/tile-grid.perf.test.tsx`, `browser/tile-grid-selection.browser.test.tsx`; pure transition timing and mounted-only render effects remain distinct measurements.                                                              |
| 14, 16: identity and security                                | Existing geometry/selection normalization oracles; `tile-grid-accessibility.spec.test.tsx`, `tile-grid-integration.spec.test.tsx`; first duplicate wins, IDs remain opaque, labels remain literal, warnings contain no item data. |

## RD-03 — Selection Integration, Focus and Accessibility

Authority: [RD-03](../../requirements/RD-03-selection-focus-and-accessibility.md). All 21 acceptance
criteria and the two development warnings are covered.

| Acceptance criteria                                     | Delivered evidence                                                                                                                                                                                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1, 5–8: none/select/browse/single interaction           | `tile-grid-interaction.spec.test.tsx`, `tile-grid-label-interaction.spec.test.tsx`; activation, modifier selection, owned controls, native labels/editors and prevented events.                                                    |
| 2–4: controlled/default/hidden membership               | `tile-grid-selection-invariants.spec.test.tsx`, `tile-grid-integration.spec.test.tsx`; initial/load/echo silence and hidden membership through combined actions.                                                                   |
| 9–10: spatial navigation and selection keys             | `tile-grid-navigation.spec.test.ts`, `tile-grid-focus.spec.test.tsx`, `browser/tile-grid-focus.browser.test.tsx`; deterministic geometry, boundaries, endpoints, visual rows, disabled reachability and mode-specific shortcuts.   |
| 11, 18: zoom, reset, append and focus ownership         | `tile-grid-keyboard-zoom.spec.test.tsx`, both native focus files, and combined integration files; reset priority, visible-active retention, overscan/unmounted targets, parent/inline supersession, and external-focus protection. |
| 12: one entry and native inline traversal               | Native focus and focus-recovery files; forward/reverse unchecked-radio boundaries, menus, dynamic author tabindex, empty Retry entry and failed native-focus handling.                                                             |
| 13–15, 20: list semantics, names, controls, eligibility | Accessibility and control-composition specifications plus `browser/tile-grid-interaction.browser.test.tsx`; all layouts, real inputs, unique context-isolated IDs/groups, retained ineligible selection and native form reset.     |
| 16–17: counts and mounted marquee                       | Accessibility, mounted marquee and combined-flow files; actual preview before silence assertions, one committed count change, final full-rectangle reconciliation, Escape/capture/parent-change cancellation.                      |
| 19: 20K behavior                                        | Existing and added performance/browser cases; bounded wrappers, no focus-only content rerender, one affected toggle render, select-all/clear, and stable scroll budget.                                                            |
| 21: safe data handling                                  | Accessibility and combined unit/native oracles verify hostile literal labels, opaque IDs, no fake items and no value leakage.                                                                                                      |

The accepted singleton-radio HTML authoring-conformance exception remains documented in the
package README. The maintainer reopens it if conformance requirements change or browser/assistive
technology evidence shows a functional problem. No synthetic peer or fake item was introduced.

> **Superseded by the 0.4.0 release freeze.** RD-02 is now closed and TileGrid is exported; see
> [release-freeze evidence](../../08-release-freeze.md). The historical boundary below describes
> the state of this branch before that freeze.

## Remaining Delivery and Release Boundary

- RD-02's four layouts, virtualization, anchor preservation and controlled keyboard zoom are
  implemented. Its final composed API/export/dependency freeze awaits RD-04; RD-02 is not closed.
- RD-04 tile shell, built-in actions, arranging/reordering and the full photo-library recipe remain
  unimplemented. Existing application-owned inline actions are not a substitute for that work.
- TileGrid stays absent from package-root runtime exports and declaration output. The stable
  package version remains 0.3.0; this plan does not authorize TileGrid publication.
- The feature roadmap can close RD-01/RD-03 from this aggregate evidence. Portfolio synchronization
  remains deferred on `feat/tile-grid-rd-03` until landing on integration branch `main`.
