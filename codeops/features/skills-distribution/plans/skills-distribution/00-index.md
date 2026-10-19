# Skills distribution — implementation plan

> **Implements**: `skills-distribution/RD-01`
> **Source**: [RD-01](../../requirements/RD-01-rhf-zod-forms-and-distribution.md) · [GitHub issue #2](https://github.com/blendsdk/fluentui-react-components/issues/2)
> **Feature**: `skills-distribution`
> **CodeOps Artifact Schema**: 1
> **Status**: Done — implementation and verification complete
> **Date**: 2026-10-19

## Why this plan exists

Issue #2 asks for a second agent skill and a distribution path for both skills.
The repository already had the component skill under `.opencode/skills`, but
that path is project-local and not part of the npm package. The plan makes the
skills a distributable artifact without a custom installer or a second
hand-edited copy.

## Design

1. **One source.** Move the component skill to top-level `skills/` and add
   `rhf-zod-forms/` beside it. `.opencode/skills` remains the home of the
   installer-managed CodeOps skills. Each frontmatter `name` matches its
   directory ID so `skills add ... --skill <id>` selects it.
2. **Local discovery.** `opencode.json` registers `./skills` so local agents load
   the distributable source directly.
3. **Generated package copy.** `scripts/sync-skills.mjs` removes and recopies
   the source into `packages/react-components/skills/`. `build` and `prepack`
   run it. The generated copy is gitignored.
4. **Validation.** `scripts/check-skill.mjs` validates both roots and rejects
   duplicate IDs. `scripts/check-pack.mjs` requires both `SKILL.md` files in the
   npm pack list and still rejects component source and story files outside the
   skill payload.
5. **Offline listing.** Add the pinned `skills@1.7.2` dev dependency and run
   `skills add ./packages/react-components --list` after a sync. The local path
   avoids GitHub and makes the CI smoke test deterministic.
6. **Documentation.** The root and package READMEs document GitHub,
   local-package and manual installation, project vs global scope, updates,
   exact-version pinning and OpenCode discovery paths.

## Document map

| Document                                                                      | Purpose                         |
| ----------------------------------------------------------------------------- | ------------------------------- |
| [01 requirements](../../requirements/RD-01-rhf-zod-forms-and-distribution.md) | Requirement baseline            |
| [05 findings](./05-findings.md)                                               | Review findings and resolutions |
| [08 acceptance](./08-acceptance.md)                                           | Verification evidence           |
| [99 execution plan](./99-execution-plan.md)                                   | Task checklist and progress     |

## Verification

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm skill:check
pnpm type-check
pnpm build
pnpm test
pnpm storybook:build
pnpm pack:check
pnpm skills:check
```

## Outcome

The feature is complete. The package publishes both skills, the local package
path lists both skills, and the repository passes the full gate. The GitHub
issue is left open because the implementation request did not authorize closing
it.
