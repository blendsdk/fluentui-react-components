# Ambiguity Register: confirm-dialog requirements

> **Status**: ✅ GATE PASSED — all 25 items resolved
> **Last Updated**: 2026-10-16 13:05

Context imported from the approved design session (2026-10-16): the legacy `ConfirmDialog` of
CastingAppMT's `fui8` package (Fluent UI v8, `@fluentui/react`) was analyzed across all 25 call
sites and converted into a version-independent functional-requirements set; the resulting design
then went through three review passes (repository component skill, Fluent UI v9 internals,
upstream-authoring patterns) and was explicitly approved by the user, including the v9-only
platform directive. Items 1–8, 10, 12–14, 16–18 and 24 are pre-resolved from that session and are
not re-confirmed; the user's "I approve!" covers the review-pass recommendations as bulk
acceptance (an explicit decision per the gate rules). Items 22–23 are user-confirmed named
deferrals. Items 9, 11, 15, 19, 20 and 21 are eligible technical decisions resolved under
`--auto-design` (root invocation `MR-CONFIRM-DIALOG-2026-10-16`, policy version 1); their complete
delegated provenance is recorded in the Resolution Notes. Item 25 resolves against the
repository's security standards (AGENTS.md) together with AR #10. The 2026-10-16 preflight review
amended AR #5, #9, #13, #15, #17, #18, #19, #21 and #22 — each amendment is marked in its
Resolution Note (root invocation `PF-CONFIRM-DIALOG-2026-10-16`).

