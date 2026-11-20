## Preflight Report: AppBar Implementation Plan

> **Status**: ✅ PREFLIGHT PASSED WITH NOTES — 8 resolved, 14 accepted, 4 observations
> **Iteration**: 1 (first scan) + focused verification of the applied fixes
> **Artifact**: Implementation plan at `codeops/features/app-bar/plans/app-bar/`
> **Codebase Grounded**: 24 source/test/config files examined; every referenced path, token and Fluent behavior verified
> **Last Updated**: 2026-11-20 13:15
> **Same-session review**: ⚠️ The plan was authored in this session. Five independent auditor subagents and one design challenger were used to counter same-agent bias.

### Codebase Context Summary

**Tech stack:** pnpm monorepo, React 19.3, Fluent UI `@fluentui/react-components` 9.74.9, TypeScript 7.0.2, Griffel, Vitest 5 with jsdom, Testing Library, Storybook 10.

**Architecture:** the package has one publishable workspace, `packages/react-components`. Components follow the shell / types / state hook / render / Griffel styles / barrel anatomy. The existing `AppLauncher` family already supports a custom trigger, `dockTarget`, controlled open state and `aria-expanded`. The fui9 appbar is a reference only.

**Key files examined:**

- `packages/react-components/src/components/AppLauncher/` (types, render, styles, trigger)
- `packages/react-components/src/components/AppLauncher/stories/AppLauncherStoryApps.story.tsx:245-260`
- `packages/react-components/src/components/CollapsibleSection/`
- `packages/react-components/src/index.ts`, `test/package-exports.spec.test.ts`, `test/app-launcher.spec.test.tsx`
- `packages/react-components/.storybook/preview.tsx`, `package.json`, `vite.config.ts`, `vitest*.config.ts`
- `skills/fluentui-components/references/component-anatomy.md`
- installed Fluent `Button` styles, `PopoverTrigger` and `Griffel` constants

**Reference verification:** 40+ paths, imports, tokens and behaviors checked. All named tokens exist. `PopoverTrigger` injects `aria-expanded` in Fluent 9.14.9. The fui9 citations are accurate. The two failures are the `Omit<ButtonProps>` union and the `Ref<HTMLElement>` invariance.

### Summary by dimension

| #   | Dimension              | Findings | Highest severity |
| --- | ---------------------- | -------- | ---------------- |
| 1   | Ambiguities            | 1        | 🟠 MAJOR         |
| 2   | Implicit assumptions   | 5        | 🔴 CRITICAL      |
| 3   | Logical contradictions | 4        | 🔴 CRITICAL      |
| 4   | Completeness gaps      | 4        | 🟡 MINOR         |
| 5   | Dependency issues      | 0        | —                |
| 6   | Feasibility concerns   | 4        | 🔴 CRITICAL      |
| 7   | Testability            | 3        | 🟡 MINOR         |
| 8   | Security blind spots   | 0        | —                |
| 9   | Edge cases             | 4        | 🟡 MINOR         |
| 10  | Scope creep            | 0        | —                |
| 11  | Ordering & sequencing  | 2        | 🟡 MINOR         |
| 12  | Consistency            | 4        | 🟠 MAJOR         |
| 13  | Codebase alignment     | 6        | 🔴 CRITICAL      |

### Summary by severity

| Severity    | Count | Status              |
| ----------- | ----- | ------------------- |
| CRITICAL    | 2     | 0 resolved, 2 open  |
| MAJOR       | 6     | 0 resolved, 6 open  |
| MINOR       | 14    | 0 resolved, 14 open |
| OBSERVATION | 4     | 0 resolved, 4 open  |

---

## CRITICAL findings

### PF-001: `AppBarButton` public type cannot be implemented as written 🔴 CRITICAL

**Dimension:** Implicit assumptions / logical contradiction / codebase alignment
**Location:** `03-04-app-bar-button.md` §State hook, §Render; RD-02 §Public API and DOM table
**Codebase evidence:** `ButtonProps` is a conditional button/anchor union. `Omit<ButtonProps, …>` is non-distributive, so `href` disappears, `type` widens to `string`, and `as` survives. The plan’s render always forces `type`, the state ref is `HTMLButtonElement`, and no ST or story exercises an anchor. The repo’s `AppLauncherTrigger.types.ts:14` uses the button-only pattern.

