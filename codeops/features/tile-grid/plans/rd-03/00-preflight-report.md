# Preflight Report: TileGrid RD-03

> **Status**: ✅ PREFLIGHT PASSED WITH NOTES — 12 findings resolved, 1 minor explicitly accepted
> **Iteration**: 2 — fix verification and bounded all-dimension rescan
> **Artifact**: Full implementation plan in `codeops/features/tile-grid/plans/rd-03/`
> **Iteration 1 content hash**: `71fa73437a287e7d18734faaccb9ecc01f3b7e6d8b8ec432517996023ce38f4b`
> **Content hash**: `1f844c422cce5a81600d83815654752392cdcdb493500e566366be943c441877`
> **Baseline**: `e71d26c` (`v0.3.0`); uncommitted plan on `feat/tile-grid-rd-03`
> **Last Updated**: 2026-10-22 00:45
> **CodeOps Artifact Schema**: 1

**SAME-SESSION REVIEW:** This plan was created in the current session. Independent read-only
auditors review five dimension clusters and two domain clusters to reduce shared blind spots.
A fresh-session or human accessibility review can add further independence.

## Audit Scope

- Main target: the nine authored plan documents, excluding this report.
- Companion targets: approved changes to RD-02's native `tabIndex` contract and RD-03's stored
  selection/eligibility and focus recovery, including their direct consequences. Their scoped
  results are recorded separately so this review cannot imply a fresh pass for the whole RD set.
- Context: other requirement text, the requirements decision register and historical preflight,
  Phase A, source/tests/manifests, AGENTS.md, and existing roadmap summaries.
- Product baseline: complete RD-03 using existing geometry, selection, virtualization, and marquee
  foundations, with the approved bounded focus helper and Fluent controls. TileGrid remains internal.
- Mode: strict scope, normal user decisions. Fixes require explicit user authorization.

The plan hash is SHA256 over sorted authored filenames, a NUL, each file's bytes, and a NUL.
The diagnostic plan parser reports 47 pending tasks and no structural problems; its `Ready` label
does not establish a semantic preflight pass or authorize execution.

## Codebase Context

React 19, Fluent UI `9.74.9`, TanStack Virtual `3.14.21`, and Vitest `5.0.5` are present in the
existing package. The current state hook composes cached geometry, virtual windows, selection,
and anchor preservation. The list root is currently the tab stop. The marquee controller exists
but has no mounted host. Current tests pin list/selection/SSR/export behavior and 20K budgets.

Primary evidence: `packages/react-components/src/components/TileGrid/useTileGrid.ts`,
`selection/useGridSelection.ts`, `marquee/createMarqueeController.ts`, and the package manifest.
Reviewers inspect further directly affected source, tests, installed dependency implementations,
and standards. Exact evidence accompanies every retained finding.

## Scan Coverage

All thirteen dimensions and both selected domain lenses were scanned. The five dimension
clusters used fresh generic auditor sessions with complete packets; two additional auditors
covered web application and data/migration. The repository has no model routing override.
Strict quality policy and independent review remained active.

| Dimension                  | Evidence / retained roots                                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Ambiguities            | Empty-content entry ownership: PF-005.                                                                                                       |
| 2 — Implicit assumptions   | Stateful capture capability: PF-008.                                                                                                         |
| 3 — Logical contradictions | Seed order versus expected trace: PF-001.                                                                                                    |
| 4 — Completeness gaps      | Escape delivery and empty content: PF-003/PF-005; web findings below.                                                                        |
| 5 — Dependencies           | Phase 1 preview requires Phase 3: PF-002.                                                                                                    |
| 6 — Feasibility            | Already-mounted offscreen focus: PF-004.                                                                                                     |
| 7 — Testability            | PF-001/PF-002/PF-008; concrete oracles otherwise present.                                                                                    |
| 8 — Security blind spots   | No additional defect: text output, opaque-ID maps, fixed selectors, static warnings, no new network/persistence surface.                     |
| 9 — Edge cases             | PF-003/PF-004/PF-007 and web composition cases.                                                                                              |
| 10 — Scope creep           | No finding: approved local helper, existing dependencies/runners, no generalized framework.                                                  |
| 11 — Ordering              | Specification-first structure exists; PF-002 prevents a valid early green gate.                                                              |
| 12 — Consistency           | PF-001; names and task IDs otherwise consistent.                                                                                             |
| 13 — Codebase alignment    | All ten subchecks completed. Existing paths/APIs/dependencies/export controls verified; PF-004/PF-006–PF-008 expose integration assumptions. |