| #   | Category           | Ambiguity / Gap                                                                                                  | Options Presented                                                                                                                                                                                                                                                            | User Decision / Delegated Resolution                                                                                                                                                                                                               | Status           |
| --- | ------------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | Scope              | Target platform: v9-only, or dual v8/v9 support with a fallback path?                                            | (a) v9-only, no v8 artifacts; the legacy source supplies functional ideas only · (b) a dual-mode component with a v8 fallback branch                                                                                                                                         | **v9-only, no fallback anywhere** — user directive "I want everything v9 and v9 only"; accepted cost: the still-v8 CastingAppMT app cannot consume the components until that app itself migrates                                                   | ✅ Resolved      |
| 2   | Scope              | What exactly transfers from the legacy `fui8` `ConfirmDialog`?                                                   | (a) Functional requirements only; v8 idioms and API names rejected (`danger` boolean, `declineAsPrimary`, `disableOnConfirm`, `onClose(confirm?)`, theme swap) · (b) port the legacy API shape for familiarity                                                               | **Option (a)** — accepted design principle: "Technically there is nothing there that we can take. We can only learn and take the ideas, not the implementation."                                                                                   | ✅ Resolved      |
| 3   | Scope              | Deliverable decomposition                                                                                        | (a) RD-01 controlled `ConfirmDialog` + RD-02 `ConfirmProvider`/`useConfirm` (two RDs) · (b) dialog only · (c) provider folded into RD-01                                                                                                                                     | **Option (a)** — user approved two-RD scope; the provider was explicitly demanded for DX ("I don't want to add multiple ConfirmProviders"; one-call prompts)                                                                                       | ✅ Resolved      |
| 4   | UX & presentation  | Intent taxonomy for button emphasis                                                                              | (a) `confirmation` \| `danger`, with `question` folded into `confirmation` · (b) three intents where `question` receives a distinct glyph treatment                                                                                                                          | **Option (a)** — "question" is wording, not color; a third axis with no distinct visual would be drift. Approved in bulk                                                                                                                           | ✅ Resolved      |
| 5   | UX & presentation  | How the danger treatment is expressed                                                                            | (a) v9-native: the danger token recipe on the affirmative / danger-flagged action only; the surface stays neutral · (b) legacy whole-dialog red palette swap · (c) built-in Button danger color                                                                              | **Option (a)** — (b) rejected (v8 mechanic; breaks dark mode and custom themes); (c) unavailable: `@fluentui/react-button@9.11.1` and upstream master expose no danger color                                                                       | ✅ Resolved      |
| 6   | Behavioral gaps    | Dismissal semantics                                                                                              | (a) Strict alert: no Escape, no backdrop dismissal, no close button; every exit is an explicit action · (b) Escape/backdrop resolve as decline                                                                                                                               | **Option (a)** — parity with the legacy `isBlocking: true`; a forced decision requires an explicit choice                                                                                                                                          | ✅ Resolved      |
| 7   | Behavioral gaps    | Visibility and outcome contract of RD-01                                                                         | (a) Controlled `open` (no uncontrolled mode); single `onResolve`; boolean for the default pair; the component never closes itself and never executes the action · (b) uncontrolled `defaultOpen`; per-action callbacks                                                       | **Option (a)** — host owns state and side effects (repository pattern; matches all legacy call sites)                                                                                                                                              | ✅ Resolved      |
| 8   | Feature gaps       | Custom action sets (Yes/No/Cancel, Save/Discard/Cancel) beyond the default pair                                  | (a) Optional typed `actions` non-empty tuple (value/label/appearance/intent/icon) replacing the pair; resolution = chosen value; exclusive with dialog-level `intent` · (b) ReactNode actions slot · (c) pair only                                                           | **Option (a)** — user-requested capability; (b) rejected (promise outcomes become untyped); (c) rejected (the stated need). Legacy `actions` slot usage was 0 of 25 sites — this is new demand, recorded as such                                   | ✅ Resolved      |
| 9   | Edge cases         | Runtime `actions: []` from untyped consumers (the non-empty tuple guard bypassed)                                | (a) Fall back to the default confirm/decline pair · (b) render no actions (an alert dialog with no exit) · (c) throw at render                                                                                                                                               | **AI (delegated)** — fallback to the default pair (pair outcomes — a boolean); documented and tested (see AR-9 notes)                                                                                                                              | ✅ Resolved — AI |
| 10  | UX & presentation  | Content contract (title/message)                                                                                 | (a) `title: ReactNode` required; `message?: ReactNode`; content never parsed as HTML · (b) string-only content with HTML allowed (legacy `dangerouslySetInnerHTML`)                                                                                                          | **Option (a)** — approved delta; (b) rejected: 0 of 55 legacy dialog i18n strings contain HTML, so the HTML path is unused risk and an XSS surface                                                                                                 | ✅ Resolved      |
| 11  | UX & presentation  | Plain-string message line breaks                                                                                 | (a) Preserve `\n` via `white-space: pre-line` · (b) collapse newlines (effective legacy behavior) · (c) convert newlines into markup                                                                                                                                         | **AI (delegated)** — pre-line rendering for string messages (see AR-11 notes)                                                                                                                                                                      | ✅ Resolved — AI |
| 12  | UX & presentation  | Action labels and localization                                                                                   | (a) `strings?: Partial<ConfirmDialogStrings>` with `confirm`/`decline` keys and English defaults "Confirm"/"Cancel"; per-call overrides · (b) required labels without defaults · (c) built-in NL/EN tables                                                                   | **Option (a)** — house precedent (`ErrorDialog`); consumer apps localize                                                                                                                                                                           | ✅ Resolved      |
| 13  | UX & presentation  | Focus policy                                                                                                     | (a) Initial focus = first action in DOM order (v9 built-in); safe action documented first; on `busy`, focus moves to the dialog surface (never `<body>`); trap/restore handled by v9 · (b) per-intent initial-focus switching                                                | **Option (a)** — matches Fluent 2 guidance ("keyboard focus should go to the first interactive element"); no unsafe variants                                                                                                                       | ✅ Resolved      |
| 14  | UX & presentation  | Accessibility wiring                                                                                             | (a) `alertdialog` role; accessible name via the required `DialogTitle`; the component wires `aria-describedby` to the message when present; icons decorative (`aria-hidden`) · (b) rely on v9 defaults only                                                                  | **Option (a)** — verified: v9 auto-wires only the label (`useDialogSurface.js:104`); the description is the component's duty                                                                                                                       | ✅ Resolved      |
| 15  | Integration points | Native-prop pass-through and ARIA robustness details                                                             | (a) Caller-provided aria/className win; empty-string action labels fall back to English defaults · (b) component overrides caller attributes; blank labels honored as written                                                                                                | **AI (delegated)** — caller wins; labels always produce accessible names (see AR-15 notes)                                                                                                                                                         | ✅ Resolved — AI |
| 16  | Behavioral gaps    | How the imperative layer is reached across pages                                                                 | (a) One `ConfirmProvider` at the app root; `useConfirm()` from any descendant/page; nested providers → nearest wins; more than one per React root unsupported (documented); no module-level singleton · (b) a global singleton `confirm()`                                   | **Option (a)** — user requirement ("I don't want to add multiple ConfirmProviders"); (b) rejected (SSR-unsafe, loses theme context, collides across apps/tests)                                                                                    | ✅ Resolved      |
| 17  | Edge cases         | Provider concurrency, settlement and lifecycle                                                                   | (a) Replace semantics: a new request resolves the previous promise `false` then shows; promises never reject; settle-once per request; provider unmount resolves a pending request `false`; call from handlers/effects only · (b) queue requests                             | **Option (a)** — modal prompts are one-at-a-time; predictable; no dangling awaits. (b) rejected: queued dialogs can surface after their flow context changed                                                                                       | ✅ Resolved      |
| 18  | UX & presentation  | Provider-level defaults                                                                                          | (a) `strings` only; per-call overrides win · (b) provider defaults for `intent` and `actions` too                                                                                                                                                                            | **Option (a)** — smallest surface; `intent` is always flow-specific                                                                                                                                                                                | ✅ Resolved      |
| 19  | Naming             | Public export surface and file names                                                                             | (a) `ConfirmDialog`, `ConfirmProvider`, `useConfirm` + `ConfirmIntent`, `ConfirmAction`, `ConfirmDialogStrings`, `ConfirmDialogProps`, `ConfirmProviderProps`, `ConfirmOptions`; feature `confirm-dialog`; RD slugs as written · (b) alternative names                       | **AI (delegated)** — option (a) (see AR-19 notes)                                                                                                                                                                                                  | ✅ Resolved — AI |
| 20  | Technical unknowns | Typed-outcome mechanism                                                                                          | (a) One generic `V extends string`; discriminated prop/option shapes (`actions?: undefined` vs non-empty tuple); canonical `forwardRef` generic-preserving assertion (documented; never `as any`/`as unknown`) · (b) plain `string` outcomes                                 | **AI (delegated)** — option (a) (see AR-20 notes)                                                                                                                                                                                                  | ✅ Resolved — AI |
| 21  | Technical unknowns | Verification strategy                                                                                            | (a) House conventions: specification tests as the immutable oracle, implementation tests, an SSR smoke for the provider, one story per component, README sections, the package export-surface pin; gates `pnpm verify` + `pnpm storybook:build` · (b) minimal smoke coverage | **AI (delegated)** — option (a) (see AR-21 notes)                                                                                                                                                                                                  | ✅ Resolved — AI |
| 22  | Behavioral gaps    | Hold-open busy mode in the provider (dialog stays open with disabled actions while the host's async action runs) | (a) Not implemented now; the provider closes immediately on activation and the host acts afterwards · (b) implement now with an async action callback inside the request                                                                                                     | **Deferred** — ⏸ Deferred — hold-open busy provider mode · owner: user · revisit: first real flow that needs in-place pending feedback. Consequence stated: the dialog is gone during the host's API call; slow operations need host-side feedback | ⏸ Deferred       |
| 23  | UX & presentation  | Optional dialog header glyph (`icon` prop)                                                                       | (a) Not implemented now · (b) include a severity glyph beside the title                                                                                                                                                                                                      | **Deferred** — ⏸ Deferred — optional dialog `icon` prop · owner: user · revisit: a concrete flow requesting a severity glyph. Consequence stated: no iconography in v1; wording carries the meaning                                                | ⏸ Deferred       |
| 24  | Scope              | Usage boundary and documentation duty                                                                            | (a) Documented boundary: the component is not for forms, multi-step flows or custom bodies — compose `Dialog` primitives instead; README "when not to use" section required · (b) no boundary statement                                                                      | **Option (a)** — approved as a definition-of-done item (documentation criterion)                                                                                                                                                                   | ✅ Resolved      |
| 25  | Security           | Security posture for a client-only library component                                                             | (a) No new exposure: text-only rendering (AR #10), no network/storage/auth/crypto surface; a security test asserts markup-inertness · (b) n/a                                                                                                                                | **Resolved via governing standards + AR #10** — repository security standards apply; XSS eliminated by construction; test derived from AR #21                                                                                                      | ✅ Resolved      |

## Resolution Notes

**AR-1 / AR-2:** The design conversation established the v9-only directive and the
"ideas, not implementation" principle. The legacy analysis (25 call sites, 55 dialog-related i18n
keys, 0 containing HTML) is the evidence base for the functional requirements; none of the v8
mechanisms (`ThemeProvider` palette swap, `dangerouslySetInnerHTML`, `setTimeout`-based
`disableOnConfirm`, always-mounted hidden dialog, vestigial `actions`/`justifyActions`/`children`
props) transfer.

**AR-3:** The two-RD split mirrors the proven `error-dialog` structure (dialog + provider) and the
upstream precedent (`Dialog` primitives + `Toaster`/`useToastController`); each layer is
independently useful and independently testable.

**AR-4 / AR-5:** Two intents only. The danger treatment uses the v9 status tokens
(`colorStatusDangerBackground3` + `...Hover` + `...Pressed`, and the on-brand white foreground)
on the one action that carries it, with the surface untouched — verified available in the
installed tokens package; the Button primitive has no built-in danger look in
`@fluentui/react-button@9.11.1` or upstream master. The guarded selector covers the base, hover,
pressed and keyboard-pressed (`:active:focus-visible`) states; forced-colors behavior is a manual
story checklist item (the override must not defeat Fluent's own handling). _(2026-10-16 preflight
amendment.)_ _(2026-10-16 manual-pass amendment: the danger foreground uses
`colorNeutralForegroundOnBrand`; the pinned `colorStatusDangerForegroundInverted` resolved to a
low-contrast red on the strong danger background in both themes — corrected by direct user report
during the Storybook pass.)_

**AR-6 / AR-7:** Verified v9 mechanics for the alert semantics: `modalType="alert"` renders
`role="alertdialog"`, backdrop clicks are ignored, and Escape only requests a close when an
`onOpenChange` handler is supplied — which the component deliberately omits
(`react-dialog/lib/components/DialogSurface/useDialogSurface.js`).

**AR-8:** The legacy `actions` slot existed but was never used (0 of 25 sites); the capability is
recorded as new demand. The typed array was chosen over a ReactNode slot because it keeps promise
outcomes typed on both layers — the decisive advantage for the RD-02 DX.

**AR-9 (delegated):**

```text
Authority: AI — delegated by --auto-design
Eligibility: failure and recovery design — defensive runtime behavior for an approved API;
  changes no product behavior, scope or acceptance criterion; reversible pre-1.0 surface.
Objective: no consumer can ever be shown an alert dialog without an exit.
Decision: a runtime-empty `actions` array falls back to the default confirm/decline pair and
  reports pair outcomes (`onResolve` receives a boolean); documented and covered by an
  acceptance criterion.
Evidence: v9 `modalType="alert"` ignores backdrop clicks, and with a controlled dialog and no
  `onOpenChange` an Escape keydown is inert (the controlled-state setter is a no-op) — a
  zero-action alert traps keyboard users; the TypeScript
  non-empty tuple (AR #20) protects typed callers but not plain-JS consumers.
Rejected alternatives: rendering no actions (trapped user); throwing at render (hostile to app
  error boundaries for a preventable state).
Strongest counterargument: silently correcting a caller error can hide bugs — mitigated because
  typed callers cannot express the empty case, and the fallback is documented and tested.
Confidence: High — would change only if the component later gains dismissal affordances.
Hardening: not required — low blast radius, reversible, pre-1.0; in-context challenge applied.
Policy version: 1 · Root invocation ID: MR-CONFIRM-DIALOG-2026-10-16
Reopen triggers: a host reports deliberate zero-action usage; a dismissal affordance is added.
```

_(2026-10-16 preflight amendment: pair-outcome pinning; Escape-inert rationale corrected to the
controlled-state no-op.)_

**AR-10:** `title` is required because an `alertdialog` must have an accessible name and v9 wires
`aria-labelledby` from `DialogTitle` automatically (`useDialogSurface.js:104`); `ReactNode` keeps
the door open for emphasis or glyphs without new props.

**AR-11 (delegated):**

```text
Authority: AI — delegated by --auto-design
Eligibility: implementation mechanism within the approved content contract (AR #10); no product
  behavior change beyond an already-approved multi-line content model.
Objective: honor the legacy multi-line message evidence without reintroducing markup.
Decision: plain-string messages render with `white-space: pre-line` (the component's content
  class); ReactNode content is unaffected; newlines are never converted into elements.
Evidence: legacy i18n values contain `\n` (e.g. `casting/iterate_dialog_message`:
  "Create a new round from this casting with: \n${names} ?"); 0 of 55 dialog strings contain HTML.
Rejected alternatives: collapsing newlines (effective legacy behavior — loses evidence-backed
  formatting); converting `\n` to markup (reintroduces the rejected HTML path).
Strongest counterargument: pre-line changes wrapping semantics for strings that contain
  accidental newlines — accepted as the lesser deviation, documented in the README props table.
Confidence: High — changes only if the content contract itself is reopened.
Hardening: not required — cosmetic, reversible; in-context challenge applied.
Policy version: 1 · Root invocation ID: MR-CONFIRM-DIALOG-2026-10-16
Reopen triggers: a host reports unwanted pre-line wrapping; the content model changes to markup.
```

**AR-12 / AR-13 / AR-14:** Labels follow the `ErrorDialog` strings precedent. The focus policy is
the v9 built-in behavior (`useFocusFirstElement` focuses the first focusable element —
`react-dialog/lib/utils/useFocusFirstElement.js`) with a documented safe-action-first ordering
rule for callers that provide custom actions. The `aria-describedby` wiring is a deliberate
improvement over v9's auto-wiring, which covers only the label. Close-time restore: v9's built-in
restore requires a `DialogTrigger` restorer target, which this trigger-less component does not
render, so RD-01 restores best-effort — capture on open, re-focus on close when still connected.
In jsdom, tabster finds no focusable element and the surface receives focus; the exact focus
behavior is verified in the story's manual keyboard pass. _(2026-10-16 preflight amendment.)_

**AR-15 (delegated):**

```text
Authority: AI — delegated by --auto-design
Eligibility: integration/interface mechanism within the approved house pattern; no product
  behavior or scope change; naming-free and reversible.
Objective: element attributes behave the way the repository's native pass-through contract
  promises, and every interactive control keeps an accessible name.
Decision: caller-provided aria/className/style win over component wiring (house rule);
  the component wires `aria-describedby` only when the caller did not supply one; empty-string
  confirm/decline labels fall back to the English defaults and a blank custom action `label`
  falls back to the action's `value` — a control can never be unnamed.
Evidence: repository rules — native props pass through, `mergeClasses` for every caller-settable
  class, caller wins; ARIA requires accessible names for interactive controls.
Rejected alternatives: honoring empty labels verbatim (unnamed buttons — accessibility failure);
  component attributes overriding the caller (violates the pass-through contract).
Strongest counterargument: the empty-string fallback deviates from `ErrorDialog`'s
  "empty string suppresses the text" precedent — justified because action labels are
  accessibility-critical names, unlike descriptive text.
Confidence: High — would change only if visually blank labels become a real requirement.
Hardening: not required — small, reversible; in-context challenge applied.
Policy version: 1 · Root invocation ID: MR-CONFIRM-DIALOG-2026-10-16
Reopen triggers: a concrete need for blank action labels; the pass-through contract changes.
```

_(2026-10-16 preflight amendment: blank custom labels fall back to the action's `value`.)_

**AR-16 / AR-17 / AR-18:** The provider mirrors `SystemErrorProvider` (context-scoped, hook throws
outside the provider) and upstream `Toaster` (`useToastController`). Replacement-not-queueing was
chosen because prompts are modal; resolving the superseded promise `false` keeps the safe
direction (no accidental action) and never leaves a dangling `await`. The provider mechanics pin
this guarantee: the active record is written synchronously (same-tick calls supersede correctly;
activation clears conditionally), the `strings` chain resolves per-call → provider → English
defaults (an empty per-call value is not supplied), and requests created in mount effects survive
the StrictMode probe — the deferred settlement is cancelled by the probe's synchronous re-setup.
_(2026-10-16 preflight amendment.)_

**AR-19 (delegated):**

```text
Authority: AI — delegated by --auto-design
Eligibility: naming of the public type surface within the user-approved API names
  (ConfirmDialog, ConfirmProvider, useConfirm were approved in the design session); internal
  architecture and interfaces; reversible pre-1.0.
Objective: a fluent, collision-free export surface consistent with the repository's existing
  barrels and the error-dialog precedent.
Decision: exports `ConfirmDialog`, `ConfirmProvider`, `useConfirm`; types `ConfirmIntent`,
  `ConfirmAction`, `ConfirmDialogStrings`, `ConfirmDialogProps`, `ConfirmProviderProps`,
  `ConfirmOptions`, `ConfirmOptionsWithActions`; feature folder `confirm-dialog`; RD slugs
  `RD-01-confirm-dialog-component.md` / `RD-02-confirm-provider.md`.
Evidence: `src/index.ts` barrel order and style (error-dialog addition); house rule "components
  and their props types from the package root"; RD slug precedent
  (`RD-01-error-dialog-component.md`).
Rejected alternatives: `DecisionDialog` (narrows the user's confirmed vocabulary);
  `useDialog` for the hook (collides with Fluent's internal `useDialog_unstable` and reads like
  the primitive, not the convenience).
Strongest counterargument: `useConfirm` implies a boolean outcome while the actions mode resolves
  a value — mitigated by documentation and the pair/actions type discrimination.
Confidence: High — final naming is reviewable at plan/review time with zero code impact.
Hardening: not required — naming only; in-context challenge applied.
Policy version: 1 · Root invocation ID: MR-CONFIRM-DIALOG-2026-10-16
Reopen triggers: an export name or RD slug is found misleading during plan review.
```

_(2026-10-16 preflight amendment: `ConfirmOptionsWithActions` added to the export list.)_

**AR-20 (delegated):**

```text
Authority: AI — delegated by --auto-design
Eligibility: internal type mechanism within the user-approved typed-outcome capability
  (AR #8 approved typed values and the non-empty tuple); interface design; reversible.
Objective: literal-typed outcomes with zero unsafe casts.
Decision: one generic `V extends string` on the action/call options; discriminated shapes
  (`actions?: undefined` for the pair mode, non-empty tuple for the actions mode); the component
  uses the canonical `forwardRef` generic-preserving assertion, documented in code — never
  `as any` / `as unknown`.
Evidence: `forwardRef` does not preserve generics; the assertion pattern is the standard
  workaround; repository standards forbid unsafe casts; literal inference from `{ value: 'save' }`
  works through a `V extends string` type parameter.
Rejected alternatives: plain `string` outcomes (typo-prone comparisons, no exhaustiveness);
  requiring callers to write `as const` (worse DX).
Strongest counterargument: the assertion is still an `as` — mitigated by being type-preserving
  and by a documented justification in the component file.
Confidence: High — changes only if TypeScript or React ref handling make it unnecessary.
Hardening: not required — compile-time only; in-context challenge applied.
Policy version: 1 · Root invocation ID: MR-CONFIRM-DIALOG-2026-10-16
Reopen triggers: a cleaner generic pattern becomes idiomatic; review flags the assertion.
```

**AR-21 (delegated):**

```text
Authority: AI — delegated by --auto-design
Eligibility: testing strategy — an explicitly eligible class; no product behavior change.
Objective: verified delivery of this contract, matching the repository's non-negotiable
  spec-first standard.
Decision: per house conventions — `test/confirm-dialog.spec.test.tsx` (immutable oracle),
  `test/confirm-dialog.impl.test.tsx`, `test/confirm-provider.spec.test.tsx`,
  `test/confirm-provider.impl.test.tsx`, `test/confirm-provider.ssr.test.tsx` (node environment),
  one story file per component, README sections, `test/package-exports.spec.test.ts` pin (runtime
  list and type pins), compile-time claims via `// @ts-expect-error`, enumerable story variants
  with the focus/keyboard and forced-colors passes as manual checklist items; gates: `pnpm verify`
  and `pnpm storybook:build`.
Evidence: AGENTS.md Verification section; error-dialog precedent (93 tests across 8 files,
  red/green per phase).
Rejected alternatives: minimal smoke coverage (leaves the contract untested; the house standard
  forbids it).
Strongest counterargument: this is the heaviest cost item of the feature — justified because the
  specification-first loop is the repository's core quality mechanism and both layers are
  interactive.
Confidence: High — the plan may split or reorder files but cannot weaken the standard.
Hardening: not required — process convention; in-context challenge applied.
Policy version: 1 · Root invocation ID: MR-CONFIRM-DIALOG-2026-10-16
Reopen triggers: house verification conventions change; a preflight finding adjusts the matrix.
```

_(2026-10-16 preflight amendment: two-part export pin, compile-time pins, enumerable stories
with the manual focus/keyboard and forced-colors passes.)_

**AR-22 / AR-23 (deferrals):** Both deferrals were presented with their consequences and accepted
in bulk. Neither may appear in executable requirements or plans: the provider closes immediately
on activation and never sets `busy` (no hold-open mode), and no dialog glyph prop exists in v1.
_(2026-10-16 preflight amendment: the never-sets-`busy` clarification.)_

**AR-24:** The boundary statement is part of the definition of done for RD-01's README section —
"when not to use" pointing to `Dialog` + `DialogActions` composition.

**AR-25:** No sensitive data, no network calls, no authentication, no storage, no secrets, no
infrastructure. The content-driven exposures are `title` and `message`; both are eliminated as
markup by AR #10 and verified by spec criteria (markup-like strings render inert in each).

**Approved complexity escalations:** None — the feature adds two components to the existing
package using existing dependencies and patterns; no new layer, dependency, harness or
infrastructure.
