## Ambiguity Register: TileGrid RD-03

> **Status**: ✅ GATE PASSED — all 21 items resolved, including six runtime decisions
> **Last Updated**: 2026-10-22 03:23
> **CodeOps Artifact Schema**: 1

## Planning Boundaries

| Boundary                    | Target                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planning target             | `tile-grid/RD-03`: remaining selection integration, focus, keyboard navigation, accessibility, mounted marquee, filtering persistence, and controlled keyboard zoom.                                                                                                                                                    |
| Context artifacts           | TileGrid requirements and their preflight decisions; completed `plans/v1/`; current TileGrid source, tests, stories, manifests, and project guidance.                                                                                                                                                                   |
| Authorized modification set | New documents in `plans/rd-03/`; feature and portfolio roadmap summaries after plan completion; RD-03's state/accessibility/focus corrections, RD-02's native `tabIndex` contract, the requirement decision register, and the old preflight proof's stale status (AR-4). Further upstream edits need separate approval. |

## Decisions

| #   | Category                    | Ambiguity / Gap                                                                                                                                             | Options Presented                                                                                                                                                                                                                        | User Decision                                                                                                                                                   | Status      |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Scope                       | Confirm the full RD-03 planning baseline and modification set.                                                                                              | Plan all remaining RD-03 behavior on the existing foundations, including keyboard zoom and marquee integration; or specify a narrower delivery.                                                                                          | User chose “Confirm (Recommended)” for the full scope and new `plans/rd-03/` documents plus roadmap updates.                                                    | ✅ Resolved |
| 2   | Non-functional              | Confirm the verification commands for the plan.                                                                                                             | `pnpm verify` for each completed task; relevant browser/performance checks per phase; final browser matrix, performance, Storybook build, and package artifact check using existing scripts.                                             | User confirmed the existing commands together with the scope.                                                                                                   | ✅ Resolved |
| 3   | Scope                       | Does this plan reopen the TileGrid package-root release surface?                                                                                            | Carry forward the accepted TileGrid-only release gate.                                                                                                                                                                                   | Imported from `../v1/00-ambiguity-register.md` AR-29: TileGrid stays internal until RD-03, RD-04, and the final contract/export/dependency freeze are complete. | ✅ Resolved |
| 4   | Scope / upstream correction | The RD-03 state and focus contract has contradictions that cannot be resolved only in a downstream plan. May the exact requirement modification set expand? | Amend only RD-03 state/accessibility/focus rules and RD-02's native `tabIndex` contract; append the requirement decision register and mark the old preflight proof stale for those edits. Or pause for a separate requirements revision. | User chose **Approve corrections** for the four named requirement files.                                                                                        | ✅ Resolved |
| 5   | Data & state                | How does an authoritative selected ID render when its item is disabled or non-selectable?                                                                   | A) preserve the ID and selected presentation while preventing user selection/activation as applicable; B) preserve the ID but mask its selected presentation while ineligible. Neither emits a callback on predicate changes.            | User chose **Keep selected**; recorded upstream as requirements AR-19.                                                                                          | ✅ Resolved |
| 6   | Integration / accessibility | RD-02 passes native `tabIndex` through, but RD-03 puts the only grid entry stop on the active tile.                                                         | A) make `tabIndex` library-owned and omit it from the native public props, with an empty-grid root fallback; B) retain an explicit root-tab-index override and qualify the one-entry guarantee when supplied.                            | User chose **Grid-owned**; recorded upstream as requirements AR-20.                                                                                             | ✅ Resolved |
| 7   | Behavioral / focus          | What happens when a filter retains the active ID but moves it outside the reset-to-top viewport, or scrolling unmounts the active tile?                     | A) transfer the active item to a visible fallback without undoing the reset/scroll; B) retain the logical active ID and use a temporary root entry target that scrolls back to it on keyboard re-entry.                                  | User chose **Visible fallback**; recorded upstream as requirements AR-21.                                                                                       | ✅ Resolved |
| 8   | Behavioral / navigation     | Define deterministic navigation across irregular layouts.                                                                                                   | Geometry ranking and examples below.                                                                                                                                                                                                     | User accepted AR-8–AR-12 as a batch.                                                                                                                            | ✅ Resolved |
| 9   | Behavioral / event routing  | Define wrapper shortcuts, native controls, activation, and cancellation.                                                                                    | Event-routing recommendation below.                                                                                                                                                                                                      | User accepted AR-8–AR-12 as a batch.                                                                                                                            | ✅ Resolved |
| 10  | Behavioral / marquee        | Include offscreen final intersections without a full per-frame scan.                                                                                        | Bounded preview and one terminal reconciliation / complete offscreen live preview.                                                                                                                                                       | User accepted bounded preview and terminal reconciliation.                                                                                                      | ✅ Resolved |
| 11  | Data & state / marquee      | External changes during a gesture.                                                                                                                          | Cancel and preserve current authoritative state / rebase.                                                                                                                                                                                | User accepted cancellation rules below.                                                                                                                         | ✅ Resolved |
| 12  | UX / announcements          | Timing for proposals, parent updates, and equal-count changes.                                                                                              | Effective committed-count updates / proposal-driven announcements.                                                                                                                                                                       | User accepted effective committed-count updates below.                                                                                                          | ✅ Resolved |
| 13  | Technical / focus (complex) | Manage arbitrary custom tile descendants.                                                                                                                   | Bounded local tab-index manager / Fluent focus composition alone.                                                                                                                                                                        | User chose **Confirm design** for the challenged bounded local design below.                                                                                    | ✅ Resolved |
| 14  | Technical / naming          | Module, test, story, and phase decomposition.                                                                                                               | Four-phase design packet below / revise decomposition.                                                                                                                                                                                   | User chose **Confirm design**.                                                                                                                                  | ✅ Resolved |
| 15  | UX / controls               | Selection controls, descriptions, overlay, and focus presentation.                                                                                          | Verified Fluent composition packet below / revise presentation.                                                                                                                                                                          | User chose **Confirm design**.                                                                                                                                  | ✅ Resolved |