Counts below are by distinct root cause, not by dimension or duplicate reviewer report.

| Severity    | Count | State                                                       |
| ----------- | ----- | ----------------------------------------------------------- |
| Critical    | 0     | None                                                        |
| Major       | 9     | PF-001–PF-005, PF-009–PF-012; all verified resolved         |
| Minor       | 4     | PF-006–PF-008 verified resolved; PF-013 explicitly accepted |
| Observation | 0     | None                                                        |

**Requirement corrections:** Both focused companion reviews pass with zero correction-specific
findings. The implementation plan also passes its bounded rescan. The focused results do not revalidate the
whole requirement set or advance a full-RD roadmap stage.

| Companion report                                                          | Verdict                          |
| ------------------------------------------------------------------------- | -------------------------------- |
| [RD-02 native tab entry](../../requirements/00-preflight-report-RD-02.md) | Passed — scoped correction only  |
| [RD-03 state and focus](../../requirements/00-preflight-report-RD-03.md)  | Passed — scoped corrections only |

## Findings

Paths `P/` below refer to this plan directory; `S/` refers to
`packages/react-components/src/components/TileGrid/`; `T/` refers to
`packages/react-components/test/`. Finding descriptions preserve iteration-1 locations and evidence;
the iteration-2 closure table below gives the corrected documents and sections.

### PF-001: Combined test seeds the wrong range anchor 🟠 MAJOR

**Dimensions:** 3, 7, 12. **Location:** `P/07-testing-strategy.md:76` (ST-36).
**Evidence:** `P/03-01-selection-and-accessibility.md:25–28` makes the first seeded ID the anchor;
requirements RD-01 lines 163–168 and `S/selection/useGridSelection.ts:183–187` define missing-anchor
fallback. Constructing `{hidden,b}` as `new Set(['hidden', 'b'])` cannot produce the expected
`b,c,d` range. The later checkbox operation and count messages also diverge. Unordered set notation
does not fix this: it leaves a behavior-critical insertion order unspecified.

| Option              | Result / trade-off                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Recommended** | Specify `new Set(['b', 'hidden'])`. Preserves the intended combined journey and its expected outputs.                                     |
| B                   | Keep hidden-first order and rewrite the expected trace to exercise missing-anchor fallback. Changes the purpose of this integration case. |

**Recommendation:** A. This corrects test input without reopening anchor semantics or changing code.
**Confidence:** High. **Hardening:** Independent challenger converged; strongest counterargument
is that the braces describe membership only, which still requires explicit order before authorship.
**User Decision:** Accepted A — user chose “Accept recommendations (Recommended)” for the major batch.
**Fix status:** Verified resolved in iteration 2 after explicit “Apply and re-scan” authorization.

### PF-002: Phase 1 requires preview behavior delivered in Phase 3 🟠 MAJOR

**Dimensions:** 5, 7, 11. **Location:** `P/99-execution-plan.md:55–71,143–149`;
`P/07-testing-strategy.md:35,69,91,95`.
**Evidence:** ST-10 requires an actual marquee preview and cancellation before checking silence,
but Phase 1's green gate precedes mounted marquee integration. The current renderer and state hook
have no marquee host (`S/renderTileGrid.tsx:17–48`, `S/useTileGrid.ts:183–204`). Merely sending ignored
pointer events would prove silence without proving the promised behavior.

