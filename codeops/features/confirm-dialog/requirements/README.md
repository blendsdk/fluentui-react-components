# confirm-dialog — Requirements Documents

> **Feature**: confirm-dialog — a reusable Fluent UI v9 confirm prompt pair: a controlled `ConfirmDialog` and a `ConfirmProvider` + `useConfirm()` DX layer
> **Status**: Draft
> **Created**: 2026-10-16
> **Architecture**: React 19 + Fluent UI v9 (`@fluentui/react-components` 9.74), TypeScript, Griffel styling with design tokens, Vitest + Testing Library
> **CodeOps Artifact Schema**: 1

---

## Overview

`ConfirmDialog` is the prompt a consuming application shows before a consequential user action
runs: a title, a message, and a fixed set of actions — with the affirmative action emphasized
differently depending on who severe the decision is. The component is fully controlled: the host
owns `open`, receives the chosen outcome through `onResolve`, and performs the follow-up work
itself.

The design rebuilds the `ConfirmDialog` of CastingAppMT's `fui8` package (Fluent UI v8) from a
full functional analysis of its 25 call sites — and rejects every one of its mechanisms. The
whole-dialog red palette swap becomes a targeted danger token recipe on the one flagged action;
the `dangerouslySetInnerHTML` message becomes typed `ReactNode` content (0 of the 55 legacy dialog
strings contained HTML); the `setTimeout`-based double-click guard becomes a real `busy` state;
and the vestigial `actions`/`justifyActions`/`children` props are replaced by a typed action array
that serves both layers with literal-typed outcomes. The platform decision is deliberate and
hard: everything is Fluent UI v9 — no v8 compatibility, no fallback branch.

RD-02 adds the DX layer the legacy application never had: a `ConfirmProvider` mounted once at the
app root plus a promise-based `useConfirm()`. Instead of state flags, handlers and dialog JSX per
call site, an application writes
`if (await confirm({ intent: 'danger', title, message })) { deleteRecord(); }`. The provider
renders at most one dialog, is invisible while idle, never rejects a promise, and follows the
repository's `SystemErrorProvider` pattern and Fluent's own `Toaster`/`useToastController`
precedent.

## Minimum-Sufficient Baseline

**Original goal:** bring the confirm-prompt experience of the legacy `fui8` `ConfirmDialog` —
easy two-way decisions with context-driven button emphasis — to this repository as first-class
Fluent UI v9 components with maximum DX.

**Smallest viable design:** RD-01 — one controlled `ConfirmDialog` with the pair contract, the
`confirmation`/`danger` intents, a typed custom-action array, `busy`, and full v9 accessibility
mechanics; RD-02 — one `ConfirmProvider` + `useConfirm()` holding a single request and resolving a
promise. Both built with the repository's existing component pattern and existing dependencies.

**Excluded support machinery:** a global confirm singleton, prompt queueing, hold-open busy mode,
dialog header glyphs, an i18n framework, forms or custom dialog bodies, v8 compatibility, and any
new dependency.

**Approved complexity:** None — no layer, dependency, harness or infrastructure surface beyond
the two components.

## Domain Lenses

| Lens                   | Selected | Evidence                                                                                                                                                    |
| ---------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web application        | ✅       | Browser UI components; accessibility, keyboard and focus requirements; localization via props; SSR-safe provider (`references/domains/web-application.md`). |
| Compiler/language      | —        | No grammar, parser, IR, codec or evaluator.                                                                                                                 |
| Financial system       | —        | No money, balances, pricing or ledger concepts.                                                                                                             |
| Distributed/concurrent | —        | No threads, queues, replicas or workflows; a single in-memory request record in the provider.                                                               |
| Data and migration     | —        | No persisted schema or serialized durable artifact; the request is transient UI state, and the new exports are additive (no compatibility window).          |

## Domain Glossary