**Problem:** The plan’s core type does not compile. `rootProps` spreads a union into Fluent `Button` (TS2322), `type` cannot be assigned to the narrow state type, and an `href` caller gets a `<button href>` that does not navigate. The RD’s anchor sentence is unreachable.

**Options:**

| Option | Description                                                                                                                                                                                 | Pros                                                                         | Cons                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| A      | Button-only: `ComponentPropsWithoutRef<'button'>` + explicit `icon`, `iconPosition`, `disabledFocusable`, `type?: 'button' \| 'submit' \| 'reset'`, accessible-name union; omit `as`/`href` | Smallest, matches the launcher-trigger use case and repo precedent; compiles | Removes an RD-02 sentence and the link-command variant |
| B      | Full anchor support: discriminated `as` union, no forced `type` on anchors, `Ref<HTMLButtonElement \| HTMLAnchorElement>`, anchor tests                                                     | Supports navigational commands                                               | Expands API, tests and scope beyond AR-07/AR-17        |
| C      | Distributive `Omit<ButtonProps, …>` and both roots                                                                                                                                          | Keeps Fluent’s full surface                                                  | Largest; still needs anchor tests and a ref union      |

**Recommendation:** Option A. The bar’s commands are actions; the title already owns navigation. Correct RD-02 M1 and its DOM table if A is chosen.
**Challenger verdict:** A — button-only native contract; B would need explicit scope approval.
**User Decision:** Resolved — see User rulings.

### PF-002: `AppBarTitle` link class is defined but never applied 🔴 CRITICAL

**Dimension:** Logical contradiction / codebase alignment
**Location:** `03-02-app-bar-title.md` §Render, §Class names, §Styles
**Codebase evidence:** the render computes `className = mergeClasses(state.classes.root, state.rootProps.className)` and uses it in all three branches. `state.classes.link` is returned by the hook but never read. The link class carries `textDecorationLine: 'none'`, `:hover underline` and the white `:focus-visible` outline.

**Problem:** The link renders with the browser’s underline and default focus, failing RD-01 AC6. The plan’s own impl check (“link class only in link mode”) would fail. `TitleVariants` is not one of the three formal approval stories, so the defect can reach the user review.

**Options:**

| Option | Description                                                                              | Pros                                         | Cons                                                    |
| ------ | ---------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| A      | Merge `state.classes.link` in the link branch and add an impl assertion                  | Smallest; preserves the declared class shape | One more class in the link branch                       |
| B      | Fold the link rules into `root` when the hook is in link mode; remove the separate class | One class                                    | Changes the class contract and impl test; less explicit |
| C      | Leave to the executor                                                                    | —                                            | Ships the defect                                        |

**Recommendation:** Option A; add the link variant to the manual checklist and a focused impl assertion.
**Challenger verdict:** A — merge `classes.link` in the link branch.
**User Decision:** Resolved — see User rulings.

---

## MAJOR findings

### PF-003: `AppBarTitle`’s `Ref<HTMLElement>` cannot attach to the heading and anchor roots 🟠 MAJOR

**Dimension:** Feasibility / codebase alignment
**Location:** `03-02-app-bar-title.md` §State hook, §Render
**Codebase evidence:** React 19 ref objects are invariant. `Ref<HTMLElement>` is not assignable to `Ref<HTMLHeadingElement>` or `Ref<HTMLAnchorElement>`; the span case passes only because `HTMLSpanElement` is structurally compatible. The plan’s own `type-check` would fail.

**Options:**

| Option | Description                                                                                                                                  | Pros                                                       | Cons                                         |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| A      | Convert to a stable callback ref `(node: HTMLElement \| null) => void` that forwards to the public `Ref<HTMLElement>`; wrap in `useCallback` | Compiles; keeps the public `HTMLElement` contract; no cast | One adapter in the hook                      |
| B      | Type the state/public ref as a union of span/heading/anchor refs                                                                             | Matches the DOM                                            | Breaks consumers using `useRef<HTMLElement>` |
| C      | Cast                                                                                                                                         | Short                                                      | Forbidden by the no-unsafe-cast rule         |

