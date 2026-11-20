# Roadmap: AppBar

> **Feature-Set**: app-bar
> **Status**: Complete
> **Created**: 2026-11-20
> **Last Updated**: 2026-11-21
> **Progress**: 2 / 2 (100%)
> **CodeOps Artifact Schema**: 1

## Legend

⬜ Backlog · ✏️ RD Drafted · 🔎 RD Preflighted · 📋 Plan Created · 🔬 Plan Preflighted · 🔄 Executing · ✅ Done · ⛔ Blocked · ⏸️ Deferred

## Tracker

| ID    | Title                               | RD                                              | Plan                                                         | Stage | Status | Last Updated | Depends-on / Blocker |
| ----- | ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ | ----- | ------ | ------------ | -------------------- |
| RD-01 | AppBar shell                        | [RD-01](requirements/RD-01-app-bar-shell.md)    | [app-bar](plans/app-bar/00-index.md)                         | Done  | ✅     | 2026-11-20   | —                    |
| RD-02 | AppBar commands                     | [RD-02](requirements/RD-02-app-bar-commands.md) | [app-bar](plans/app-bar/00-index.md)                         | Done  | ✅     | 2026-11-21   | RD-01                |
| T-01  | Real AppBars in AppLauncher stories | —                                               | [plan](plans/app-launcher-real-appbars/99-execution-plan.md) | Done  | ✅     | 2026-11-21   | —                    |

## Notes

- The plan is specification-first: RD-01 shell specs, then shell implementation; RD-02 button
  specs, then the button and the composed M365 stories.
- The user's visual approval of the shell stories, then `Geometry`, `States` and `WithLauncher`,
  is a completion gate.
- Preflight passed with notes on 2026-11-20: 8 critical/major resolved, 14 minor findings and 4
  observations accepted. See [the preflight report](plans/app-bar/00-preflight-report.md).
- Specialist check: None (2026-11-20) — UI-only component family; no recurring domain gap. See
  `codeops/specialist-check.json`.
- T-01 is a story-only refactor: it replaces the simulated AppLauncher bars with the real
  `AppBar`, `AppBarTitle` and `AppBarButton`; no `AppLauncher` source, tests or README changes.
  User-approved on 2026-11-20 23:31.
