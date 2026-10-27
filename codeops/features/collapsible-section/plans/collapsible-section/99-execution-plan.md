# Execution Plan: CollapsibleSection

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-10-27 14:11
> **Progress**: 0/15 tasks (0%)
> **CodeOps Artifact Schema**: 1

## Overview

Implement the confirmed standalone plan only. Use the `fluentui-components` and `fluentui` skills
and the current installed primitive contracts. The task paths below are relative to
`packages/react-components/`, unless explicitly prefixed otherwise. CastingAppMT must never be
changed or used as an execution workspace (AR-2).

**Update this document after EACH completed task.** Plan creation leaves every task unchecked.
This document is the sole mutable task-progress authority; no second progress store is created.

## Implementation Phases

| Phase | Title                                   | Tasks | Sessions                                         |
| ----- | --------------------------------------- | ----- | ------------------------------------------------ |
| 1     | Disclosure card and package integration | 15    | Specification tests → implementation → hardening |

**Total: 15 tasks across one phase and three ordered sessions.** No fabricated time estimate.

> **Execution rule:** Each task appears once in the list below. On implementation, mark `[~]`
> and append `⏳ (implemented: YYYY-MM-DD HH:MM)`. After its verification passes, promote to `[x]`
> and append `✅ (completed: YYYY-MM-DD HH:MM)`. Update the Progress and Last Updated headers
> after every task; only `[x]` counts complete. Resume the first `[~]`, otherwise the first `[ ]`.
> Mark blockers `[!]` with `Blocked: <reason>` on the task line. Timestamps come from
> `date '+%Y-%m-%d %H:%M'`, never invented values. Red-phase tasks are verified by expected failure,
> not by weakening tests or introducing implementation early. The feature is not complete until
> the full final gates pass.

## Phase 1: Disclosure Card and Package Integration

> **Phase baseline tree**: Recorded by exec-plan before source changes, including committed,
> staged, unstaged and untracked phase-start state.
> **Lenses**: Public API · accessibility/focus · state/lifecycle · React text safety
> **Reasoning**: medium — bounded UI composition using existing primitives and a confirmed contract

### Session 1.1: Specification Tests

**Reference:** [07 testing strategy](07-testing-strategy.md#specification-test-cases), R1–R12,
AR-18–AR-20. The spec author receives these ST rows and the public contract, not implementation.
An active quality profile dispatches its spec-author role; missing agents do not weaken the gate.

- [ ] 1.1.1 [spec-author] Write ST-1–ST-13 behavioral tests — `test/collapsible-section.spec.test.tsx`; verify the authored cases match the stated inputs/outputs.
- [ ] 1.1.2 [spec-author] Write ST-14–ST-24 accessibility/native-prop/security tests — `test/collapsible-section-accessibility.spec.test.tsx`; review focused-collapse and no-steal cases against 03-01 Accessibility and focus.
- [ ] 1.1.3 [spec-author] Add ST-25–ST-26 export and type pins — `test/package-exports.spec.test.ts`; retain every previous surface expectation, allowing only the approved additive symbol/type.
- [ ] 1.1.4 Run targeted specs and type-check; record expected red from the missing component/type in this document. Distinguish that expected failure from unrelated environment or setup failures; do not write implementation to hide a setup defect.

**Verify:** Red-phase evidence from the commands in 07 Verification commands; each test file
must encode the stated contract independently. An absent export is an expected initial failure;
tests that already pass require a documented explanation.

### Session 1.2: Implementation

**Reference:** [03-01 component specification](03-01-collapsible-section.md); AR-4–AR-17,
AR-20, AR-22–AR-25, AR-27–AR-28. All source entities get durable JSDoc; no plan IDs in code.

- [ ] 1.2.1 Define public props and token-based styles — `src/components/CollapsibleSection/CollapsibleSection.types.ts`, `src/components/CollapsibleSection/useCollapsibleSectionStyles.styles.ts`; inspect native-prop omissions and minimal surface styling against 03-01 Public contract / Styling.
- [ ] 1.2.2 Implement the state hook — `src/components/CollapsibleSection/useCollapsibleSection.ts`; cover 03-01 State transitions / Accessibility and focus using local refs/IDs and typed mappings, without a shared focus subsystem.
- [ ] 1.2.3 Compose the pure renderer, forwardRef shell and folder barrel — `src/components/CollapsibleSection/renderCollapsibleSection.tsx`, `src/components/CollapsibleSection/CollapsibleSection.tsx`, `src/components/CollapsibleSection/index.ts`; verify 03-01 Composition and owned-prop precedence.
- [ ] 1.2.4 Add the approved public component/props exports — `src/index.ts`; validate against ST-25–ST-26, with no wildcard/private exports or manifest changes.
- [ ] 1.2.5 Run targeted specifications, package export test and type-check to green; fix implementation only, preserve the oracle, and record results in this document.

**Verify:** Targeted specs, export pins and type-check per 07 Verification commands. If a spec
fails, fix source; a contradiction in the approved contract is a blocker requiring a ruling.

### Session 1.3: Implementation Tests and Hardening

**Reference:** [07 implementation/manual checks](07-testing-strategy.md#test-categories),
03-01 Tests and Documentation, AR-18–AR-20, AR-22, AR-26–AR-28.

- [ ] 1.3.1 Write implementation tests — `test/collapsible-section.impl.test.tsx`; cover the private structure/style/ref checks in 07 Implementation Tests using real primitives, then run the component tests.
- [ ] 1.3.2 Add all required variants and manual checklist — `src/components/CollapsibleSection/stories/CollapsibleSection.stories.tsx`; use the existing provider and run package type-check.
- [ ] 1.3.3 Document the full props contract and composition — `README.md`; include examples, title/action accessibility, localization, header-versus-Card size, controlled ownership and body-state reset; validate examples against type pins.
- [ ] 1.3.4 Format only intended changes and run `pnpm verify` plus `pnpm storybook:build` at the repository root; record actual exit results and report unrelated failures without broad cleanup.
- [ ] 1.3.5 Complete and record the Storybook manual checks from 07 Browser and E2E, including native keyboard, focus recovery/no-steal, narrow layout, themes and reduced motion. If access is unavailable, leave this task blocked rather than claiming a build proves it.
- [ ] 1.3.6 Run the exec-plan phase quality loop (independent reviewer plus auditor), obtain authorized rulings for critical/major findings, apply approved in-scope fixes, and rerun the full gates after fixes. Record findings through exec-plan and update this checklist only after verification.

**Verify:** `pnpm verify` and `pnpm storybook:build`, actual manual evidence, and strict-quality
review according to root `codeops/codeops.json`. The independent quality loop is not replaced by
the absence of a specialist. Commit behavior comes from the chosen exec-plan mode and the
git-commit skill, not raw commands in this plan.

## Dependencies

Session 1.1 must finish before 1.2; 1.2 must be green before 1.3. Within a session, follow the
listed order. Types/styles support the hook; hook plus types/styles support render/shell; package
exports make the runtime/type oracle green. Docs/stories never substitute for contract tests.

No sibling feature or application migration is a prerequisite. Existing installed peers and
test/build tools are the entire external dependency surface.

## Success Criteria

Completion requires all tasks verified, all requirements met through the owning ST/manual
evidence, no unresolved critical/major review findings, no dead exports/source, documented
public APIs, and unchanged peer/dependency boundaries. Server security and infrastructure checks
remain N/A as specified in 01 Security Boundaries. No CastingAppMT operation is authorized.

Roadmaps, when linked with user authorization, are derived summaries only. A future execution
updates this checklist first; do not mark an RD delivered when this standalone plan declares none.