**Recommendation:** Option A. Also change the state to a discriminated text/heading/link union so `rootProps` does not collapse through `Omit` on a union.
**Challenger verdict:** A — stable callback adapter; B changes the public contract; C is forbidden.
**User Decision:** Resolved — see User rulings.

### PF-004: Text-zoom growth is unachieved and unverified 🟠 MAJOR

**Dimension:** Ambiguities / completeness / testability
**Location:** `03-02` styles; `03-04` styles; `07` manual checklist; RD-01 AC3
**Codebase evidence:** the title and button use a fixed `lineHeightBase300` (20px) and `overflow: hidden`. At 200% text-only zoom the font is 28px while the line box stays 20px; a Chromium render gives `clientHeight 20` / `scrollHeight 25` and the glyphs clip. The bar’s `min-height: 48px` does not fix the line box. The checklist has no zoom step.

**Problem:** RD-01 AC3 cannot pass, and no gate checks it. The normal 14px/20px M365 look is fine; the failure is text-only zoom.

**Options:**

| Option | Description                                                                                                                              | Pros                                                | Cons                                                                         |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| A      | Use unitless `line-height: 1.4286` (20px at 14px) for title and button text; add a 200% text-only zoom step; record the literal in AR-13 | Normal look unchanged; line box scales; no clipping | One documented literal; AC wording changes from “bar grows” to “no clipping” |
| B      | Keep the fixed line-height and add block padding/min-height                                                                              | Smaller CSS change                                  | Does not fix the line box; clipping depends on the zoom level                |
| C      | Clarify AC3 as page zoom only                                                                                                            | No code change                                      | Contradicts “text zoom” and AR-11                                            |

**Recommendation:** Option A. The checklist should say “200% text-only zoom: no clipping”; the bar may stay 48px because a 40px line box fits.
**Challenger verdict:** A, with an AR-13 note; C would be a requirement change.
**User Decision:** Resolved — see User rulings.

### PF-005: White text on the M365 overlays is below WCAG AA 🟠 MAJOR

**Dimension:** Implicit assumption / codebase alignment
**Location:** `03-04` state table; RD-02 state table; `07` checklist
**Codebase evidence:** `webLightTheme`: `colorBrandBackground #0f6cbd`, `colorNeutralForegroundOnBrand #ffffff`. White on the 12% overlay is 4.29:1; on the 22% overlay it is 3.58:1. The text is 14px regular, so AA needs 4.5:1. Icon-only commands pass the 3:1 non-text threshold in every state.

**Problem:** Text commands fail AA on hover, press and open. The a11y addon checks the resting state; the manual checklist does not measure transient contrast. The user explicitly asked for the M365 look.

**Options:**

| Option | Description                                                                                                                   | Pros                                                   | Cons                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| A      | Keep the 12%/22% overlays and document an explicit text-command contrast exception; icon-only remains the primary bar command | Exact M365 look; the launcher passes; no visual change | Text labels on transient states are below AA; needs a recorded risk acceptance                       |
| B      | Use darker brand hover/pressed tokens (about 6.7:1 / 11.7:1) or weaker overlays for text commands                             | AA passes for text                                     | Hover becomes darker, not M365; weaker overlays make hover/press nearly identical; AR-17 re-approval |
| C      | Restrict `AppBarButton` to icon-only                                                                                          | AA by construction                                     | Removes the approved text and icon+text variants                                                     |

**Recommendation:** Option A if the M365 look is the priority; Option B if AA is mandatory for text labels. The user must rule. Record the decision in the README and the `States` caption, not only in code.
**Challenger verdict:** A with a mandatory user ruling; B is the fallback if AA is mandatory; C removes approved scope.
**User Decision:** Resolved — see User rulings.

### PF-006: Open and keyboard-pressed states are not deterministic 🟠 MAJOR

