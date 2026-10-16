# Requirements: App Launcher

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-01](../../requirements/RD-01-app-launcher-shell.md) and
> [RD-02](../../requirements/RD-02-app-launcher-blocks.md) — the OWNING requirements documents

## Scope of this plan (delta view)

### In this plan

- RD-01 complete — the launcher shell (`AppLauncher` + `AppLauncherTrigger`), its 14 ported
  oracle tests, the workbench-derived stories and the README sections.
- RD-02 complete — the five content blocks and the internal layout context, their 22 ported
  oracle tests, the variant stories and the README sections.
- Cross-phase integration — the package barrel, the export-surface pin (extended once per
  phase) and the composed story that renders the blocks inside the shell.

### Deferred / out of this plan

- None — the port's full scope is planned here. The RDs' own "Won't Have" lists apply unchanged
  (behavioral fixes deferred to a possible follow-up feature, comparable-systems capabilities out,
  no SSR smoke, no release work).

## Plan-local decisions

| Decision                       | Chosen                                                                                                          | AR Ref |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------ |
| Phase structure and order      | Blocks (RD-02) first, shell (RD-01) second                                                                      | AR P1  |
| Spec-first ordering for a port | Port the oracle tests before the sources; red phase = import/render failures; impl tests in the impl-tests step | AR P2  |
| Byte-identity verification     | Prettier-normalized diff gate with the edit whitelist                                                           | AR P3  |
| Verify commands                | `pnpm verify` every phase; `pnpm storybook:build` in story phases                                               | AR P4  |
| Task grouping                  | One task per component folder; `AppLauncherItem` split; cross-cutting tasks separate                            | AR P6  |

## Acceptance Criteria

The RDs own the component acceptance criteria (RD-01 AC 1–9, RD-02 AC 1–11); this plan adds the
whole-port criteria:

1. [ ] All 36 ported oracle tests pass unchanged (assertions untouched; only the two whitelisted
       comment edits in `app-launcher.spec.test.tsx`), plus the extended export-surface pin.
2. [ ] The normalized-diff gate passes in both phases: blocks — empty diff on all 31 copied files
       and the 5 spec test files; shell — exactly the three whitelisted comment hunks (one in
       `AppLauncher.tsx`, two in `app-launcher.spec.test.tsx`) and nothing else (AR P3).
3. [ ] The package root exports exactly the final 15-entry runtime surface (8 existing + 7
       launcher components) with type pins for the 9 launcher types (AR #11, #12).
4. [ ] Seven story files exist; `pnpm storybook:build` succeeds; the a11y addon reports no
       violations; the `AppLauncher` story carries the manual review checklist and the pass is
       recorded (AR #5, #10, #13).
5. [ ] The README documents the whole family in the package's format (AR #18); no `@virtuoapp`
       reference remains anywhere in the ported artifacts (AR #3); the source repository is
       unmodified (AR #17).
6. [ ] `pnpm verify` passes after every phase (AR P4).
