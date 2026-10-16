# Preflight Report: RD-02 — SystemErrorProvider Component

> **Status**: ✅ PREFLIGHT PASSED — all 17 findings resolved (plus 2 iteration-2 residuals closed)
> **Iteration**: 2 of 2 — iteration 1 raised 17 findings; iteration 2 verified every fix and
> closed the two residuals the fixes introduced
> **Artifact**: single requirement document —
> `codeops/features/error-dialog/requirements/RD-02-system-error-provider.md`
> **Revision**: scan start — commit `2b1be6a`, blob `1576d64854fbd33440216ae0a323430ce9efdca8`;
> passing revision — blob `c635c3120bfdad1775a40c982151ad7eaa23072d`
> **Codebase Grounded**: installed Fluent UI 9.74.9, Vitest 5.0.5, jsdom 30.1.3 and TypeScript
> 7.0.2 sources examined; type probes and the Vitest `error`-interceptor behavior reproduced
> empirically against the exact repository stack
> **Scope mode**: strict (no optional additions proposed)
> **Last Updated**: 2026-10-16 07:28

⚠️ **SAME-SESSION REVIEW**: the artifact was created in the current session by the same model.
Mitigation applied: the scan fanned out to **three independent cluster auditors** (dimensions
1/3/11/12, 2/4/5/7 and 6/8/9/10/13), the major batch went to one independent **design-challenger**
before recommendations were recorded, and iteration 2 was verified by a **separate auditor** that
reproduced the recorded jsdom technique against the installed stack. Consider a fresh-session
audit if this feature ever becomes security- or compliance-critical.

---

## Codebase Context Summary

**Context**: RD-02 is the provider companion of the preflighted, frozen RD-01 dialog; it renders
one controlled `ErrorDialog` and exposes `useSystemError()`. RD-01 was not re-audited; the scan
checked that RD-02's assumptions about its union, runtime guards and export surface hold.

**Key facts verified for this audit**: the installed Fluent UI v9 ships `Toaster` +
`useToastController` (no `ToastProvider`); RD-01's prop union forbids dynamic `kind` and
cross-variant callbacks (three TypeScript probes: `TS2322`/`TS2345`/`TS2353`); Vitest's jsdom
environment converts an `error` event carrying `error` into a run-level unhandled error when no
user listener is registered (`catchWindowErrors` in the installed Vitest); jsdom 30 constructs
and dispatches `ErrorEvent` and `PromiseRejectionEvent` (non-cancelable by default — `cancelable:
true` is required for a meaningful non-suppression assertion); React DOM 19 reports its own
global errors through the same window channel.

---

## Summary by Dimension

| #   | Dimension              | Findings (touching)                             | Highest severity |
| --- | ---------------------- | ----------------------------------------------- | ---------------- |
| 1   | Ambiguities            | 0                                               | —                |
| 2   | Implicit Assumptions   | 0                                               | —                |
| 3   | Logical Contradictions | 1 (PF2-001)                                     | 🟠               |
| 4   | Completeness Gaps      | 4 (PF2-003, PF2-006, PF2-007, PF2-008)          | 🟠               |
| 5   | Dependency Issues      | 1 (PF2-001)                                     | 🟠               |
| 6   | Feasibility Concerns   | 3 (PF2-001, PF2-009, PF2-015)                   | 🟠               |
| 7   | Testability            | 4 (PF2-004, PF2-006, PF2-008, PF2-009)          | 🟠               |
| 8   | Security Blind Spots   | 2 (PF2-009, PF2-013)                            | 🟡               |
| 9   | Edge Cases             | 3 (PF2-002, PF2-014, PF2-015)                   | 🟠               |
| 10  | Scope Creep Indicators | 1 (PF2-012)                                     | 🔵               |
| 11  | Ordering & Sequencing  | 1 (PF2-016)                                     | 🔵               |
| 12  | Consistency            | 5 (PF2-001, PF2-004, PF2-005, PF2-011, PF2-017) | 🟠               |
| 13  | Codebase Alignment     | 3 (PF2-005, PF2-009, PF2-010)                   | 🟡               |

## Summary by Severity

| Severity    | Count | Status                                               |
| ----------- | ----- | ---------------------------------------------------- |
| CRITICAL    | 0     | —                                                    |
| MAJOR       | 4     | ✅ all resolved (challenger-reviewed where judgment) |
| MINOR       | 6     | ✅ all resolved                                      |
| OBSERVATION | 7     | ✅ all applied or noted                              |

**User ruling:** sign-out policy Option X chosen explicitly; the remaining findings accepted as
a batch (bulk acceptance is an explicit decision per the gate rules).

