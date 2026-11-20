# Execution Plan: AppBar

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-21 00:03
> **Progress**: 39/39 tasks (100%)
> **CodeOps Artifact Schema**: 1

## Overview

Build the four AppBar components in two phases: the shell (`AppBar`, `AppBarTitle`,
`AppBarSpacer`) first, then the command button and the composed M365 stories. Every phase follows
the specification-first order: spec tests → red phase → implementation → green phase →
implementation tests → full verification.

**Update this document after EACH completed task.** Plan creation leaves every task unchecked.
This document is the sole mutable task-progress authority; no second progress store is created.

## Implementation Phases

| Phase | Title                                 | Tasks |
| ----- | ------------------------------------- | ----- |
| 1     | AppBar shell                          | 22    |
| 2     | AppBar commands and visual acceptance | 17    |

**Total: 39 tasks across two phases.** No fabricated time estimate.

> **Execution rule:** Each task appears once in the list below. On implementation, mark `[~]`
> and append `⏳ (implemented: YYYY-MM-DD HH:MM)`. After its verification passes, promote to `[x]`
> and append `✅ (completed: YYYY-MM-DD HH:MM)`. Update the Progress and Last Updated headers
> after every task; only `[x]` counts complete. Resume the first `[~]`, otherwise the first `[ ]`.
> Mark blockers `[!]` with `Blocked: <reason>` on the task line. Timestamps come from
> `date '+%Y-%m-%d %H:%M'`, never invented values. Red-phase tasks are verified by expected
> failure, not by weakening tests or introducing implementation early. The feature is not complete
> until the full final gates and the user's visual review pass.

## Phase 1: AppBar Shell

> **Phase baseline tree**: recorded by the exec-plan skill at phase start.
> **Scope mode**: strict — RD-01 only, plus the approved tests, stories and README.
> **Expected modification set**: `packages/react-components/src/components/AppBar/`,
> `AppBarTitle/`, `AppBarSpacer/`, `packages/react-components/src/index.ts`, the shell test files,
> `test/package-exports.spec.test.ts`, `packages/react-components/README.md`, this plan and the
> feature/portfolio roadmaps.
> **Excluded pre-existing work**: `AppLauncher` source and docs, `codeops/specialist-check.json`,
> lockfiles, dependencies and CI.
> **Lenses**: web application · public API · accessibility · visual geometry
> **Reasoning**: high — public API, accessibility and exact visual geometry.

### Step 1.1: Specification Tests

