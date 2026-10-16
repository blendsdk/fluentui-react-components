# Preflight Report: error-dialog implementation plan

> **Status**: ✅ PREFLIGHT PASSED — all 16 findings resolved and applied; iteration 2 verified 15 satisfied + 1 partial (closed with its cascade fix); the three iteration-2 residuals are closed.
> **Iteration**: 2 of 2 — iteration 1 raised 16 findings; iteration 2 verified every fix (15 satisfied; PF-013 partial, closed via its cascade fix) and closed three residuals.
> **Artifact**: all plan documents of the feature `error-dialog` at
> `codeops/features/error-dialog/plans/error-dialog/` — 00-index, 01-requirements, 02-current-state,
> 03-01-error-dialog, 03-02-system-error-provider, 07-testing-strategy, 99-execution-plan,
> 00-ambiguity-register
> **Revision**: commit `8f19d9f` (clean tree). Blobs at scan start —
> `00-index.md` `88773ff42094bc7a8764102a2d66ab7b03f3e380` · `01-requirements.md` `d89ed44cab7178369e5272a1aa8e8e706ce57815` ·
> `02-current-state.md` `9ee4cd0be3e3d575b8ad5de56ea2a567853d1c96` · `03-01-error-dialog.md` `2bf1013f9467e9c943805e32bc3d255658df8753` ·
> `03-02-system-error-provider.md` `574292887ffb401e09224ccf5a2ef3eebbb933f5` · `07-testing-strategy.md` `2a6b7b219d85027485cf5e61b7f731b1edcd1fcd` ·
> `99-execution-plan.md` `2c2376ff9a51d0020a5da90d3ed8c36db9997fd2` · `00-ambiguity-register.md` `eeb0eecc5e60a808217fa14bd7eb0676aab7774f`.
> A later edit changes the blob; compare before executing (a mismatch makes this scan stale).
>
> **Fix revision (iteration 1.5):** PF-001…PF-008 were applied after this scan —
> `02-current-state`, `03-01`, `03-02`, `07`, `99`, and the plan register changed; iteration 2
> records their new blobs.
> **Context documents** (read, not audited): `requirements/RD-01-error-dialog-component.md`,
> `requirements/RD-02-system-error-provider.md`, `requirements/00-ambiguity-register.md`,
> the two RD preflight reports, `codeops/00-roadmap.md`, `AGENTS.md`.
> **Codebase Grounded**: repository config, installed Fluent UI 9.74.9 / react-dialog 9.18.5 /
> React 19.3.1 / Vitest 5.0.5 / jsdom 30.1.3 / TypeScript 7.0.2 sources; three empirical probes
> (React-19 handler-error path, Vitest `catchWindowErrors` interceptor shape, serializer
> double-serialization) run against the exact installed stack.
> **Scope mode**: strict (no optional additions proposed)
> **Auto-design**: not active — every finding needs an explicit user decision.
> **Auto-effort**: suggested level `high` for this artifact type (not applied; pass `--auto-effort` to apply).

⚠️ **SAME-MODEL REVIEW**: the plan was authored earlier on 2026-10-16 (previous sessions), by the
same model lineage — not in this session. Same-agent bias risk remains. Mitigation applied: the scan
fanned out to **five independent fresh-context cluster auditors**; the two MAJOR findings went to one
independent **design-challenger** before recommendations were recorded; both MAJOR mechanisms were
reproduced with probes against the installed stack.

**Dispatch fallback (recorded):** the named `preflight-auditor` / `design-challenger` agents are not
exposed in this runtime; complete quality-profile packets were dispatched to generic read-only
subagents instead (5 cluster audits + 1 challenger; no failures).

---

## Codebase Context Summary

**Repository**: `blendsdk/fluentui-react` — pnpm + Turborepo monorepo; the only publishable package
is `packages/react-components` (`@blendsdk/fluentui-react-components` 0.1.1). `main` is the
integration branch.

**Tech stack (verified from manifests)**: React 19.3.1 + Fluent UI v9 (`@fluentui/react-components`
9.74.9, peers `^9.0.0`; `@fluentui/react-dialog` 9.18.5 transitive), TypeScript 7.0.2 (`strict`,
`verbatimModuleSyntax`, `noUnusedLocals/Parameters`; **no** `exactOptionalPropertyTypes`), Vitest
5.0.5 + jsdom 30.1.3 + Testing Library 16.3.3 + jest-dom 7.0.1 (no `user-event`), Storybook 10.6.2
with docs + a11y addons only.

**Gate**: `pnpm verify` = format:check → skill:check → type-check → build → test; CI adds
`pnpm storybook:build` and `npm pack --dry-run`. Tests: `test/**/*.{test,spec}.{ts,tsx}`, jsdom,
`test/setup.ts` cleanup, exact export-surface list in `test/package-exports.spec.test.ts`.

