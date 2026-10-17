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
| RV-001  | 3     | MINOR    | controller docs   | fixed  |
| RV-002  | 3     | MINOR    | overlay stories   | fixed  |
| RV-001  | 4     | MAJOR    | timestamps        | fixed  |
| RV-002  | 4     | MINOR    | success criteria  | fixed  |
| RV-003  | 4     | MINOR    | plan index        | fixed  |
| RV-004  | 4     | MINOR    | roadmap header    | fixed  |
| RV-005  | 4     | MINOR    | findings ledger   | fixed  |

**RV-001** — the oracle's tab-order assertion accepted `tabIndex={0}`. The spec test stays
unchanged; the stricter `-1` assertion was added to the implementation test instead.

**RV-001 (phase 2)** — the body-blur branch restored the loading-start element instead of the
reveal-time element. Fixed by tracking the last focused element during the delay (AR-17) and adding
an implementation test for a blurred reveal-time restore.

**RV-002 (phase 2)** — the shell used `useImperativeHandle` instead of the repository's
state-hook ref pattern. Fixed by threading the forwarded ref through `useLoadingOverlay` (AR-16).

**RV-001 (phase 3)** — the `LoadingOptions` and `LoadingController` doc comments described the
label rule imprecisely. Both now state the idle default and the "active labeled operation"
preference.

**RV-002 (phase 3)** — the async story did not disable its trigger during the delay. Every demo
story now disables its action while pending; the static idle story was removed and the
always-loading label story explains its disabled action.

**RV-001 (phase 4)** — several task completion timestamps were ahead of the measured clock. Every
batch was re-stamped from its recorded Git commit time, Phase 4 from the measured clock, and the
plan, roadmap and register headers were aligned.

**RV-002…RV-004 (phase 4)** — the Success Criteria no longer claim completion, the plan index is
`Blocked`, and the feature roadmap header is `In Progress`.

**RV-005 (phase 4 re-review)** — the Phase 4 findings were missing from this ledger; they are now
recorded, closing the single fix-diff re-review.

**Parent correction** — the Phase 1 deliverable update briefly checked the identical
"All verification passing." line in Phases 2 and 3. Both were reverted; no other phase state was
affected.