**Hardening:** PF2-001/002/003 were independently challenged in one batch (the challenger saw
the findings without the reviewer picks). Verdict: **agree** — PF2-001 has no better option under
frozen RD-01; PF2-002/003: X with refinements (clear-first ordering so re-entrant reports win and
throwing handlers cannot re-trap), which were incorporated; Z rejected (silently relabels the
caller's `kind` and restores the legacy dismissal path). _Confidence: high._

---

## Findings

### PF2-001: Provider→dialog prop construction not type-checkable against RD-01's union 🟠 MAJOR

**Dimension:** 3, 5, 12 — raised independently by all three clusters
**Location:** State and rendering flow; Must Have (sign-out bullet)
**Codebase Evidence:** RD-01's discriminated union requires `onSignOut` for `unauthorized` and
forbids `onDismiss`/`onReload` there; three type probes against the installed TypeScript 7.0.2
failed (`TS2322`/`TS2345`/`TS2353`); RD-01's accepted PF-014 resolution prescribes narrowing by
`kind`.
**The Problem:** the flat dynamic-`kind` construction cannot compile without a banned cast, and
no construction existed for the "no `onSignOut`" path.
**Options:** (A) per-kind narrowing (recommended) · (B) reopen RD-01 (invalidates its preflight
pass) · (C) a cast (banned by the repository standards).
**User Decision:** ✅ Resolved — accepted recommendation Option A.
**Applied:** the render flow now builds each variant separately with shared props assembled once;
AC 6 pins the resulting behaviors.

### PF2-002: Unauthorized catch without `onSignOut` traps the user 🟠 MAJOR

**Dimension:** 9
**Location:** Must Have; AC 6
**Codebase Evidence:** RD-01's unauthorized variant is sign-out-only and non-dismissible (alert;
no Close; Escape/backdrop disabled); with the provider's optional `onSignOut` (AR #16) the only
button could be inert — a permanently blocking modal.
**Options:** (X) wrapper clears first, then invokes the handler if defined (recommended) ·
(Y) stay inert (reload is the escape) · (Z) downgrade to the dismissible error variant.
**Recommendation:** X — a missing handler must not become an end-user trap; Y "converts a
developer misconfiguration into an end-user trap, strictly worse than the legacy defect"; Z
silently relabels the caller's explicit `kind` and restores the removed dismissal path.
**User Decision:** ✅ Resolved — **Option X**, recorded as register AR #19.
**Applied:** MH-5, the render flow, AC 6, the Scope Decisions row and register AR #19 state the
clear-first wrapper, the missing-handler close, the throwing-handler close and the re-entrant
guarantee.

### PF2-003: Post-sign-out state left the modal able to survive host navigation 🟠 MAJOR

**Dimension:** 4
**Location:** State and rendering flow; AC 6
**Codebase Evidence:** the provider wraps the app, so SPA route changes do not unmount it; RD-01's
unauthorized variant has no dismissal path.
**Options:** clear immediately in the wrapper (recommended) · leave clearing to the host.
**Recommendation:** clear immediately — there is no completion signal to defer to, and the
provider owns the only ergonomic clear path.
**User Decision:** ✅ Resolved — accepted as part of Option X.
**Applied:** the wrapper clears before invoking; a throwing handler still leaves the dialog
closed; a re-entrant `catchError` inside the handler wins (last-wins).

### PF2-004: Vitest jsdom `error` interceptor breaks the recorded negative/cleanup technique 🟠 MAJOR

**Dimension:** 7, 4
**Location:** Verification; AC 10, AC 14
**Codebase Evidence:** Vitest 5.0.5 `catchWindowErrors` converts an `error` event carrying
`error` into a run-level unhandled error when no user listener is registered (reproduced: the
run exits 1); a removed listener and a leaked listener are indistinguishable by dispatch.
**Options:** (A) record the working techniques (recommended) · (B) weaken the assertions.
**User Decision:** ✅ Resolved — accepted recommendation Option A.
**Applied:** capture-off and post-removal dispatches use a test-owned sink listener or
message-only events; listener removal is verified with `addEventListener`/`removeEventListener`
spies.

### PF2-005: `ToastProvider` is not a Fluent UI v9 export 🟡 MINOR

**Dimension:** 12, 13
**Location:** Feature Overview; register resolution note
**Codebase Evidence:** installed `@fluentui/react-components` 9.74.9 exports `Toaster` +
`useToastController`, no `ToastProvider`; the toast pattern is `toasterId`-keyed, not
provider-scoped.
**The Problem:** the only cited precedent did not exist and implied the module-level singleton
the RD forbids.
**User Decision:** ✅ Resolved — accepted recommendation: accurate wording with deliberate
differences (context-scoped; the hook throws).
**Applied:** both RD-02 and the register note corrected.

### PF2-006: Must-Have clauses without criteria or verification channels 🟡 MINOR

