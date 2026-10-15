# error-dialog — Requirements Documents

> **Feature**: error-dialog — a reusable Fluent UI v9 error dialog component
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

The rebuild also fixes the defects observed in the legacy code: error objects serialized as
`{}`, a dismissal escape hatch on session-expired errors, visibility tied to translation
loading, and unbounded action side effects inside the component.

## Minimum-Sufficient Baseline

**Original goal:** bring the legacy application-error dialog to this repository as a
Fluent UI v9 component suitable for the current applications.

**Smallest viable design:** one controlled `ErrorDialog` component with a typed prop contract,
defined error serialization, copy-to-clipboard details, and callback-based actions — built with
the repository's existing component pattern and existing dependencies.

**Excluded support machinery:** global error capture and a store/provider, a React error
boundary, telemetry/automatic reporting, mail-to and support-reference-ID affordances, an i18n
framework, and any new dependency.

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

## Document Index

| #         | Document                                                         | Description                                                                | Depends On |
| --------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------- |
| **AR**    | [Ambiguity Register](00-ambiguity-register.md)                   | Zero-Ambiguity Gate decisions (audit trail)                                | —          |
| **RD-01** | [RD-01 — ErrorDialog component](RD-01-error-dialog-component.md) | The complete feature: controlled dialog, serialization, copy, tests, story | —          |

## Dependency Graph

    RD-01 (ErrorDialog component)
      └── standalone; builds on the existing package infrastructure
          (FluentProvider theming, component file pattern, Vitest suite)

## Suggested Implementation Order

| Phase      | Documents | Description                                                                             |
| ---------- | --------- | --------------------------------------------------------------------------------------- |
| **A: MVP** | RD-01     | The complete feature — one component with its spec/impl tests, story and documentation. |

## Key Architecture Decisions

| Decision                                                | Choice                                           | Rationale                                                                                            | AR Ref |
| ------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------ |
| Capture and storage live outside the library            | App / future framework provider                  | Keeps the component SSR- and test-safe; matches the v8 successor where the framework owned the store | AR #1  |
| Session-expired errors are a variant, not code sniffing | `kind: "error" \| "unauthorized"`                | The component never inspects `code === 401`; the host states its intent explicitly                   | AR #4  |
| All side effects are callbacks                          | `onDismiss` / `onReload` / `onSignOut`           | Provider- and app-agnostic; no reload, navigation or logout inside the component                     | AR #7  |
| Strings arrive via props with English defaults          | `strings?: Partial<ErrorDialogStrings>`          | Localization without an i18n dependency; Dutch is supplied by consumer apps                          | AR #11 |
| The component serializes error details                  | Defined rules + `detailsText` override           | Fixes the legacy `{}` and crash defects; hosts can still take full control                           | AR #10 |
| Blocking alert semantics                                | Fluent v9 `modalType="alert"`, controlled `open` | Esc/backdrop cannot dismiss; parity with the legacy `isBlocking: true`                               | AR #6  |

## How to Use These Documents

Each requirements document is designed to be used with the make-plan skill:

1. Pick a requirements document (e.g., RD-01).
2. Run the make-plan skill.
3. The plan system uses the RD as input to create implementation plans.
4. Run the exec-plan skill for the feature.
5. Implement iteratively.
