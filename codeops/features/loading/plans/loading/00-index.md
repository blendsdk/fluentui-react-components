# Loading Implementation Plan

> **Feature**: Region-level Fluent UI v9 loading primitives — a standalone `Loading` filler, a `LoadingOverlay` shim that keeps content mounted and inert, and a local `useLoading()` controller with `run()` and ref-counted operations
> **Status**: Blocked
> **Created**: 2026-10-17
> **Implements**: loading/RD-01
> **CodeOps Artifact Schema**: 1

## Overview

This plan implements the three loading primitives approved in the design discussion. `Loading` is the transparent, centered spinner for a region with no content to cover. `LoadingOverlay` is the region-scoped shim that keeps its children mounted, covers them with the themed scrim and spinner while `loading` is true, and makes the covered content inert. `useLoading()` is the local controller that removes the `setBusy(true)` / `try` / `finally` boilerplate for arbitrary async operations.

The design is intentionally the smallest one that satisfies the need. It reuses the Fluent UI v9 `Spinner`, `tokens.colorBackgroundOverlay`, the repository's component anatomy and its spec-first testing pattern. It adds no provider, store, portal, global blocker or new dependency. `LoadingOverlay` accepts a plain boolean, so it works with `useTransition`, `useActionState`, a store, React Query or an application's existing `fetching` flag. `useLoading` is an optional convenience; the hook and the overlay are connected explicitly through `loading={isLoading}`, which keeps the data flow visible to people and tools.

The plan is split into three implementation phases — the `Loading` filler, the `LoadingOverlay` shim, and the `useLoading` controller — followed by an integration/hardening phase. Every phase follows the mandatory ordering: specification tests → red phase → implementation → green phase → implementation tests → full verification. The plan is intentionally UI-only: it has no server input, authentication, persistence or network surface.

## Minimum-Sufficient Baseline

**Original goal:** make it easy to show that a region or operation is busy, with great developer experience and AI-friendly, statically analyzable APIs.

**Smallest viable design:** three public pieces built on the Fluent UI v9 `Spinner` and theme tokens, in the repository's existing component pattern, plus a small internal delayed-visibility hook and a shared indicator renderer. No provider, store, portal, dependency or framework.

**Excluded machinery:** a global loading provider/context, a portal-based full-page blocker, a dynamically returned component, `busy()` / `done()`, `begin()` release tokens, `Skeleton` / `ProgressBar` variants, the v8 opaque background and global `z-index`, `minVisible`, a `focusManagement` opt-out, `blockInteraction`, string resources and any new dependency.

**Approved complexity:** None — the design adds no material support surface beyond the three public pieces and small private helpers. No Complexity Escalation Gate was triggered.

## Document Index

| #   | Document                                       | Description                                              |
| --- | ---------------------------------------------- | -------------------------------------------------------- |
| AR  | [Ambiguity Register](00-ambiguity-register.md) | Zero-Ambiguity Gate decisions (audit trail)              |
| 00  | [Index](00-index.md)                           | This document — overview and navigation                  |
| 01  | [Requirements](01-requirements.md)             | Plan scope as a thin delta over `loading/RD-01`          |
| 02  | [Current State](02-current-state.md)           | Analysis of the package, legacy evidence and gaps        |
| 03  | [Loading](03-01-loading.md)                    | Technical specification of the standalone filler         |
| 03B | [LoadingOverlay](03-02-loading-overlay.md)     | Technical specification of the overlay, timing and focus |
| 03C | [useLoading](03-03-use-loading.md)             | Technical specification of the controller hook           |
| 07  | [Testing Strategy](07-testing-strategy.md)     | Specification test cases and verification                |
| 99  | [Execution Plan](99-execution-plan.md)         | Phases, sessions and the task checklist                  |

## Quick Reference

### Standalone filler

```tsx
<Loading label="Loading records…" />
```

Use it when the region has no content to cover. It is transparent, centered, fills its parent, and defaults to the large spinner with the label below.

### Overlay with an existing boolean

```tsx
<LoadingOverlay loading={isFetching} label={t('please_wait')}>
  <DataGrid records={records} />
</LoadingOverlay>
```

The children stay mounted. The overlay appears after 300 ms, covers them with the themed scrim and spinner, and makes them inert. A fast response never flashes the overlay.

### Async operation with the local controller

