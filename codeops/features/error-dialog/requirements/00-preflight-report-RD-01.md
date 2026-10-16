# Preflight Report: RD-01 — ErrorDialog Component

> **Status**: ✅ PREFLIGHT PASSED — all 14 findings resolved (plus 2 iteration-2 residuals closed)
> **Iteration**: 2 of 2 — iteration 1 raised 14 findings; iteration 2 verified every fix and
> closed the two residuals the fixes introduced
> **Artifact**: single requirement document —
> `codeops/features/error-dialog/requirements/RD-01-error-dialog-component.md`
> **Revision**: scan start — commit `054b563`, blob `990ea4da8e7ddcb10a38ef3adfe5d5bed95257a6`;
> passing revision — blob `f114c27348a7bea59f2f55e44ff62ca8d6bef38d`
> **Codebase Grounded**: repository + installed Fluent v9 / Vitest / jsdom sources examined;
> every RD reference mapped and verified
> **Scope mode**: strict (no optional additions proposed)
> **Last Updated**: 2026-10-16 01:45

⚠️ **SAME-SESSION REVIEW**: the artifact was created in the current session by the same model.
Same-agent bias risk is elevated. Mitigation applied: the scan fanned out to **five independent
preflight-auditor dispatches** (one per dimension cluster), the major batch went to one
independent **design-challenger** before recommendations were recorded, and iteration 2 was
verified by a **separate auditor** against the installed sources rather than the author's prose.
Consider a fresh-session audit if this artifact ever becomes security- or compliance-critical.

---

## Codebase Context Summary

**Repository**: `blendsdk/fluentui-react` — pnpm/Turborepo monorepo; the publishable package is
`packages/react-components` (`@blendsdk/fluentui-react-components`).

**Tech stack (verified from manifests)**: React 19 + Fluent UI v9 (`@fluentui/react-components`
9.74.9 installed; peers `^9.0.0`), TypeScript (`strict`, `verbatimModuleSyntax`), Griffel
styling with tokens, Vitest 5 + jsdom 30 + Testing Library 16 + jest-dom (no `user-event`),
Storybook 10 with docs + a11y addons, CI gate = format:check → skill:check → type-check → build
→ test → storybook:build → `npm pack --dry-run`.

**Architecture observed**: one component per folder following the house pattern
(`<Name>.tsx`, `.types.ts`, `use<Name>.ts`, `render<Name>.tsx`, `use<Name>Styles.styles.ts`,
`.stories.tsx`, `index.ts`), spec/impl tests under `test/`, exact export-surface spec test,
`FluentProvider` test/story wrappers, installer-managed CodeOps payload under `.opencode/`.

**Key facts verified for this audit**: `modalType="alert"` → `role="alertdialog"`; the backdrop
dismisses only for `modalType="modal"`; a controlled `Dialog` without `onOpenChange` makes
Escape/backdrop no-ops; `tokens.colorPaletteRedForeground1` exists; `pnpm type-check` covers
`test/` and `.storybook/`; jsdom provides no `navigator.clipboard` and cannot resolve `var()`
tokens; spying on `window.location.reload` throws in jsdom while `vi.stubGlobal` works; tabster
focusability fails without layout (no real focus trap in jsdom).

**Reference verification**: all RD paths, APIs, versions and conventions mapped — verified.

---

## Summary by Dimension

| #   | Dimension              | Findings (touching) | Highest severity |
| --- | ---------------------- | ------------------- | ---------------- |
| 1   | Ambiguities            | 2                   | 🟡               |
| 2   | Implicit Assumptions   | 1                   | 🟡               |
| 3   | Logical Contradictions | 3                   | 🟠               |
| 4   | Completeness Gaps      | 4                   | 🟠               |
| 5   | Dependency Issues      | 0                   | —                |
| 6   | Feasibility Concerns   | 1                   | 🟠               |
| 7   | Testability            | 5                   | 🟠               |
| 8   | Security Blind Spots   | 1                   | 🟠               |
| 9   | Edge Cases             | 4                   | 🟠               |
| 10  | Scope Creep Indicators | 1                   | 🟡               |
| 11  | Ordering & Sequencing  | 0                   | —                |
| 12  | Consistency            | 0                   | —                |
| 13  | Codebase Alignment     | 4                   | 🟠               |

## Summary by Severity

| Severity    | Count | Status                                 |
| ----------- | ----- | -------------------------------------- |
| CRITICAL    | 0     | —                                      |
| MAJOR       | 3     | ✅ all resolved (challenger-confirmed) |
| MINOR       | 11    | ✅ all resolved                        |
| OBSERVATION | 0     | —                                      |