## Requirement Correction Evidence

- **AR-4/AR-5:** RD-03 lines 35–40 preserve authoritative selected IDs without data-change callbacks, while lines 64–70 and AC 15 say disabled items are never selected. Its accessibility wiring at lines 210–212 groups non-selectable and disabled items under no activation, contradicting the enabled non-selectable activation rule at lines 61–65. The owning requirement must distinguish stored membership from user eligibility and distinguish the two predicates.
- **AR-4/AR-6:** RD-02 lines 184–187 and 234–239 pass native `tabIndex` through. RD-03 lines 86–103 require active-wrapper entry. `renderTileGrid.tsx:24` currently renders the root tab stop; `TileGridItemView.tsx:55–66` has no wrapper tab stop.
- **AR-4/AR-7:** RD-03 lines 188–192 and 223 retain a present active ID, but `scrollResetKey` resets to the top. `useTileGridVirtualizer.ts:44–74` mounts only the current window, so a retained offscreen ID has no focus target. A defined recovery rule is required.

The user resolved these upstream decisions. Their corrections are applied in the four approved
requirement files. The old preflight proof is marked stale for the affected sections. The completed
Phase A evidence remains historical and does not prove these new behaviors.

## Discovery Evidence

- Branch `feat/tile-grid-rd-03` was created from the clean released `main` at `e71d26c` (`v0.3.0`), matching remote `main`.
- `useTileGrid.ts` already composes geometry, virtualization, selection clicks, and handle methods. The selection predicates, interaction modes, focus, keyboard handlers, reset key, and marquee host remain to be connected.
- `TileGridItemView.tsx` renders a labelled list item without a focus target or selection control; `renderTileGrid.tsx` currently puts the tab stop on the list root.
- The existing `TileGrid` root export and declaration emission remain closed under the imported release decision.
- `selection/useGridSelection.ts:62–78` does not seed the anchor and overwrites the mode ref on every render; lines 156–159 remove a selected ID without moving the anchor. RD-01 already defines these invariants. New regression specifications must precede their implementation corrections because RD-03 keyboard/range behavior depends on them.
- The marquee controller reports preview callbacks only when the hit set changes (`marquee/createMarqueeController.ts:158–165`), so the host needs a rectangle-update notification independent of selection changes to draw every pointer/auto-scroll update.
- The same controller replaces each hit set using only `getVisibleItemIds` (`marquee/createMarqueeController.ts:148–165`). AR-10 resolves final geometry reconciliation; preflight PF-006 specifies bounded host preview wiring without full-set snapshots.

