# app-launcher — Requirements Documents

> **Feature**: app-launcher — a byte-identical port of the VirtuoApp `react-app-launcher` family (7 Fluent UI v9 components + 9 public types) into this package, with its stories ported from the source's development workbench
> **Status**: Draft
> **Created**: 2026-10-16
> **Architecture**: React 19 + Fluent UI v9 (`@fluentui/react-components` 9.74), TypeScript, Griffel styling with design tokens, Vitest + Testing Library, Storybook 10
> **CodeOps Artifact Schema**: 1

---

## Overview

The app launcher is a Microsoft 365-style application switcher for Fluent UI v9: a waffle trigger
that opens a docked panel of application tiles and rows. The source package
(`@virtuoapp/react-app-launcher`, reviewed in full during the planning session: 7 components, 43
source files, 37 passing tests, a 269-line README and a development workbench with 5 composed
samples) was built deliberately for this move — it imports only `react`,
`@fluentui/react-components` and `@fluentui/react-icons`, ships no data and holds no application
state.

This feature ports that package into `@blendsdk/fluentui-react-components` **byte-identically**:
props, types, defaults, behavior, styles, DOM output, aria wiring and every test assertion are
frozen. Only four edit classes are permitted during the port: Prettier formatting, the three
closed comment edits (AR #8), the package-scope adaptation (AR #3) and the sample-copy
de-branding (AR #9). Any defect found while porting becomes a recorded finding — never a fix in
this feature (AR #2).

The feature also migrates the story content. The source package ships no story files; its live
reference is a development workbench with five composed samples (M365 flow, full docking stress,
trigger-anchored list, drawer toolbar, German localization). Those samples become the
`AppLauncher` Storybook story, and the remaining six components receive the variant stories the
repository's definition of done requires (AR #5, AR #10).

## Minimum-Sufficient Baseline

**Original goal:** bring the reviewed and fully tested app launcher family into this repository
under this package's scope, without changing anything it does.

**Smallest viable design:** the port itself — copy the 43 source files and 8 test files, extend
the package barrel and the export-surface pin, add the 7 story files (workbench samples plus
variants) and the README sections. Existing dependencies, patterns and test infrastructure carry
everything.

**Excluded support machinery:** no new dependencies, no configuration or build changes, no new
test harness or added test surface, no SSR smoke (the source has none), no techdocs (AR #19), no
release work, and no behavioral fixes or improvements (AR #2).

**Approved complexity:** None — no layer, dependency, harness or infrastructure surface beyond
the ported components themselves.

## Domain Lenses

| Lens                             | Selected   | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web application                  | ✅         | Browser UI components; the lens's accessibility clause (semantics, keyboard, focus, announcements) maps to the frozen tests and the story manual checklist, its UI-state clause to the disabled/empty states, and its localization clause to the prop-based text surface; the network, auth, session, caching and server clauses are N/A — the components make no requests and own no state (`references/domains/web-application.md`). |
| Library/SDK (project-type focus) | ✅ (focus) | Project-type framing per the skill's adaptation table: public npm surface — API design, additive backward compatibility, bundle behavior; the port adds exports and changes nothing existing.                                                                                                                                                                                                                                          |
| Compiler/language                | —          | No grammar, parser, IR, codec or evaluator.                                                                                                                                                                                                                                                                                                                                                                                            |
| Financial system                 | —          | No money, balances, pricing or ledger concepts.                                                                                                                                                                                                                                                                                                                                                                                        |
| Distributed/concurrent           | —          | No threads, queues, replicas or workflows; purely client-side rendering.                                                                                                                                                                                                                                                                                                                                                               |
| Data and migration               | —          | No persisted schema, serialized durable artifact or compatibility window; the new exports are purely additive (same reasoning as the confirm-dialog feature).                                                                                                                                                                                                                                                                          |

## Domain Glossary

| Term                | Definition                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source package      | VirtuoApp's `@virtuoapp/react-app-launcher` at `packages/react-app-launcher` — read-only authority for every frozen behavior in this feature.                                                                 |
| Workbench           | The source's development page (`apps/web/src/dev/app-launcher-workbench.tsx`) with the 5 composed samples and 6 hand-drawn sample logos; the material ported as stories.                                      |
| Oracle              | The ported specification tests: they encode the frozen contract and pass unmodified; a failing oracle means the port is wrong, never the test (AR #7).                                                        |
| Byte-identical port | Props, types, defaults, behavior, styles, DOM output, aria wiring and test assertions unchanged; only formatting, the 3 closed comment edits, scope adaptation and sample-copy de-branding permitted (AR #2). |
| Trigger             | The control that opens the launcher: the built-in waffle button (default) or a caller-provided element passed through the `trigger` slot.                                                                     |
| Surface / panel     | The popover surface the launcher opens; hosts whatever blocks the caller composes inside it.                                                                                                                  |
| Docking             | How tall the surface grows: `'default'` wraps its content (capped at the window bottom, scrolling internally); `'full'` extends from the anchored top edge to the window bottom.                              |
| Dock target         | The element the surface anchors to instead of the trigger (`dockTarget`), usually the application bar, so the panel docks flush with the window edge.                                                         |
| Tile / row          | The two item layouts: a tile stacks the icon above the name (in a grid); a row places the icon beside the name (in a list).                                                                                   |
| Layout context      | The internal `AppLauncherItemLayoutContext`: `AppLauncherGrid` provides `'tile'`, `AppLauncherList` provides `'row'`; items outside any container fall back to `'tile'`.                                      |
| disabledFocusable   | An item that is announced disabled (`aria-disabled`) and never activates, yet stays keyboard-reachable; distinct from native `disabled`.                                                                      |
| Export pin          | `test/package-exports.spec.test.ts` — the single test pinning the package's runtime export list and public types (AR #12).                                                                                    |

## Document Index

| #         | Document                                                            | Description                                                                                                         | Depends On |
| --------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------- |
| **AR**    | [Ambiguity Register](00-ambiguity-register.md)                      | Zero-Ambiguity Gate decisions (audit trail)                                                                         | —          |
| **RD-01** | [RD-01 — App launcher shell](RD-01-app-launcher-shell.md)           | `AppLauncher` + `AppLauncherTrigger`, ported tests, workbench-derived stories                                       | —          |
| **RD-02** | [RD-02 — App launcher content blocks](RD-02-app-launcher-blocks.md) | `AppLauncherSearch`, `AppLauncherSection`, `AppLauncherGrid`, `AppLauncherList`, `AppLauncherItem` + layout context | —          |

## Dependency Graph

    RD-01 (AppLauncher shell: AppLauncher + AppLauncherTrigger)
      │    and
      └── RD-02 (content blocks: Search, Section, Grid, List, Item + layout context)

    Both RDs are independently portable and independently testable; neither imports the other.
    They meet in composition only: the AppLauncher story samples (RD-01) render the blocks
    (RD-02), and the README quick start shows them together.

## Suggested Implementation Order

| Phase      | Documents     | Description                                                                                            |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| **A: MVP** | RD-01 → RD-02 | The complete port — sources, oracle tests, stories (workbench samples + variants), README, export pin. |

## Key Architecture Decisions

| Decision                                      | Choice                                                                | Rationale                                                                                                   | AR Ref                 |
| --------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------- |
| Port fidelity                                 | Byte-identical; findings recorded, never fixed                        | User directive: "Only port to this repo and package scope"                                                  | AR #2                  |
| Tests are the oracle                          | 8 source test files ported unchanged; only the export pin is extended | The source suite is the immutable contract; the pin is the repository's required artifact for added exports | AR #7, AR #12          |
| Two RDs (shell / blocks)                      | RD-01 `AppLauncher` + `AppLauncherTrigger`; RD-02 the five blocks     | Mirrors the existing two-layer RD split; each half is independently useful and testable                     | AR #6                  |
| Stories = workbench samples + variants        | 7 story files; the composed `AppLauncher` story carries the 5 samples | User directive to migrate the stories; the repo's definition of done adds a story per component             | AR #5, AR #10          |
| Scope adaptation                              | Code is scope-free; README and stories adopt this package's identity  | User directive: "The package scope should be modified to match the scope in this package"                   | AR #3, AR #9           |
| No new dependencies or config                 | Peer ranges, vite build and tsconfig unchanged                        | Verified: every import resolves against the installed Fluent versions; port adds nothing new                | AR #14                 |
| Manual checklist for jsdom-invisible behavior | Docking geometry, sticky search, tooltip suppression, hover lift      | jsdom has no layout engine; house precedent (`ConfirmDialog` story)                                         | AR #13                 |
| No techdocs, no release work                  | README is the documented surface; release stays manual                | User decisions                                                                                              | AR #19, AR #16, AR #17 |

## How to Use These Documents

Each requirements document is designed to be used with the make-plan skill:

1. Pick a requirements document (e.g., RD-01).
2. Run the make-plan skill.
3. The plan system uses the RD as input to create implementation plans.
4. Run the exec-plan skill for the feature.
5. Implement iteratively.
