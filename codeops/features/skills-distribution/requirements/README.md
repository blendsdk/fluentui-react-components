# skills-distribution — Requirements Documents

> **Feature**: skills-distribution — ship and install the `fluentui-components` and `rhf-zod-forms` skills
> **Status**: Implemented
> **Created**: 2026-10-19
> **Architecture**: React 19 + Fluent UI v9 package, React Hook Form 7, Zod 4, TypeScript, pnpm, the standard `skills` CLI
> **CodeOps Artifact Schema**: 1

---

## Overview

The package needs to distribute the component-authoring skill and a new
form-composition skill. The repository keeps one source of truth at the
top-level `skills/` directory, mirrors it into the publishable package, and lets
the standard `npx skills` CLI install either skill from GitHub or from the
installed package.

## Minimum-Sufficient Baseline

**Original goal:** make both skills installable by consumers without a custom
installer and without a second hand-edited copy.

**Smallest viable design:** a top-level `skills/` source, a deterministic sync
into the package, `prepack`/build wiring, a dual-root skill guard, a pack guard
that requires both skills, and README installation instructions.

**Excluded support machinery:** a custom installer command, an OpenCode HTTP
catalog, app-specific skills, a repository merge, and any `blendsdk` change.

**Approved complexity:** `opencode.json` registers the local source, a pinned
`skills` dev dependency makes the CI listing offline, and the generated package
copy is gitignored rather than committed.

## Domain Lenses

| Lens              | Selected | Evidence                                                                  |
| ----------------- | -------- | ------------------------------------------------------------------------- |
| API and packaging | ✅       | npm `files`, `prepack`, generated copy, pack guard and local-package test |
| Developer docs    | ✅       | Two `SKILL.md` files, references, templates and README installation paths |
| Security/supply   | ✅       | Static files only; dev-only CLI; no installer or postinstall script       |
| Accessibility     | —        | The skills document accessibility; this feature changes no UI component   |
| Concurrency/data  | —        | No runtime state, persistence or migration                                |

## Document Index

| #         | Document                                                                                        | Description                                            | Depends On        |
| --------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------- |
| **RD-01** | [RD-01 — `rhf-zod-forms` skill and skill distribution](RD-01-rhf-zod-forms-and-distribution.md) | Requirements for the two skills and their distribution | form-fields/RD-01 |
| **Plan**  | [skills-distribution plan](../plans/skills-distribution/00-index.md)                            | Design, findings, acceptance and execution record      | RD-01             |

## Dependency Graph

```text
form-fields/RD-01 (implemented field API)
  └── skills-distribution/RD-01
      ├── skills/fluentui-components
      ├── skills/rhf-zod-forms
      ├── scripts/sync-skills.mjs
      └── package distribution + docs
```

## Implementation Status

Implemented and verified. The two skills are discoverable from the local source,
the package carries a generated copy, and the local-package listing finds both
skills. The issue remains open until the owner closes it; no GitHub closure was
authorized by the implementation request.
