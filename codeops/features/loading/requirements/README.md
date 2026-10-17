# loading — Requirements Documents

> **Feature**: loading — three Fluent UI v9 primitives for region-level busy feedback: `Loading`, `LoadingOverlay` and `useLoading()`
> **Status**: Draft
> **Created**: 2026-10-17
> **Architecture**: React 19 + Fluent UI v9 (`@fluentui/react-components` 9.74), TypeScript, Griffel styling with design tokens, Vitest + Testing Library
> **CodeOps Artifact Schema**: 1

---

## Overview

Applications need to show that a region is waiting: a list is loading, a form is saving, an import or export is running. The legacy `@blendsdk/fui8` `Loading` component covered that need 47 times in CastingAppMT; every use was the replacement branch of a `fetching ? <Loading /> : content` condition. 35 of those 47 uses passed no label, and none passed any prop other than `label`.

This feature rebuilds that convention as three small, native Fluent UI v9 pieces:

1. **`Loading`** — a transparent, centered, indeterminate spinner for a region that has no content to cover.
2. **`LoadingOverlay`** — a region-scoped blocking overlay that keeps children mounted, covers them with a themed scrim and spinner while `loading` is true, and makes the covered content `inert`.
3. **`useLoading()`** — a local controller hook for arbitrary async operations. It ref-counts overlapping operations, clears busy state in `finally`, returns the operation's value, rethrows its error, and carries per-operation labels.

The pieces are intentionally separate. `LoadingOverlay` accepts a plain boolean, so it composes with `useTransition`, `useActionState`, a store, React Query or existing application state. `useLoading` is an optional convenience. There is no provider, no global blocker, no portal, no dynamically returned component and no new dependency.

The design keeps the legacy convention — one consistent loading state per region — and fixes what the legacy component lacked: an accessible announcement, anti-flash delay, stable layout, inert interaction blocking, focus restoration and a concurrency-safe async controller.

## Minimum-Sufficient Baseline

**Original goal:** make it easy to show that a region or operation is busy, with great developer experience and AI-friendly, statically analyzable APIs.

**Smallest viable design:** three public pieces built on the Fluent UI v9 `Spinner` and theme tokens, following the repository's existing component/anatomy/test patterns; a small internal delayed-visibility hook and a shared indicator renderer; no provider, store, portal, dependency or framework.

**Excluded support machinery:** a global loading provider, a portal blocker, a component returned from a hook, `busy()`/`done()`, `begin()` release tokens, `Skeleton`/`ProgressBar` variants, and any new dependency.

**Approved complexity:** None — no layer, dependency, harness or infrastructure surface beyond the three public pieces.

## Domain Lenses

| Lens                   | Selected | Evidence                                                                                                                                               |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Web application        | ✅       | Browser UI components; accessibility, keyboard, focus, live-region and theming requirements; SSR smoke; localization via props (web-application lens). |
| API surface            | ✅       | Three new public exports plus four public types; the package export test pins the runtime surface.                                                     |
| Concurrency            | ✅       | `useLoading` ref-counts overlapping async operations and resolves labels deterministically by operation id.                                            |
| Compiler/language      | —        | No grammar, parser, IR, codec or evaluator.                                                                                                            |
| Financial system       | —        | No money, balances, pricing or ledger concepts.                                                                                                        |
| Distributed/concurrent | —        | No threads, queues, replicas or workflows; the concurrency is in-memory React state on one client.                                                     |
| Data and migration     | —        | No persisted schema or serialized durable artifact; the new exports are additive (no compatibility window).                                            |

## Domain Glossary

