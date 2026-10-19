# Accessibility

Accessibility is part of the component contract, not a later pass. Every
component is designed together with its keyboard path, its accessible names and
its announcements, and the specification tests cover them. The checklists below
apply to every component; the sections before them explain the two decisions
that come up again and again — element choice and disabled semantics.

## Elements first, ARIA second

Use the element that already carries the meaning; screen readers and browsers
implement its behavior for free:

| Meaning                    | Element                          | Example in this repository              |
| -------------------------- | -------------------------------- | --------------------------------------- |
| A term with its definition | `dl` / `dt` / `dd`               | `DescriptionList`                       |
| A list of things           | `ul` / `li`                      | launcher-style grids and lists          |
| Activating something       | `button`                         | everything clickable that is not a link |
| Navigating somewhere       | `a` with `href`                  | links inside values and content         |
| A status surface           | `role="status"` on a live region | notifications, loaders                  |

ARIA attributes are the fallback when no element expresses the semantics. Then:

- prefer `aria-disabled` over inventing a disabled button from a `div`;
- make the accessible name true — an icon-only control needs `aria-label` or a
  visually hidden label, a labeled control needs the label wired to it
  (`label` + `htmlFor`, or the label prop of a Fluent UI field);
- keep roles honest: do not put `role="button"` on something that is not
  operable by keyboard.

## Disabled semantics

Fluent UI (and this repository) distinguishes two disabled modes. Both must be
supported by any component that can be disabled:

| Mode                | Attribute              | Activation | Tab order | Look  |
| ------------------- | ---------------------- | ---------- | --------- | ----- |
| `disabled`          | native `disabled`      | none       | skipped   | muted |
| `disabledFocusable` | `aria-disabled="true"` | none       | reachable | muted |

Rules:

- `disabledFocusable` exists so a disabled control that matters for
  completeness (a required field's counterpart, a step in a wizard) stays
  reachable: a keyboard user can tab to it and hear _why_ it is disabled.
- A component that supports both forwards them to the Fluent UI primitive and
  documents the precedence Fluent UI applies when both are set.
- Style both modes: `:disabled` **and** `[aria-disabled="true"]` selectors.
- Never make something look disabled without being announced disabled, and
  never announce something disabled while still activating it.

## Keyboard model

- Tab reaches the component once; Tab moves on. Arrow keys are for composites
  (menus, tabs, grids) — copy the Fluent UI primitive's model when wrapping one
  instead of inventing your own.
- Enter and Space activate buttons. A `button` element already does this; a
  custom element must re-implement it exactly.
- Escape closes surfaces (popovers, dialogs) and returns focus to the trigger.
  When a component layers behaviors (clear the search field first, close the
  panel second), document the order.
- Focus is never lost: when a surface closes, focus returns to the element that
  opened it; when content unmounts, focus moves to the nearest sensible
  element, never to the document.

## Structure and announcements

- Wrap repeated things in their list element and give each item a real child
  element (the container examples wrap tiles in `li`), so assistive technology
  announces "list, 6 items".
- The accessible name of an item is its visible text when possible; only add
  `aria-label` when the visible text would be ambiguous out of context.
- Live regions (`role="status"`, `aria-live`) are for content that changes
  without user action. Keep them short; do not announce cosmetic changes.

## What the tests must cover

Specification tests (see `testing.md`) assert the observable accessibility
contract:

- the accessible name (query by role and name, the way a screen reader user
  would),
- roles and structure (a description list, a list with items),
- activation and both disabled modes,
- keyboard behavior when it is implemented by the component rather than a
  native element.

The Storybook a11y addon runs axe against every story; a new violation is a
defect in the component, not in the story.

## Review checklist

- [ ] Semantic element chosen first; ARIA only where none exists.
- [ ] Every interactive element has an accessible name.
- [ ] `disabled` and `disabledFocusable` both implemented and documented (when
      the component can be disabled).
- [ ] Keyboard path documented and covered by a test; Escape/Return behavior
      defined for surfaces.
- [ ] Focus visible via `:focus-visible`; focus returns to the trigger when a
      surface closes.
- [ ] Repeated items reach assistive technology as a list with the right count.
- [ ] No axe violations in the Storybook story; no `role` without behavior.
