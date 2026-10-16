<!-- CODEOPS-PROJECT:START -->

# fluentui-react-components project guidance

## Project

- pnpm and Turborepo monorepo for custom React components built on Fluent UI v9.
- Node.js 22 or newer; pnpm 12.11.2 pinned through `packageManager` — keep exactly one lockfile.
- `main` is the integration branch; CI, releases and the Storybook deployment run from it.

## Structure

- `packages/react-components/` — the only publishable package, `@blendsdk/fluentui-react-components`. Component sources live in `src/components/<Name>/`, tests in `test/`, stories beside the components, Storybook configuration in `.storybook/`.
- `.opencode/skills/fluentui-components/` — the component-authoring skill (pattern, references, templates). Load it before creating, changing or reviewing a component.
- `scripts/check-skill.mjs` — validates the repo-authored skills under `.opencode/skills`: ID shape, frontmatter, and relative links outside code fences.
- `.github/workflows/` — CI (`ci.yml`), manual npm release via OIDC trusted publishing (`release.yml`), Storybook to GitHub Pages (`pages.yml`; live at `https://blendsdk.github.io/fluentui-react-components/`).

## Commands

- Install exactly from the lockfile: `pnpm install --frozen-lockfile`.
- Full gate: `pnpm verify` (format check, skill check, type-check, build, tests).
- Repository-wide: `pnpm build`, `pnpm test`, `pnpm type-check`, `pnpm storybook:build`.
- One package: `pnpm --filter @blendsdk/fluentui-react-components <script>`.
- Storybook workbench: `pnpm storybook` (port 6006).
- Format: `pnpm format` / `pnpm format:check` (Prettier).
- Release: run the `release.yml` workflow (manual dispatch; it versions, publishes through npm OIDC, then pushes the release commit and tags), or locally `pnpm lockstep:version:auto` followed by `pnpm lockstep:publish:latest`.

## Conventions

- Components follow the Fluent UI v9 pattern documented in the `fluentui-components` skill: `<Name>.tsx` (forwardRef shell), `<Name>.types.ts` (props contract), `use<Name>.ts` (state hook), `render<Name>.tsx` (pure render), `use<Name>Styles.styles.ts` (Griffel + tokens), optional `<Name>Context.ts`, `index.ts` barrel. Deviations from the anatomy are recorded exceptions (for example `SystemErrorProvider` has no styles file and keeps its state and render in one file; the provider-shaped `ConfirmProvider` has no render or styles layers either), never silent drift.
- Tests live in `test/`: `*.spec.test.tsx` (contract, written first and kept unchanged — the immutable oracle), `*.impl.test.tsx` (internals), a `*.ssr.test.tsx` smoke in the node environment where server rendering matters, and `package-exports.spec.test.ts` pinning the public export surface; one story file per component.
- Hooks and render functions stay pure; styling uses `makeStyles` with `tokens` only, and class names merge with `mergeClasses`; native props of the root element pass through.
- Documentation comments are mandatory for public and non-trivial internal symbols. Never reference plans, requirements or task identifiers in code or comments.
- Conventional Commits (`feat(scope): ...`); Prettier is the only formatter — there is no ESLint.
- `dist/` and `storybook-static/` are generated; never edit them. The CodeOps payload under `.opencode/` (the CodeOps `skills/` directories, `agents/`, `_shared/`, `references/`) is installer-managed and replaced on upgrade — never edit it; `fluentui-components` is the repo-authored skill.

## Verification

- Run `pnpm verify` before completing any work. `.github/workflows/ci.yml` is the authoritative full sequence and additionally builds Storybook and checks `npm pack --dry-run` for the publishable package.
- Tests run under Vitest, jsdom by default with per-file `// @vitest-environment node` overrides for the SSR smokes; specification tests are the immutable oracle — a failing one means the implementation is wrong.

## CodeOps

- Nested layout: `codeops/.codeops.yml` is the marker (`integrationBranch: main`), `codeops/codeops.json` holds the strict quality policy, and `codeops/00-roadmap.md` is the portfolio roadmap. Feature artifacts live under `codeops/features/<feature>/` and appear lazily with the first requirement or plan.
- Project skills and agents come from `opencode-codeops@2.2.1` (`install --project`): 17 CodeOps skills recorded in `.opencode/skills/.opencode-codeops.json` plus 12 hidden dispatch agents in `.opencode/agents/`. Restart OpenCode after an install or upgrade so they load.
- Specialist coverage: up to date (2026-10-16) — no specialist is warranted; `make-plan` re-runs the check with phase evidence.

<!-- CODEOPS-PROJECT:END -->
