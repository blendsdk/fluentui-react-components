# app-bar — Requirements Documents

> **Feature**: app-bar — a brand application header for Fluent UI v9 that composes the existing
> `AppLauncher` and provides M365-style on-brand command states
> **Status**: Draft
> **Created**: 2026-11-20
> **Architecture**: React 19 + Fluent UI v9 (`@fluentui/react-components` 9.74), TypeScript,
> Griffel styling with design tokens, Vitest + Testing Library, Storybook 10
> **CodeOps Artifact Schema**: 1

---

## Overview

The package has no application header. Applications currently hand-write a `<header>` and
hand-style a launcher trigger for the brand surface, because Fluent's transparent `Button`
repaints its foreground with neutral hover colors that disappear on a brand-colored bar. The
fui9 package contains an `AppBar` family, but it is a thin `<header>` built on the BlendSDK slot
framework, it has no tests or stories of its own, and its launcher and tab implementations are
drafts rather than reusable contracts.

This feature adds a small, deliberate AppBar family: `AppBar` (the semantic brand header),
`AppBarTitle` (the product or application name), `AppBarSpacer` (the flex layout helper) and
`AppBarButton` (the on-brand command button). The family reuses the existing, fully tested
`AppLauncher`; it does not port, wrap or modify it. The visual target is the Microsoft 365
application bar: a 48px brand surface, a 48×48 waffle trigger flush with the leading edge, a
14px semibold title, and white command icons with a 12% white hover, a 22% white pressed/open
state, a visible white focus ring and muted disabled states.

The feature is additive. It adds four components and their props types to the package root,
four story files, four specification test files, implementation tests, and README sections. It
does not change `AppLauncher`, does not add dependencies, and does not publish a release.

## Minimum-Sufficient Baseline

**Original goal:** give applications a reusable, accessible brand application header that looks
and behaves like the Microsoft 365 bar and works with the existing launcher.

**Smallest viable design:** four small presentational components in the repository's existing
component anatomy, using Fluent `Button` and design tokens. The bar is a flex `<header>`; the
title is a wrapped text element with optional heading or link semantics; the spacer is a flex
div; the button is a styled Fluent `Button`. The existing `AppLauncher` is composed by the
application through `dockTarget` and a custom `trigger`.

**Excluded support machinery:** no new dependencies, no application shell, no routing, no
responsive command-overflow engine, no tab strip, no global theming provider, no browser test
runner, no screenshot harness, and no `AppLauncher` changes.

**Approved complexity:** None.

## Domain Lenses

| Lens                             | Selected   | Evidence                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web application                  | ✅         | Browser UI with a banner landmark, keyboard focus, hover/pressed/disabled states, on-brand contrast, text-zoom behavior and caller-owned localization. The lens's accessibility clause maps directly to the visible focus, 48px targets and optional heading semantics; its UI-state clause maps to the enabled, hover, pressed, open and disabled states (`references/domains/web-application.md`). |
| Library/SDK (project-type focus) | ✅ (focus) | Public npm surface: four additive exports and four public props types, no breaking change, no new peer or runtime dependency, and the story/README surface consumers rely on.                                                                                                                                                                                                                        |
| Compiler/language                | —          | No grammar, parser, IR, codec or evaluator.                                                                                                                                                                                                                                                                                                                                                          |
| Financial system                 | —          | No money, balances, pricing or ledger concepts.                                                                                                                                                                                                                                                                                                                                                      |
| Distributed/concurrent           | —          | No threads, queues, replicas or workflows; purely client-side rendering.                                                                                                                                                                                                                                                                                                                             |
| Data and migration               | —          | No persisted schema, serialized artifact or compatibility window; the four exports are additive.                                                                                                                                                                                                                                                                                                     |

## Domain Glossary

