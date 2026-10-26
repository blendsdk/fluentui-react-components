# RD-04 Execution Findings

| Finding | Phase | Severity | Area                  | Ruling   |
| ------- | ----- | -------- | --------------------- | -------- |
| RV-001  | 1     | CRITICAL | root-remount          | fixed    |
| PE-002  | 1     | CRITICAL | root-remount          | fixed    |
| RV-002  | 1     | MAJOR    | overlay-window        | fixed    |
| RV-003  | 1     | MAJOR    | no-op-drop-oracle     | fixed    |
| PE-001  | 1     | MAJOR    | sensor-identity       | fixed    |
| PE-003  | 1     | MAJOR    | reorder-perf          | fixed    |
| RV-004  | 1     | MINOR    | auto-scroll-contract  | fixed    |
| RV-005  | 1     | MINOR    | reorder-warning       | fixed    |
| RV-006  | 1     | MINOR    | strings-merge         | fixed    |
| RV-007  | 1     | MINOR    | dragging-visual       | fixed    |
| RV-008  | 1     | MINOR    | selection-oracles     | fixed    |
| RV-009  | 1     | MINOR    | overlay-inert         | fixed    |
| RV-010  | 1     | MINOR    | handle-focus          | fixed    |
| RV-011  | 1     | MINOR    | announcement-repeat   | fixed    |
| RV-012  | 1     | MINOR    | pointer-coordinates   | fixed    |
| RV-013  | 1     | MINOR    | insertion-geometry    | fixed    |
| PE-004  | 1     | MINOR    | root-rect-cache       | fixed    |
| PE-005  | 1     | MINOR    | overlay-state         | deferred |
| PE-006  | 1     | MINOR    | action-allocation     | fixed    |
| PE-007  | 1     | MINOR    | auto-scroll-oracles   | fixed    |
| RV-101  | 1     | MAJOR    | live-drag-disable     | fixed    |
| RV-102  | 1     | MINOR    | action-cache-labels   | fixed    |
| RV-103  | 1     | MINOR    | sensor-array-warning  | fixed    |
| RV-104  | 1     | MINOR    | no-op-oracle          | fixed    |
| RV-105  | 1     | MINOR    | end-indicator-clip    | fixed    |
| PE-101  | 1     | MINOR    | action-cache-labels   | fixed    |
| RV-201  | 2     | MAJOR    | shell-content-height  | fixed    |
| RV-202  | 2     | MAJOR    | custom-handle-slot    | fixed    |
| RV-203  | 2     | MINOR    | overlay-fade          | fixed    |
| RV-204  | 2     | MINOR    | overlay-stacking-doc  | fixed    |
| RV-205  | 2     | MINOR    | inline-focus-policy   | fixed    |
| RV-206  | 2     | MINOR    | handle-label-fallback | fixed    |
| RV-207  | 2     | MINOR    | handle-pressed-state  | fixed    |
| RV-208  | 2     | MINOR    | painted-style-oracles | fixed    |
| RV-209  | 2     | MINOR    | drag-oracle-strength  | fixed    |
| RV-210  | 2     | MINOR    | plan-progress-drift   | fixed    |
| RV-211  | 2     | MINOR    | oracle-adjustment     | fixed    |
| RV-212  | 2     | MINOR    | type-docs             | fixed    |
| PE-301  | 3     | MAJOR    | bundle-format         | fixed    |
| PE-302  | 3     | MINOR    | recipe-strings        | fixed    |
| PE-303  | 3     | MINOR    | recipe-count-oracle   | fixed    |
| RV-301  | 3     | MINOR    | badge-corner-doc      | fixed    |
| RV-302  | 3     | MINOR    | toolbar-composition   | fixed    |
| RV-303  | 3     | MINOR    | selection-oracle      | fixed    |
| RV-304  | 3     | MINOR    | empty-state-doc       | fixed    |

PE-005 is deferred until the Phase 3 recipe measurements: owner exec-plan, revisit when the 20K recipe is measured. It is a render-cost observation, not a correctness defect, and PE-001 removes the dominant re-render amplifier.

RV-211 records a deliberate oracle adjustment made while turning the new suite green: the initial `aria-expanded="false"` assertion was removed because the governing ST-42 case requires the trigger name, one action, and focus return, not the initial expanded value, and an eighth browser case now covers the keyboard-menu integration. The shell spec remains the Phase 2 oracle; later assertions will not be relaxed to match implementation.

All Phase 2 findings RV-201..RV-212 are closed; the single scoped re-review found no new critical, major, or minor issues.

PE-301 was deferred from RD-04 to the release freeze. The freeze adopts per-module ESM output: a Loading-only consumer measures 1.35 kB gzip and contains no TileGrid or @dnd-kit reference, versus about 29.4 kB gzip for the former single bundle. The package-surface and artifact guards cover the new output.
