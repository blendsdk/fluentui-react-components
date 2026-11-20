# Requirements: AppBar

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-01](../../requirements/RD-01-app-bar-shell.md) and
> [RD-02](../../requirements/RD-02-app-bar-commands.md) — the OWNING requirements documents

## Scope of this plan (delta view)

### In this plan

- RD-01 AC1 — semantic `<header>`, banner landmark, optional name, forwarded ref and native props.
- RD-01 AC2 — 48px minimum height, zero bar padding/gap, brand surface and flush geometry.
- RD-01 AC3 — 200% text-only zoom without clipping; the bar grows if the content exceeds 48px.
- RD-01 AC4 — `AppBarTitle` span / heading / link roots; no forced `h1`.
- RD-01 AC5 — title typography, 8px inset, truncation and full text in the DOM.
- RD-01 AC6 — link hover/focus and the heading-XOR-link type contract.
- RD-01 AC7 — `AppBarSpacer` flex behavior, no children, no accessible content.
- RD-01 AC8 — no implicit restyling of arbitrary bar children.
- RD-01 AC9 — shell exports, export pin and `pnpm verify` / `pnpm storybook:build`.
- RD-01 AC10 — README sections for the shell.
- RD-01 AC11 — no `AppLauncher` changes.
- RD-01 AC12 — security recorded as N/A.
- RD-02 AC1 — button-only `AppBarButton` base rendering, type default and 48px target; `as` and `href` are not part of the API.
- RD-02 AC2 — text/icon-only accessible names and click activation.
- RD-02 AC3 — the accessible-name union and forced-prop omissions are type errors.
- RD-02 AC4 — ref, class merge and native props.
- RD-02 AC5 — disabled and `disabledFocusable` behavior.
- RD-02 AC6 — hover, pressed/open, keyboard press, focus and muted disabled states, with the
  documented M365 text-command contrast exception.
- RD-02 AC7 — launcher composition with `dockTarget` and `aria-expanded`.
- RD-02 AC8 — `Geometry` and `States` stories show the required measurements and states.
- RD-02 AC9 — the user approves the visual stories.
- RD-02 AC10 — button exports, export pin and `pnpm verify` / `pnpm storybook:build`.
- RD-02 AC11 — README button and composition sections.
- RD-02 AC12 — no `AppLauncher` changes.
- RD-02 AC13 — security recorded as N/A.

### Deferred / out of this plan

- Tab strip, tab panels or the fui9 drawer tabs — separate navigation feature (AR-01).
- Sticky positioning, overflow menu or responsive command collapsing — AR-09; neutral appearance — AR-03.
- Built-in tooltips and configurable appearance/shape/size — AR-07; toggle/split/menu button variants — AR-01.
- Link commands (`as`/`href`) — the user chose button-only (PF-001); `AppBarTitle` owns navigation.
- `AppLauncher` source or documentation changes — AR-10.
- Browser, performance or SSR test suites — AR-14.
- Release/publish — AR-16.

## Plan-local decisions

| Decision               | Chosen                                                                                      | AR Ref       |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------------ |
| Component folder names | `AppBar`, `AppBarTitle`, `AppBarSpacer`, `AppBarButton`                                     | AR-04        |
| Spec test split        | One spec file per component; type tests for the title and button unions                     | AR-14        |
| Impl test split        | `app-bar.impl.test.tsx` for the shell family; `app-bar-button.impl.test.tsx` for the button | AR-14        |
| Story files            | One story file per component; the composed M365 scenarios live in `AppBar.stories.tsx`      | AR-14, AR-18 |
| Verify command         | `pnpm verify`; visual build check `pnpm storybook:build`                                    | AGENTS.md    |
| Test environment       | Vitest/jsdom, Testing Library, `FluentProvider` with `webLightTheme`                        | AR-14        |
| Visual gate            | User approval of the Phase 1 shell stories, then `Geometry`, `States` and `WithLauncher`    | AR-18        |
| Button contract        | Button-only; no `as`/`href`; AppBarTitle owns navigation                                    | PF-001       |
| Text contrast          | Keep the 12%/22% M365 overlays; documented text-command exception; icon-only passes 3:1     | PF-005       |
| Text zoom              | Unitless `1.4286` line-height; 200% text-only no-clipping check                             | PF-004       |

## Acceptance Criteria

1. [ ] All ST cases in [07-testing-strategy.md](07-testing-strategy.md) are implemented as spec
       and type tests and pass without modifying their expectations.
2. [ ] The shell and button implementation tests pass.
3. [ ] The package export pin lists all four components and four props types.
4. [ ] `pnpm verify` passes.
5. [ ] `pnpm storybook:build` passes.
6. [ ] The user approves the Phase 1 shell stories, then the `Geometry`, `States` and
       `WithLauncher` stories, or the corrections are applied and re-reviewed.
7. [ ] The README documents the four components, the geometry, the title semantics,
       truncation/zoom, localization and the launcher composition.
8. [ ] No `AppLauncher` source or documentation changes.
9. [ ] The a11y addon reports no violations.
10. [ ] The final diff review confirms no `AppLauncher` source or documentation change.
