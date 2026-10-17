# Requirements: Loading Primitives

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-01](../../requirements/RD-01-loading-primitives.md) — the OWNING requirements doc

## Scope of this plan (delta view)

### In this plan

- RD-01 R1–R5 — the standalone `Loading` filler: status/label, defaults and layout, delay, native props and ref.
- RD-01 R6–R10 — the `LoadingOverlay` shim: controlled children, delay, inert/scrim blocking, status announcement, focus management and pass-through.
- RD-01 R11–R13 — the `useLoading()` controller: `{ isLoading, label, run }`, ref-counted operations, deterministic labels, stable `run`, error and unmount behavior.
- RD-01 R14 — public exports, README, stories, JSDoc and package-export pins.
- RD-01 R15 — React 19/Fluent v9 compatibility, no portal/global state and SSR smoke.
- RD-01 R16 — the explicit scope exclusions (no provider, global blocker, variants, v8 surface, paired lifecycle, new dependency or string resources).
- RD-01 R17 — `pnpm verify` and `pnpm storybook:build`.

### Deferred / out of this plan

- None. The RD's Won't Have list is out of scope, not deferred into a later plan.

## Plan-local decisions

| Decision                                   | Chosen                                                                                                                                                        | AR Ref |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Hook file placement and naming             | Public `Loading/useLoading.ts`; internal component state hook `Loading/useLoadingBase.ts`                                                                     | AR-2   |
| Announcement structure                     | `role="status"` root with visually hidden label; status sibling of the `aria-busy` content wrapper; visual spinner wrapped in `aria-hidden`                   | AR-3   |
| Overlay DOM                                | Relative root + `display: contents` content wrapper carrying `aria-busy`/`inert` + absolute scrim + persistent status; no portal                              | AR-4   |
| Delay and live-region timing               | Shared `useDelayedVisibility(active, delay)`; status node mounted before its text; a delay change applies to the next activation                              | AR-5   |
| Focus algorithm                            | Capture at loading start; move only if focus was inside or blurred to body; restore the reveal-time element first, then the captured one                      | AR-6   |
| Label resolution                           | English default, blank fallback, most recently started active labeled operation, removal by operation id                                                      | AR-7   |
| Controller state model                     | `useReducer` active-operation array, ids, stable `run`, `finally`, rethrow                                                                                    | AR-8   |
| Managed attributes and native pass-through | `className`/`style` merge; ref root; other native props pass; `aria-busy` on the content wrapper and `tabIndex`/status, live and root-name attributes managed | AR-9   |
| Testing split                              | Spec tests for observable contract; impl tests for focus fallback/timers/structure; stories for visual/manual checks; SSR smoke                               | AR-10  |
| Public exports and docs                    | Three runtime exports, four types, two stories, README sections and export pins                                                                               | AR-11  |
| SSR/hydration                              | Delayed visibility starts false; effects reveal; no browser API in render                                                                                     | AR-12  |
| Minimum-sufficient design                  | No provider/store/portal/dependency; only small private helpers                                                                                               | AR-13  |
| Verification and commit mode               | `pnpm verify` + `pnpm storybook:build`; `--auto-commit` recorded for `exec-plan`; no commit during planning                                                   | AR-14  |
| Future escape hatches                      | `begin()`, `focusManagement`, `minVisible`, provider and global blocker are excluded from v1                                                                  | AR-15  |

> **Traceability:** Every plan-local decision references the Ambiguity Register entry that resolved it. See `00-ambiguity-register.md`.

## Acceptance Criteria

1. [ ] The `Loading`, `LoadingOverlay`, `useLoading` and their type exports are present at the package root exactly as listed in RD-01 R14.
2. [ ] `test/package-exports.spec.test.ts` pins the new runtime symbols and type declarations.
3. [ ] Each phase's feature specification tests are written first, verified red (including `pnpm type-check`), and kept unchanged through implementation; the export pin is extended intentionally as each public symbol lands, and each SSR smoke case is added in the phase that introduces its behavior.
4. [ ] Implementation tests cover the focus fallback, timer cleanup/normalization, class merge and DOM structure that the spec tests cannot see.
5. [ ] Storybook stories show `Loading` variants, the async `useLoading` + `LoadingOverlay` flow, a fast operation, an app-owned boolean and a custom label.
6. [ ] README documents every prop, the accessibility contract, the localization contract and the decision table.
7. [ ] `pnpm verify` and `pnpm storybook:build` pass.
8. [ ] No provider, portal, store, global blocker, `Skeleton`/`ProgressBar` variant, v8 prop surface, `busy`/`done`, `begin`, `minVisible` or new dependency is present.
9. [ ] The plan's execution mode is recorded as `--auto-commit` for the `exec-plan` run; no commit is made during plan creation.
