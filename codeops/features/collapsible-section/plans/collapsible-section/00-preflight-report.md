# Preflight Report: CollapsibleSection

> **Status**: ✅ PREFLIGHT PASSED — all 2 findings resolved
> **Iteration**: 2 — bounded re-scan after authorized fixes
> **Previous Iteration**: 2 findings — 1 major, 1 minor
> **This Iteration**: 0 new findings; PF-001 and PF-002 verified resolved at plan level
> **Carried Forward**: None
> **Artifact**: Full implementation plan at `codeops/features/collapsible-section/plans/collapsible-section/`
> **CodeOps Artifact Schema**: 1
> **Last Updated**: 2026-10-28
> **Scan-start HEAD**: `eccd531195687e732dd9cf8da89b3811e6e8d908`

> **Same-session corrections:** This session applied the two authorized corrections. The original
> plan was authored before this session; six independent review clusters checked the revised
> target. This is plan-level evidence, not implementation or browser verification.

## Scope and authority

| Boundary                | Contract                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit target            | The seven original documents listed in the revision table below. This report and continuity notes are excluded from the target hash.                                                                                                                          |
| Context only            | Root guidance, manifests, component source, tests, skills, installed Fluent source, Storybook configuration, feature/portfolio roadmaps and read-only CodeOps parser. No sibling artifact receives a verdict.                                                 |
| Product baseline        | One presentation-only Card/Accordion disclosure component with local state, styles, stable IDs and conditional focus recovery; existing dependencies, tests, README and one stories file. AR-1–AR-30 govern.                                                  |
| Scope mode              | Strict. No optional additions, new infrastructure, browser/SSR suite, dependency, app migration or CastingAppMT access.                                                                                                                                       |
| Modification permission | User said “proceed” after the request to apply PF-001/PF-002 and re-scan. This authorizes the two in-plan corrections, report updates and passing-stage bookkeeping, not implementation.                                                                      |
| Commit permission       | Continuing local `--auto-commit`, no push. After the user selected “Include plan (Recommended)”, include the complete corrected feature plan, report and related feature/portfolio roadmaps. Leave `codeops/specialist-check.json` untouched and uncommitted. |
| Design authority        | Auto-design policy 1; root invocation `preflight-collapsible-section-20261028`. Eligible technical resolutions may be selected, not silently applied. Product/acceptance changes and risk waivers remain user-owned.                                          |

## Iteration 1 audited revision

The plan was untracked at scan start, so SHA-256 content hashes identify the reviewed revision.
Any later change requires a targeted re-check before this report can be used as readiness evidence.

| Document                       | SHA-256                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| `00-ambiguity-register.md`     | `0137faf666e0fbb457fa81ac02678653eebc887f5aba0f12678342f25b9c72b0` |
| `00-index.md`                  | `921afc3067f753f40ff3cf3eb200c1560d1fd30fc83d6ff87ccdda0b6e0a4f91` |
| `01-requirements.md`           | `08c78be7300ab4d5c67bde937431f05f44a80107df52da311b81c43bf5dc251a` |
| `02-current-state.md`          | `3a7d58b8565542396274d9e7392769e58b9dd22562c798a151f4f9118f305908` |
| `03-01-collapsible-section.md` | `a001703c316c63a6d69242efda845a15a2860123ce8a9823163b62522c483d42` |
| `07-testing-strategy.md`       | `cfb7010c7bb862d4e4d3d15d5b1b188c0bfe12085073386123bb85447dcd5aba` |
| `99-execution-plan.md`         | `f3806d8324bbda38ef2647915ded48fea3174b752129c7405fec11d00eb5345c` |

## Current audited revision — iteration 2

Both correction files were formatted before recording these hashes. The other five original
documents are unchanged. This is the revision covered by the passing verdict; the earlier table
remains historical evidence for the original findings.