## Domain Lenses

Web application applies to browser interaction, focus, accessible semantics, and localization.
Data and migration applies to controlled-ID identity and the internal-to-public contract boundary;
there is no persisted data migration. The application owns v8 migration, persistence, and rollback.
Other catalog lenses have no repository evidence here. Pointer lifecycle races remain explicit
behavioral cases, not a distributed-system subsystem.

## Confirmed Behavioral Resolutions

The first question was interrupted by a server restart. On resume, the user explicitly chose
**Accept rules (Recommended)** for AR-8–AR-12. The following proposal text is the accepted decision.

| AR  | Recommendation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Evidence / trade-off                                                                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8   | Directional candidates have centers strictly in the requested direction. Left/right rank by greatest vertical overlap, then smallest horizontal edge gap, then center distance, then lower index. Up/down prefer horizontal-overlap candidates, ranked by smallest vertical edge gap, then greatest horizontal overlap, then center distance, then lower index; without overlap use nearest center and lower index. No wrap. PageUp/PageDown use the same one-adjacent-row movement as Up/Down, following the existing RD wording. Home/End and Ctrl+Home/Ctrl+End use collection endpoints.                          | RD-03 focus model; geometry rectangles provide all inputs. No DOM geometry scan or new spatial-index subsystem. Hand-computed unequal-height examples must pin the ranking.                                          |
| 9   | Grid navigation/selection/zoom shortcuts run on tile wrappers. Nested controls keep native keys; native radio arrow movement updates the active ID through focus events. Escape on an owned selection control returns to the wrapper; menus consume Escape first. Plain/Shift navigation follows RD-03; modified browser shortcuts otherwise pass through. Double-click in select mode activates once on `dblclick`, after the normal click selection events; browse/none mode activates each plain click without timers. Modified selection gestures do not activate. A prevented native event vetoes grid behavior. | Existing `selection/clickSelection.ts:56–75` already ignores prevented events and nested controls. Preserves editable content and menu behavior.                                                                     |
| 10  | Preview only mounted/visible-window intersections during the gesture; at pointer-up resolve the complete final rectangle against cached geometry once, including tiles scrolled out of view. Plain commit replaces; modified commit unions the gesture-start set. Use an internal optional final-selection resolver on the existing controller; no new geometry port or dependency. Refresh the final point on pointer-up.                                                                                                                                                                                            | `createMarqueeController.ts:148–165` currently replaces hits with the visible set; a full per-frame scan would violate RD-01's bounded-frame rule. One terminal O(n) geometry pass is not per-frame hit testing.     |
| 11  | Cancel a pending/active marquee when items, geometry, predicate identities, or effective controlled selection change, or marquee is disabled. Keep the latest external selection; never restore an old snapshot over a parent update. Cancel on unmount/capture failure without a public callback. Touch remains scrolling/tapping; only primary mouse/pen background starts marquee.                                                                                                                                                                                                                                 | Avoids committing obsolete IDs/coordinates and preserves the authoritative parent state. Cancellation is simpler than rebasing a gesture onto new inputs. Capture failure cannot safely commit an uncaptured stream. |
| 12  | The polite region starts empty. Announce only changes in the effective committed selected count after mount, including authoritative external selection updates. Count hidden/ineligible retained IDs; total is the normalized current item count. Preview, cancellation, no-op/equal-count changes, data-only/strings-only updates, and rejected controlled proposals stay silent. A confirmed commit produces one count update.                                                                                                                                                                                     | RD-03 specifies selection count changes and no per-frame announcements. Reading committed state prevents announcing a controlled proposal the application rejected.                                                  |

For AR-8, with rectangles A=(0,0,100,100), B=(110,0,100,100),
C=(0,110,100,160), D=(110,110,100,100), E=(110,220,100,100):
C→Right=D (100px overlap beats 50px), C→Up=A, B→Down=D,
D→PageDown=E, A→Left=A. These are confirmed behavioral examples, not implementation-derived tests.

## Confirmed Final Design Packet

The user chose **Confirm design (Recommended)** for AR-13–AR-15 and explicitly confirmed the
complete 15-item register before any other plan document was created.

### AR-13: Focus Plumbing

