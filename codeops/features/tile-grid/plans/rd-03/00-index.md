# TileGrid RD-03 Implementation Plan

> **Feature**: Selection integration, focus, keyboard navigation, accessibility, and marquee
> **Status**: Executing — final integration and release-boundary verification remain
> **Created**: 2026-10-21 23:36
> **Implements**: tile-grid/RD-01, tile-grid/RD-02, tile-grid/RD-03
> **CodeOps Artifact Schema**: 1

## Overview

Complete RD-03 on the released repository's internal TileGrid foundation. This plan connects the
selection store and geometry to accessible controls, keyboard navigation, focus recovery, filtering,
controlled keyboard zoom, and the existing marquee controller. RD-01/RD-02 are listed because their
selection invariants and deferred zoom/integration requirements are also implemented; coverage is
qualified in [01-requirements.md](01-requirements.md).

All 15 planning decisions are user-confirmed in the [register](00-ambiguity-register.md). The
approved requirement corrections under AR-4–AR-7 passed their scoped reviews in
[RD-02's report](../../requirements/00-preflight-report-RD-02.md) and
[RD-03's report](../../requirements/00-preflight-report-RD-03.md). The user approved twelve
plan corrections and one narrow conformance exception in the [preflight report](00-preflight-report.md).
The bounded rescan passed with notes: twelve corrections verified and the singleton-radio
authoring-conformance exception explicitly accepted. Current execution progress is owned by the
[execution plan](99-execution-plan.md); runtime corrections and authority remain in the register.

## Minimum-Sufficient Baseline

**Original goal:** Continue TileGrid after the stable forms release by completing RD-03.

**Smallest viable design:** Extend the current TileGrid state/render layers, existing selection
store, geometry rectangles, scroll helpers, and marquee controller. Compose Fluent controls.
Use local focus helpers limited to mounted tiles, with no new public focus API. Reuse existing
Vitest, browser matrix, performance fixture, Storybook, and package checks (AR-1, AR-13–AR-15).

**Excluded machinery:** A general focus framework, global portal registry, custom Tabster bridge,
new spatial index, new runner, and additional dependencies were unnecessary for this scope.

**Approved complexity:** No new escalation. Existing TanStack/browser infrastructure is retained
under requirements AR-11. The independent challenger classified the bounded focus helper as
ordinary feature implementation; its evidence is in plan AR-13.

## Domain Lenses

| Lens               | Application                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web application    | Browser interactions, accessible names/states, focus, localization, input isolation, and 20K rendering.                                                              |
| Data and migration | Stable selected IDs and the internal/public API boundary. No persisted schema or data migration. The application owns the v8 replacement, persistence, and rollback. |

The stable `0.3.0` package remains the compatibility baseline. AR-3 keeps TileGrid's root export
and declaration emission closed through RD-04 and the final contract/export/dependency freeze.

## Document Index

| Document                                                                     | Owns                                                   |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| [00-ambiguity-register.md](00-ambiguity-register.md)                         | Decisions and authority                                |
| [01-requirements.md](01-requirements.md)                                     | Scope delta and coverage boundary                      |
| [02-current-state.md](02-current-state.md)                                   | Observed baseline and integration risks                |
| [03-01-selection-and-accessibility.md](03-01-selection-and-accessibility.md) | Store integration, activation, controls, announcements |
| [03-02-navigation-and-focus.md](03-02-navigation-and-focus.md)               | Geometry navigation, focus, tab order, reset, zoom     |
| [03-03-marquee-integration.md](03-03-marquee-integration.md)                 | Controller extension, host, preview, commit/cancel     |
| [07-testing-strategy.md](07-testing-strategy.md)                             | Concrete immutable behavioral oracles and verification |
| [99-execution-plan.md](99-execution-plan.md)                                 | The sole task-progress authority                       |

## Delivery

Four phases and twelve sessions; task scope is bounded rather than estimated in hours (AR-14).

| Phase                                 | Governing specification         | Main review additions                          |
| ------------------------------------- | ------------------------------- | ---------------------------------------------- |
| 1 — Selection and accessible controls | 03-01                           | `api-surface`, `perf`                          |
| 2 — Navigation and focus              | 03-02                           | `api-surface`, `perf`; complex focus lifecycle |
| 3 — Mounted marquee                   | 03-03                           | `concurrency`, `perf`                          |
| 4 — Integration and documentation     | 07 and all three specifications | `api-surface`, `perf`                          |

## Specialist Agents

**None** — catalog reviewers plus targeted packets cover the work. Focus-restoration findings
recur in `confirm-dialog/plans/confirm-dialog/05-findings.md:11–20` and
`loading/plans/loading/05-findings.md:12`, and TileGrid performance/controller findings recur in
`../v1/05-findings.md:38–55`. These are useful review inputs, but do not show a capability missing
from the existing phase reviewer/performance auditor and the house component/accessibility skills.
There are no specialist briefs or routing roles. AR-13's independent challenge already supplies
the narrow focus evidence. A standing role would repeat those packets rather than add a capability.

## Quality and Readiness

Apply `codeops/codeops.json` strict policy: independent phase review, at least one reviewer, and
an authorized ruling for every critical/major finding. Performance-critical code phases also get
the performance auditor. Review security properties through the base review and explicit tests;
there is no new server/auth/network/infrastructure surface requiring a separate security profile.

The planning gate passes. Execution additionally requires a passing current plan preflight as
described above. The execution plan owns progress; neither this index nor a new
readiness file may duplicate task state. Commit behavior belongs to `exec-plan` and the
`git-commit` skill; this planning run does not inherit earlier auto-commit/auto-design authority.

## Related Files

Changes stay in the existing TileGrid component folder, its tests/stories, and the package README.
The concrete source/test map is in the three specifications and testing strategy. The feature and
portfolio roadmaps are derived summaries. Generated output and installer-managed CodeOps files
are never edited.
