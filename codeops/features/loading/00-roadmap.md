# Roadmap: Loading

> **Feature-Set**: loading
> **Status**: Active
> **Created**: 2026-10-17
> **Last Updated**: 2026-10-17 15:05
> **Progress**: 0 / 1 (0%)
> **CodeOps Artifact Schema**: 1

## Legend

⬜ Backlog · ✏️ RD Drafted · 🔎 RD Preflighted · 📋 Plan Created · 🔬 Plan Preflighted · 🔄 Executing · ✅ Done · ⛔ Blocked · ⏸️ Deferred

## Tracker

| ID    | Title              | RD                                                | Plan                                 | Stage            | Status | Last Updated | Depends-on / Blocker |
| ----- | ------------------ | ------------------------------------------------- | ------------------------------------ | ---------------- | ------ | ------------ | -------------------- |
| RD-01 | Loading primitives | [RD-01](requirements/RD-01-loading-primitives.md) | [loading](plans/loading/00-index.md) | Executing        | 🔄     | 2026-10-17   | —                    |

## Notes

- The plan implements `Loading`, `LoadingOverlay` and `useLoading()` in four phases; the execution
  plan is the single source of task progress.
- No deferred items. The provider/global-blocker and paired-lifecycle options are explicit Won't
  Have scope, not deferred work.