Use a TileGrid-local mounted-descendant tab-index manager. Library-owned wrappers and selection
inputs receive their props directly; only consumer content requires attribute management. Keep
the current house pattern, geometry-based navigation, and memoized content renderer.

- Outside the grid, all descendants are removed from sequential tab order and only the active
  wrapper is an entry stop. On wrapper/inline-control focus, enable the active tile's eligible
  controls. Forward and reverse entry from outside reach the wrapper. Tab from it explicitly
  focuses its owned selection input first, even when that radio is unchecked and a different
  radio is checked; subsequent controls follow DOM order. Tab after the last control leaves;
  Shift+Tab reverses. Escape returns to the wrapper and menus consume their own Escape first.
- Normalize positive author tabindex values to zero while the active tile is entered, preserving
  DOM order. Preserve author `-1`. Restore the latest author value, including absence, on release.
- Use fixed selectors only within mounted tile content, a per-node author-attribute record, and
  a local `MutationObserver` for inserted/removed controls and relevant attribute changes.
  Drain external mutation records before reconciliation; disconnect the observer during the
  manager's own writes and reconnect immediately. This prevents feedback and separates author
  changes from manager changes. Do not rewrite React-owned library control attributes this way.
- Native focus inside an inactive tile makes it active without stealing focus back to its wrapper.
  Offscreen keyboard targets are scrolled into view. Already-mounted targets use their connected
  refs; absent targets use pending ref-mount completion, guarded by current intent and focus
  ownership. Recovery must not overwrite a live pending target. Keep focus on the root temporarily
  if necessary (preflight PF-004).
- Arbitrary external portals stay under their application's focus lifecycle. The grid does not
  scan or register portal descendants, steal popup focus, or promise restoration after an
  application removes its own popup trigger. RD-04 owns its future shell/menu lifecycle.
- Counterargument: imperative attributes and React can compete. Browser tests must cover current
  author intent, native radios, dynamic children, menu Escape, removal, and all three browsers.

**Independent challenge:** `ses_e9fc39166ffe7UmvIBJ8IbQ3gt` recommended this bounded option.
`useFocusableGroup` implements grouping but not literal inactive `tabIndex=-1`; limited groups
enter on Enter, while unlimited groups do not suppress inactive descendants. The challenger
classified the bounded manager as ordinary feature implementation. A generalized focus framework,
document-wide portal registry, or custom Tabster bridge would be extra machinery and is excluded.
**Confidence:** Medium until browser verification; **Hardening:** converged, with explicit radio,
reverse-entry, observer-write, and portal boundaries added before user confirmation.

### AR-14: Decomposition and Names

Use four sequential phases: (1) selection invariants, interaction props, controls, announcements;
(2) geometry navigation, tab order, focus recovery, filter reset, keyboard zoom;
(3) mounted marquee and terminal reconciliation; (4) combined browser/performance regressions,
stories, documentation, and final verification. Every phase orders specification tests and a red
check before implementation, then green, internal tests, and verification. Existing specification
tests remain unchanged. Extend existing infrastructure rather than adding dependencies or runners.

Use three owning technical documents: `03-01-selection-and-accessibility.md`,
`03-02-navigation-and-focus.md`, and `03-03-marquee-integration.md`. Keep component-local helpers:
`selection/useTileGridInteractions.ts`, `selection/useSelectionAnnouncement.ts`,
`focus/navigation.ts`, `focus/useTileGridFocus.ts`, `focus/useTileGridTabOrder.ts`,
`marquee/useTileGridMarquee.ts`, and `TileGridSelectionControl.tsx`. Modify the existing store,
controller, item view, state, render, types, styles, and anchor helper where they own the behavior.
Small private memoized content rendering may remain in `TileGridItemView.tsx`.

New unit specification files split selection invariants, interaction, accessibility, focus,
keyboard zoom, and marquee integration; corresponding internal tests follow the repository naming.
Browser files split focus, marquee, and combined interactions; they use the existing browser glob
and are immutable behavioral oracles once authored. Reuse `tileGridFixture.ts` and existing
performance measurements; add cases to the existing performance suite rather than a new harness.
Add KeyboardNavigation, InteractionModes, MarqueeSelection, and FilteringAndZoom story exports
through the existing `TileGrid.stories.tsx` entry. Extend the package's unreleased TileGrid README.
Plan documents stay under `plans/rd-03/`; phase reviews use the strict project quality policy.

