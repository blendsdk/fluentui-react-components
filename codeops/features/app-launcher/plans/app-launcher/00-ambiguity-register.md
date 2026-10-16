# Ambiguity Register: app-launcher plan

> **Status**: ✅ GATE PASSED — 6 plan items + 2 runtime items resolved
> **Last Updated**: 2026-10-16 17:03

**Imported context (not re-confirmed):** the feature's requirements register
([../requirements/00-ambiguity-register.md](../requirements/00-ambiguity-register.md), 19 items,
✅ GATE PASSED) governs this plan entirely — byte-identical port of all 7 components, the ported
tests as the immutable oracle, workbench samples + variant stories, scope adaptation,
sample-copy de-branding, the closed 3-item comment whitelist, no new dependencies or config, no
SSR smoke, no release work, source repository read-only. The items below are the plan-level
decisions introduced by planning itself; the user answered all six by direct decision and
confirmed the complete register (2026-10-16 planning round). P7 was added during execution as a
runtime correction under the invoked auto-design delegation.

| #   | Category            | Ambiguity / Gap                              | Options Presented                                                                                                                                                                                                                                                                                                                   | User Decision                                               | Status                |
| --- | ------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------- |
| P1  | Scope               | Phase structure and order                    | (a) two phases — content blocks first (RD-02), shell second (RD-01), 3-step spec-first ordering each · (b) shell first · (c) one combined phase                                                                                                                                                                                     | **Option (a)** — blocks first, shell second                 | ✅ Resolved           |
| P2  | Behavioral          | Spec-first ordering adapted to a port        | (a) port the test files before the sources; red phase = import/render failures with documented evidence; impl tests in the impl-tests step · (b) copy tests and sources together                                                                                                                                                    | **Option (a)** — port tests first                           | ✅ Resolved           |
| P3  | Verification        | Byte-identity verification method            | (a) Prettier-normalized diff against the source in `$CODEOPS_TMPDIR` with the edit whitelist: blocks expect an empty diff; shell expects exactly the 1 comment hunk; test files the 2 comment hunks · (b) review-only inspection                                                                                                    | **Option (a)** — normalized diff gate                       | ✅ Resolved           |
| P4  | Integration         | Verify command (confirmed once)              | `pnpm verify` (AGENTS.md full gate) for every phase; `pnpm storybook:build` additionally required in phases that add stories                                                                                                                                                                                                        | **Confirmed** — `pnpm verify` + `pnpm storybook:build`      | ✅ Resolved           |
| P5  | Naming              | Plan document set and folder                 | (a) `codeops/features/app-launcher/plans/app-launcher/` with 00-index, 01-requirements (thin delta), 02-current-state, 03-01-app-launcher-blocks, 03-02-app-launcher-shell, 07-testing-strategy, 99-execution-plan · (b) other names                                                                                                | **Option (a)** — house document set                         | ✅ Resolved           |
| P6  | Granularity         | Task grouping for verbatim copies            | (a) one port task per component folder (5–6 files); `AppLauncherItem` split into state (context/types/hook) and view (styles/render/shell/barrel) because of its 7 files; separate cross-cutting tasks (root barrel, export pin, stories, README) · (b) every folder split by layer                                                 | **Option (a)** — per-component tasks                        | ✅ Resolved           |
| P7  | Technical (runtime) | Cross-phase composition tests                | (a) keep the approved blocks-first order; the three shell-composition block tests (ST-17, ST-22, ST-24) stay red until Phase 2 · (b) swap the phase order to shell-first (contradicts P1) · (c) merge both phases                                                                                                                   | **Option (a)** — AI-delegated (ad-app-launcher-20261016-01) | ✅ Resolved (runtime) |
| P8  | Technical (runtime) | Phase-1 boundary gate under cross-phase reds | (a) adapt task 1.3.7: run `pnpm verify`; pass when the only failures are the documented P7 set (3 tests + 3 type-import errors), recorded; complete green gate at 2.3.6 · (b) defer the full gate entirely to Phase 2 (loses the boundary gate) · (c) revert the committed spec files and reorder (history churn; no red reduction) | **Option (a)** — AI-delegated (ad-app-launcher-20261016-01) | ✅ Resolved (runtime) |

## Resolution Notes

**P1:** Blocks first because the composed `AppLauncher` story (RD-01) renders the blocks; with
blocks landed first, the final phase finishes on the complete workbench port. Phase sizes: blocks
≈ 22 oracle tests / 31 files; shell ≈ 14 oracle tests / 11 files.

**P2:** The three-step ordering is mandatory; for a byte-identical port the spec-test step is
satisfied by porting the existing specification tests first — they fail at import/render because
the components do not exist yet (the red phase), and pass unchanged after the sources land (the
green phase). `app-launcher-item.impl.test.tsx` is an implementation test and ports in the
impl-tests step.

