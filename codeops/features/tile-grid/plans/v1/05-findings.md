# Findings Ledger: TileGrid Phase A

| Finding    | Phase | Severity    | Area                                                                                 | Ruling   |
| ---------- | ----- | ----------- | ------------------------------------------------------------------------------------ | -------- |
| RV-001     | 1     | MINOR       | packages/react-components/package.json                                               | fixed    |
| RV-002     | 1     | MINOR       | packages/react-components/test/setup.ts                                              | fixed    |
| RV-003     | 1     | MINOR       | packages/react-components/test/harness                                               | fixed    |
| RV-004     | 1     | MINOR       | requirements/RD-03                                                                   | fixed    |
| RV-005     | 1     | MINOR       | plans/v1/99-execution-plan.md                                                        | fixed    |
| RV-006     | 1     | OBSERVATION | packages/react-components/test/jsdomStubs.ts                                         | fixed    |
| RV-007     | 1     | OBSERVATION | AGENTS.md                                                                            | deferred |
| P2-RV-001  | 2     | MAJOR       | packages/react-components/src/components/TileGrid/devWarnings.ts                     | fixed    |
| P2-RV-002  | 2     | MAJOR       | packages/react-components/src/components/TileGrid/geometry/mosaicLayout.ts           | fixed    |
| P2-RV-003  | 2     | MAJOR       | packages/react-components/src/components/TileGrid/geometry/mosaicLayout.ts           | fixed    |
| P2-RV-004  | 2     | MINOR       | packages/react-components/src/components/TileGrid/renderTileGrid.tsx                 | fixed    |
| P2-RV-005  | 2     | MINOR       | packages/react-components/src/components/TileGrid/geometry/computeGeometry.ts        | deferred |
| P2-RV-006  | 2     | MINOR       | packages/react-components/src/components/TileGrid/geometry/normalize.ts              | fixed    |
| P2-RV-007  | 2     | MINOR       | packages/react-components/src/components/TileGrid/geometry/computeGeometry.ts        | fixed    |
| P2-RV-008  | 2     | MINOR       | plans/v1/99-execution-plan.md                                                        | fixed    |
| P2-RV-009  | 2     | MINOR       | packages/react-components/test/tile-grid-layout.impl.test.tsx                        | fixed    |
| P2-RV-010  | 2     | OBSERVATION | packages/react-components/src/components/TileGrid/TileGrid.tsx                       | fixed    |
| P2-RV-011  | 2     | OBSERVATION | packages/react-components/src/components/TileGrid/useTileGrid.ts                     | fixed    |
| P2-RV-012  | 2     | OBSERVATION | packages/react-components/src/components/TileGrid/TileGridItemView.tsx               | fixed    |
| P2-RV-013  | 2     | OBSERVATION | packages/react-components/src/components/TileGrid/virtualization/useContainerSize.ts | fixed    |
| P2-RV-014  | 2     | OBSERVATION | plans/v1/03-03-selection-and-marquee.md                                              | deferred |
| P2-RRV-001 | 2     | MAJOR       | packages/react-components/src/components/TileGrid/devWarnings.ts                     | fixed    |
| P2-RRV-002 | 2     | MAJOR       | packages/react-components/test/tile-grid-geometry.impl.test.ts                       | fixed    |
| P2-RRV-003 | 2     | MINOR       | packages/react-components/test/tile-grid-geometry.impl.test.ts                       | fixed    |
| P2-RRV-004 | 2     | MINOR       | plans/v1/07-testing-strategy.md                                                      | fixed    |
| P2-RRV-005 | 2     | OBSERVATION | plans/v1/03-01-geometry-engine.md                                                    | fixed    |
| P2-RRV-006 | 2     | OBSERVATION | plans/v1/05-findings.md                                                              | fixed    |

## Deferred Rulings

- RV-007: update the root `AGENTS.md` command and CI guidance in Phase 6 task 6.2.2.
- P2-RV-005: the immutable ST-9 geometry spec requires `computeGeometry` to normalize duplicates; the component also normalizes. Revisit only with an authorized oracle change; otherwise accept the extra pass.
- P2-RV-014: the Phase 5 marquee hit test uses `getVisibleItemIds`/`getItemRect`; do not call `indexAtPoint` per pointer move at 20K.
