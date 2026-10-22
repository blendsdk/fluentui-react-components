# RD-03 Execution Reviews

> **CodeOps Artifact Schema**: 1

## Phase 1 — Selection and Accessible Controls

**Baseline tree:** `33fca8b92155dad524b30164ca6001f6ef972519`.
**Scope:** Phase 1 task paths and execution/decision/roadmap evidence. Strict scope; no additional
dependency, public export, or generalized support surface. Independent generic packets substitute
for named reviewer roles unavailable in the harness.

| Check                            | Evidence                                                                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Specification-first              | 42 expected failures / 7 baseline passes before implementation; all 49 new cases subsequently pass.                                                                                                                                                     |
| Full verification                | Initial: 599 tests pass. Final after the independently specified label regression and fix: 611 tests pass.                                                                                                                                              |
| Browser regression               | `pnpm test:browser`: 18 Chromium tests pass.                                                                                                                                                                                                            |
| Performance                      | `pnpm test:perf`: 11 tests pass. Geometry p95 fixed 10.30ms, masonry 12.40ms, justified 12.70ms, mosaic 26.70ms (<200ms). Pure selection transition p95 0.40ms (<16ms). Scroll p95 16.80ms (<50ms regression guard; does not establish 16.67ms target). |
| Correctness/API/standards review | `ses_e9f18232affeebMHm4J9S20C5i`: RV-001 major, associated native labels triggered grid actions. Bounded guard fix selected under AR-19, verified, and confirmed by scoped re-review. No remaining major finding.                                       |
| Performance audit                | `ses_e9f17e620ffehIX5OffwFQRRc5`: no findings. ID lookup construction is memoized; handlers are stable; mounted wrappers/content remain memoized; count/cancellation work is bounded.                                                                   |

Security checks remain in the base review and hostile-text/static-warning tests: this phase adds
no server, authentication, network, or persistence boundary. A dedicated security auditor is not
activated. Later focus, keyboard, zoom, and marquee delivery is reviewed in its owning phase.

### RV-001 — Native Label Isolation

The reviewer reproduced a wrapping consumer checkbox label that toggles its input and also invokes
tile selection/activation. The existing target guard recognizes input nodes but not associated
labels. Resolution: independent label-click oracles, then the smallest association-aware guard
extension, with full verification and one fix-scoped re-review. Runtime AR-19 records delegated
authority and alternatives. No risk waiver or scope expansion was granted.

Independent author `ses_e9f13896affeMPgVkoviFEpbqR` added
`test/tile-grid-label-interaction.spec.test.tsx`: 8 associated-label cases failed before the fix;
4 unassociated-label cases already passed. Assertions cover both interaction modes, wrapping/
htmlFor association, and label text/descendants while preserving native checkbox activation.
The guard now uses native `label.control` association. Full fix verification passed: 611 unit,
18 Chromium, and 11 performance tests. The one fix-scoped re-review in
`ses_e9f18232affeebMHm4J9S20C5i` confirms RV-001 fixed and no related remaining major finding.

**Phase verdict:** Passed. No unresolved critical/major finding. Final measurements: geometry p95
10.50/6.10/10.20/22.70ms for fixed/masonry/justified/mosaic; mounted counts 64/72/50/45;
pure selection p95 0.40ms; scroll p95 16.80ms (50ms regression guard). No thresholds changed.
Architecture documentation automation is not opted in; no techdocs hook applies.

## Phase 2 — Navigation, Focus, Filtering, and Zoom

**Baseline tree:** `3c098ae509ae38134d58c5ea9d249f8132a54f98`.
**Scope:** Phase 2 task paths, the existing test cleanup correction under AR-21, the native target
guard correction under AR-22, and plan evidence. Strict scope; approved mounted-local focus helper.

| Check                     | Evidence                                                                                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Specification-first       | 44 navigation cases initially could not import the planned helper; 46 DOM behavior failures / 12 baseline passes; 25 Chromium red cases. All 102 new unit and 25 native cases now pass unchanged.              |
| Full verification         | `pnpm verify`: 720 unit tests pass.                                                                                                                                                                            |
| Browser regression        | Full Chromium suite: 43 tests pass, including real Tab/radio traversal, portals, virtualized removal, pending focus, zero-width entry, and reset ownership.                                                    |
| Performance               | 11 tests pass. Geometry p95 fixed 9.30ms, masonry 33.80ms, justified 13.00ms, mosaic 45.60ms (<200ms). Mounted counts 64/72/50/45 (<120). Pure selection p95 0.40ms (<16ms); scroll p95 16.70ms (<50ms guard). |
| Correctness/API/standards | `ses_e9eae50d2ffeTEMVzkbkdyMT46`: RV-002/RV-003 reproduced, corrected under AR-23, and confirmed resolved in the one scoped re-review.                                                                         |
| Performance audit         | `ses_e9eadf3c4ffeY6MWXZ6z4e7ov6`: PE-001 callback lifetime issue corrected and confirmed resolved; no new performance finding.                                                                                 |

