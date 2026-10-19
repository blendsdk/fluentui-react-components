# form-fields — Requirements Documents

> **Feature**: form-fields — eight React Hook Form field wrappers for the Fluent UI v9 primitives
> **Status**: Implemented
> **Created**: 2026-10-19
> **Architecture**: React 19 + Fluent UI v9 (`@fluentui/react-components` 9.74), React Hook Form 7, TypeScript, Griffel design tokens, Vitest + Testing Library, Storybook
> **CodeOps Artifact Schema**: 1

---

## Overview

Applications using Fluent UI v9 and React Hook Form currently wire every field by hand: `useController`, the primitive's value and change handler, `Field` for the label and error, and the accessibility ids. The wiring is repetitive and easy to get subtly wrong, especially for toggles, selection fields and dates.

This feature adds eight thin wrappers to `@blendsdk/fluentui-react-components`: `FormTextField`, `FormTextareaField`, `FormCheckboxField`, `FormSwitchField`, `FormRadioGroupField`, `FormDropdownField`, `FormComboboxField` and `FormDatePickerField`. The library owns the binding only; the application owns `useForm`, the schema, the resolver, DTO mapping and business rules.

## Minimum-Sufficient Baseline

**Original goal:** make an application form with Fluent UI v9 controls and React Hook Form without rewriting the controller wiring for every field.

**Smallest viable design:** eight thin wrappers over the Fluent primitives, a shared `useController` helper, a shared value/display helper, and Fluent `Field` for labels, hints, required state and validation. No form engine, no schema library, no global provider and no new visual layer.

**Excluded support machinery:** multiselect, freeform Combobox, a forms subpath export, SSR smoke tests, a DatePicker time picker, FormProvider support, transformed output types, and any new runtime dependency beyond the two approved peers.

**Approved complexity:** the optional `getOptionText` prop for selection display text and the `@fluentui/react-datepicker-compat` peer for the DatePicker component. Both were explicitly approved by the user.

## Domain Lenses

| Lens                   | Selected | Evidence                                                                                                                               |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Web application        | ✅       | Browser form controls; label/hint/error/required/disabled accessibility, keyboard behavior and theming.                                |
| API surface            | ✅       | Eight new components and eight props types; the package-export test pins the runtime surface.                                          |
| Accessibility          | ✅       | Field associations, one label for Checkbox/Switch, group label for RadioGroup, DatePicker id workaround, Combobox keyboard clear path. |
| Concurrency            | —        | No shared async state; each field subscribes to one controller.                                                                        |
| Financial system       | —        | No money, balances or ledger concepts.                                                                                                 |
| Distributed/concurrent | —        | No threads, queues or replicas.                                                                                                        |
| Data and migration     | —        | Additive exports only; no persisted schema or compatibility window.                                                                    |

## Document Index

| #         | Document                                                                    | Description                                                        | Depends On |
| --------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------- |
| **RD-01** | [RD-01 — React Hook Form field components](RD-01-react-hook-form-fields.md) | The complete requirements for the eight wrappers                   | —          |
| **Plan**  | [form-fields plan](../plans/form-fields/00-index.md)                        | Design, decisions, tests, execution record and acceptance evidence | RD-01      |

## Dependency Graph

```text
RD-01 (React Hook Form field components)
  └── builds on the existing package infrastructure
      (FluentProvider theming, Fluent Field, component pattern, Vitest suite)
  └── plan: codeops/features/form-fields/plans/form-fields/
```

## Implementation Status

The feature is implemented and verified. `pnpm verify` passes with 425 tests, `pnpm storybook:build` succeeds, and `pnpm pack:check` publishes only `dist`. The GitHub verification comment and closure are tracked as `T-01` in the feature roadmap; they are a separate project-management action.