**Only bounded viable resolution:** Split the oracle ownership before tests are written:
committed-count/external-update cases stay in Phase 1; real preview/cancellation silence is verified
in Phase 3 with ST-34 and an observable active-preview precondition. Update task and file-map references.
Moving marquee into Phase 1 is unnecessary and disrupts the approved dependency order.

**Recommendation:** Apply that split, preserving the four phases and task count.
**Confidence:** High. **Hardening:** Independent challenger converged. An isolated announcement-hook
test can pass in Phase 1, but cannot establish the whole preview journey.
**User Decision:** Accepted the proposed phase split — user chose “Accept recommendations (Recommended)” for the major batch.
**Fix status:** Verified resolved in iteration 2 after explicit “Apply and re-scan” authorization.

### PF-003: Escape cannot reach a marquee started with external focus 🟠 MAJOR

**Dimension:** 4. **Location:** `P/03-03-marquee-integration.md:53–65,76–79`;
`P/99-execution-plan.md:145`.
**Evidence:** The controller attaches no listeners and depends on forwarded keys
(`S/marquee/createMarqueeController.ts:25–30,351–357`). Root pointer capture does not capture
keyboard events. [UI Events §3.5.6.1](https://www.w3.org/TR/uievents/#event-type-keydown) names the
focused element as the keydown target. A Chromium probe confirmed that cancelled pointerdown plus
root capture leaves an external search input focused; Escape targets that input.

| Option              | Result / trade-off                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A — Recommended** | During an accepted pending/active gesture, install an `ownerDocument` bubbling Escape listener. Respect `defaultPrevented` and nested-menu consumption, avoid duplicate root handling, and remove it on every terminal/unmount path. |
| B                   | Explicitly focus the existing active wrapper/root with `preventScroll` on accepted start. Avoids a document listener but introduces blur/focus side effects and interacts with auto-scroll focus recovery.                           |

**Recommendation:** A, plus a real-browser cancellation case starting from external focus.
**Confidence:** High. **Hardening:** Independent challenger converged after comparing both paths.
The listener is gesture-scoped within the existing host, not a new global focus service.
**User Decision:** Accepted A — user chose “Accept recommendations (Recommended)” for the major batch.
**Fix status:** Verified resolved in iteration 2 after explicit “Apply and re-scan” authorization.

### PF-004: Offscreen overscan targets may never attach another ref 🟠 MAJOR

**Dimension:** 6. **Location:** `P/03-02-navigation-and-focus.md:31–49`;
`P/00-ambiguity-register.md:105–107`.
**Evidence:** `S/virtualization/useTileGridVirtualizer.ts:24,44–74` mounts overscan and
`S/renderTileGrid.tsx:33–35` uses stable item keys. ArrowDown can target a tile outside the actual
viewport that is already mounted. Scrolling it into view will not trigger a new ref attachment,
so ref-mount-only pending completion can leave physical focus behind indefinitely.

| Option              | Result / trade-off                                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Recommended** | After scrolling, focus an already-connected registered target with `preventScroll`. Reserve pending-ref completion for absent targets. Both paths verify current navigation intent and focus ownership. |
| B                   | Resolve pending state through ref attachment and layout/scroll synchronization. Also correct, but adds more completion paths.                                                                           |

**Recommendation:** A; add an offscreen-but-mounted ST-25 case alongside the unmounted-target case.
**Confidence:** High. **Hardening:** Independent challenger converged. “Offscreen” and “unmounted”
cannot be used interchangeably in this virtualizer.
**User Decision:** Accepted A — user chose “Accept recommendations (Recommended)” for the major batch.
**Fix status:** Verified resolved in iteration 2 after explicit “Apply and re-scan” authorization.

### PF-005: Interactive empty content bypasses the single-entry lifecycle 🟠 MAJOR

**Dimensions:** 1, 4. **Location:** `P/03-02-navigation-and-focus.md:40–43,53–73`;
ST-19/ST-25 in `P/07-testing-strategy.md`.
**Evidence:** `S/TileGrid.types.ts:89–90` accepts arbitrary `renderEmpty` content, rendered outside
tile wrappers by `S/renderTileGrid.tsx:52–59`. A Retry button remains tabbable beside the fallback
root because the helper is restricted to registered tile content. Reverse entry reaches Retry,
contradicting the approved root entry. This is downstream implementation incompleteness, not a
defect in requirements AR-20/AR-21 themselves.

| Option              | Result / trade-off                                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Recommended** | Register the existing empty-content container with the same local manager, owned by the named root. Test root → eligible empty controls → outside and reverse entry. |
| B                   | Exempt empty content from wrapper-first entry. This changes the approved contract and would require exact upstream scope approval.                                   |

**Recommendation:** A. It preserves both usable Retry/Create controls and the accepted entry guarantee.
**Confidence:** High. **Hardening:** Independent challenger converged; no additional helper framework
or public prop is required.
**User Decision:** Accepted A — user chose “Accept recommendations (Recommended)” for the major batch.
**Fix status:** Verified resolved in iteration 2 after explicit “Apply and re-scan” authorization.

### PF-006: Mounted preview wiring can copy the full retained selection 🟡 MINOR

**Dimension:** 13. **Location:** `P/03-03-marquee-integration.md:8–21,34–42`.
**Evidence:** Existing `onPreview` supplies `new Set(preview)` when additive hits change;
`getPreviewSelection()` also copies the full set (`S/marquee/createMarqueeController.ts:169–190,364–365`).
A large retained offscreen/hidden selection with changing newly hit visible items therefore causes
full-set copies if the mounted host consumes either API. The plan promises bounded preview work,
but leaves this wiring implicit. No measured frame-budget failure is claimed.

| Option              | Result / trade-off                                                                                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Recommended** | Leave the host's full-set preview callback unwired; avoid its getter. Use the already-planned rectangle notification, gesture-start membership, and mounted-window intersections. Reconcile mounted-window changes too. |
| B                   | Add a bounded hit-set notification to the internal controller. Feasible, but adds an unnecessary callback surface.                                                                                                      |

**Recommendation:** A; keep standalone callback semantics and full reconciliation at release.
**User Decision:** Accepted A — user chose “Apply and re-scan (Recommended)” for the minor batch and all agreed corrections.
**Fix status:** Verified resolved in iteration 2.

### PF-007: Root borders shift marquee hit coordinates 🟡 MINOR

**Dimension:** 9. **Location:** `P/03-03-marquee-integration.md:34–47`.
**Evidence:** `S/marquee/createMarqueeController.ts:85–103` subtracts the border-box origin;
geometry measures `clientWidth` (`S/virtualization/useContainerSize.ts:31–35`) and items use
inner absolute coordinates (`S/TileGridItemView.tsx:48–52`). A Chromium probe with a 10px root
border placed a pointer 5px left of a tile at geometry x=100: current conversion gave x=105,
while inner coordinates were x=95. The wrong origin can select a tile the pointer did not reach.

**Only bounded viable resolution:** Account for `clientLeft`/`clientTop` in the conversion and
retain the scroll offset; add bordered-root hit/overlay coverage. Prohibiting borders would weaken
the existing caller-style contract without justification.
**Recommendation:** Correct the existing conversion locally and specify the regression in ST-30/ST-31.
**User Decision:** Accepted the local origin correction — user chose “Apply and re-scan (Recommended)”.
**Fix status:** Verified resolved in iteration 2.

### PF-008: Successful jsdom gestures require stateful capture simulation 🟡 MINOR

**Dimensions:** 2, 7, 13. **Location:** `P/07-testing-strategy.md:95,110–113`;
`P/03-03-marquee-integration.md:58–61`.
**Evidence:** `T/jsdomStubs.ts:90–113` supplies no-op capture/release and always-false
`hasPointerCapture`. The correctly implemented host therefore aborts every synthetic successful
gesture before preview. Cancellation tests could pass without ever entering the active state.

| Option              | Result / trade-off                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Recommended** | Use a small test-local pointer-ID-aware capture double with restoration. Assert active preview before success/cancel checks; separately force capture failure. |
| B                   | Move capture-dependent successful cases to the existing browser files and revise the unit coverage map. Avoids a double but reduces planned unit coverage.     |

**Recommendation:** A; retain real capture verification in the browser suite and preserve shared stubs.
**User Decision:** Accepted A — user chose “Apply and re-scan (Recommended)”.
**Fix status:** Verified resolved in iteration 2.

### PF-009: Native reverse Tab does not guarantee the unchecked-radio path 🟠 MAJOR

**Dimensions:** 6, 9; web domain. **Location:** `P/03-02-navigation-and-focus.md:67–73`;
`P/07-testing-strategy.md:49–50` (ST-19/ST-20).
**Evidence:** Forward entry explicitly focuses an unchecked active radio when another group member
is checked; reverse traversal is left to native progression. The pinned
[WebKit implementation](https://github.com/WebKit/WebKit/blob/67d931686f9e8cd74deeadd0da510cafd8686ba5/Source/WebCore/html/RadioInputType.cpp#L191-L210)
allows keyboard focus only for the checked member or a group with no checked member. Thus
action → Shift+Tab can skip the active unchecked radio. HTML's
[tabindex rule](https://html.spec.whatwg.org/multipage/interaction.html#the-tabindex-attribute)
permits the user agent to ignore the zero-tabindex preference for sequential focusability.
Chromium's probe passed; local WebKit execution was unavailable. The three-browser guarantee
needs an explicit path rather than assuming Chromium's behavior is universal.

**Only contract-preserving resolution:** Extend the approved helper symmetrically: Shift+Tab
from the first eligible content control explicitly reaches the owned radio. Preserve prevented
events, native radio arrows, unchanged selection, and normal exit. Extend ST-20 with the exact
forward/reverse sequence. Weakening the reverse guarantee would reopen RD-03 AC12 and is unnecessary.

**Recommendation:** Specify and test that local reverse boundary before implementation.
**Confidence:** Medium pending the browser matrix; high on the source-backed gap.
**Hardening:** Independent challenger converged. Native grouping is intentional, but the approved
contract already overrides it for forward entry and promises the reverse sequence.
**User Decision:** Accepted the explicit reverse boundary — user chose “Accept recommendations (Recommended)” for the major batch.
**Fix status:** Verified resolved in iteration 2 after explicit “Apply and re-scan” authorization.

### PF-010: Native form reset can desynchronize input state from selection 🟠 MAJOR

**Dimensions:** 4, 9; web domain. **Location:** `P/03-01-selection-and-accessibility.md:64–67,99–104`;
ST-01/ST-07 in `P/07-testing-strategy.md`.
**Evidence:** Installed React DOM `react-dom-client.development.js:1914–1920` initializes
`defaultChecked` from initial checked state, while `:1867–1874` updates controlled checked without
that default. Production has the same behavior. Fluent Radio forwards native input props in
`node_modules/.pnpm/node_modules/@fluentui/react-radio/lib/components/Radio/useRadio.js:58–75`.
The [HTML reset algorithm](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#resetting-a-form)
does not fire ordinary input events. A React/Fluent jsdom probe confirmed `{a}` → parent `{b}` →
native `form.reset()` returns the radios to checked `a` while selection remains `b`.

| Option              | Result / trade-off                                                                                                                                                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Recommended** | Through the existing owned-input ref, synchronize DOM `defaultChecked` to the same checked projection rendered by React: committed membership normally, preview during marquee. Do not pass both React `checked` and `defaultChecked` props. No new listener or conformance exception.             |
| B                   | Set native `form=""` on private selection inputs, making them ownerless. Avoids reset/submission participation and synchronization, but deliberately violates the HTML authoring requirement that an explicit `form` value identify an actual form. Requires express acceptance of that exception. |

**Recommendation:** A, with controlled/uncontrolled checkbox/radio reset tests, including reset
during preview. Selection callbacks/count announcements remain unchanged. A form-owner reset
listener was considered and dropped as larger than either option. Changing the selection store
back to its seed or adding a public reset API is outside this correction.

**Confidence:** High on the reproduced defect and bounded fixes. **Hardening:** Challenger diverged
after an additional Chromium probe proved ownerless radios still group correctly and survive reset.
The challenger prefers B's declarative ownership; the lead prefers A because existing refs suffice
and it avoids adding another conformance exception. Consumer-rendered form controls retain their
application-owned behavior in either option.
**User Decision:** Accepted A (DOM reset-default synchronization) — user chose “Accept recommendations (Recommended)” for the major batch after the challenger divergence was disclosed.
**Fix status:** Verified resolved in iteration 2 after explicit “Apply and re-scan” authorization.

### PF-011: Enclosing Fluent contexts redefine private selection controls 🟠 MAJOR

**Dimensions:** 2, 4, 13; web domain. **Location:** `P/03-01-selection-and-accessibility.md:64–75`;
`P/00-ambiguity-register.md:148–164`.
**Evidence:** Installed `@fluentui/react-checkbox/lib/components/Checkbox/useCheckbox.js:62–66,83`
merges Field defaults before generating an ID. `@fluentui/react-field/lib/contexts/useFieldControlProps.js:19–30,35–56`
supplies ID, description, required and labeling defaults. An enclosing required Field gives two
private checkboxes the same ID and makes each individually required; the probe confirmed duplicate
IDs and invalid form state with only one selected. A default Field does not always override
`aria-label`, but merely assigning unique IDs can trigger its `aria-labelledby` override.
Radio similarly inherits group defaults (`@fluentui/react-radio/lib/components/Radio/useRadio.js:40–41,58–69`).

| Option              | Result / trade-off                                                                                                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Recommended** | Wrap only the owned Checkbox with public `FieldContextProvider value={undefined}` and the owned Radio with public `RadioGroupProvider value={undefined}`. Consumer-rendered content remains outside those boundaries. |
| B                   | Override every inherited identity/validation/label/default field explicitly. More fragile: Field appends descriptions and group defaults can fall back when values are undefined.                                     |

**Recommendation:** A; add enclosing-Field/RadioGroup oracles for unique IDs, item names, eligibility,
grouping, checked state, and accidental required validation. Both exact provider names are exported
by installed `@fluentui/react-components/lib/index.js:31,49`; their types accept `undefined`.

**Confidence:** High. **Hardening:** Independent challenger converged and corrected the overly broad
label-override claim and provider name. Parent context may be intentional for application controls,
but must not silently replace this library-owned contract.
**User Decision:** Accepted A — user chose “Accept recommendations (Recommended)” for the major batch.
**Fix status:** Verified resolved in iteration 2 after explicit “Apply and re-scan” authorization.

### PF-012: Reused guard does not isolate ordinary disclosures and editable hosts 🟠 MAJOR

**Dimensions:** 4, 9, 13; web domain. **Location:** `P/03-01-selection-and-accessibility.md:40–54`;
`P/03-02-navigation-and-focus.md:87–90`.
**Evidence:** `S/selection/clickSelection.ts:4–26,56–58` omits `summary` and recognizes only
`[contenteditable="true"]`. A direct probe of the current helper returned false for summary,
empty-value editable, and plaintext-only editable targets; true for the explicit true spelling.
The [HTML summary activation rule](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-summary-element)
toggles its parent details; the [editable-state rules](https://html.spec.whatwg.org/multipage/interaction.html#attr-contenteditable)
recognize empty-string, plaintext-only, and inherited effective editability. Such clicks can
currently also select or activate the tile. Descendants of an explicit true host are already caught;
the inherited gap concerns the omitted spellings.

**Only contract-preserving resolution:** Extend the existing bounded guard for native summary and
effective editable state, including descendants of empty/plaintext-only hosts. Preserve the explicit
application marker and do not classify `contenteditable="false"` as editable merely by attribute
presence. Add interaction oracles before implementation. Requiring markers for ordinary native
controls would narrow the approved automatic-isolation contract.

**Recommendation:** Specify that extension and regression coverage in Phase 1.
**Confidence:** High. **Hardening:** Independent challenger converged and narrowed the inherited-state
claim to the cases the current `closest` selector actually misses.
**User Decision:** Accepted the bounded guard extension — user chose “Accept recommendations (Recommended)” for the major batch.
**Fix status:** Verified resolved in iteration 2 after explicit “Apply and re-scan” authorization.

### PF-013: A singleton native radio group is non-conforming author markup 🟡 MINOR

**Dimension:** 13; web domain. **Location:** `P/03-01-selection-and-accessibility.md:64–71`;
ST-07/ST-08 in `P/07-testing-strategy.md`.
**Evidence:** The [HTML radio definition](<https://html.spec.whatwg.org/multipage/input.html#radio-button-state-(type=radio)>)
states: “A tree must not contain an input element whose radio button group contains only that
element.” A single current/eligible/mounted item is allowed, so the approved real-radio composition
can meet that condition. This is an authoring-conformance limitation, not evidence of broken browser
selection, focus, or accessibility.

**Recommendation:** Explicitly accept and document the narrow singleton exception while retaining
native radio semantics. Adding synthetic hidden peers solely for cardinality is optional support
machinery and is not proposed as executable work in this strict-scope audit. Changing to a checkbox
or forbidding singleton results would violate the approved selection contract.
**Confidence:** High on the standard text. **Hardening:** Independent challenger converged on
acceptance rather than unnecessary synthetic controls. Any acceptance needs an owner and revisit
trigger: component maintainer; revisit if conformance becomes a release requirement or browser/AT
evidence shows a functional issue.
**User Decision:** Accepted Risk — user explicitly approved the singleton exception through “Apply and re-scan (Recommended)”. Owner: component maintainer. Revisit if release conformance becomes required or browser/assistive-technology evidence shows a functional issue.
**Fix status:** Exception documented in 03-01 and the Phase 4 documentation task; no synthetic controls authorized.

## Reconciled Candidates Not Retained

| Candidate                                                    | Why it is not a separate finding                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Controlled proposal ref before a new render                  | RD-01 lines 155–159 explicitly restores rejected controlled state on the next render. Pre-render proposal chaining also supports accepted batched commands. No accepted rule/test proves that the proposed alternative is required. The reporting auditor withdrew the major claim; the challenger agreed.                   |
| Every consumer descendant must transfer focus before removal | The plan's “focused entry” can mean its registered wrapper, and it already requires remembered ownership, child-change reconciliation, and removal coverage. Post-observer recovery for opaque child removal is a useful clarification, not an independently established defect. The challenger rejected the stronger claim. |

## Verification and Limitations

- `pnpm verify` passed: 57 files / 541 tests reported from Turbo cache. This verifies the current
  repository baseline, not the future RD-03 behavior.
- Required documents, local links, 47 unique pending task IDs, plan metadata, and roadmap counters
  validate. The main source hash remains fixed; report files are excluded from it.
- Chromium probes verified Escape targeting and bordered coordinates. A React/Fluent jsdom probe
  verified form-reset checked-state drift; server-rendered Field/Checkbox composition verified
  duplicate IDs and inherited `required` state. Probes created no source/test files.
- Chromium's native reverse-radio Tab probe passed. Local Firefox and WebKit executables are absent;
  cross-engine risk is source-grounded, with final matrix verification required during implementation.
- Adversarial checks challenged creator assumptions about focus events, actual native controls,
  hidden seed order, and test-phase boundaries. No optional product additions were promoted.

## Independence and Disposition

| Review                     | Session                          |
| -------------------------- | -------------------------------- |
| Document soundness         | `ses_e9f8721c1ffeYBgkl7hZsj8Nsc` |
| Codebase alignment         | `ses_e9f872137ffej3xnXSQ0g0fEDy` |
| Delivery                   | `ses_e9f872134ffecEC8IJqCsWNFRE` |
| Risk                       | `ses_e9f87200bffez5KiuyFRavMphQ` |
| Fit                        | `ses_e9f871fd3ffeEekBevYoeo3GFl` |
| Web application            | `ses_e9f871fb5ffezsBD92YEa9vGnL` |
| Data and migration         | `ses_e9f871f98ffem8eIat68VJQrq3` |
| Main finding challenge     | `ses_e9f821f8affePsz3gK8EVNdoFM` |
| Late web finding challenge | `ses_e9f81a28bfferr9MjFhu6qqvJ0` |

Two challenger contexts were used, within the skill cap; the second covered the late web batch.
Duplicate auditor findings were merged by root cause. Candidate numbers in child responses are
not the final report numbering. Rulings came from two explicit questions in this audit, not from
earlier design approvals: first all nine major recommendations were accepted; then the user
approved the three minor fixes, the scoped exception, applying the agreed edits, and the rescan.

## Iteration 2

The twelve accepted corrections were independently verified within the existing plan. Two concrete
control-composition cases extend the strategy to ST-41; all 47 implementation tasks remain pending.
The scoped requirement files did not change. The same five dimension clusters and two domain
auditors completed the bounded rescan: all thirteen dimensions, both selected domains, each fix,
and its direct consequences. **No new or reopened findings.**

| Finding | Verified closure evidence                                                                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| PF-001  | 07 ST-36 now explicitly seeds `b` first; expected memberships/counts agree.                                                                          |
| PF-002  | 07 ST-10 and 99 Phase 1 cover committed counts; actual preview/reset assertions belong to Phase 3 ST-34.                                             |
| PF-003  | 03-03 Event Ownership defines scoped document Escape and every terminal cleanup; ST-28 and task 3.2.2 verify it.                                     |
| PF-004  | 03-02 Active Target distinguishes connected overscan refs from absent targets and invalidates departed focus intent; ST-25 covers both.              |
| PF-005  | 03-02 Tab Order includes empty-content registration and root ownership; ST-25 tests Retry traversal.                                                 |
| PF-006  | 03-03 Geometry and Selection Flow avoids full preview callbacks/getters and responds to mounted-window changes; ST-31 checks the large retained set. |
| PF-007  | 03-03 uses the client-area coordinate origin; ST-30 and task 3.2.1 include bordered-root coverage.                                                   |
| PF-008  | 07 Test Data and Execution specifies local capture state/restoration and active-preview preconditions; task 3.1.1 owns it.                           |
| PF-009  | 03-02 defines symmetric owned-radio boundaries; ST-20 specifies unchanged selection and three-browser coverage.                                      |
| PF-010  | 03-01 synchronizes DOM reset defaults in the owned-input layout/ref lifecycle; ST-40 handles committed state and ST-34 actual preview.               |
| PF-011  | 03-01 names the supported undefined-context providers, limited to owned controls; ST-41 verifies both private and consumer context behavior.         |
| PF-012  | 03-01 specifies summary/effective-editability isolation; ST-06 and task 1.2.3 cover the omitted native cases.                                        |
| PF-013  | Explicitly accepted exception in 03-01 with maintainer/revisit trigger; ST-41 retains one real radio and task 4.2.3 documents it.                    |

The independent sessions listed above returned the iteration-2 dispositions in their continued
contexts. Controlled-reference and pre-removal candidates remained excluded with no new evidence.
Additional direct probes verified that the selected reset-default synchronization preserves the
current checked radio after reset, and undefined Field context yields unique IDs, item names,
non-required private checkboxes, and a valid enclosing form.

Only the index's final verdict metadata changed after the reviewed iteration-2 hash
`61a1dd6fdd2aae5ec041555839f15d3dcbd6ddc7aba33def120ee886d8af73eb`; the current content hash above
includes that metadata. Implementation and its browser matrix remain future execution obligations.
