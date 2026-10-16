# Findings Ledger: confirm-dialog

> **Document**: 05-findings.md
> **Parent**: [Index](00-index.md)

One compact row per reviewed batch; identifiers `RV-`/`SA-`/`PE-`/`SR-` and area tokens only.

| Finding | Phase | Severity | Area                      | Ruling   |
| ------- | ----- | -------- | ------------------------- | -------- |
| RV-001  | 1     | MINOR    | api-surface/callable-type | fixed    |
| RV-002  | 1     | MINOR    | tests/focus-restore       | fixed    |
| RV-003  | 1     | MINOR    | tests/spec-file-size      | accepted |
| RV-004  | 1     | MINOR    | roadmap/rd-02-stage       | fixed    |
| RV-005  | 1     | MINOR    | tests/v8-scan-coverage    | fixed    |
| RV-101  | 2     | MINOR    | provider/stale-activation | fixed    |
| SA-101  | 2     | MAJOR    | provider/stale-activation | fixed    |
| RV-102  | 2     | MINOR    | provider/late-call        | fixed    |
| SA-102  | 2     | MINOR    | provider/late-call        | fixed    |
| RV-103  | 2     | MINOR    | docs/actions-settlement   | fixed    |
| RV-104  | 2     | MINOR    | tests/focus-restore       | fixed    |
| RV-105  | 2     | MINOR    | plan/record-count         | fixed    |
| RV-201  | 2     | MAJOR    | provider/probe-window     | fixed    |

Accepted entries are report-only acknowledgements (no change needed); fixed entries were
implemented, verified and follow-up-committed.

Phase 1's independent review reported no critical or major findings; two documented deviations
(the ST-10 class-set technique and the export identity assertion) were audited and upheld.
RV-003 is accepted: the single-contract spec oracle reads best as one cohesion unit and sits just
over the soft size guidance (742 lines); revisit if it grows further. Phase 1's security audit
reported no findings.

Phase 2's reviewer and security auditor independently reported the same stale-activation defect
(RV-101 = SA-101, the phase's only MAJOR): a supersede running before a click reached the old
dialog's handler could settle the newer, never-shown request. Fixed by binding each activation to
the request its dialog was rendered for. The scoped re-review on the fix diff confirmed
RV-101/SA-101 and RV-102/SA-102 resolved with discriminating tests (pre-fix reproductions failed
as expected) and surfaced one new MAJOR introduced by the fix — RV-201: the unmount guard
misread the StrictMode probe window, faking a live request to "declined"; fixed with the
verifier-validated deferred remedy (install normally, defer the self-settlement one microtask)
plus a discriminating impl test. The phase's budgeted re-review is spent; the remedy itself was
independently proofed during that re-review's probes.
