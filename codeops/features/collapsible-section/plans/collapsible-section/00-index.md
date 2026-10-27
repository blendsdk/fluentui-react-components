# CollapsibleSection Implementation Plan

> **Feature**: `collapsible-section` — a presentation-only Fluent UI v9 disclosure card
> **Status**: Planning Complete
> **Created**: 2026-10-27
> **Implements**: collapsible-section/REQ-CS
> **CodeOps Artifact Schema**: 1

## Overview

Build one reusable `CollapsibleSection` in `@blendsdk/fluentui-react-components` using the
repository's `fluentui-components` authoring skill. The accepted contract is owned by this
standalone plan, not by an upstream RD (AR-1, AR-21). CastingAppMT supplied historical examples
only and must never be changed (AR-2).

The planning gate passed with 30 explicit decisions. This is plan creation, not implementation,
release authorization, a passed preflight, or evidence of completed browser checks. The execution
checklist is the sole mutable task-progress authority. No component code has been written.

## Minimum-Sufficient Baseline

**Original goal:** generalize the repeated collapsible detail-section pattern as a modern library
component, using the established Fluent v9 builder skill rather than porting v8 implementation.

**Smallest viable design:** compose the existing Card and Accordion primitives, with one local
state adapter, token-based layout styles, public-slot ID association, and narrowly scoped focus
recovery. Follow the existing shell/types/hook/render/styles/barrel anatomy (AR-4, AR-27, AR-28).

**Excluded machinery:** no dependency, context framework, custom disclosure engine, motion engine,
browser runner, global store, app migration, or new infrastructure (AR-3, AR-18, AR-25).

**Approved complexity:** None. Local ID/ref handling is ordinary feature code required for the
approved accessibility contract, not a generalized support subsystem.

## Planning boundaries

See the [scope contract and decisions](00-ambiguity-register.md#planning-scope-contract).
The earlier staged register remains historical at
`/home/gevik/.opencode/plan/collapsible-section/00-ambiguity-register.md`; the canonical
register in this folder owns all future decisions. No duplicate staged execution plan is created.

## Document Index

| Document                                                     | Owner of                                            |
| ------------------------------------------------------------ | --------------------------------------------------- |
| [00-ambiguity-register.md](00-ambiguity-register.md)         | User decisions and gate evidence                    |
| [01-requirements.md](01-requirements.md)                     | Standalone requirements and scope                   |
| [02-current-state.md](02-current-state.md)                   | Observed source, dependencies and risks             |
| [03-01-collapsible-section.md](03-01-collapsible-section.md) | Public contract, structure, styling and state rules |
| [07-testing-strategy.md](07-testing-strategy.md)             | Concrete specification cases and verification       |
| [99-execution-plan.md](99-execution-plan.md)                 | Ordered tasks and their execution status            |

## Quick Reference

| Topic                  | Reference                                                             |
| ---------------------- | --------------------------------------------------------------------- |
| Public API and usage   | [Component spec](03-01-collapsible-section.md#public-contract)        |
| State precedence       | [State transitions](03-01-collapsible-section.md#state-transitions)   |
| Association and focus  | [Accessibility](03-01-collapsible-section.md#accessibility-and-focus) |
| Test cases             | [ST cases](07-testing-strategy.md#specification-test-cases)           |
| Required commands      | [Verification](07-testing-strategy.md#verification-commands)          |
| Start/resume execution | [Checklist](99-execution-plan.md)                                     |

## Domain Lenses

Re-selected before decomposition using `.opencode/references/domains/selection.md`:

| Lens                         | Application to this plan                                                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web application              | Keyboard, disclosure state, focus, content lifecycle, responsive layout, localization and React text safety. Network, authentication and server behavior are not introduced. |
| Library / UI component focus | Stable public props, private internals, native pass-through, existing peer dependencies, exports, docs and Storybook.                                                        |
| Other domain lenses          | No financial calculation, persistent-data migration, parser/compiler or distributed system is introduced. Local React state does not make this a distributed feature.        |

## Phase Decomposition

One bounded implementation phase with three ordered sessions: specification tests, implementation,
then implementation tests and hardening. Task counts and progress live only in
[99-execution-plan.md](99-execution-plan.md).

## Specialist Agents

**None** — a standing specialist would repeat the existing skill and dynamic review packet.
The single-phase work has no unique recurring protocol or domain knowledge outside those sources.

Detection evidence: `skills/fluentui-components/SKILL.md:48-60` defines the anatomy;
`skills/fluentui-components/references/accessibility.md:9-29` and `:62-64` cover semantics and
focus; `packages/react-components/test/package-exports.spec.test.ts:51-85` pins the surface.
The reviewer/auditor quality roles can receive this plan plus the installed primitive evidence
recorded in [02-current-state.md](02-current-state.md). No new agent is proposed or required.

Focus review findings recur in the loading, confirm-dialog and tile-grid ledgers, but do not
establish a packet-resistant capability gap: `loading/plans/loading/05-findings.md:12,25-26`,
`confirm-dialog/plans/confirm-dialog/05-findings.md:11,20`, and
`tile-grid/plans/rd-03/05-findings.md:6-7` (paths relative to `codeops/features/`). The existing
accessibility guidance and explicit focus/no-steal cases carry the required context. This new
unexecuted plan has no findings ledger yet; no ledger is fabricated for the check.

## Related Files

All implementation paths below are relative to `packages/react-components/`:

| Path                                                   | Planned change                             |
| ------------------------------------------------------ | ------------------------------------------ |
| `src/components/CollapsibleSection/`                   | New component anatomy and one stories file |
| `src/index.ts`                                         | Component and props type exports only      |
| `test/collapsible-section.spec.test.tsx`               | Behavioral oracle                          |
| `test/collapsible-section-accessibility.spec.test.tsx` | Accessibility and native-prop oracle       |
| `test/collapsible-section.impl.test.tsx`               | Private structure/style tests              |
| `test/package-exports.spec.test.ts`                    | Additive export and type pins              |
| `README.md`                                            | Component contract and examples            |

## Readiness

All required plan documents exist, the register has no open material decisions, and specification
tests precede implementation. `Implements: collapsible-section/REQ-CS` identifies the plan-local
requirements in [01-requirements.md](01-requirements.md#req-cs--collapsiblesection) (AR-30).
There is no fabricated `RD-01` or attachment to a sibling roadmap row. Preflight is the recommended
next workflow; execution still enforces the repository quality policy.

Per AR-29, the feature and portfolio roadmaps explicitly link this standalone plan. Their progress
uses the roadmap engine's `n/a` convention instead of inventing RD counts. The execution checklist
owns task progress; the portfolio's computed feature fraction excludes hand-maintained standalone
rows and labels that limitation.
