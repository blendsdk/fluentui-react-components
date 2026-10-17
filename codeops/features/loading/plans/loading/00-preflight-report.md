# Preflight Report: Loading Implementation Plan

> **Status**: ✅ PREFLIGHT PASSED — 23/23 findings resolved; 22 document fixes applied and re-checked
> **Iteration**: 1 (first scan) + targeted re-check (fix pass)
> **Artifact**: Implementation plan (9 documents) at `codeops/features/loading/plans/loading/`
> **Codebase Grounded**: 31 references checked — 26 verified, 4 inaccurate (PF-022), 1 external group unverifiable
> **Last Updated**: 2026-10-17 14:43 CEST
> **Mode**: strict scope · `--auto-design` active (root invocation `preflight-loading-20261017T141800Z`)

**SAME-AGENT REVIEW:** the plan documents were authored earlier the same day by the same model
(13:38–13:44 CEST, uncommitted). This review ran in a fresh session, with five independent
cluster auditors and one blind design challenger. Residual same-model bias is still possible;
a human accessibility review of the `inert`/live-region behavior is recommended before release.

**Audit target vs context.** Findings and the verdict apply only to the plan set named above.
`requirements/RD-01-loading-primitives.md` and the feature roadmap were read as context. The
user's PF-001 ruling expands the modification set to include RD-01 R8 for that fix only.

**Artifact identity.** The plan set is untracked (`?? codeops/features/loading/`), so content
hashes replace git blobs:

| Document                   | SHA-256                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| `00-ambiguity-register.md` | `4d4798b06290751e389029b42de70cce0e11639a70b99dee9f9a1381dc05cdbf` |
| `00-index.md`              | `ed5d2b8dbedddca5641dbbf3f854cf309312c83ee487bff75f582a1f6767a8ba` |
| `01-requirements.md`       | `437baa99fe5860893105fe249d89e1810c741b52a1bc9307b2c56241a5040715` |
| `02-current-state.md`      | `2809243cfe27739d70cea554a1b1263f074c1e99cf5399931eaf579a59f65b0d` |
| `03-01-loading.md`         | `d63a1d2a79826761918bd18c412b2e8d87e626aa3f50faf6eab69334e657a662` |
| `03-02-loading-overlay.md` | `2d5cf749f60c2469017e91da31964d08cb81aa787808fac82057be648f7412e7` |
| `03-03-use-loading.md`     | `33ff1c9c913f5038cc2ff6ae600ad8d943af98eb2beda39c896f4b38b92927fc` |
| `07-testing-strategy.md`   | `285443f9c55b540e4784bf2a98bd3065f32e42b37430fa1a3ede10be88b66fb8` |
| `99-execution-plan.md`     | `47fd758e47291106287c4b4b709f6438fa7ced84bf0a11e7ccc7afef47f270f1` |

## Codebase Context Summary

**Repository:** `fluentui-react-components` monorepo; integration branch `main`.
**Tech Stack:** React 19.3.1, `@fluentui/react-components` 9.74.9, `@fluentui/react-spinner`
9.8.6, `@types/react` 19.3.0, TypeScript 7.0.2, Vite 8, Vitest 5.0.5 + jsdom 30.1.3,
Storybook 10.6.2, pnpm 12.11.2 / Node 22.
**Architecture:** one publishable package, `packages/react-components`, using the Fluent v9
component anatomy (forwardRef shell, typed props, state hook, pure render, Griffel styles,
barrel). Public surface is a single root barrel pinned by an exact export test. Tests are
`*.spec.test.tsx` (immutable oracle), `*.impl.test.tsx` (internals), `*.ssr.test.tsx`
(node-environment smoke), plus `package-exports.spec.test.ts`.
**Files examined:** 12 source files, 8 test/config files, `AGENTS.md`, `package.json` (root and
package), `vitest.config.ts`, `test/setup.ts`, `.storybook/main.ts`, `codeops.json`, both
roadmaps, five installed Fluent/React type and runtime files.

**Key observations**

- Fluent `Spinner` defaults to `role="progressbar"`, associates its label through
  `aria-labelledby`, and hides only itself behind `delay` (`useSpinner.js:42,81-82,87`). The
  plan's evidence is exact.
- `tokens.colorBackgroundOverlay` exists (`@fluentui/tokens` d.ts:217) and the React 19 `inert`
  typing exists (`@types/react/index.d.ts:2948`). Both verified.
- The repository does not export `VisuallyHidden`, and `@fluentui/react-components` does not
  provide one. The hand-rolled screen-reader recipe is justified.
- Cross-component imports of internal modules are an established pattern
  (`DescriptionList` ← `DescriptionListItemLayoutContext`, `ConfirmProvider` ← `ConfirmDialog`),
  so the overlay reusing the `Loading` renderer is consistent.
- `test/setup.ts` registers jest-dom and RTL cleanup only; it does **not** provide
  `FluentProvider` (PF-022).
- The repository has no browser/E2E harness. `pnpm storybook:build` compiles stories but proves
  no runtime or assistive-technology behavior.

## Summary by Dimension

| #   | Dimension              | Findings | Highest Severity |
| --- | ---------------------- | -------- | ---------------- |
| 1   | Ambiguities            | 3        | 🟡 MINOR         |
| 2   | Implicit Assumptions   | 0        | —                |
| 3   | Logical Contradictions | 3        | 🟠 MAJOR         |
| 4   | Completeness Gaps      | 2        | 🟡 MINOR         |
| 5   | Dependency Issues      | 1        | 🟡 MINOR         |
| 6   | Feasibility Concerns   | 0        | —                |
| 7   | Testability            | 7        | 🟡 MINOR         |
| 8   | Security Blind Spots   | 0        | —                |
| 9   | Edge Cases             | 2        | 🟡 MINOR         |
| 10  | Scope Creep Indicators | 0        | —                |
| 11  | Ordering & Sequencing  | 1        | 🟠 MAJOR         |
| 12  | Consistency            | 3        | 🟡 MINOR         |
| 13  | Codebase Alignment     | 1        | 🟡 MINOR         |

**Domain lens applied:** web application (browser UI, accessibility, SSR). The plan covers the
lens's concerns; no additional domain lens applies (no persistence, money, compiler or
distributed surface). Security is correctly recorded as not applicable: the only input is a
React-escaped string, with no HTML parsing, network, storage or auth path. One API-hygiene
note (`dangerouslySetInnerHTML` admitted by the inherited div type) is recorded in PF-005.

## Summary by Severity

| Severity       | Count | Status                                         |
| -------------- | ----- | ---------------------------------------------- |
| 🔴 CRITICAL    | 0     | —                                              |
| 🟠 MAJOR       | 3     | all resolved by decision (1 user, 2 delegated) |
| 🟡 MINOR       | 19    | all resolved by delegated decision             |
| 🔵 OBSERVATION | 1     | accepted, no plan change                       |

