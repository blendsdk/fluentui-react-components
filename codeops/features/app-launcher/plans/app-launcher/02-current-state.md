# Current State: App Launcher

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

The destination package `@blendsdk/fluentui-react-components`
(`packages/react-components/`) hosts six components (`ConfirmDialog`, `ConfirmProvider`,
`DescriptionList`, `DescriptionListItem`, `ErrorDialog`, `SystemErrorProvider`) following the
house anatomy — `forwardRef` shell, props types, state hook, render function, Griffel styles,
folder barrel — with spec/impl tests under `test/`, one story beside each component, and a single
export-surface pin. Everything the launcher family needs already exists: the Fluent UI v9 peer
dependencies, the component pattern (documented in `.opencode/skills/fluentui-components/`), the
Vitest + Testing Library setup, the Storybook preview provider and the packaging build.

The launcher family itself does **not** exist in this package: no `AppLauncher*` sources, tests,
stories, exports or README sections.

### The Source Authority

The family exists in VirtuoApp's `@virtuoapp/react-app-launcher`
(`/home/gevik/workdir/codeindustry/VirtuoApp/packages/react-app-launcher`), reviewed during the
planning session: 43 source files (7 component folders + barrel), 10 test files (37 tests, all
green), a 269-line README, and a development workbench
(`apps/web/src/dev/app-launcher-workbench.tsx` plus `app-launcher-logos.tsx`) that is the story
material. It imports only `react`, `@fluentui/react-components` and `@fluentui/react-icons`;
verified during planning, every import resolves against the installed destination dependencies
(including `resolvePositioningShorthand` and `GridDots20Regular`). The source repository is
read-only for this plan (AR #17).

### Relevant Files

| File (repo-relative)                                          | Purpose                                  | Changes Needed                                              |
| ------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| `packages/react-components/src/index.ts`                      | Package barrel                           | Add 7 component exports + 9 type exports (per phase)        |
| `packages/react-components/src/components/AppLauncher*/`      | — (does not exist)                       | New: 7 ported component folders + 7 story files             |
| `packages/react-components/test/app-launcher*`                | — (does not exist)                       | New: 8 ported test files                                    |
| `packages/react-components/test/package-exports.spec.test.ts` | Export-surface pin (exact key list)      | Extend per phase (blocks: 5 + 6 types; shell: 2 + 3 types)  |
| `packages/react-components/README.md`                         | Component documentation                  | Add the family sections, quick start and localization table |
| `packages/react-components/.storybook/preview.tsx`            | FluentProvider wrapper for every story   | Unchanged — stories must not re-wrap                        |
| `packages/react-components/tsconfig.build.json`               | Declaration build (excludes `*.stories`) | Unchanged — no shared fixture files                         |

### Code Analysis

The source component files use the same anatomy the destination documents (verified file by file
during planning): shell calling a state hook and a render function, Griffel `makeStyles` with
`tokens`, `mergeClasses` for caller classes, native-prop pass-through, JSDoc on every public
symbol. The only systematic differences are formatting (the source uses 4-space Biome output) and
three comment references to the source's context (AR #8 of the requirements register).

## Gaps Identified

### Gap 1: The launcher family is absent

**Current Behavior:** consumers of this package cannot render an app launcher.
**Required Behavior:** the 7 components, 9 public types and the internal layout context land
exactly as specified in RD-01/RD-02.
**Fix Required:** the two-port phases in this plan.

### Gap 2: The source ships no stories

**Current Behavior:** the story content lives in the source's dev workbench (5 samples + 6 logos).
**Required Behavior:** the samples become the `AppLauncher` story; the six remaining components
receive variant stories per the repository's definition of done.
**Fix Required:** the story tasks in both phases (AR #5, #10 of the requirements register).

## Dependencies

### Internal Dependencies

- None beyond the existing package infrastructure (barrel, pin, Storybook, Vitest setup).

### External Dependencies

- `@fluentui/react-components` (existing peer/dev dependency) — the only runtime import besides React.
- `@fluentui/react-icons` (existing peer/dev dependency) — sized icons in the trigger, samples and stories.

## Risks and Concerns

| Risk                                                                                 | Likelihood | Impact | Mitigation                                                                                                                            |
| ------------------------------------------------------------------------------------ | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Silent drift from the source while "cleaning up" the port                            | Medium     | High   | Normalized-diff gate per phase (AR P3) + reviewer/auditor per the repo's quality policy                                               |
| jsdom cannot verify docking geometry, sticky search, tooltip suppression, hover lift | Certain    | Low    | The `AppLauncher` story's manual review checklist, recorded in the phase (AR #13)                                                     |
| Fluent stylesheet insertion order changes specificity assumptions                    | Low        | Medium | The compensation is part of the frozen source (data attribute + `:enabled` guards); no action — a change would be a recorded finding  |
| Tooltip-timing test (600 ms window) flakes on slower machines                        | Low        | Low    | Identical mechanics and versions to the source suite; a flake is investigated, never worked around by editing the oracle              |
| The composed `AppLauncher` story file grows beyond the repo's ~700-line split point  | Medium     | Low    | Planning size check: the story stays under the threshold; if review disagrees, the split is a recorded finding, not a silent refactor |