| Document                       | SHA-256                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| `00-ambiguity-register.md`     | `0137faf666e0fbb457fa81ac02678653eebc887f5aba0f12678342f25b9c72b0` |
| `00-index.md`                  | `921afc3067f753f40ff3cf3eb200c1560d1fd30fc83d6ff87ccdda0b6e0a4f91` |
| `01-requirements.md`           | `08c78be7300ab4d5c67bde937431f05f44a80107df52da311b81c43bf5dc251a` |
| `02-current-state.md`          | `3a7d58b8565542396274d9e7392769e58b9dd22562c798a151f4f9118f305908` |
| `03-01-collapsible-section.md` | `9a0cbbdde3a6ee9e9419b64ef93e34cb691c9f1f889c274723ed549fc0252dcc` |
| `07-testing-strategy.md`       | `3581d4aaeedd693c8c9766e8300d7c0c6fa09515c09916dfb685145593d793ad` |
| `99-execution-plan.md`         | `f3806d8324bbda38ef2647915ded48fea3174b752129c7405fec11d00eb5345c` |

## Codebase context summary

| Area                | Observed evidence                                                                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack and gates     | React 19, Fluent umbrella 9.74.9, TypeScript, Griffel, Vitest/jsdom and Storybook; Node 22+ and pinned pnpm 12.11.2. `package.json:8–12,23–31`; `packages/react-components/package.json:40–84`.                                                           |
| Architecture        | Explicit package-root exports and shell/types/hook/render/styles/barrel anatomy. `packages/react-components/src/index.ts:12–90`; `src/components/DescriptionList/DescriptionList.tsx:1–4,22–26` relative to that package. No existing CollapsibleSection. |
| State precedent     | Controlled value wins over internal mirror; `packages/react-components/src/components/AppLauncher/useAppLauncher.ts:102–109`.                                                                                                                             |
| Test integration    | Exact sorted export oracle, compile-time pins and existing test/TypeScript inclusion: `packages/react-components/test/package-exports.spec.test.ts:51–85,249–266`; `vitest.config.ts:15–25`; `tsconfig.json:6–9` relative to that package.                |
| Primitive semantics | Installed Accordion 9.12.4 owns native button toggling, expanded state, inert panel and exit unmount. It supplies neither IDs nor focus recovery. Card 9.7.3 requires explicit `focusMode="off"` to avoid root-event-induced focus grouping.              |
| House accessibility | `skills/fluentui-components/references/accessibility.md:9–29,52–64,88–102`: semantic elements, native keyboard behavior, local focus recovery and no new story accessibility violations.                                                                  |
| Manual evidence     | Existing Storybook FluentProvider decorator: `packages/react-components/.storybook/preview.tsx:10–17`. No feature browser checks have run because the component does not exist.                                                                           |

### Deterministic checks

| Check                           | Result                                                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Required document set           | All seven documents exist; 70 headings reviewed.                                                                                    |
| Relative links and anchors      | All 33 local Markdown links resolve. Historical absolute paths in prose are provenance, not runtime dependencies.                   |
| Ambiguity register              | 30 resolved decisions; AR-30 explicitly supersedes AR-21 metadata only.                                                             |
| Specification-first ordering    | Specification tests and expected red precede implementation; implementation green precedes hardening.                               |
| Read-only installed plan parser | `Ready`; valid `collapsible-section/REQ-CS`; 0/15 verified tasks; no structural problems. This does not override semantic findings. |

### Domain lenses and independent coverage

| Cluster                      | Coverage                                                                                            | Reviewer session                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------- |
| Document soundness           | Dimensions 1, 3, 12                                                                                 | `ses_e805c43d1ffe7n2sZtZsrf1L4n` |
| Grounding                    | Dimensions 2, 13, including all ten alignment subchecks                                             | `ses_e805c0b48ffeEfxParAJKagTXq` |
| Delivery                     | Dimensions 4, 5, 11                                                                                 | `ses_e805bd910ffecVA5tgcnxG4E7N` |
| Risk                         | Dimensions 6, 8, 9                                                                                  | `ses_e805ba3feffef5nWfrQqungYSy` |
| Fit                          | Dimensions 7, 10                                                                                    | `ses_e805b7803fferLtyU2CFZEl9mv` |
| Web application lens         | UI states, semantics, keyboard/focus, motion, responsive layout, localization and React text safety | `ses_e805b4500ffeuchAru8Axh9Zb5` |
| Blind independent challenger | Both findings, viable alternatives, severity and delegated-authority boundaries                     | `ses_e8057ec48ffeVqdkKBxVO13s0J` |

The web lens is applicable and selected in the plan. Server/auth/network/storage checks are
not applicable: no corresponding surface is introduced. The change is additive; old exports and
peer declarations remain unchanged. No serialized format, persisted-state transition, mixed-version
migration, financial calculation, compiler or distributed system is introduced.