## Delegated authority record

Applies to every finding marked **Delegated** below.

```text
Authority: AI — delegated by --auto-design
Eligibility: implementation mechanism, internal interfaces, accessibility wiring inside the
  approved behavior, testing strategy, verification sequencing and documentation accuracy.
  No product scope, priority, acceptance criterion, security policy, compatibility break or
  risk waiver was delegated. PF-001 was reserved and decided by the user.
Objective: implement the approved loading primitives with the smallest correct design.
Policy version: 1
Root invocation ID: preflight-loading-20261017T141800Z
```

Each finding carries its own decision, evidence, rejected alternatives, strongest
counterargument, confidence and reopen triggers. Delegated selections do not authorize applying
the fixes (this run is audit-only).

---

# MAJOR Findings

## PF-001: `aria-busy` encloses the status live region, so the announcement can be suppressed 🟠 MAJOR

**Dimension:** 3 — Logical Contradictions (accessibility impact)
**Location:** `03-02-loading-overlay.md` §DOM Structure lines 86–113 (root `aria-busy` at line 92,
status node at lines 99–101); §State Machine lines 61–77; `07-testing-strategy.md` ST-11, ST-12,
ST-22, ST-26; `requirements/RD-01-loading-primitives.md` R8.
**Codebase Evidence:** WAI-ARIA 1.2, `aria-busy`: when it is true, assistive technology _may_
ignore changes to content owned by that element and process them as one update when it becomes
false. The status node is a descendant of the busy root (`03-02:92` and `:99-101`). jsdom cannot
simulate AT, so the repository cannot verify the behavior; the manual checklist does not test it.

**The Problem:** `aria-busy` turns true immediately with `loading`, while the status text changes
later, when the overlay becomes visible. An AT that honors the busy rule defers that change. When
loading ends, the same render sets `aria-busy=false` **and** clears the status text, so the
deferred change is empty. The label may never be announced — the core promise of R8 and
acceptance criterion 8. ST-26 (label changes while busy) has the same risk.

**Options:**

| Option | Description                                                                                                          | Pros                                                                                   | Cons                                                                   |
| ------ | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A      | Move `aria-busy` to the covered content wrapper; keep the status inside the single root but outside the busy subtree | Smallest correct fix; keeps single root, ref and ST-23; status is announced while busy | Amends RD-01 R8 and ST-11/12/22/47                                     |
| B      | Keep the structure; add a "label is announced while busy" real-browser/AT check                                      | No requirement churn now                                                               | Ships the known suppression shape; manual matrix cannot cover every AT |
| C      | Keep root `aria-busy`; render the status outside the root via a fragment                                             | Preserves R8's letter                                                                  | Breaks the single-root/ref contract and ST-23                          |

**Recommendation:** Option A. It is the smallest structure that both marks the region busy and
guarantees the announcement is outside the busy subtree.

**User Decision:** **Resolved — User chose Option A** (2026-10-17 14:18). Modification set
expanded to `requirements/RD-01-loading-primitives.md` R8 for this amendment. Applies to:
RD-01 R8; `03-02` DOM, styles and state-machine text; `07` ST-11/12/22/47 plus one structural
assertion that the status is not a descendant of the `aria-busy` element; `02-current-state`
risk row.

`Confidence: High — the fix is structural and testable.`
`Hardening: independent challenger converged on Option A (High confidence). Its strongest
counterargument was that the suppression is a MAY and B is evidence-first; reconciled because the
deferred change is empty, so a failed manual check would silently lose the message.`

## PF-002: SSR cases are labelled specification tests but are authored after the implementation 🟠 MAJOR