**User ruling:** accepted all recommendations (bulk acceptance, 2026-10-16), then authorized
applying the fixes and the re-scan.

**Hardening:** PF-001/002/003 were independently challenged in one batch (challenger received
the findings without the reviewer picks). Verdict: **Justified** for all three; the PF-001
recommendation was simplified (no modalizer-attribute assertion, no new test tooling) and the
PF-003 recommendation extended (stale-settle suppression). _Confidence: high._

---

## Findings

### PF-001: Focus-trap clause of AC #3 cannot be verified under the declared oracle 🟠 MAJOR

**Dimension:** 7 (Testability), 6, 13 — raised independently by three auditors
**Location:** Acceptance Criteria #3 — "Tab from the last focusable element moves focus back
inside the dialog (focus trap)"; Verification — "the immutable oracle for the contract"
**Codebase Evidence:** `node_modules/…/tabster` focusability requires layout (jsdom body rect is
0×0); `@fluentui/react-tabster/lib/hooks/useTabster.js` sets `controlTab: false`;
`.opencode/skills/fluentui-components/references/testing.md:72-74` — "cover the behavior in a
story instead"; `.storybook/main.ts:19` configures only docs + a11y addons.
**The Problem:** jsdom cannot exercise the trap: no native Tab traversal, tabster finds no
focusables; a spec test for the clause would pass vacuously or test internals, contradicting the
"immutable oracle" claim.

**Options:** (A) keep the behavior requirement, keep only jsdom-observable assertions in the
spec, move the trap cycle to the story + manual pass — _recommended_; (B) reword the criterion to
weak/vacuous jsdom facts; (C) add browser-mode/user-event tooling (new infrastructure).

**Recommendation:** Option A (challenger-trimmed: no modalizer assertion in the spec, no new
tooling).
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** AC #3 now asserts Escape/backdrop non-dismissal and focus-inside-on-open; the
verification section qualifies the oracle per channel and names the story/manual keyboard pass;
AC #18 includes the focus/keyboard story item.

### PF-002: Hostile error-like values can still crash; "never throws" unenforced and security wording overclaiming 🟠 MAJOR

**Dimension:** 8 (Security), 9, 2
**Location:** Technical Requirements — Details serialization ("the whole step never throws");
Security Considerations — "no code execution, no property access beyond safe enumeration".
**Codebase Evidence:** language semantics — `instanceof` throws on revoked proxies; `.name`/
`.message` reads can run throwing accessors; `JSON.stringify`/`String()` execute `toJSON`/
`toString`; AC #8/#9 covered only plain-Error and plain-object cases.
**The Problem:** a hostile/broken error value could throw while rendering the error, the exact
legacy defect class this RD exists to fix; the security claim was factually wrong.

**Options:** (A) wrap every step with a fallback chain (`String(value)` → `noDetails`), add two
adversarial AC cases, reword the security sentence — _recommended_; (B) add cases but keep the
wording; (C) keep as-is.
**Recommendation:** Option A (challenger: Justified; resist over-specifying — two AC rows + prose).
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** serialization now states the wrapped guarantee; AC #8 gained the throwing-accessor
case, AC #9 the revoked-Proxy case; the security section now describes the executed accessors
and their containment accurately.

### PF-003: Copy-feedback contract contradicts itself when the timer is cleared 🟠 MAJOR

**Dimension:** 4 (Completeness), 9
**Location:** Copy behavior — "reverts to `strings.copy`" (2000 ms) vs "timer is cleared … when
the details change"; AC #11.
**Codebase Evidence:** RD-01 last-wins flow makes details replacement normal; the copy state
lives in the always-mounted shell hook, so it survives open toggles.
**The Problem:** clearing the revert timer without resetting the label can leave "Copied"
indefinitely; a late-settling write can confirm content no longer displayed.

**Options:** (A) pin the state machine (reset on details change/close; suppress stale settles) +
two AC cases — _recommended_; (B) reset on details change only; (C) leave to the implementer.
**Recommendation:** Option A (challenger-trimmed: capture-and-compare semantics, no token
machinery).
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** copy behavior now resets on details change or close and suppresses stale settles
(extended to the post-close case in iteration 2); AC #11 carries both cases.

### PF-004: Serialization output precision conflicts and undefined boundaries 🟡 MINOR

