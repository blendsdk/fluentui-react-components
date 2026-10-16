# App Launcher Implementation Plan

> **Feature**: byte-identical port of the VirtuoApp launcher family (7 Fluent UI v9 components + 9 public types) with its stories migrated from the source development workbench
> **Status**: Planning Complete
> **Created**: 2026-10-16
> **Implements**: app-launcher/RD-01, app-launcher/RD-02
> **CodeOps Artifact Schema**: 1

## Overview

This plan lands the app launcher family — `AppLauncher` and its `AppLauncherTrigger`, plus the
content blocks `AppLauncherSearch`, `AppLauncherSection`, `AppLauncherGrid`, `AppLauncherList`
and `AppLauncherItem` — in this package **byte-identically** from VirtuoApp's
`@virtuoapp/react-app-launcher`. The source package was built for this move and reviewed against
the repository's component pattern: it imports only React, `@fluentui/react-components` and
`@fluentui/react-icons`, ships no data or application state, and carries its own validated test
suite (36 tests in 8 files) that becomes this port's immutable oracle.

The port changes nothing: props, types, defaults, behavior, styles, DOM output, aria wiring and
test assertions are frozen. Only Prettier formatting, a closed three-item comment cleanup, the
package-scope adaptation and story sample-copy de-branding differ from the source — every phase
is verified by a Prettier-normalized diff gate against the source files.

The story content comes from the source's development workbench (five composed samples plus six
hand-drawn sample logos): the composed samples become the `AppLauncher` story — with a manual
review checklist for the jsdom-invisible behaviors — and the six remaining components receive the
variant stories the repository's definition of done requires. The README gains the family's
documentation in the package's existing format, and the export-surface pin grows with each phase.

## Minimum-Sufficient Baseline

**Original goal:** bring the reviewed, fully tested launcher package into this repository under
this package's scope, changing nothing it does.

**Smallest viable design:** copy the 43 source files and 8 test files, extend the package barrel
and the export-surface pin, add the 7 story files and the README sections; existing dependencies,
patterns and test infrastructure carry everything.

**Excluded machinery:** no new dependencies, no configuration or build changes, no new test
harness or added test surface, no SSR smoke, no techdocs, no release work, no behavioral fixes.
Only larger alternatives actually considered: a shared story-fixtures module (rejected — it would
need a `tsconfig.build.json` exclusion change), and review-only byte-identity inspection
(rejected — replaced by the mechanical normalized-diff gate).

**Approved complexity:** None (AR P1–P6; requirements register AR #1–19).

## Document Index

| #     | Document                                       | Description                                               |
| ----- | ---------------------------------------------- | --------------------------------------------------------- |
| AR    | [Ambiguity Register](00-ambiguity-register.md) | Zero-Ambiguity Gate decisions (audit trail)               |
| 00    | [Index](00-index.md)                           | This document — overview and navigation                   |
| 01    | [Requirements](01-requirements.md)             | Delta view over the owning RDs                            |
| 02    | [Current State](02-current-state.md)           | Analysis of the existing package and the source authority |
| 03-01 | [Content Blocks](03-01-app-launcher-blocks.md) | Landing spec for RD-02 (Phase 1)                          |
| 03-02 | [Shell](03-02-app-launcher-shell.md)           | Landing spec for RD-01 (Phase 2)                          |
| 07    | [Testing Strategy](07-testing-strategy.md)     | ST-cases (the ported oracle), categories and verification |
| 99    | [Execution Plan](99-execution-plan.md)         | Phases, steps, and task checklist                         |

## Quick Reference

### Usage Examples

The family composes the way the workbench samples show; a launcher in an application bar with a
search field, recents, pinned tiles and a filtered result list:

```tsx
<AppLauncher label="App launcher" dockTarget={barRef} open={open} onOpenChange={onOpenChange}>
  <AppLauncherSearch
    label="Search apps"
    value={query}
    onChange={(_event, data) => setQuery(data.value)}
  />
  <AppLauncherSection title="Recent">
    <AppLauncherList>
      <AppLauncherItem label="Mail" icon={<Mail20Regular />} onClick={activate} />
    </AppLauncherList>
  </AppLauncherSection>
  <AppLauncherSection title="Pinned" divider>
    <AppLauncherGrid>
      <AppLauncherItem label="Calendar" icon={<CalendarLtr32Regular />} onClick={activate} />
    </AppLauncherGrid>
  </AppLauncherSection>
</AppLauncher>
```

### Key Decisions

| Decision                   | Outcome                                                           | AR Ref             |
| -------------------------- | ----------------------------------------------------------------- | ------------------ |
| Port fidelity              | Byte-identical; findings recorded, never fixed                    | AR #2 (req)        |
| Ported tests               | Immutable oracle ported first (red) / unchanged (green)           | AR #7 (req), AR P2 |
| Phases                     | Blocks first (RD-02), shell second (RD-01)                        | AR P1              |
| Byte-identity verification | Prettier-normalized diff gate per phase                           | AR P3              |
| Verify commands            | `pnpm verify` every phase; `pnpm storybook:build` in story phases | AR P4              |
| Task grouping              | One task per component folder; `AppLauncherItem` split in two     | AR P6              |

## Specialist Agents

**None** — the capability-gap check ran against this repository's evidence and found no gap a
standing specialist would close.

_Detection evidence: the repo-authored `.opencode/skills/fluentui-components/` skill carries the
component pattern this port follows, and the global `fluentui` skill covers Fluent UI v9 APIs; the
work is byte-identical copying with an external immutable oracle, so a specialist would only
restate existing skills; `codeops/specialist-check.json` (2026-10-16) found no specialist for this
repository and there is no recurring-finding area in this plan's scope._

## Related Files

| Path (repo-relative)                                                             | Role                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Source: `/home/gevik/workdir/codeindustry/VirtuoApp/packages/react-app-launcher` | Read-only authority: sources, tests, README, workbench |
| `packages/react-components/src/components/AppLauncher*/`                         | 7 ported component folders + 7 story files             |
| `packages/react-components/src/index.ts`                                         | Package barrel — 7 exports + 9 type exports            |
| `packages/react-components/test/app-launcher*`                                   | 8 ported test files                                    |
| `packages/react-components/test/package-exports.spec.test.ts`                    | Export-surface pin — extended per phase                |
| `packages/react-components/README.md`                                            | Family documentation                                   |
