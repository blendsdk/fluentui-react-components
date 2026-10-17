# Roadmap: Loading

> **Feature-Set**: loading
> **Status**: In Progress
> **Created**: 2026-10-17
> **Last Updated**: 2026-10-17 15:36
> **Progress**: 0 / 1 (0%)
> **CodeOps Artifact Schema**: 1

## Legend

⬜ Backlog · ✏️ RD Drafted · 🔎 RD Preflighted · 📋 Plan Created · 🔬 Plan Preflighted · 🔄 Executing · ✅ Done · ⛔ Blocked · ⏸️ Deferred

## Tracker

| ID       | Title                             | RD                                                | Plan                                          | Stage                       | Status | Last Updated | Depends-on / Blocker    |
| -------- | --------------------------------- | ------------------------------------------------- | --------------------------------------------- | --------------------------- | ------ | ------------ | ----------------------- |
| RD-01    | Loading primitives                | [RD-01](requirements/RD-01-loading-primitives.md) | [loading](plans/loading/00-index.md)          | ⛔ Blocked (was: Executing) | ⛔     | 2026-10-17   | DEF-01                  |
| ↳ DEF-01 | Manual accessibility pass (4.1.5) | —                                                 | [loading](plans/loading/99-execution-plan.md) | Deferred                    | ⏸️     | 2026-10-17   | User: real browser + AT |

## Notes

- The plan implements `Loading`, `LoadingOverlay` and `useLoading()` in four phases; the execution
  plan is the single source of task progress.
- Code and automated verification are complete (48/49 tasks). `DEF-01` is the user-owned manual
  accessibility pass for task 4.1.5; the feature returns to Done when that pass is recorded.
- The provider/global-blocker and paired-lifecycle options are explicit Won't Have scope, not
  deferred work.
