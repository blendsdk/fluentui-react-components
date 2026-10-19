# Execution plan — skills distribution

> **Feature**: `skills-distribution`
> **Implements**: `skills-distribution/RD-01`
> **Source**: [RD-01](../../requirements/RD-01-rhf-zod-forms-and-distribution.md)
> **CodeOps Artifact Schema**: 1
> **Progress**: 19/19 tasks (100%)
> **Reasoning**: medium — packaging, local CLI behavior and documentation; no runtime component change.

## How to execute

The feature is complete; this checklist is the durable execution record. The
work is split into structure, sync/packaging, skill content, validation/docs and
verification. Do not edit the generated `packages/react-components/skills/`
copy.

---

## Phase 1 — Source and local discovery

- [x] **P1-T1 — Move the component skill.** Move
      `.opencode/skills/fluentui-components/` to `skills/fluentui-components/` and
      keep every relative link working. ✅ (completed: 2026-10-19)
- [x] **P1-T2 — Register the local source.** Add `opencode.json` with the schema
      URL and `"skills": ["./skills"]`. ✅ (completed: 2026-10-19)
- [x] **P1-T3 — Update project references.** Update `AGENTS.md`, the root README
      and the package README to reference the top-level source. ✅ (completed:
      2026-10-19)

---

## Phase 2 — Distribution and packaging

- [x] **P2-T1 — Add the sync script.** `scripts/sync-skills.mjs` removes the old
      package copy and copies the top-level source deterministically. ✅ (completed:
      2026-10-19)
- [x] **P2-T2 — Wire the package.** Add `"skills"` to `files`; run the sync from
      `build` and `prepack`. ✅ (completed: 2026-10-19)
- [x] **P2-T3 — Exclude generated output.** Add
      `packages/react-components/skills/` to `.gitignore` and
      `.prettierignore`. ✅ (completed: 2026-10-19)

---

## Phase 3 — The `rhf-zod-forms` skill

- [x] **P3-T1 — Write `SKILL.md`.** Cover the stack, workflow, schema/types,
      form setup, field composition, dialog lifecycle, server errors, DTO mapping,
      i18n, accessibility and verification; align the frontmatter name with the
      directory ID. ✅ (completed: 2026-10-19)
- [x] **P3-T2 — Write the references.** Add `field-api.md`,
      `form-patterns.md`, `testing.md` and `pitfalls.md`. ✅ (completed: 2026-10-19)
- [x] **P3-T3 — Write the templates.** Add `FormSchema.ts`,
      `useFormLogic.ts`, `FormDialog.tsx` and `form.spec.test.tsx`. ✅ (completed:
      2026-10-19)

---

## Phase 4 — Validation and documentation

- [x] **P4-T1 — Extend the skill guard.** Validate both skill roots, reject
      duplicate IDs, and keep the existing frontmatter/link checks. ✅ (completed:
      2026-10-19)
- [x] **P4-T2 — Extend the pack guard.** Require both skill entry files, allow
      skill templates under `skills/`, and keep rejecting source/story files
      elsewhere. ✅ (completed: 2026-10-19)
- [x] **P4-T3 — Add the offline CI smoke test.** Add the pinned `skills`
      dev dependency, the `skills:sync`/`skills:check` scripts and the CI step.
      ✅ (completed: 2026-10-19)
- [x] **P4-T4 — Document installation.** Add GitHub, local-package and manual
      instructions to both READMEs. ✅ (completed: 2026-10-19)

---

## Phase 5 — Verification and record

- [x] **P5-T1 — Format and skill guard.** Run `pnpm format` and
      `pnpm skill:check`. ✅ (completed: 2026-10-19)
- [x] **P5-T2 — Full gate.** Run `pnpm verify` (425 tests). ✅ (completed:
      2026-10-19)
- [x] **P5-T3 — Pack guard.** Run `pnpm pack:check` (173 files, both skills).
      ✅ (completed: 2026-10-19)
- [x] **P5-T4 — Storybook and local listing.** Run `pnpm storybook:build` and
      `pnpm skills:check`. ✅ (completed: 2026-10-19)
- [x] **P5-T5 — Commit and push.** Commit the feature on `main` and push the
      verified result. ✅ (completed: 2026-10-19)
- [x] **P5-T6 — Record the roadmap.** Add the feature RD, plan, findings and
      acceptance evidence; update the portfolio. ✅ (completed: 2026-10-19)

---

## Definition of done

- [x] Top-level `skills/fluentui-components` and `skills/rhf-zod-forms` exist.
- [x] Both `SKILL.md` files have valid frontmatter.
- [x] Links and templates resolve.
- [x] The component skill moved without broken references.
- [x] `rhf-zod-forms` covers the content checklist.
- [x] `pnpm skill:check` passes for both roots.
- [x] `packages/react-components/skills/` is synced and included in `npm pack`.
- [x] `pnpm pack:check` requires both skills and rejects source/story files.
- [x] `pnpm skills:check` lists both skills from the local package path.
- [x] README documents GitHub, local-package and manual installs.
- [x] No custom installer and no `blendsdk` change.
- [x] `pnpm verify` passes.