| Term                 | Definition                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Region               | The part of the page or dialog that owns a loading state: a card, a list, a form body, a dialog body.                            |
| Filler               | `Loading`: a standalone centered spinner that occupies a region with no content to cover.                                        |
| Overlay              | `LoadingOverlay`: a blocking layer over existing children, with a scrim, spinner and status.                                     |
| Controller           | The `{ isLoading, label, run }` object returned by `useLoading()`.                                                               |
| Operation            | One async (or sync) function passed to `run`; tracked from start to settlement.                                                  |
| Active operation     | An operation that has started and not yet settled; its id is used for removal and label resolution.                              |
| Ref-counting         | `isLoading` is true while the active-operation array is non-empty; overlapping operations do not hide the loader early.          |
| Delay                | Milliseconds before the overlay/filler becomes visible; prevents a flash for fast operations.                                    |
| Scrim                | The translucent themed layer (`tokens.colorBackgroundOverlay`) between the content and the spinner.                              |
| Inert                | The React 19/HTML attribute that removes covered content from the tab order and accessibility tree while the overlay is visible. |
| Status region        | A `role="status"` polite live region containing the label; the single announcement source.                                       |
| Decorative indicator | The visual Fluent `Spinner`, marked `aria-hidden` because the status text carries the meaning for assistive technology.          |
| Label                | The plain string shown under the spinner and announced by the status region; default `Loading…`.                                 |
| Anti-flash           | The default 300 ms overlay delay plus the one-effect reveal; a fast operation settles before anything appears.                   |
| Legacy source        | The `fui8` `Loading` (Fluent UI v8) analyzed for this feature — functional ideas only, no transferable implementation.           |

## Document Index

| #         | Document                                                  | Description                                                                | Depends On |
| --------- | --------------------------------------------------------- | -------------------------------------------------------------------------- | ---------- |
| **AR**    | [Ambiguity Register](00-ambiguity-register.md)            | Zero-Ambiguity Gate decisions (audit trail)                                | —          |
| **RD-01** | [RD-01 — Loading primitives](RD-01-loading-primitives.md) | The complete requirements for `Loading`, `LoadingOverlay` and `useLoading` | —          |

## Dependency Graph

    RD-01 (Loading primitives)
      └── builds on the existing package infrastructure
          (FluentProvider theming, Fluent Spinner, component pattern, Vitest suite)
      └── plan: codeops/features/loading/plans/loading/

## Suggested Implementation Order

| Phase             | Documents     | Description                                                                                      |
| ----------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| **A: Filler**     | RD-01 R1–R5   | `Loading` with status, delay, defaults, styles, spec/impl tests, story and README.               |
| **B: Overlay**    | RD-01 R6–R10  | `LoadingOverlay` with delay, inert, status, focus management, spec/impl tests, story and README. |
| **C: Controller** | RD-01 R11–R13 | `useLoading` with `run`, ref-counting, labels, spec/impl tests, integration story and README.    |
| **D: Hardening**  | RD-01 R14–R17 | Export pins, SSR smoke, full README, `pnpm verify`, Storybook build.                             |

## Key Architecture Decisions

| Decision                       | Choice                                                     | Rationale                                                                                                | AR Ref |
| ------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------ |
| Public pieces                  | `Loading`, `LoadingOverlay`, `useLoading`                  | The legacy filler and the new shim are both real; a controller removes async boilerplate.                | AR #1  |
| Normal components + local hook | No dynamic component, no provider                          | Stable identity, discoverable symbols, explicit data flow, no tree restructuring; best for tools and AI. | AR #3  |
| `run()` only                   | No `busy()`/`done()`, no `begin()`                         | `finally` cleanup, ref-counting and error-safe behavior; paired lifecycles are easy to unbalance.        | AR #4  |
| Blocking mounted overlay       | Children stay mounted, `inert`, focus restore, 300ms delay | Stable layout and accessible blocking for region-level work; no portal or global blocker.                | AR #5  |
| English label + fallback       | `label?: string`, default `Loading…`                       | Fixes unlabeled legacy uses; matches the repository's string pattern; localized apps pass their own.     | AR #6  |
| Transparent filler             | Large ring, label below, no background/z-index             | The legacy background and z-index were v8 workarounds; a filler does not need them.                      | AR #7  |
| Single announcement source     | `role="status"` text + `aria-hidden` visual spinner        | Prevents double speech and keeps the announcement reliable.                                              | AR #8  |
| No provider/global/variants    | Explicit exclusions                                        | Keeps the feature small; Fluent already supplies Skeleton/ProgressBar for their own use cases.           | AR #9  |
