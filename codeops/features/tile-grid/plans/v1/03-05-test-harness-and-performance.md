# Test Harness and Performance: TileGrid Phase A

> **Document**: 03-05-test-harness-and-performance.md
> **Parent**: [Index](00-index.md)
> **CodeOps Artifact Schema**: 1

## Overview

Phase A adds the package's first browser and performance harness. The existing jsdom suite stays the fast unit gate. Browser tests run in Chromium per task and in the full Chromium/Firefox/WebKit matrix in CI. The performance job renders the shared 20K fixture and records the geometry, mounted-wrapper, selection-toggle, and scripted-scroll budgets.

**References:** RD-02 §Performance, §Security, §Storybook; RD-02 AC 1, 11–14; RD-01 §Performance; PF-004 (browser harness), PF-015 (test strategy/performance). **Decisions:** AR #9, AR #10, AR #15–AR #18, AR #20, AR #21.

## Harness architecture

```
packages/react-components/
├── vitest.config.ts                  # jsdom unit tests (existing, excludes browser/perf)
├── vitest.browser.config.ts          # Chromium browser project
├── vitest.browser-matrix.config.ts   # Chromium + Firefox + WebKit
├── vitest.perf.config.ts             # Chromium performance project
├── test/
│   ├── setup.ts                      # jest-dom + cleanup + conditional jsdom stubs
│   ├── jsdomStubs.ts                 # controllable ResizeObserver / pointer capture
│   ├── fixtures/tileGridFixture.ts   # deterministic 20K/small fixture
│   ├── tile-grid-ssr.spec.test.ts    # node import smoke, no render (PF-002)
│   ├── browser/*.browser.test.tsx
│   └── perf/*.perf.test.tsx
```

No new browser runner is introduced. Playwright is only the Vitest provider; tests still use `@testing-library/react` (`render`, `screen`) and the existing cleanup. The node import smoke uses `// @vitest-environment node` in the existing unit config and is not an SSR render test.

## Dependencies and scripts

Add to `packages/react-components/package.json`:

```json
{
  "dependencies": {
    "@tanstack/react-virtual": "3.14.21"
  },
  "devDependencies": {
    "vitest": "5.0.5",
    "@vitest/browser": "5.0.5",
    "@vitest/browser-playwright": "5.0.5",
    "playwright": "1.64.1"
  },
  "scripts": {
    "test:browser": "vitest run --config vitest.browser.config.ts --reporter=verbose",
    "test:browser:all": "vitest run --config vitest.browser-matrix.config.ts --reporter=verbose",
    "test:perf": "vitest run --config vitest.perf.config.ts --reporter=verbose"
  }
}
```

`@dnd-kit/core` is not added in Phase A. `@tanstack/react-virtual` is a direct dependency; the lockfile is updated through `pnpm install`, never hand-edited. The existing `vitest` range is narrowed to exact `5.0.5` because `@vitest/browser`/`@vitest/browser-playwright` 5.0.5 peer-require exactly `vitest 5.0.5` (PF-008). The Vite build externalizes `/^@tanstack\//` so the application resolves one virtualizer instance. `turbo.json` adds `test/fixtures/**/*.ts` to the Storybook inputs, includes `test/browser/**`/`test/perf/**` in the test inputs, and adds the new Vitest config files to the type-check inputs; the default test task still excludes those directories through the Vitest config. `tsconfig.json` adds `vitest.browser.config.ts`, `vitest.browser-matrix.config.ts`, and `vitest.perf.config.ts` to its `include` so `pnpm type-check` covers them.

The root `package.json` gets thin wrappers so the documented commands work from the repository root:

```json
{
  "scripts": {
    "test:browser": "pnpm --filter @blendsdk/fluentui-react-components test:browser",
    "test:browser:all": "pnpm --filter @blendsdk/fluentui-react-components test:browser:all",
    "test:perf": "pnpm --filter @blendsdk/fluentui-react-components test:perf"
  }
}
```

The package scripts above invoke Vitest directly; the root wrappers keep the commands and CI steps consistent with the existing `pnpm verify`/`pnpm test` convention.

## Vitest configurations

### `vitest.config.ts` (existing)

Keep the jsdom environment, setup file, and `test/**/*.{test,spec}.{ts,tsx}` include. Add:

```ts
exclude: ['node_modules', 'dist', 'storybook-static', '.turbo', 'test/browser/**', 'test/perf/**'];
```

`pnpm test` remains the fast unit gate and does not require Playwright.

### `vitest.browser.config.ts`

```ts
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export const browserTestConfig = {
  plugins: [react()],
  test: {
    include: ['test/browser/**/*.browser.test.tsx'],
    setupFiles: ['./test/setup.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
};

export default defineConfig(browserTestConfig);
```

### `vitest.browser-matrix.config.ts`

Import the browser config object from `vitest.browser.config.ts`, spread it, and **replace** `test.browser.instances` with `[{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }]`. Do not concatenate the Chromium instance with the three-browser list; the browser config exports its config object for this reuse. No environment-variable prefix is needed, so the script stays cross-platform.