## Summary by dimension

Counts retain each original unique root cause at its primary dimension; both are now resolved.
Iteration 2 re-scanned all dimensions within the unchanged target and found no new issues.

| #   | Dimension               | Findings | Highest severity                  |
| --- | ----------------------- | -------- | --------------------------------- |
| 1   | Ambiguities             | 0        | —                                 |
| 2   | Implicit assumptions    | 0        | Related: PF-002                   |
| 3   | Logical contradictions  | 1        | 🟡 MINOR — PF-002                 |
| 4   | Completeness gaps       | 0        | —                                 |
| 5   | Dependency issues       | 0        | —                                 |
| 6   | Feasibility concerns    | 0        | Related: PF-002                   |
| 7   | Testability             | 0        | —                                 |
| 8   | Security blind spots    | 0        | —                                 |
| 9   | Edge cases              | 0        | —                                 |
| 10  | Scope creep indicators  | 0        | No material complexity escalation |
| 11  | Ordering and sequencing | 0        | —                                 |
| 12  | Consistency             | 0        | —                                 |
| 13  | Codebase alignment      | 1        | 🟠 MAJOR; related: PF-002         |

## Summary by severity

| Severity       | Count | Status                                                    |
| -------------- | ----- | --------------------------------------------------------- |
| 🔴 CRITICAL    | 0     | —                                                         |
| 🟠 MAJOR       | 1     | PF-001 resolved and independently rechecked at plan level |
| 🟡 MINOR       | 1     | PF-002 resolved and independently rechecked at plan level |
| 🔵 OBSERVATION | 0     | —                                                         |

## Findings

### PF-001: Panel label is prohibited on its generic container — 🟠 MAJOR

**Dimension:** 13 — codebase alignment; web accessibility lens.

**Location:** `03-01-collapsible-section.md:104–111,154–157` and the immutable expectation in
`07-testing-strategy.md:39` (ST-16).

**Codebase evidence:** Installed `@fluentui/react-accordion` 9.12.4,
`lib/components/AccordionPanel/useAccordionPanel.js:46–65`, renders a plain `div` and supplies
no semantic role. The plan requires `aria-labelledby` on that generic element while saying no
custom role is required. An attribute-only oracle would preserve invalid semantics.

