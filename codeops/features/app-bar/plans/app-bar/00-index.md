# AppBar Implementation Plan

> **Feature**: `app-bar` — a brand application header with M365-style command states
> **Status**: Complete
> **Created**: 2026-11-20
> **Implements**: app-bar/RD-01, app-bar/RD-02
> **CodeOps Artifact Schema**: 1

## Overview

Build four small, presentational components in `@blendsdk/fluentui-react-components`:
`AppBar` (the semantic brand header), `AppBarTitle` (the product name with optional heading or
link semantics), `AppBarSpacer` (the flex layout helper) and `AppBarButton` (the on-brand command
button). The family reuses the existing, fully tested `AppLauncher`; it does not port or modify
the fui9 launcher or tab code.

The visual contract is the Microsoft 365 application bar: a 48px brand surface, a 48×48 waffle
flush with the leading edge, a 14px semibold title inset by 8px, and 48px commands with a 12%
white hover, a 22% white pressed/open state, a white 2px inset focus ring and muted disabled
states. The `Geometry`, `States` and `WithLauncher` stories are the user's visual acceptance
surface.

The plan is specification-first: the shell and title/spacer spec tests are written before their
implementation, the button spec tests are written before the button, and implementation tests,
stories and README follow the green phases.

## Minimum-Sufficient Baseline

**Original goal:** give applications a reusable, accessible brand application header that looks
and behaves like the Microsoft 365 bar and works with the existing launcher.

**Smallest viable design:** four small presentational components following the repository's
component anatomy, using Fluent `Button` and design tokens. The application composes the existing
`AppLauncher` through `dockTarget` and an `AppBarButton` trigger.

**Excluded machinery:** no new dependencies, no application shell, no routing, no responsive
command-overflow engine, no tab strip, no global theming provider, no browser/screenshot harness,
no `AppLauncher` changes.

**Approved complexity:** None.

## Document Index

| #   | Document                                       | Description                                   |
| --- | ---------------------------------------------- | --------------------------------------------- |
| AR  | [Ambiguity Register](00-ambiguity-register.md) | Zero-Ambiguity Gate decisions (audit trail)   |
| PF  | [Preflight Report](00-preflight-report.md)     | Five-cluster audit, findings and user rulings |
| 00  | [Index](00-index.md)                           | This document — overview and navigation       |
| 01  | [Requirements](01-requirements.md)             | Delta view of the two RDs                     |
| 02  | [Current State](02-current-state.md)           | fui9 and repository analysis                  |
| 03  | [AppBar](03-01-app-bar.md)                     | Header shell specification                    |
| 03  | [AppBarTitle](03-02-app-bar-title.md)          | Title specification                           |
| 03  | [AppBarSpacer](03-03-app-bar-spacer.md)        | Spacer specification                          |
| 03  | [AppBarButton](03-04-app-bar-button.md)        | Command button and M365 states                |
| 05  | [Findings Ledger](05-findings.md)              | Phase review findings and rulings             |
| 07  | [Testing Strategy](07-testing-strategy.md)     | ST cases and verification                     |
| 99  | [Execution Plan](99-execution-plan.md)         | Phases, sessions and task checklist           |

## Quick Reference

### Usage

```tsx
import { useRef } from 'react';
import { GridDots20Regular, Settings20Regular } from '@fluentui/react-icons';
import {
  AppBar,
  AppBarButton,
  AppBarSpacer,
  AppBarTitle,
  AppLauncher,
  AppLauncherSection,
} from '@blendsdk/fluentui-react-components';

export function Shell() {
  const barRef = useRef<HTMLElement>(null);

  return (
    <AppBar ref={barRef}>
      <AppLauncher
        trigger={<AppBarButton aria-label="App launcher" icon={<GridDots20Regular />} />}
        dockTarget={barRef}
      >
        <AppLauncherSection>{/* existing launcher content */}</AppLauncherSection>
      </AppLauncher>
      <AppBarTitle>Contoso</AppBarTitle>
      <AppBarSpacer />
      <AppBarButton aria-label="Settings" icon={<Settings20Regular />} />
    </AppBar>
  );
}
```

### Key Decisions

| Decision          | Outcome                                                                                             | AR Ref        |
| ----------------- | --------------------------------------------------------------------------------------------------- | ------------- |
| Scope             | `AppBar`, `AppBarTitle`, `AppBarSpacer`, `AppBarButton`; no tab strip                               | AR-01         |
| Bar geometry      | 48px minimum height, zero bar padding, zero gap, flush launcher and trailing command                | AR-05         |
| Title             | Span by default; heading XOR link; 14px/20px semibold; 8px inset; truncation                        | AR-02, AR-06  |
| Button            | Button-only, 48px target, forced transparent/square/medium, required accessible name when icon-only | AR-07, PF-001 |
| M365 states       | White foreground; 12% hover; 22% pressed/open; white focus; muted disabled                          | AR-17         |
| Text contrast     | Keep the M365 overlays; documented text-command exception; icon-only passes 3:1                     | PF-005        |
| Text zoom         | Unitless 1.4286 line-height; 200% text-only no-clipping check                                       | PF-004        |
| Launcher          | No `AppLauncher` changes; compose `dockTarget` + `AppBarButton` trigger                             | AR-10         |
| Visual acceptance | `Geometry`, `States`, `WithLauncher` require user approval                                          | AR-18         |

## Specialist Agents

**None** — the capability-gap check ran on 2026-11-20 and found no gap a standing specialist would close.

_Detection evidence: the work is a UI-only component family in an existing package; it adds no
specialized framework/DSL, domain invariant, migration, data model, security surface or
infrastructure. The `fluentui-components` skill already owns the component authoring pattern, and
the preflight findings are plan-level corrections rather than a recurring domain area. The catalog
roles plus a dynamic packet cover the need; a specialist would only restate them. State:
`codeops/specialist-check.json`._

## Related Files

| Path                                                          | Role                               |
| ------------------------------------------------------------- | ---------------------------------- |
| `packages/react-components/src/components/AppBar/`            | `AppBar` component and story       |
| `packages/react-components/src/components/AppBarTitle/`       | `AppBarTitle` component and story  |
| `packages/react-components/src/components/AppBarSpacer/`      | `AppBarSpacer` component and story |
| `packages/react-components/src/components/AppBarButton/`      | `AppBarButton` component and story |
| `packages/react-components/src/index.ts`                      | Package root exports               |
| `packages/react-components/test/app-bar*.spec.test.tsx`       | Specification tests                |
| `packages/react-components/test/app-bar*.types.test.tsx`      | Type-level contract tests          |
| `packages/react-components/test/app-bar*.impl.test.tsx`       | Implementation tests               |
| `packages/react-components/test/package-exports.spec.test.ts` | Export-surface pin                 |
| `packages/react-components/README.md`                         | Public documentation               |
| `codeops/features/app-bar/requirements/`                      | Owning requirements                |
