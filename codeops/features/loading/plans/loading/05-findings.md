# Findings: Loading Execution

> Post-phase review ledger. Findings use the review prefixes (`RV-`/`SA-`/`PE-`/`SR-`) and the
> preflight severity scale.

| Finding | Phase | Severity | Area              | Ruling |
| ------- | ----- | -------- | ----------------- | ------ |
| RV-001  | 1     | MINOR    | loading.spec.test | fixed  |
| RV-002  | 1     | MINOR    | Loading.stories   | fixed  |
| RV-003  | 1     | MINOR    | README            | fixed  |
| RV-004  | 1     | MINOR    | Loading.types     | fixed  |
| RV-001  | 2     | MINOR    | focus restore     | fixed  |
| RV-002  | 2     | MINOR    | component shell   | fixed  |

**RV-001** — the oracle's tab-order assertion accepted `tabIndex={0}`. The spec test stays
unchanged; the stricter `-1` assertion was added to the implementation test instead.

**RV-001 (phase 2)** — the body-blur branch restored the loading-start element instead of the
reveal-time element. Fixed by tracking the last focused element during the delay (AR-17) and adding
an implementation test for a blurred reveal-time restore.

**RV-002 (phase 2)** — the shell used `useImperativeHandle` instead of the repository's
state-hook ref pattern. Fixed by threading the forwarded ref through `useLoadingOverlay` (AR-16).

**Parent correction** — the Phase 1 deliverable update briefly checked the identical
"All verification passing." line in Phases 2 and 3. Both were reverted; no other phase state was
affected.
