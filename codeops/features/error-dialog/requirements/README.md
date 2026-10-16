# error-dialog — Requirements Documents

> **Feature**: error-dialog — a reusable Fluent UI v9 error dialog component with an opt-in error provider
> **Status**: Draft
> **Created**: 2026-10-16
> **Architecture**: React 19 + Fluent UI v9 (`@fluentui/react-components` 9.74), TypeScript, Griffel styling with design tokens, Vitest + Testing Library
> **CodeOps Artifact Schema**: 1

---

## Overview

`ErrorDialog` is the component a consuming application shows when something unexpected went
wrong: it tells the user an application error occurred, presents the raw error details for
support, and offers the recovery actions the host provides — close, reload, or sign out when
the session expired.

The design rebuilds a component that has two earlier lives: the `error` module of the legacy
`@blendsdk/fluentui` package (Fluent UI v8, MobX store, NL/EN strings embedded) and its later
`fui8` successor, where a framework-owned store captured errors and the dialog became a
presentational component driven by callbacks. This feature keeps that proven split: the
component is fully controlled, performs no capture and no side effects, and leaves session
policy, page reloads and error storage to the host application.

RD-02 adds an explicit, optional convenience layer on top: a `SystemErrorProvider` that holds
the current error, renders the dialog once, exposes `useSystemError()` for one-call reporting
from anywhere in the application, and offers opt-in global capture. Auth and navigation policy
still stay with the host.

The rebuild also fixes the defects observed in the legacy code: error objects serialized as
`{}`, a dismissal escape hatch on session-expired errors, visibility tied to translation
loading, and unbounded action side effects inside the component.

## Minimum-Sufficient Baseline

**Original goal:** bring the legacy application-error dialog to this repository as a
Fluent UI v9 component suitable for the current applications.

**Smallest viable design:** RD-01 — one controlled `ErrorDialog` component with a typed prop
contract, defined error serialization, copy-to-clipboard details, and callback-based actions;
RD-02 — a thin `SystemErrorProvider` holding the current error, rendering the dialog once, with
opt-in global capture. Both built with the repository's existing component pattern and existing
dependencies.

**Excluded support machinery:** a React error boundary, telemetry/automatic reporting, mail-to
and support-reference-ID affordances, an i18n framework, and any new dependency.

**Approved complexity:** None.

## Domain Lenses

| Lens                   | Selected | Evidence                                                                                                                                                        |
| ---------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web application        | ✅       | Browser UI component; session-expired (unauthorized) recovery; accessibility, keyboard and localization requirements (`references/domains/web-application.md`). |
| Compiler/language      | —        | No grammar, parser, IR, codec or evaluator.                                                                                                                     |
| Financial system       | —        | No money, balances, pricing or ledger concepts.                                                                                                                 |
| Distributed/concurrent | —        | No threads, queues, replicas or workflows; a single UI-side timer for the copy feedback.                                                                        |
| Data and migration     | —        | No persisted schema or serialized durable artifact; the error payload is transient UI state.                                                                    |

## Domain Glossary

| Term                           | Definition                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Host                           | The consuming application that mounts `ErrorDialog`; it owns error capture, storage and the side effects behind the callbacks.        |
| Unexpected error               | A runtime error the user did not cause and cannot fix; the dialog is the terminal surface for it.                                     |
| Unauthorized (session expired) | The host determined the session is no longer valid; recovery is re-authentication. Modeled as `kind="unauthorized"`.                  |
| Details                        | The read-only serialized representation of the error value, shown for support purposes and copyable to the clipboard.                 |
| Alert dialog                   | A modal that cannot be dismissed through Escape or the backdrop; only explicit actions dismiss it (Fluent UI v9 `modalType="alert"`). |
| Controlled component           | Visibility is driven by the `open` prop; dismissal is a callback request to the host, never a local state change.                     |
| Strings                        | Consumer-supplied text overrides (`strings`) merged over English defaults (`ErrorDialogStrings`).                                     |
| Last-wins                      | A newer error replaces the displayed one; the component keeps no history of earlier errors.                                           |
| SystemErrorProvider            | The RD-02 provider that holds the current error and renders one `ErrorDialog`; the app wraps its tree with it once.                   |
| catchError                     | The `useSystemError()` call that reports an error value (with optional `kind` and `detailsText`) to the provider from anywhere.       |
| Global capture (opt-in)        | `captureGlobalErrors` — when true, the provider listens for window `error` and `unhandledrejection` events; off by default.           |

## Document Index

| #         | Document                                                         | Description                                              | Depends On |
| --------- | ---------------------------------------------------------------- | -------------------------------------------------------- | ---------- |
| **AR**    | [Ambiguity Register](00-ambiguity-register.md)                   | Zero-Ambiguity Gate decisions (audit trail)              | —          |
| **RD-01** | [RD-01 — ErrorDialog component](RD-01-error-dialog-component.md) | The controlled dialog: serialization, copy, tests, story | —          |
| **RD-02** | [RD-02 — SystemErrorProvider](RD-02-system-error-provider.md)    | Provider + `useSystemError()` with opt-in global capture | RD-01      |

## Dependency Graph

    RD-01 (ErrorDialog component)
      └── RD-02 (SystemErrorProvider) — renders the RD-01 dialog
          └── builds on the existing package infrastructure
              (FluentProvider theming, component file pattern, Vitest suite)

## Suggested Implementation Order

| Phase              | Documents | Description                                                                            |
| ------------------ | --------- | -------------------------------------------------------------------------------------- |
| **A: MVP**         | RD-01     | The complete dialog — one component with its spec/impl tests, story and documentation. |
| **B: Convenience** | RD-02     | Provider + hook on top of RD-01: one-call error reporting and opt-in global capture.   |

## Key Architecture Decisions

| Decision                                                | Choice                                                       | Rationale                                                                          | AR Ref      |
| ------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ----------- |
| Error capture and storage policy                        | RD-01: none in the component; RD-02: opt-in provider state   | Keeps the dialog SSR- and test-safe; the provider adds convenience, not policy     | AR #1, #15  |
| Session-expired errors are a variant, not code sniffing | `kind: "error" \| "unauthorized"`                            | The component never inspects `code === 401`; the host states its intent explicitly | AR #4       |
| All side effects are callbacks                          | `onDismiss` / `onReload` / `onSignOut`                       | Provider- and app-agnostic; no reload, navigation or logout inside the component   | AR #7       |
| Strings arrive via props with English defaults          | `strings?: Partial<ErrorDialogStrings>`                      | Localization without an i18n dependency; Dutch is supplied by consumer apps        | AR #11      |
| The component serializes error details                  | Defined rules + `detailsText` override                       | Fixes the legacy `{}` and crash defects; hosts can still take full control         | AR #10      |
| Blocking alert semantics                                | Fluent v9 `modalType="alert"`, controlled `open`             | Esc/backdrop cannot dismiss; parity with the legacy `isBlocking: true`             | AR #6       |
| Provider ships in this library                          | `SystemErrorProvider` + `useSystemError()` (RD-02)           | One wrapper + one call for adoption; RD-01 and its preflight pass stay untouched   | AR #15, #16 |
| Global capture is opt-in and non-suppressing            | `captureGlobalErrors` default `false`; no `preventDefault()` | The library stays policy-free; existing monitoring keeps working                   | AR #17      |

## How to Use These Documents

Each requirements document is designed to be used with the make-plan skill:

1. Pick a requirements document (e.g., RD-01).
2. Run the make-plan skill.
3. The plan system uses the RD as input to create implementation plans.
4. Run the exec-plan skill for the feature.
5. Implement iteratively.
