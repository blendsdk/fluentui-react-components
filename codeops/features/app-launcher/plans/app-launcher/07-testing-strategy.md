# Testing Strategy: App Launcher

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type                     | Target                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| Ported component sources      | Contract-covered by the ported oracle — 36 tests in 8 files; no coverage-percentage gate change |
| Integration / composition     | Covered by the ported composition tests (grid/list inside the surface) and the composed story   |
| Visual / interaction behavior | Storybook manual checklist (jsdom has no layout)                                                |

- Test names state behavior (they are ported verbatim from the source).
- This plan adds **no** new test surface: the source's 36 tests are the immutable oracle and the
  export pin gains the new names (requirements AR #7, #12).
- E2E: N/A — the repository has no E2E harness, and this port adds no runtime behavior to exercise;
  the composed story plus its manual checklist is the substitute (recorded, not invented).

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

> These test cases ARE the ported source tests: expectations come from the frozen source contract
> (RD-01/RD-02 acceptance criteria), never from re-imagining the implementation. The IMMUTABLE
> ORACLE RULE applies in full: a failing spec test means the port is wrong — never edit the test
> (only the two whitelisted comment edits in ST-1…ST-12's file are permitted).
>
> **Cross-phase note:** ST-17, ST-22 and ST-24 render inside the launcher surface (`AppLauncher`),
> which is implemented in Phase 2 — they stay red from the Phase-1 spec step until the shell
> lands. Every other block case is shell-independent.

### Shell (RD-01; file `test/app-launcher.spec.test.tsx`, 12 tests)

| #     | Input / Scenario                                                 | Expected Behavior                                                                                                                                   | Source     |
| ----- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| ST-1  | Render the launcher closed with `Panel content` inside           | no `Panel content` text in the document                                                                                                             | RD-01 AC 1 |
| ST-2  | Click the `App launcher` trigger                                 | `Panel content` is visible                                                                                                                          | RD-01 AC 1 |
| ST-3  | Launcher with `dockTarget` bound to a rendered `<header>`; click | `Panel content` is visible after the panel opens                                                                                                    | RD-01 AC 1 |
| ST-4  | Same shell, spy on the header's `getBoundingClientRect`; click   | the spy is called (positioning reads the dock target)                                                                                               | RD-01 AC 1 |
| ST-5  | `docking="full"`; click the trigger                              | `Panel content` is visible                                                                                                                          | RD-01 AC 1 |
| ST-6  | Controlled `open={false}`; click; then rerender with `open`      | click reports `onOpenChange(event, { open: true })`, `aria-expanded="false"`, no content; after rerender `aria-expanded="true"` and content visible | RD-01 AC 1 |
| ST-7  | Panel open, focus inside; keydown Escape                         | `aria-expanded="false"`; surface content removed                                                                                                    | RD-01 AC 1 |
| ST-8  | Panel open; click `document.body`                                | surface content removed                                                                                                                             | RD-01 AC 1 |
| ST-9  | Focus the closed trigger                                         | a `tooltip` role element appears                                                                                                                    | RD-01 AC 1 |
| ST-10 | Open the panel, then focus the trigger                           | no `tooltip` role appears within the 600 ms window                                                                                                  | RD-01 AC 1 |
| ST-11 | Pass `trigger={<button>Custom trigger</button>}`                 | no `App launcher` button; `Custom trigger` button present                                                                                           | RD-01 AC 1 |
| ST-12 | With the custom trigger, click it                                | `Panel content` is visible                                                                                                                          | RD-01 AC 1 |

### Trigger (RD-01; file `test/app-launcher-trigger.spec.test.tsx`, 2 tests)

| #     | Input / Scenario                         | Expected Behavior                                                        | Source     |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------ | ---------- |
| ST-13 | `<AppLauncherTrigger />`                 | button named `App launcher`, empty text content, exactly one `svg` child | RD-01 AC 2 |
| ST-14 | `<AppLauncherTrigger label="Applaus" />` | button named `Applaus`                                                   | RD-01 AC 2 |

### Search (RD-02; file `test/app-launcher-search.spec.test.tsx`, 4 tests)

| #     | Input / Scenario                                                           | Expected Behavior                                                                             | Source     |
| ----- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------- |
| ST-15 | `<AppLauncherSearch label="Search apps" />`                                | `searchbox` named `Search apps` with placeholder `Search`                                     | RD-02 AC 3 |
| ST-16 | Type `mail` into the field                                                 | `onChange(event, { value: 'mail' })`                                                          | RD-02 AC 3 |
| ST-17 | Open launcher with controlled value `mail`; Escape once, then Escape again | first: value `''` and `aria-expanded="true"`; second: `aria-expanded="false"`, searchbox gone | RD-02 AC 3 |
| ST-18 | Document-level keydown listener; clearing Escape, then a second Escape     | clearing Escape does not reach the listener; the second does (once)                           | RD-02 AC 3 |

### Section / Grid / List (RD-02; 2 tests each)

| #     | Input / Scenario                                      | Expected Behavior                                  | Source     |
| ----- | ----------------------------------------------------- | -------------------------------------------------- | ---------- |
| ST-19 | Titled `divider` section holding a grid with one item | title text visible; item button visible            | RD-02 AC 4 |
| ST-20 | Section without a title                               | its content button is visible                      | RD-02 AC 4 |
| ST-21 | Grid with three items                                 | one `list`, three `listitem`s, item button `Mail`  | RD-02 AC 4 |
| ST-22 | Grid inside the launcher surface; open the panel      | item button `Mail` visible after the trigger click | RD-02 AC 4 |
| ST-23 | List with three items                                 | one `list`, three `listitem`s                      | RD-02 AC 4 |
| ST-24 | List inside the launcher surface; open the panel      | item button `Mail` visible after the trigger click | RD-02 AC 4 |

### Item (RD-02; file `test/app-launcher-item.spec.test.tsx`, 9 tests)

| #     | Input / Scenario                                  | Expected Behavior                                                            | Source     |
| ----- | ------------------------------------------------- | ---------------------------------------------------------------------------- | ---------- |
| ST-25 | Item with label and icon                          | textContent `Mail`; one `svg`                                                | RD-02 AC 1 |
| ST-26 | Item without icon                                 | no `svg`                                                                     | RD-02 AC 1 |
| ST-27 | Click the item                                    | `onClick` called once                                                        | RD-02 AC 1 |
| ST-28 | `disabled` item                                   | button carries the native `disabled` attribute                               | RD-02 AC 1 |
| ST-29 | `disabledFocusable` item                          | `aria-disabled="true"`, no native `disabled`, focus lands on the button      | RD-02 AC 1 |
| ST-30 | `disabledFocusable` item clicked                  | `onClick` not called                                                         | RD-02 AC 1 |
| ST-31 | `disabled` item focused and clicked               | focus does not land on the button; `onClick` not called                      | RD-02 AC 1 |
| ST-32 | Item with both `disabled` and `disabledFocusable` | focusable, `aria-disabled="true"`, no native attribute, `onClick` not called | RD-02 AC 1 |
| ST-33 | `disabledFocusable` item with Enter keydown/keyup | `onClick` not called                                                         | RD-02 AC 1 |

### Item internals (RD-02; file `test/app-launcher-item.impl.test.tsx`, 3 tests)

| #     | Input / Scenario                                            | Expected Behavior                                      | Source     |
| ----- | ----------------------------------------------------------- | ------------------------------------------------------ | ---------- |
| ST-34 | The same item inside `AppLauncherGrid` vs `AppLauncherList` | the rendered class names differ (tile vs row)          | RD-02 AC 2 |
| ST-35 | Icon item enabled vs disabled                               | the disabled item's icon box carries the dimming class | RD-02 AC 2 |
| ST-36 | Icon item `disabled` vs `disabledFocusable`                 | identical icon-box class names (same dimming)          | RD-02 AC 2 |

### Export surface (both RDs; file `test/package-exports.spec.test.ts`)

| #     | Input / Scenario                        | Expected Behavior                                                                                                                                                                                                          | Source                  |
| ----- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| ST-37 | `import * as api` from the package root | `Object.keys(api)` equals exactly the sorted 15-entry list (8 existing + the 7 launcher components; after Phase 1: 13 entries); the nine launcher type pins compile (Phase 1: six block types; Phase 2: three shell types) | RD-01 AC 3 · RD-02 AC 5 |

## Test Categories

### Specification Tests (from ST-cases above)

| Test File                                 | ST Cases    | Component                      |
| ----------------------------------------- | ----------- | ------------------------------ |
| `test/app-launcher.spec.test.tsx`         | ST-1…ST-12  | `AppLauncher` (Phase 2)        |
| `test/app-launcher-trigger.spec.test.tsx` | ST-13…ST-14 | `AppLauncherTrigger` (Phase 2) |
| `test/app-launcher-search.spec.test.tsx`  | ST-15…ST-18 | `AppLauncherSearch` (Phase 1)  |
| `test/app-launcher-section.spec.test.tsx` | ST-19…ST-20 | `AppLauncherSection` (Phase 1) |
| `test/app-launcher-grid.spec.test.tsx`    | ST-21…ST-22 | `AppLauncherGrid` (Phase 1)    |
| `test/app-launcher-list.spec.test.tsx`    | ST-23…ST-24 | `AppLauncherList` (Phase 1)    |
| `test/app-launcher-item.spec.test.tsx`    | ST-25…ST-33 | `AppLauncherItem` (Phase 1)    |
| `test/package-exports.spec.test.ts`       | ST-37       | Package root (both phases)     |

### Implementation Tests (edge cases, internals)

| Test File                              | Description                                    | Priority |
| -------------------------------------- | ---------------------------------------------- | -------- |
| `test/app-launcher-item.impl.test.tsx` | Layout-context wiring and icon-dimming classes | High     |

### Integration Tests

| Test                                 | Components                                        | Description                                                    |
| ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------- |
| Grid/List composition (ST-21, ST-23) | `AppLauncherGrid`/`List` + `Item` + `AppLauncher` | The ported tests open the shell and reach the block inside it. |

### End-to-End Tests

| Scenario | Steps | Expected Result                                                                                                                                                             |
| -------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N/A      | —     | No E2E harness exists and the port adds no runtime behavior; the composed `AppLauncher` story plus its manual checklist covers the visual and interaction behavior instead. |

### Security Tests

N/A — the ported components are presentation-only: no input validation surface, no network, no
auth, no storage, no crypto, no secrets (RD-01/RD-02 §Security Considerations). The port-specific
security check is Success Criterion 5 of the execution plan: no new dependency enters the
manifest and the security posture is unchanged (AR #15 req).

## Test Data

### Fixtures Needed

- None beyond the tests' own inline elements: every ported test renders its own small tree inside
  `FluentProvider` (the source pattern), with `@fluentui/react-icons` for icon cases.
- The story files carry their own local sample data (app lists, logos); it is not test data.

### Mock Requirements

- None — real Fluent UI rendering in jsdom, matching the source suite; no mocks were used there and
  none are added here.

## Verification Checklist

- [ ] All specification test cases (ST-*) are the ported source tests with sources traced above
- [ ] Spec test files are ported BEFORE the sources (per phase) and the red phase is recorded
- [ ] Spec tests pass unchanged after implementation (green phase; only the two whitelisted comment edits in `app-launcher.spec.test.tsx`)
- [ ] Implementation tests ported and passing
- [ ] No regressions in the existing suite (the full `pnpm test` run stays green)
- [ ] `pnpm verify` passes after every phase; `pnpm storybook:build` passes in story phases
- [ ] The normalized-diff gate recorded per phase (AR P3)
- [ ] The manual Storybook checklist recorded (docking, sticky search, tooltip, hover lift, keyboard)
