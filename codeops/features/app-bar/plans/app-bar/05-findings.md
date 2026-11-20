# Findings Ledger: AppBar

> **Document**: 05-findings.md
> **Parent**: [Index](00-index.md)
> **Phase**: Phase 1 (AppBar shell)

## Phase 1 review

The independent Phase 1 correctness review found no critical or major findings. The minor and
observation findings were fixed in the same pass; no user ruling was required for a minor finding.

| Finding | Phase | Severity    | Area                                                                    | Ruling                                                                                                         |
| ------- | ----- | ----------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| RV-1    | 1     | MINOR       | `AppBarTitle` stories — `Long` did not truncate at 22rem                | Fixed — `.narrow` is 12rem; the story now proves the ellipsis                                                  |
| RV-2    | 1     | MINOR       | `AppBar` story description referenced `AppBarButton` and "Phase 2"      | Fixed — reworded without the forward reference or plan phase                                                   |
| RV-3    | 1     | MINOR       | README missing the geometry table and spacer props table                | Fixed — both tables added                                                                                      |
| RV-4    | 1     | OBSERVATION | Impl test scope and names differed from task 1.3.1                      | Fixed — added bar/title refs and the arbitrary-child command assertion; names use `should ...`                 |
| RV-5    | 1     | OBSERVATION | Style hooks called inside the returned object                           | Fixed — `const classes` hoisted in `useAppBar` and `useAppBarSpacer`                                           |
| RV-6    | 1     | OBSERVATION | Story used a template-string class merge and a 96px trailing block      | Fixed — the trailing block is 48px and uses the single placeholder class                                       |
| RV-7    | 1     | OBSERVATION | No-op `mergeClasses` and duplicate `color: inherit` in the title styles | Fixed — direct class return, duplicate color removed                                                           |
| RV-8    | 1     | OBSERVATION | README example comment described a launcher that was not rendered       | Fixed — the comment explains the `dockTarget` composition; the full example arrives with the command component |

## Phase 2 visual review

| Finding | Phase | Severity | Area                                                                                                   | Ruling                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UV-1    | 2     | MAJOR    | `WithLauncher` story — the bar measured 168px because the 360px grid frame stretched the auto row      | Fixed — the story frame uses `alignContent: 'start'`; Chromium re-measured every AppBar story at 48px                                                                                                                                                                                                                                                                                     |
| UV-2    | 2     | MAJOR    | `AppLauncher` default panel had rounded top corners where it meets the bar; the user requested removal | Fixed in the separate AppLauncher maintenance change: the default surface now has square top corners and 8px bottom corners; the AppLauncher story caption and RD-01 requirement note are updated separately; the package README does not state the corner radius. The AppBar plan's AR-10 "no AppLauncher changes" is superseded by this explicit user request for the launcher surface. |

## Phase 2 code review

The independent Phase 2 review verified the normal command states, focus, button-only type,
launcher integration, export surface and 48px geometry. It found one major forced-colors defect
and seven minor/observation issues; all are fixed in task 2.3.8. The fix-diff re-review is the
remaining gate for RV-9.

| Finding | Phase | Severity    | Area                                                                                         | Ruling                                                                                                                                                                                                                                                                                                                                         |
| ------- | ----- | ----------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RV-9    | 2     | MAJOR       | Forced-colors mode: the brand bar becomes Canvas while the command stays white on hover/open | Fixed — `AppBar`, `AppBarTitle` and `AppBarButton` have `@media (forced-colors: active)` overrides using Canvas/CanvasText, Highlight/HighlightText, ButtonText focus and GrayText disabled. The residual hover-plus-open specificity gap is fixed; Chromium re-check: open+hover trigger Highlight/HighlightText, bar 48px, title CanvasText. |
| RV-10   | 2     | MINOR       | `States` caption did not state the 4.29:1 / 3.58:1 ratios                                    | Fixed — the caption states both ratios and the 3:1 icon-only threshold                                                                                                                                                                                                                                                                         |
| RV-11   | 2     | MINOR       | `WithLauncher` said an item activation closes the panel but the items had no handler         | Fixed — each `AppLauncherItem` closes the controlled launcher                                                                                                                                                                                                                                                                                  |
| RV-12   | 2     | MINOR       | Impl test did not prove the component class was added                                        | Fixed — a plain Fluent `Button` and `AppBarButton` class comparison is asserted; the spec oracle is untouched                                                                                                                                                                                                                                  |
| RV-13   | 2     | MINOR       | README did not require non-empty visible children                                            | Fixed — the `children` row and the naming guidance require non-empty content                                                                                                                                                                                                                                                                   |
| RV-14   | 2     | MINOR       | AppBar story checklist omitted RTL and forced colors                                         | Fixed — both steps are in the story description, and forced colors is the check that caught RV-9                                                                                                                                                                                                                                               |
| RV-15   | 2     | OBSERVATION | Comment called `borderWidth`/`borderColor` shorthands                                        | Fixed — the comment now names Griffel's unsupported property list and the supported `border` shorthand                                                                                                                                                                                                                                         |
| RV-16   | 2     | OBSERVATION | README typed `icon` as `ReactElement`, narrower than the public slot type                    | Fixed — the table names Fluent's `ButtonProps['icon']` slot                                                                                                                                                                                                                                                                                    |
| RV-17   | 2     | OBSERVATION | The forced-colors bottom border made the bar 49px tall                                       | Fixed — an absolutely positioned pseudo-element draws a 1px CanvasText edge without affecting layout; the bar measures 48px                                                                                                                                                                                                                    |
| RV-18   | 2     | OBSERVATION | The forced-colors focus outline used ButtonText on a Highlight background                    | Fixed — the outline switches to HighlightText while the command is hovered, active or open; the resting focus uses ButtonText                                                                                                                                                                                                                  |

## Evidence

- Focused shell tests: 41 / 41 passed after the Phase 1 fixes.
- Focused button/impl/export tests: 35 / 35 passed after the Phase 2 implementation.
- Full `pnpm verify`: passed after the forced-colors corrections (88 test files; the new impl
  class assertion adds one test).
- Phase 2 review: normal-mode states, focus, type, launcher and export surface verified. Forced
  colors re-checked in Chromium: bar 48px with a 1px CanvasText pseudo-edge; open+hover trigger
  Highlight/HighlightText; title CanvasText; open-state focus outline HighlightText.
- User approved the visual gate on 2026-11-20 23:31.
- `pnpm storybook:build`: passed.
- User visual approval of the shell stories: 2026-11-20 15:53 ("LGTM").
- The AppBar feature itself made no `AppLauncher` source or documentation change. The separate,
  user-requested AppLauncher top-radius maintenance is recorded under UV-2 and its story caption
  and RD-01 note are updated outside this plan.
