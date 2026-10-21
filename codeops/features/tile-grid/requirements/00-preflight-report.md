# Preflight Report: tile-grid requirements

> **Status**: ⚠️ STALE for RD-03 planning corrections — historical iteration 2 passed; focused refresh required
> **Iteration**: 2 (fix verification and targeted re-scan)
> **Previous Iteration**: 18 findings — all resolved; 0 carried forward
> **This Iteration**: 0 new root-cause findings; related clarifications listed below
> **Artifact**: Requirements set at `codeops/features/tile-grid/requirements/` (README, Ambiguity Register, RD-01..RD-04)
> **Audit target**: the requirements set only. The feature roadmap, portfolio roadmap, package source, tests, and README are context documents.
> **Scope**: Strict scope; normal decision mode. No scope-expansion register was created.
> **Codebase Grounded**: 24 source, test, config, and standards files examined; 27 references verified; 3 limitations recorded below.
> **Content hash**: `a697524d48c13ccb28d5e9a9dad6acec2004e8847aaac2aa2519e3d470bb8cda` (requirements set only, sorted, excluding this report)
> **Last Updated**: 2026-10-20 19:34
> **Reasoning suggestion**: high (advisory only; no `--auto-effort` was supplied)

Same-session review note: the artifact was created outside this session. The high-stakes finding batch was independently challenged before recommendations were recorded.

## Subsequent Requirement Revision

On 2026-10-21 the user approved requirements AR-19–AR-21 during RD-03 planning: stored selection
versus eligibility, library-owned `tabIndex`, and visible focus recovery after reset/unmount.
The affected files are `RD-03-selection-focus-and-accessibility.md` and the native `tabIndex`
contract in `RD-02-layout-and-virtualization.md`. The content hash and pass below describe the
earlier revision, not these corrections. A focused preflight refresh must verify these sections
and their downstream RD-03 plan before execution. No historical finding ruling is changed.

## Codebase Context Summary

**Repository:** `fluentui-react-components` pnpm/Turborepo monorepo. The only publishable package is `packages/react-components` (`@blendsdk/fluentui-react-components`).

**Tech Stack:** React 19.3.1, Fluent UI v9.74.9, TypeScript 7.0.2, Vite 8.3.4, Vitest 5.0.5 (jsdom), Storybook 10.6.2, Testing Library.

**Architecture:** The package root barrel exports every component and all public prop/union types. Components follow the house anatomy (typed props, state hook, render function, Griffel styles with tokens, forwarded ref). Native props pass through via `ComponentPropsWithoutRef`; generated internal text uses partial `strings` overrides. Tests split into immutable `*.spec.test.tsx` contracts and `*.impl.test.tsx` internals, with an exact runtime export pin.

**Key files examined:**

- `packages/react-components/package.json`
- `packages/react-components/vite.config.ts`
- `packages/react-components/vitest.config.ts`
- `packages/react-components/tsconfig.json`, `tsconfig.build.json`
- `packages/react-components/src/index.ts`
- `packages/react-components/test/setup.ts`
- `packages/react-components/test/package-exports.spec.test.ts`
- `packages/react-components/src/components/AppLauncherGrid/AppLauncherGrid.types.ts`
- `packages/react-components/src/components/AppLauncherGrid/renderAppLauncherGrid.tsx`
- `packages/react-components/src/components/AppLauncherItem/AppLauncherItem.types.ts`
- `packages/react-components/src/components/ConfirmDialog/ConfirmDialog.types.ts`
- `packages/react-components/src/components/FormTextField/FormTextField.tsx`
- `packages/react-components/README.md`
- `.github/workflows/ci.yml`
- `scripts/check-pack.mjs`
- `packages/react-components/.storybook/main.ts`, `preview.tsx`
- `codeops/codeops.json`, `codeops/00-roadmap.md`
- `.opencode/references/domains/selection.md`, `web-application.md`, `data-and-migration.md`

**Reference verification:**

