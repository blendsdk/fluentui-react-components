# Requirements: confirm-dialog

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-01](../../requirements/RD-01-confirm-dialog-component.md) and
> [RD-02](../../requirements/RD-02-confirm-provider.md) — the OWNING requirements docs

## Scope of this plan (delta view)

### In this plan

- RD-01 in full (Phase 1): the controlled `ConfirmDialog` — strict alert semantics, default pair,
  typed `actions` sets, `intent`/danger token recipe, `busy`, label robustness, native
  pass-through, accessibility wiring, story and README section (RD-01 Must Have).
- RD-02 in full (Phase 2): `ConfirmProvider` + `useConfirm()` — root-mounted once, promise-based,
  replacement semantics, settlement guarantees, provider `strings` chain, SSR safety, story and
  README section (RD-02 Must Have).
- Plan-local mechanisms the RDs leave to planning: the generic-preserving callable type
  (AR #5), the focus machinery (AR #7), the provider settlement mechanics (AR #8), the dialog
  mounting choice (AR #9) and the strings-chain ownership (AR #10) — pinned in `03-01`/`03-02`.

### Deferred / out of this plan

- Hold-open busy provider mode — named deferral (requirements AR #22); the plan never sets
  `busy` from the provider.
- Optional dialog header glyph — named deferral (requirements AR #23); no icon prop is added.
- Everything on both RDs' Won't Have lists (v8 mechanisms, global singleton, request queueing,
  multiple simultaneous dialogs per root, uncontrolled visibility, HTML content).

## Plan-local decisions

| Decision                | Chosen                                                                 | AR Ref |
| ----------------------- | ---------------------------------------------------------------------- | ------ |
| Plan identity           | `codeops/features/confirm-dialog/plans/confirm-dialog/`                | AR #1  |
| Plan shape              | One plan, RD-01 Phase 1 and RD-02 Phase 2                              | AR #2  |
| Verify commands         | `pnpm test` (spec/impl steps); `pnpm verify` + `pnpm storybook:build`  | AR #3  |
| Export surface          | Runtime `ConfirmDialog`, `ConfirmProvider`, `useConfirm` + seven types | AR #4  |
| Callable type mechanism | Two-overload object assertion (literal inference preserved)            | AR #5  |
| Internal interfaces     | `03-01 §Interfaces`, `03-02 §Interfaces` (cast-free outcome bridge)    | AR #6  |
| Focus machinery         | Layout capture/restore; busy rescue per `03-01 §Focus machinery`       | AR #7  |
| Provider mechanics      | Ref authority + settle-once + conditional clear + probe discriminator  | AR #8  |
| Provider mounting       | Always rendered, `open` toggle, per-request key                        | AR #9  |
| Strings chain           | Provider resolves the full chain before RD-01 receives it              | AR #10 |
| Test allocation         | `07-testing-strategy.md` channels and files                            | AR #11 |
| README placement        | Appended sections; Principles carve-out updated                        | AR #12 |
| Complexity posture      | No escalations; smallest viable design per the RD set                  | AR #13 |

> **Traceability:** Every plan-local decision references the register entry that resolved it. See
> `00-ambiguity-register.md`. All behavioral requirements and acceptance criteria are owned by
> RD-01 and RD-02; this document does not restate them.

## Acceptance Criteria

Plan-local criteria only (the RDs own their acceptance criteria):

1. [ ] Both component folders exist with the seven-file house anatomy (context file only for the
       provider); internals stay unexported after the leak check.
2. [ ] `test/package-exports.spec.test.ts` carries the extended runtime list and the type pins
       for both components (RD-01 AC 18, RD-02 AC 15; AR #4).
3. [ ] One story per component enumerates every documented variant; the dialog story carries the
       manual focus/keyboard and forced-colors checklist items (RD-01 AC 3/6/7, RD-01 AR #21).
4. [ ] The README gains both sections and the updated Principles carve-out (RD-01 AR #24,
       RD-02 Must Have; AR #12).
5. [ ] `pnpm verify` and `pnpm storybook:build` pass at every hardening step (AR #3).