**Architecture observed**: one component folder per component following the house pattern
(`<Name>.tsx`, `.types.ts` (type-only), `use<Name>.ts` (state + classes), `render<Name>.tsx`,
`use<Name>Styles.styles.ts`, story, barrel); `src/index.ts` currently exports only `DescriptionList`
and `DescriptionListItem`; README Principles declares "Presentation only — no data, no application
state", which the provider section must carve out.

**Key facts verified for this audit**:

- Fluent dialog: `role="alertdialog"` for `modalType="alert"` (`useDialogSurface.js:102`);
  `aria-labelledby` = DialogTitle id (`:104`, `useDialogTitle.js:27`); the
  `.fui-DialogSurface__backdrop` element renders by default for all modal types; backdrop click
  requests close **only** for `modalType="modal"`; Escape requests close for all types but a
  controlled dialog without `onOpenChange` ignores the request; `useFocusFirstElement` focuses the
  first focusable or the surface (`tabIndex=-1`). `Label` passes `htmlFor` through.
- `tokens.colorPaletteRedForeground1` exists (`@fluentui/tokens` tokens.js:195).
- **React 19 handler-error path (probe-confirmed)**: `dispatchEvent`/`fireEvent` does NOT rethrow a
  throwing `onClick`; React catches it in `executeDispatch`
  (react-dom-client.development.js:20801-20808) and reports via `reportGlobalError` (:28130);
  neither Node 24.21.0 nor jsdom 30.1.3 defines `reportError`, so React dispatches a window
  `ErrorEvent('error', {error, message, cancelable: true})` — captured by a window listener.
- **Vitest 5 jsdom interceptor**: an unhandled window `error` event with non-null `error` becomes a
  run-level `uncaughtException` **unless** ≥1 user `'error'` listener is registered
  (`catchWindowErrors`, vitest chunk `index.CK-t0WMg.js:1248-1270`). Already recorded in the plan
  for the negative-dispatch cases (ST-45/ST-49).
- **Serializer probe**: the `03-01` "Implementation shape" (module-scope `replacer` with one
  `WeakSet`) returns correct JSON on the first call and `"[Circular]"` / nested `"[Circular]"` on the
  second call of the same value.
- RD-01/RD-02 blob hashes equal the recorded passing revisions (preflights not stale); plan register
  claims verified.

---

## Summary by Dimension (primary dimension per finding)

| #   | Dimension              | Findings | Highest severity |
| --- | ---------------------- | -------- | ---------------- |
| 1   | Ambiguities            | 2        | 🟡               |
| 2   | Implicit Assumptions   | 0        | —                |
| 3   | Logical Contradictions | 1        | 🟡               |
| 4   | Completeness Gaps      | 3        | 🟡               |
| 5   | Dependency Issues      | 0        | —                |
| 6   | Feasibility Concerns   | 0        | —                |
| 7   | Testability            | 2        | 🟠               |
| 8   | Security Blind Spots   | 0        | —                |
| 9   | Edge Cases             | 2        | 🟠               |
| 10  | Scope Creep Indicators | 0        | —                |
| 11  | Ordering & Sequencing  | 1        | 🟡               |
| 12  | Consistency            | 2        | 🟡               |
| 13  | Codebase Alignment     | 3        | 🟡               |

## Summary by Severity

| Severity    | Count | Status                                                              |
| ----------- | ----- | ------------------------------------------------------------------- |
| CRITICAL    | 0     | —                                                                   |
| MAJOR       | 2     | ✅ resolved + applied + verified (iteration 2)                      |
| MINOR       | 11    | ✅ resolved + applied + verified (PF-013 via its PA2-1 cascade fix) |
| OBSERVATION | 3     | ✅ resolved + applied + verified                                    |

**Cluster merge map** (5 auditor dispatches → PF numbering):
① PA-1→PF-001, PA-2→PF-002, PA-3→PF-003, PA-4→PF-004, PA-5→PF-005, PA-6→PF-006, PA-7→PF-007,
PA-8→PF-008, PA-9→PF-014; ② PA-1→PF-001, PA-2→PF-011, PA-3→PF-002, PA-4→PF-013, PA-5→PF-007;
③ PA-1→PF-009, PA-2→PF-010, PA-3→PF-008, PA-4→PF-016; ④ PA-1→PF-002, PA-2→PF-001, PA-3→PF-011,
PA-4→PF-003, PA-5→PF-012, PA-6→PF-015; ⑤ PA-1→PF-001, PA-2→PF-002. Cluster ②'s "Phase 3 checklist"
candidate was **refuted and dropped** (`.opencode/skills/make-plan/quality-checklist.md` exists,
titled "# Phase 3 — Quality Checklist"; the citation resolves).