**Dimension:** 4, 7, 12
**Location:** Must Have (structure, SSR, README); ACs; Verification
**Codebase Evidence:** RD-01's preflight treated an unverified Must-Have clause as MINOR
(REG-001); jsdom always provides `window`, so the SSR claim had no channel.
**User Decision:** ✅ Resolved — accepted recommendation: AC 1 (no wrapper element), AC 2
(exactly one dialog), a node-environment SSR smoke test (`// @vitest-environment node`, import +
`renderToString`), and the README review-verified note.
**Applied:** anatomy table, Verification, AC 17 and new AC 18 updated.

### PF2-007: AC 15 conflated two different serialization fallbacks 🟡 MINOR

**Dimension:** 4, 7
**Codebase Evidence:** RD-01 AC 8/9 — revoked `Proxy` → default no-details text; throwing
accessor → `String(value)` (e.g. `[object Object]`).
**User Decision:** ✅ Resolved — accepted recommendation: split the criterion with exact outputs.
**Applied:** AC 15 reworded.

### PF2-008: Hook-misuse criterion not pinning an observable 🟡 MINOR

**Dimension:** 4, 7
**User Decision:** ✅ Resolved — accepted recommendation: AC 9 pins an `Error` whose message
names both `useSystemError` and `SystemErrorProvider`.

### PF2-009: Non-suppression assertion vacuous on non-cancelable events 🟡 MINOR

**Dimension:** 7, 8
**Codebase Evidence:** jsdom constructs `ErrorEvent`/`PromiseRejectionEvent` non-cancelable by
default; `preventDefault()` leaves `defaultPrevented === false` — the assertion could not detect
suppression.
**User Decision:** ✅ Resolved — accepted recommendation: construct the events with
`cancelable: true`.
**Applied:** Verification and AC 13 updated.

### PF2-010: Pattern deviations unacknowledged 🟡 MINOR

**Dimension:** 13
**Codebase Evidence:** the house anatomy expects a styles file and render split; the package
README's "presentation only" principles wording would contradict a stateful provider.
**User Decision:** ✅ Resolved — accepted recommendation: a recorded pattern-exceptions bullet
(no styles, no native pass-through, state+render in the provider, capture isolated) and a README
principles carve-out.
**Applied:** Constraints bullet + anatomy README row updated.

### PF2-011 … PF2-017: Observations 🔵

| ID      | Finding                                                                      | Resolution                                                                       |
| ------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| PF2-011 | RD-01's `blendsdk/react` provider wording needs a supersession reference     | Added to RD-02 Integration Points (RD-01 stays frozen)                           |
| PF2-012 | Single-provider guidance untraceable to a ruling                             | Kept as documentation guidance (no behavior; no register row)                    |
| PF2-013 | "Identical exposure to RD-01" overstated                                     | Reworded: local-only; capture surfaces any script's reports; nothing transmitted |
| PF2-014 | Rejection with `reason: undefined` unpinned                                  | AC 12 extended (default no-details text)                                         |
| PF2-015 | Capture listener also receives React 19's global reports                     | Noted in the capture contract ("not an error boundary")                          |
| PF2-016 | AR #15's plan-extension route unrecorded outside the register                | Honored procedurally by the plan extension (next step)                           |
| PF2-017 | Traceability note not literally true (inherited-contracts row had no AR ref) | AR Ref cell filled with `RD-01 ARs #4, #7, #13, #14`                             |

---

## Iteration 2 — Fix Verification & Regression Check

**Verifier:** separate preflight-auditor dispatch, fix-diff scoped, against the installed stack.

**Result: PASS WITH RESERVATIONS** — all 17 accepted resolutions verified **SATISFIED**; the
recorded jsdom interceptor technique was empirically reproduced by the verifier; no regression in
the edited sections (sign-out statements consistent across MH-5/render flow/AC 6/register AR #19;
AC numbering coherent; all Scope rows carry correct AR refs).

**Iteration-2 residuals (both closed before the pass was recorded):**

| ID      | Sev | Finding                                                                                            | Resolution                                 |
| ------- | --- | -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| REG-001 | 🟡  | The public-API comment for `onSignOut` still said "passed to the dialog" (stale after the wrapper) | Comment reworded (invoked by the wrapper)  |
| REG-002 | 🟡  | The re-entrant guarantee (user-ruled) had no acceptance criterion                                  | AC 6 extended with the re-entrant sub-case |

No further re-scan was performed: both edits complete already-accepted resolutions and were
verified by reading the changed clauses.

---

## Verdict & Follow-up

**✅ PREFLIGHT PASSED — all 17 findings resolved; no open findings.**

- **Passing revision:** blob `c635c3120bfdad1775a40c982151ad7eaa23072d` (uncommitted at report
  time; the commit follows immediately).
- **Roadmap:** RD-02 advances to `RD Preflighted` (🔎).
- **Next:** extend the existing plan set with the provider phase per AR #15
  (`03-02-system-error-provider.md`, ST-33+, execution-plan Phase 2), then re-verify the plan
  before execution.