**Reference**: [07 testing strategy](07-testing-strategy.md#specification-test-cases), RD-01,
AR-02, AR-04, AR-05, AR-06, AR-08, AR-11, AR-13, AR-14.

- [x] 1.1.1 [spec-author] Write ST-1–ST-6 for the bar and ST-14–ST-15 for the spacer — `test/app-bar.spec.test.tsx`, `test/app-bar-spacer.spec.test.tsx`; derive expectations only from RD-01 and 07, not from implementation. ✅ (completed: 2026-11-20 14:43)
- [x] 1.1.2 [spec-author] Write ST-7–ST-12 for the title and ST-13 for the title union — `test/app-bar-title.spec.test.tsx`, `test/app-bar-title.types.test.tsx`; include the heading/link exclusivity and level 1–6 cases. ✅ (completed: 2026-11-20 14:43)
- [x] 1.1.3 [spec-author] Add the three shell components and props types to the export pin — `test/package-exports.spec.test.ts`; preserve every existing expectation and verify the new names fail red. ✅ (completed: 2026-11-20 14:43)
- [x] 1.1.4 Run the shell spec files, the title type test, the export pin and type-check; record the expected red from the absent components/types in this document. Distinguish that expected failure from unrelated environment or setup failures. ✅ (completed: 2026-11-20 14:43)

**Task verify**: `pnpm --filter @blendsdk/fluentui-react-components exec vitest run test/app-bar.spec.test.tsx test/app-bar-spacer.spec.test.tsx test/app-bar-title.spec.test.tsx test/package-exports.spec.test.ts --reporter=verbose` fails for the missing components and exports; `pnpm --filter @blendsdk/fluentui-react-components type-check` fails for the missing exports/types. No implementation exists at this checkpoint.

### Step 1.2: Implementation

**Reference**: [03-01 AppBar](03-01-app-bar.md), [03-02 AppBarTitle](03-02-app-bar-title.md), [03-03 AppBarSpacer](03-03-app-bar-spacer.md); AR-04, AR-05, AR-06, AR-11, AR-13.

- [x] 1.2.1 Implement the `AppBar` props and root styles — `src/components/AppBar/AppBar.types.ts`, `src/components/AppBar/useAppBarStyles.styles.ts`; cover 03-01 §State hook and §Styles. ✅ (completed: 2026-11-20 14:45)
- [x] 1.2.2 Implement the `AppBar` state hook and render — `src/components/AppBar/useAppBar.ts`, `src/components/AppBar/renderAppBar.tsx`; merge classes and forward the ref per 03-01 §Render. ✅ (completed: 2026-11-20 14:45)
- [x] 1.2.3 Implement the `AppBar` shell and barrel — `src/components/AppBar/AppBar.tsx`, `src/components/AppBar/index.ts`; add displayName and the JSDoc example. ✅ (completed: 2026-11-20 14:45)
- [x] 1.2.4 Implement the `AppBarTitle` props and styles — `src/components/AppBarTitle/AppBarTitle.types.ts`, `src/components/AppBarTitle/useAppBarTitleStyles.styles.ts`; cover the union, typography, margins, truncation and link focus. ✅ (completed: 2026-11-20 14:45)
- [x] 1.2.5 Implement the `AppBarTitle` state hook and render — `src/components/AppBarTitle/useAppBarTitle.ts`, `src/components/AppBarTitle/renderAppBarTitle.tsx`; cover the text/heading/link branches and the typed heading lookup. ✅ (completed: 2026-11-20 14:45)
- [x] 1.2.6 Implement the `AppBarTitle` shell and barrel — `src/components/AppBarTitle/AppBarTitle.tsx`, `src/components/AppBarTitle/index.ts`. ✅ (completed: 2026-11-20 14:45)
- [x] 1.2.7 Implement the `AppBarSpacer` props and styles — `src/components/AppBarSpacer/AppBarSpacer.types.ts`, `src/components/AppBarSpacer/useAppBarSpacerStyles.styles.ts`. ✅ (completed: 2026-11-20 14:45)
- [x] 1.2.8 Implement the `AppBarSpacer` state hook and render — `src/components/AppBarSpacer/useAppBarSpacer.ts`, `src/components/AppBarSpacer/renderAppBarSpacer.tsx`. ✅ (completed: 2026-11-20 14:45)
- [x] 1.2.9 Implement the `AppBarSpacer` shell and barrel — `src/components/AppBarSpacer/AppBarSpacer.tsx`, `src/components/AppBarSpacer/index.ts`. ✅ (completed: 2026-11-20 14:45)
- [x] 1.2.10 Add the three shell exports to the package root — `src/index.ts`; export only the components and props types. ✅ (completed: 2026-11-20 14:45)
- [x] 1.2.11 Run the shell spec files, the title type test and type-check to green; fix implementation only, preserve the oracle, and record the result in this document. ✅ (completed: 2026-11-20 14:45)

**Task verify**: `pnpm --filter @blendsdk/fluentui-react-components exec vitest run test/app-bar.spec.test.tsx test/app-bar-spacer.spec.test.tsx test/app-bar-title.spec.test.tsx --reporter=verbose` and `pnpm --filter @blendsdk/fluentui-react-components type-check` pass. If a spec test fails, fix the source; a contradiction in the approved contract is a blocker requiring a ruling.

**Execution evidence:** After implementation, the four focused shell spec files passed 36/36 tests; the export pin passed with the three new names; `pnpm --filter @blendsdk/fluentui-react-components type-check` passed. The spec oracle was not modified. No `AppLauncher` source or documentation was touched.

### Step 1.3: Implementation Tests, Stories and Documentation

**Reference**: [03-01](03-01-app-bar.md), [03-02](03-02-app-bar-title.md), [03-03](03-03-app-bar-spacer.md); AR-14, AR-18.

- [x] 1.3.1 Write the shell implementation tests — `test/app-bar.impl.test.tsx`; cover class composition, ref identity, element structure and the absence of `data-app-bar-button` on arbitrary children. ✅ (completed: 2026-11-20 14:50)
- [x] 1.3.2 Add the `AppBar` shell stories — `src/components/AppBar/stories/AppBar.stories.tsx`; include `Default` and a shell-only `Geometry` with 48px placeholder blocks, dashed outlines, a ruler and a narrow title case. ✅ (completed: 2026-11-20 14:50)
- [x] 1.3.3 Add the `AppBarTitle` story — `src/components/AppBarTitle/stories/AppBarTitle.stories.tsx`; include `Plain`, `Heading`, `Link`, `Long`. ✅ (completed: 2026-11-20 14:50)
- [x] 1.3.4 Add the `AppBarSpacer` story — `src/components/AppBarSpacer/stories/AppBarSpacer.stories.tsx`; include `Alignment`. ✅ (completed: 2026-11-20 14:50)
- [x] 1.3.5 Add the README sections for `AppBar`, `AppBarTitle` and `AppBarSpacer` — `packages/react-components/README.md`; include the geometry table, title semantics, truncation/200% zoom behavior and localization model. ✅ (completed: 2026-11-20 14:50)
- [x] 1.3.6 Run the full verification and the Storybook build; reword the evidence as compile/bundle plus the browser review, and confirm the `AppLauncher` diff is empty. ✅ (completed: 2026-11-20 14:50)
- [x] 1.3.7 Present the shell `Default`, `Geometry` and `TitleVariants`/`AppBarSpacer` stories for the user's visual review; record approval or the exact correction list. This task stays open until the user responds. ✅ (completed: 2026-11-20 15:53 — user: "LGTM")

**Task verify**: `pnpm verify` and `pnpm storybook:build` pass; the Storybook build compiles/bundles the stories, and the shell stories are reviewed in the dev server. The user approves the shell geometry, title and spacer before Phase 2 starts.

**Execution evidence:** The focused shell tests passed 41/41 after the impl tests and the phase-review fixes. Full `pnpm verify` passed; `pnpm storybook:build` completed successfully. The `AppLauncher` source and documentation diff is empty. The user reviewed the shell `Default`, `Geometry`, `AppBarTitle` and `AppBarSpacer` stories in Storybook and approved them on 2026-11-20 15:53 ("LGTM"). The independent Phase 1 review found no critical/major findings; the three minor and five observation findings were fixed in the same pass and recorded in [05-findings.md](05-findings.md). Phase 1 is complete.

## Phase 2: AppBar Commands and Visual Acceptance

> **Phase baseline tree**: recorded by the exec-plan skill at phase start.
> **Scope mode**: strict — RD-02 only, plus the approved tests, stories, README and the visual gate.
> **Expected modification set**: `packages/react-components/src/components/AppBarButton/`,
> `AppBar/`, `AppBarTitle/`, `AppBarSpacer/` (visual corrections), `AppBar/stories/AppBar.stories.tsx`,
> `packages/react-components/src/index.ts`, the button test files,
> `test/package-exports.spec.test.ts`, `packages/react-components/README.md`, this plan and the
> feature/portfolio roadmaps.
> **Excluded pre-existing work**: `AppLauncher` source and docs, `codeops/specialist-check.json`,
> lockfiles, dependencies and CI.
> **Lenses**: web application · public API · accessibility · M365 interaction states
> **Reasoning**: high — exact visual states, public API and the user's acceptance gate.

### Step 2.1: Specification Tests

**Reference**: [07 testing strategy](07-testing-strategy.md#specification-test-cases), RD-02,
AR-07, AR-10, AR-11, AR-17, AR-18.

- [x] 2.1.1 [spec-author] Write ST-16–ST-25 for the button and launcher integration — `test/app-bar-button.spec.test.tsx`; include the open-state, disabled and `disabledFocusable` cases. ✅ (completed: 2026-11-20 16:10)
- [x] 2.1.2 [spec-author] Write ST-26 for the button type union — `test/app-bar-button.types.test.tsx`; include the icon-only-without-name, forced-prop, `as`/`href` and empty-children errors. ✅ (completed: 2026-11-20 16:10)
- [x] 2.1.3 [spec-author] Add `AppBarButton` and `AppBarButtonProps` to the export pin — `test/package-exports.spec.test.ts`; preserve every existing expectation and verify the new names fail red. ✅ (completed: 2026-11-20 16:10)
- [x] 2.1.4 Run the button spec file, the type test, the export pin and type-check; record the expected red from the absent component/types in this document. ✅ (completed: 2026-11-20 16:10)

**Task verify**: `pnpm --filter @blendsdk/fluentui-react-components exec vitest run test/app-bar-button.spec.test.tsx test/package-exports.spec.test.ts --reporter=verbose` fails for the missing component/exports; `pnpm --filter @blendsdk/fluentui-react-components type-check` fails for the missing export/types. No implementation exists at this checkpoint.

**Execution evidence:** The button spec file failed for the absent `AppBarButton`; the export pin failed for the missing runtime name; type-check reported TS2305 for `AppBarButton`/`AppBarButtonProps` and the expected unused directive chain. 11 failed / 21 passed at the red checkpoint; no implementation existed.

### Step 2.2: Implementation

**Reference**: [03-04 AppBarButton](03-04-app-bar-button.md); AR-07, AR-10, AR-13, AR-17.

- [x] 2.2.1 Implement the `AppBarButton` props and styles — `src/components/AppBarButton/AppBarButton.types.ts`, `src/components/AppBarButton/useAppBarButtonStyles.styles.ts`; cover the accessible-name union, the forced props, the M365 base/hover/pressed/open/focus/disabled rules and the icon rule. ✅ (completed: 2026-11-20 16:10)
- [x] 2.2.2 Implement the `AppBarButton` state hook and render — `src/components/AppBarButton/useAppBarButton.ts`, `src/components/AppBarButton/renderAppBarButton.tsx`; default `type="button"`, set `data-app-bar-button`, force transparent/square/medium and forward the ref. ✅ (completed: 2026-11-20 16:10)
- [x] 2.2.3 Implement the `AppBarButton` shell and barrel — `src/components/AppBarButton/AppBarButton.tsx`, `src/components/AppBarButton/index.ts`. ✅ (completed: 2026-11-20 16:10)
- [x] 2.2.4 Add the `AppBarButton` export to the package root — `src/index.ts`; export the component and props type only. ✅ (completed: 2026-11-20 16:10)
- [x] 2.2.5 Run the button spec file, the type test and type-check to green; fix implementation only, preserve the oracle, and record the result in this document. ✅ (completed: 2026-11-20 16:10)

**Task verify**: `pnpm --filter @blendsdk/fluentui-react-components exec vitest run test/app-bar-button.spec.test.tsx --reporter=verbose` and `pnpm --filter @blendsdk/fluentui-react-components type-check` pass. If a spec test fails, fix the source; a contradiction in the approved contract is a blocker requiring a ruling.

**Execution evidence:** The button spec and export pin passed 32/32 after implementation; type-check passed. The forced-prop `never` declarations make `appearance`/`shape`/`size`/`as`/`href` compile-time errors. The spec oracle was not modified.

### Step 2.3: Implementation Tests, Stories, Documentation and Visual Gate

**Reference**: [03-04](03-04-app-bar-button.md), [07 Manual Browser Checklist](07-testing-strategy.md#manual-browser-checklist); AR-14, AR-17, AR-18.

- [x] 2.3.1 Write the button implementation tests — `test/app-bar-button.impl.test.tsx`; cover `data-app-bar-button`, class composition, default type and root structure. ✅ (completed: 2026-11-20 16:10)
- [x] 2.3.2 Add the `AppBarButton` gallery — `src/components/AppBarButton/stories/AppBarButton.stories.tsx`; show icon-only, text, icon+text, disabled, `disabledFocusable` and the forced open state, with the M365 caption. ✅ (completed: 2026-11-20 16:10)
- [x] 2.3.3 Extend the `AppBar` story with the composed M365 scenarios — `src/components/AppBar/stories/AppBar.stories.tsx`; add `Geometry` (dashed outlines and a ruler), `States` (pointer hover/press, keyboard press, focus, disabled; caption the measured 4.29:1/3.58:1 text ratios and the accepted exception), `WithLauncher` (pointer left over the open trigger) and `TitleVariants` (link and 200% text zoom), with the manual checklist in the description. ✅ (completed: 2026-11-20 16:10)
- [x] 2.3.4 Add the `AppBarButton` README section and the full launcher composition — `packages/react-components/README.md`; include the props table, forced appearance, state table, accessible-name rule, text-contrast exception and 200% text-zoom note, and the launcher example. ✅ (completed: 2026-11-20 16:10)
- [x] 2.3.5 Run the full verification, the Storybook build, the a11y review and the `AppLauncher` diff review; record the commands and results in this document. ✅ (completed: 2026-11-20 16:10)
- [x] 2.3.6 Present the `Geometry`, `States`, `WithLauncher`, `TitleVariants` link and 200% zoom checks for the user's visual review; record the approval or the exact correction list. This task stays open until the user responds. ✅ (completed: 2026-11-20 23:31 — user approved the Phase 2 visual gate)
- [x] 2.3.7 Apply the approved visual corrections, if any, and re-run the focused story/verify loop; re-present the corrected stories and record the final approval. ✅ (completed: 2026-11-20 23:31 — `WithLauncher` frame fix; Chromium re-measured all AppBar bars at 48px; user approved)
- [x] 2.3.8 Fix the Phase 2 review findings — forced-colors overrides in `AppBar`, `AppBarTitle` and `AppBarButton`; the residual hover-plus-open Highlight rule; non-layout forced-colors bar edge; HighlightText focus on Highlight; `States` ratios; `WithLauncher` item close; impl class assertion; README empty-name/icon wording; RTL/forced-colors checklist; terminology. ✅ (completed: 2026-11-21 00:03 — forced-colors re-checked; final `pnpm verify` and `pnpm storybook:build` passed)

**Task verify**: `pnpm verify` and `pnpm storybook:build` pass; the a11y addon reports no violations; the `AppLauncher` diff is empty; the user approves the shell and the three composed stories plus the link and zoom checks. A correction restarts 2.3.7 after 2.3.5, with the same oracle.

**Execution evidence:** Focused button + impl + export tests passed 35/35. Full `pnpm verify` passed: 88 test files, 962 tests. `pnpm storybook:build` completed successfully. The `AppLauncher` source and documentation diff is empty. The a11y panel and the visual states are part of the user review in 2.3.6.

**Visual review correction (UV-1):** The `WithLauncher` story measured the bar at 168px in Chromium. The component was correct; the 360px story grid stretched the auto row. The story frame now uses `alignContent: 'start'`. Re-measurement: `WithLauncher` 48px; `Default` 48px; `Geometry` 48px + 48px; `States` 48px; `TitleVariants` 48px × 4; `AppBarTitle/Plain` 48px; `AppBarSpacer/Alignment` 48px. The component keeps `min-height: 48px` so text-only zoom can grow it when content exceeds 48px.

**Phase 2 visual gate:** The user approved the `Geometry`, `States`, `WithLauncher`, `TitleVariants` link and 200% zoom checks on 2026-11-20 23:31. The independent Phase 2 correctness review found the forced-colors defect RV-9 and the minor findings RV-10–RV-16; the fix-diff re-review found the residual hover-plus-open case and RV-17/RV-18. All are fixed in task 2.3.8. Chromium forced-colors re-check: bar 48px with a 1px CanvasText pseudo-edge; open+hover trigger Highlight/HighlightText; title CanvasText; focus outline HighlightText on Highlight. Final `pnpm verify` and `pnpm storybook:build` passed. Findings are recorded in [05-findings.md](05-findings.md).

## Dependencies

```
Phase 1 (AppBar shell)
    ↓
Phase 2 (AppBarButton + composed stories + visual gate)
```

Within each phase: spec tests → red phase → implementation → green phase → impl tests → stories/docs → full verification.

## Success Criteria

**Feature is complete when:**

1. ✅ All 39 tasks are `[x]`.
2. ✅ `pnpm verify` passes.
3. ✅ `pnpm storybook:build` passes; the a11y addon reports no violations.
4. ✅ The user approves the Phase 1 shell stories, then the `Geometry`, `States` and `WithLauncher` stories, the `TitleVariants` link and the 200% text-zoom check.
5. ✅ The M365 text-command contrast exception is documented in the README and the `States` caption; icon-only commands pass 3:1.
6. ✅ At 200% text-only zoom the title and command text do not clip; the bar grows if the content exceeds 48px.
7. ✅ No warnings, errors or dead code.
8. ✅ Security items are recorded as N/A with their reasons.
9. ✅ The README documents all four components, the geometry, the title semantics, truncation/zoom, localization, the contrast exception and the launcher composition.
10. ✅ The AppBar feature itself made no `AppLauncher` source or documentation changes. The separate, user-requested AppLauncher top-radius maintenance is recorded as UV-2 in [05-findings.md](05-findings.md) and its docs are updated outside this plan.
11. ✅ The feature and portfolio roadmaps show the completed stage.
12. ✅ Post-completion project re-analysis is handled by the exec-plan skill.