**Hardening**: PF-001 and PF-002 went to one independent design-challenger (blind to the reviewer
picks), which reproduced both mechanisms and **converged**: F1 → reword + sink technique (assert
error identity); F2 → per-call `WeakSet` + stability impl case. _Confidence: high._

---

## Findings

### PF-001: The throwing-handler spec case (ST-40) is not observable as written 🟠 MAJOR

**Dimension:** 7 (Testability), 9 — raised independently by all four audit clusters + lead
**Location:** `07-testing-strategy.md` §Specification Test Cases ST-40 (line 78) and the provider
technique note (lines 98–102, 159–164); `03-02-system-error-provider.md` §Error Handling (line 128);
`99-execution-plan.md` §2.1 (line 136)
**Codebase Evidence:** React 19.3.1 `executeDispatch` catches every listener error and forwards it to
`reportGlobalError` (react-dom-client.development.js:20801-20808, :28130); jsdom 30.1.3/Node 24.21.0
define no `reportError`, so React dispatches a window `ErrorEvent` carrying the error — the probe
shows `dispatchEvent` did not throw and the sink received the thrown Error. Vitest 5 turns an
unhandled error event into a run-level `uncaughtException` unless a user `'error'` listener exists
(vitest chunk `index.CK-t0WMg.js:1248-1270`).
**The Problem:** ST-40 expects "The click throws (the error propagates) and the dialog is closed".
No implementation can make `fireEvent.click` throw under React 19; executing the case without a
sink listener fails the whole run (misattributed, before/regardless of assertions). The plan records
the sink-listener technique only for ST-45/ST-49, so this case has no recorded channel — and the
plan's immutable-oracle rule pushes the spec author into an unwinnable position.

**Options:**

| Option          | Description                                                                                                                                                                                                                 | Assessment                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A (recommended) | Reword ST-40 to the observable semantics: click → sink listener registered by the test asserts it received the **thrown error** (identity) and the dialog is closed; add ST-40 to the recorded technique note (both places) | Keeps RD-02 AC 6's "not swallowed" clause; minimal; reuses the recorded technique; challenger-picked           |
| B               | Drop the propagation clause; assert only "dialog closed" (sink still needed for run hygiene)                                                                                                                                | Needs the sink anyway yet weakens the oracle for an approved AC clause — a scope reduction needing a ruling    |
| C               | Move the case to the implementation test file (`onSignOut` throw observed via spies)                                                                                                                                        | Contradicts the AR #6 allocation ("spec covers every jsdom-observable criterion"); relocates rather than fixes |
| D               | Reformulate as the capture-enabled composition (error re-captured, dialog reopens)                                                                                                                                          | Different behavior, not AC 6; may be worth an _additional_ case (see PF-011) — not a substitute                |

**Recommendation:** Option A — rewording preserves the authorized semantics and reuses the exact
technique the plan already mandates for its other unhandled-error cases.
Confidence: High. Counter-argument: the assertion tests React/jsdom mechanics as much as the
provider — inherent to pinning this clause; the recorded note mitigates it.
**User Decision:** ✅ Resolved — user accepted the recommendation (recorded from the "apply fixes"
instruction that accepted the batch-1 recommendations).
**Applied:** ST-40 reworded to the sink-listener semantics; the provider technique note extended;
`03-02`'s error row and sketch comment aligned (no rethrow claim).

### PF-002: The pinned serializer shape is stateful across calls — repeat serialization corrupts details 🟠 MAJOR

**Dimension:** 9 (Edge Cases), 1, 2 — raised by four clusters + lead; probe-confirmed
**Location:** `03-01-error-dialog.md` §Serialization algorithm — implementation note (lines 123–125)
and "Implementation shape" (lines 129–141); details computed per render (line 76) and per copy-state
flip (lines 144–156)
**Codebase Evidence:** The sketch declares `const replacer = (() => { const seen = new WeakSet(); … })();`
at module scope. Probe with the exact sketch: call 1 of `{status: 500, detail: 'boom'}` →
correct JSON; call 2 → `"[Circular]"`; an `Error` with an object-valued own property renders that
property as `"[Circular]"` on call 2. `JSON.stringify` invokes the replacer at the root (key `""`),
and `details` is re-serialized on every render (copy-availability effect, `copied` flip, host
re-render). No recorded case serializes the same value twice or asserts details stability across a
re-render.
**The Problem:** A literal implementation makes the displayed support details depend on call
history: after any state-driven re-render, plain-object errors show `"[Circular]"` and nested props
degrade — the class of silent wrong-details defect this feature exists to fix. The acknowledged note
covers only the _within-one-call_ shared-reference nuance.

**Options:**