| Reference                        | Result                                                                                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@tanstack/react-virtual` 3.14.x | Verified: 3.14.21 exists; React 19 peer range; `lanes` assigns items to the shortest lane and virtualizes vertically; overscan counts whole rows of lanes.                                                                                       |
| `@dnd-kit/core` 6.3.x            | Verified: 6.3.1 exists; React peer range accepts React 19; `useDraggable` needs `setNodeRef`, `attributes`, `listeners`.                                                                                                                         |
| Vitest 5 browser mode            | Verified: requires `@vitest/browser-playwright` and `playwright`; a browser project or separate config is needed.                                                                                                                                |
| Package dependency policy        | Verified: no runtime `dependencies`; only `peerDependencies` and `devDependencies`.                                                                                                                                                              |
| Vite externals                   | Verified: only React, React DOM, React Hook Form, and `@fluentui/*` are externalized.                                                                                                                                                            |
| Vitest environment               | Verified: jsdom only; includes `test/**/*.{test,spec}.{ts,tsx}`.                                                                                                                                                                                 |
| CI gate                          | Verified: no browser test step and no Playwright install.                                                                                                                                                                                        |
| Test setup                       | Verified: jest-dom matchers and cleanup only; no ResizeObserver or pointer-capture stub.                                                                                                                                                         |
| House native props               | Verified: `AppLauncherGridProps` extends `ComponentPropsWithoutRef<'ul'>`; README states native props pass through.                                                                                                                              |
| House strings                    | Verified: `ConfirmDialogStrings` and `ErrorDialogStrings` use partial overrides; README documents the pattern.                                                                                                                                   |
| Export pin                       | Verified: `package-exports.spec.test.ts` pins the exact runtime surface and imports every public type.                                                                                                                                           |
| Storybook discovery              | Verified: `src/**/stories/*.stories.@(ts\|tsx)`; scenario `.story.tsx` files are imported by an entry story.                                                                                                                                     |
| Generic forwardRef               | Verified: `FormTextField` already uses the generic base + cast pattern.                                                                                                                                                                          |
| Domain lens catalog              | Verified: five lenses; `Library/SDK focus` is not one of them.                                                                                                                                                                                   |
| jsdom behavior                   | Limitation: dependencies are not installed in this workspace, so the absence of ResizeObserver and pointer capture could not be executed here. The findings rely on the documented jsdom limitation and the missing stubs.                       |
| Pointer Events capture order     | Limitation: the full standard text is not available locally. The defined event order (capture released after `pointerup`/`pointercancel`, firing `lostpointercapture`) is asserted from the standard's event model. Flag for human confirmation. |
| TileGrid runtime behavior        | Not applicable: no TileGrid implementation exists; all findings are against the requirements.                                                                                                                                                    |

**Key observations:**

- The repository has no runtime dependencies and no browser test harness yet, so both are new integration work.
- `AppLauncherGrid` already demonstrates list semantics for tiles, but it is not virtualized and has no selection, marquee, drag, or zoom.
- The house props contract and localization pattern are explicit, which makes the TileGrid deviations findable.
- The current Vitest configuration has one jsdom project; browser tests would need a second project and a separate include pattern.

## Summary by Dimension

| #   | Dimension              | Findings | Highest Severity |
| --- | ---------------------- | -------- | ---------------- |
| 1   | Ambiguities            | 1        | 🟡               |
| 2   | Implicit Assumptions   | 0        | —                |
| 3   | Logical Contradictions | 3        | 🟠               |
| 4   | Completeness Gaps      | 3        | 🟠               |
| 5   | Dependency Issues      | 1        | 🟡               |
| 6   | Feasibility Concerns   | 1        | 🔴               |
| 7   | Testability            | 2        | 🟠               |
| 8   | Security Blind Spots   | 1        | 🟠               |
| 9   | Edge Cases             | 2        | 🟡               |
| 10  | Scope Creep Indicators | 1        | 🟡               |
| 11  | Ordering & Sequencing  | 1        | 🟡               |
| 12  | Consistency            | 1        | 🟡               |
| 13  | Codebase Alignment     | 1        | 🟡               |

Dimension 13 is also the cross-cutting lens for PF-001, PF-002, PF-003, PF-004, PF-009, PF-011, and PF-015. Dimension 2 produced no finding because every codebase assumption in the target was verified against the package, except where a finding already records the mismatch.

## Summary by Severity

| Severity       | Count | Status                       |
| -------------- | ----- | ---------------------------- |
| 🔴 CRITICAL    | 1     | Resolved — accepted Option A |
| 🟠 MAJOR       | 7     | Resolved — accepted Option A |
| 🟡 MINOR       | 10    | Resolved — accepted Option A |
| 🔵 OBSERVATION | 0     | —                            |

---

## Iteration 2 — Applied Fix Verification

All 18 accepted resolutions were applied to the README, the Ambiguity Register, and RD-01..RD-04.
The re-scan verified each fix and its direct consequences.

| PF     | Applied change                                                                                                                                                                                                                                    | Verification                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| PF-001 | README glossary and RD-02 masonry, virtualization, performance, and acceptance criteria now define geometry-owned lanes and a vertical item window; the fixture is corrected to eight automatic columns and per-layout mounted bounds.            | RD-02 AC 1 and 4; RD-02 §Virtualization; no whole-column mounting language remains.                          |
| PF-002 | RD-02 now defines one final `TileGridProps<T>`, `TileGridHandle`, `TileGridItemRenderArgs<T>`, `TileGridReorderArgs`, `TileGridStrings`, and the complete export pin; RD-03 declares its selection fragment as a subset.                          | RD-02 §Public props; RD-03 §Public props; README export pin; no separate public selection interface remains. |
| PF-003 | RD-04 adds `item: T`, defines the state props, extends native `div` props, removes `children`, and makes inline actions reachable through the overflow menu when hidden.                                                                          | RD-04 §Slots and item binding, §State props, §Actions, and AC 10/12.                                         |
| PF-004 | README and RD-04 define the browser project, `pnpm test:browser`, provider/Playwright dependencies, Chromium/Firefox/WebKit matrix, jsdom `ResizeObserver` stub, named 20K story, and separate `pnpm test:perf` job.                              | README §Quality and Verification; RD-02 §Container measurement; RD-04 §Recipe and browser tests.             |
| PF-005 | `scrollResetKey` is added to the public props; RD-03 resets only when it changes, and RD-04's recipe updates it with the filter.                                                                                                                  | RD-02 props; RD-03 §Filtering and AC 18; RD-04 §20K photo-library story and AC 13.                           |
| PF-006 | RD-04 adds `TileGridDragHandleProps`, the `dragHandle` render prop, concrete Move up/Move down actions, `reorderDisabled` coverage for every reorder entry point, and `isOverlay`/`isDragging` render flags.                                      | RD-04 §Handle start, §Keyboard reorder, §Drag layer, AC 2/7/17; RD-02 render args.                           |
| PF-007 | RD-03 defines one grid tab stop, `tabIndex={-1}` for inactive controls, Tab/Escape cycling, and shared-`name` radio grouping.                                                                                                                     | RD-03 §Roving focus, §Selection controls, AC 12/14.                                                          |
| PF-008 | AR #18, RD-02, RD-04, and README traceability now assign URL validation, authenticated image access, and image attributes to the application; the component accepts no URL.                                                                       | AR #18; RD-02 §Image rendering contract; RD-04 §Media; README §Traceability.                                 |
| PF-009 | RD-02 adds `isDisabled`; RD-03 defines disabled focusability and predicate precedence; RD-04 wires `disabled` into the shell state.                                                                                                               | RD-02 props; RD-03 §Selectable and disabled predicates; RD-04 §State props; RD-03 AC 15.                     |
| PF-010 | RD-01 now depends on RD-02's internal `TileGridGeometryPort`; the port is defined in RD-02; grid-level marquee tests moved to RD-03; the README graph and order reflect it.                                                                       | RD-01 header and integration points; RD-02 §Internal geometry input contract; README §Dependency Graph.      |
| PF-011 | RD-02/RD-04 declare both packages as direct `dependencies`, externalized; README architecture and key decisions record the manifest, lockfile, and install-note work.                                                                             | RD-02 §Virtualization; RD-04 §Drag layer; README §Architecture and §Key Architecture Decisions.              |
| PF-012 | RD-02 adds native `div` pass-through, `ariaLabel`/`aria-labelledby` precedence, and `TileGridStrings`; RD-03/RD-04 use the string keys; README pins the type.                                                                                     | RD-02 §Public props; RD-03 §Announcements; RD-04 §Handle start and §Keyboard reorder.                        |
| PF-013 | RD-02 normalizes ratios, `columns`, `gap`, tile-size bounds, and scroll offsets; duplicate IDs use first-occurrence wins; RD-01 and RD-04 reflect the policy. The re-scan also reconciled mosaic `columns` (honored; warning only for justified). | RD-02 §Aspect ratio, §Gap, §tileSize bounds, §Columns, §Stable keys, AC 6; RD-01 §Duplicate IDs.             |
| PF-014 | RD-01 cancels only on Escape/`pointercancel`, guards `lostpointercapture` after commit, and adds the terminal-event ordering; RD-04 applies the same rule to drag.                                                                                | RD-01 §Marquee cancel, §Marquee algorithm, AC 10; RD-04 §Drag cancel.                                        |
| PF-015 | README defines the public spec map, impl-test split, browser/perf jobs, hand-computed geometry oracle, and p95 budgets; RD-02 AC 2 replaces the snapshot; RD-01/RD-03 add the selection budget.                                                   | README §Quality and Verification; RD-02 AC 2; RD-01 §Performance; RD-03 §Performance.                        |
| PF-016 | `defaultTileSize` and uncontrolled zoom are removed; the public handle exposes only `selectAll`, `clearSelection`, and `scrollToSelected`; the extra scroll/focus helpers stay internal.                                                          | RD-02 §Optional zoom and §Public handle; RD-03 §Select-all/clear API and §Keyboard zoom; AC 9/14.            |
| PF-017 | README removes the non-catalog lens, keeps the catalog lenses, and states the app-owned data/migration boundary and rollback responsibility.                                                                                                      | README §Domain Lenses.                                                                                       |
| PF-018 | RD-01 defines a short background gesture as a no-op; RD-03 includes `selectionMode="none"` in the activation callback.                                                                                                                            | RD-01 §Marquee threshold; RD-03 §Activation callback; RD-01 AC 15.                                           |

**Related clarifications:**

- `TileGridHandle` programmatic selection methods call `onSelectionChange` once when the set changes;
  no-op interactions do not call it.
- `TileGridItemRenderArgs` carries the shell-relevant `dragHandleProps`, `reorderActions`, and
  resolved `strings`; the application forwards those fields to `TileGridItem` and uses the layout
  fields for its own content.
- `TileGridStrings` merges key by key over English defaults; blank static labels fall back to the
  defaults.
- Related correction under PF-013: mosaic now honors `columns` like fixed and masonry; the
  development warning for an ignored `columns` prop applies only to justified layout.
- Selection-mode stability now means the mode from the first render for the current mount.
- The internal `selectRange(targetId, currentIds)` signature matches the range algorithm.
- RD-01 acceptance criteria now target the internal selection layer; end-to-end click mapping remains
  in RD-03.
- Single-select now follows radio semantics: toggling the selected item keeps it selected; only
  selecting another item replaces it. `clearSelection()` remains an explicit programmatic clear.
- The jsdom setup provides a controllable `ResizeObserver` stub; real pointer capture is covered in
  the browser project.

## Findings (Iteration 1 Record)

The finding text below records the iteration 1 scan. The Iteration 2 table above is the per-finding
verification evidence; line numbers in the finding locations refer to the iteration 1 revision.

### PF-001: Masonry virtualization cannot meet the 20K mounted-tile bound 🔴 CRITICAL

**Dimension:** Feasibility Concerns (also Logical Contradictions, Codebase Alignment)
**Location:** `README.md` §Domain Glossary (line 70); `RD-02-layout-and-virtualization.md` §Masonry layout (lines 39-41), §Virtualized rendering (lines 70-74), §Virtualization (lines 169-180), §Performance (lines 205-211), acceptance criterion 1 (line 261); `RD-04-arranging-tile-shell-and-actions.md` acceptance criterion 13 (line 280)
**Codebase Evidence:** No TileGrid or virtualizer exists in `packages/react-components`. The fixed-column formula (`RD-02` lines 36-38) yields `floor((1440 + 8) / (160 + 8)) = 8` columns at the stated 1440 px width, 160 px tiles, and 8 px gap, not six columns. TanStack Virtual's `lanes` option assigns each item to the shortest lane and virtualizes a vertical item window; overscan counts whole rows of lanes.

**The Problem:** The glossary defines a masonry lane as a column lane, and RD-02 says only visible bands/lanes plus two overscan lanes are mounted. At 20K items across roughly eight columns, each lane holds about 2,500 items, so a literal reading mounts whole columns and defeats the 20K target. If the intent is TanStack's lane-aware item windowing, the document never says so and never defines the visible item range. The geometry engine also assigns items to the shortest column with a leftmost tie-break, while TanStack assigns lanes from `estimateSize` with a different tie-break, so geometry and rendering can disagree about which item is at which position. Only the fixed layout has a mounted-item acceptance criterion. The benchmark fixture is internally inconsistent: 160 px tiles at 1440 px width with an 8 px gap produce eight automatic columns; forcing six columns makes the actual tile width about 233 px, not 160 px.

**Options:**

| Option | Description                                                                                                                                                                         | Pros                                                                                   | Cons                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A      | Make geometry the single lane authority; give TanStack `lanes = columns` and a vertical item window, count overscan in rows, add per-layout mounted bounds, and correct the fixture | Keeps all four layouts at 20K; one lane assignment; matches AR #11's TanStack decision | Requires an adapter or a constrained range extractor; couples masonry to TanStack's lane model |
| B      | Keep per-column lane mounting and drop masonry from the 20K target                                                                                                                  | Smallest implementation                                                                | Removes a release-blocking layout from the core performance claim; contradicts AR #2/#12       |
| C      | Build a custom per-lane windowing virtualizer                                                                                                                                       | Full control over tie-breaks                                                           | The complexity packet already rejected a custom virtualizer; duplicates TanStack               |

**Recommendation:** Option A — make the geometry engine the sole lane authority and define masonry as a vertical item window over `lanes = columns`, with overscan measured in rows. Add a mounted-item acceptance criterion for every layout, and correct the benchmark fixture to either `columns=6` with an actual width of about 233 px or automatic layout with eight columns. This is the only option that keeps the approved four-layout, 20K-item scope and the approved dependency.

**Confidence:** High — changes only if 20K is intended to apply to fixed layout only, or if the pinned TanStack version cannot accept precomputed lane measurements.
**Hardening:** Challenger converged on Option A, with the refinement that geometry must own lane assignment rather than letting geometry and TanStack compute it twice.
**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-002: The final public `TileGrid` contract is never assembled 🟠 MAJOR

**Dimension:** Completeness Gaps (also Codebase Alignment, Consistency)
**Location:** `RD-02-layout-and-virtualization.md` §Public props and types (lines 114-153); `RD-03-selection-focus-and-accessibility.md` §Public props added to `TileGrid` (lines 122-136); `RD-04-arranging-tile-shell-and-actions.md` §Optional drag arranging (lines 39-68) and §Tile shell (lines 155-181); `README.md` §Quality and Verification (line 148)
**Codebase Evidence:** `packages/react-components/src/index.ts` exports every component and every public prop/union type; `packages/react-components/test/package-exports.spec.test.ts` imports those types and pins the exact runtime surface. The house export pin is the public contract, not an optional documentation list.

**The Problem:** No document defines the `TileGridProps<T>` that consumers and specification tests compile against. RD-02 defines a base interface with layout and rendering props. RD-03 defines a separate `TileGridSelectionProps<T>` but never says it extends or intersects the base. RD-04 uses `reorderable`, `reorderDisabled`, and `onReorder` with no props type at all. The forwarded ref exposes seven methods across RD-02 and RD-03 (`scrollToItem`, `scrollToIndex`, `scrollToOffset`, `selectAll`, `clearSelection`, `scrollToSelected`, `focusItem`) but no `TileGridHandle` type is named, exported, or pinned. RD-02 says RD-03 extends `renderItem` arguments with selection state, but the extended `TileGridItemRenderArgs<T>` is never defined, so `renderItem` cannot type `selected`, `selectable`, or `disabled`. The export pin lists only `TileGrid`, `TileGridItem`, `TileGridProps`, `TileGridItemProps`, and `TileGridAction`, omitting `TileGridLayout`, `TileGridItemRenderArgs`, and the handle type. `defaultTileSize` is declared but never described; controlled versus uncontrolled zoom is therefore incomplete. The result is that each RD plan must invent a different merge, and the spec tests cannot be written against a stable contract.

**Options:**

| Option | Description                                                                                                                                                                                      | Pros                                                               | Cons                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| A      | Add one consolidated public-contract section: full `TileGridProps<T>`, `TileGridHandle`, extended `TileGridItemRenderArgs<T>`, native props, all public union types, and the complete export pin | One normative type source; spec tests compile; the pin is complete | Requires an explicit contract section and careful cross-RD references                        |
| B      | Keep the RD-local fragments and add an API-assembly task in the final phase                                                                                                                      | Less editing now                                                   | Every plan and spec test written before the assembly must be rewritten; rework is guaranteed |
| C      | Let each plan infer and merge the interfaces                                                                                                                                                     | Fastest to start                                                   | Three incompatible interpretations; violates the immutable-spec-test rule                    |

**Recommendation:** Option A — publish one consolidated contract, preferably in RD-02 as the normative type section, and make the RD-local interfaces internal composition. Include `TileGridHandle`, the extended render arguments, `TileGridLayout`, and every public union in `src/index.ts` and the export pin. Define `defaultTileSize` and the controlled/uncontrolled zoom resolution there.

**Confidence:** High — changes only if the team explicitly accepts plan-time type assembly, which conflicts with the specification-first order.
**Hardening:** Challenger converged on Option A, with the additional requirement that the consolidated section be the single normative source rather than a duplicate that can drift.
**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-003: `TileGridItem` cannot supply the item its action callbacks require, and its remaining props are undefined 🟠 MAJOR

**Dimension:** Logical Contradictions (also Completeness Gaps, Codebase Alignment)
**Location:** `RD-04-arranging-tile-shell-and-actions.md` §Actions (lines 80-83), §Status overlay and selection indicator (lines 88-91), §Tile shell types (lines 155-181), §Tile shell (lines 184-186); `00-ambiguity-register.md` AR #9 (line 27)
**Codebase Evidence:** `TileGridAction<T>` declares `onSelect(item: T)` and `isDisabled(item: T)`, but `TileGridItemProps<T>` has no `item: T` prop. The house pattern (`AppLauncherGrid.types.ts`, `ConfirmDialog.types.ts`) extends native element props and uses partial string overrides.

**The Problem:** The shell has no value of `T` to pass to `onSelect` or `isDisabled`, so the declared generic action contract cannot be implemented as typed. Calling the callbacks with no argument is a TypeScript error; closing over the item in the application works only if the application also ignores the declared `item` parameter. `children` is declared with no rendering rule, so it is an undefined second content channel beside the slots and `renderItem`. `selected`, `selectable`, `disabled`, `fit`, and `aspectRatio` are accepted but their behavior is not specified: does `disabled` disable actions, media, and focus? Does `selectable` change the selection control? What does `fit` apply to? No Must Have acceptance criterion covers them, and the state story is only a Should Have. The interface has no `className`, `style`, or native props despite the claim that the shell follows the house pattern with merged classes. Finally, `actions` render inline and `overflowActions` render in a menu; on touch inline actions may be hidden, so an action passed only in `actions` can become unreachable, while AR #9 says actions are available in an overflow menu.

**Options:**

| Option | Description                                                                                                                                                           | Pros                                                                                | Cons                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A      | Add `item: T`; remove or define `children`; specify state-prop behavior; extend native `div` props; merge inline actions into the overflow menu when inline is hidden | Makes the callback contract callable; follows the house API; preserves touch access | Slightly larger shell contract; the app passes the item once more                      |
| B      | Remove the generic and state props; keep a slots-only shell with zero-argument action callbacks                                                                       | Simplest shell                                                                      | Loses `isDisabled(item)` and the selection/state rendering the approved shell requires |
| C      | Keep the API and document that the application owns item binding, children, and touch reachability                                                                    | No document change                                                                  | Leaves an uncallable typed callback and an unreachable action path                     |

**Recommendation:** Option A — add `item: T`, remove `children` unless a rendering rule and acceptance criterion are added, define the state props, extend `ComponentPropsWithoutRef<'div'>`, and make inline actions available in the overflow menu when they are hidden. This is the only option that keeps the approved generic action model and the touch-access guarantee.

**Confidence:** High — changes only if the team prefers a non-generic shell, in which case zero-argument callbacks are simpler but the `isDisabled(item)` contract must be removed.
**Hardening:** Challenger converged on Option A and noted that the callback signature is not merely ambiguous; it is uncallable as typed.
**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-004: Browser verification is release-blocking but not planned or runnable 🟠 MAJOR

**Dimension:** Testability (also Dependency Issues, Codebase Alignment)
**Location:** `README.md` §Quality and Verification (lines 142-150); `RD-02-layout-and-virtualization.md` §Performance (lines 205-211); `RD-04-arranging-tile-shell-and-actions.md` §Recipe and browser tests (lines 198-212), acceptance criterion 14 (line 281); AR #11 (lines 55-74), AR #12 (line 30)
**Codebase Evidence:** `packages/react-components/package.json` has no `@vitest/browser-playwright`, `playwright`, or `test:browser` script. `vitest.config.ts` is jsdom-only with `include: test/**/*.{test,spec}.{ts,tsx}`. `.github/workflows/ci.yml` runs `pnpm test` but has no browser step or Playwright install. `test/setup.ts` has no ResizeObserver or pointer-capture stub. Storybook discovers only `src/**/stories/*.stories.@(ts|tsx)`.

**The Problem:** The target makes browser tests part of the full gate for drag, marquee, zoom anchoring, virtualization geometry, mounted-tile count, and image requests, but no RD assigns the harness work. Missing are the browser provider and Playwright dev dependencies, a browser Vitest project or separate config, a file-naming convention that keeps browser tests out of the jsdom include, a `test:browser` script, a CI step with a Playwright install, and a browser matrix. The Chrome/Edge/Firefox/Safari guarantee in AR #12 has no mapping; Playwright defaults to Chromium unless projects are configured. The jsdom suite also cannot execute the required ResizeObserver measurement or pointer capture without stubs. The 20K story is required both as a performance story in RD-02 and as a photo-library recipe in RD-04, and the browser acceptance criteria refer to "the 20K story" without naming one. No benchmark harness backs the 16 ms selection, 60 fps scroll, or 200 ms zoom budgets.

**Options:**

| Option | Description                                                                                                                                                                                                                                           | Pros                                                                                             | Cons                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| A      | Add a dedicated browser Vitest project with a glob and `test:browser`, the provider and Playwright dev dependencies, a CI step with Playwright install, a documented browser matrix, jsdom stubs, one named 20K story, and a separate `test:perf` job | Makes the claimed gate executable; keeps the fast jsdom suite; isolates flaky performance checks | Adds dev dependencies, browser downloads, CI time, and maintenance                  |
| B      | Keep browser tests as a manual pre-release checklist with a documented command and recorded evidence                                                                                                                                                  | No CI cost                                                                                       | Regressions in drag, marquee, and geometry escape; contradicts the stated full gate |
| C      | Replace the jsdom config with browser mode for all tests                                                                                                                                                                                              | One runner                                                                                       | Loses the fast jsdom suite; most contracts do not need a browser                    |

**Recommendation:** Option A — specify `test/browser/**/*.browser.test.tsx`, a `vitest.browser.config.ts` or a second Vitest project, a `test:browser` script, provider/Playwright dependencies, a CI job with `playwright install`, and Chromium/Firefox/WebKit projects (document WebKit as the Safari proxy and Edge as Chromium). Keep performance assertions in a separate `test:perf` run with recorded evidence rather than a per-PR gate, because frame-rate and 16 ms assertions are environment-sensitive. Add jsdom stubs for ResizeObserver and pointer capture, and name the 20K benchmark story export.

**Confidence:** High — changes only if the team explicitly downgrades browser tests to a manual checklist, which contradicts the stated gate.
**Hardening:** Challenger converged on Option A and recommended splitting performance measurement out of the per-PR browser gate to avoid flakiness.
**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-005: Scroll resets on any `items` identity change, breaking allowed paging 🟠 MAJOR

**Dimension:** Logical Contradictions (also Edge Cases)
**Location:** `RD-03-selection-focus-and-accessibility.md` §Filtering persistence (lines 69-71), §Filtering (lines 176-182), Feature Overview (line 19); `00-ambiguity-register.md` AR #4 (line 22)
**Codebase Evidence:** No TileGrid implementation exists. AR #4 explicitly allows the application to load all items or page them and says selection IDs persist across pages. The target has no signal that distinguishes a filter replacement from a page append.

**The Problem:** RD-03 says the grid detects an item-array change by identity and resets scroll to the top. Appending page two creates a new array identity, so every page append jumps to the top and the user loses their place. The prose describes the rule as part of "filtering persistence," but the technical rule is unconditional. Selection IDs persist, but the paging mode approved in AR #4 is not usable as described. The same section also says focus moves to the first visible selectable tile if the active tile disappeared, while the technical filtering section says `activeId` becomes the first visible item; those two rules differ when the first item is non-selectable.

**Options:**

| Option | Description                                                                                                          | Pros                                                   | Cons                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| A      | Add an explicit app-supplied `scrollResetKey` (for example a filter key); reset only when it changes, never on mount | Unambiguous; O(1); the app knows when a filter changed | New public prop; a forgotten key preserves scroll on a filter change                            |
| B      | Compare old and new item-ID sequences; preserve scroll on append/prefix extension, reset on replacement or reorder   | No new prop; handles append/prepend automatically      | O(n) comparison on every items change; heuristic can misclassify a filter that extends the list |
| C      | Require the application to remount the grid for paging                                                               | No new prop                                            | Loses focus and anchor state; contradicts the paging model in AR #4                             |

**Recommendation:** Option A — add `scrollResetKey?: unknown` (or an equivalently named filter key) and reset only when it changes. Document that page appends and in-place item updates preserve the scroll anchor, and add acceptance criteria for both "filter change resets" and "page append does not reset."

**Confidence:** High if paging includes appends; Medium if AR #4 means page replacement only, which should then be stated explicitly.
**Hardening:** Challenger converged on Option A and noted that ID-sequence heuristics cannot reliably distinguish an append from a filter that extends the list.
**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-006: The reorder interaction contract is not end-to-end 🟠 MAJOR

**Dimension:** Completeness Gaps (also Feasibility Concerns, Codebase Alignment)
**Location:** `RD-04-arranging-tile-shell-and-actions.md` §Optional drag arranging (lines 39-68), §Drag layer (lines 135-151), §Tile shell types (lines 165-181); `00-ambiguity-register.md` AR #7 (line 25); `README.md` §Domain Glossary (line 77)
**Codebase Evidence:** `@dnd-kit/core` is not in `packages/react-components/package.json` or `pnpm-lock.yaml`. Its `useDraggable` returns `setNodeRef`, `attributes`, and `listeners` that must be attached to the element that starts the drag. The target types `dragHandle` as an app-supplied `React.ReactNode`, which cannot receive those props.

**The Problem:** The drag handle is the only element that starts a drag, but it is an arbitrary app-supplied React node. The library cannot attach dnd-kit's node ref, attributes, and listeners to it, and no render-prop, context, or cloning contract is defined. The drag overlay also reuses `renderItem` content without an `isOverlay` or `isDragging` flag, so app actions and handles can be duplicated in the overlay. The keyboard reorder path is "Move before/after … or an equivalent accessible command" with no destination-selection UX; a single menu action cannot know the target index, and acceptance criterion 7 only asserts that it "moves one item." `reorderDisabled` removes drag handles and listeners but does not disable the keyboard menu action, so a filtered grid can still reorder by keyboard, contradicting AR #7 and the recipe's rule that arranging is disabled while filtered.

**Options:**

| Option | Description                                                                                                                                                                                                                                                             | Pros                                                                                             | Cons                                                                                                                    |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| A      | Make `dragHandle` a render prop with an in-house props bag (`setNodeRef`, `attributes`, `listeners`, `isDragging`), or render a library-owned handle; define concrete "Move up"/"Move down" keyboard commands; make `reorderDisabled` disable every reorder entry point | Library owns drag and keyboard behavior; touch and keyboard paths are defined; keeps app styling | Exposes a small drag-handle contract; changes the shell slot type                                                       |
| B      | Let the application own the drag layer and handle entirely; the library provides only geometry and collision                                                                                                                                                            | Maximum app control                                                                              | Duplicates the drag and accessibility work in every application; weakens the library guarantee                          |
| C      | Use dnd-kit's KeyboardSensor on the handle and remove the overflow-menu action                                                                                                                                                                                          | Reuses dnd-kit keyboard support                                                                  | The RD explicitly rejects a hidden keyboard-only mode; dnd-kit's keyboard behavior in a virtualized 2D grid is unproven |

**Recommendation:** Option A — define an in-house `TileGridDragHandleProps` render-prop contract (not dnd-kit types) and either let the app render the handle or have the library render a labeled button. Define keyboard reorder as concrete one-position commands such as "Move up" and "Move down," clamped at the ends, with the same payload and polite announcements. Make `reorderDisabled` remove or disable every reorder entry point, and add acceptance criteria for both the keyboard move target and the disabled state.

**Confidence:** High — changes only if the team chooses a library-rendered handle for less customization or a target-picker dialog instead of one-position moves.
**Hardening:** Challenger converged on Option A and recommended keeping the handle contract in-house rather than exposing dnd-kit's prop bag directly.
**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-007: "One tab stop" conflicts with real selection controls 🟠 MAJOR

**Dimension:** Logical Contradictions (also Feasibility Concerns)
**Location:** `RD-03-selection-focus-and-accessibility.md` §Roving focus (lines 74-77), §Action entry (lines 85-86), §Selection controls (lines 91-93), §Accessibility wiring (lines 162-174); `00-ambiguity-register.md` AR #15 (line 33)
**Codebase Evidence:** No TileGrid or roving-focus implementation exists. The house form fields render real Fluent checkbox and radio controls, which are native tabbable inputs unless explicitly removed from the tab order.

**The Problem:** The grid is said to have one tab stop, but every mounted tile renders a real checkbox or radio, and the same section says Tab moves into the active tile's controls. Native controls are tabbable by default, so each mounted tile adds a tab stop unless inactive controls use `tabIndex={-1}`. The document never states the tabindex of inactive controls, the Tab/Escape order among selection controls and actions, how Tab leaves the grid, or how single-select radio controls are grouped. At the stated fixed fixture this could add dozens of tab stops; at the mounted bound it could add up to about 120. The acceptance criterion for Tab only checks entry and Escape, not the one-tab-stop property.

**Options:**

| Option | Description                                                                                                                                                                 | Pros                                                     | Cons                                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| A      | Use roving tabindex: only the active tile is a grid tab stop; inactive controls use `tabIndex={-1}`; define Tab/Escape cycling, radio-group semantics, and a tab-order test | Preserves real controls and delivers one grid entry stop | Requires careful focus management; custom Tab handling can surprise assistive technology               |
| B      | Make every selection control a tab stop and drop the one-tab-stop claim                                                                                                     | No custom tab management                                 | Dozens to hundreds of tab stops; contradicts the roving-focus model                                    |
| C      | Use one focusable root with `aria-activedescendant` and drop Tab-into-controls                                                                                              | Simple roving focus                                      | Conflicts with the requirement that Tab enters the tile's controls and that real controls are operable |

**Recommendation:** Option A — define one entry tab stop on the active tile, set inactive selection controls and inline actions to `tabIndex={-1}`, and specify the Tab/Escape order and single-select radio grouping. Add a tab-order specification test that walks Tab and Escape through the active tile.

**Confidence:** High — changes only if "one tab stop" is explicitly redefined as one entry point with native tab order, in which case the radio grouping still needs definition.
**Hardening:** Challenger converged on Option A and noted that the undefined inactive tabindex is a real defect regardless of how "one tab stop" is interpreted.
**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-008: AR #18's URL allowlist has no enforcement point 🟠 MAJOR

**Dimension:** Security Blind Spots (also Consistency, Codebase Alignment)
**Location:** `00-ambiguity-register.md` AR #18 (line 36); `README.md` §Traceability (line 136); `RD-02-layout-and-virtualization.md` §Image rendering contract (lines 182-194), §Security (lines 213-222); `RD-04-arranging-tile-shell-and-actions.md` §Media and image guidance (lines 78-79, 188-196)
**Codebase Evidence:** `TileGrid` never renders images in the target; `TileGridItem.media` is `React.ReactNode`. No public prop accepts a URL. The package uses no `dangerouslySetInnerHTML` in existing components. The actual enforceable guarantees are no fetch, no HTML parsing, and no logging of item content.

**The Problem:** AR #18 says the component "validates URL protocols against an allowlist." No public prop accepts a URL: `TileGrid` does not render images, `renderItem` returns React nodes, and the shell's media is an arbitrary `ReactNode`. The component therefore cannot validate a protocol, enforce `loading="lazy"`, `alt`, or `srcSet`/`sizes`, or prevent a CSS background image. The "must" list in RD-02 is addressed to the shell and recipe, but the shell has no access to the URL or the image element's props. The requirement is unenforceable and has no acceptance criterion, while the traceability section records it as a security guarantee. This is a false security claim in a public package.

**Options:**

| Option | Description                                                                                                                                                                                                                                                        | Pros                                                                    | Cons                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A      | Reassign URL validation and image-attribute enforcement to the application; correct AR #18 and the image contract to state that the component accepts no URLs and only renders React nodes; keep and test the enforceable no-fetch, no-HTML, no-logging guarantees | Matches the app-owned image boundary; honest security claim; no new API | Removes a defense-in-depth layer from the component                                      |
| B      | Add a structured image prop with URL validation and attribute forwarding                                                                                                                                                                                           | Component can enforce the allowlist and image attributes                | New public API; conflicts with the generic `renderItem`/`media` model; expands scope     |
| C      | Traverse `renderItem` output at runtime and validate URL strings                                                                                                                                                                                                   | Best-effort enforcement without a new prop                              | Unreliable for custom components, fragments, portals, and strings; fragile and expensive |

**Recommendation:** Option A — move URL validation and image-attribute enforcement to the application and the 20K recipe, correct AR #18, and keep the enforceable guarantees: the component never fetches, never parses HTML, and never logs URLs or labels. If a component-enforced allowlist is mandatory, Option B needs an explicit AR decision and a new public prop; it must not remain an unassigned claim.

**Confidence:** High — changes only if a structured image prop is added, which would make Option B the enforceable choice.
**Hardening:** Challenger converged on Option A and noted that a component accepting only `ReactNode` cannot inspect URLs reliably.
**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-009: No disabled-item predicate for activation or ARIA; the shell's `disabled` state is disconnected 🟡 MINOR

**Dimension:** Completeness Gaps (also Codebase Alignment)
**Location:** `RD-03-selection-focus-and-accessibility.md` §Activation callback (lines 49-50), §Selectable predicate (lines 58-60), §Public props (lines 122-136), §Accessibility wiring (lines 173-174); `RD-04-arranging-tile-shell-and-actions.md` §State props (lines 76-77), §Tile shell types (lines 165-181)
**Codebase Evidence:** `packages/react-components/src/components/AppLauncherItem/AppLauncherItem.types.ts` already distinguishes disabled from disabled-focusable activation. The TileGrid target has no equivalent predicate.

**The Problem:** RD-03 says `onItemActivate(item)` fires "when the tile is not disabled," but the public props contain only `isSelectable(item)`. `isSelectable` controls selection, not activation, and non-selectable items may remain readable and focusable. `TileGridItem` accepts `disabled?: boolean`, but the grid never receives that value, so a disabled shell can still activate and can still be selected when `isSelectable` returns true. The application must keep two predicates in sync with no contract.

**Options:**

| Option | Description                                                                                                                                                                              | Pros                                                                                    | Cons                                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| A      | Add `isDisabled?(item: T): boolean`; use it to block activation, set `aria-disabled`, and pass `disabled` into the shell and render arguments; define its precedence with `isSelectable` | One explicit activation state; matches the existing disabled/disabled-focusable pattern | One more public predicate                                               |
| B      | Reuse `isSelectable` and remove `TileGridItem.disabled`                                                                                                                                  | Smaller API                                                                             | Conflates read-only with disabled; breaks openable non-selectable tiles |

**Recommendation:** Option A — add the predicate, wire it through the public props, render arguments, the shell's `disabled` prop, and the activation tests, and document whether a disabled item stays focusable, matching the existing `disabledFocusable` pattern.

**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-010: RD-01 is declared independent but its marquee contract depends on RD-02 geometry and RD-03 props 🟡 MINOR

**Dimension:** Ordering & Sequencing (also Dependency Issues, Consistency)
**Location:** `RD-01-selection-and-marquee.md` header (line 7), §Geometry source (lines 91-92), §Marquee algorithm (lines 161-173), acceptance criteria 8-13 (lines 250-255); `RD-02-layout-and-virtualization.md` §Geometry result (lines 155-164); `README.md` §Dependency Graph (lines 90-103), §Suggested Implementation Order (lines 105-111)
**Codebase Evidence:** No TileGrid implementation exists. RD-01's marquee consumes item rectangles, visible ranges, `indexAtPoint`, and the scroll container owned by RD-02; its acceptance criteria mount a grid with `enableMarquee` and `selectionMode`, which are RD-03 props.

**The Problem:** RD-01 says "Depends On: —" and the README says RD-01 and RD-02 are independent. But the marquee contract consumes RD-02's geometry output, and the acceptance criteria require a mounted grid with RD-03's public props. Phase A schedules RD-01 and RD-02 in parallel with no named shared geometry contract, so two plans can invent incompatible rectangle or coordinate assumptions before RD-03 joins them.

**Options:**

| Option | Description                                                                                                                                                      | Pros                                                                                                                        | Cons                                                                                       |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| A      | Add a named shared geometry input contract to Phase A, owned by RD-02; mark RD-01 as depending on it; move the grid-mounted marquee acceptance criteria to RD-03 | Correct dependency graph; RD-01 unit tests can use synthetic rectangles; end-to-end marquee tests live with the integration | Requires editing the dependency graph and moving acceptance criteria                       |
| B      | Define a pure `MarqueeGeometry` port in RD-01 and adapt RD-02's output in RD-03                                                                                  | Keeps RD-01 standalone                                                                                                      | Adds an adapter; still needs a contract and still cannot run the end-to-end criteria alone |

**Recommendation:** Option A — make the geometry input contract explicit in Phase A and correct the dependency graph. RD-01 can still be implemented in parallel against the named contract, but its grid-level acceptance criteria belong to RD-03.

**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-011: Runtime dependency classification and package integration are undefined 🟡 MINOR

**Dimension:** Dependency Issues (also Codebase Alignment)
**Location:** `README.md` §Architecture (line 6) and §Minimum-Sufficient Baseline (lines 38-44); `00-ambiguity-register.md` AR #11 (line 29); `RD-02-layout-and-virtualization.md` §Virtualization (lines 169-180); `RD-04-arranging-tile-shell-and-actions.md` §Drag layer (lines 135-151)
**Codebase Evidence:** `packages/react-components/package.json` has no `dependencies` key; it declares only peers and dev dependencies. `vite.config.ts` externalizes only React, React DOM, React Hook Form, and `@fluentui/*`. `README.md` installs peers only. `pnpm-lock.yaml` has no `@tanstack/react-virtual` or `@dnd-kit/core` entry.

**The Problem:** Both RDs call the packages "runtime dependencies" and "externalized in the Vite build," but the target never chooses between a regular dependency and a peer dependency, never gives version ranges, and never updates the lockfile, README install command, or Vite external list. Externalizing a package that is not declared leaves bare imports the consumer may not resolve; declaring it as a peer shifts the install burden to every consumer, including consumers that never use TileGrid. AR #11 lists bundle-size measurement as a cost, but no acceptance criterion owns it.

**Options:**

| Option | Description                                                                                                                                         | Pros                                                                                                       | Cons                                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A      | Declare both as `dependencies` with version ranges, add them to the Vite external list, update the lockfile and README, and add a bundle-size check | Implementation details stay with the package; consumers install nothing extra; externalization is coherent | Every consumer installs the dependencies even when not using TileGrid                                         |
| B      | Declare both as `peerDependencies` and document the required install                                                                                | Consumer controls versions and can share a dnd-kit instance                                                | Every consumer must install internal implementation dependencies; the package can fail at import if forgotten |

**Recommendation:** Option A — both are implementation details of the component, and the approved scope excludes cross-grid drag that would require a shared dnd-kit singleton. Add `@tanstack/react-virtual` (for example `^3.14.0`) and `@dnd-kit/core` (for example `^6.3.0`) to `dependencies`, extend the Vite external list, update the lockfile and README install section, and record a bundle-size measurement.

**Confidence:** Medium — the package has no precedent for runtime dependencies; a deliberate peer-only policy would change the pick.
**Hardening:** In-context review only; the auditor clusters split between peer and dependency, which is why this is recorded as an ambiguity rather than a settled choice.
**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-012: Public props omit native pass-through and internal-text overrides 🟡 MINOR

**Dimension:** Codebase Alignment (also Consistency)
**Location:** `RD-02-layout-and-virtualization.md` §Public props (lines 127-149); `RD-03-selection-focus-and-accessibility.md` §Announcements (lines 96-98), §Accessibility wiring (lines 164-165); `RD-04-arranging-tile-shell-and-actions.md` §Drag handle (lines 45-46), §Announcement (lines 65-66)
**Codebase Evidence:** `packages/react-components/README.md` states that native props pass through and that every user-facing string is a prop or a partial `strings` override. `AppLauncherGridProps` extends `ComponentPropsWithoutRef<'ul'>`; `ConfirmDialogStrings` uses a partial override object with English defaults.

**The Problem:** `TileGridProps` declares only `className` and `style`, so the documented `aria-labelledby` path through a native prop in RD-03 is impossible, and the root cannot accept `aria-*`, `data-*`, or event handlers. `ariaLabel` is required on a selection-named interface that also carries `onItemActivate`, so the final accessible-name precedence is undefined. RD-04 requires a "localized drag-handle string," but neither `TileGridProps` nor `TileGridItemProps` has a `strings` or label prop; the selection-count and reorder-position announcements are also hardcoded English examples. This departs from the package's native-props and partial-strings conventions.

**Options:**

| Option | Description                                                                                                                                                                                                                                            | Pros                                                   | Cons                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------ |
| A      | Extend `TileGridProps` from `Omit<ComponentPropsWithoutRef<'div'>, managed attributes>`, do the same for `TileGridItemProps`, and add a partial `TileGridStrings` type for the empty message, selection count, reorder position, and drag-handle label | Follows the house contract; one localization mechanism | Requires deciding which attributes the component owns              |
| B      | Add individual native fields and a `dragHandleLabel` prop only                                                                                                                                                                                         | Smaller change                                         | Does not restore native pass-through or localize the announcements |

**Recommendation:** Option A — follow the `LoadingProps`/`ConfirmDialogStrings` pattern for native props and partial string overrides. Move `ariaLabel` and `onItemActivate` into the core props, document the precedence between `ariaLabel` and native `aria-labelledby`, and export the strings type in the public pin.

**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-013: Data and numeric input validation is incomplete 🟡 MINOR

**Dimension:** Edge Cases (also Codebase Alignment)
**Location:** `RD-02-layout-and-virtualization.md` §Aspect ratio (lines 51-55), §Gap and tileSize (lines 58-61), §Stable keys (lines 73-74), §Public props (lines 141-144), §Security (lines 217-218), acceptance criterion 6 (line 266); `RD-01-selection-and-marquee.md` §Stable identity (lines 42-43), §Should Have (lines 97-98), acceptance criterion 14 (line 256)
**Codebase Evidence:** No geometry engine exists. The target says numeric layout props are clamped to safe values, but explicit rules exist only for `tileSize` and negative `gap`.

**The Problem:** `getItemAspectRatio` falls back for `undefined`, `null`, `NaN`, zero, and negative values but not `Infinity`, which produces zero-height masonry tiles or infinite justified widths. `fallbackAspectRatio` and `tileAspectRatio` are unvalidated, so zero, negative, `NaN`, or non-finite values corrupt every rectangle. `columns` is not constrained to a positive integer; `0`, `-1`, or `2.5` break the width formula. `minTileSize > maxTileSize` only emits a development warning, leaving "clamp to the nearest bound" undefined when both bounds conflict. `gap` with `NaN` or `Infinity`, and negative or out-of-range `scrollToIndex`/`scrollToOffset`, are unspecified. Duplicate `getItemId` values are a Must Have warning in RD-02 but only a Should Have in RD-01, and production behavior is undefined even though selection identity and React keys both use the ID. One bad record or prop value can corrupt the total scroll height, every rectangle, and marquee hit testing.

**Options:**

| Option | Description                                                                                                                                                                                                                 | Pros                                                      | Cons                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A      | Add one normalization boundary for ratios, columns, gap, and scroll offsets; define a deterministic duplicate-ID policy (first occurrence wins in production after a development warning); add acceptance criteria for each | Testable and central; protects the shared geometry engine | Slightly more validation code and contract text                                               |
| B      | Keep warnings only and document that the application owns data validity                                                                                                                                                     | Smaller contract                                          | A single bad record or prop still corrupts a 20K grid; duplicate IDs silently share selection |

**Recommendation:** Option A — normalize every ratio to a finite positive value, clamp `columns` to `max(1, trunc(value))`, validate or swap min/max, default non-finite `gap`, clamp scroll offsets and indices, and define duplicate-ID behavior as a contract violation with deterministic first-occurrence selection. Add acceptance criteria for the invalid-input cases.

**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-014: The marquee cancel rule races the normal pointer release 🟡 MINOR

**Dimension:** Edge Cases
**Location:** `RD-01-selection-and-marquee.md` §Marquee cancel (lines 84-87), §Marquee algorithm (lines 161-173), acceptance criterion 10 (line 252)
**Codebase Evidence:** No marquee implementation exists. The Pointer Events event model releases capture after `pointerup` or `pointercancel` and fires `lostpointercapture`; the target does not define terminal-event ordering.

**The Problem:** The cancel rule treats "losing pointer capture" as a cancel condition. A normal successful `pointerup` also releases capture and is followed by `lostpointercapture`, so a naive implementation can commit on `pointerup` and then take the cancel path, restoring the pre-marquee selection. In controlled mode `onSelectionChange` has already fired, so the visible selection and the parent state desynchronize. The RD does not define whether a committed gesture can still be cancelled or how the terminal events are ordered.

**Options:**

| Option | Description                                                                                                                                                                         | Pros                                                               | Cons                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| A      | Cancel only on Escape or `pointercancel`; on `lostpointercapture`, cancel only if the gesture has not already committed or cancelled; define the event order and add a browser test | Preserves cancel-on-capture-loss without racing the normal release | Requires a small state guard and a browser test           |
| B      | Ignore `lostpointercapture` entirely                                                                                                                                                | Simpler                                                            | A capture lost without `pointerup` leaves a stuck gesture |

**Recommendation:** Option A — define a committed/cancelled guard and the terminal-event order, and add a browser test where `pointerup` is followed by `lostpointercapture`. Flag the external standard text for human confirmation; the finding is based on the Pointer Events event model, not on a locally available full standard.

**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-015: The verification plan is not requirement-derived or fully traceable 🟡 MINOR

**Dimension:** Testability (also Codebase Alignment)
**Location:** `README.md` §Quality and Verification (lines 142-150); `RD-02-layout-and-virtualization.md` acceptance criterion 2 (line 262), §Performance (lines 205-211); `RD-01-selection-and-marquee.md` §Performance (lines 183-191); `00-ambiguity-register.md` AR #12 (line 30)
**Codebase Evidence:** The repository uses hand-written spec assertions, not snapshots (`test/description-list.spec.test.tsx`), and separates public `*.spec.test.tsx` from internal `*.impl.test.tsx`. `package.json` has no benchmark script. `vitest.config.ts` runs jsdom tests only.

**The Problem:** Three verification gaps remain. First, RD-02 acceptance criterion 2 asks for a layout snapshot test. A generated snapshot records whatever geometry the implementation produces on its first run; it cannot be written before implementation and would freeze a masonry tie-break or justified-row bug as "expected." Second, the README says each RD gets a `*.spec.test.tsx` file, but RD-01 is an internal module whose exact names may change and whose acceptance criteria are written at the `TileGrid` level; that is an implementation test, not a public spec oracle. Third, AR #12 commits to a 16 ms selection toggle, 60 fps scroll, and a 200 ms zoom/filter budget, but RD-02 has an acceptance criterion only for the 200 ms geometry recompute. RD-01 references "the performance budget in RD-02" for the 20K selection copy, but RD-02 defines no selection budget. The filter budget is app-owned and cannot be measured by the component. The mounted-item bound is fixed-layout only.

**Options:**

| Option | Description                                                                                                                                                                                                                                                                                   | Pros                                                                | Cons                                                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A      | Replace the snapshot with hand-computed exact rectangles for a small fixture plus invariants for a larger one; define a public spec map and move RD-01 internals to impl tests; add a separate `test:perf` benchmark with p95 selection and scroll measurements and per-layout mounted bounds | Requirement-derived oracle; traceable budgets; no brittle snapshots | More test design work; performance measurement needs a stable environment     |
| B      | Keep the snapshot and document the budgets as manual benchmarks                                                                                                                                                                                                                               | Less work now                                                       | The core geometry oracle is implementation-derived; budgets remain unverified |

**Recommendation:** Option A — hand-compute expected rectangles for a small fixture in each mode and add no-overlap, container-bounds, total-height, row-fill, span-occupancy, and source-order invariants for a larger fixture. Define public spec files (`tile-grid-layout`, `tile-grid-selection`, `tile-grid-focus-a11y`, `tile-grid-item`) and move RD-01's internal transitions and marquee unit tests to `tile-grid-selection.impl.test.tsx`. Add a separate performance run with p95 measurements and per-layout mounted bounds; document 60 fps as a manual benchmark if CI variance is too high.

**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-016: The public API exceeds the approved scope 🟡 MINOR

**Dimension:** Scope Creep Indicators
**Location:** `RD-02-layout-and-virtualization.md` §Scroll API (lines 78-79), §Public props (line 136); `RD-03-selection-focus-and-accessibility.md` §Select-all/clear API (lines 63-66), §Keyboard zoom (lines 81-84); `00-ambiguity-register.md` AR #6 (line 24), AR #8 (line 26)
**Codebase Evidence:** The package export pin shows that public API additions are contractual. The Ambiguity Register approves `selectAll`, `clearSelection`, and `scrollToSelected`, but not `scrollToItem`, `scrollToIndex`, `scrollToOffset`, or `focusItem`; AR #8 approves controlled `tileSize` plus `onTileSizeChange`, not `defaultTileSize` or uncontrolled zoom.

**The Problem:** The RDs expose a larger public API than the approved baseline. `scrollToItem`, `scrollToIndex`, `scrollToOffset`, and `focusItem` are public ref methods without an AR decision; `defaultTileSize` and uncontrolled zoom are a new state model; the scroll methods and uncontrolled zoom have no acceptance criteria except `scrollToItem` and the controlled zoom path. The extra surface may be useful, but it is unapproved scope and will be pinned forever once exported. If the extra methods are only needed internally for focus and anchor restoration, they do not need to be public.

**Options:**

| Option | Description                                                                                                                                      | Pros                                            | Cons                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------- |
| A      | Keep the extra scroll methods internal and expose only `scrollToSelected`; remove `defaultTileSize` and uncontrolled zoom                        | Matches the approved baseline; smaller contract | Less imperative control for applications |
| B      | Record an AR addendum approving the expanded API, then add acceptance criteria and documentation for every method and the uncontrolled zoom path | Keeps the useful surface                        | Expands v1 scope and test surface        |

**Recommendation:** Option A — keep `scrollToItem`/`scrollToIndex`/`scrollToOffset`/`focusItem` internal to the component and expose the approved `scrollToSelected` plus the selection methods. Remove `defaultTileSize` and uncontrolled zoom unless the user records an AR decision approving them. This keeps the public contract aligned with the approved scope and reduces the spec-test surface.

**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-017: The domain-lens table includes a non-catalog lens and a selected lens without requirements 🟡 MINOR

**Dimension:** Consistency (also Completeness Gaps)
**Location:** `README.md` §Domain Lenses (lines 49-58), §Traceability (lines 132-138); `.opencode/references/domains/selection.md` (lines 7-11)
**Codebase Evidence:** The domain-lens catalog defines five lenses: compiler/language, financial system, web application, distributed/concurrent, and data/migration. It does not define "Library/SDK focus." The data-and-migration lens requires a version boundary, upgrade or invalidation path, rollback behavior, and mixed-version window.

**The Problem:** The README marks "Library/SDK focus" as a selected lens, but it is not in the catalog, so its questions and gate are undefined. The data-and-migration lens is selected because the feature replaces the v8 `TilesList` contract, but the requirements explicitly exclude v8 compatibility from the package and contain no migration, version-boundary, rollback, or mixed-version requirements. Either the lens is not applicable and should be removed, or the migration boundary is missing.

**Options:**

| Option | Description                                                                                                                                                                                                                                       | Pros                                     | Cons                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| A      | Map to the catalog: keep web application; either state that data/migration is not applicable because the package stores nothing and the app owns persistence, or add an explicit app-owned migration boundary; remove the "Library/SDK focus" row | Catalog-compliant; honest lens selection | Requires a small documentation correction                                       |
| B      | Add "Library/SDK focus" as a formal lens in the catalog and add the migration requirements                                                                                                                                                        | Covers the public-package concerns       | Process change outside this artifact; still leaves the data/migration gate open |

**Recommendation:** Option A — keep the web-application lens and the universal quality concerns, remove the non-catalog row, and state explicitly whether data/migration is non-applicable or add the app-owned migration boundary (what happens to old v8 selection and order state, who migrates it, and how rollback works). The package-level library concerns (API surface, peer dependencies, bundle behavior) are already covered by the public-contract and dependency findings; they do not need a separate lens.

**User Decision:** Resolved — User accepted recommendation: Option A

---

### PF-018: Background clicks and none-mode activation are undefined 🟡 MINOR

**Dimension:** Ambiguities (also Consistency)
**Location:** `RD-01-selection-and-marquee.md` §Marquee threshold (lines 76-77), §Marquee start (lines 73-75); `RD-03-selection-focus-and-accessibility.md` §Activation callback (lines 49-50), §None mode (lines 56-57)
**Codebase Evidence:** No TileGrid implementation exists. The target says a marquee gesture shorter than 4 px is "treated as a background click," but no other requirement defines what a background click does. RD-03 says none mode activates on click and Enter, but the activation callback bullet only names the `browse` and `select` modes.

**The Problem:** The phrase "background click" implies behavior, but the target never says whether it clears the selection, does nothing, or starts a marquee. In none mode, the click/Enter activation behavior is specified in the interaction section but omitted from the `onItemActivate` contract, so the callback requirement is incomplete. Both gaps are small, but they produce different observable behavior for a basic pointer interaction.

**Options:**

| Option | Description                                                                                                                 | Pros                                     | Cons                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| A      | Define a background click as a no-op unless it completes a marquee gesture; add none mode to the activation callback bullet | Smallest behavior; no new selection rule | A no-op background click may feel inert to users                  |
| B      | Define a background click as clearing the selection in multiselect mode, with modifiers preserving it                       | Matches common grid behavior             | New product behavior not approved in the AR; needs an AR decision |

**Recommendation:** Option A — state that a short background gesture does nothing (it does not clear selection), and add `selectionMode="none"` to the activation-callback rules so click and Enter call `onItemActivate`. If clearing on background click is wanted, record it as a separate AR decision rather than leaving it implied.

**User Decision:** Resolved — User accepted recommendation: Option A

---

## Scope Expansion Register

Not created. Strict scope is active, and no optional additions were reported as findings. Any optional product behavior surfaced during the audit was omitted.

## Verification Limitations

- The workspace has no installed package dependencies (only root tooling), so the jsdom ResizeObserver and pointer-capture behavior could not be executed here. The finding relies on the documented jsdom limitation and the missing test setup stubs.
- The full Pointer Events standard text is not available locally. The `lostpointercapture` ordering is asserted from the standard's event model and flagged for human confirmation.
- No TileGrid implementation exists, so every finding is a requirements defect. None was confirmed against runtime behavior.
- The dependency versions were verified through the npm registry and the TanStack/Vitest documentation, not through a local install.
- The iteration 2 verification is document-level: table consistency, `git diff --check`, and a targeted re-read of every changed section. `pnpm verify` could not run because this workspace has no Node/pnpm toolchain; no code or runtime test was part of this pass.

## Decision Log

| Finding | Severity    | Recommendation | User Decision                |
| ------- | ----------- | -------------- | ---------------------------- |
| PF-001  | 🔴 CRITICAL | Option A       | Resolved — accepted Option A |
| PF-002  | 🟠 MAJOR    | Option A       | Resolved — accepted Option A |
| PF-003  | 🟠 MAJOR    | Option A       | Resolved — accepted Option A |
| PF-004  | 🟠 MAJOR    | Option A       | Resolved — accepted Option A |
| PF-005  | 🟠 MAJOR    | Option A       | Resolved — accepted Option A |
| PF-006  | 🟠 MAJOR    | Option A       | Resolved — accepted Option A |
| PF-007  | 🟠 MAJOR    | Option A       | Resolved — accepted Option A |
| PF-008  | 🟠 MAJOR    | Option A       | Resolved — accepted Option A |
| PF-009  | 🟡 MINOR    | Option A       | Resolved — accepted Option A |
| PF-010  | 🟡 MINOR    | Option A       | Resolved — accepted Option A |
| PF-011  | 🟡 MINOR    | Option A       | Resolved — accepted Option A |
| PF-012  | 🟡 MINOR    | Option A       | Resolved — accepted Option A |
| PF-013  | 🟡 MINOR    | Option A       | Resolved — accepted Option A |
| PF-014  | 🟡 MINOR    | Option A       | Resolved — accepted Option A |
| PF-015  | 🟡 MINOR    | Option A       | Resolved — accepted Option A |
| PF-016  | 🟡 MINOR    | Option A       | Resolved — accepted Option A |
| PF-017  | 🟡 MINOR    | Option A       | Resolved — accepted Option A |
| PF-018  | 🟡 MINOR    | Option A       | Resolved — accepted Option A |

## Final Verdict

**✅ PASSED — iteration 2 verified all 18 applied fixes.**

- The 1 critical and 7 major findings are resolved and their accepted resolutions are applied.
- The 10 minor findings are accepted and applied.
- The targeted re-scan found no new root-cause findings; related clarifications are listed above.
- The verified requirements revision is `a697524d48c13ccb28d5e9a9dad6acec2004e8847aaac2aa2519e3d470bb8cda`.
- No code was changed and no runtime test was executed; this is a requirements-document pass.

## Next Steps

| Action                                                 | Owner             | Status                                      |
| ------------------------------------------------------ | ----------------- | ------------------------------------------- |
| Create implementation plans                            | You / `make-plan` | Ready at revision `a697524d…0bb8cda`        |
| Implement the plans                                    | You / `exec-plan` | After planning                              |
| Re-run a targeted preflight if the requirements change | Me                | On demand                                   |
| Roadmap sync                                           | Me                | Done — all four RDs are `🔎 RD Preflighted` |