### AR-15: Controls and Presentation

Compose Fluent `Checkbox` and `Radio` in the grid wrapper, overlaid at the tile's top-left with
token spacing and a token-colored surface. The content rectangle stays unchanged. Inputs use
the item label as their accessible name; each grid generates its own shared radio `name` through
React `useId`. Use the public `Radio`'s supported native `checked`/`name` inputs without changing
list semantics to a radio-group root. Standalone controlled Radio is verified in installed v9.74.9
source (`react-radio/lib/components/Radio/useRadio.js:39–75`), beyond the skill's RadioGroup-only
examples. The bundled skill covers v9.74.1; relevant references are Checkbox, Radio, and foundation
accessibility. Ineligible items have no control under AR-5.

Associate the wrapper's accessible description with its rendered content container using a
generated ID. Applications provide any disabled explanation as readable content. Focus styles use
theme focus tokens; the marquee overlay uses theme stroke/fill tokens, is `aria-hidden`, and never
intercepts pointers. Render the polite status node as a sibling of the list so it is not a fake
list item. Default count text uses English grouped counts (`3 of 20,000 selected`); applications
replace the complete `strings.selectionCount` formatter. No additional public props are introduced.

## Gate Evidence

| Scan category         | Decision / evidence                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| Feature gaps          | AR-1, AR-14; all RD-03 acceptance criteria enter the plan.                                               |
| Behavioral gaps       | AR-8–AR-12.                                                                                              |
| Scope ambiguities     | AR-1–AR-4; exact upstream correction permission is recorded.                                             |
| Technical unknowns    | AR-13–AR-15; installed Fluent APIs and current geometry/store/controller checked.                        |
| Edge cases            | AR-5, AR-7, AR-11; empty/unmounted/disabled/controlled cases are explicit.                               |
| Integration points    | AR-9, AR-10, AR-13; existing modules and app-owned portals have defined boundaries.                      |
| Data & state          | AR-5, AR-11; stable IDs, no pruning, current-parent authority.                                           |
| Security & compliance | Existing RD-03 security contract: React text, no IDs/labels logged, no persistence/network/auth surface. |
| Non-functional gaps   | AR-2; existing 20K fixture, budgets, and browser matrix.                                                 |
| UX & presentation     | AR-12, AR-15.                                                                                            |
| Stakeholder conflicts | AR-1, AR-3; library/app ownership and release scope are explicit.                                        |
| Naming & terminology  | AR-14.                                                                                                   |

Zero unresolved material decisions and no silent deferrals. No new dependency, runner, general
focus framework, or other extra support surface is approved or planned. The bounded focus helper
was independently classified as ordinary feature implementation. The scoped requirements refresh
passed; current plan preflight remains a verification prerequisite, not an unresolved design choice.

## Accepted Preflight Refinements

### Runtime AR-16 — Green Checkpoint Cadence

**Category:** Technical / execution sequencing (runtime).
**Root invocation:** `rd03-20261022-0057`; auto-design policy version 1.
**Problem:** Specification-first tasks must fail before dependent implementation, while the commit
protocol requires full green verification and a commit after each verified task. Committing only
the early specifications creates a red checkpoint; committing their implementation while its
tasks remain pending violates the verification gate.
**Proposed resolution:** Keep expected-red and dependent tasks `[~]`, record red evidence, then
verify/promote each task individually at the first full green boundary and commit that mutually
dependent slice together. Later independent green tasks continue with individual commits/pushes.
**Rejected option:** Completing/pushing failing specifications violates the green commit gate.
**Independent challenge:** `ses_e9f4ce4bbffeG2ydpx0UFBjIuE` supports this as the smallest practical
sequence but identifies commit-cadence authorization as conflicting with the literal per-task
rule; auto-design cannot silently waive a governing constraint.
**Confidence:** High on preserving green commits; medium-high on needing a cadence exception.
**User Decision:** User selected **Group green checkpoints (Recommended)**. Mutually dependent
specification/implementation tasks may share one green commit after individual verification;
subsequent independent tasks retain automatic commit/push after verification.
**Affected gate:** Each phase's first green checkpoint; resolved. No test/verification gate changes.

### Runtime AR-17 — Unsupported Empty-State Oracle