| Term                 | Definition                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App bar              | The brand-colored application header at the top of the window: a banner landmark that hosts the launcher, the product name and global commands.                |
| Banner landmark      | The ARIA landmark exposed by a top-level `<header>`. A header nested inside `article`, `aside`, `main`, `nav` or `section` is not a banner.                    |
| On-brand             | A foreground or interaction color that is legible on the brand-colored bar, typically `colorNeutralForegroundOnBrand`.                                         |
| Command button       | An icon-only or icon-plus-text button in the bar that performs an action; `AppBarButton` is this package's command button.                                     |
| Hover overlay        | The translucent white layer that marks hover on the brand bar: `rgba(255,255,255,0.12)`. No Fluent token represents it.                                        |
| Pressed/open state   | The stronger translucent white layer used while a command is pressed or while the launcher is open: `rgba(255,255,255,0.22)`.                                  |
| Open-state highlight | The pressed background stays visible while the launcher trigger has `aria-expanded="true"`, which `PopoverTrigger` injects.                                    |
| M365 target          | The Microsoft 365 application bar as the visual reference: 48px height, 48×48 waffle, white icon, 12%/22% overlays, white focus ring, muted disabled commands. |
| Heading XOR link     | `AppBarTitle` renders either a heading (`headingLevel`) or a link (`href`), never both, so the title has one clear semantic root.                              |
| Visual acceptance    | The user's review of the `Geometry`, `States` and `WithLauncher` stories; code verification alone cannot approve the visual contract.                          |
| `disabledFocusable`  | A Fluent `Button` mode that is announced disabled and never activates, but stays in the tab order.                                                             |

## Document Index

| #         | Document                                       | Description                                      | Depends On |
| --------- | ---------------------------------------------- | ------------------------------------------------ | ---------- |
| **AR**    | [Ambiguity Register](00-ambiguity-register.md) | Zero-Ambiguity Gate decisions (audit trail)      | —          |
| **RD-01** | [AppBar shell](RD-01-app-bar-shell.md)         | `AppBar`, `AppBarTitle`, `AppBarSpacer`          | —          |
| **RD-02** | [AppBar commands](RD-02-app-bar-commands.md)   | `AppBarButton` and the `AppLauncher` composition | RD-01      |

## Dependency Graph

```
AR (18 resolved decisions)
 ├── RD-01 AppBar shell
 │      └── RD-02 AppBar commands
 └── RD-02 (also references AR-10, AR-17, AR-18 directly)
```

## Suggested Implementation Order

| Phase | Documents         | Description                                                                      |
| ----- | ----------------- | -------------------------------------------------------------------------------- |
| **A** | RD-01 → RD-02     | Build the shell first, then the command button and the composed launcher story.  |
| **B** | RD-02 visual gate | Review `Geometry`, `States` and `WithLauncher`; apply corrections and re-verify. |

## Key Architecture Decisions

| Decision                  | Choice                                                                            | Rationale                                                                                                               | AR Ref |
| ------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| Reuse the launcher        | No `AppLauncher` changes; compose with `dockTarget` and an `AppBarButton` trigger | The launcher is already complete and tested; the bar only needs to forward its ref and provide the on-brand trigger.    | AR-10  |
| Explicit command styling  | Only `AppBarButton` is restyled                                                   | Avoids fui9's implicit `[data-appbar-button]` selector contract and keeps arbitrary buttons under the caller's control. | AR-08  |
| Brand-only surface        | `colorBrandBackground` with on-brand foreground                                   | Matches M365 and keeps one visual contract; applications may override the background but own contrast.                  | AR-03  |
| Semantic title            | `<span>` by default, optional `h1`–`h6` or `<a>`                                  | Avoids the fui9 forced `h1` while keeping heading and link use cases.                                                   | AR-02  |
| Exact M365 command states | 48px targets, 12%/22% white overlays, white focus, muted disabled                 | The existing launcher story proves these values against Fluent `Button`; the user explicitly asked for M365 fidelity.   | AR-17  |
| Visual acceptance gate    | `Geometry`, `States` and `WithLauncher` stories require user approval             | Height, padding and hover colors are the user's stated acceptance criteria; code tests cannot judge them.               | AR-18  |

## How to Use These Documents

1. Pick a requirement document: RD-01, then RD-02.
2. Run the `make-plan` skill on the feature to produce the implementation plan.
3. Run the `exec-plan` skill to execute the plan specification-first.
4. Review the AppBar stories and approve the visual contract before declaring the feature done.