**Dimension:** Codebase alignment / visual states
**Location:** `03-04` §Styles
**Codebase evidence:** the open selector and the hover selector both compute to specificity `(0,5,0)`; the winner depends on atomic stylesheet insertion order, so an open+hovered button can fall back to 12%. The pressed rule is `:hover:active`; Fluent’s `:active:focus-visible` `(0,3,0)` paints the neutral pressed background for keyboard activation. The open selector already excludes disabled states.

**Problem:** The launcher trigger can show 12% while open, and keyboard Space shows the neutral Fluent background instead of 22%. Both violate the user’s explicit M365 state request.

**Options:**

| Option | Description                                                                                                                                                                                   | Pros                      | Cons                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------- |
| A      | Add a higher-specificity hover+open rule (e.g. `:hover[aria-expanded="true"]`) and an `:active:focus-visible` pressed rule with the 22% background; exclude disabled; verify both in `States` | Deterministic M365 states | A few more selectors               |
| B      | Rely on source order; add only the keyboard rule                                                                                                                                              | Smaller                   | Open+hover remains order-dependent |
| C      | Accept Fluent’s neutral keyboard press                                                                                                                                                        | No work                   | Visible regression against AR-17   |

**Recommendation:** Option A.
**Challenger verdict:** A — higher-specificity hover+open plus keyboard active rule.
**User Decision:** Resolved — see User rulings.

### PF-007: Focus rule does not reset Fluent’s 1px border, and `borderWidth` is unsupported by Griffel 🟠 MAJOR

**Dimension:** Codebase alignment / visual focus
**Location:** `03-04` base and focus rules
**Codebase evidence:** Fluent’s `[data-fui-focus-visible]` sets `border-color: colorStrokeFocus2` (black), `border-width: 1px` and `border-radius: medium`. The plan’s focus rule sets only `box-shadow`/`outline`, so the dark border survives. Worse, Griffel’s `UNSUPPORTED_CSS_PROPERTIES` includes `borderWidth` and `borderColor`; the plan’s `borderWidth: 0` is logged and skipped. `border: 'none'` is supported and already used in `Loading` and `TileGrid`.

**Problem:** Focus shows a dark 1px edge under the white inset ring instead of only the ring, and the base border removal is not applied at all. RD-02 AC1/AC6 fail visually.

**Options:**

| Option | Description                                                                                                                 | Pros                                            | Cons                        |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------- |
| A′     | Use `border: 'none'` and `borderRadius: 0` in the base and focus rules; verify computed border width and no Griffel warning | Supported; removes the edge; matches the target | None material               |
| B      | Accept the 1px dark border                                                                                                  | No work                                         | Fails the M365 focus target |
| C      | Use Fluent’s border as the indicator                                                                                        | No custom rules                                 | Not the white 2px ring      |

**Recommendation:** Option A′. The literal `borderWidth` removal in the plan would not work.
**Challenger verdict:** A′ — `border: 'none'` longhand reset, not the unsupported `borderWidth`/`borderColor` shorthands.
**User Decision:** Resolved — see User rulings.

### PF-008: ST ranges in the component specs contradict §07 🟠 MAJOR

**Dimension:** Consistency / traceability
**Location:** `03-02` (ST-7..ST-14), `03-03` (ST-15..ST-17), `03-04` (ST-18..ST-29); authoritative `07` (ST-7..ST-13, ST-14..ST-15, ST-16..ST-26)
**Codebase evidence:** `07` and `99` agree; the component specs cite one/two too many and include nonexistent ST-27..ST-29. `01` also calls all ST cases “spec tests” although ST-13 and ST-26 are type tests.

**Problem:** A spec author following the component docs can write the wrong cases into the immutable oracle.

**Options:**

| Option | Description                                                                                     | Pros                  | Cons                           |
| ------ | ----------------------------------------------------------------------------------------------- | --------------------- | ------------------------------ |
| A      | Align the three component specs to `07`; update the acceptance wording to “spec and type tests” | Three line edits      | None                           |
| B      | Renumber `07` and all references                                                                | Keeps the old numbers | Large churn; new mismatch risk |