| Term                 | Definition                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Host                 | The consuming application; it owns `open`, the request options, and every side effect behind the outcome.                             |
| Confirm prompt       | A modal that forces an explicit decision between a fixed set of actions before the host's operation may run.                          |
| Controlled component | Visibility follows the `open` prop; closure is a callback request to the host, never a local state change.                            |
| Alert dialog         | A modal that cannot be dismissed through Escape or the backdrop; only explicit actions dismiss it (Fluent UI v9 `modalType="alert"`). |
| Intent               | `'confirmation'` or `'danger'`; drives the emphasis of the affirmative action, not the surface.                                       |
| Affirmative action   | The action that adopts the pending decision — the confirm button of the default pair, or any custom action the caller marks.          |
| Safe action          | The action that abandons the decision; documented first in the action order so it receives initial focus.                             |
| Default pair         | The standard decline → confirm button pair with `confirm`/`decline` labels; resolves `boolean`.                                       |
| Custom action        | A `ConfirmAction` record (`value`, `label`, `appearance`, `intent`, `icon`) of a caller-supplied action set; resolves its `value`.    |
| Value                | The literal string a custom action reports; inferred as a literal union at the call site.                                             |
| Busy                 | `busy` prop state: every action is disabled and nothing can resolve until the host clears it.                                         |
| Strings              | Consumer-supplied text overrides (`strings`) merged over English defaults (`ConfirmDialogStrings`: `"Confirm"`, `"Cancel"`).          |
| Request              | One `confirm(options)` call of the provider layer; holds the dialog's options and the pending promise.                                |
| Supersede            | A new request while one is pending: the previous promise resolves `false` and the new dialog replaces it.                             |
| Resolution           | The promise result of a request: `boolean` for the pair, the chosen `value` for action sets; never rejects.                           |
| Legacy source        | The `fui8` `ConfirmDialog` (Fluent UI v8) analyzed for this feature — functional ideas only, no transferable implementation.          |

## Document Index

| #         | Document                                                             | Description                                                      | Depends On |
| --------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------- |
| **AR**    | [Ambiguity Register](00-ambiguity-register.md)                       | Zero-Ambiguity Gate decisions (audit trail)                      | —          |
| **RD-01** | [RD-01 — ConfirmDialog component](RD-01-confirm-dialog-component.md) | The controlled prompt: intents, typed actions, busy, a11y, story | —          |
| **RD-02** | [RD-02 — ConfirmProvider and useConfirm](RD-02-confirm-provider.md)  | Provider + promise DX layer over RD-01                           | RD-01      |

## Dependency Graph

    RD-01 (ConfirmDialog component)
      └── RD-02 (ConfirmProvider + useConfirm) — renders the RD-01 dialog
          └── builds on the existing package infrastructure
              (FluentProvider theming, component file pattern, Vitest suite)

## Suggested Implementation Order

| Phase              | Documents | Description                                                                                        |
| ------------------ | --------- | -------------------------------------------------------------------------------------------------- |
| **A: MVP**         | RD-01     | The complete dialog — one component with its spec/impl tests, story and documentation.             |
| **B: Convenience** | RD-02     | Provider + hook on top of RD-01: one-call prompts with promise outcomes, SSR smoke and export pin. |

## Key Architecture Decisions

| Decision                                      | Choice                                                         | Rationale                                                                                  | AR Ref      |
| --------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------- |
| Platform is v9-only                           | No v8 artifacts, no fallback branch                            | A v8 fallback is a second design system, not a fallback; the repo and upstream are v9-only | AR #1, #2   |
| Two layers: declarative + imperative          | RD-01 dialog; RD-02 provider + hook                            | Mirrors `ErrorDialog`/`SystemErrorProvider` and upstream `Toaster`/`useToastController`    | AR #3, #16  |
| Two intents, wording carries "question"       | `confirmation` \| `danger`                                     | The legacy "question" dialogs never differed visually; a third axis would be drift         | AR #4       |
| Danger = token recipe on one action           | `colorStatusDangerBackground3` (+Hover/Pressed, inverted fg)   | Theme-safe in dark mode and custom themes; Button has no built-in danger look              | AR #5       |
| Strict alert semantics                        | No Escape, no backdrop, no close affordance                    | Parity with the legacy blocking behavior; a forced decision needs an explicit choice       | AR #6       |
| Controlled, presentation-only component       | Host owns `open` and side effects; `onResolve` reports         | Matches every legacy call site and the repository pattern                                  | AR #7, #24  |
| Typed custom action arrays                    | Non-empty tuple, literal-typed values, replacing the pair      | N-way decisions keep typed promise outcomes on both layers                                 | AR #8, #20  |
| Provider: one per root, replacement semantics | Supersede resolves the previous promise `false`; never rejects | No dangling awaits; no stale dialogs from abandoned flows                                  | AR #16, #17 |
| Strings with English defaults                 | `strings?: Partial<ConfirmDialogStrings>`                      | House `ErrorDialog` precedent; consumer apps localize                                      | AR #12, #18 |
| Deferred, explicitly                          | Hold-open busy mode; dialog glyph prop                         | Consequence-stated deferrals; absent from executable requirements                          | AR #22, #23 |

## How to Use These Documents

Each requirements document is designed to be used with the make-plan skill:

1. Pick a requirements document (e.g., RD-01).
2. Run the make-plan skill.
3. The plan system uses the RD as input to create implementation plans.
4. Run the exec-plan skill for the feature.
5. Implement iteratively.
