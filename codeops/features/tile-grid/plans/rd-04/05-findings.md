# RD-04 Execution Findings

| Finding | Phase | Severity | Area                 | Ruling   |
| ------- | ----- | -------- | -------------------- | -------- |
| RV-001  | 1     | CRITICAL | root-remount         | fixed    |
| PE-002  | 1     | CRITICAL | root-remount         | fixed    |
| RV-002  | 1     | MAJOR    | overlay-window       | fixed    |
| RV-003  | 1     | MAJOR    | no-op-drop-oracle    | fixed    |
| PE-001  | 1     | MAJOR    | sensor-identity      | fixed    |
| PE-003  | 1     | MAJOR    | reorder-perf         | fixed    |
| RV-004  | 1     | MINOR    | auto-scroll-contract | fixed    |
| RV-005  | 1     | MINOR    | reorder-warning      | fixed    |
| RV-006  | 1     | MINOR    | strings-merge        | fixed    |
| RV-007  | 1     | MINOR    | dragging-visual      | fixed    |
| RV-008  | 1     | MINOR    | selection-oracles    | fixed    |
| RV-009  | 1     | MINOR    | overlay-inert        | fixed    |
| RV-010  | 1     | MINOR    | handle-focus         | fixed    |
| RV-011  | 1     | MINOR    | announcement-repeat  | fixed    |
| RV-012  | 1     | MINOR    | pointer-coordinates  | fixed    |
| RV-013  | 1     | MINOR    | insertion-geometry   | fixed    |
| PE-004  | 1     | MINOR    | root-rect-cache      | fixed    |
| PE-005  | 1     | MINOR    | overlay-state        | deferred |
| PE-006  | 1     | MINOR    | action-allocation    | fixed    |
| PE-007  | 1     | MINOR    | auto-scroll-oracles  | fixed    |
| RV-101  | 1     | MAJOR    | live-drag-disable    | fixed    |
| RV-102  | 1     | MINOR    | action-cache-labels  | fixed    |
| RV-103  | 1     | MINOR    | sensor-array-warning | fixed    |
| RV-104  | 1     | MINOR    | no-op-oracle         | fixed    |
| RV-105  | 1     | MINOR    | end-indicator-clip   | fixed    |
| PE-101  | 1     | MINOR    | action-cache-labels  | fixed    |

PE-005 is deferred until the Phase 3 recipe measurements: owner exec-plan, revisit when the 20K recipe is measured. It is a render-cost observation, not a correctness defect, and PE-001 removes the dominant re-render amplifier.