**Dimension:** 11 — Ordering & Sequencing (spec-first)
**Location:** `07-testing-strategy.md` lines 90–98 (ST-46…ST-48 under "Specification Tests
(MANDATORY — NON-NEGOTIABLE)") and line 115; `99-execution-plan.md` task 3.3.4 line 221;
`01-requirements.md` acceptance criterion 3 line 48.
**Codebase Evidence:** `AGENTS.md:31` defines `*.ssr.test.tsx` as a **smoke**, and reserves the
immutable oracle for `*.spec.test.tsx`. The shared spec-first protocol names the spec file
`[feature].spec.test.[ext]`. Prior plans authored SSR smokes in their hardening step
(`error-dialog/99:188`, `confirm-dialog/99:224`).

**The Problem:** `07` presents ST-46…ST-48 as mandatory specification cases, but
`test/loading.ssr.test.tsx` is created in Phase 3 Step 3.3, after `Loading` (Phase 1) and
`LoadingOverlay` (Phase 2) are already green. Those cases never have a red phase, R15's SSR
promise is not covered in the phases that introduce it, and the plan's own acceptance criterion 3
("each phase's feature specification tests are written first, verified red") is false for them.

**Options:**

| Option | Description                                                                 | Pros                                                                                         | Cons                                                                                                            |
| ------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| A      | Author them as spec tests incrementally in Phase 1/2/3 Step 1               | Gives each case a red phase                                                                  | Forces a smoke into the immutable oracle and a false red phase (the component is missing, not the SSR behavior) |
| B      | Split into three SSR files                                                  | Early coverage per phase                                                                     | Adds files and still mislabels the category                                                                     |
| C      | Reclassify as an SSR smoke; add incremental smoke tasks in Phase 1/2 Step 3 | Matches the repository convention and the plan's own task wording; gives early node coverage | The SSR guarantee is smoke-level, not oracle-level                                                              |

**Recommendation:** Option C plus incremental smoke coverage. Move ST-46…ST-48 out of the
mandatory specification table into an "SSR Smoke Cases" section (keep the IDs to preserve
traceability), create/extend `test/loading.ssr.test.tsx` in Phase 1 Step 1.3, Phase 2 Step 2.3
and Phase 3 Step 3.3, and add the file to the Phase 1 and Phase 2 expected modification sets.
Update the "immutable oracle" claim in `07`.

**User Decision:** **Delegated — Option C + incremental smoke.**
`Eligibility: testing strategy and sequencing.` `Evidence: AGENTS.md:31; prior-plan
precedent.` `Rejected: A (forces a smoke into the oracle), B (files without the category fix).`
`Strongest counterargument: Phase 1/2 still lack node coverage until Step 3; the incremental
smoke task answers it.` `Confidence: High.` `Hardening: challenger diverged from the incremental-
spec option and recommended reclassification; reconciled by adopting its category correction plus
early smoke coverage — the stronger of both.`
`Reopen: the repository adopts a spec-level SSR contract.`

## PF-003: The focus hook's stated inputs cannot implement capture at loading start 🟠 MAJOR

**Dimension:** 3 — Logical Contradictions (dependency impact)
**Location:** `03-02-loading-overlay.md` §Focus Algorithm line 143 and steps 1–3 lines 145–162;
file table line 30; `99-execution-plan.md` tasks 2.2.3/2.2.4 lines 149–150, impl test 2.3.1.
**Codebase Evidence:** The plan's own rationale (`03-02:146`) is that the render which first sees
`loading=true` still has `visible=false`, so capture happens before the content becomes inert. A
hook that receives only `visible` cannot observe that transition. The repository precedent for a
transition capture is `ConfirmDialog`'s layout effect on `open` (`useConfirmDialog.ts:181-196`).

**The Problem:** Following the stated signature, an implementer must capture too late — after
`inert` has been applied and the browser may have blurred focus to `body` — or move the capture
into another module, contradicting the file's stated responsibility. The specified
"capture-before-inert ordering" implementation test cannot be written against the stated
interface. Focus restore (R9) then depends on an implementation detail rather than a contract.

**Options:**

| Option | Description                                                                                                           | Pros                                                       | Cons                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| A      | `useLoadingOverlayFocus({ rootRef, contentRef, loading, visible })` — capture on `loading`, move/restore on `visible` | One hook owns the algorithm; smallest change; matches AR-6 | Two booleans can disagree; mild interface noise                                    |
| B      | Keep `visible`; move capture into `useLoadingOverlay.ts`                                                              | Keeps the focus hook trigger singular                      | Splits the focus algorithm across two modules; the state hook owns a focus concern |
| C      | Pass a capture callback from the state hook                                                                           | Keeps the focus hook small                                 | Extra indirection and plumbing                                                     |

**Recommendation:** Option A.

**User Decision:** **Delegated — Option A.**
`Eligibility: internal interface and implementation mechanism.` `Evidence: 03-02:143-147 vs
:145; useConfirmDialog.ts:181-196.` `Rejected: B (splits the algorithm), C (needless
indirection).` `Strongest counterargument: B keeps the focus hook's trigger singular.`
`Confidence: High.` `Hardening: challenger converged on Option A (High confidence).`
`Reopen: a second focus concern requires the hook to be split.`

---

# MINOR Findings

## PF-004: `aria-hidden` ownership is contradictory and the overlay's indicator is unasserted 🟡 MINOR

**Dimension:** 12 — Consistency
**Location:** `03-01-loading.md` §New Functions line 83 ("aria-hidden at the caller"),
§DOM lines 127–128 ("inside an `aria-hidden` wrapper"); `03-02-loading-overlay.md` §DOM lines
103–112 (calls `renderLoadingIndicator` with no wrapper), line 120; `07` ST-9 (Loading only).
**Codebase Evidence:** Fluent `Spinner` defaults to `role="progressbar"` and labels itself
(`useSpinner.js:42,81-82`), so a missing wrapper exposes a second visual/AT indicator.

**The Problem:** The safety property has no owner and no overlay assertion. An implementation can
apply `aria-hidden` in `Loading` (ST-9 passes) and omit it in the overlay, causing exactly the
double speech AR-3 was designed to prevent.

**Options:** (A) make `renderLoadingIndicator` self-contained (wraps its output in
`aria-hidden`) and add an overlay assertion; (B) keep caller-owned wrappers, show them in both
snippets and test both; (C) rely on Fluent defaults — rejected: the plan's own evidence shows a
progressbar and a label.

**Recommendation:** A.

**User Decision:** **Delegated — A.** `Eligibility: internal renderer contract.`
`Evidence: useSpinner.js:42,81-82; 03-01:83 vs :127-128.` `Rejected: C.` `Strongest
counterargument: a hidden wrapper inside the shared renderer is less flexible for a caller that
wants a visible progressbar; no such caller exists.` `Confidence: High.`
`Reopen: a caller needs a perceivable progressbar.`

## PF-005: Managed native attributes are accepted by the prop types, then silently overridden 🟡 MINOR

**Dimension:** 12 — Consistency (API surface)
**Location:** `03-01-loading.md` lines 51–69 and DOM lines 111–123; `03-02-loading-overlay.md`
lines 43–55; `00-ambiguity-register.md` AR-9; `07` ST-4.
**Codebase Evidence:** `ConfirmDialog` already omits attributes it owns (`ConfirmDialog.types.ts`
omits `children`/`title`). `LoadingProps` omits only `children`; `LoadingOverlayProps` omits
`aria-busy` and `tabIndex` but keeps `role`, `aria-live`, `aria-atomic` and `inert`.

**The Problem:** `Loading` owns `role`/`aria-live`/`aria-atomic` but accepts them in the type and
overwrites them; `LoadingOverlay` accepts `aria-live="assertive"`, which can turn the root into a
second live region, and `inert`, which AR-4 explicitly rejected on the root. Both types inherit
`dangerouslySetInnerHTML`, which throws when combined with the component's own children and
contradicts the RD's "no HTML parsing" statement. `aria-label` on the status root can also replace
or compete with the announced text; AR-9 deliberately keeps `aria-label`, so this is recorded as a
caveat to verify, not a reason to remove it.

**Options:** (A) add the managed attributes and `dangerouslySetInnerHTML` to each `Omit` list,
keep `aria-label` per AR-9, add `@ts-expect-error` pins; (B) keep the props and document them as
ignored (contradicts R5's pass-through promise); (C) let callers override (breaks the contract).

**Recommendation:** A.

**User Decision:** **Delegated — A (keeping `aria-label`).** `Eligibility: public API hygiene
inside the approved behavior.` `Evidence: AR-9; ConfirmDialog.types.ts omission precedent.`
`Rejected: B, C.` `Strongest counterargument: omitting native attributes reduces flexibility;
the managed contract is invalid if they are overridden.` `Confidence: High.`
`Reopen: a consumer has a legitimate need to override a managed attribute.`

## PF-006: The `minHeight` example clobbers the caller's `style.minHeight` 🟡 MINOR

**Dimension:** 3 — Logical Contradictions
**Location:** `03-01-loading.md` §Defaults and Resolution lines 104–105; §DOM line 115;
`07` ST-7.
**Codebase Evidence:** `style={{ ...rootProps.style, minHeight }}` always writes the key. When the
prop is `undefined`, React drops the property and the caller's `style.minHeight` is lost.
Existing components test style merging (`confirm-dialog.spec.test.tsx`, `error-dialog.spec.test.tsx`).

**The Problem:** `<Loading style={{ minHeight: 120 }} />` collapses to auto height, contradicting
"passed when defined", "the caller's style wins", and R5. No test covers a caller `style`.

**Options:** (A) conditionally spread `minHeight` only when defined, and add two cases
(style-only; prop wins over style); (B) always apply and document the clobber (contradicts the
table and R5); (C) remove the `style` merge (breaks R5).

**Recommendation:** A.

**User Decision:** **Delegated — A.** `Eligibility: prop resolution and test coverage.`
`Evidence: 03-01:115; existing style-merge tests.` `Rejected: B, C.` `Strongest counterargument:
the fix adds a conditional in a small render path; it is still the only correct precedence.`
`Confidence: High.` `Reopen: the minHeight prop is removed.`

## PF-007: The label contract is under-specified and diverges from RD R11's wording 🟡 MINOR

**Dimension:** 1 — Ambiguities
**Location:** `03-03-use-loading.md` line 46, §State Model lines 83–89, §Label Policy lines
124–132; `07` ST-28, ST-32, ST-34, ST-41; `requirements/RD-01` R11; `00-ambiguity-register.md`
AR-7.
**Codebase Evidence:** `03-03:88` calls `normalizeLabel(options?.label)`, a function defined
nowhere. `03-01:75` defines `resolveLoadingLabel(label?): string`, which always returns
`Loading…` and cannot produce the hook's `undefined`. `ConfirmDialog`'s blank fallback is
`resolveStrings` at `useConfirmDialog.ts:25-37`.

**The Problem:** (a) the helper is undefined and its blank result is unspecified; (b) "the
default" is overloaded between `options.label` and the English `Loading…`; (c) the plan's rule
("most recently started active **labeled** operation") differs from R11's literal wording ("the
most recently started active operation's non-blank label"); a labeled A followed by an unlabeled B
is untested; (d) ST-41 says "the default applies" in a scenario that supplies no default.

**Options:** (A) define `normalizeLabel(label?): string | undefined` (blank → `undefined`) in
`loadingLabel.ts`, state the labeled-operation interpretation, add cases for a blank hook default,
the A-then-B order, and a blank per-run label, and make ST-41's expected value explicit; (B)
follow R11 literally (B suppresses A) — less useful and still needs tests; (C) amend R11 to the
plan's wording (context-document edit, out of this run).

**Recommendation:** A, and record the R11 wording for the next RD revision.

**User Decision:** **Delegated — A.** `Eligibility: label resolution inside the approved
contract.` `Evidence: 03-03:88; 03-01:75; useConfirmDialog.ts:25-37.` `Rejected: B (the label
would disappear while a labeled operation is still running), C (out of the audit target).`
`Strongest counterargument: R11's literal wording supports B; the plan's rule is the more useful
interpretation and matches AR-7 and ST-41's intent.` `Confidence: Med — the RD wording must be
aligned at the next revision.` `Reopen: a user wants strict most-recent-operation priority.`

## PF-008: The shared visually-hidden style has no owner and no phase scope 🟡 MINOR

**Dimension:** 5 — Dependency Issues
**Location:** `03-01-loading.md` lines 36, 160–162; `03-02-loading-overlay.md` lines 32, 99, 175;
`99-execution-plan.md` tasks 1.2.3, 2.2.2 and the Phase 2 expected set (lines 121–124).
**Codebase Evidence:** Each existing component owns its style hook. Cross-component imports of an
internal module are established (`DescriptionList` imports
`DescriptionListItemLayoutContext`; `ConfirmProvider` imports `ConfirmDialog` types).

**The Problem:** `03-01` says the overlay imports the shared visually-hidden style; `03-02`
lists `visuallyHidden` in the overlay's own styles file. Phase 2's strict scope excludes
`src/components/Loading/**`, so an implementer must either duplicate the recipe (contradicting
"shared") or edit a Phase 1 file outside the phase's declared scope.

**Options:** (A) export the class (or a tiny style hook) from
`Loading/useLoadingStyles.styles.ts`, import it in the overlay, and name the import in tasks
2.2.2/2.2.4 and the Phase 2 expected set — consistent with the existing cross-component
precedent; (B) duplicate the recipe in both components and drop "shared"; (C) create a new shared
styles module (expands the file list for one class).

**Recommendation:** A.

**User Decision:** **Delegated — A.** `Eligibility: internal module boundary and sequencing.`
`Evidence: DescriptionListItemLayoutContext precedent; 03-01:160 vs 03-02:175.`
`Rejected: B (DRY violation), C (extra module for one class).` `Strongest counterargument:
importing a component's style hook couples the overlay to `Loading`; the shared class is already
conceptually shared.` `Confidence: High.` `Reopen: a third consumer needs the recipe.`

## PF-009: `LoadingBaseState` is used but never defined; the indicator has two names 🟡 MINOR

**Dimension:** 1 — Ambiguities
**Location:** `03-01-loading.md` lines 81, 92, 121, 127, 165; `99` tasks 1.2.5/1.2.6.
**Codebase Evidence:** The plan never defines `LoadingBaseState`; only two signatures mention it.
The DOM example renders `<LoadingIndicator ... />` while the file and function are
`renderLoadingIndicator`.

**The Problem:** The hook and render function can disagree on the state shape, and an implementer
must invent an internal contract two tasks depend on. The naming points at a component that is
never listed.

**Options:** (A) define the state fields in `03-01` (visible, resolved label, classes, root props,
size, appearance, labelPosition) and use `renderLoadingIndicator({...})` in the DOM example;
(B) infer the type from the hook and drop the name.

**Recommendation:** A.

**User Decision:** **Delegated — A.** `Eligibility: internal type contract.`
`Evidence: two-task dependency at 99:91-92.` `Rejected: B (hides the contract).`
`Strongest counterargument: an internal state type does not need a full spec; the two tasks do.`
`Confidence: High.` `Reopen: the state shape is refactored.`

## PF-010: The focus-restore target is ambiguous when focus moves during the delay 🟡 MINOR

**Dimension:** 1 — Ambiguities
**Location:** `03-02-loading-overlay.md` §Focus Algorithm lines 143–162; `07` ST-17…ST-21;
`requirements/RD-01` R9.
**Codebase Evidence:** Step 1 captures element A when `loading` becomes true; step 2 "remembers"
the reveal-time element B when it is inside the content; step 3 restores "the remembered
element". R9 says "the captured element".

**The Problem:** If the user tabs from A to B inside the content during the 300 ms delay, the
implementation can restore either, and no ST distinguishes them.

**Options:** (A) restore B when it is inside the content, else A (reveal-time position; least
surprising); (B) always restore A (literal R9); (C) leave unspecified (rejected).

**Recommendation:** A, and add an ST for the A→B case.

**User Decision:** **Delegated — A.** `Eligibility: focus mechanics inside the approved R9
contract.` `Evidence: 03-02:145-159 vs R9.` `Rejected: B (restores a position the user already
left), C.` `Strongest counterargument: R9's letter says "captured element"; the plan's own
"remember it" already describes reveal-time intent.` `Confidence: Med.`
`Reopen: a user expects restoration to the loading-start element.`

## PF-011: No test covers overlay teardown after it was visible 🟡 MINOR

**Dimension:** 4 — Completeness Gaps
**Location:** `03-02-loading-overlay.md` §State Machine lines 72–77, §Error Handling line 233;
`07` ST-19, ST-25; `99` task 2.3.1.
**Codebase Evidence:** ST-16 covers a cancel **before** the delay (nothing was inert); ST-19
asserts only focus restoration; ST-25 covers unmount before the timer. No case asserts that
`inert` is removed, the scrim disappears, the status text is empty and `aria-busy` returns false.

**The Problem:** A stale `inert` leaves the region permanently non-interactive, and the suite
would not catch it.

**Options:** (A) extend ST-19 with the four cleanup facts and add an impl test for
unmount-while-visible; (B) add a dedicated ST.

**Recommendation:** A.

**User Decision:** **Delegated — A.** `Eligibility: testing strategy.` `Evidence: state machine
03-02:72-77.` `Rejected: B (duplicates the transition).` `Strongest counterargument: ST-19 grows
beyond focus; the case is still one transition.` `Confidence: High.`
`Reopen: the teardown contract changes.`

## PF-012: `aria-busy` during the delay window is unasserted 🟡 MINOR

**Dimension:** 4 — Completeness Gaps
**Location:** `07` ST-11/12/15/16; `03-02` line 92; RD-01 R8.
**Codebase Evidence:** `aria-busy={loading}` is specified, but the only true assertion is after
reveal. ST-15 checks the 0–299 ms window and does not assert `aria-busy`.

**The Problem:** An implementation using `aria-busy={visible}` passes every case while reporting
"not busy" for the entire delay — the exact window R8 calls out.

**Options:** (A) extend ST-15 to assert `aria-busy="true"` before the timer advances; (B) assert
it only in the impl tests.

**Recommendation:** A (on the content wrapper, per PF-001).

**User Decision:** **Delegated — A.** `Eligibility: test coverage.` `Evidence: R8; ST-15.`
`Rejected: B (the spec would not own the requirement).` `Strongest counterargument: one more
assertion in a busy case; it pins an explicit requirement.` `Confidence: High.`
`Reopen: aria-busy moves again.`

## PF-013: Four spec cases assert things the test can never observe 🟡 MINOR

**Dimension:** 7 — Testability
**Location:** `07` ST-25 line 65, ST-27 line 67, ST-29 line 74, ST-39 line 84, fixtures lines
142/146; `03-03` lines 119–120.
**Codebase Evidence:** (a) RTL's `render` flushes effects, so ST-27's "status node existed before
its text" has no intermediate snapshot; (b) React 19 batches the `begin`/`end` updates of an
already-resolved promise, so ST-29's intermediate `isLoading=true` may never render; (c) React
19.3.1 emits no warning for a state update after unmount, so ST-25/ST-39's "no warning / no state
update attempted" assertions are vacuous. The `console.error` spy is listed as a fixture.

**The Problem:** These cases can pass without testing the behavior they name, and the immutable
oracle then certifies nothing.

**Options:** (A) restate ST-27 as node identity plus the SSR empty-node cases; use
`createDeferred` for ST-29 (assert true, then resolve, then false); replace ST-25 with
`vi.getTimerCount() === 0` after unmount and ST-39 with promise settlement plus no throw; delete
the `console.error` fixture; (B) move all four to impl tests.

**Recommendation:** A.

**User Decision:** **Delegated — A.** `Eligibility: testing strategy.`
`Evidence: React 19.3.1 behavior verified by the auditor; RTL effect flushing.`
`Rejected: B (loses the observable assertions that do exist).` `Strongest counterargument: the
deferred-promise case is slightly more verbose; it is reliable.` `Confidence: High.`
`Reopen: React reintroduces the unmount warning.`

## PF-014: Several stated behaviors have no oracle, and delay-change semantics are undefined 🟡 MINOR

**Dimension:** 7 — Testability
**Location:** `03-01-loading.md` line 194; `03-02` lines 134, 228; `03-03` lines 132, 216;
`07` ST-3/4/7/14/29–43.
**Codebase Evidence:** No case covers: two overlapping runs where one rejects (R12's
only-that-operation removal); `delay` negative/`NaN`/`Infinity` → 0; a `delay` change while
active (the table says the timer restarts, which would hide/reveal a visible overlay and churn
`inert`/focus); a blank per-run label. A regression that clears all active operations on any
rejection passes ST-30/31.

**Options:** (A) add ST for the rejecting overlap and the blank per-run label, an impl test for
normalization and timer cleanup, and define that a new `delay` applies on the next activation
(no restart of a visible overlay); (B) remove the plan-only rules and test only RD-level behavior.

**Recommendation:** A.

**User Decision:** **Delegated — A.** `Eligibility: concurrency test coverage and timer
semantics.` `Evidence: R12; 03-02:134.` `Rejected: B (the rules are useful and already in the
spec).` `Strongest counterargument: "next activation" adds a subtle rule; it avoids visible
flicker and focus churn.` `Confidence: Med.` `Reopen: a consumer needs a live delay change.`

## PF-015: The scrim has no contract-level observable 🟡 MINOR

**Dimension:** 7 — Testability
**Location:** `07` ST-11, ST-12, ST-15, ST-27; `03-02` §DOM lines 86–114; RD-01 R6.
**Codebase Evidence:** The scrim is a Griffel-styled `div` with no role, test id or static class.
AR-10 rejects asserting Fluent/generated class names. "The visual overlay is rendered" has no
defined lookup.

**The Problem:** An implementation that always renders the scrim (gating only text and `inert`)
passes every case while covering idle content and blocking pointer input.

**Options:** (A) define a structural observable in `03-02` (the root's only child that is neither
the content wrapper nor the status node, and that contains the indicator) and assert
presence/absence; (B) add a stable `data-` attribute/test hook; (C) leave it to the manual check.

**Recommendation:** A.

**User Decision:** **Delegated — A.** `Eligibility: test strategy.` `Evidence: R6; AR-10.`
`Rejected: B (adds a public DOM artifact), C (leaves R6 unverified).` `Strongest counterargument:
structural selectors are brittle; the DOM is fully specified here.` `Confidence: Med.`
`Reopen: the overlay DOM changes.`

## PF-016: The type pins have no red phase and no negative pins 🟡 MINOR

**Dimension:** 7 — Testability
**Location:** `07` ST-45, export-pin sequencing lines 102–105; `99` 1.1.3/2.1.3/3.1.3; root
`package.json:25`; package `tsconfig.json`.
**Codebase Evidence:** `pnpm test` runs Vitest, which transpiles without type-checking.
`pnpm type-check` is a separate step. The repository already uses `@ts-expect-error` pins
(`confirm-dialog.spec.test.tsx`).

**The Problem:** Type-only imports are erased, so a missing type export or a widened
`LoadingOverlayProps` (accepting `aria-busy`/`tabIndex`) passes the red phase and the whole
runtime suite. The compile-time oracle never has a red phase.

**Options:** (A) add `pnpm type-check` to each red-phase record and `@ts-expect-error` pins for
the omitted attributes; (B) reclassify type pins as phase-gate checks.

**Recommendation:** A.

**User Decision:** **Delegated — A.** `Eligibility: verification strategy.`
`Evidence: Vitest transpiles; tsconfig; existing @ts-expect-error pattern.` `Rejected: B (drops
the negative contract).` `Strongest counterargument: the red-phase record gets longer; the type
contract is part of R10.` `Confidence: High.` `Reopen: Vitest adds type-checking.`

## PF-017: ST-21 accepts either outcome, weakening the `isConnected` guard 🟡 MINOR

**Dimension:** 7 — Testability
**Location:** `07` ST-21 line 61; `03-02` steps 2–3 lines 148–160; RD-01 R9.
**Codebase Evidence:** jsdom 30 sets `document.activeElement` to `body` when the focused button is
removed. The algorithm focuses the root only when the captured element is still connected.

**The Problem:** "Root or body" accepts an implementation that unconditionally focuses the root
whenever the active element is body — exactly the case the guard exists to prevent.

**Options:** (A) pin `body` and assert the disconnected button is not focused; (B) move the exact
branch to an impl test.

**Recommendation:** A.

**User Decision:** **Delegated — A.** `Eligibility: test precision.` `Evidence: jsdom behavior;
03-02:148-160.` `Rejected: B (the spec would not pin R9's guard).` `Strongest counterargument:
the assertion depends on jsdom's active-element behavior; it is deterministic here.`
`Confidence: High.` `Reopen: jsdom changes its removal behavior.`

## PF-018: The blocking guarantee does not cover portaled or fixed content, and the R15 fallback is unspecified 🟡 MINOR

**Dimension:** 9 — Edge Cases
**Location:** `03-02-loading-overlay.md` §DOM lines 116–124, §Error Handling line 234;
`02-current-state.md` risk line 122; RD-01 R7 and R15.
**Codebase Evidence:** The scrim is `position: absolute; inset: 0; zIndex: 1` inside an isolated
root; `inert` covers only DOM descendants. Fluent v9 `MenuPopover` renders through `Portal` by
default, and `position: fixed` or high-`z-index` descendants escape the local stacking context.
jsdom cannot test hit-testing.

**The Problem:** "The scrim blocks pointer interaction because it covers the region" is true only
for in-flow, non-portaled descendants. A `Menu` opened inside the covered content remains visible
and operable above the scrim, and its focus is outside the wrapper, so the focus algorithm leaves
it alone. R7's claim is overbroad. Separately, R15 requires a fallback when `display: contents`
is unavailable; the plan uses it unconditionally, and a runtime check would violate AR-12's
"no browser API in render".

**Options:** (A) document the region-scoped limitation (JSDoc/README), add a manual story check
with an open `Menu` and a sticky header, state that the supported browser baseline has
`display: contents` (no runtime fallback; a normal wrapper is a manual, recorded change);
(B) add an `@supports not (display: contents)` CSS fallback; (C) runtime detection — rejected:
browser API in render.

**Recommendation:** A, plus B if a CSS-only fallback is wanted at implementation time.

**User Decision:** **Delegated — A.** `Eligibility: edge-case documentation and verification
inside the approved region-scoped design.` `Evidence: Fluent Portal default; 03-02:121-124.`
`Rejected: C (AR-12), global portal blocker (RD-01 Won't Have).` `Strongest counterargument:
R7 promises blocking without qualification; the limitation is inherent to a region-scoped,
portal-free design.` `Confidence: Med.` `Reopen: a supported browser fails `display: contents`,
or a consumer needs portaled content covered.`

## PF-019: Focus lands on an unnamed, outline-less generic `div` 🟡 MINOR

**Dimension:** 9 — Edge Cases (accessibility)
**Location:** `03-02-loading-overlay.md` §Focus Algorithm lines 148–166; §Styles line 172
(`:focus { outline: none }`); RD-01 R9.
**Codebase Evidence:** The root is a plain `<div tabIndex={-1}>` with no role or name; the focus
ring is suppressed. The only context is the status live region, which PF-001 may suppress.

**The Problem:** A screen-reader user activates Save and focus lands on an unnamed container;
some AT announce nothing or "group". A sighted keyboard user sees no focus indication. R9
approves the focus move but does not give the target a name.

**Options:** (A) `aria-labelledby` the root to the persistent status node via `useId`, verified
for double speech in the manual check; (B) a static visually hidden region name; (C) accept and
document.

**Recommendation:** A, with B as the fallback if the live region double-announces.

**User Decision:** **Delegated — A.** `Eligibility: accessibility mechanism inside R9.`
`Evidence: 03-02:164-166; PF-001.` `Rejected: C (silent focus).` `Strongest counterargument:
labelling the root by the live region can double-announce; the manual check covers it.`
`Confidence: Med.` `Reopen: AT double speech.`

## PF-020: The real-browser gate has missing checks, no record and no owner 🟡 MINOR

**Dimension:** 7 — Testability
**Location:** `99` task 4.1.5 line 255 and deliverables line 262; `07` lines 136/166;
`03-02` line 234; RD-01 R7/R8/R9.
**Codebase Evidence:** The repository has no browser/E2E harness and no screen reader in CI.
`pnpm storybook:build` compiles stories only. The task has "no file target" and asks for a
reported result, not a pass/fail record.

**The Problem:** The pointer-blocking claim, the focus-ring suppression and the actual
announcement are verified nowhere. In `--auto-commit` execution an agent can mark 4.1.5 done
without evidence, and success criterion 3 then overstates completion.

**Options:** (A) convert 4.1.5 into a recorded checklist table (browser, screen reader,
expected/observed, pass/fail) covering inert blur, focus restore, pointer blocking, idle
no-scrim, no focus ring, announcement fires, portaled `Menu` (PF-018), dark/forced-colors/reduced
motion; require the table before Phase 4 completes; (B) drop unexecutable claims and record them
as known limitations.

**Recommendation:** A. The browser/AT execution remains user-owned; the plan must record the
evidence rather than assert the result.

**User Decision:** **Delegated — A.** `Eligibility: verification strategy.`
`Evidence: no harness; 99:255.` `Rejected: B (weakens R7/R8/R9 acceptance).` `Strongest
counterargument: adding a human gate slows `--auto-commit`; the gate already exists in the plan,
it just lacks evidence.` `Confidence: High.` `Reopen: a browser harness is added.`

## PF-021: Storybook is not built in the phases that add stories 🟡 MINOR

**Dimension:** 7 — Testability (verification sequencing)
**Location:** `99` tasks 1.3.2/2.3.2/3.3.2, phase verifies 1.3.4/2.3.4/3.3.5, task 4.1.3; root
`package.json:25`.
**Codebase Evidence:** `pnpm verify` = `format:check && skill:check && type-check && build &&
test`; it does not run `storybook:build`. Type-check covers `.stories.tsx`, but Storybook
runtime/build failures surface only in Phase 4 or CI.

**The Problem:** Phases 1–3 can declare "All verification passing" and auto-commit a story that
Storybook cannot build.

**Options:** (A) add `pnpm storybook:build` to 1.3.4, 2.3.4 and 3.3.5; (B) move stories to
Phase 4; (C) accept CI-only verification.

**Recommendation:** A.

**User Decision:** **Delegated — A.** `Eligibility: verification sequencing.`
`Evidence: package.json scripts.` `Rejected: B (delays feedback), C (contradicts the per-phase
story deliverable).` `Strongest counterargument: an extra build per phase costs time; the
auto-commit gate must be honest.` `Confidence: High.` `Reopen: stories move out of phases.`

## PF-022: Stale code references and a mischaracterized test setup 🟡 MINOR

**Dimension:** 13 — Codebase Alignment
**Location:** `00-ambiguity-register.md` AR-6 (line 36), AR-7 (line 38), AR-10 (line 44), AR-11
(line 46); `02-current-state.md` lines 15, 34, 107.
**Codebase Evidence:**

| Plan citation                                               | Actual location                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| AR-7 `useConfirmDialog.ts:31-46` for blank fallback         | `resolveStrings` is `:25-37`; `isBlank` is `:14-16`                                                                |
| AR-6 `useConfirmDialog.ts:199-215`                          | Effect runs `:198-215`                                                                                             |
| 02:15 `useConfirmDialog.ts:180-215`                         | Capture/restore `:181-196`; busy rescue `:198-215`                                                                 |
| AR-10 / 02:107 `AGENTS.md:36-39` for test conventions       | Tests at `AGENTS.md:31` and `:40`; `:39` is the verify command                                                     |
| AR-11 `AGENTS.md:35` for the package surface                | `:35` covers generated `dist/` and the installer payload; the surface rule is in `AGENTS.md:31` and the repo skill |
| 02:34 `test/setup.ts` = "FluentProvider/test cleanup setup" | `test/setup.ts:1-19` registers jest-dom and RTL cleanup only; each test wraps its own `FluentProvider`             |

**The Problem:** These ranges are the evidence behind Gate decisions; wrong ranges send a later
reviewer to unrelated code. The `setup.ts` row also contradicts `07:144`, which correctly lists a
`FluentProvider` wrapper as a new fixture. The CastingAppMT legacy figures (47 call sites, 371
`fetching` references) are external and cannot be verified in this repository; they should be
labelled as external evidence.

**Options:** (A) correct the ranges (or use symbol names), fix the `setup.ts` row, and mark the
legacy figures as external; (B) leave them.

**Recommendation:** A.

**User Decision:** **Delegated — A.** `Eligibility: documentation accuracy.`
`Evidence: table above.` `Rejected: B.` `Strongest counterargument: line drift recurs; symbol
names are the durable fix, which is part of A.` `Confidence: High.`
`Reopen: the cited files change.`

---

# OBSERVATION

## PF-023: The `useLoadingBase.ts` anatomy deviation is not in the repository's recorded-exception list 🔵 OBSERVATION

**Dimension:** 12 — Consistency
**Location:** `AGENTS.md:30`; `00-ambiguity-register.md` AR-2; `99` Phase 4.
**Codebase Evidence:** `AGENTS.md:30` says anatomy deviations are "recorded exceptions" and lists
three existing ones. The plan adds a fourth (`useLoadingBase.ts`) and records it only in AR-2.
The conventions block sits inside the installer-managed `CODEOPS-PROJECT` markers.

**The Problem:** A future agent reading `AGENTS.md` may treat the state-hook name as drift. The
AR is a plan artifact, not repository guidance.

**Options:** (A) rely on the post-completion `analyze-project` refresh to fold the exception into
`AGENTS.md`; (B) hand-edit `AGENTS.md` (it is regenerated, so the edit would be overwritten).

**Recommendation:** A — no plan change; ensure the execution summary notes the exception so the
refresh captures it.

**User Decision:** **Delegated — A (accepted, no plan change).** `Eligibility: documentation
bookkeeping.` `Evidence: AGENTS.md:30; AR-2.` `Confidence: High.`
`Reopen: the exception is removed.`

---

## Structural checks (passed, not findings)

| Check                                                                              | Result |
| ---------------------------------------------------------------------------------- | ------ |
| Required plan documents present (00-index, 01, 02, 03-01…03, 07, 99, AR)           | ✅     |
| `> **Implements**: loading/RD-01` and the `01` Source link resolve                 | ✅     |
| Document-index links resolve                                                       | ✅     |
| Task arithmetic 16 + 16 + 12 + 5 = 49                                              | ✅     |
| Spec-first order per implementation phase; SSR smoke follows the phase it covers   | ✅     |
| Red-phase record placeholders present for every phase                              | ✅     |
| Ambiguity Register: 15 items, all resolved, auto-design provenance present         | ✅     |
| Specialist check recorded as `None` with evidence                                  | ✅     |
| No provider, store, portal, global blocker, new dependency or E2E harness          | ✅     |
| Complexity Escalation Gate not triggered; no unapproved support surface            | ✅     |
| `--auto-commit` recorded consistently as the exec-plan mode                        | ✅     |
| Security surface documented as not applicable (with the PF-005 API hygiene caveat) | ✅     |
| Roadmap row and portfolio row link the plan correctly                              | ✅     |

## Verdict

**✅ PREFLIGHT PASSED — 23/23 findings resolved by decision; 22 document fixes applied and re-checked.**

- 3 MAJOR: 1 user decision (PF-001), 2 delegated (PF-002, PF-003).
- 19 MINOR: all resolved by delegated decision.
- 1 OBSERVATION: accepted without a plan change.

The first scan was audit-only. Its 22 document fixes and the RD-01 R8 amendment were applied in the
fix pass, then a targeted re-check of the changed sections found no open finding. The plan is ready
for `exec-plan`; the residual risks below are recorded rather than silently accepted.

## Applied fixes (checklist)

All rows below were applied. PF-023 required no plan change (deferred to the post-completion
`analyze-project` refresh).

| Finding | Files changed                                                                                      |
| ------- | -------------------------------------------------------------------------------------------------- |
| PF-001  | RD-01 R8; `03-02` DOM/styles/state text; `07` ST-11/12/22/47 + structural assertion; `02` risk row |
| PF-002  | `07` SSR section; `99` Phase 1/2/3 smoke tasks and expected sets                                   |
| PF-003  | `03-02` focus algorithm and file table; `99` tasks 2.2.3/2.2.4/2.3.1                               |
| PF-004  | `03-01` function JSDoc/prose; `03-02` DOM; `07` overlay assertion                                  |
| PF-005  | `03-01`/`03-02` prop `Omit` lists; `07` ST-4 and negative pins                                     |
| PF-006  | `03-01` DOM/defaults; `07` ST-4/ST-7                                                               |
| PF-007  | `03-03` label policy; `03-01` `loadingLabel.ts`; `07` ST-28/32/34/41 + new cases                   |
| PF-008  | `03-01`/`03-02` integration text; `99` Phase 2 expected set                                        |
| PF-009  | `03-01` types/functions/DOM; `99` tasks 1.2.5/1.2.6                                                |
| PF-010  | `03-02` focus algorithm; `07` ST cases                                                             |
| PF-011  | `07` ST-19 + impl list; `99` task 2.3.1                                                            |
| PF-012  | `07` ST-15                                                                                         |
| PF-013  | `07` ST-25/27/29/39 and fixtures                                                                   |
| PF-014  | `03-02` delay table; `07`/`99` new cases                                                           |
| PF-015  | `03-02` DOM observable; `07` ST-11/12                                                              |
| PF-016  | `99` red-phase tasks; `07` ST-45 and negative pins                                                 |
| PF-017  | `07` ST-21                                                                                         |
| PF-018  | `03-02` DOM/error table; `03-01`/README limitation; `99` 4.1.5                                     |
| PF-019  | `03-02` focus/styles; `99` 4.1.5                                                                   |
| PF-020  | `99` 4.1.5/deliverables                                                                            |
| PF-021  | `99` 1.3.5/2.3.5/3.3.5 (renumbered by PF-002)                                                      |
| PF-022  | `00-ambiguity-register`, `02-current-state`                                                        |
| PF-023  | none (post-completion `analyze-project` refresh)                                                   |

## Targeted re-check (iteration 2)

The re-check re-read every finding decision against the edited documents and re-ran the structural
checks.

| Area                          | Result | Evidence                                                            |
| ----------------------------- | ------ | ------------------------------------------------------------------- |
| PF-001 busy/status structure  | PASS   | RD-01 R8; `03-02` DOM and state machine; ST-11/12/15/22/26/47       |
| PF-002 SSR classification     | PASS   | `07` SSR section; `99` 1.3.4/2.3.4/3.3.4; 49-task arithmetic        |
| PF-003 focus inputs           | PASS   | `03-02` §Focus Algorithm; `99` 2.2.3/2.2.4/2.3.1                    |
| PF-004 indicator ownership    | PASS   | `03-01` renderer contract; `03-02` DOM; ST-12                       |
| PF-005 managed attributes     | PASS   | `03-01`/`03-02` `Omit` lists; AR-9; ST-45 negative pins             |
| PF-006 `minHeight` precedence | PASS   | `03-01` conditional spread; ST-7a/ST-7b                             |
| PF-007 label policy           | PASS   | `03-01` `normalizeLabel`; `03-03` §Label Policy; ST-32a/33a/41/41a  |
| PF-008 shared hidden class    | PASS   | `03-01`/`03-02` integration; `99` Phase 2 expected set              |
| PF-009 state contract         | PASS   | `03-01` `LoadingBaseState`; `renderLoading(state, ref)`             |
| PF-010 restore target         | PASS   | `03-02` focus steps 2–3; ST-19a                                     |
| PF-011 teardown coverage      | PASS   | ST-19 cleanup facts; `99` 2.3.1                                     |
| PF-012 busy during delay      | PASS   | ST-15                                                               |
| PF-013 observable cases       | PASS   | ST-25 timer count; ST-27 identity; ST-29 deferred; ST-39 settlement |
| PF-014 delay/concurrency      | PASS   | `03-02` delay table; ST-24a/ST-31a; impl normalization              |
| PF-015 scrim observable       | PASS   | `03-02` test lookup; ST-11/ST-12                                    |
| PF-016 type red phase         | PASS   | `99` 1.1.3/2.1.3/3.1.3; ST-45                                       |
| PF-017 disconnected focus     | PASS   | ST-21 pins `document.body`                                          |
| PF-018 limitations            | PASS   | `03-02` DOM/error; `03-01`; `99` M-7; `02` risk rows                |
| PF-019 focus target name      | PASS   | `03-02` `aria-labelledby`/`useId`; M-1/M-5; ST-17                   |
| PF-020 manual evidence        | PASS   | `99` 4.1.5 checklist table                                          |
| PF-021 Storybook per phase    | PASS   | `99` 1.3.5/2.3.5/3.3.5; `07` checklist                              |
| PF-022 citations              | PASS   | AR-4/6/7/8/9/10/11/15; `02` lines 15, 34, 55–61, 107                |
| PF-023 anatomy exception      | PASS   | no plan change; execution summary note required                     |

### Residual risks (recorded, not open findings)

| Risk                                                                                                     | Mitigation / owner                                                                             |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `aria-busy` on a `display: contents` wrapper may not reach the AT tree                                   | Manual check M-9; normal-wrapper fallback with a recorded layout change (RD-01 §Compatibility) |
| RD-01 R9 says "captured element"; the plan restores the reveal-time element first                        | Recorded in `03-02` §Focus Algorithm for the next RD revision                                  |
| RD-01 R11 wording literally prioritizes the most recent operation, not the most recent labeled operation | Recorded in `03-03` §Label Policy for the next RD revision                                     |
| RD-01 R10 promises all native `div` props pass; `LoadingOverlay` manages `aria-label`/`aria-labelledby`  | Recorded in `03-02` props and AR-9 for the next RD revision                                    |
| RD-01 R7/R15 are broader than the region-scoped design and its manual fallback                           | Recorded in `03-02` §DOM/Error Handling and `02` risk rows                                     |
| Same-model bias: plan authored and reviewed by the same model                                            | Human accessibility review before release (inert, live region, focus, busy exposure)           |
| Plan documents are untracked; no commit was made in this run                                             | User decision; `exec-plan --auto-commit` owns commits during execution                         |

## Next steps

| Action                                                                                         | Owner                       |
| ---------------------------------------------------------------------------------------------- | --------------------------- |
| Execute the plan with `exec-plan` and the requested `--auto-commit` mode                       | User / next session         |
| Complete manual checklist 4.1.5 (including M-9 busy exposure) before release                   | User                        |
| Revise RD-01 R7/R9/R10/R11/R15 wording in the next requirements pass                           | Requirements owner          |
| Record the `useLoadingBase` anatomy exception in the post-completion `analyze-project` refresh | exec-plan / analyze-project |

The feature roadmap row is advanced to `Plan Preflighted` (🔬).