**Category:** Specification correction (runtime); reserved immutable-oracle authority.
**Root invocation:** `rd03-20261022-0057`; auto-design policy version 1.
**Evidence:** The newly authored accessibility test asserts zero listitems after an empty update
at `test/tile-grid-accessibility.spec.test.tsx:150`. The owning 03-01 specification requires existing
empty-list semantics, and ST-11 requires empty content inside the named list with status outside it.
Neither requires zero placeholder listitems. The prior implementation has one placeholder,
explicitly pinned by `test/tile-grid-layout.impl.test.tsx:125–130`.
**Independent author check:** `ses_e9f392081ffe547m6YwoCfIGJG` confirms a drafting error: the
no-fake-item rule for unknown selected IDs was incorrectly extended to the empty-state placeholder.
**Recommended correction:** Remove only the unsupported zero-listitem assertion and restore the
existing placeholder role. Retain every other oracle assertion and the prior implementation test.
**Rejected alternative:** Changing the prior empty-list contract solely to satisfy this unsupported
assertion contradicts the approved specification. No product change is needed.
**Confidence:** High; owning specification and independent author agree.
**User Decision:** User selected **Approve correction (Recommended)** for removal of only the
unsupported zero-listitem assertion and restoration of the existing placeholder role. Applied;
all other new assertions and existing oracles remain unchanged.
**Verification:** New 49 cases passed, full gate 589 passed / 1 failed at the prior placeholder check;
this was not a green checkpoint. The authorized correction now requires full re-verification.

### Runtime AR-18 — Cancelled Native Input Rollback

**Authority:** AI — delegated by `--auto-design`.
**Eligibility:** Internal failure/recovery mechanism for the already approved prevented-event veto;
no public behavior, policy, dependency, or scope expansion.
**Objective:** Keep owned checked presentation consistent after consumer cancellation.
**Evidence:** The new real-DOM internal test observes no selection callback after root `onChange`
prevention, but checkedness becomes true: native cancelled-click rollback follows React's
controlled-state restoration. The owned input already mirrors its latest rendered projection in
DOM `defaultChecked` (03-01 Controls and Item Rendering).
**Decision:** After cancellation, queue one microtask to restore the still-connected input's
checked property from its current `defaultChecked`. No store mutation, callback, or timer service.
**Rejected alternatives:** Synchronous restoration runs before native rollback; forcing a React
rerender adds state and may run before rollback too. Removing native prevention would violate the
consumer event contract.
**Strongest counterargument:** The reconciliation is asynchronous. It runs before the next paint,
uses current projection rather than a stale captured value, and ignores detached inputs.
**Confidence:** High for this bounded DOM reconciliation; reopen if browser matrix disagrees.
**Hardening:** In-context mechanism review; small, reversible change, no independent challenger required.
**Policy version:** 1. **Root invocation ID:** `rd03-20261022-0057`.
**Reopen triggers:** Cross-engine rollback mismatch or a post-unmount mutation/callback.

### Runtime AR-19 — Associated Control Labels

**Authority:** AI — delegated by `--auto-design`.
**Eligibility:** Necessary internal guard correction preserving approved application-control
isolation; no new behavior, public API, dependency, or support framework.
**Objective:** A consumer control and its associated label act locally without selecting/activating a tile.
**Evidence:** RV-001 reproduces wrapping-label clicks that both toggle the checkbox and invoke
grid behavior; `selection/clickSelection.ts` omits labels from target classification. The owning
03-01 Interaction Mapping already excludes application controls from tile actions.
**Decision:** Extend the existing guard to recognize a native label with an associated control,
including clicks on label descendants. Add independent regression specifications before the fix.
**Rejected alternatives:** Guarding every label suppresses ordinary unassociated content;
requiring application markers contradicts automatic native-control isolation; suppressing native
label activation breaks the control. Browser association (`label.control`) handles nesting and htmlFor.
**Strongest counterargument:** Cross-document label instances require their own document's DOM
constructor; preserve fixed selectors and opaque IDs, and use the label's ownerDocument for that check.
**Confidence:** High; independently reproduced and a direct existing-contract correction.
**Hardening:** In-context comparison; small reversible guard extension, no high-stakes escalation trigger.
**Policy version:** 1. **Root invocation ID:** `rd03-20261022-0057`.
**Reopen triggers:** Native-label regressions, lost control activation, or over-blocked unassociated content.

