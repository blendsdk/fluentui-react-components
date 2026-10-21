# Findings Ledger: TileGrid Phase A

| Finding    | Phase | Severity    | Area                                                                                       | Ruling   |
| ---------- | ----- | ----------- | ------------------------------------------------------------------------------------------ | -------- |
| RV-001     | 1     | MINOR       | packages/react-components/package.json                                                     | fixed    |
| RV-002     | 1     | MINOR       | packages/react-components/test/setup.ts                                                    | fixed    |
| RV-003     | 1     | MINOR       | packages/react-components/test/harness                                                     | fixed    |
| RV-004     | 1     | MINOR       | requirements/RD-03                                                                         | fixed    |
| RV-005     | 1     | MINOR       | plans/v1/99-execution-plan.md                                                              | fixed    |
| RV-006     | 1     | OBSERVATION | packages/react-components/test/jsdomStubs.ts                                               | fixed    |
| RV-007     | 1     | OBSERVATION | AGENTS.md                                                                                  | deferred |
| P2-RV-001  | 2     | MAJOR       | packages/react-components/src/components/TileGrid/devWarnings.ts                           | fixed    |
| P2-RV-002  | 2     | MAJOR       | packages/react-components/src/components/TileGrid/geometry/mosaicLayout.ts                 | fixed    |
| P2-RV-003  | 2     | MAJOR       | packages/react-components/src/components/TileGrid/geometry/mosaicLayout.ts                 | fixed    |
| P2-RV-004  | 2     | MINOR       | packages/react-components/src/components/TileGrid/renderTileGrid.tsx                       | fixed    |
| P2-RV-005  | 2     | MINOR       | packages/react-components/src/components/TileGrid/geometry/computeGeometry.ts              | deferred |
| P2-RV-006  | 2     | MINOR       | packages/react-components/src/components/TileGrid/geometry/normalize.ts                    | fixed    |
| P2-RV-007  | 2     | MINOR       | packages/react-components/src/components/TileGrid/geometry/computeGeometry.ts              | fixed    |
| P2-RV-008  | 2     | MINOR       | plans/v1/99-execution-plan.md                                                              | fixed    |
| P2-RV-009  | 2     | MINOR       | packages/react-components/test/tile-grid-layout.impl.test.tsx                              | fixed    |
| P2-RV-010  | 2     | OBSERVATION | packages/react-components/src/components/TileGrid/TileGrid.tsx                             | fixed    |
| P2-RV-011  | 2     | OBSERVATION | packages/react-components/src/components/TileGrid/useTileGrid.ts                           | fixed    |
| P2-RV-012  | 2     | OBSERVATION | packages/react-components/src/components/TileGrid/TileGridItemView.tsx                     | fixed    |
| P2-RV-013  | 2     | OBSERVATION | packages/react-components/src/components/TileGrid/virtualization/useContainerSize.ts       | fixed    |
| P2-RV-014  | 2     | OBSERVATION | plans/v1/03-03-selection-and-marquee.md                                                    | deferred |
| P2-RV-015  | 2     | MAJOR       | packages/react-components/src/components/TileGrid/renderTileGrid.tsx                       | fixed    |
| P2-RRV-001 | 2     | MAJOR       | packages/react-components/src/components/TileGrid/devWarnings.ts                           | fixed    |
| P2-RRV-002 | 2     | MAJOR       | packages/react-components/test/tile-grid-geometry.impl.test.ts                             | fixed    |
| P2-RRV-003 | 2     | MINOR       | packages/react-components/test/tile-grid-geometry.impl.test.ts                             | fixed    |
| P2-RRV-004 | 2     | MINOR       | plans/v1/07-testing-strategy.md                                                            | fixed    |
| P2-RRV-005 | 2     | OBSERVATION | plans/v1/03-01-geometry-engine.md                                                          | fixed    |
| P2-RRV-006 | 2     | OBSERVATION | plans/v1/05-findings.md                                                                    | fixed    |
| P3-RV-001  | 3     | MINOR       | packages/react-components/src/components/TileGrid/virtualization/useAnchorPreservation.ts  | fixed    |
| P3-RV-002  | 3     | MINOR       | packages/react-components/test/browser/tile-grid-layout.browser.test.tsx                   | fixed    |
| P3-RV-003  | 3     | MINOR       | plans/v1/07-testing-strategy.md, 03-05, 00-ambiguity-register.md                           | fixed    |
| P3-RV-004  | 3     | MINOR       | packages/react-components/src/components/TileGrid/virtualization/options.ts, types.ts      | fixed    |
| P3-RV-005  | 3     | MINOR       | packages/react-components/src/components/TileGrid/useTileGrid.ts                           | fixed    |
| P3-PE-001  | 3     | MAJOR       | packages/react-components/src/components/TileGrid/virtualization/useTileGridVirtualizer.ts | fixed    |
| P3-PE-002  | 3     | MINOR       | packages/react-components/src/components/TileGrid/virtualization/useTileGridVirtualizer.ts | fixed    |
| P3-PE-003  | 3     | MINOR       | packages/react-components/src/components/TileGrid/useTileGrid.ts                           | fixed    |
| P4-RV-001  | 4     | MINOR       | packages/react-components/src/components/TileGrid/TileGrid.types.ts                        | fixed    |
| P4-RV-002  | 4     | MINOR       | packages/react-components/src/components/TileGrid/selection/transitions.ts                 | fixed    |
| P4-RV-003  | 4     | MINOR       | packages/react-components/src/components/TileGrid/TileGrid.types.ts                        | fixed    |
| P4-RV-004  | 4     | MINOR       | packages/react-components/src/components/TileGrid/stories/TileGridSelection.story.tsx      | fixed    |
| P4-RV-005  | 4     | MINOR       | packages/react-components/vitest.browser.config.ts                                         | fixed    |
| P5-RV-001  | 5     | MAJOR       | packages/react-components/src/components/TileGrid/marquee/createMarqueeController.ts       | fixed    |
| P5-RV-002  | 5     | MINOR       | packages/react-components/src/components/TileGrid/marquee/createMarqueeController.ts       | fixed    |
| P5-RV-003  | 5     | MINOR       | packages/react-components/src/components/TileGrid/marquee/types.ts                         | fixed    |
| P5-RV-004  | 5     | MINOR       | packages/react-components/src/components/TileGrid/marquee/createMarqueeController.ts       | fixed    |
| P5-RV-005  | 5     | MINOR       | packages/react-components/test/tile-grid-marquee.impl.test.ts                              | fixed    |
| P5-PE-001  | 5     | MAJOR       | packages/react-components/src/components/TileGrid/marquee/createMarqueeController.ts       | fixed    |
| P5-PE-002  | 5     | MINOR       | packages/react-components/src/components/TileGrid/marquee/createMarqueeController.ts       | fixed    |
| P5-PE-003  | 5     | MINOR       | packages/react-components/src/components/TileGrid/marquee/createMarqueeController.ts       | fixed    |
| P5-RRV-001 | 5     | MINOR       | plans/v1/03-03-selection-and-marquee.md                                                    | fixed    |
| P5-PE-004  | 5     | MINOR       | packages/react-components/src/components/TileGrid/marquee/createMarqueeController.ts       | fixed    |
| P6-RV-001  | 6     | MINOR       | packages/react-components/README.md                                                        | fixed    |
| P6-RV-002  | 6     | MINOR       | packages/react-components/README.md                                                        | fixed    |
| P6-RV-003  | 6     | MINOR       | packages/react-components/README.md                                                        | fixed    |
| P6-RV-004  | 6     | MINOR       | packages/react-components/README.md                                                        | fixed    |
| P6-RV-005  | 6     | MINOR       | packages/react-components/test/perf/tile-grid.perf.test.tsx                                | fixed    |
| P6-RV-006  | 6     | MINOR       | plans/v1/99-execution-plan.md, 03-05-test-harness-and-performance.md                       | fixed    |
| P6-PE-001  | 6     | MINOR       | packages/react-components/test/perf/tile-grid.perf.test.tsx                                | fixed    |
| P6-PE-002  | 6     | MINOR       | packages/react-components/test/perf/tile-grid.perf.test.tsx                                | fixed    |
| P6-PE-003  | 6     | MINOR       | plans/v1/03-05-test-harness-and-performance.md                                             | fixed    |
| P6-PE-004  | 6     | MINOR       | packages/react-components/vitest.perf.config.ts                                            | fixed    |

> **Phase 3 re-review:** clean — no remaining findings in the fix diff (`da873e3..855e9dc`).

## Deferred Rulings

- RV-007: update the root `AGENTS.md` command and CI guidance in Phase 6 task 6.2.2.
- P2-RV-005: the immutable ST-9 geometry spec requires `computeGeometry` to normalize duplicates; the component also normalizes. Revisit only with an authorized oracle change; otherwise accept the extra pass.
- P2-RV-014: the Phase 5 marquee hit test uses `getVisibleItemIds`/`getItemRect`; do not call `indexAtPoint` per pointer move at 20K.
