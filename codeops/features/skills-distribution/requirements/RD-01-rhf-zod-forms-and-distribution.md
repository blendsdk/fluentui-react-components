# RD-01: `rhf-zod-forms` skill and skill distribution

> **Document**: RD-01-rhf-zod-forms-and-distribution.md
> **Status**: Implemented
> **Created**: 2026-10-19
> **Project**: fluentui-react-components
> **Depends On**: form-fields/RD-01
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

The package already contains the `fluentui-components` skill, but the skill is
neither shipped nor installable by consumers. Applications also need a second
skill that teaches an agent how to compose forms with React Hook Form, Zod and
the new `Form*Field` wrappers.

This feature makes the repository ship two static skills:

1. **`fluentui-components`** — how to author a component in the house Fluent UI
   v9 pattern.
2. **`rhf-zod-forms`** — how to compose an application form with React Hook Form
   7, Zod 4, `@hookform/resolvers/zod` and the `@blendsdk/fluentui-react-components`
   field wrappers.

The top-level `skills/` directory is the single source of truth. A deterministic
sync copies it into the publishable package, and the standard `npx skills` CLI
installs the skills from GitHub or from the installed package. There is no
custom installer and no `blendsdk` change.

The implementation and evidence are in
[`../plans/skills-distribution/00-index.md`](../plans/skills-distribution/00-index.md)
and [`../plans/skills-distribution/08-acceptance.md`](../plans/skills-distribution/08-acceptance.md).

---

## Functional Requirements

### Must Have (M)

- [x] **R1 — Top-level source.** A top-level `skills/` directory contains
      `fluentui-components/` and `rhf-zod-forms/`, each with a `SKILL.md`,
      `references/` and `templates/` where applicable.
- [x] **R2 — Move without drift.** The existing `fluentui-components` skill is
      moved from `.opencode/skills/` into `skills/`; every relative link and template
      reference still resolves. The CodeOps skills remain under `.opencode/skills/`.
- [x] **R3 — Local agent source.** `opencode.json` keeps the schema URL and
      registers `./skills` in the `skills` array, so local agents read the
      distributable source directly.
- [x] **R4 — New form skill.** `rhf-zod-forms/SKILL.md` covers when to use the
      skill, the stack, schema and type inference, `useForm` setup, field
      composition, dialog lifecycle, server errors, DTO mapping, i18n,
      accessibility, testing and verification.
- [x] **R5 — References.** The form skill includes:
      `references/field-api.md`, `references/form-patterns.md`,
      `references/testing.md` and `references/pitfalls.md`.
- [x] **R6 — Templates.** The form skill includes `templates/FormSchema.ts`,
      `templates/useFormLogic.ts`, `templates/FormDialog.tsx` and
      `templates/form.spec.test.tsx`.
- [x] **R7 — Package distribution.** `packages/react-components/package.json`
      publishes `"skills"`; a deterministic sync mirrors the top-level source into
      the package; `prepack` and `build` run the sync; the generated copy is
      gitignored.
- [x] **R8 — Skill validation.** `scripts/check-skill.mjs` validates both
      `skills/` and `.opencode/skills/`, including lowercase kebab-case IDs,
      frontmatter `name` and `description`, relative links outside code fences, and
      duplicate IDs across roots.
- [x] **R9 — Pack validation.** `scripts/check-pack.mjs` requires both
      `skills/fluentui-components/SKILL.md` and `skills/rhf-zod-forms/SKILL.md` in
      the npm pack list, and still rejects component source and Storybook story
      files outside the skill template directories.
- [x] **R10 — Offline CI smoke.** The CI smoke test lists the packaged skills
      from the local package path through the pinned `skills` CLI dev dependency.
      It does not contact GitHub.
- [x] **R11 — Installation documentation.** The root and package READMEs
      document GitHub installation, local-package installation and the manual copy
      fallback. They cover project vs global installs, `npx skills update`, exact
      version pinning, OpenCode discovery paths, and the third-party status of the
      CLI.
- [x] **R12 — Verification.** `pnpm verify`, `pnpm pack:check`,
      `pnpm skills:check` and `pnpm storybook:build` pass. No custom installer and
      no `blendsdk`, downstream application or app-specific DTO change is made.

### Should Have

- None beyond the requirements above. The feature is intentionally limited to
  two static skills and the deterministic distribution path.

### Won't Have (Out of Scope)

- A custom `skill install` command or an installer in the package.
- An OpenCode HTTP skill catalog.
- Application-specific skills, DTOs or business rules.
- Merging the component repository into `blendsdk`.
- Fluent UI v8 or Formik content.
- Maintaining two hand-edited copies of the skills.

---

## Technical Requirements

### Packaging

- The top-level `skills/` directory is the only hand-edited source. The copy at
  `packages/react-components/skills/` is generated and ignored by Git.