### Runtime AR-20 — Missing-Anchor Range Fallback

**Authority:** AI — delegated by `--auto-design`.
**Eligibility:** Necessary implementation correction for an already explicit anchor invariant;
no new product rule or upstream requirement modification.
**Objective:** Range operations preserve the original anchor, including a hidden or absent anchor.
**Evidence:** RD-01 Range algorithm lines 163–168 specifies target-only fallback when an index is
missing and retention of the original anchor. 03-01 Selection Store Integration also says ranges
preserve it. Current `selection/useGridSelection.ts` calls `selectOnly(targetId)` in that fallback,
which establishes a new anchor. Existing new cases prove only the first fallback, not its effect
on the next range.
**Decision:** Add independent public interaction regression ST-42; replace only the fallback's
anchor-mutating helper call with the same target-only commit through the existing equality guard.
Preserve selection replacement semantics, callback rules, and all other range behavior.
**Rejected alternative:** Treating fallback as a new non-range action contradicts the explicit
retained-anchor invariant. No new state or abstraction is necessary.
**Strongest counterargument:** Common file browsers may establish an anchor on first Shift use;
this project's explicit contract governs instead.
**Confidence:** High; the correction follows the written invariant directly.
**Hardening:** In-context contract/control-flow review; independent oracle precedes the change.
**Policy version:** 1. **Root invocation ID:** `rd03-20261022-0057`.
**Reopen triggers:** A governing requirement explicitly defines a fallback exception or an existing
immutable oracle proves contrary behavior; pause rather than weakening that oracle.

### Runtime AR-21 — Browser ResizeObserver Test Isolation

**Authority:** AI — delegated by `--auto-design`.
**Eligibility:** Necessary test-environment correction inside existing setup; no product behavior,
dependency, runner, or generalized harness changes.
**Objective:** Browser focus/resize oracles use the real browser API independently of prior cases.
**Evidence:** The zero-width browser case passes alone and after the empty-grid case, but fails
after the full focus suite. Bounded instrumentation showed its observer constructor was non-native
and no resize callback arrived. Installed `@fluentui/react-positioning/lib/utils/createResizeObserver.js:4–15`
unconditionally replaces the target window's constructor with a no-op in test mode when positioning
runs. The portalled-menu case therefore contaminates later mounts.
**Decision:** Capture the initial constructor after existing setup installs missing jsdom APIs,
then restore it after cleanup for every test in `test/setup.ts`. Keep actual component measurement
code and all immutable expectations unchanged; remove all diagnostic instrumentation.
**Rejected alternatives:** Changing component measurement to work around a test-only no-op adds
unnecessary runtime work; weakening or reordering the resize oracle hides contamination; changing
the entire browser NODE_ENV has broader effects than restoring this one API.
**Strongest counterargument:** Future dependency callbacks could overwrite the constructor after
cleanup; reopen if isolation still fails or a single test needs a later fresh mount after positioning.
**Confidence:** High; isolated pass, ordered failure, instrumentation, and dependency source agree.
**Hardening:** In-context environmental diagnosis; a direct existing cleanup correction.
**Policy version:** 1. **Root invocation ID:** `rd03-20261022-0057`.
**Reopen triggers:** Recurrent ordered resize failure or changed dependency test-mode behavior.

The user accepted all nine major recommendations, then selected **Apply and re-scan** for the
three minor corrections and the documented singleton-radio exception. The separate
[preflight report](00-preflight-report.md) owns those thirteen finding rulings and verification.
They refine the existing scope and do not introduce new product features or public props.

| Governing document | Refinements                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 03-01              | Native disclosure/editor isolation; private Fluent context boundaries; DOM reset-default synchronization; accepted singleton-radio conformance note. |
| 03-02              | Connected overscan targets versus absent refs; empty-content entry ownership; explicit reverse radio boundary.                                       |
| 03-03              | Gesture-scoped document Escape; border-aware coordinate origin; bounded rectangle-derived host preview.                                              |
| 07 / 99            | Explicit ST-36 seed order; Phase 1/3 preview-test separation; capture simulation; corresponding regression cases and task references.                |

The original fifteen decisions remain resolved. The detailed technical specifications supersede
earlier abbreviated wiring descriptions where these accepted refinements add needed precision.
