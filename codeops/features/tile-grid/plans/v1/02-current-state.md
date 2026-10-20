# Current State: TileGrid Phase A

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)
> **CodeOps Artifact Schema**: 1

## Existing Implementation

### What Exists

The repository is a pnpm/Turborepo monorepo with one publishable package,
`@blendsdk/fluentui-react-components` (version `0.2.1`). It builds a single ESM library with Vite and emits declarations with TypeScript. The package targets React 19 and Fluent UI v9, uses Griffel design tokens, tests with Vitest 5 in jsdom, and documents components with Storybook 10.

Components follow the house pattern documented in `AGENTS.md` and the `fluentui-components` skill:

- `src/components/<Name>/<Name>.tsx` — `forwardRef` shell
- `<Name>.types.ts` — public props contract
- `use<Name>.ts` — state hook
- `render<Name>.tsx` — pure render function
- `use<Name>Styles.styles.ts` — Griffel styles with tokens
- `index.ts` — barrel

`AppLauncherItem` and `AppLauncherGrid` demonstrate the tile/list pattern and list semantics. `LoadingOverlay` demonstrates a controlled `forwardRef` component with a state hook and a documented ownership boundary. `DescriptionList` demonstrates a container/item context, which `TileGrid` does not need because its content is supplied through `renderItem`. `FormTextField` and `FormDropdownField` demonstrate the generic `forwardRef` assertion pattern that `TileGrid<T>` will follow.

The test convention is:

- `test/*.spec.test.tsx` — requirement-derived contract tests (immutable oracle)
- `test/*.impl.test.tsx` — internals and edge cases
- `test/*.ssr.test.tsx` — node-environment SSR smoke where relevant
- `test/package-exports.spec.test.ts` — public runtime and type export pin

`test/setup.ts` currently registers `@testing-library/jest-dom/vitest` and cleans up rendered trees. It does not provide `ResizeObserver` or pointer-capture stubs.

### Relevant Files

| File                                                          | Purpose                          | Changes Needed                                                                      |
| ------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| `packages/react-components/src/index.ts`                      | Package root exports             | Add `TileGrid` and Phase A types                                                    |
| `packages/react-components/test/package-exports.spec.test.ts` | Export pin                       | Add `TileGrid` to runtime list and Phase A type imports                             |
| `packages/react-components/test/setup.ts`                     | jsdom setup                      | Add conditional `ResizeObserver`/pointer-capture stubs                              |
| `packages/react-components/vitest.config.ts`                  | jsdom unit tests                 | Exclude `test/browser/**` and `test/perf/**`                                        |
| `packages/react-components/tsconfig.json`                     | Type-check scope                 | Add the new Vitest config files to `include`                                        |
| `packages/react-components/vite.config.ts`                    | Library build                    | Externalize `@tanstack/react-virtual`/`@tanstack/virtual-core`                      |
| `packages/react-components/package.json`                      | Package manifest                 | Add `dependencies`, browser/perf dev deps and scripts                               |
| `package.json` (root)                                         | Root command surface             | Add `test:browser`/`test:browser:all`/`test:perf` wrappers                          |
| `packages/react-components/README.md`                         | Package documentation            | Add the Phase A `TileGrid` section                                                  |
| `README.md` (root)                                            | Repository documentation         | Add the browser/perf commands to the command table                                  |
| `.github/workflows/ci.yml`                                    | CI                               | Add `browser-matrix` and `performance` jobs                                         |
| `turbo.json`                                                  | Task graph                       | Include fixtures in Storybook/test inputs; add browser/perf task metadata if needed |
| `packages/react-components/src/components/AppLauncherGrid/*`  | List semantics reference         | Reuse the list/listitem approach, not the static grid                               |
| `packages/react-components/src/components/LoadingOverlay/*`   | Controlled component reference   | Reuse the state-hook/ownership style                                                |
| `packages/react-components/src/components/FormTextField/*`    | Generic `forwardRef` reference   | Reuse the generic assertion pattern                                                 |
| `AGENTS.md`                                                   | Project commands and conventions | No change; the plan follows it                                                      |

### Code Analysis