- The sync removes the previous target before copying, so deleted or renamed
  skills cannot survive in the package.
- The package's `files` array includes `"skills"`. npm still publishes files in
  a `files` entry even when the generated directory is gitignored.
- `prepack` syncs before every `npm pack`/publish; the build also syncs so the
  local package path can be tested after `pnpm build`.
- `pack:check` tolerates the sync line that `prepack` writes to stdout before
  the JSON manifest.

### Validation and CI

- `check-skill.mjs` reports duplicate IDs across the two skill roots; a later
  source must not silently override an earlier one.
- `check-pack.mjs` allows skill templates such as `Component.stories.tsx`
  under `skills/`, but still rejects `src/`, `.storybook/`, `storybook-static/`
  and story-named files elsewhere in the package.
- CI runs `pnpm skills:check` after the build. The `skills@1.7.2` dev dependency
  is pinned so the check does not depend on a network fetch or the GitHub API.
- The `skills` CLI remains a third-party tool; the manual copy path is the
  offline fallback for consumers.

### Security and supply chain

- The `skills` package is a development-only tool and is not published in the
  component package.
- The published package contains static Markdown and template files only. No
  installer or postinstall script is added.
- The skill content uses generic examples. It contains no application DTOs,
  credentials, internal hostnames or business rules.

### Compatibility

- React 19, Fluent UI v9, React Hook Form 7, Zod 4 and
  `@hookform/resolvers/zod` are the documented stack.
- The form skill's field examples follow the implemented field API from
  `form-fields/RD-01`: empty string for no selection, `getOptionText`, numeric
  `parse`, `Date | null` for the DatePicker and `setError` for server errors.
- Node.js 22 is required. The pinned `skills` CLI declares Node.js 22.20 or
  newer; CI uses the current Node 22 release.

### Documentation

- Every skill has a discoverable frontmatter description.
- The form skill routes to its references and templates instead of duplicating
  every detail in `SKILL.md`.
- The README install blocks use the standard `npx skills` CLI and a manual copy
  fallback.

---

## Acceptance Criteria

| ID    | Criterion                                                            | Evidence                                      |
| ----- | -------------------------------------------------------------------- | --------------------------------------------- |
| AC-01 | Both skills exist under `skills/` with valid frontmatter             | `pnpm skill:check`; skill tree                |
| AC-02 | The moved component skill has no broken links                        | `pnpm skill:check`                            |
| AC-03 | The form skill covers the required topics and has four references    | Skill review; `find skills/rhf-zod-forms`     |
| AC-04 | The form skill has all four required templates                       | Skill tree                                    |
| AC-05 | `opencode.json` registers `./skills`                                 | File content; OpenCode hot reload             |
| AC-06 | The package supports `prepack` and `build` sync                      | `pnpm build`; `pnpm pack:check`               |
| AC-07 | `packages/react-components/skills/` is generated and gitignored      | `.gitignore`; `git status`                    |
| AC-08 | `check-skill.mjs` validates both roots and rejects duplicates        | `pnpm skill:check` (19 skills across 2 roots) |
| AC-09 | `check-pack.mjs` requires both skills and still rejects source/story | `pnpm pack:check` (173 files, both skills)    |
| AC-10 | The offline local-package listing shows both skills                  | `pnpm skills:check`                           |
| AC-11 | READMEs document GitHub, local-package and manual installs           | Root and package README                       |
| AC-12 | `pnpm verify`, Storybook and the pack guard pass                     | Verification evidence                         |

---

## Verification Evidence

| Check                            | Result                                                   |
| -------------------------------- | -------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | Lockfile up to date                                      |
| `pnpm format:check`              | Passing                                                  |
| `pnpm skill:check`               | 19 skills validated across 2 roots                       |
| `pnpm type-check`                | Passing                                                  |
| `pnpm build`                     | Passing; 2 skills synced                                 |
| `pnpm test`                      | 46 files, 425 tests passing                              |
| `pnpm storybook:build`           | Passing                                                  |
| `pnpm pack:check`                | 173 files, both skills present, no source or story files |
| `pnpm skills:check`              | 2 skills found from the local package path               |

---

## References

- Plan: [`../plans/skills-distribution/00-index.md`](../plans/skills-distribution/00-index.md)
- Acceptance evidence: [`../plans/skills-distribution/08-acceptance.md`](../plans/skills-distribution/08-acceptance.md)
- Findings ledger: [`../plans/skills-distribution/05-findings.md`](../plans/skills-distribution/05-findings.md)
- GitHub issue #2: <https://github.com/blendsdk/fluentui-react-components/issues/2>
- Standard skills CLI: <https://github.com/vercel-labs/skills>
- OpenCode skill discovery: <https://opencode.ai/v2/docs/skills>
- Field API: [`../../form-fields/requirements/RD-01-react-hook-form-fields.md`](../../form-fields/requirements/RD-01-react-hook-form-fields.md)