**Dimension:** 1 (Ambiguities), 4 — raised by two auditors
**Location:** Details serialization steps 4/5 and the exotic-value sentence; AC #9/#10.
**Codebase Evidence:** document-only (contradicts `JSON.stringify` semantics: top-level function
→ source text vs promised `"[Function]"`; bigint throws/undefined rendering; replacer implied
but unspecified).
**Options:** (A) one replacer-based algorithm with pinned boundaries (`!== undefined` presence,
empty strings verbatim) — _recommended_; (B) two prose rule sets.
**Recommendation:** Option A.
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** single algorithm with a replacer (bigint → decimal string form, function →
`"[Function]"`, circular → `"[Circular]"`, every depth incl. top level); presence =
`!== undefined`; empty `detailsText` renders blank; AC #9/#10 pin the values (AC #12 pins empty
string overrides — iteration 2).

### PF-005: Native pass-through and ref target missing from the API 🟡 MINOR

**Dimension:** 13 (Codebase Alignment), 4 — raised by two auditors
**Location:** Public API — `ErrorDialogBaseProps`; anatomy — "`forwardRef` shell".
**Codebase Evidence:** house rules (`.opencode/skills/fluentui-components/SKILL.md` rules 5/7);
`DescriptionList.types.ts:23` precedent; `useDialogSurface` spreads `...props` and merges refs.
**Options:** (A) extend the base props with the surface's native props, merge `className`/
`style`, ref → surface — _recommended_; (B) record an explicit deviation.
**Recommendation:** Option A.
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** base props extend `Omit<ComponentPropsWithoutRef<'div'>, 'children'>`; merge/ref
contract documented; new AC #19.

### PF-006: Package README section missing from the deliverables 🟡 MINOR

**Dimension:** 13 (Codebase Alignment), 4 — raised by two auditors
**Location:** Component anatomy; Must Have deliverables; Verification.
**Codebase Evidence:** `.opencode/skills/fluentui-components/SKILL.md:99-101,149` — the README
component section is part of the definition of done; `packages/react-components/README.md:53`.
**Options:** (A) add the README row to anatomy + deliverables — _recommended_; (B) amend the
pattern claim with an exception.
**Recommendation:** Option A.
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** README row added to the anatomy table and Must Have; verification notes it is
review-checked (no pipeline check covers documentation).

### PF-007: AC #17 mixes four verification levels 🟡 MINOR

**Dimension:** 7 (Testability), 13 — raised by two auditors
**Location:** AC #17 — "the title resolves to the danger color token … no literal colors …".
**Codebase Evidence:** jsdom `getComputedStyle` returns the unresolved `var(...)` expression;
griffel inserts rule buckets; "no literal colors" is a source-text property.
**Options:** (A) split into mechanism-specific checks (a) theme render (b) token/source check +
review (c) 700px computed width — _recommended_; (B) observable proxies only.
**Recommendation:** Option A.
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** AC #17 now states the three channels.

### PF-008: AC #18's story-coverage claim is review-level 🟡 MINOR

**Dimension:** 7 (Testability)
**Location:** AC #18 — "stories cover …"; Verification — "immutable oracle".
**Codebase Evidence:** `storybook:build` succeeds with any number of stories; no interaction
addon; vitest collects only `test/**`.
**Options:** (A) keep the commands as the quality gate; move the story set to a review-verified
definition-of-done sentence — _recommended_; (B) import stories and assert them (couples the
suite to story shape).
**Recommendation:** Option A.
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** AC #18 split accordingly; AC #18 also names the focus/keyboard story item.

### PF-009: AC #12 missing the `onReload` precondition; AC #5 "exactly one action" vs the copy control 🟡 MINOR