**Recommendation:** Option A.
**Challenger verdict:** A — §07 and the execution plan are the authority.
**User Decision:** Resolved — see User rulings.

---

## MINOR findings

| ID     | Finding                                                                       | Location                                           | Recommendation                                                                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PF-009 | Phase 1 claims strict RD-01 but defers the `Geometry`/narrow story to Phase 2 | `99` Phase 1, 1.3.2, 2.3.3; `03-01` story note     | Add a shell-only `Geometry` story with 48px placeholder blocks and a narrow title case in Phase 1; the user can check the geometry before the button exists.                                    |
| PF-010 | README task is weaker than RD-01 AC10                                         | `99` 1.3.5, Success #7                             | Expand the task and success criterion to name the geometry, title semantics, truncation/zoom and localization content.                                                                          |
| PF-011 | Phase expected modification sets omit the export pin and shell folders        | `99` Phase 1/2 scope blocks                        | Add `test/package-exports.spec.test.ts` to both; allow 2.3.8 to touch any AppBar family source.                                                                                                 |
| PF-012 | ST-12 asserts truncation classes; ST-25 asserts “AppLauncher is unchanged”    | `07` ST-12, ST-25                                  | ST-12: assert full `textContent` + computed `white-space`/`overflow`/`text-overflow`; ST-25: assert panel opens and `aria-expanded="true"`, drop “unchanged” and add a final diff review check. |
| PF-013 | Export pin is updated after green although it is a `.spec.test` file          | `99` 1.3.6, 2.3.5                                  | Move the pin additions into the spec steps and run them red; keep the pin as the export contract.                                                                                               |
| PF-014 | Geometry story task does not require the dashed outlines/ruler                | `99` 2.3.3; `03-04` story note                     | Add the measurement aids to the story task and description.                                                                                                                                     |
| PF-015 | A11y addon check is not named in the visual gate or success criteria          | `07` checklist; `99` 2.3.7/2.3.8                   | Name “a11y addon: no violations” in the visual gate and success criteria.                                                                                                                       |
| PF-016 | Accessible-name union accepts `children={null}` / `aria-label=""`             | `03-04` public API; RD-02                          | Use `children: NonNullable<ReactNode>` in the with-children branch; document that empty text/labels are invalid; add type/impl tests.                                                           |
| PF-017 | Type-only omissions are not runtime guards; heading level 7 crashes           | `03-01`/`03-02`/`03-03`/`03-04` error tables       | Correct the wording to “type-level”; add `HEADING_ELEMENTS[level] ?? HEADING_ELEMENTS[1]`; document the TS-only guarantee.                                                                      |
| PF-018 | Manual checklist omits RTL and forced-colors                                  | `07` checklist                                     | Add `dir="rtl"` and forced-colors emulation steps; add a forced-colors focus fallback only if the ring is lost.                                                                                 |
| PF-019 | Nested link is documented as “Allowed” in `AppBarTitle`                       | `03-02` error table                                | Document link mode as plain/non-interactive children; a nested link is invalid in link mode.                                                                                                    |
| PF-020 | Deferred-list AR refs drift in `01-requirements`                              | `01` deferred list                                 | Neutral appearance → AR-03; tooltip/configurable → AR-07; toggle/split/menu → AR-01.                                                                                                            |
| PF-021 | `03-01` style table omits `gap: 0`, border, shadow and radius                 | `03-01` §Styles                                    | Add the explicit values from RD-01 so the table is the full layout contract.                                                                                                                    |
| PF-022 | Story matrix authority is split between §07 and the component specs           | `00-ambiguity-register` P-04; `07`; component docs | Add the full story matrix to §07 or change P-04 to “§07 and the component specs.”                                                                                                               |

## OBSERVATIONS

