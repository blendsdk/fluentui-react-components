# Acceptance evidence — skills distribution

> **Date**: 2026-10-19
> **Status**: Done

## Verification

| Check                            | Result                                                   |
| -------------------------------- | -------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | Lockfile up to date                                      |
| `pnpm format:check`              | Passing                                                  |
| `pnpm skill:check`               | 19 skills validated across 2 roots                       |
| `pnpm type-check`                | Passing                                                  |
| `pnpm build`                     | Passing; 2 skills synced                                 |
| `pnpm test`                      | 46 test files, 425 tests passing                         |
| `pnpm storybook:build`           | Passing                                                  |
| `pnpm pack:check`                | 173 files, both skills present, no source or story files |
| `pnpm skills:check`              | 2 skills found from the local package path               |
| `skills add ... --skill <id>`    | Both IDs selected and installed in a temporary project   |

## Artifact checks

- `skills/fluentui-components/SKILL.md` and
  `skills/rhf-zod-forms/SKILL.md` both have frontmatter with `name` and
  `description`; each `name` matches its directory ID so `--skill <id>` selects
  the skill in the `skills` CLI.
- `skills/rhf-zod-forms/references/` contains `field-api.md`,
  `form-patterns.md`, `testing.md` and `pitfalls.md`.
- `skills/rhf-zod-forms/templates/` contains `FormSchema.ts`,
  `useFormLogic.ts`, `FormDialog.tsx` and `form.spec.test.tsx`.
- `packages/react-components/skills/` is generated, gitignored and populated
  from the top-level source by `pnpm build` and `prepack`.
- `opencode.json` registers `./skills`; OpenCode reloaded the source and
  advertised both skills.
- The published pack includes the two `SKILL.md` entry files and the skill
  references/templates, with no component source or story files outside the
  skill payload.

## Deferred and open items

- The GitHub issue #2 is left open because closing it was not part of the
  implementation authorization. The feature work is complete.
- App-specific DTOs, business rules and app-local skills remain out of scope.