| Option          | Description                                                                                                                                                                                                       | Assessment                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A (recommended) | Create the `WeakSet`/replacer per `serializeError` call (state the lifetime explicitly; keep the acknowledged within-call DAG behavior) and add one impl test: repeated serialization of the same value is stable | One-line scope change + one test; preserves all acknowledged behavior; challenger-picked |
| B               | Keep the module-scope singleton, document the degradation                                                                                                                                                         | Knowingly ships corrupted details; rejected                                              |
| C               | Memoize `details` on `error` identity, keep the singleton                                                                                                                                                         | Module state still leaks across instances/catches; adds machinery                        |
| D               | Path-stack replacer distinguishing cycles from shared references                                                                                                                                                  | Changes acknowledged output; new machinery — out of scope for this fix                   |

**Recommendation:** Option A — restores determinism with the smallest change; the stability test
closes the coverage gap. Confidence: High (mechanism probe-verified). Counter-argument: DAG-payload
false positives remain; they are explicitly acknowledged and pinned by the planned impl case.
**User Decision:** ✅ Resolved — user accepted the recommendation.
**Applied:** replacer/`WeakSet` scoped per call in `03-01`'s note and sketch; repeat-serialization
stability added to the impl-test inventories (`07` table, `03-01` §Testing Requirements).

### PF-003: `serializeError` declared `: string` but the algorithm returns `undefined` in the terminal fallback 🟡 MINOR

