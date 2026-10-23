<!-- CODEOPS-PROJECT:START -->

# fluentui-react-components project guidance

## Project

- pnpm and Turborepo monorepo for custom React components built on Fluent UI v9.
- Node.js 22 or newer; pnpm 12.11.2 pinned through `packageManager` — keep exactly one lockfile.
- `main` is the integration branch; CI, releases and the Storybook deployment run from it.

## Structure

- `packages/react-components/` — the only publishable package, `@blendsdk/fluentui-react-components`. Component sources live in `src/components/<Name>/`, tests in `test/`, stories in each component's `stories/` folder, Storybook configuration in `.storybook/`.
- `packages/react-components/src/components/TileGrid/` — the largest component, split into internal `geometry/`, `virtualization/`, `selection/`, `focus/` and `marquee/` modules. It stays out of the package-root export until the tile shell and arranging work lands and the contract and dependencies freeze.
- `skills/` — the distributable agent skills: `fluentui-components` (component pattern, references, templates) and `rhf-zod-forms` (RHF + Zod form workflow). `opencode.json` registers `./skills` as an extra source.
- `scripts/check-skill.mjs` — validates the distributable skills under `skills/` and the CodeOps skills under `.opencode/skills`: ID shape, frontmatter, duplicate IDs, and relative links outside code fences.
- `scripts/sync-skills.mjs` — mirrors `skills/` into `packages/react-components/skills/` at build and before packing; the package copy is generated and gitignored.
- `.github/workflows/` — CI (`ci.yml`), manual npm release via OIDC trusted publishing (`release.yml`), Storybook to GitHub Pages (`pages.yml`; live at `https://blendsdk.github.io/fluentui-react-components/`).

## Commands

- Install exactly from the lockfile: `pnpm install --frozen-lockfile`.
- Full gate: `pnpm verify` (format check, skill check, type-check, build, tests).
- Skill distribution: `pnpm skills:sync` mirrors the source into the package; `pnpm skills:check` lists the packaged skills through the local `skills` CLI.
- Repository-wide: `pnpm build`, `pnpm test`, `pnpm type-check`, `pnpm storybook:build`.
- Browser suite: `pnpm test:browser` runs the Chromium layout, selection, focus, marquee and interaction suites; `pnpm test:browser:all` runs the Chromium/Firefox/WebKit matrix used by CI.
- Performance suite: `pnpm test:perf` runs the Chromium 20K-item geometry, virtualization-window, selection, focus-render and scroll measurements.
- One package: `pnpm --filter @blendsdk/fluentui-react-components <script>`.
- Storybook workbench: `pnpm storybook` (port 6006).
- Format: `pnpm format` / `pnpm format:check` (Prettier).
- Publish artifact guard: build first, then `pnpm pack:check` (fails if the npm tarball contains source or story files).
- Release: run the `release.yml` workflow (manual dispatch; it versions, publishes through npm OIDC, then pushes the release commit and tags), or locally `pnpm lockstep:version:auto` followed by `pnpm lockstep:publish:latest`.

## Conventions

- Components follow the Fluent UI v9 pattern documented in the `fluentui-components` skill: `<Name>.tsx` (forwardRef shell), `<Name>.types.ts` (props contract), `use<Name>.ts` (state hook), `render<Name>.tsx` (pure render), `use<Name>Styles.styles.ts` (Griffel + tokens), optional `<Name>Context.ts`, `index.ts` barrel. Deviations from the anatomy are recorded exceptions, never silent drift: `SystemErrorProvider` has no styles file and keeps its state and render in one file; the provider-shaped `ConfirmProvider` has no render or styles layers either; `AppLauncherTrigger` has no styles layer and reuses the launcher's styling; `Loading` names its internal state hook `useLoadingBase` because `useLoading` is the public controller hook; the `Form*Field` wrappers have no styles layer because Fluent `Field` owns layout and validation styling.
- `TileGrid` invariants: an internal generic `forwardRef` implementation behind a callable public wrapper; geometry, virtualization, selection, focus and marquee helpers stay internal, and the marquee controller is mounted; the grid owns the roving `tabIndex`, so the active wrapper is the single tab stop for outside entry; a single-mode Shift range keeps the original anchor and commits only the target; nested interactive content keeps its native keyboard behavior.
- The `Form*Field` wrappers are generic React Hook Form bindings. Their shared internal helpers live in `src/forms/`. React Hook Form and `@fluentui/react-datepicker-compat` are peers; the application owns `useForm`, the schema, and DTO mapping.
- Tests live in `test/`: `*.spec.test.tsx` (contract, written first and kept unchanged — the immutable oracle), `*.impl.test.tsx` (internals), a `*.ssr.test.tsx` smoke in the node environment where server rendering matters, and `package-exports.spec.test.ts` pinning the public export surface; one `<Name>.stories.tsx` per component under `src/components/<Name>/stories/`, plus scenario `*.story.tsx` files there where a component needs more (`AppLauncher`).
- Hooks and render functions stay pure; styling uses `makeStyles` with `tokens` only, and class names merge with `mergeClasses`; native props of the root element pass through.
- Documentation comments are mandatory for public and non-trivial internal symbols. Never reference plans, requirements or task identifiers in code or comments.
- Conventional Commits (`feat(scope): ...`); Prettier is the only formatter — there is no ESLint.
- `dist/`, `storybook-static/` and `packages/react-components/skills/` are generated; never edit them. Edit the top-level `skills/` source instead. The CodeOps payload under `.opencode/` (the CodeOps `skills/` directories, `agents/`, `_shared/`, `references/`) is installer-managed and replaced on upgrade — never edit it; `fluentui-components` and `rhf-zod-forms` are the repo-authored distributable skills.

## Verification

- Run `pnpm verify` before completing any work. `.github/workflows/ci.yml` is the authoritative full sequence: it also builds Storybook, checks `npm pack --dry-run` for the publishable package, and runs the `browser-matrix` and `performance` jobs.
- Tests run under Vitest, jsdom by default with per-file `// @vitest-environment node` overrides for the SSR smokes; specification tests are the immutable oracle — a failing one means the implementation is wrong.

## CodeOps

- Nested layout: `codeops/.codeops.yml` is the marker (`integrationBranch: main`), `codeops/codeops.json` holds the strict quality policy, and `codeops/00-roadmap.md` is the portfolio roadmap. Feature artifacts live under `codeops/features/<feature>/` and appear lazily with the first requirement or plan.
- Project skills and agents come from `opencode-codeops@2.2.1` (`install --project`): 17 CodeOps skills recorded in `.opencode/skills/.opencode-codeops.json` plus 12 hidden dispatch agents in `.opencode/agents/`. Restart OpenCode after an install or upgrade so they load. The two distributable skills live under the top-level `skills/` directory and are not part of the CodeOps payload.
- Specialist coverage: up to date (2026-10-22) — no specialist is warranted; `make-plan` re-runs the check with phase evidence.

<!-- CODEOPS-PROJECT:END -->
