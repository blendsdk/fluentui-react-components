# fluentui-react-components

Monorepo for **custom React components built on Fluent UI v9**. Every component
follows Fluent UI's own component pattern — a typed props contract, a state
hook, a render function, and Griffel styles over design tokens — so the
library composes with Fluent UI instead of imitating it.

## Structure

```
packages/react-components/     @blendsdk/fluentui-react-components — the publishable library
.opencode/skills/              fluentui-components — the component-authoring skill for coding agents
scripts/check-skill.mjs        skill guard (frontmatter, IDs, links), runs in CI
.github/workflows/             CI, release (npm via OIDC), Storybook to GitHub Pages
```

The library builds with Vite (ESM bundle) and TypeScript (declarations), tests
with Vitest in jsdom, documents with Storybook, and releases with
[`@blendsdk/lockstep`](https://www.npmjs.com/package/@blendsdk/lockstep).

## Requirements

- Node.js 22 or newer
- pnpm 12 (`packageManager` in `package.json` pins the exact version)

```bash
pnpm install --frozen-lockfile
```

## Commands

| Command                             | Purpose                                                      |
| ----------------------------------- | ------------------------------------------------------------ |
| `pnpm build`                        | Build every package (Vite bundle + declarations)             |
| `pnpm test`                         | Run the test graph (Vitest, jsdom)                           |
| `pnpm type-check`                   | Type-check sources, tests and Storybook config               |
| `pnpm storybook`                    | Component workbench on <http://localhost:6006>               |
| `pnpm storybook:build`              | Static Storybook build                                       |
| `pnpm format` / `pnpm format:check` | Prettier                                                     |
| `pnpm skill:check`                  | Validate the project skills                                  |
| `pnpm verify`                       | The full gate: format, skill check, type-check, build, tests |
| `pnpm lockstep:version:auto`        | Bump all packages from the conventional commits              |
| `pnpm lockstep:publish:latest`      | Publish all packages to `latest` and push the release commit |

Single package: `pnpm --filter @blendsdk/fluentui-react-components build`.

## Building components

New components follow the house pattern, documented in the local skill
`.opencode/skills/fluentui-components/` (SKILL.md, `references/`, and
`templates/` for every file). The living example in the package is
`DescriptionList` + `DescriptionListItem`: a container that negotiates a layout
through a context, and an item that renders it.

The short version — every component is a folder under
`src/components/<Name>/` with:

| File                        | Responsibility                                                |
| --------------------------- | ------------------------------------------------------------- |
| `<Name>.tsx`                | `forwardRef` shell: state hook → render function              |
| `<Name>.types.ts`           | The props contract (`ComponentPropsWithoutRef` + owned props) |
| `use<Name>.ts`              | Pure state hook: defaulting, contexts, style classes          |
| `render<Name>.tsx`          | Pure state → elements                                         |
| `use<Name>Styles.styles.ts` | Griffel `makeStyles` + tokens                                 |
| `<Name>Context.ts`          | Optional container ↔ child contract                           |
| `index.ts`                  | The folder's public exports                                   |

Tests live in `test/` (`*.spec.test.tsx` for the contract,
`*.impl.test.tsx` for internals), stories beside the component
(`*.stories.tsx`).

## Release flow

Releases are lockstep: every package shares one version. `.github/workflows/release.yml`
is triggered manually, validates the branch, builds and tests, bumps the
version from the conventional commits (or a forced bump type), and publishes
with a dist-tag.

Publishing authenticates through **npm OIDC trusted publishing** — no npm token
is stored. Before the first automated release:

1. Publish once from a workstation (interactive npm login):
   `pnpm lockstep publish --tag latest`.
2. Register the workflow as a trusted publisher:
   `npm trust github @blendsdk/fluentui-react-components --file release.yml --repo blendsdk/fluentui-react-components --allow-publish`.
3. Restrict token-based publishing in the package settings on npmjs.com.

Storybook deploys to <https://blendsdk.github.io/fluentui-react-components/>
from `main`; enable GitHub Pages once with **Source: GitHub Actions**.

## License

MIT © TrueSoftware B.V.
