# Ambiguity Register: AppBar Implementation Plan

> **Status**: ✅ GATE PASSED — all 30 items resolved
> **Last Updated**: 2026-11-20 12:41
> **Plan**: `codeops/features/app-bar/plans/app-bar/`
> **Requirements register**: [../../requirements/00-ambiguity-register.md](../../requirements/00-ambiguity-register.md)

## Imported requirements decisions

These rows are owned by the requirements register and are imported as resolved; they are not
re-confirmed here.

| #     | Decision                                                                                        | Status      |
| ----- | ----------------------------------------------------------------------------------------------- | ----------- |
| AR-01 | Core + commands; no tab strip                                                                   | ✅ Resolved |
| AR-02 | Title: span by default; heading XOR link                                                        | ✅ Resolved |
| AR-03 | Brand-only surface                                                                              | ✅ Resolved |
| AR-04 | Four component folders, barrels and root exports                                                | ✅ Resolved |
| AR-05 | 48px minimum height; zero bar padding; zero gap; flush launcher and trailing command            | ✅ Resolved |
| AR-06 | Title: 14px/20px semibold, 8px inset, truncation                                                | ✅ Resolved |
| AR-07 | Button: 48px targets, forced transparent/square/medium, required accessible name when icon-only | ✅ Resolved |
| AR-08 | Only `AppBarButton` is restyled                                                                 | ✅ Resolved |
| AR-09 | No sticky, overflow menu or responsive collapsing                                               | ✅ Resolved |
| AR-10 | No `AppLauncher` changes; compose `dockTarget` + trigger                                        | ✅ Resolved |
| AR-11 | Banner landmark, optional name/heading, 48px targets, visible focus, text-zoom growth           | ✅ Resolved |
| AR-12 | No built-in strings                                                                             | ✅ Resolved |
| AR-13 | Tokens plus documented 48px and white-overlay literals                                          | ✅ Resolved |
| AR-14 | Four spec files, impl tests, export pin, four story files, README, no browser/SSR               | ✅ Resolved |
| AR-15 | Two RDs: shell, then commands                                                                   | ✅ Resolved |
| AR-16 | Additive minor `0.7.0`; no publish in this feature                                              | ✅ Resolved |
| AR-17 | M365 launcher: 48×48, 20px waffle, 12%/22% overlays, white focus, muted disabled                | ✅ Resolved |
| AR-18 | `Geometry`, `States`, `WithLauncher` are the visual acceptance gate                             | ✅ Resolved |

## Plan-level decisions

| #    | Category             | Decision                                                                                                                                                                                                                                                                                       | Authority / evidence                                                                     | Status      |
| ---- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------- |
| P-01 | Scope                | The plan implements `app-bar/RD-01` and `app-bar/RD-02`; no other RD or feature is in scope                                                                                                                                                                                                    | AR-15; requirements README                                                               | ✅ Resolved |
| P-02 | Naming & terminology | Folder and file names follow the existing anatomy: `src/components/<Name>/<Name>.tsx`, `.types.ts`, `use<Name>.ts`, `render<Name>.tsx`, `use<Name>Styles.styles.ts`, `index.ts`                                                                                                                | AR-04; `skills/fluentui-components/references/component-anatomy.md`                      | ✅ Resolved |
| P-03 | Naming & terminology | Spec files: `test/app-bar.spec.test.tsx`, `app-bar-title.spec.test.tsx`, `app-bar-spacer.spec.test.tsx`, `app-bar-button.spec.test.tsx`; type tests: `app-bar-title.types.test.tsx`, `app-bar-button.types.test.tsx`; impl tests: `test/app-bar.impl.test.tsx`, `app-bar-button.impl.test.tsx` | AR-14; existing `test/*.spec.test.tsx` and `form-*-field.types.test.tsx` precedent       | ✅ Resolved |
| P-04 | Naming & terminology | Story files: `AppBar/stories/AppBar.stories.tsx`, `AppBarTitle/stories/AppBarTitle.stories.tsx`, `AppBarSpacer/stories/AppBarSpacer.stories.tsx`, `AppBarButton/stories/AppBarButton.stories.tsx`; story names in §07 and the component specs                                                  | AR-14, AR-18; existing per-component story convention                                    | ✅ Resolved |
| P-05 | Technical            | Full verification is `pnpm verify`; the visual build check is `pnpm storybook:build`; focused test runs use the package Vitest binary                                                                                                                                                          | `AGENTS.md` Commands / Verification                                                      | ✅ Resolved |
| P-06 | Technical            | Tests run under Vitest/jsdom with Testing Library and a `FluentProvider` wrapper using `webLightTheme`                                                                                                                                                                                         | Existing `test/app-launcher.spec.test.tsx` and `test/collapsible-section.spec.test.tsx`  | ✅ Resolved |
| P-07 | Technical            | Type-level contracts use `@ts-expect-error` assertions in `*.types.test.tsx` files                                                                                                                                                                                                             | Existing `test/form-text-field.types.test.tsx`, `form-textarea-field.types.test.tsx`     | ✅ Resolved |
| P-08 | Technical            | No browser, performance or SSR suite is added for this feature                                                                                                                                                                                                                                 | AR-14; the shell and button are pure markup; the visual contract is the Storybook review | ✅ Resolved |
| P-09 | Behavioral           | The `Geometry`, `States` and `WithLauncher` stories are the visual acceptance gate; the user approves or requests corrections before the plan is marked done                                                                                                                                   | AR-18                                                                                    | ✅ Resolved |
| P-10 | Integration points   | The export-surface pin `test/package-exports.spec.test.ts` lists the four components and four props types                                                                                                                                                                                      | AR-14; existing pin                                                                      | ✅ Resolved |
| P-11 | Integration points   | README sections are added to `packages/react-components/README.md`; `AppLauncher` documentation is not modified                                                                                                                                                                                | AR-10, AR-14; repository documentation convention                                        | ✅ Resolved |
| P-12 | Technical            | No new runtime or peer dependency is added; no `AppLauncher` source or documentation changes                                                                                                                                                                                                   | Minimum-sufficient baseline; AR-10                                                       | ✅ Resolved |

## Resolution Notes

**P-01:** The plan target is the two RDs created in this feature. The fui9 source is a reference,
not a migration target; no fui9 code is ported.

**P-02–P-04:** Names follow the repository's existing component anatomy and the `fluentui-components`
skill. The executor must not invent alternative folder or file names.

**P-05:** The repository has no `codeops/test-map.json`; the task-level focused command is a
`**Task verify**` line, and the phase-level full verify remains `pnpm verify`.

**P-06–P-07:** The test harness and wrapper match the existing launcher and collapsible-section
specs. Type tests are included because the title and button contracts are union types.

**P-09:** The visual gate is not a code test. The executor builds the stories, presents them, and
records the user's approval or the correction list. A correction restarts the story/verify loop.

## Preflight rulings

The [preflight report](00-preflight-report.md) owns the post-creation findings and the user's
rulings: button-only `AppBarButton` (PF-001), the M365 text-command contrast exception (PF-005),
the unitless line-height and 200% text-zoom check (PF-004), and the accepted plan corrections.
Those rulings refine this plan; they do not reopen the 30 decisions above.
