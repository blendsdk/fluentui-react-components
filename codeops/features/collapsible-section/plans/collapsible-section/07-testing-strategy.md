# Testing Strategy: CollapsibleSection

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

Use existing Vitest/jsdom and Testing Library with real Fluent components inside FluentProvider.
No new runner, dependency, global test shim or component mock is authorized (AR-18, AR-25).
Public observations form the immutable oracle; implementation tests cover private structure.
Default coverage goals are stated in [requirements](01-requirements.md#technical-requirements).

Tests are written before implementation, proven red, then made green without weakening their
assertions. Cases below derive from requirements and [03-01](03-01-collapsible-section.md), not
from imagined code. Runtime/type pins add to existing tests without modifying previous contracts.
Keep behavioral and accessibility files separate so each stays around 200–300 lines.

## Specification Test Cases

### 🚨 Specification Test Cases — Immutable Oracle

| #     | Input / scenario                                                                                                                                                           | Expected output / behavior                                                                                                                                                                                                                                                                                        | Source                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| ST-1  | Render title “Details” and body “Content”, no state props.                                                                                                                 | Named native button has `type="button"` and expanded true; body is visible; callback has not fired.                                                                                                                                                                                                               | R2, R3, R5; 03-01 State transitions |
| ST-2  | First render with `defaultCollapsed={true}` and a child with a mount spy.                                                                                                  | Header is collapsed; child never mounts; content-control target still exists.                                                                                                                                                                                                                                     | R4, R6; AR-9, AR-27                 |
| ST-3  | Uncontrolled expanded section; click its disclosure twice, awaiting collapse exit before reopening.                                                                        | Callback sequence is exactly `[true, false]`; effective state follows each request.                                                                                                                                                                                                                               | R3; AR-11, AR-12                    |
| ST-4  | Mount uncontrolled expanded; rerender with `defaultCollapsed={true}`.                                                                                                      | Effective state stays expanded; no callback occurs from the prop change.                                                                                                                                                                                                                                          | R3; 03-01 State transitions         |
| ST-5  | Supply `collapsed={false}` and spy callback; click disclosure without updating the prop.                                                                                   | Callback reports true once; header/body remain expanded.                                                                                                                                                                                                                                                          | R3; AR-12, AR-24                    |
| ST-6  | Controlled parent echoes requested booleans; user clicks to collapse then expand.                                                                                          | Rendered state changes with the parent; callback fires once per user request.                                                                                                                                                                                                                                     | R3; AR-11, AR-12                    |
| ST-7  | Rerender controlled collapsed false → true → false without user activation.                                                                                                | Body follows props; callback never fires.                                                                                                                                                                                                                                                                         | R3, R4; 03-01 State transitions     |
| ST-8  | Pass `collapsed={false}` and `defaultCollapsed={true}` together.                                                                                                           | Controlled false wins; section is expanded.                                                                                                                                                                                                                                                                       | R3; AR-24                           |
| ST-9  | Omit callback in uncontrolled and controlled hosts; activate both.                                                                                                         | Uncontrolled host changes; controlled host stays at its supplied value; neither throws.                                                                                                                                                                                                                           | R3; AR-24                           |
| ST-10 | Expanded section with named Edit action; click Edit.                                                                                                                       | Edit callback fires once; disclosure callback does not fire; Edit is not inside the disclosure button.                                                                                                                                                                                                            | R2, R5; AR-15, AR-16                |
| ST-11 | Expanded section with action; rerender controlled collapsed true.                                                                                                          | Action is absent immediately, not merely opacity-hidden; body is absent after Fluent exit completion.                                                                                                                                                                                                             | R4; AR-8, AR-9, AR-17               |
| ST-12 | Change local state in body; collapse, await unmount, reopen.                                                                                                               | Body mounts fresh with its initial local state.                                                                                                                                                                                                                                                                   | R4; AR-9                            |
| ST-13 | Nested outer and inner sections; toggle inner, then collapse/reopen outer.                                                                                                 | Inner request does not notify/toggle outer; outer exit removes inner and reopening mounts fresh inner state.                                                                                                                                                                                                      | R3, R4; AR-24                       |
| ST-14 | Render default heading and parameterized levels 2, 3, 4, 5, 6.                                                                                                             | Default is an h2; each supplied level is a real matching heading containing the named disclosure.                                                                                                                                                                                                                 | R5; AR-14                           |
| ST-15 | Render rich non-interactive title and body React elements.                                                                                                                 | Content is rendered as elements; disclosure name comes from title text; no native tooltip is generated from the rich `title`.                                                                                                                                                                                     | R2, R5; AR-15                       |
| ST-16 | Two sections, including a nested instance; capture button IDs/control targets; rerender then collapse one.                                                                 | Non-empty stable IDs are distinct; every `aria-controls` resolves to its own persistent host; each mounted panel has role `group`, is named by its own disclosure via `aria-labelledby`, and exposes that accessible name. The persistent host stays generic and does not become an empty named group after exit. | R6; AR-24, AR-27                    |
| ST-17 | Pass root id, aria-label, data attribute, class, inline style and ref.                                                                                                     | Attributes, style and caller class reach the same root div exposed by the ref; native root id does not replace private association IDs.                                                                                                                                                                           | R9; 03-01 Public contract           |
| ST-18 | Add root click spy; click a plain body element and separately the root.                                                                                                    | Native callback fires normally; neither action toggles the disclosure.                                                                                                                                                                                                                                            | R3, R9; AR-27                       |
| ST-19 | Focus a body input; externally set collapsed true.                                                                                                                         | Focus returns to this section's disclosure, not document body; body later unmounts.                                                                                                                                                                                                                               | R7; AR-28                           |
| ST-20 | Focus a header action; externally collapse the section.                                                                                                                    | Removed action loses focus to this section's disclosure in the collapse commit.                                                                                                                                                                                                                                   | R4, R7; AR-28                       |
| ST-21 | Focus an outside button or another section's input; externally collapse the first section.                                                                                 | Outside/other-section focus remains unchanged. Include a prior visit to the first body to detect stale ownership.                                                                                                                                                                                                 | R7; AR-28                           |
| ST-22 | Focus an outside control before mounting an expanded or initially collapsed section; expand it externally.                                                                 | Mount and expansion do not steal outside focus.                                                                                                                                                                                                                                                                   | R7; AR-28                           |
| ST-23 | Focus a body input and rerender an unchanged expanded section; separately focus its header and collapse through it.                                                        | Unrelated rerender keeps input focus; header-initiated collapse keeps header focus without moving it elsewhere.                                                                                                                                                                                                   | R7; AR-28                           |
| ST-24 | Pass `<img src=x onerror=alert(1)>` as a plain string independently in title, actions and body.                                                                            | Literal text is present; no injected img/script element exists and no HTML execution path is created.                                                                                                                                                                                                             | R12; AR-22                          |
| ST-25 | Compile public props with all four sizes, levels 2–6, rich title, div ref/events; compile invalid size, heading 1, appearance and raw HTML with expected-error assertions. | Valid usage type-checks; invalid usage remains rejected; rich title does not conflict with native string title.                                                                                                                                                                                                   | R5, R8–R10; 03-01 Public contract   |
| ST-26 | Import package runtime namespace and public props type.                                                                                                                    | Existing exact sorted runtime list adds only `CollapsibleSection`; `CollapsibleSectionProps` compiles from the root; private internals do not appear.                                                                                                                                                             | R10; AR-20                          |

Specification expectations never assert an exact Fluent animation duration or private class
name. Use `waitFor` for exit removal. Do not make the implementation instant or retain content
to satisfy a synchronous assertion. If a browser API is absent in jsdom and prevents the real
primitive from running, report the concrete blocker instead of adding a harness or bypassing
the primitive without approval.

## Test Categories

All paths below are relative to `packages/react-components/`.

| Test file                                              | Cases / purpose                                                                                     |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `test/collapsible-section.spec.test.tsx`               | ST-1–ST-13: state, actions and lifecycle                                                            |
| `test/collapsible-section-accessibility.spec.test.tsx` | ST-14–ST-24: semantics, association, native props, focus and markup safety                          |
| `test/package-exports.spec.test.ts`                    | ST-25–ST-26: runtime/type pins, using the existing pattern and `@ts-expect-error` for invalid usage |
| `test/collapsible-section.impl.test.tsx`               | Structure, class merging and public-primitive wiring listed below                                   |

### Implementation Tests

- Card treatment is fixed filled/small/off independently of header size and native root click
  handlers; no extra root tab stop or focus group is added by the wrapper.
- One Accordion item owns each instance; `collapsible` is enabled, with controlled openItems
  mapped from effective state. No deprecated navigation or duplicate toggle handler.
- Actions are outside the heading/button and body host persists after panel exit.
- All sizes map to the header, all heading levels map without unsafe casts; defaults are resolved
  in the hook rather than repeated in render/styles.
- Caller class merges with own classes; style pass-through is preserved. Guarded title-weight
  selector uses tokens. jsdom class/structure assertions are not claimed as visual evidence.
- Focus repair does not run on component unmount or target a detached disclosure. Refs/handlers
  are cleaned up and caller root focus callbacks are not overwritten.

### Integration

ST-6, ST-10, ST-12–ST-13 and ST-19–ST-23 exercise real parent state, actions, local body state,
nested primitives and external collapse. Use real objects/components, no mock Accordion/Card.
DescriptionList composition is demonstrated in Storybook and docs, not a new application fixture.

### Browser and E2E

No new automated browser test is authorized (AR-18). Manual Storybook checks are required because
jsdom does not synthesize native keyboard clicks, layout, CSS motion or browser inert focus.
`fireEvent.keyDown` alone is not proof that a native button toggles on Enter/Space.

| Manual check                                                                | Expected result                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tab/Shift+Tab, Enter and Space                                              | Natural header → visible actions → body tab order; native activation works; no extra Card trap.                                                                                                                                                                                                                                    |
| External collapse with focused body/action                                  | Focus returns locally; repeat with outside focus to confirm no stealing.                                                                                                                                                                                                                                                           |
| Collapse/expand with ordinary motion, then `prefers-reduced-motion: reduce` | Ordinary mode retains Fluent chevron/panel motion. Reduced mode suppresses the default chevron SVG transition while preserving its final rotation; the panel follows Fluent's reduced-motion behavior. Check computed chevron transition and visible panel behavior, not just body removal. Caller content SVGs remain unaffected. |
| Narrow container, long/unbroken title, 200% zoom                            | Title wraps and actions remain reachable without clipping controls or focus ring.                                                                                                                                                                                                                                                  |
| Header sizes and heading levels                                             | All four sizes render; visual size does not silently change heading level.                                                                                                                                                                                                                                                         |
| Light/dark theme, RTL and forced colors                                     | Tokens and Fluent states remain legible and logical; no literal palette dependency.                                                                                                                                                                                                                                                |
| Storybook a11y panel and heading navigation                                 | No new violations; clear disclosure names, heading hierarchy, action names and body associations.                                                                                                                                                                                                                                  |
| Nested sections and stateful body                                           | Correct independent toggles and visible reset on reopen.                                                                                                                                                                                                                                                                           |

Record actual observations during execution. A build passing does not mean these checks ran.
If manual browser access is unavailable, report that limitation and leave its task incomplete;
do not claim the feature is fully verified.

## Test Data and Mocks

Use small local fixtures: text title/body, one input, one Edit button, an outside button and two
nested sections. Use `vi.fn` only for callbacks/mount tracking. Use the existing test setup and
FluentProvider with webLightTheme. Do not add network/filesystem fixtures, synthetic app data,
global motion mocks or a dependency solely for user interaction.

## Verification Commands

Commands are detected from root `package.json:23-31` and confirmed in AR-19. Node 22+ and the
pinned pnpm must be on PATH. Use targeted checks while iterating:

```bash
pnpm --filter @blendsdk/fluentui-react-components test -- collapsible-section
pnpm --filter @blendsdk/fluentui-react-components test -- package-exports.spec.test.ts
pnpm --filter @blendsdk/fluentui-react-components type-check
```

Before feature completion, format intended changes, then run:

```bash
pnpm verify
pnpm storybook:build
```

The root verify includes formatting, skills, type checking, package build and tests. Existing
browser/performance suites remain unchanged and still run under their established CI jobs.
Independent reviewer/auditor phase checks follow `codeops/codeops.json` via exec-plan.

## Verification Checklist

- Concrete ST cases trace to the approved requirements/specification.
- Spec authoring and expected red precede any implementation source.
- Green preserves oracle expectations and all previous export assertions.
- Implementation, type, integration and security assertions pass.
- Manual review evidence is recorded honestly; remaining limitations block its task.
- No unrelated app/repository work, new dependencies, public internals or planning IDs in source.