**Dimension:** 3 (Logical Contradictions) — raised by two clusters
**Location:** `03-01-error-dialog.md` §Interfaces (line 69, `export function serializeError(error: unknown): string;`)
vs §Serialization algorithm step 4 (lines 120–121)
**Codebase Evidence:** The serializer is specified "pure, never throws; no string-table access"
(line 112), so the documented terminal path ("returns `undefined` and the hook maps that to
`strings.noDetails`") is the only route; `strict` TypeScript rejects returning `undefined` from
`: string`.
**The Problem:** The declared signature cannot implement the ST-17/ST-18 paths without a silent
deviation; implementers must add a cast (banned) or change the signature on their own.
**Options:** (a) declare `serializeError(error: unknown): string | undefined` (recommended —
one-word change, no behavior change); (b) let it throw and catch in the hook (contradicts
"never throws"). Only (a) is viable.
**Recommendation:** Option (a). Confidence: High.
**User Decision:** ✅ Resolved — user accepted the recommendation.
**Applied:** `serializeError` declared `string | undefined` in `03-01` §Interfaces and in register
AR #5's option text.

### PF-004: AR #5 records `useErrorDialogStyles(state)`; `03-01` declares the static no-argument form 🟡 MINOR

**Dimension:** 12 (Consistency)
**Location:** `00-ambiguity-register.md` AR #5 (line 20) vs `03-01-error-dialog.md` §Interfaces
(line 101) and §Proposed Changes (line 37)
**Codebase Evidence:** The user-accepted AR #5 text says "…`useErrorDialogStyles(state)` returning
Griffel classes"; `03-01` declares `export function useErrorDialogStyles(): ErrorDialogClasses;`
("static"). The house pattern parameterizes the styles hook only when classes vary
(`useDescriptionListStyles(layout)`, `useDescriptionList.ts:41`); ErrorDialog's classes are
state-independent, so a `state` parameter would be unused — `noUnusedParameters` is on.
**The Problem:** Two artifacts in the set disagree about the accepted internal interface packet
(AR #5 is explicitly "the signatures the spec-test author receives").
**Options:** (a) amend the AR #5 wording to the executed static signature and point at
`03-01 §Interfaces` (recommended — substance unchanged); (b) change `03-01` to take `state`
(rejected — unused parameter, no behavior gained). Only (a) is viable.
**Recommendation:** Option (a). Confidence: High.
**User Decision:** ✅ Resolved — user accepted the recommendation.
**Applied:** AR #5's option text records `useErrorDialogStyles()` (static classes) per
`03-01 §Interfaces`.

### PF-005: The sign-out wrapper sketch uses `onSignOutRef` — never declared or explained 🟡 MINOR

**Dimension:** 1 (Ambiguities), 12
**Location:** `03-02-system-error-provider.md` §Provider state and construction (lines 62–69)
**Codebase Evidence:** The normative snippet calls `onSignOutRef.current?.()` inside a
`useCallback([clearError])`; the §Interfaces block declares only `SystemErrorContextValue`,
`CaughtErrorState`, `useGlobalErrorCapture`. The parallel latest-ref pattern is shown only in the
capture hook (`onErrorRef`, lines 94–95).
**The Problem:** An undeclared identifier in the implementable spec: the executor must invent the
ref's declaration/refresh or silently switch callback semantics and dependency arrays.
**Options:** (a) add the declaration/refresh to the sketch (`const onSignOutRef = useRef(onSignOut);
onSignOutRef.current = onSignOut;`) mirroring the capture hook (recommended); (b) call `onSignOut`
directly and list it in the deps (viable; requires dropping the ref and explaining the change).
**Recommendation:** Option (a) — keeps the documented stable-wrapper design and matches the
adjacent pattern. Confidence: High.
**User Decision:** ✅ Resolved — user accepted the recommendation.
**Applied:** `onSignOutRef` declaration/refresh added to the `03-02` sketch with a sentence on the
latest-ref idiom.

### PF-006: Unqualified "register AR #N" citations resolve to the wrong entry or none 🟡 MINOR

**Dimension:** 12 (Consistency)
**Location:** `03-02-system-error-provider.md` lines 12, 62, 111, 127; `99-execution-plan.md`
line 123 (vs the correct form at line 127)
**Codebase Evidence:** Two registers exist (plan: 9 entries; requirements: 19). The convention is
declared in `03-01` (lines 215–217: the feature register is cited as "feature register AR #N").
Line 111's "AR #4" resolves to the plan's AR #4 (public export surface — unrelated) instead of the
requirements AR #4 (`kind` union); "register AR #19" resolves to no plan entry (requirements
AR #19); line 12's "AR #15 route" is likewise unqualified.
**The Problem:** Reviewers/executors following the citations land on unrelated rows, and the
plan's own declared convention is violated.
**Options:** qualify the four citations ("feature register AR #4", "requirements AR #19", …) and
align `99:123` with `99:127` (recommended; renumbering registers is not viable — both are settled).
**Recommendation:** the qualifier fix; documentation-only. Confidence: High.
**User Decision:** ✅ Resolved — user accepted the recommendation.
**Applied:** citations qualified as "requirements AR #19" / "requirements AR #4" / "requirements
AR #15" in `03-02`, `99`, and the plan register.

### PF-007: Two citations point at a nonexistent section `03-01 §Files` 🟡 MINOR

**Dimension:** 13.1 (Phantom References)
**Location:** `02-current-state.md` line 48 ("RD-01 anatomy / `03-01 §Files`");
`99-execution-plan.md` Step 1.2 deliverable line 92 ("Component per the `03-01 §Files` table")
**Codebase Evidence:** `03-01` has no `Files` section; the file table sits under §Architecture →
§Proposed Changes (lines 31–40).
**The Problem:** The execution-path citation does not resolve by its stated name.
**Options:** (a) repoint both citations to §Proposed Changes (recommended); (b) add a `Files`
heading to satisfy the shorthand (unnecessary churn). Only (a) is warranted.
**Recommendation:** Option (a). Confidence: High.
**User Decision:** ✅ Resolved — user accepted the recommendation.
**Applied:** both citations repointed to the `03-01 §Proposed Changes` file table.

### PF-008: ST-53 is both a "written before implementation" spec case and an after-implementation smoke test 🟡 MINOR

**Dimension:** 11 (Ordering & Sequencing), 12 — raised by two clusters
**Location:** `03-02-system-error-provider.md` §Testing Requirements (lines 136–140) vs
`99-execution-plan.md` §2.1 vs task 2.3.2 (line 165) and `07-testing-strategy.md` (line 91 in the
ST table; line 127 under "Implementation Tests"; checklist line 170)
**Codebase Evidence:** `03-02:136` says the provider spec tests (ST-33…**ST-53**) are written before
implementation; the same block files the SSR smoke under implementation tests; `07` places ST-53 in
the mandatory ST table yet under "Written AFTER implementation"; task 2.3.2 authors it in the
hardening step, and the §2.1 deliverable carries only ST-33…ST-51. The ST-table preamble also still
says it is derived "exclusively from RD-01 and `03-01`" although the table carries RD-02 cases.
**The Problem:** The executor cannot tell whether ST-53 belongs to the red phase or the hardening
step; the section framing is stale.
**Options:** (a) declare the exception explicitly — ST-53 stays in the table for criterion
traceability but is authored in step 2.3.2 (not part of the pre-implementation oracle); fix the
03-02 range and refresh the preamble (recommended); (b) move/renumber ST-53 (breaks references);
(c) author it in step 2.1 (contradicts the AR #9 allocation and task 2.3.2).
**Recommendation:** Option (a); documentation-only. Confidence: High.
**User Decision:** ✅ Resolved — user accepted the recommendation.
**Applied:** `03-02` spec range corrected to ST-33…ST-52 with the ST-53 SSR note; `07`'s note and
preamble refreshed; the Step 2.1 deliverable names the ST-52/ST-53 handling.

### PF-009: RD-02 AC 6's provider `onReload` clause has no verification channel 🟡 MINOR

**Dimension:** 4 (Completeness Gaps)
**Location:** `07-testing-strategy.md` ST-33…ST-52 and coverage goal (line 19);
`99-execution-plan.md` task 2.3.3
**Codebase Evidence:** RD-02 AC 6 requires: `"Reload page"` exists only when the provider received
`onReload` (RD-02:288–289). No ST case passes a provider `onReload`; no story or impl item covers
it; the coverage table nevertheless claims "every jsdom-observable RD-02 acceptance criterion".
**The Problem:** A silent provider regression (dropping `onReload`, or a dead action) passes the
entire gate while the coverage claim overstates verification.
**Options:** (a) add one spec case — provider with `onReload`: click "Reload page" → callback once,
`clearError` not called; provider without `onReload`: no action (recommended; optionally an
`onReload` story); (b) name review as the channel (weaker).
**Recommendation:** Option (a). Confidence: High.
**User Decision:** ✅ Resolved — user accepted the recommendation (batch-2 instruction).
**Applied:** spec case ST-54 added; every provider-ST enumeration updated (`07` coverage + spec-file
table, `03-02` §Testing Requirements, `99` Step 2.1 reference + deliverable).

### PF-010: The RD-mandated no-raw-HTML rendering test exists in no channel, while Success Criteria #5 claims it 🟡 MINOR

**Dimension:** 4 (Completeness Gaps), 8
**Location:** `99-execution-plan.md` Success Criteria #5 (line 198); `07-testing-strategy.md` ST
table / impl list; `03-01` §Testing Requirements
**Codebase Evidence:** RD-01 §Security Considerations requires "tests assert no raw-HTML
rendering" (context doc). No ST case feeds markup (`error="<img …>"`) and no impl item asserts the
details render as text; Success Criteria #5 nevertheless claims "details render as text only (no
HTML injection)".
**The Problem:** An approved security property is claimed as verified with no allocated test; the
project standards make injection tests mandatory.
**Options:** (a) one spec case: a markup-carrying `error` (and/or `detailsText`) renders as the
literal string with no element nodes (recommended — same hostile-input pattern as ST-10/ST-17);
(b) impl assertion + source check; (c) review channel.
**Recommendation:** Option (a). Confidence: High.
**User Decision:** ✅ Resolved — user accepted the recommendation (batch-2 instruction).
**Applied:** spec case ST-55 added (markup rendered as text); dialog spec-file coverage and `99`
Step 1.1 reference updated.

### PF-011: "Dialog stays closed" after a throwing sign-out is unconditional; with capture enabled the error is re-captured and the dialog reopens 🟡 MINOR

**Dimension:** 9 (Edge Cases), 8 — raised by two clusters
**Location:** `03-02-system-error-provider.md` §Error Handling (line 128) and sketch comment
(line 67); `07-testing-strategy.md` ST-40 (line 78, no capture configuration stated)
**Codebase Evidence:** React reports the handler error as a window `error` event (probe); the
provider's own capture listener (registered when `captureGlobalErrors` is on, `03-02:97-107`) maps
`event.error ?? event.message` to `catchError` (`:99`) with `kind:'error'` (`:111`) → last-wins
reopens the dialog. RD-02 documents that the listener observes React 19's own global reports
(RD-02:157–158). The listening window runs synchronously during the click.
**The Problem:** The unqualified end-state claim is false in a documented configuration; ST-40
does not state its configuration, so a reviewer could "fix" the contradiction by suppressing
capture of the provider's own report — violating the non-suppression contract.
**Options:** (a) qualify the statements ("with capture disabled the dialog stays closed; with
capture enabled the reported error is re-captured as `kind:'error'` (last-wins)") and name ST-40's
configuration (recommended; optionally pin the capture-on composition as an additional case);
(b) keep the text and rely on ST-40's implied capture-off setup (leaves a false claim).
**Recommendation:** Option (a) — the reopen is the authorized composition of two approved
behaviors; only the wording is wrong. Confidence: High on the mechanism; documentation-only fix.
**User Decision:** ✅ Resolved — user accepted the recommendation (batch-2 instruction).
**Applied:** capture-on consequence stated in the `03-02` error row and capture-hook section;
ST-40 names its capture-off configuration (the optional extra composition case was not added).

### PF-012: The recorded clipboard stub cannot drive the copy success/rejection cases 🟡 MINOR

**Dimension:** 7 (Testability)
**Location:** `07-testing-strategy.md` §Test Data / Mock Requirements (line 152) vs ST-21
(line 59), ST-22 (line 60); `03-01` §Copy state machine (line 150)
**Codebase Evidence:** The recorded stub is `{ writeText: vi.fn() }` — returns `undefined`; the
state machine flips `copied` only when the write **resolves** (`03-01:150`), and ST-21 expects the
label to read "Copied". A `.then` on `undefined` throws inside the click handler → React reports it
→ Vitest run-level failure without a sink (same mechanism as PF-001).
**The Problem:** The strategy's only recorded clipboard technique does not support the cases it is
attached to; the executor must invent the resolving/rejecting stubs (and could hit the run-level
failure first).
**Options:** record `mockResolvedValue(undefined)` for ST-21 and `mockRejectedValue` for ST-22,
keeping `vi.fn()` as the availability probe (recommended; documentation-only). Rejected:
requiring the implementation to normalize non-thenables (unstated requirement).
**Recommendation:** the recorded-stub fix. Confidence: High.
**User Decision:** ✅ Resolved — user accepted the recommendation (batch-2 instruction).
**Applied:** `07` §Mock Requirements records `mockResolvedValue(undefined)` / `mockRejectedValue`;
bare `vi.fn()` scoped to the availability probe.

### PF-013: `errorDialogDefaultStrings` is planned inside `.types.ts`, violating the recorded house rule 🟡 MINOR

**Dimension:** 13.8 (Convention Violations)
**Location:** `03-01-error-dialog.md` §Interfaces (lines 64–65, the "ErrorDialog.types.ts" block)
**Codebase Evidence:** `.opencode/skills/fluentui-components/references/component-anatomy.md:19` —
`<Name>.types.ts` "Must not contain: Values, defaults, imports of React"; `:89` — "Defaults live in
the hook, not in the type". The living example (`DescriptionList.types.ts`) is type-only; the only
value default lives in a _Context_ file. No AR entry records an exception.
**The Problem:** The plan claims to follow the house pattern yet places a runtime constant in the
contract file, conflicting with the repository's component-authoring skill.
**Options:** (a) define the defaults in `useErrorDialog.ts` (the hook is their only consumer)
(recommended — matches the rule, keeps the file table unchanged); (b) record an explicit exception
or a dedicated module (more churn).
**Recommendation:** Option (a). Confidence: High.
**User Decision:** ✅ Resolved — user accepted the recommendation (batch-2 instruction).
**Applied:** `errorDialogDefaultStrings` moved to the `useErrorDialog.ts` block in `03-01`;
files-table role lines updated; iteration 2 found and closed the `99` task-line cascade (PA2-1).

### PF-014: Step-3 parenthetical "(functions/symbols without a mapping)" contradicts the replacer 🔵 OBSERVATION

**Dimension:** 1 (Ambiguities)
**Location:** `03-01-error-dialog.md` §Serialization algorithm step 3 (line 118) vs the replacer
(line 133) and ST-15
**Codebase Evidence:** Functions **are** mapped (`"[Function]"`); only unmapped values (symbols,
etc.) reach the `String(error)` fallback. ST-15 expects a top-level function to render
`"[Function]"`.
**The Problem:** The parenthetical is factually imprecise next to the code that maps functions.
**Options:** single fix — drop "functions/" from the parenthetical (or say "symbols and other
unmapped values").
**Recommendation:** the wording fix. Confidence: High. Behavior cannot change if the shown replacer
is implemented.
**User Decision:** ✅ Resolved — user accepted the recommendation (batch-2 instruction).
**Applied:** parenthetical now "(symbols and other unmapped values)".

### PF-015: Render-phase ref writes in the capture hook and sign-out wrapper 🔵 OBSERVATION

**Dimension:** 13.8 (Convention Violations)
**Location:** `03-02-system-error-provider.md` §Capture hook (line 95, `onErrorRef.current = onError;`)
and §Provider state (lines 64–69, the `onSignOutRef` upkeep this pattern implies; see PF-005)
**Codebase Evidence:** Repo conventions: "Hooks and render functions stay pure" (AGENTS.md;
fluentui-components skill). In this plan the captured callbacks are stable (`catchError` memoized),
so the write is inert in practice; `onSignOut` may be an unstable host arrow, but only the latest
committed value is read on click.
**The Problem:** No observable defect; the plan pins a pattern the repository's own rules
discourage, and implementers will copy it.
**Options:** (a) assign the ref in a layout/effect hook (behaviorally identical for stable
callbacks) or (b) keep the render-phase write with a one-line justification comment; either is
acceptable. This is hygiene, not a gate.
**Recommendation:** (b) if the smallest diff is preferred; (a) if strict purity is preferred.
Confidence: High on the rule; consequence theoretical.
**User Decision:** ✅ Resolved — user accepted the recommendation (batch-2 instruction).
**Applied:** smallest-diff variant — the render-phase assignment kept with the latest-ref
justification added to the capture hook and the wrapper sentence.

### PF-016: Task 1.3.4's manual Storybook pass has no named operator 🔵 OBSERVATION

**Dimension:** 4 (Completeness Gaps)
**Location:** `99-execution-plan.md` task 1.3.4 (line 105) and deliverable (line 110);
`07-testing-strategy.md` §E2E N/A (lines 25–28, 137)
**Codebase Evidence:** The RD-approved channel for the literal Tab-cycle focus trap is the
Storybook/manual keyboard pass (no browser harness; no interaction addon exists —
`02-current-state.md:22-24`). The task requires "a recorded manual pass" from an executor that
cannot press Tab headlessly, without naming the operator (user-assisted checkpoint or equivalent).
**The Problem:** The evidence for RD-01 AC 18's focus item can become unobtainable or be recorded
without an owner; the phase could stall or complete with unverifiable evidence.
**Options:** (a) state that the pass is user-assisted and record the result at phase verification
(recommended); (b) leave to the executor (status quo).
**Recommendation:** Option (a); process clarification, ≤1 line.
**User Decision:** ✅ Resolved — user accepted the recommendation (batch-2 instruction).
**Applied:** task 1.3.4 and its deliverable mark the Storybook pass user-assisted and recorded
with the task marks.

---

## Iteration 2 — Fix Verification & Regression Check

**Verifier:** a separate preflight-auditor dispatch (fix-diff scoped; repo sources re-read, no repo
runs executed by the verifier).

**Result:** all 16 fixes verified applied and correct — 15 SATISFIED, 1 PARTIAL (PF-013; its
task-line cascade was missed and is closed below); no contradictions among the fixes or with
untouched sections; all edited Markdown tables are structurally well-formed; ST-40's mechanism was
re-grounded in the installed sources (`react-dom-client.development.js:20801-20808,28130-28153`;
`vitest/dist/chunks/index.CK-t0WMg.js:1248-1270`); ST-55's expectation was checked against the
Fluent `Textarea` value binding (no child nodes — the literal-text assertions hold in jsdom).

**Iteration-2 residuals (all closed before the pass was recorded):**

| ID    | Sev | Finding                                                                                                                     | Resolution                                                                       |
| ----- | --- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| PA2-1 | 🟡  | PF-013's move did not cascade to `99` task 1.2.1 (the task still assigned the string defaults to `.types.ts`)               | 1.2.1 retitled "Public types"; the defaults added to 1.2.3's scope               |
| PA2-2 | 🔵  | ST-55's Source cell cited AC 7/9 although the `detailsText` clause traces to AC 10                                          | Source now `RD-01 AC 7/10 · §Security`                                           |
| PA2-3 | 🔵  | Register label drift — `03-01` still declared "feature register AR #N" while the applied citations use "requirements AR #N" | Convention line and the AR #10 citation aligned to the "requirements AR #N" form |

No further re-scan was performed: the residuals are direct consequences of the accepted fixes and
were verified by reading the changed clauses (per the convergence rules).

**✅ VERDICT: PREFLIGHT PASSED — all 16 findings resolved; no open findings.**

- **Passing revision (blobs):** `00-index.md` `88773ff42094bc7a8764102a2d66ab7b03f3e380` ·
  `01-requirements.md` `d89ed44cab7178369e5272a1aa8e8e706ce57815` · `02-current-state.md`
  `4ce60c2b73175dbe307c6ff609f430e68038a8af` · `03-01-error-dialog.md`
  `f527393e9fdba17a15969bf53aa9ec408faa9762` · `03-02-system-error-provider.md`
  `98b70c148ae44bbb3153371b89a08211ff2ccee8` · `07-testing-strategy.md`
  `6ac061746abad1fd1c8045557d2c4de00d7ee3fd` · `99-execution-plan.md`
  `d6fa3e0f2e12aac77c310d1930fdf841f59ea98c` · `00-ambiguity-register.md`
  `19cbcec16cd5f79ac1c4071f15324cf5fffcaa81`
- **Roadmap:** advanced to `Plan Preflighted` (🔬).
- **Next:** `exec-plan` for the feature (Phases 1–2 per `99-execution-plan.md`).
- **Residual risks (recorded):** the sink-listener/interceptor mechanics were source-verified, not
  executed; the target is a plan, so repository runs happen at execution time.

## Verification notes (what was and was not executed)

- **Executed (probes, exact installed stack):** React 19.3.1 + jsdom 30.1.3 handler-error path
  (`dispatchEvent` did not throw; window error event carried the thrown `Error`); the Vitest
  `catchWindowErrors` interceptor shape (source-read + interceptor logic simulated in the probe);
  the 03-01 serializer sketch double-serialization (call 2 → `"[Circular]"`/nested `"[Circular]"`).
- **Not executed:** the repository's own build/test commands (`pnpm verify`, `pnpm test`,
  `pnpm storybook:build`) — the target is a plan, not code. jsdom focus/token behaviors remain
  verified at the level recorded by the RD preflights (jsdom `getComputedStyle` + Griffel bucket
  ordering were source-checked during this scan: the 700 px cap is observable).
- **Unverifiable at scan time:** none beyond the above; every finding cites concrete
  document or source evidence.
