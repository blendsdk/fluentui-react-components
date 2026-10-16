# Findings Ledger: error-dialog

> **Document**: 05-findings.md
> **Parent**: [Index](00-index.md)

One compact row per reviewed batch; identifiers `RV-`/`SA-`/`PE-`/`SR-` and area tokens only.

| Finding | Phase | Severity | Area                 | Ruling   |
| ------- | ----- | -------- | -------------------- | -------- |
| RV-001  | 1     | MINOR    | hook/export-surface  | accepted |
| RV-002  | 1     | MINOR    | types/README         | fixed    |
| RV-003  | 1     | MINOR    | plan/header-stamps   | fixed    |
| SA-001  | 1     | MINOR    | serializer/**proto** | fixed    |
| SA-002  | 1     | MINOR    | hook/clipboard-probe | accepted |
| SA-003  | 1     | MINOR    | tests/clipboard      | fixed    |
| RV-004  | 2     | MINOR    | README/capture       | fixed    |
| RV-005  | 2     | MINOR    | stories/strings      | accepted |

Accepted entries are report-only acknowledgements (no change needed); fixed entries were
implemented, verified and follow-up-committed.

Phase 2's reviewer reported its findings with per-phase numbering (RV-001/RV-002); they are
recorded here as RV-004/RV-005 so plan-wide identifiers stay unique. Phase 2's security audit
reported no findings.
