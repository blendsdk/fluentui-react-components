# Ambiguity Register: CollapsibleSection

> **Status**: ✅ GATE PASSED — all 30 items resolved
> **Last Updated**: 2026-10-27 15:33
> **CodeOps Artifact Schema**: 1

## Planning scope contract

| Boundary          | Authorized scope                                                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Planning target   | Standalone `collapsible-section` feature: one reusable library component following the `fluentui-components` skill.                             |
| Context artifacts | Current library source, manifests, tests, skills and CodeOps policy; earlier CastingAppMT analysis is read-only evidence.                       |
| Modification set  | This plan directory and its CodeOps roadmap/check bookkeeping only. No implementation, requirements of other features, or CastingAppMT changes. |

The user confirmed all four decision batches with **“I confirm”**, then left Plan mode and
said **“proceed”**. This canonical repository register imports the 26 decisions from the staged
register at `/home/gevik/.opencode/plan/collapsible-section/00-ambiguity-register.md`.
The staged file is historical; this file is the decision authority from this point forward.

## Decisions

| #   | Category                       | Decision / options presented                                                                                        | User decision                                                                                                                                                                                                 | Status      |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Scope / artifact               | Standalone plan versus an upstream RD.                                                                              | User accepted recommendation: standalone plan; `01-requirements.md` owns requirements.                                                                                                                        | ✅ Resolved |
| 2   | Scope / app boundary           | Library work versus modifying the reference app.                                                                    | User: “The CastingAppMT should never be touched.” No files, branches, worktrees, commits or migration there.                                                                                                  | ✅ Resolved |
| 3   | Scope / component boundary     | One component versus multiple candidates.                                                                           | User selected `CollapsibleSection` and library components only.                                                                                                                                               | ✅ Resolved |
| 4   | Technical / architecture       | Card plus Accordion versus styled Accordion or a custom disclosure.                                                 | User accepted recommendation: `Card`, `Accordion`, `AccordionItem`, `AccordionHeader`, `AccordionPanel`; no replacement button or disclosure engine. The blanket “no custom ARIA” claim is reopened by AR-27. | ✅ Resolved |
| 5   | UX / surface                   | Filled small Card versus outline or configurable surface.                                                           | User accepted recommendation: fixed `appearance="filled"`, Card `size="small"`.                                                                                                                               | ✅ Resolved |
| 6   | UX / header                    | Large versus extra-large or medium header default.                                                                  | User accepted recommendation: header `size="large"`, with all four Fluent header sizes supported.                                                                                                             | ✅ Resolved |
| 7   | UX / typography                | Semibold versus regular title.                                                                                      | User accepted recommendation: semibold through the header button slot.                                                                                                                                        | ✅ Resolved |
| 8   | Behavior / actions             | Hide versus retain actions when collapsed.                                                                          | User accepted recommendation: hide actions while collapsed.                                                                                                                                                   | ✅ Resolved |
| 9   | Behavior / lifecycle           | Default unmount versus a `keepMounted` API.                                                                         | User accepted recommendation: Fluent exit unmount; no `keepMounted` prop.                                                                                                                                     | ✅ Resolved |
| 10  | API / surface                  | Fixed versus exposed Card appearance and size.                                                                      | User accepted recommendation: no public Card appearance/size options.                                                                                                                                         | ✅ Resolved |
| 11  | API / callback                 | Boolean callback versus event-bearing callback.                                                                     | User accepted recommendation: `onCollapsedChange(collapsed: boolean)`.                                                                                                                                        | ✅ Resolved |
| 12  | State                          | Controlled plus uncontrolled versus controlled-only.                                                                | User accepted recommendation: both `collapsed` and `defaultCollapsed`; callback is optional.                                                                                                                  | ✅ Resolved |
| 13  | Naming                         | `size`, `headerSize` or `titleSize`.                                                                                | User accepted recommendation: `size` controls the Accordion header only.                                                                                                                                      | ✅ Resolved |
| 14  | Accessibility / headings       | Heading levels 2–6 versus 1–6 or fixed h2.                                                                          | User accepted recommendation: `headingLevel` accepts 2–6 and defaults to 2.                                                                                                                                   | ✅ Resolved |
| 15  | Accessibility / title          | Interactive versus non-interactive title content.                                                                   | User accepted recommendation: non-interactive rich title; actions belong in `actions`.                                                                                                                        | ✅ Resolved |
| 16  | Accessibility / actions        | Sibling action column versus nested controls.                                                                       | User accepted recommendation: action column is a sibling of `AccordionHeader`, never inside its button.                                                                                                       | ✅ Resolved |
| 17  | UX / motion                    | Fluent collapse motion versus instant disclosure.                                                                   | User accepted recommendation: use Fluent collapse motion; await exit in tests and check reduced motion in Storybook.                                                                                          | ✅ Resolved |
| 18  | Testing                        | Spec/impl/export tests versus additional browser or SSR tests.                                                      | User accepted recommendation: spec, implementation and export-pin tests; no new browser or SSR test.                                                                                                          | ✅ Resolved |
| 19  | Verification                   | Full verify plus Storybook versus verify alone.                                                                     | User accepted recommendation: `pnpm verify` and `pnpm storybook:build`.                                                                                                                                       | ✅ Resolved |
| 20  | Package API                    | Component/props only versus exposing internals.                                                                     | User accepted recommendation: only `CollapsibleSection` and `CollapsibleSectionProps`; helpers, state, render and styles stay private.                                                                        | ✅ Resolved |
| 21  | Metadata                       | No RD reference versus creating RD-01.                                                                              | User accepted recommendation: `Implements: —`; standalone plan, no invented RD.                                                                                                                               | ✅ Resolved |
| 22  | Security                       | UI-only safety versus new security machinery.                                                                       | User accepted recommendation: text escapes through React; no HTML parsing, network, storage, auth or secrets; markup-inertness assertion. Caller-supplied React elements remain caller-owned.                 | ✅ Resolved |
| 23  | Non-functional                 | Existing peer baseline versus performance/SSR additions.                                                            | User accepted recommendation: existing Fluent/React baseline; no numerical performance target, SSR smoke or virtualization.                                                                                   | ✅ Resolved |
| 24  | Edge cases                     | Direct native behavior versus runtime guards and fallbacks.                                                         | User accepted recommendation: omit absent actions wrapper, caller supplies meaningful title, controlled value wins, no-callback uncontrolled use works, long titles wrap and nested sections are supported.   | ✅ Resolved |
| 25  | Dependencies                   | Existing peers versus added icon/motion packages.                                                                   | User accepted recommendation: no new runtime or development dependency.                                                                                                                                       | ✅ Resolved |
| 26  | Documentation                  | README and stories versus extra documentation sites.                                                                | User accepted recommendation: package README and one component story file; no app documentation changes.                                                                                                      | ✅ Resolved |
| 27  | Accessibility / correction     | Small ID wiring through Fluent slots and `focusMode="off"` on Card versus relying on incomplete primitive defaults. | User chose “Accept both (Recommended)”: stable header/panel IDs and explicit Card focus mode.                                                                                                                 | ✅ Resolved |
| 28  | Accessibility / correction     | Return focus when collapsing removes focused body/actions versus an application precondition.                       | User chose “Accept both (Recommended)”: component-local, conditional focus restoration with no new public props or dependencies.                                                                              | ✅ Resolved |
| 29  | Workflow / roadmap             | Track the standalone plan in feature/portfolio roadmaps versus keeping only the plan.                               | User chose “Track in roadmap (Recommended)”; create the feature roadmap, link this plan, and add the portfolio entry without an invented RD.                                                                  | ✅ Resolved |
| 30  | Workflow / metadata correction | Local `REQ-CS` target versus adding a separate upstream RD.                                                         | User: “approved” in reply to the request to use `REQ-CS`. Declare `Implements: collapsible-section/REQ-CS`, identify the existing requirements locally and update the tracker. No new RD, behavior or tasks.  | ✅ Resolved |