**Dimension:** 1 (Ambiguities) — raised by two auditors (two symptoms, one root cause)
**Location:** AC #12; AC #5.
**Codebase Evidence:** document-only — the reload action exists only when `onReload` is provided
(AC #4); the copy control is a Fluent `Button` that may render in both variants.
**Options:** (A) state the precondition; reword AC #5 to "only recovery action" with the copy
parenthetical — _recommended_; (B) restrict the copy control to `kind="error"` (behavior change).
**Recommendation:** Option A (B would silently change approved AR #5/#8 behavior and needs a
separate decision).
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** both criteria reworded.

### PF-010: Runtime behavior for untyped consumers omitting a required callback 🟡 MINOR

**Dimension:** 9 (Edge Cases)
**Location:** Public API — "required at compile time"; AC #16.
**Codebase Evidence:** types erase at runtime; JS consumers can omit handlers.
**Options:** (A) specify guards: callbacks invoked only when defined; missing handler ⇒ inert
action — _recommended_; (B) document JS consumers out of contract.
**Recommendation:** Option A.
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** API note + Must Have bullet; AC #16 gained the runtime clause.

### PF-011: Clipboard-availability detection timing unspecified 🟡 MINOR

**Dimension:** 9 (Edge Cases)
**Location:** Copy behavior — "Rendered only when … available"; Constraints — import safety.
**Codebase Evidence:** render-time detection server-renders `false` and can produce a hydration
mismatch when the dialog is SSR'd open.
**Options:** (A) detect in a mount effect (hydration-safe) — _recommended_; (B) keep render-time
and document SSR-of-an-open-dialog as unsupported.
**Recommendation:** Option A.
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** copy behavior states mount-effect detection; AC #11 says "after mount".

### PF-012: Verification techniques for the reload and clipboard assertions undocumented 🟡 MINOR

**Dimension:** 7 (Testability)
**Location:** AC #14 (`window.location.reload`), AC #11 (clipboard).
**Codebase Evidence:** jsdom `location.reload` is non-configurable (`vi.spyOn` throws;
`vi.stubGlobal` works — Vitest exposes `window === globalThis`); jsdom provides no
`navigator.clipboard` (a `defineProperty` stub works).
**Options:** (A) document the verified techniques in the Verification section — _recommended_;
(B) weaken to a source scan.
**Recommendation:** Option A.
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** techniques recorded (stubGlobal, clipboard stub, fake timers).

### PF-013: AC #16 compile-check mechanism unspecified 🟡 MINOR

**Dimension:** 2 (Implicit Assumptions), 7
**Location:** AC #16; Verification.
**Codebase Evidence:** no compile-assertion pattern exists in the repo; `pnpm type-check`
includes `test/`.
**Options:** (A) `// @ts-expect-error` annotations on the invalid usages (unused directive ⇒
type-check failure doubles as the regression signal) — _recommended_; (B) manual verification.
**Recommendation:** Option A.
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** mechanism stated in Verification and AC #16.

### PF-014: Cross-variant "accepted for unified hosts; unused" callbacks 🟡 MINOR

**Dimension:** 10 (Scope Creep Indicators)
**Location:** Public API — `onSignOut` in the error variant; `onDismiss`/`onReload` in the
unauthorized variant; AC #16's third clause.
**Codebase Evidence:** AR #4 approves the `kind` union with per-variant required callbacks; it
does not include cross-variant unused props; they were justified only by the explicitly
out-of-scope future provider.
**Options:** (A) remove them; a unified host narrows by `kind` — _recommended_; (B) keep them
with an explicit approval record.
**Recommendation:** Option A.
**User Decision:** ✅ Resolved — User accepted recommendation Option A.
**Applied:** both interfaces cleaned; AR #4 note and Integration Points updated; AC #16's third
clause dropped.

---

## Iteration 2 — Fix Verification & Regression Check

**Verifier:** separate preflight-auditor dispatch, fix-diff scoped, verified against installed
Fluent/Vitest/jsdom sources instead of the author's prose.

**Result: PASS WITH RESERVATIONS** — all 14 accepted fixes verified **SATISFIED**; no edit
introduced a contradiction in the touched sections (numbering coherent, API/technical/criteria
agree, AC #19 compatible with the installed dialog source, no stale "unified host" references).

**Iteration-2 residuals (both closed before the pass was recorded):**

| ID      | Sev | Finding                                                                                                    | Resolution                                                |
| ------- | --- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| REG-001 | 🟡  | New Must Have clause "a key present with an empty string is honored verbatim" had no acceptance criterion. | AC #12 extended with the empty-string override case.      |
| REG-002 | 🟡  | Stale-settle suppression covered "after the details changed" but not "after the dialog closed".            | Copy behavior and AC #11 extended to the post-close case. |
| REG-003 | 🟡  | The Preflight traceability sentence cited this report before it existed.                                   | Self-resolving — the report is this file.                 |

No further re-scan was performed: the two edits are direct consequences of accepted fixes, and
they were verified by reading the changed clauses (per the convergence rules, an accepted minor
fix does not justify another full scan).

---

## Verdict & Follow-up

**✅ PREFLIGHT PASSED — all 14 findings resolved; no open findings.**

- **Passing revision:** blob `f114c27348a7bea59f2f55e44ff62ca8d6bef38d` (uncommitted at report
  time; the commit follows immediately). Before plan creation consumes this artifact, compare
  the RD's blob with this hash — a mismatch makes this pass stale.
- **Roadmap:** RD-01 advances to `RD Preflighted` (🔎); the portfolio cascade follows.
- **Next:** `make-plan` for RD-01.