**P3:** Normalization procedure: copy the source files to `$CODEOPS_TMPDIR`, format them with the
repository's Prettier configuration, then diff against the ported files. Expected differences are
exactly the whitelisted comment edits (AR #8 of the requirements register); anything else fails
the phase review.

**P4:** Detected from `AGENTS.md` ("Full gate: `pnpm verify`") and the component skill's definition
of done (`pnpm storybook:build`). No invented commands.

**P5:** Mirrors the existing plans' document set and numbering in this repository.

**P6:** Each component folder is one coherent, reviewable change (a verbatim copy verified by the
normalized-diff gate); cross-cutting artifacts get their own tasks. The single 7-file folder is
split in two.

**P7 (runtime — discovered 2026-10-16 while preparing the Phase-1 spec step):** Three of the
nineteen block spec tests render inside the launcher surface (`AppLauncher`): the search Escape
test (ST-17), the grid composition test (ST-22) and the list composition test (ST-24). With the
approved blocks-first order (P1), those three cannot turn green in Phase 1 — the shell lands in
Phase 2. They still run red-first under the spec-first ordering; only the per-step green
expectation is corrected.

Authority: AI — delegated by --auto-design
Eligibility: implementation sequencing / testing strategy; keeps the product scope, the
byte-identical requirement, the P1 phase order and every acceptance criterion unchanged
Objective: a truthful, checkable red/green expectation per phase without reordering approved
structure
Decision: keep the order; Phase 1 green = the 16 shell-independent block spec tests plus the
extended pin assertion; the three composition tests are documented as turning green in Phase 2
Evidence: source test files — search.spec renders `<AppLauncher><ControlledSearch/></AppLauncher>`
in its third case; grid.spec and list.spec each render `<AppLauncher>` in their second case;
the shell spec files import no block components, so Phase 2 completes the green set
Rejected alternatives: shell-first order (contradicts the recorded P1 user decision and only
moves the composed-story dependency); merging both phases (rejected at P1)
Strongest counterargument: a phase ending with failing tests is unusual; the counter is that the
failures are pre-declared, count-stable cross-phase reds, and the alternative merely splits the
same reds differently
Confidence: High — the dependency set is exactly three tests, verifiable by file read; would
change if further block tests gain shell composition
Hardening: not required (low impact, trivially reversible, no product behavior change)
Policy version: 1
Root invocation ID: ad-app-launcher-20261016-01
Reopen triggers: any added block test composing with the shell; a decision to reorder the phases

**P8 (runtime — discovered 2026-10-16 while preparing the Phase-1 implementation):** With the
blocks implemented, the repo gate is green except the P7 set: `pnpm test` fails the three
shell-composition tests and `pnpm type-check` reports the three matching `AppLauncher` imports
(all inside the ported spec files; `build` compiles `src` only and stays green). The block spec
files are already committed, so reordering cannot remove the residual — blocks-first minimizes it.
Task 1.3.7 therefore verifies the adapted boundary: no failures beyond the documented set,
recorded with the run evidence; the complete green `pnpm verify` runs in Phase 2.

Authority: AI — delegated by --auto-design
Eligibility: testing strategy; keeps scope, behavior, the P1 order and every acceptance criterion
unchanged; adapts only the phase-boundary gate expectation
Objective: a truthful, checkable Phase-1 gate without losing its signal
Decision: option (a) — task 1.3.7 runs the full gate and passes when the only failures are the
documented P7/P8 set (3 tests + 3 type-import errors), recorded
Evidence: type-check log (TS2305 errors, all in the ported spec files); `tsconfig.build.json`
excludes tests (build green); both component families are import-free of each other (grep
verified in both directions)
Rejected alternatives: deferring the gate entirely to Phase 2 (loses the boundary signal);
reverting the committed spec files and reordering (history churn, larger red window, contradicts
P1 without benefit)
Strongest counterargument: a boundary gate that passes with known failures is weaker than a fully
green gate; the counter is that the residual set is exact, pre-declared, and unreachable until
Phase 2 by construction
Confidence: High — verified by direct type-check run and config reads
Hardening: not required (process-expectation adaptation; no product behavior; trivially revised)
Policy version: 1
Root invocation ID: ad-app-launcher-20261016-01
Reopen triggers: residual failures beyond the documented set; any further cross-phase dependency

**No deferrals. No complexity escalations** — the port reuses the existing package, patterns,
dependencies and test infrastructure. Two runtime corrections (P7, P8) were recorded during
execution; they change no behavior, scope or acceptance criterion.