Review packets include AR-13's React/observer-write, author-intent, native radio, reverse-entry,
removal and app-owned-portal risks. No new security profile is activated; base review and the
existing hostile-ID/text cases cover the client-only surface. Firefox/WebKit remain final-matrix
obligations. No performance threshold or immutable Phase 2 assertion changed.

### Phase 2 Findings and Resolution

| Finding | Evidence                                                                                                                                                                                                                                                | Bounded correction candidates                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| RV-002  | On a 328×360 fixed grid at scrollTop 3360, focusing tile-41 then changing size 160→200 correctly scrolls to 13440 but moves focus to tile-40 although tile-41 remains visible. Recovery consumes layout change before the final mounted window arrives. | Resolve from cached final-viewport geometry and retain a pending mounted target, or retain layout-recovery intent until the viewport mounts. |
| RV-003  | Closed-details content can be incorrectly classified from tabIndex alone and trap Tab. Removing a managed link's href also leaves an invalid native target.                                                                                             | Check native focus semantics and closed-details visibility within mounted content; do not consume traversal when focus fails.                |
| PE-001  | getItemRef caches during render, so discarded Suspense/transition attempts never detach and remain cached.                                                                                                                                              | Cache callbacks only on ref attachment, retaining existing detach cleanup.                                                                   |

The major findings block phase completion. A blind technical challenger compares mechanisms within
the approved helper scope. Independent regressions precede fixes; the one fix-scoped re-review
follows green verification. No new framework, public API, or risk waiver is proposed.

PE-001 now has a real React Suspense/transition internal regression: 20 abandoned attempts retain
21 cached callbacks for one mounted wrapper before the correction. The test spies on actual Map
operations without replacing their behavior and confirms unmount cleanup separately.

Blind challenger `ses_e9e99e064ffePC2pT3VXf8bUP8` converged on cached final-viewport recovery,
post-anchor guarded completion, author-aware native eligibility with successful-focus checks,
and attachment-only callback caching. Runtime AR-23 records delegated resolution. The three
independent browser regressions failed before these corrections and now pass alongside all
25 original native focus cases. The abandoned-render regression also passes. Additional pending
supersession variants are being checked before the full fix gate and scoped re-review.

**Phase 2 closure:** Passed. All five independent native recovery/traversal regressions pass;
the two pending-supersession variants were justified baseline passes after the fix. Full gates:
722 unit / 48 Chromium / 11 performance tests. Final geometry p95 8.90/6.20/11.90/25.50ms,
mounted counts 64/72/50/45, pure selection p95 0.40ms, scroll p95 16.70ms (<50ms guard).
The one fix-scoped correctness re-review confirms RV-002/RV-003 fixed with no direct remaining
major finding; the performance re-review confirms PE-001 fixed with no new performance finding.
Both continued independent sessions are identified above. No threshold changed or risk waived.
Architecture documentation automation remains opted out. Temporary browser attachments were
removed; final execution cleanup removes this phase's captured logs and review diffs.

## Phase 3 — Mounted Marquee

**Baseline tree:** `5e54aec635e969d00092afa1dd60089680c6aa78`.
**Scope:** Existing controller extensions, mounted host, root pointer/Escape composition, decorative
canvas, and corresponding oracles/internals. Strict scope; no new dependency or input framework.

| Check                             | Evidence                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Specification-first               | Mounted unit: 42 red / 1 baseline pass. Native browser: 22 red / 8 baseline passes; additive canvas-boundary regression red before AR-24 fix. All 43 unit and 31 native cases pass. A typed asynchronous pointer getter corrected fixture control-flow typing without changing assertions.                              |
| Runtime hardening                 | AR-24 clips decoration without changing inner coordinates or native scroll range. AR-25 fixes replacement-layout Escape interception through synchronous teardown. Controller tests cover terminal resolver timing/errors, snapshots, and zero large-set traversal during preview frames.                               |
| Correctness/concurrency/standards | `ses_e9ddd6c62ffevP3s3JW4lbg0bD`: no critical/major findings; RV-004 minor, final sampling notified before terminal state. AR-27 moved terminal marking and frame cancellation before sampling inside cleanup protection. Targeted regression was red, then green. Minor-only fixes do not require another review pass. |
| Performance audit                 | `ses_e9ddd0b81ffeIBTicUglMtiJSe`: no findings. Preview remains mounted-bounded, map construction is memoized/disabled-cheap, final full pass is terminal-only, and resources/scroll extent are bounded.                                                                                                                 |
| Final verification                | `pnpm verify`: 781 unit tests; full Chromium: 79 tests; performance: 11 tests, all passed.                                                                                                                                                                                                                              |
| Final measurements                | Geometry p95 fixed 7.10ms, masonry 15.70ms, justified 13.00ms, mosaic 31.70ms (<200ms). Mounted counts 64/72/50/45 (<120). Pure selection p95 0.40ms (<16ms); scroll p95 16.70ms (<50ms guard).                                                                                                                         |