### `vitest.perf.config.ts`

Same React plugin and setup file as the browser config; `include: ['test/perf/**/*.perf.test.tsx']`, Chromium, `headless: true`, `testTimeout: 120_000`, `hookTimeout: 120_000`. The performance job is separate from the normal browser job.

## jsdom stubs

`test/setup.ts` keeps `@testing-library/jest-dom/vitest` and `cleanup()`. It imports `installJsdomStubs()` from `test/jsdomStubs.ts`, which installs only when the API is missing:

- **`ResizeObserverStub`** — records observed elements, exposes a controllable `setElementSize(element, width, height)` helper that defines `clientWidth`/`clientHeight` and invokes the registered callbacks with a `contentRect`. `resetJsdomStubs()` clears instances between tests.
- **Pointer capture** — defines `setPointerCapture`, `releasePointerCapture`, and `hasPointerCapture` on `Element.prototype` when jsdom lacks them. The stubs are inert unless a test uses pointer events.

jsdom component tests that need item wrappers call `setElementSize(root, 800, 600)` (or another explicit size) before asserting. Without a measured width the component intentionally renders the spacer at height `0` and no items. The selection tests use the same helper; selection state does not depend on geometry, but the clickable wrappers do.

Browser tests import the same `test/setup.ts`; because the real APIs exist in Chromium/Firefox/WebKit, the stubs are not installed. No test imports the jsdom-only helpers in the browser project.

## Shared 20K fixture

`test/fixtures/tileGridFixture.ts` exports:

```ts
interface TileGridFixtureItem {
  id: string;
  label: string;
  width: number;
  height: number;
  aspectRatio: number;
  thumbnailUrl: string;
}

function createTileGridFixture(count?: number): readonly TileGridFixtureItem[];
```

- Default `count` is `20_000`; small stories pass `24` or `40`.
- IDs are `tile-0` … `tile-N`; labels are `Tile 0` … `Tile N`.
- Aspect ratios cycle `[0.8, 1, 1.25, 1.5, 2]`; `width`/`height` stay consistent with the ratio (height `100`).
- `thumbnailUrl` cycles five tiny inline SVG data URLs; no network access.
- The fixture is deterministic: no random values, dates, or environment reads.
- Stories import it from `../../../../test/fixtures/tileGridFixture`; browser/perf tests import it with a relative `../fixtures/...` path. The fixture has no React or Fluent dependency.

## Browser tests

`test/browser/tile-grid-layout.browser.test.tsx`:

- Render the public `TileGrid` with the 20K fixture in a fixed 1440×900 wrapper for each layout.
- Wait for the first measured render; assert the mounted wrapper count is under 120.
- Assert masonry does not mount a whole-column set: the mounted count stays bounded as the viewport scrolls.
- Scroll each of the four layouts; assert mounted indexes stay within the visible-plus-overscan window and spy on `Element.prototype.getBoundingClientRect` to assert zero calls on `[data-tile-grid-item]` (ST-48).
- Scroll the root to an item; assert the first visible item and offset survive a `tileSize` 160 → 200 change.
- Assert the root's `role="list"`, listitem labels, setsize/posinset, and the image count bounded by visible plus overscan.
- Assert the empty state renders `renderEmpty`/`strings.emptyMessage`.
- Assert the `ResizeObserver`-driven width change recomputes rectangles without remounting the whole grid.

`test/browser/tile-grid-selection.browser.test.tsx`:

- Render a small fixture with `selectionMode="multiselect"` and a controlled `selectedIds`.
- Click a tile, Ctrl/Cmd-click another, Shift-click a range; assert the callback sets and the selected visual state.
- Click a button inside `renderItem`; assert no selection.
- Use the handle ref to `selectAll`, `clearSelection`, and `scrollToSelected`; assert the first selected tile is in view.
- Render the 20K fixture; select/clear/read, run 200 public toggles; assert p95 under 16ms and mounted wrappers unchanged (ST-47).
- Spy on a stable `renderItem`; toggle one selected tile; assert only the affected mounted cell calls `renderItem` again, not all visible cells (ST-49).
- Assert the no-mount/no-prop-change callback rules.

Browser tests use real geometry and real pointer events. They do not mock the virtualizer or `ResizeObserver`.

## Performance test

`test/perf/tile-grid.perf.test.tsx` runs in Chromium:

