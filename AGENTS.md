<!-- CODEOPS-PROJECT:START -->

# fluentui-react-components project guidance

## Project

- pnpm and Turborepo monorepo for custom React components built on Fluent UI v9.
- Node.js 22 or newer; pnpm 12.11.2 pinned through `packageManager` — keep exactly one lockfile.
- `main` is the integration branch; CI, releases and the Storybook deployment run from it.

## Structure

- `packages/react-components/` — the only publishable package, `@blendsdk/fluentui-react-components`. Component sources live in `src/components/<Name>/`, tests in `test/`, stories beside the components, Storybook configuration in `.storybook/`.
- `.opencode/skills/fluentui-components/` — the component-authoring skill (pattern, references, templates). Load it before creating, changing or reviewing a component.
- `scripts/check-skill.mjs` — validates skill frontmatter, IDs and relative links.
- `.github/workflows/` — CI (`ci.yml`), manual npm release via OIDC trusted publishing (`release.yml`), Storybook to GitHub Pages (`pages.yml`).

## Commands

- Install exactly from the lockfile: `pnpm install --frozen-lockfile`.
- Full gate: `pnpm verify` (format check, skill check, type-check, build, tests).
- Repository-wide: `pnpm build`, `pnpm test`, `pnpm type-check`, `pnpm storybook:build`.
- One package: `pnpm --filter @blendsdk/fluentui-react-components <script>`.
- Storybook workbench: `pnpm storybook` (port 6006).
- Format: `pnpm format` / `pnpm format:check` (Prettier).
- Release: run the `release.yml` workflow (manual dispatch; it versions, publishes through npm OIDC, then pushes the release commit and tags), or locally `pnpm lockstep:version:auto` followed by `pnpm lockstep:publish:latest`.

## Conventions

- Components follow the Fluent UI v9 pattern documented in the `fluentui-components` skill: `<Name>.tsx` (forwardRef shell), `<Name>.types.ts` (props contract), `use<Name>.ts` (state hook), `render<Name>.tsx` (pure render), `use<Name>Styles.styles.ts` (Griffel + tokens), optional `<Name>Context.ts`, `index.ts` barrel. Tests split into `*.spec.test.tsx` (contract, written first and kept unchanged) and `*.impl.test.tsx` (internals); one story file per component.
- Hooks and render functions stay pure; styling uses `makeStyles` with `tokens` only, and class names merge with `mergeClasses`; native props of the root element pass through.
- Documentation comments are mandatory for public and non-trivial internal symbols. Never reference plans, requirements or task identifiers in code or comments.
- Conventional Commits (`feat(scope): ...`); Prettier is the only formatter — there is no ESLint.
- `dist/` and `storybook-static/` are generated; never edit them.

## Verification

- Run `pnpm verify` before completing any work. `.github/workflows/ci.yml` is the authoritative full sequence and additionally builds Storybook and checks `npm pack --dry-run` for the publishable package.
- Tests run under Vitest in jsdom; specification tests are the immutable oracle — a failing one means the implementation is wrong.

## CodeOps

- No CodeOps layout yet (`codeops/` is absent); run `setup-codeops` to add requirements and plans when this repository adopts the workflow.
- Specialist coverage: check due — run analyze-agents (never checked).

<!-- CODEOPS-PROJECT:END -->