The existing component pattern separates prop resolution (`use<Name>`) from rendering (`render<Name>`), which keeps the render function pure and makes the implementation testable. `TileGrid` will follow that split, but its state hook is larger because it owns measurement, geometry, the virtualizer, and selection. The plan splits those concerns into internal modules and hooks so no file approaches the ~700-line split threshold.

The current test configuration runs every `test/**/*.{test,spec}.{ts,tsx}` file in jsdom. Browser test files named `*.browser.test.tsx` would match the default include, so the unit config must exclude `test/browser/**` and `test/perf/**`. The default `pnpm test` stays the fast jsdom gate; the browser and performance configs are separate.

The current Vite config externalizes React, React DOM, React Hook Form, and every Fluent UI package. `@tanstack/react-virtual` is a direct dependency and must be externalized too; otherwise the library bundle would include a second virtualizer instance and the application could not share it.

The package currently has no `dependencies` field; runtime implementation dependencies are peers or dev dependencies. RD-02 requires `@tanstack/react-virtual` to be a direct dependency, so the manifest gains a `dependencies` block. `@dnd-kit/core` stays out until RD-04.

The CI workflow runs the unit gate, Storybook build, and pack guard, but has no browser or performance job. The plan adds separate jobs so the existing `verify` job stays fast and the new gates are explicit.

## Gaps Identified

### Gap 1: No geometry engine

**Current Behavior:** The package has no layout engine for fixed, masonry, justified, or mosaic collections.
**Required Behavior:** A pure geometry engine returns deterministic rectangles, bands, total height, point lookup, first-visible lookup, and offset lookup.
**Fix Required:** Add `src/components/TileGrid/geometry/` with normalized input, column-count calculation, four layout strategies, and the internal geometry port.

### Gap 2: No virtualized scroll container

**Current Behavior:** `AppLauncherGrid` is a static `ul`; it renders every child.
**Required Behavior:** `TileGrid` owns a scroll container, measures it with `ResizeObserver`, mounts only the visible window plus two-row overscan, and preserves the anchor on layout/tile-size changes.
**Fix Required:** Add `virtualization/` and the `TileGrid` state hook; integrate TanStack Virtual for bands (fixed/justified/mosaic) and lanes (masonry).

### Gap 3: No selection or marquee foundation

**Current Behavior:** The package has no selection model, no selected-ID store, and no marquee engine.
**Required Behavior:** RD-01's controlled/uncontrolled selection store and marquee controller, plus the minimal Phase A public selection wiring.
**Fix Required:** Add `selection/` and `marquee/`; wire the selection store through `TileGrid` click mapping and the handle.

### Gap 4: No 20K fixture, browser harness, or performance gate

**Current Behavior:** Tests are jsdom-only; no Playwright provider, browser project, performance project, or 20K fixture exists.
**Required Behavior:** A shared deterministic 20K fixture; Chromium browser tests per task; full matrix and performance jobs in CI; 20K mounted/geometry/selection budgets.
**Fix Required:** Add `test/fixtures/tileGridFixture.ts`, `vitest.browser.config.ts`, `vitest.browser-matrix.config.ts`, `vitest.perf.config.ts`, browser/perf tests, scripts, and CI jobs.

### Gap 5: Missing package surface and documentation

**Current Behavior:** No `TileGrid` export, no Phase A export pin, no package README section, no TanStack external, no browser/perf scripts.
**Required Behavior:** Phase A package surface, documentation, manifest, and CI are complete.
**Fix Required:** Update the package root, export pin, README, manifest, Vite config, Turbo inputs, and CI. Mark the package README TileGrid section unreleased; the Phase A surface is internal (PF-001).

### Gap 6: Missing module-evaluation, selection-proxy, and renderer-read verification

**Current Behavior:** No node-environment import smoke, no public 20K selection proxy, no renderer `getBoundingClientRect`/offscreen test, and no memoized item cell/render-count test exist.
**Required Behavior:** RD-02 AC 16 import safety, RD-01 AC 13 public selection observable proxy, RD-02 AC 12 renderer DOM-read/offscreen proof, and RD-03’s affected-cell render counter.
**Fix Required:** Add the plan’s ST-46–ST-49 tests and the internal `TileGridItemView` memoized cell (PF-002–PF-005).

## Dependencies

### Internal Dependencies

```
geometry (pure)
  ├── TileGrid state hook
  ├── selection store (via geometry port)
  └── marquee controller (via geometry port)
        ↓
TileGrid component / render / styles
        ↓
stories, browser tests, performance tests
```