**Phase verdict:** Passed; no unresolved critical/major finding, no threshold changes or risk waivers.
Dedicated security review remains inactive for this client-only phase; base review and existing
hostile-data checks apply. Techdocs automation is opted out. AR-26's single-mode internal anchor
correction is explicitly sequenced into Phase 4 before aggregate RD-01 completion; it is outside
this marquee-only implementation diff and has not been claimed delivered.

## Phase 4 — Integration, Stories, Documentation, and Final Gates

**Baseline tree:** `74a453b75162fb6289e988afa27dc0b6c0796d85`.
**Scope:** Combined application/native-control/performance oracles, four stories and package docs,
AR-26's single-mode range correction, existing browser-input setup under AR-28, and the narrowly
user-approved wheel timing oracle under AR-29. Strict scope; no publication/export expansion.

| Check               | Current evidence                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Specification-first | 7 unit baseline passes and 3 single-range anchor failures before correction; all 10 now pass. 11 combined native cases and 5 additional 20K performance cases passed at authoring.                                                                                                                                                                                                 |
| Unit/full gate      | `pnpm verify`: 793 tests pass, including unchanged existing export/type/SSR contracts.                                                                                                                                                                                                                                                                                             |
| Matrix              | Final complete matrix: 270/270 passed, 90 each in Chromium, Firefox, and WebKit. AR-29 records the user-approved wheel timing correction; AR-30 isolates native link dragging in the fixture.                                                                                                                                                                                      |
| Performance         | Final 16 cases pass. Geometry p95 fixed 8.10ms, masonry 13.80ms, justified 9.20ms, mosaic 28.80ms (<200ms). Controls-enabled counts 64/72/50/45 (<120); focus-only content calls 0, toggle 1 in each layout. Pure selection p95 0.30ms (<16ms). Original/controls-enabled scroll p95 33.30/16.70ms (<50ms guard), 30 intervals each. The 60fps target is not asserted as achieved. |
| Storybook/package   | Storybook builds with four additional scenarios. `pnpm pack:check` passes. Unit artifact guards verify no TileGrid runtime/declaration output.                                                                                                                                                                                                                                     |
| Media inspection    | Built KeyboardNavigation and MarqueeSelection stories exercised with real Playwright in Chromium, Firefox, and WebKit; both forced-colors and reduced-motion media queries confirmed active. Focus outline 2px solid; overlay border 1px, pointer-transparent, non-animated; Escape removes it. Temporary static server stopped afterward.                                         |
| Independent review  | Correctness/API/standards: `ses_e9d63fe61ffeBwVPKl4THyQ0ME`, no findings. Performance: `ses_e9d639c84ffel5ZxX0tIspWFEh`, no findings. Both reviewed the complete Phase 4 snapshot and supplied final evidence.                                                                                                                                                                     |

### Coverage Evidence

The existing unit coverage command passed with 793 tests. The existing Chromium browser suite
also ran through the installed V8 provider (90 tests) to cover real focus loss, capture and pending
virtual targets. The two JSON reports were merged in memory using the installed
`@vitest/istanbul-lib-coverage`; no dependency, runner, threshold, or persistent coverage setup was added.
Targets below apply to statement coverage: core behavior 90%, supporting helpers 80%, UI/glue 60%.
Branch coverage is reported separately rather than presented as a stronger guarantee.

| Changed module under TileGrid              | Statements | Functions | Branches             | Target |
| ------------------------------------------ | ---------- | --------- | -------------------- | ------ |
| focus/navigation.ts                        | 96.96%     | 100%      | 100%                 | 90%    |
| focus/useTileGridFocus.ts                  | 95.93%     | 96.66%    | 94.02%               | 80%    |
| focus/useTileGridTabOrder.ts               | 94.40%     | 100%      | 90.37%               | 80%    |
| selection/useGridSelection.ts              | 98.03%     | 100%      | 93.84%               | 90%    |
| selection/clickSelection.ts                | 93.33%     | 100%      | 85.71%               | 90%    |
| selection/useTileGridInteractions.ts       | 95.74%     | 100%      | 91.30%               | 80%    |
| selection/useSelectionAnnouncement.ts      | 100%       | 100%      | 100%                 | 80%    |
| marquee/createMarqueeController.ts         | 96.31%     | 95.65%    | 86.95%               | 90%    |
| marquee/useTileGridMarquee.ts              | 98.52%     | 100%      | 96.03%               | 80%    |
| virtualization/useAnchorPreservation.ts    | 100%       | 100%      | 100%                 | 80%    |
| useTileGrid.ts                             | 87.95%     | 84.21%    | 84.48%               | 60%    |
| TileGridItemView.tsx                       | 90%        | 66.66%    | 90%                  | 60%    |
| TileGridSelectionControl.tsx               | 100%       | 100%      | 85.71%               | 60%    |
| TileGrid.tsx / renderTileGrid.tsx / styles | 100% each  | 100% each | 66.66% / 100% / 100% | 60%    |

Unchanged geometry and selection-transition baselines remain tested; they are not misreported as
newly changed modules. Raw logs/reports are temporary and removed after their evidence is recorded.