| ID     | Observation                                                                    | Recommendation                                                                                                                |
| ------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| PF-023 | `storybook:build` compiles the story bundle; it does not render every story    | Reword the task verify to “compiles/bundles”; the runtime check is the Storybook review.                                      |
| PF-024 | No explicit roadmap task; the exec-plan skill owns the sync                    | Rely on the skill; verify both roadmap rows at completion.                                                                    |
| PF-025 | `data-fui-focus-visible` is a Fluent internal attribute, not a public contract | Document the dependency and keep the `States` focus check; a `:focus-visible` qualifier is the fallback if Fluent changes it. |
| PF-026 | `codeops/specialist-check.json` is dated 2026-10-22 and predates this plan     | Re-run the specialist check before execution and record the result in `00-index.md` and the feature roadmap.                  |

---

## Challenger verdicts (MAJOR batch)

One independent design challenger reviewed PF-001..PF-008 without the parent’s preferred options. It selected:

| Finding | Verdict                                                                            |
| ------- | ---------------------------------------------------------------------------------- |
| PF-001  | A — button-only native contract; anchor support would be extra scope               |
| PF-002  | A — merge `classes.link` in the link branch                                        |
| PF-003  | A — stable callback ref on `HTMLElement`                                           |
| PF-004  | A — unitless `1.4286`; no-clipping check; AR-13 note                               |
| PF-005  | A — keep the M365 overlays with an explicit user ruling; B if AA is mandatory      |
| PF-006  | A — higher-specificity hover+open plus `:active:focus-visible`                     |
| PF-007  | A′ — `border: 'none'` + `borderRadius: 0`; `borderWidth` is unsupported by Griffel |
| PF-008  | A — align the component specs to §07                                               |

## User rulings (2026-11-20)

| Decision                                                   | Ruling                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppBarButton` contract (PF-001)                           | **Button-only** — `as` and `href` are not part of the API; `AppBarTitle` owns navigation. RD-02 and 03-04 corrected.                                                                                                                                                                                                                   |
| Text-command contrast (PF-005)                             | **Keep the M365 12%/22% overlays** with a documented text-command AA exception; icon-only commands pass 3:1. The exception is recorded in the README and the `States` caption.                                                                                                                                                         |
| Text-zoom handling (PF-004)                                | **Unitless `1.4286` line-height** for title and button text; 200% text-only no-clipping check added; normal 14px/20px look unchanged.                                                                                                                                                                                                  |
| Remaining plan corrections (PF-002, PF-003, PF-006–PF-008) | **Accepted as recommended** — link class merge, callback ref, open/pressed selectors, `border: 'none'` focus reset, ST alignment.                                                                                                                                                                                                      |
| Minor and observation findings (PF-009–PF-026)             | **Accepted as recommended** — Phase 1 shell Geometry, README scope, expected sets, oracle wording, export-pin ordering, geometry aids, a11y gate, empty-name guard, runtime wording, RTL/forced colors, nested link, AR refs, style table, story matrix, build wording, roadmap ownership, internal focus attribute, specialist check. |

## Re-scan evidence

The accepted fixes were applied in this pass. Focused verification:

- RD-02 is button-only; the public type uses `ComponentPropsWithoutRef<'button'>`; `as`/`href` are documented as out of scope.
- 03-02 merges `state.classes.link`; the state uses a `RefCallback<HTMLElement>` and a discriminated text/heading/link union.
- 03-02/03-04 use unitless `1.4286`; the checklist has a 200% text-only zoom step.
- 03-04 uses `border: 'none'` (not the Griffel-unsupported `borderWidth`), resets the focus border/radius, adds the hover+open and `:active:focus-visible` rules.
- 03-02/03/04 ST ranges match §07 (ST-7..13, ST-14..15, ST-16..26).
- The execution plan is 38 tasks, with the export pin in the spec steps, a Phase 1 shell review, a Phase 2 visual gate, a11y, zoom, contrast, and the AppLauncher diff check.
- The preflight report, plan and RDs were format-checked and link-checked.

The specialist check observation (PF-026) remains a pre-execution task: re-run it and record the result in `00-index.md` and the feature roadmap.

## Next steps

1. Re-run the specialist check and record the result.
2. Update the feature and portfolio roadmaps to `Plan Preflighted`.
3. Start Phase 1 spec-author tasks with the corrected ST ranges.
4. Stop after the Phase 1 shell stories for the user's visual review, then continue to Phase 2.