1. **Geometry recompute** — import the pure `computeGeometry`; run two warm-ups and ten measured runs for each layout on the 20K fixture; assert p95 under 200ms.
2. **Mounted wrappers** — render the public `TileGrid` in a 1440×900 wrapper for each layout; count `[data-tile-grid-item]`; assert under 120.
3. **Selection toggle (supplement)** — measure 200 toggles on a 20K selected-ID set through the pure transition helper used by the store; assert p95 under 16ms. The public 20K selection observable proxy (select/clear/read, mounted count unchanged, affected-cell render count) is asserted in the Phase 4 browser selection suite (ST-47/ST-49), not here.
4. **Scripted scroll** — scroll the root by 100px per animation frame for 30 frames; collect frame intervals; log the 60fps target and assert p95 under 50ms (a clear pathological regression only; AR #16 accepted).

The performance test is not part of `pnpm test`; it runs in the CI `performance` job and at the final phase gate. The real performance test is written in Phase 6; the early phase `test:perf` checks are the harness smoke (PF-010). If a budget fails, the implementation is wrong or the test environment is pathological; the executor must report the measured values, not silently relax the RD budget.

## CI jobs

Keep the existing `verify` job unchanged (unit/type/build/Storybook/pack). Add:

```yaml
browser-matrix:
  runs-on: ubuntu-latest
  steps:
    # checkout, pnpm, node 22, pnpm install --frozen-lockfile
    - run: pnpm --filter @blendsdk/fluentui-react-components exec playwright install --with-deps chromium firefox webkit
    - run: pnpm test:browser:all

performance:
  runs-on: ubuntu-latest
  steps:
    # checkout, pnpm, node 22, pnpm install --frozen-lockfile
    - run: pnpm --filter @blendsdk/fluentui-react-components exec playwright install --with-deps chromium
    - run: pnpm test:perf
```

The workflow uses the existing pnpm/Node setup actions and caching. No secrets, services, or containers are required. The browser matrix job is the only place all three browsers run; `pnpm test:browser` stays Chromium for fast local/task feedback.

## Test data and mocks

- Real objects for items, geometry, selection sets, and DOM events.
- Only true browser gaps are stubbed: `ResizeObserver` and pointer capture in jsdom, plus an injected frame scheduler for the marquee auto-scroll unit test.
- Console warnings are spied on and restored; tests assert messages without item labels, image URLs, item IDs, or selected IDs.
- No image network mocks; the fixture uses data URLs and the image test counts elements, not requests.
- No snapshot files for geometry (RD-02 AC 2); hand-computed values and invariants are the oracle.

## Recorded Phase A baseline

Measured in Chromium on 2026-10-21 against the completed Phase A implementation (`test/perf/tile-grid.perf.test.tsx`). The 20K fixture, 1440×900 container, `tileSize=160`, and `gap=8` are shared with the browser suite. The ranges below cover three runs on the same host; the exact command was `pnpm test:perf`, and the per-run values are recorded in the gate logs.

| Measurement                                            | Result range      | Budget     |
| ------------------------------------------------------ | ----------------- | ---------- |
| Geometry p95, fixed                                    | 18.70–30.80 ms    | < 200 ms   |
| Geometry p95, masonry                                  | 5.50–14.50 ms     | < 200 ms   |
| Geometry p95, justified                                | 16.80–27.80 ms    | < 200 ms   |
| Geometry p95, mosaic                                   | 18.00–38.80 ms    | < 200 ms   |
| Mounted wrappers, fixed / masonry / justified / mosaic | 64 / 72 / 50 / 45 | < 120 each |
| Pure selection toggle p95, 20K set                     | 0.40–0.70 ms      | < 16 ms    |
| Scripted scroll frame-interval p95, fixed 20K          | 16.70–33.30 ms    | < 50 ms    |

The geometry figure is the maximum of ten samples by construction (nearest-rank p95 with ten samples); the ranges therefore reflect CPU/load variation rather than a stable point estimate. The scroll interval is logged against the 16.67 ms 60fps target but asserted only at the accepted 50 ms pathological-regression budget. The public 20K selection proxy and affected-cell render count remain covered by the Phase 4 browser selection suite.

## Verification checklist

- [x] All Phase A ST cases are defined in `07-testing-strategy.md` with concrete input/output.
- [x] Spec tests are written before implementation and fail first.
- [x] Geometry, layout, selection, handle, empty state, list semantics, and warnings pass in jsdom.
- [x] The node-environment import smoke passes (ST-46).
- [x] Four layouts mount under 120 wrappers at 20K in the browser.
- [x] Renderer DOM-read/offscreen assertions pass for all four layouts (ST-48).
- [x] Masonry start/end parity and lane range pass.
- [x] Anchor preservation passes.
- [x] Selection click mapping and handle methods pass in the browser.
- [x] 20K public selection proxy and affected-cell render count pass in the Phase 4 browser suite (ST-47/ST-49).
- [x] Performance job records/asserts the geometry/scroll budgets; the early `test:perf` gate is the harness smoke (PF-010).
- [x] `vitest` is pinned to 5.0.5 and the browser providers resolve; the lockfile is updated (PF-008).
- [x] No public publish/tag occurs before the final contract freeze (6.3.3, PF-001).
- [x] `pnpm verify`, `pnpm test:browser`, and `pnpm test:perf` pass. `pnpm test:browser:all` is configured as the CI matrix job; the local run used Chromium because the other browser binaries are not installed.
- [x] `pnpm storybook:build` passes; the 20K story builds.
- [x] `pnpm pack:check` passes after a build.
- [x] No regressions in the existing test suite or export pin.
