# Findings ledger — form-fields

> **Feature**: `form-fields`
> **CodeOps Artifact Schema**: 1

| Finding  | Phase   | Severity | Area                          | Ruling                                                                          |
| -------- | ------- | -------- | ----------------------------- | ------------------------------------------------------------------------------- |
| RV-001-1 | Phase 1 | MINOR    | `FormTextField.types.ts` docs | fixed — default value wording now names the form as the owner                   |
| RV-001-2 | Phase 1 | MINOR    | type tests                    | fixed — added component-level Date-path rejection and wrong-parse-return checks |
| RV-001-3 | Phase 1 | MINOR    | spec coverage                 | fixed — added the `-` partial-input case to the parse spec                      |
| RV-001-4 | Phase 1 | MINOR    | text state sync               | fixed — changed the external-sync effect to `useLayoutEffect`                   |

Phase 1 review: no CRITICAL or MAJOR findings. The four MINOR findings were fixed and verified; no re-review is required for minor-only fixes.

| RV-002-1 | Phase 2 | MINOR | `FormTextareaField` parse coverage | fixed — added numeric spec and Numeric story |
| RV-002-2 | Phase 2 | MINOR | type tests | fixed — added FormTextareaField path and parse-return type checks |

Phase 2 review: no CRITICAL or MAJOR findings. Both MINOR findings were fixed and verified; no re-review is required for minor-only fixes.

| RV-003-1 | Phase 3 | MINOR | disabled coverage | fixed — added form-level disabled checks to checkbox and switch specs |
| RV-003-2 | Phase 3 | MINOR | mixed coverage | fixed — added mixed-click transition coverage |
| RV-003-3 | Phase 3 | MINOR | type docs | fixed — listed all omitted props in both props JSDoc |
| RV-003-4 | Phase 3 | MINOR | mixed typing | fixed — widened the example/test value type to `boolean \| 'mixed'` |

Phase 3 review: no CRITICAL or MAJOR findings. All four MINOR findings were fixed and verified; no re-review is required for minor-only fixes.

| RV-004-1 | Phase 4 | MINOR | shared alias | fixed — the radio group now uses `SelectionFieldValue` |
| RV-004-2 | Phase 4 | MINOR | disabled coverage | fixed — added the form-level disabled case to the spec |
| RV-004-3 | Phase 4 | MINOR | public docs | fixed — documented the empty-string convention and focus limitation |

Phase 4 review: no CRITICAL or MAJOR findings. All three MINOR findings were fixed and verified; no re-review is required for minor-only fixes.

| RV-005-1 | Phase 5 | MINOR | disabled coverage | fixed — added the form-level disabled case to the Dropdown spec |

Phase 5 review: no CRITICAL or MAJOR findings. The MINOR finding was fixed and verified; no re-review is required for minor-only fixes.

| RV-006-1 | Phase 6 | MAJOR | accessible clear | fixed — documented the keyboard-accessible empty-value option pattern and added a spec/story; no new control surface |
| RV-006-2 | Phase 6 | MINOR | close behavior | fixed — popup close now reverts uncommitted text through `onOpenChange` |
| RV-006-3 | Phase 6 | MINOR | external sync docs | fixed — documented the same-value external update limitation |
| RV-006-4 | Phase 6 | MINOR | coverage | fixed — added Escape/close and empty-option clear coverage |

Phase 6 review: one MAJOR accessibility finding was fixed inside the existing scope with a documented primitive pattern; no new public control surface was introduced. The MINOR findings were fixed and verified; no re-review is required for the documentation/test corrections.

| RV-006-5 | Phase 6 re-review | MINOR | empty option display | fixed — an empty-value selection now clears the input text as well as the stored value |

Phase 6 re-review: the original MAJOR is resolved and no new CRITICAL/MAJOR findings were reported. The remaining MINOR was fixed and verified.

| RV-007-1 | Phase 7 | MINOR | size propagation | fixed — the DatePicker size now reaches the Field label |
| RV-007-2 | Phase 7 | MINOR | spec amendment | accepted — an additive form-level disabled case was added during execution; no assertion was weakened |
| RV-007-3 | Phase 7 | MINOR | editability coverage | fixed — the spec now asserts the default read-only state and the `allowTextInput` editable state |

Phase 7 review: no CRITICAL or MAJOR findings. The MINOR findings were fixed or explicitly accepted; no re-review is required for minor-only fixes.

| RV-008-1 | Phase 8 | MINOR | README peer wording | fixed — qualified the validation-library peer statement |
| RV-008-2 | Phase 8 | MINOR | README example | fixed — added `startDate` and the `FormDatePickerField` import to the example type |
| RV-008-3 | Phase 8 | MINOR | README label summary | fixed — the summary now states that Checkbox and Switch own their labels |

Phase 8 review: no CRITICAL or MAJOR findings. All three MINOR documentation findings were fixed and verified; no re-review is required for minor-only fixes.