## Evidence and correction notes

**AR-27:** Installed umbrella version is `@fluentui/react-components` 9.74.9; its Accordion is
9.12.4 and Card is 9.7.3. In installed `react-accordion/lib/components/AccordionHeader/useAccordionHeader.js:57-65`,
the default button has `aria-expanded` and `type="button"`, but no `aria-controls` or generated
ID. `react-accordion/lib/components/AccordionPanel/useAccordionPanel.js:53-65` passes caller props
and adds `inert` while closed; it does not generate panel associations. Use React `useId` and
public button/panel slots to supply these relationships without reimplementing disclosure.
In installed `react-card/lib/components/Card/useCard.js:64-79`, native pointer handlers can
activate Card's focus group. Explicit `focusMode="off"` preserves normal descendant tab order
while forwarding native root event handlers. No new dependency or generalized support layer.

**AR-28:** The installed panel becomes inert and later unmounts, but its hook contains no focus
restoration. Header actions also disappear on collapse. The house accessibility guidance
`skills/fluentui-components/references/accessibility.md:62-64` requires a sensible focus target
when content disappears. A component-local effect/ref check can restore the disclosure button
only when this component owned the removed focus, without stealing focus from elsewhere. The
alternative is a documented application precondition on controlled collapse. This is a bounded
correction to the accepted accessibility behavior, not a new feature or public prop.

Confidence: High on the installed primitive behavior. Hardening: direct source verification
corrected earlier claims that Fluent supplied all association and focus handling automatically.

## Gate review

All 12 categories were scanned. No auth, API, server validation, tenant data, persistent schema,
deployment or stakeholder-role decisions belong to this UI-only feature. No material support
machinery is proposed. Scope remains one component with existing peers and test infrastructure.
The user confirmed AR-1 and AR-4–AR-26 in the four batches, AR-27–AR-28 in the
accessibility-correction question, and AR-29 in the roadmap-tracking question.
AR-2 and AR-3 retain their original direct decisions.
AR-1–AR-30 are resolved. The user approved the AR-30 correction after readiness verification
identified the unsupported empty target. AR-30 supersedes only AR-21's original `Implements: —`
value; standalone ownership and the no-upstream-RD boundary remain unchanged.
No material decisions remain open or deferred.

## AR-30 — Standalone requirement target correction

**Category:** Workflow / metadata correction.

**Evidence:** The installed read-only checker `scripts/codeops_plan.py:19-23,205-207` requires
a recognized RD, T or REQ target in `Implements`. The previously recommended `Implements: —`
does not pass. No separate RD is necessary: the supported `REQ-*` form can identify requirements
owned by this standalone plan.

**Recommended option:** name the plan-local feature requirement `REQ-CS` in `01-requirements.md`,
declare `Implements: collapsible-section/REQ-CS`, and use `REQ-CS` in the feature roadmap. R1–R12
remain its unchanged detailed requirements. No upstream RD, behavior, task count or code changes.

**Alternative:** create a separate RD with user authorization and base this plan on it; this
requires expanding the agreed standalone artifact scope.

**Decision:** User: “approved” in reply to “Approve `REQ-CS` to finish the metadata correction.”
The local requirement target is `collapsible-section/REQ-CS`. This replaces AR-21's empty
metadata target only; the standalone plan and no-invented-RD decisions remain intact.

Confidence: High — the installed parser explicitly supports REQ targets. Hardening: mechanical
readiness validation caught the unsupported empty-target recommendation before execution.