**Standard evidence:** [WAI-ARIA 1.2, generic role](https://www.w3.org/TR/wai-aria-1.2/#generic)
lists `aria-label` and `aria-labelledby` under **Prohibited States and Properties**, with
**Name From: prohibited**. Its text permits a semantic container such as `group` for a named
collection. The [group role](https://www.w3.org/TR/wai-aria-1.2/#group) supports naming from the
author and is not included in a page summary. The [APG Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)
makes a named region optional; it does not authorize naming a generic `div`.

| Option | Correction                                                                                          | Trade-off                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A      | Give the mounted AccordionPanel `role="group"` and retain its label; ST-16 asserts the named group. | Preserves approved panel labeling, stable control host and no-landmark design; introduces no public prop or machinery. |
| B      | Put a named group on the persistent content host and leave the panel unlabeled/generic.             | Valid semantics, but moves label ownership and retains a named empty group while closed unless additionally managed.   |

`role="region"` would add landmarks contrary to the stated treatment. Removing panel labeling
is valid for a simpler disclosure but would relax the plan's named-panel expectation. AR-27
approves ID association without spelling out every reverse-label detail; that is not itself proof
that a controls-only design is invalid. It is nevertheless not the like-for-like correction here.

**Recommendation:** Option A — preserve the existing named-content intent with a role that
permits naming and follows the panel's existing inert/unmount lifecycle. Adjust the composition,
association text and ST-16 before oracle authoring. No new task or public surface is needed.

**Decision:** Authority: AI — delegated by `--auto-design`.

| Provenance                       | Record                                                                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eligibility                      | Internal accessibility mechanism supporting R6 and the existing panel-label contract; no product expansion, landmark, dependency or public compatibility change. |
| Objective                        | Valid named content and stable disclosure association for multiple/nested sections.                                                                              |
| Decision                         | Option A: mounted panel is a named group; persistent control host remains unchanged.                                                                             |
| Evidence                         | Installed panel hook and WAI-ARIA generic/group definitions cited above; ST-16 currently checks only attributes.                                                 |
| Rejected alternatives            | Named persistent host adds empty-group lifecycle concerns; region adds landmarks; removing labels changes the intended acceptance contract.                      |
| Strongest counterargument        | A named group adds announcement verbosity inside Card's existing group; controls-only can be sufficient for a simpler disclosure.                                |
| Confidence                       | High; reopen if assistive-technology evidence shows harmful duplicate announcements or the named-panel contract is explicitly revised.                           |
| Hardening                        | Forced reframing found no benefit from larger machinery. Blind challenger converged on A and Major severity.                                                     |
| Policy version / root invocation | 1 / `preflight-collapsible-section-20261028`                                                                                                                     |
| Reopen triggers                  | Installed panel gains native role/association behavior, or approved panel naming/landmark policy changes.                                                        |

**Iteration 1 application state:** Resolution selected, not fixed; audit blocked pending permission.

**Iteration 2 application state:** User authorized both corrections with “proceed”. Composition
and association text now require a named mounted panel group; ST-16 checks the role and
accessible name, and the persistent host remains generic after exit. **Resolved at plan level.**

**Iteration 2 evidence:** `03-01-collapsible-section.md:104–114,156–161` and
`07-testing-strategy.md:39` agree on role, name and lifecycle. Grounding, risk, soundness,
delivery, fit and web reviewers confirmed the correction without a new finding. Installed native
panel props preserve inert/unmount handling. No running component is claimed to be verified.

### PF-002: Reduced-motion acceptance and fixed default motion conflict — 🟡 MINOR

**Dimension:** 3 — logical contradictions; related dimensions 2, 6 and 13, web lens.

**Location:** `03-01-collapsible-section.md:204–206` versus
`07-testing-strategy.md:98`; related AR-17 and execution task 1.3.5.

**Codebase evidence:** Installed `@fluentui/react-accordion` 9.12.4,
`lib/components/AccordionHeader/useAccordionHeader.js:28–35`, assigns the SVG an unconditional
inline transform transition. Installed `@fluentui/react-motion` 9.16.4,
`lib/motions/motionTokens.js:4–8,28–30`, fixes the normal duration at 200 ms. In contrast,
`lib/factories/createPresenceComponent.js:99–110` passes reduced-motion preference into panel
animation. The default composition cannot demonstrate the chevron expectation as written.

This is a contract mismatch, not a claim that the inherited transition alone violates WCAG.
Three independent clusters found the same root cause; it is counted once.

| Option | Correction                                                                                                                                      | Trade-off / authority                                                                                                                                        |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A      | Preserve Fluent defaults; verify panel reduction and explicitly record the inherited chevron limitation in the manual expected result and docs. | Smallest default-preserving change, but relaxes the written acceptance expectation; user ruling required.                                                    |
| B      | Specify a narrowly scoped reduced-motion-only correction for the chevron, retaining default motion otherwise.                                   | Preserves the preference-handling expectation. Clarifies the overbroad default-motion wording; must affect the inner SVG transition, not merely its wrapper. |

Neither option requires a dependency, motion engine, new public API or new browser suite.

**Recommendation:** Option B — retain the manual preference-handling expectation and clarify the
specification's default-motion rule with this bounded exception. Under
`prefers-reduced-motion: reduce`, suppress only the Fluent chevron SVG transition through
component-local styling; normal rotation states and ordinary Fluent motion remain unchanged.
A wrapper-only transition rule cannot override the SVG's inline declaration. A tightly scoped
override that wins over that declaration (for example `transition: none !important` in the media
query) must be verified in the existing manual Storybook check. Do not add custom durations,
an animation engine, a global stylesheet or new automated browser tests.

**Decision:** Authority: AI — delegated by `--auto-design`.

| Provenance                       | Record                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eligibility                      | Internal styling mechanism to satisfy an already written reduced-motion expectation. AR-17 approves Fluent collapse motion and a reduced-motion check, not unconditional preservation of the upstream chevron transition under every preference. No scope/acceptance expansion or risk waiver.                             |
| Objective                        | Meet the existing manual reduced-motion check while keeping normal Fluent disclosure behavior and no custom motion API.                                                                                                                                                                                                    |
| Decision                         | Option B: preference-only chevron transition suppression; panel remains owned by Fluent. Update the specification and manual expected result consistently before implementation.                                                                                                                                           |
| Evidence                         | Header SVG inline transition and panel reduced-motion handling cited above; AR-17 at `00-ambiguity-register.md:40`, contrasted with the specification's broader default-motion wording.                                                                                                                                    |
| Rejected alternatives            | Merely documenting the limitation would relax acceptance and requires user risk authority; changing only the wrapper transition does not affect the inner SVG; replacing the icon or motion engine is disproportionate.                                                                                                    |
| Strongest counterargument        | The rule couples to Fluent's SVG markup and overrides inherited styling; a strict all-preferences reading of the default-motion constraint would instead require user priority resolution.                                                                                                                                 |
| Confidence                       | High on the discrepancy and bounded mechanism; the actual browser result remains unverified until execution. Reopen rather than assume if approved intent requires unchanged motion under every preference.                                                                                                                |
| Hardening                        | Grounding/risk auditors preferred documenting the limitation. Blind challenger instead selected B after checking AR-17's narrower wording. Lead revised the initial default-preserving recommendation to B because A would waive the current acceptance expectation. Challenger converged with the final technical ruling. |
| Severity calibration             | Minor: a small inherited chevron transition and contradictory manual expectation, not broken disclosure operation or an established WCAG failure. The web review's Major rating was not retained; grounding, risk and challenger support Minor.                                                                            |
| Policy version / root invocation | 1 / `preflight-collapsible-section-20261028`                                                                                                                                                                                                                                                                               |
| Reopen triggers                  | Fluent changes the SVG/transition implementation, browser evidence disproves suppression, or the user confirms unchanged upstream motion is required under every preference.                                                                                                                                               |

**Iteration 1 application state:** Resolution selected, not fixed; no risk waiver inferred.

**Iteration 2 application state:** User authorized both corrections with “proceed”. The
specification now permits only the preference-scoped SVG transition override through the public
expand-icon slot. The manual check explicitly distinguishes ordinary/reduced motion and excludes
caller SVGs. No default-motion or acceptance waiver was used. **Resolved at plan level.**

**Iteration 2 evidence:** `03-01-collapsible-section.md:208–220` and
`07-testing-strategy.md:98` define ordinary and preference-specific behavior consistently.
Grounding checked public slot class merging, the default icon's direct SVG root, separate caller
title content, and Griffel selector/media-rule support. All review clusters found no residual
contract defect. Actual computed transition and visible panel checks remain execution task 1.3.5.

## Verification and disposition

| Check                                          | Result                                                                                                                                                                                              |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline and corrected-plan `pnpm verify`      | Both exit 0; 77 test files / 872 tests passed through Turbo cache. Node 24.21.0 and pnpm were available after explicitly extending PATH. Existing Keyborg teardown warnings did not fail the suite. |
| Feature implementation/manual browser evidence | Not run; no component code exists. These remain execution tasks, not preflight evidence.                                                                                                            |
| Same-session authorship                        | Original plan predates this session; the two same-session corrections received independent cluster rechecks. Direct standard text remains cited above.                                              |
| Adversarial checks                             | Rechecked assumptions about primitive semantics and motion rather than trusting the planning register; these produced PF-001 and PF-002. No optional feature proposals were promoted into findings. |
| Iteration 2 static validation                  | All seven documents, all 33 local Markdown links/anchors and the unchanged specification-first 15-task sequence checked. Read-only plan parser reports Ready with no structural problems.           |
| Roadmap                                        | Only this feature's plan advanced to Plan Preflighted and cascaded on main. Counter engine preserved standalone n/a; unrelated stages unchanged. Implementation remains 0/15 verified.              |

## Disposition history

| Iteration | Disposition                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1         | Blocked: 1 major unresolved; 1 minor also not applied. No roadmap advancement. Report committed as `f8fe489`.                                                                        |
| 2         | Passed: both corrections authorized, applied and independently rechecked across all 13 dimensions and the web lens. Zero new findings; no remaining accepted risks or open findings. |

## Final disposition

**✅ PREFLIGHT PASSED — all 2 findings resolved.** This is not a clean first-scan claim: the
original findings and decisions remain above. The passing target is the complete plan at the
iteration-2 hashes. No component code or tests were written; runtime/manual evidence is still
required during execution.

| Next action                                                                                                  | Owner |
| ------------------------------------------------------------------------------------------------------------ | ----- |
| Start `exec-plan collapsible-section` when ready; the first task authors the behavioral specification tests. | User  |
