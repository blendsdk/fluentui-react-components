# Current State: CollapsibleSection

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)
> **Observed**: 2026-10-27

## Existing Implementation

There is no `CollapsibleSection` in the public root barrel or component directories. The source
library already has description lists, confirmation/error dialogs, launchers, loading surfaces,
form fields and TileGrid. This is an additive library component, not a refactor of those features.

CastingAppMT was examined earlier as a read-only source of repeated interaction patterns. No
further app access is required for this plan or its implementation. Counts from the earlier
survey are motivation only, not an acceptance criterion or a claim of production usage.

## Relevant Files

| Repository evidence                                                                       | Observed fact                                                  | Planned treatment                                |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ |
| `package.json:12,23,25-31`                                                                | pnpm 12.11.2, Prettier, verify and Storybook commands          | Reuse unchanged                                  |
| `packages/react-components/package.json`                                                  | React 19 peers; Fluent umbrella dev baseline 9.74.9            | Reuse unchanged; no new dependency               |
| `packages/react-components/src/index.ts`                                                  | Explicit component/type exports, no directory wildcard surface | Add exactly the accepted exports                 |
| `packages/react-components/src/components/DescriptionList/DescriptionList.tsx`            | Small forwardRef shell delegates to hook/render                | Authoring reference                              |
| `packages/react-components/src/components/DescriptionList/DescriptionList.types.ts:23-34` | Native-root props plus owned contract                          | Authoring reference, not a copied implementation |
| `packages/react-components/src/components/AppLauncher/useAppLauncher.ts:102-109`          | Internal mirror plus authoritative controlled prop             | State-pattern reference                          |
| `packages/react-components/test/package-exports.spec.test.ts:51-85`                       | Exact sorted runtime surface                                   | Additive extension; preserve existing entries    |
| `packages/react-components/vitest.config.ts:15-25`                                        | jsdom default with browser/performance suites excluded         | No new suite/config                              |
| `skills/fluentui-components/references/accessibility.md:62-64`                            | Focus must not disappear when content is removed               | Approved local focus correction                  |
| `codeops/codeops.json:5-8`                                                                | Strict independent phase review; stop on major                 | Keep exec-plan review gates                      |

## Installed Primitive Evidence

The following paths are relative to each installed package's root under `node_modules/.pnpm/`.
They are read-only evidence, never imports or files to modify. Component imports must use
`@fluentui/react-components`.

| Installed source                                                               | Observation                                                                                                                  |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Accordion 9.12.4: `lib/components/AccordionHeader/useAccordionHeader.js:49-65` | Button has `aria-expanded` and `type="button"`; no generated header/panel ID association.                                    |
| Same file `:66-76`                                                             | Header invokes its own requestToggle; do not duplicate click/key handling.                                                   |
| Same file `:19-35`                                                             | Fluent supplies the decorative chevron and transition.                                                                       |
| Accordion 9.12.4: `lib/components/AccordionPanel/useAccordionPanel.js:32-38`   | Collapse presence motion uses `unmountOnExit: true`.                                                                         |
| Same file `:46-65`                                                             | Closed/collapsing panel gets `inert` and negative tabindex; no focus restoration or generated relationship IDs.              |
| Card 9.7.3: `lib/components/Card/useCard.js:13-34,64-79`                       | Pointer handlers can enable interactive Card focus grouping unless focusMode is explicitly off.                              |
| Same file `:137-143`                                                           | Default Card root is a div with group semantics; caller native props flow to the root.                                       |
| Card 9.7.3: `lib/components/Card/useCardStyles.styles.js:31`                   | Card already supplies padding, gap, radius and surface treatment. Avoid recreating Surface styles or adding a second shadow. |

Offline Fluent references reviewed: `fluentui/references/components/accordion.md` (Accordion
9.12.0) and `card.md` (Card 9.7.0). They are API guidance, not authority over the newer installed
code. The installed source above resolves the differences, especially the earlier incorrect
claim that panel association and close-time focus recovery were automatic (AR-27, AR-28).

## Gaps Identified

| Gap                                                | Required correction                                | Authority  |
| -------------------------------------------------- | -------------------------------------------------- | ---------- |
| No reusable independent disclosure card            | Add one component through the house anatomy        | AR-3, AR-4 |
| Primitive association is incomplete                | Small stable-ID adapter through public slots       | AR-27      |
| Native root handlers can change Card tab behavior  | Fix `focusMode="off"`, still forwarding handlers   | AR-27      |
| Controlled collapse can remove focused descendants | Conditional focus recovery to this disclosure only | AR-28      |

## Dependencies

Existing React and Fluent peers only; the built-in header chevron and panel motion require no
direct icon/motion import or new manifest entry. Reuse Vitest, Testing Library, Storybook,
Griffel and the current provider setup. No public context or shared utility layer is needed.

## Risks and Concerns

| Risk                                                   | Likelihood / impact | Bounded mitigation                                                                                                               |
| ------------------------------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Prop semantics confused with Card size                 | Medium / medium     | Spec and docs distinguish header size from fixed Card size.                                                                      |
| Double padding and clipped header focus ring           | Medium / medium     | Use Card defaults, minimal layout rules, and narrow/zoom visual checks.                                                          |
| Focus stolen from another instance or external control | Medium / high       | Narrow ownership checks and explicit no-steal tests.                                                                             |
| Fake keyboard/motion evidence from jsdom               | Medium / medium     | Assert native button semantics; use real click tests and await unmount. Manually verify native keyboard and motion in Storybook. |
| Unmount loses local form state                         | Expected / medium   | Document lifecycle and demonstrate reopening reset; no accidental keepMounted guarantee.                                         |
| Root native `title` conflicts with rich section title  | Certain / medium    | Omit native title from the type and document its owned meaning.                                                                  |
| Broad peer range mistaken for validated oldest version | Medium / medium     | Document the actual installed baseline; do not change existing peers.                                                            |

No pre-existing source/test debt is bundled into this feature. Any unrelated verification failure
is reported with its evidence rather than silently repaired.
