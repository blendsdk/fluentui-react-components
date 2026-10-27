# Requirements: CollapsibleSection

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: Standalone feature; this document owns requirements (AR-1, AR-21).
> **Requirement target**: collapsible-section/REQ-CS (AR-30)

## REQ-CS — CollapsibleSection

This local requirement target groups the unchanged R1–R12 contract below. It is the target of
this standalone plan's `Implements` declaration, not a separate upstream RD.

## Feature Overview

A reusable disclosure card for application detail sections. Applications supply content and
actions; the component supplies the surface and accessible open/close interaction. The public
contract and implementation decisions live in [03-01](03-01-collapsible-section.md).

## Functional Requirements

### Must Have

| ID  | Requirement                                                                                                                            | Authority                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| R1  | Compose modern Fluent v9 Card and Accordion primitives; do not copy v8 source or build another disclosure engine.                      | AR-4                                  |
| R2  | Accept a meaningful, non-interactive rich title, arbitrary React body, and optional sibling action content.                            | AR-15, AR-16, AR-24                   |
| R3  | Support controlled and uncontrolled collapsed state with the documented precedence and boolean notification contract.                  | AR-11, AR-12, AR-24                   |
| R4  | Remove collapsed body content through Fluent's exit lifecycle and hide header actions while collapsed.                                 | AR-8, AR-9, AR-17                     |
| R5  | Render the title as a configurable real heading and preserve native disclosure activation, focus styling and expanded state.           | AR-4, AR-14                           |
| R6  | Associate each disclosure with its content using stable, instance-unique IDs; nested instances must not collide.                       | AR-24, AR-27                          |
| R7  | Preserve normal tab order and recover focus only when collapsing removes focused content owned by this instance.                       | AR-27, AR-28                          |
| R8  | Provide the accepted fixed Card treatment, header sizes, semibold typography and wrapping layout through Fluent primitives and tokens. | AR-5, AR-6, AR-7, AR-10, AR-13, AR-24 |
| R9  | Forward native root props, merge caller styles/classes, and forward the ref to the Card's div.                                         | AR-20, AR-24; house skill             |
| R10 | Export only the component and its props type from the package root.                                                                    | AR-20                                 |
| R11 | Include immutable specification tests, separate implementation tests, type/export pins, README docs and one Storybook file.            | AR-18, AR-26                          |
| R12 | Keep the component presentation-only, dependency-free beyond existing peers, and free of HTML parsing or application side effects.     | AR-22, AR-25                          |

### Should Have

None outside the must-have contract. The plan does not hide optional executable scope here.

### Won't Have (Out of Scope)

Per AR-2, AR-3, AR-9, AR-10, AR-18, AR-23 and AR-25:

- Any file change, branch, worktree, commit, test run, migration or documentation update in CastingAppMT.
- Other candidate components or an application-local CRUD framework.
- `keepMounted`, loading, appearance, disabled, custom icon, custom motion or headless disclosure APIs.
- A new runtime/dev dependency, browser/SSR suite, benchmark, context/provider, global store or test harness.
- Fetching, persistence, routing, permissions, form-engine integration, data schemas or server code.
- Release/version changes or a commit/push as part of plan creation.

## Technical Requirements

| Area          | Requirement                                                                                                                                                                                            | Authority                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Structure     | Follow the repository's shell, typed props, hook, pure render, Griffel styles and barrel anatomy. No context file is needed.                                                                           | AR-4, AR-20; house skill |
| Compatibility | Use current React 19 and Fluent umbrella 9.74.9 as the verification baseline; keep existing peer declarations unchanged. Do not imply every older 9.x release was tested.                              | AR-23, AR-25             |
| Performance   | No numeric budget or virtualization; no observers, timers or measurements beyond Fluent's existing motion.                                                                                             | AR-23                    |
| Rendering     | Use React text rendering, not string-to-HTML conversion. Caller-provided React elements and their handlers remain caller-owned.                                                                        | AR-22                    |
| Coverage      | Default standards apply: 90% core logic, 80% support logic and 60% UI/glue where those categories exist. No new CI coverage threshold/tool is added. All ST cases must pass regardless of percentages. | AR-18; coding standards  |
| Documentation | Explain defaults, precedence, content unmount/reset, title restrictions and focus behavior in JSDoc and README. Source comments contain durable rationale, not plan IDs.                               | AR-26; house skill       |

## Security Boundaries

The component does not receive untrusted HTML or generate scripts. Native root props remain
available except those whose meaning conflicts with owned content; see the exact type in
[03-01](03-01-collapsible-section.md#public-contract). It must not add logging, URL handling,
requests, credentials or storage. The security assertion treats markup-looking strings as text
(AR-22).

Server validation, SQL/shell injection, authorization, CSRF, CORS, rate limiting, TLS, encryption
and container hardening are **N/A**: no corresponding execution surface exists. They are not
grounds to add server or infrastructure machinery to this library.

## Scope Decisions

The [register](00-ambiguity-register.md) is the sole decision ledger. AR-1–AR-3 own target and
application boundaries; AR-18–AR-26 own delivery boundaries; AR-27–AR-28 own the approved
accessibility corrections. No deferred behavior is included.

## Acceptance Criteria

1. R1–R12 are proven by the [ST cases](07-testing-strategy.md#specification-test-cases),
   implementation checks and manual review described there.
2. The approved gates in [verification commands](07-testing-strategy.md#verification-commands)
   pass; a static Storybook build alone is not claimed as manual accessibility evidence.
3. No change is made in CastingAppMT, no dependency/peer surface expands, and public exports
   add only the accepted runtime symbol and props type.
4. Strict-quality phase review runs through exec-plan. Unresolved critical/major findings block
   completion; implementation never changes oracle assertions to obtain green tests.