```tsx
function ActorDetails() {
  const { isLoading, label, run } = useLoading({ label: t('please_wait') });
  const { catchError } = useSystemError();

  const save = () => run(() => api.saveActor(actorId), { label: t('saving') }).catch(catchError);

  return (
    <>
      <Button disabled={isLoading} onClick={save}>
        {t('save')}
      </Button>

      <LoadingOverlay loading={isLoading} label={label}>
        <ActorForm />
      </LoadingOverlay>
    </>
  );
}
```

`run` clears the busy state in `finally`, returns the operation's value and rethrows its error. Overlapping operations are counted; the overlay stays until the last one settles.

### App-owned pending state

```tsx
const [isPending, startTransition] = useTransition();

<LoadingOverlay loading={isPending} label={t('saving')}>
  <Form />
</LoadingOverlay>;

startTransition(async () => {
  await api.save();
});
```

`LoadingOverlay` does not care where the boolean comes from.

## Key Decisions

| Decision            | Outcome                                                                                                | AR Ref        |
| ------------------- | ------------------------------------------------------------------------------------------------------ | ------------- |
| Public API          | Normal `Loading` / `LoadingOverlay` components plus a local `useLoading()` controller                  | AR-1, RD AR-3 |
| Operation lifecycle | `run()` only; no `busy()` / `done()` and no `begin()` in v1                                            | AR-8, RD AR-4 |
| Overlay behavior    | Blocking, children mounted, `inert`, 300 ms delay, themed local scrim, no portal                       | AR-4, AR-5    |
| Announcement        | One persistent polite status region outside the `aria-busy` subtree; visual spinner is `aria-hidden`   | AR-3, AR-5    |
| Focus               | Move only when focus was inside; restore the reveal-time element first, else the loading-start element | AR-6          |
| Labels              | `label?: string`, English default `Loading…`, blank fallback, most recent active label                 | AR-7          |
| Hook state          | `useReducer` active-operation array, ids, `finally`, stable `run`, caller re-render                    | AR-8          |
| Native props        | Root `className` / `style` merge, `ref` root, other native props pass; busy/focus attributes managed   | AR-9          |
| SSR                 | Delayed visibility starts false; effects reveal; persistent status node; no browser API in render      | AR-12         |
| Verification        | `pnpm verify` plus `pnpm storybook:build`; execution commit mode requested `--auto-commit`             | AR-14         |

## Specialist Agents

**None** — the capability-gap check ran against this repository's evidence and found no gap a standing specialist would close.

_Detection evidence: `AGENTS.md:46` records that specialist coverage is up to date (2026-10-16) and no specialist is warranted; the work is React 19 / Fluent UI v9 component authoring covered by `.opencode/skills/fluentui-components` and the repository's `AGENTS.md` conventions. There is no specialized protocol, domain invariant, migration boundary or repeated review area that a catalog role plus the phase packet does not already cover._

## Execution Preferences

**Commit mode requested:** `--auto-commit` (commit and push after each verified task). This is an `exec-plan` mode; plan creation writes documents only and does not commit or push. Pass the flag again when starting `exec-plan` on this plan.

## Related Files

New sources:

- `packages/react-components/src/components/Loading/` — `Loading.tsx`, `Loading.types.ts`, `useLoadingBase.ts`, `useLoading.ts`, `useLoading.types.ts`, `renderLoading.tsx`, `renderLoadingIndicator.tsx`, `useLoadingStyles.styles.ts`, `useDelayedVisibility.ts`, `loadingLabel.ts`, `index.ts`, `Loading.stories.tsx`
- `packages/react-components/src/components/LoadingOverlay/` — `LoadingOverlay.tsx`, `LoadingOverlay.types.ts`, `useLoadingOverlay.ts`, `useLoadingOverlayFocus.ts`, `renderLoadingOverlay.tsx`, `useLoadingOverlayStyles.styles.ts`, `index.ts`, `LoadingOverlay.stories.tsx`

New tests:

- `packages/react-components/test/loading.spec.test.tsx`
- `packages/react-components/test/loading.impl.test.tsx`
- `packages/react-components/test/loading-overlay.spec.test.tsx`
- `packages/react-components/test/loading-overlay.impl.test.tsx`
- `packages/react-components/test/use-loading.spec.test.tsx`
- `packages/react-components/test/use-loading.impl.test.tsx`
- `packages/react-components/test/loading.ssr.test.tsx`

Modified:

- `packages/react-components/src/index.ts` — public exports
- `packages/react-components/test/package-exports.spec.test.ts` — runtime and type pins
- `packages/react-components/README.md` — component sections, props, composition, accessibility, localization and decision table