- `selection` depends on the geometry port for marquee hit testing, but not on the renderer.
- `marquee` depends on the geometry port and the selection store state.
- `TileGrid` depends on geometry, virtualization, selection, and styles.
- Stories/tests depend on the shared fixture and the public component.

### External Dependencies

- `@tanstack/react-virtual` `3.14.21` (runtime, direct dependency, externalized)
- `vitest` `5.0.5` (exact pin to match the browser-provider peer; PF-008)
- `@vitest/browser` `5.0.5` (dev)
- `@vitest/browser-playwright` `5.0.5` (dev)
- `playwright` `1.64.1` (dev; browser provider peer)
- Existing peers: React 19, React DOM 19, Fluent UI v9, Fluent icons, React Hook Form, DatePicker compat
- Deferred: `@dnd-kit/core` `6.3.1` (RD-04 only)

## Risks and Concerns

| Risk                                                                                     | Likelihood | Impact | Mitigation                                                                                                                                                               |
| ---------------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| This workspace has no Node/pnpm toolchain, so the plan cannot execute `pnpm verify` here | High       | High   | Write the plan now; execution must run in the project's Node 22/pnpm 12.11.2 environment. Record the limitation in the handoff.                                          |
| TanStack's masonry lane assignment diverges from the geometry engine                     | Medium     | High   | Parity test compares every virtual item lane to the geometry lane on the 20K fixture; geometry remains the source for rendered positions.                                |
| Performance budgets are flaky in headless CI                                             | Medium     | Medium | Assert generous thresholds (mounted <120, geometry <200ms, p95 selection <16ms); frame timing logs and fails only on a clear regression.                                 |
| 20K fixture memory and data-URL image cost slow the test suite                           | Medium     | Medium | Use deterministic lightweight data URLs; render image-bearing fixtures only in the browser/image tests; pure geometry tests use plain items.                             |
| jsdom cannot measure layout                                                              | High       | Medium | Keep measurement-dependent tests in the browser project; jsdom tests cover props, selection, empty state, and pure geometry.                                             |
| Generic `forwardRef` typing in TypeScript 7                                              | Medium     | Medium | Follow the existing `FormTextField` assertion pattern; add a type-level export test.                                                                                     |
| Direct dependency externalization or missing lockfile update breaks consumers            | Medium     | High   | Add `@tanstack/react-virtual` to `dependencies`, externalize `@tanstack/*`, run `pnpm install`, verify with `pnpm pack:check` and `pnpm verify`.                         |
| Storybook imports the test fixture and the build cache misses fixture changes            | Low        | Medium | Add `test/fixtures/**/*.ts` to the Storybook task inputs; keep the fixture dependency-free.                                                                              |
| Staged marquee controller looks like dead code                                           | Medium     | Low    | Document it as an internal, tested unit consumed by the RD-03 plan; keep it unexported; the Phase A quality review records the exception.                                |
| Phase A public selection subset overlaps RD-03 ownership                                 | Medium     | Medium | `01-requirements.md` records the delta; the minimal wiring is limited to the behavior needed to exercise RD-01; RD-03 adds controls, focus, keyboard, and announcements. |
| Browser test cleanup or `@testing-library/react` timing differs in browser mode          | Medium     | Medium | Use the existing `cleanup` setup; run a browser smoke test first; keep browser tests focused and deterministic.                                                          |
| Final public contract is deferred, so early consumers see a subset                       | Medium     | Medium | Phase A is internal; no publish/tag until the final contract freeze (6.3.3); mark the README section unreleased; complete the final contract in RD-03/RD-04 plans.          |
| Module evaluation accesses `window`/`document` in Node/SSR                               | Medium     | High   | Add the node-environment import smoke (ST-46); no full SSR render is added.                                                                                              |
| Selection change re-renders all visible item cells                                       | Medium     | High   | Memoize `TileGridItemView` and add the affected-cell render-count test (ST-49); RD-03’s render counter then passes without renderer rework.                               |
| Renderer DOM reads or offscreen wrappers regress during 20K scroll                       | Medium     | High   | Add the renderer `getBoundingClientRect` spy and per-layout offscreen assertions (ST-48).                                                                                 |
