# Preflight Report: confirm-dialog requirements set

> **Status**: ✅ PREFLIGHT PASSED — all 22 findings resolved, applied, and verified (iteration 2; two residuals fixed and re-verified)
> **Iteration**: 1 → 2 (fixes applied on the user's instruction; independent verification pass complete)
> **Artifact**: requirements set — `codeops/features/confirm-dialog/requirements/`
> (README.md, RD-01-confirm-dialog-component.md, RD-02-confirm-provider.md, 00-ambiguity-register.md)
> **Revision**: scan start — commit `3287b6e`; blobs: README `760ce3c7…`, AR `8d9835e1…`, RD-01 `edf90b13…`, RD-02 `fcf9f73d…`
> **Codebase Grounded**: every document reference mapped to code and verified against the repository and the installed
> sources (Fluent UI v9, tabster, jsdom, react-dom 19.3.1, Griffel); legacy evidence independently fact-checked against
> CastingAppMT; 5 independent auditor clusters + 1 independent design challenger
> **Scope mode**: strict (no optional additions proposed)
> **Auto-design**: active — root invocation `PF-CONFIRM-DIALOG-2026-10-16`, policy version 1
> **Last Updated**: 2026-10-16

⚠️ **Lineage note**: the artifact was authored in a **prior session** by the same model family. Mitigations applied:
five independent preflight-auditor dispatches (one per dimension cluster), one independent design-challenger over the
major batch, and every finding grounded in cited sources rather than the author's prose.

---

## Codebase Context Summary

**Repository**: `blendsdk/fluentui-react` — pnpm/Turborepo monorepo; publishable package
`packages/react-components` (`@blendsdk/fluentui-react-components` 0.1.1).

**Tech stack (verified from manifests)**: React 19.3.1; Fluent UI v9 (`@fluentui/react-components` 9.74.9;
installed react-dialog 9.18.5, react-button 9.11.1, tokens 1.0.0-alpha.24); TypeScript 7.0.2 (`strict`);
Vitest 5 + jsdom 30 + Testing Library 16 + jest-dom (no `user-event`); Storybook 10 with docs + a11y addons only;
CI gate = format:check → skill:check → type-check → build → test → storybook:build → `npm pack --dry-run`.

**Architecture observed**: one component per folder in the house pattern (`<Name>.tsx` forwardRef shell,
`.types.ts`, `use<Name>.ts`, `render<Name>.tsx`, `use<Name>Styles.styles.ts`, `.stories.tsx`, `index.ts`);
spec/impl/SSR tests under `test/`; exact export-surface pin (`test/package-exports.spec.test.ts`); `ErrorDialog`
(precedent: controlled `modalType="alert"` dialog) and `SystemErrorProvider` (precedent: context + hook that throws
outside the provider) already shipped.

**Key facts verified for this audit**:

- `role="alertdialog"` from `modalType="alert"`; `aria-labelledby` auto-wired (`useDialogSurface.js:104` — citation matches); backdrop close only for `modalType="modal"`.
- Escape always _requests_ open change, but the controlled dialog's setter is a no-op (`useControllableState`: dispatcher acts only uncontrolled) — inert without `onOpenChange`. **AR #9's rationale (modalType forbids Escape) is imprecise — see PF-022.**
- `useFocusFirstElement` focuses `findFirstFocusable(surface)` or falls back to the surface; `unmountOnClose=true` default; DialogActions keeps DOM order.
- Danger tokens all exist; Button has no danger appearance (9.11.1); Button pressed state is the **two-selector pair** `:hover:active, :active:focus-visible`.
- Griffel 1.21.4 compiles the proposed guarded selector and its specificity beats Button's atomic rules.
- **Focus restore**: tabster marks the surface as a Restorer Source (`useModalAttributes.js`), but a Restorer **Target** is applied only by `DialogTrigger` — a trigger-less controlled dialog has no restore target; focus falls to `<body>` on close.
- jsdom: no layout → tabster finds no focusable element (surface receives focus); jsdom never blurs a disabled element; `fireEvent` dispatches to disabled buttons; no forced-colors emulation in Storybook or jsdom.
- Legacy evidence (CastingAppMT): 25 call sites / 55 i18n keys / 0 HTML / exact `iterate_dialog_message` and all mechanisms confirmed; nuances: legacy `children` was a dead prop; hidden-dialog pattern is component-level only.

---

## Summary by Dimension

| #   | Dimension              | Findings | Highest severity |
| --- | ---------------------- | -------- | ---------------- |
| 1   | Ambiguities            | 4        | 🟡               |
| 2   | Implicit Assumptions   | 1        | 🔵               |
| 3   | Logical Contradictions | 1        | 🟠               |
| 4   | Completeness Gaps      | 4        | 🟡               |
| 5   | Dependency Issues      | 0        | —                |
| 6   | Feasibility Concerns   | 0        | —                |
| 7   | Testability            | 6        | 🟠               |
| 8   | Security Blind Spots   | 1        | 🔵               |
| 9   | Edge Cases             | 2        | 🟠               |
| 10  | Scope Creep Indicators | 0        | —                |
| 11  | Ordering & Sequencing  | 0        | —                |
| 12  | Consistency            | 1        | 🟡               |
| 13  | Codebase Alignment     | 2        | 🟠               |

## Summary by Severity

| Severity    | Count | Status                                         |
| ----------- | ----- | ---------------------------------------------- |
| CRITICAL    | 0     | —                                              |
| MAJOR       | 5     | All resolved (delegated; challenger converged) |
| MINOR       | 13    | All resolved (delegated)                       |
| OBSERVATION | 4     | All resolved (delegated)                       |

---

## MAJOR findings

### PF-001: Initial-focus acceptance criteria cannot pass in the declared test environment 🟠 MAJOR

**Dimension:** 7 — Testability (with 3/13)
**Location:** RD-01 AC #3 (line 327), AC #7 (line 340); "Focus and accessibility wiring" (lines 232–247)
**Codebase Evidence:** `useFocusFirstElement.js` falls back to focusing the surface when nothing is found; tabster's
visibility check needs layout (`tabster/dist/esm/Focusable.js:22-43`) and jsdom rects are 0×0; the shipped sibling
oracle asserts containment only (`test/error-dialog.spec.test.tsx:138-144`) after its own preflight (PF-001,
user-resolved).

**The Problem:** "The decline button holds focus" / "the first holds initial focus" fail by construction in jsdom —
`document.activeElement` is the dialog surface. Spec tests are the immutable oracle, so the plan is pushed either to
weaken the oracle silently or to add unapproved focus scaffolding.

**Options:**

| Option | Description                                                                                | Pros                                                       | Cons                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| A      | Reword ACs to "focus is inside the dialog" + manual story/keyboard channel for exact focus | Matches sibling precedent; honest oracle; zero scaffolding | Exact target not pinned in CI                                                                                         |
| B      | Stub body/Element rects in the new spec files so tabster sees focusables                   | Keeps exact assertions                                     | Oracle couples to tabster internals (breaks on upgrade); stub weakens discrimination; deviates from sibling precedent |

**Recommendation:** Option A — the behavior requirement stays; only the unverifiable wording changes; B was
independently evaluated and rejected (oracle brittleness / internal coupling).

**User Decision:** AI — delegated by `--auto-design` (eligible: testing strategy)
**Evidence:** `useFocusFirstElement.js`; `tabster/Focusable.js:22-43`; `test/error-dialog.spec.test.tsx:138-144`; sibling preflight resolution
**Rejected alternatives:** B (above); C — component-owned focus-first effect (duplicates v9; contradicts "v9 built-ins"); browser-mode tooling (new infrastructure)
**Strongest counterargument:** the oracle stops pinning the exact focus target in CI (mitigated by DOM-order AC #2 + manual pass)
**Confidence:** High — would change only if the project adopts a browser test runner · **Hardening:** one independent challenger for the major batch — **converged**
**Policy version:** 1 · **Root invocation ID:** `PF-CONFIRM-DIALOG-2026-10-16`
**Reopen triggers:** a real-browser test harness is adopted; a focus regression escapes to the manual pass
**Status:** Applied — verified (iteration 2)

---

### PF-002: RD-01 AC #5 "rapid double activation → exactly one call" has no mechanism and contradicts the controlled contract 🟠 MAJOR

**Dimension:** 3 — Logical Contradictions (with 7)
**Location:** RD-01 AC #5 (lines 330–332) vs "Callbacks" (lines 200–201) and "Controlled closure" (lines 256–257); AR #7; RD-02 AC #10
**Codebase Evidence:** two real clicks on an enabled action with `open` still true invoke `onResolve` twice (React
dispatches each discrete event; nothing disables or unmounts); no once-mechanism is described anywhere in RD-01;
the legacy `setTimeout` guard was explicitly replaced by host-owned `busy` (RD-01 lines 24, 106–108).

**The Problem:** The criterion demands one call across two activations while the same criterion keeps the dialog open
(so the second click always possible), and "activation" is undefined. A spec test written 1:1 fails against a
contract-abiding implementation. The provider layer _does_ have a real once-mechanism (settled flag + close on
activation) and its AC #10 already covers rapid double activation.

**Options:**

| Option | Description                                                                                                                                                                       | Pros                                                        | Cons                                                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A      | Define "activation"; exactly-once per activation at RD-01; move the rapid-double guarantee to RD-02 AC #10; host guidance (close or set `busy` on first resolution) in the README | Aligns with AR #7 and the approved legacy-guard replacement | None at the component layer (host-owned by design)                                                         |
| B      | Add a component-internal report-once latch per open cycle                                                                                                                         | Satisfies the sentence literally                            | Hidden state contradicting "presentation-only"; new re-arm semantics; silently swallows legitimate retries |

**Recommendation:** Option A — corrects the criterion to the approved contract instead of adding rejected machinery.

**User Decision:** AI — delegated by `--auto-design` (eligible: correction aligning the oracle with the approved contract; testing strategy)
**Evidence:** RD-01/RD-02 texts above; challenger D2 (High confidence, converged)
**Rejected alternatives:** B (above)
**Strongest counterargument:** a host that neither closes nor sets `busy` can still run its follow-up twice — that is the documented host contract, not a component bug
**Confidence:** High · **Hardening:** challenger — **converged**
**Policy version:** 1 · **Root invocation ID:** `PF-CONFIRM-DIALOG-2026-10-16`
**Reopen triggers:** the design adopts component-level once semantics; the provider's AC #10 is weakened
**Status:** Applied — verified (iteration 2)

---

### PF-003: "Focus returns to the invoking element (v9 built-ins)" is false for this component shape 🟠 MAJOR

**Dimension:** 13 — Codebase Alignment (stale assumption; with 9/6)
**Location:** RD-01 Must-Have (lines 73–76) and "Trap and restore" (lines 244–245); AR #13 note
**Codebase Evidence:** `useModalAttributes.js` marks the surface as restorer Source and hands out Target attributes;
`DialogTrigger/useDialogTrigger.js` is the only applier of those Target attributes; tabster's restorer records and
restores only Targets (`Restorer.js`). A trigger-less controlled dialog has no restore target → focus falls to
`<body>` on close, in every declarative and provider flow. No acceptance criterion covers restore.

**The Problem:** A Must-Have accessibility promise is factually unfulfillable by the cited mechanism; the provider
layer inherits the gap and cannot fix it (it owns no invoking element).

**Options:**

| Option | Description                                                                                                                                                          | Pros                                                                   | Cons                                                                       |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1      | Reword to the true v9 behavior; document the limitation                                                                                                              | Smallest, honest                                                       | Drops a stated Must-Have a11y behavior; every flow loses focus to `<body>` |
| 2      | Bounded best-effort restore: capture the focused element in a **layout effect** on the `false→true` open transition; on `true→false`, re-focus it if still connected | Fulfills the promise; one guarded effect, React-only; jsdom-verifiable | Adds an effect RD-01's NFR note currently disclaims                        |

**Recommendation:** Option 2 — implements the already-approved promise; capture must be layout-phase (v9's
focus-first is a passive effect; a passive capture would read the surface), transition-guarded, connected-checked.

**User Decision:** AI — delegated by `--auto-design` (eligible: failure/recovery + interface mechanism; Complexity Escalation Gate verdict: does NOT trip — ordinary feature code meeting an accepted obligation)
**Evidence:** `useModalAttributes.js:26-42`; `useDialogTrigger.js:16,32`; `Restorer.js:106-138`; challenger D3 (High, converged; layout-phase capture required)
**Rejected alternatives:** Option 1 (drops the promise); host-side `useRestoreFocusTarget` (host coupling, no provider-layer help)
**Strongest counterargument:** the component cannot always know the true invoker; option 1 matches the sibling's current posture — rejected because the Must-Have explicitly promises restore
**Confidence:** High · **Hardening:** challenger — **converged** (gate verdict: no escalation)
**Policy version:** 1 · **Root invocation ID:** `PF-CONFIRM-DIALOG-2026-10-16`
**Reopen triggers:** the restore effect grows beyond one bounded effect; the promise is descoped by the user
**Status:** Applied — verified (iteration 2)

---

### PF-004: Provider same-tick replacement races admit a dangling promise and a clobbered request 🟠 MAJOR

**Dimension:** 9 — Edge Cases (concurrency timing; with 4)
**Location:** RD-02 "Provider mechanics" (lines 151–166), Must-Have replacement/settlement (lines 52–57)
**Codebase Evidence:** document-level mechanics gap; RD-02's "Opening is a state update" makes the second same-tick
`confirm()` read a stale snapshot; plain clear-on-activation can erase a record installed in the same dispatch.
React 19 batches same-tick updates.

**The Problem:** Two exact sequences violate the stated guarantees ("never leaves a dangling await"; "settles
exactly once"): (A) two `confirm()` calls in one tick → first promise never settles; (B) supersede interleaved with
activation in one dispatch → newer record cleared, its dialog never shows, its promise never settles. AC #4 (two
sequential calls) passes while both failures remain.

**Options:**

| Option | Description                                                                                                                                                                          | Pros                                   | Cons                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------- |
| 1      | Pin invariants (synchronous record at creation; ref authoritative with state mirror; no settling inside updaters; conditional clear on activation) + two ACs for the exact sequences | Makes the guarantees real and testable | Pins storage mechanics in the requirements                                         |
| 2      | Two ACs only, no mechanism                                                                                                                                                           | Leaves freedom                         | Naive implementation fails late with a hung promise — most expensive failure class |

**Recommendation:** Option 1 — the guarantees are the reason replacement beat queueing (AR #17); they must be
specified, not accidental.

**User Decision:** AI — delegated by `--auto-design` (eligible: concurrency/consistency + failure design)
**Evidence:** RD-02:52-57, 151-166, 201, 254-255; challenger D4 (High, converged)
**Rejected alternatives:** Option 2; Option 3 — drop the claim (contradicts adoption rationale)
**Strongest counterargument:** pins storage mechanics into the RD (mitigation: ref authoritative, state written alongside; ACs are behavioral)
**Confidence:** High · **Hardening:** challenger — **converged** (coupled with PF-005)
**Policy version:** 1 · **Root invocation ID:** `PF-CONFIRM-DIALOG-2026-10-16`
**Reopen triggers:** an equally sound synchronous store emerges; the settlement guarantees are repealed
**Status:** Applied — verified (iteration 2)

---

### PF-005: "Pending requests cannot exist at the StrictMode mount probe" is false 🟠 MAJOR

**Dimension:** 9 — Edge Cases (React 19 lifecycle; with 4)
**Location:** RD-02 "Unmount" mechanic (lines 159–161) and usage contract (lines 60–62)
**Codebase Evidence:** React 19.3.1 dev StrictMode runs the mount effect pass (descendant effects may call
`confirm()` — explicitly allowed) and then double-invokes effects cleanup→setup synchronously
(`react-dom-client.development.js`: `commitDoubleInvokeEffectsInDEV`, dev bundle); a synchronously-written pending
record exists at the provider's cleanup, so the unmount settlement can resolve it `false` prematurely (a later user
decision silently discarded by the settle-once guard) — real for guarded single-shot effects. Sibling precedent:
`test/system-error-provider.impl.test.tsx:105`.

**The Problem:** The document relies on a false invariant ("documented in code"), so no discriminator would be built
and no test would catch the dev-only misbehavior.

**Options:**

| Option | Description                                                                                                                                                                                                                                          | Pros                                              | Cons                                     |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| 1′     | Behavioral invariant (requests created in mount effects survive the probe; genuine unmount settles pending `false`) + probe/unmount discriminator (microtask-deferred settle cancelled by the synchronous re-setup, or equivalent) + StrictMode test | Makes both guarantees true; repo precedent exists | Adds one deferred-settlement mechanic    |
| 2      | Keep wording; accept dev-only misbehavior                                                                                                                                                                                                            | Nothing to build                                  | False invariant stays; no guard; no test |

**Recommendation:** Option 1′ — note the challenger's correction: "settlement only affects committed/rendered
requests" is insufficient (creates a dangle hole on real unmount before first commit); the discriminator must be
explicit and behavioral. Coupled with PF-004: the ref-based record is what makes the premature settle actual, and the
discriminator keeps the ref from breaking the unmount guarantee. The StrictMode test asserts the surviving request
stays pending after the probe and settles exactly once.

**User Decision:** AI — delegated by `--auto-design` (eligible: failure/recovery + concurrency + testing strategy)
**Evidence:** `commitDoubleInvokeEffectsInDEV` (react-dom 19.3.1 dev bundle, ~line 20416); RD-02:60-62,159-161; sibling StrictMode test; challenger D5 (High, converged with mechanism correction)
**Rejected alternatives:** Option 2 (above); "committed-only" wording (insufficient — see correction)
**Strongest counterargument:** adds a microtask mechanic to a provider whose NFR says "no timers" (a microtask is not a timer; dev-only failure otherwise)
**Confidence:** High · **Hardening:** challenger — **converged** (coupled with PF-004)
**Policy version:** 1 · **Root invocation ID:** `PF-CONFIRM-DIALOG-2026-10-16`
**Reopen triggers:** React changes StrictMode probe ordering; the unmount guarantee is repealed
**Status:** Applied — verified (iteration 2)

---

## MINOR findings

### PF-006: RD-02 lists `busy` among provider-supplied props — contradicts the AR #22 deferral 🟡 MINOR

**Dimension:** 4 · **Location:** RD-02 Integration Points line 182 vs Won't-Have lines 75–76; AR #22 · **Related:** AR #22
**Problem:** The provider has no `busy` source; a literal plan either invents hold-open mode (deferred) or wires a dead pass-through.
**Resolution (delegated):** Remove `busy` from that sentence; state "the provider never sets `busy`; hold-open is deferred per AR #22". _Evidence:_ no `busy` in the provider's inputs. _Rejected:_ adding a provider `busy` option (re-opens AR #22). _Confidence:_ High. _Eligibility:_ consistency correction within the user-confirmed deferral.
**Status:** Applied — verified (iteration 2)

### PF-007: Provider `strings` merge vs RD-01's empty-string fallback is undefined 🟡 MINOR

**Dimension:** 1 · **Location:** RD-02 "Rendering" line 164 + AC #7; RD-01 "Default labels" lines 250–252 + AC #8 · **Related:** AR #15, AR #18
**Problem:** With provider `{confirm:'Yes'}` and per-call `{confirm:''}`, straight merge → English "Confirm"; treating `''` as not-supplied → "Yes". Two implementations satisfy every current criterion with different visible labels (auditor split confirmed).
**Resolution (delegated):** Treat empty per-call values as not supplied: effective label chain = per-call → provider → English default; add the case to RD-02 AC #7. _Evidence:_ AR #15 objective (no unnamed control; graceful floor); AR #18 provider defaults exist for localization. _Rejected:_ straight merge to English (drops provider localization in a corner). _Strongest counterargument:_ literal reading of "per-call overrides win key by key" + AR #15's "English default" phrasing; simplest code — both defensible. _Confidence:_ Med — would change if the user prefers the literal merge. _Eligibility:_ failure/recovery design mirroring AR #15's own delegated class.
**Status:** Applied — verified (iteration 2)

### PF-008: The supersede path has no stated focus outcome 🟡 MINOR

**Dimension:** 4 · **Location:** RD-02 "Replacement" lines 154–156 + AC #4
**Problem:** On supersede `open` stays `true`, so v9's focus acquisition never re-runs; if the action set differs, focus falls to `<body>` behind the modal.
**Resolution (delegated):** State the outcome — after a supersede, focus is inside the new dialog (surface or first action per environment); implement by keying the dialog per request (or equivalent effect); add an impl-test criterion with differing action counts. _Evidence:_ `useFocusFirstElement` runs on open transitions only. _Rejected:_ declaring body-focus acceptable. _Confidence:_ High. _Eligibility:_ failure/recovery design within "the provider dialog behaves exactly like RD-01".
**Status:** Applied — verified (iteration 2)

### PF-009: Forced-colors obligation is unmeasurable; "usable and distinguishable" undefined 🟡 MINOR

**Dimension:** 7 · **Location:** RD-01 "Danger styling" lines 224–226 + AC #6
**Problem:** No configured tool emulates forced colors ("check in the story" is not runnable); at rest the UA replaces authored colors, so color-distinguishability there is not achievable by design.
**Resolution (delegated):** Reword to the checkable intent — the override must not disable forced-colors handling (no `forced-color-adjust: none`; colors stay token-driven; Fluent's HC rules keep applying) — and record a **manual** browser forced-colors pass as a story checklist item; "distinguishable" concretized as label/state feedback. _Evidence:_ `.storybook/main.ts` addons only; Button HC rules verified. _Rejected:_ keeping as-is; adding emulation tooling (new infrastructure). _Confidence:_ High. _Eligibility:_ testing strategy + measurement definition; requirement intent unchanged.
**Status:** Applied — verified (iteration 2)

### PF-010: Danger recipe misses Button's keyboard-pressed selector pair 🟡 MINOR

**Dimension:** 4 · **Location:** RD-01 "Danger styling" (guarded-selector instruction) + AC #6
**Problem:** Fluent's pressed state is `:hover:active, :active:focus-visible`; mirroring only `:hover:active` lets a keyboard activation (Space/Enter) fall back to the neutral pressed background.
**Resolution (delegated):** Pin the full selector set: guarded base `:enabled:not([aria-disabled="true"])`, `:hover`, `:hover:active`, `:active:focus-visible` — each applying the three danger tokens + inverted foreground; disabled buttons keep Fluent styling by construction. _Evidence:_ `useButtonStyles.styles.js:23` (selector pair); Griffel specificity math verified. _Confidence:_ High. _Eligibility:_ styling implementation mechanism.
**Status:** Applied — verified (iteration 2)

### PF-011: AC #4's Escape target ("on the document") would produce a vacuous test 🟡 MINOR

**Dimension:** 7 · **Location:** RD-01 AC #4; RD-02 AC #11
**Problem:** React delegates events at the root; a keydown dispatched on `document` never reaches the surface handler — the test passes even with dismissal wired incorrectly. Sibling tests dispatch on the dialog element.
**Resolution (delegated):** Name the target in both criteria: Escape keydown while focus is inside the dialog (dispatched on the `alertdialog` element); backdrop click unchanged. _Evidence:_ `useDialogSurface.js:42-56`; `test/error-dialog.spec.test.tsx:118`. _Confidence:_ High. _Eligibility:_ testing technique; requirement unchanged.
**Status:** Applied — verified (iteration 2)

### PF-012: Busy-focus criterion can pass with no implementation; trigger undefined 🟡 MINOR

**Dimension:** 7 · **Location:** RD-01 "Busy focus policy" lines 240–243 + AC #11
**Problem:** jsdom never blurs a disabled element, so "activeElement is not body" passes without the effect; "smallest synchronization" names no trigger; the "Fluent utility" alternative does not exist (modalizer ignores lost-to-body focus); the no-focus-theft clause has no criterion.
**Resolution (delegated):** State the trigger (false→true `busy` transition only; one move; no steal on unrelated re-renders), mandate the component effect (drop "or Fluent utility"), strengthen AC #11 to assert the dialog surface holds focus (jsdom-verifiable — our effect calls `focus()` explicitly) and add the no-steal criterion. _Evidence:_ `Modalizer.js` null-focused early return; jsdom focus behavior. _Confidence:_ High. _Eligibility:_ mechanism + testing strategy.
**Status:** Applied — verified (iteration 2)

### PF-013: Runtime-empty `actions` fallback does not specify the reported outcome 🟡 MINOR

**Dimension:** 1 · **Location:** RD-01 "Actions fallback" + AC #12; RD-02 "Input validation" + overloads · **Related:** AR #9
**Problem:** The fallback renders the pair, but neither layer states what `onResolve` / the provider promise yields (boolean expected by pair semantics; undefined today).
**Resolution (delegated):** State: when the empty-`actions` fallback applies, the dialog behaves exactly as the default pair — `onResolve` receives a boolean; the provider resolves a boolean for such a request; add to AC #12 and the AR #9 note. _Evidence:_ AR #9 ("documented and tested" — outcome was neither). _Rejected:_ provider-side translation (no value to translate). _Confidence:_ High. _Eligibility:_ completion of the approved fallback decision.
**Status:** Applied — verified (iteration 2)

### PF-014: "A rendered action can never be unnamed" does not hold for custom labels 🟡 MINOR

**Dimension:** 1 · **Location:** RD-01 Must-Have lines 66–67; `ConfirmAction.label`; AR #15 · **Related:** AR #15
**Problem:** `label: string` admits `''`; only `strings.confirm`/`decline` receive the fallback — a blank custom label renders an unnamed button, violating the stated absolute invariant and AR #15's objective.
**Resolution (delegated):** Extend the robustness rule: a blank custom `label` falls back to the action's `value` as the rendered label (and accessible name); document in the README localization note; add an acceptance criterion. _Evidence:_ AR #15 objective ("every interactive control keeps an accessible name") + its delegated class. _Rejected:_ narrowing the invariant (leaves the a11y failure); aria-only fallback (visually blank control). _Strongest counterargument:_ visible fallback changes rendering for misuse — only for blank labels, where blank rendering is already broken. _Confidence:_ Med — would change if the user prefers callers own blank labels. _Eligibility:_ defensive failure design within AR #15's objective.
**Status:** Applied — verified (iteration 2)

### PF-015: Export enumeration mismatch — `ConfirmOptionsWithActions` 🟡 MINOR

**Dimension:** 12 · **Location:** AR #19 list (lines 166–169) vs RD-02 `export interface ConfirmOptionsWithActions` (line 117) · **Related:** AR #19
**Problem:** One document exports a type the naming decision omits; the type-pin test must be written one way.
**Resolution (delegated):** Export `ConfirmOptionsWithActions` from the package root; amend AR #19's record accordingly (new invocation). _Evidence:_ the actions-mode options shape is part of the public README contract; export pin = runtime list + type pins. _Rejected:_ keeping it internal. _Confidence:_ High. _Eligibility:_ naming/export surface within AR #19's delegated class; reopens the recorded decision under the invalidation path.
**Status:** Applied — verified (iteration 2)

### PF-016: Several Must-Haves lack verification hooks; RD-02's file map omits the provider story 🟡 MINOR

**Dimension:** 7 · **Location:** RD-01 Must-Haves lines 62–63, 85–86; anatomy tables (RD-01 line 131, RD-02 line 102); export pin file · **Related:** AR #14, AR #19, AR #21
**Problem:** No acceptance criterion covers: package-surface exports/types; the compile-time inference & mutual-exclusion claims (no mechanism named); the decorative-icon guarantee; the story duties (the build only compiles); and `ConfirmProvider.stories.tsx` is missing from RD-02's anatomy table despite a Must-Have requiring it.
**Resolution (delegated):** Add (a) a package-surface AC (runtime exports + AR #19/PF-015 type list) with the two-part export-pin update (runtime list + `satisfies` type pins), (b) the established compile mechanism (`// @ts-expect-error`) for the inference/mutual-exclusion criteria, (c) an icon AC (icon rendered, `aria-hidden`, accessible name stays the label), (d) the provider story row in RD-02's anatomy table. _Evidence:_ `test/package-exports.spec.test.ts:16-48` (two-part pattern); `tsconfig` type-check covers `test/`; sibling PF-013 mechanism. _Confidence:_ High. _Eligibility:_ testing strategy + file-map completion of approved duties.
**Status:** Applied — verified (iteration 2)

### PF-017: Documentation duties lack artifacts/criteria; README Principles carve-out unacknowledged 🟡 MINOR

**Dimension:** 4 · **Location:** RD-01 Must-Haves lines 59–61, 87–89; RD-02 lines 36–39, 60–62, 98; AR #24; `README.md:40-44` · **Related:** AR #24
**Problem:** Safe-action ordering rule, provider usage contract and multi-provider caveat must be "documented" without a named artifact; AR #24 claims a "documentation criterion" that does not exist; shipping the provider leaves the README Principles sentence ("SystemErrorProvider is the deliberate carve-out" — singular) stale.
**Resolution (delegated):** Anchor each duty: ordering rule → RD-01 README composition notes; handler/effect usage + multi-provider unsupported note → RD-02 README setup section; add the README Principles carve-out update (both providers hold transient state) as a Definition-of-Done item; verification is a review-level checklist (pipelines cannot detect missing prose). _Evidence:_ `README.md:40-44`; AR-21 gates only build `storybook:build`. _Confidence:_ High. _Eligibility:_ documentation-duty anchoring within approved AR #24/#21 intent.
**Status:** Applied — verified (iteration 2)

---

## OBSERVATIONS

### PF-018: `forwardRef` generic assertion vs the house "no unsafe casts" rule 🔵 OBSERVATION

**Dimension:** 2 · **Location:** RD-01 lines 192–195; AR #20
**Resolution (delegated):** Keep `forwardRef` + the type-preserving assertion and word it as a **recorded exception** (compile-time only, documented in the component file, revisited if a cast-free pattern becomes idiomatic), per the repository's "recorded exceptions" rule. _Rejected:_ React-19 ref-as-prop (deviates from the house shell). _Evidence:_ skill anatomy; AR #20. _Confidence:_ High.
**Status:** Applied — verified (iteration 2)

### PF-019: Provider-count/nesting posture stated in three registers 🔵 OBSERVATION

**Dimension:** 1 · **Location:** README overview/decisions; RD-02 Must-Have + Scope Decisions; AR #16
**Resolution (delegated):** State once, precisely: supported = one provider per React root; at most one dialog per provider; nesting mechanically nearest-wins but unsupported; name the README section carrying the note. _Evidence:_ documents alone. _Confidence:_ High.
**Status:** Applied — verified (iteration 2)

### PF-020: Story coverage is unenumerated 🔵 OBSERVATION

**Dimension:** 7 · **Location:** RD-01 lines 85–86, 125; RD-02 line 63
**Resolution (delegated):** Enumerate the expected stories (default pair, danger pair, custom actions with per-action variants incl. icon, busy, multi-line message, strings overrides) and label the focus/keyboard + forced-colors manual passes as review-verified checklist items (hosts PF-001/PF-009). _Evidence:_ `storybook:build` compiles, does not verify; sibling pattern. _Confidence:_ High.
**Status:** Applied — verified (iteration 2)

### PF-021: "The message is the only content-driven surface" excludes `title` 🔵 OBSERVATION

**Dimension:** 8 · **Location:** RD-01 "Injection risks" + AC #9; AR #25
**Resolution (delegated):** Reword: both `title` and `message` are content-driven and render through React — never parsed as HTML; run the markup-inertness assertion against `title` as well. _Evidence:_ both are `ReactNode`; no residual injection surface exists — wording accuracy only. _Confidence:_ High.
**Status:** Applied — verified (iteration 2)

### PF-022: Escape-inert rationale cites the wrong mechanism 🟡 MINOR

**Dimension:** 13 — Codebase Alignment (incorrect evidence; with 2) · **Location:** AR #9 evidence note (lines 84–86, citing `useDialogSurface.js:36-56`); AR #6/#7 note (lines 66–69); RD-01 "Dismissal" (lines 246–247)
**Problem:** `modalType="alert"` does not forbid Escape — the surface's keydown handler always calls `requestOpenChange` (only the backdrop is modalType-gated); Escape is inert because the dialog is **controlled** and no `onOpenChange` is wired (the controlled setter is a no-op). An uncontrolled alert dialog would close on Escape. The recorded evidence would mislead future maintenance if the controlled-only constraint ever changed; the requirement itself (no Escape dismissal) is correct.
**Resolution (delegated):** Correct the causal note to the controlled-state no-op + omitted handler; keep the requirement. _Evidence:_ `useDialogSurface.js` Escape handler; `useDialog.js` `requestOpenChange`; `useControllableState` controlled dispatcher. _Rejected:_ leaving the note as-is. _Confidence:_ High. _Eligibility:_ evidence correction (no behavior change).
**Status:** Applied — verified (iteration 2)

---

## Iteration & fix status

- **Iteration 1** raised the 22 findings above; all received a recorded resolution (delegated authority under
  `--auto-design`; one challenger over the major batch — converged on all five majors).
- **Fixes were applied** on the user's explicit instruction — all 22 resolutions; no commits (review-only mode).
- **Iteration 2** (independent verification dispatch) checked every applied fix against its recorded resolution,
  swept all cross-references, and re-scanned all 13 dimensions on the updated target: 21 findings verified on the
  first check; two residuals — PA-V2-001 (RD-02 "Settlement" wording; regression of PF-004) and PA-V2-002
  (AR-25 wording; partial application of PF-021) — were fixed and directly re-verified.
- **Final state: all 22 resolutions effective; zero unresolved findings.**

## Iteration 2 verification

> **Status**: ✅ All resolutions effective after the residual fixes
> **Previous iteration**: 22 findings — all resolved (delegated)
> **This iteration**: 2 residuals — PA-V2-001 🟡 (RD-02 "Settlement" prescribed an unqualified active-record
> clear; regression of PF-004's conditional-clear fix) and PA-V2-002 🔵 (AR-25 still called the message the only
> content-driven exposure; partial application of PF-021) — both fixed and directly re-verified
> **Carried forward**: none

The verification pass verified all 22 applied fixes against their recorded resolutions, checked the direct
consequences across focus text, activation semantics, fallback outcomes, the strings chain, provider mechanics,
export surface, verification hooks, danger selectors, documentation anchoring and the AR amendment markers, and
re-examined all 13 dimensions within the updated audit target. No further contradictions were found.

---

## Authority record (auto-design)

All 22 resolutions were selected under the Auto-Design Authority Policy v1, root invocation
`PF-CONFIRM-DIALOG-2026-10-16`; each entry above carries its eligibility class, objective, evidence, rejected
alternatives, strongest counterargument, confidence, hardening result, and reopen triggers. No decision waives a
finding, expands scope, authorizes commits, or approves new machinery (Complexity Escalation Gate verdict on PF-003:
does not trip — no escalation packet required). Reserved-authority items encountered: none beyond the eligible
classes (product behavior, acceptance _bars_, scope, security policy unchanged).
