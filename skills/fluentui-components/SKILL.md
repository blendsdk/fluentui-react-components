---
name: fluentui-components
description: Create, extend, or review custom React components in this repository following the house Fluent UI v9 component pattern — a typed props contract, a state hook, a render function, Griffel styles with design tokens, parent/child contexts, accessibility, spec and impl tests, and Storybook stories. Use when adding a component, wrapping a Fluent UI primitive, changing an existing component, or auditing one against the pattern.
---

# Fluent UI v9 component authoring

This repository builds custom components on top of Fluent UI v9, in Fluent
UI's own component pattern. This skill is the house pattern: which files a
component has, what belongs in each, how it is styled, tested and documented,
and when it counts as done.

## When this skill applies

Use it for work inside `packages/react-components/src/components/`:

- creating a component, or a container/child pair,
- extending an existing component's props, behavior or styles,
- reviewing a component before it is considered finished.

Do **not** use it for:

- consuming these components inside an application — the global `fluentui`
  skill documents Fluent UI component APIs and props, and `fluentui-design`
  covers page and application composition,
- repository chores such as CI, release or dependency work.

## Intake — settle the contract before writing code

Never invent a prop, a default, or behavior. Before creating a component,
establish these points from the request, the repository, or by asking the user:

| Question                                                  | Why it matters                                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| What is the component's job, in one sentence?             | Drives the name and the public surface                                                   |
| Which Fluent UI primitives does it compose?               | Never re-implement what Fluent UI ships; check the `fluentui` skill for their real props |
| Which props, types and defaults?                          | The props type is the contract every other file follows                                  |
| Does it need internal state, or is it presentation only?  | Presentation only unless the application genuinely cannot own the state                  |
| Controlled, uncontrolled, or both?                        | Adds the `open`/`onOpenChange` style prop pairing                                        |
| Any parent/child relationship (container ↔ item)?         | Decides whether a context file exists                                                    |
| Which user-facing texts?                                  | Every string is a prop; the package ships no string resource files                       |
| How is it reached by keyboard and read by screen readers? | Decides elements, roles, and the accessibility tests                                     |
| Which variants must the story show?                       | The story is part of done                                                                |

The answers become JSDoc on the props — that type is where the contract lives.

## The house pattern at a glance

Every component is a folder, `src/components/<Name>/`, with this anatomy:

| File                        | Responsibility                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `<Name>.tsx`                | `React.forwardRef` shell only: call the state hook, return the render function, set `displayName`; carries the `@example` JSDoc |
| `<Name>.types.ts`           | The props contract: `Omit<ComponentPropsWithoutRef<'element'>, …> & { … }`, every prop documented                               |
| `use<Name>.ts`              | Pure state hook: defaulting, controlled/uncontrolled, context reads, style classes; exports `<Name>State`                       |
| `render<Name>.tsx`          | Pure render from state: wraps Fluent UI primitives, merges classes, forwards refs                                               |
| `use<Name>Styles.styles.ts` | Griffel `makeStyles` + `use<Name>Styles(…)`; exports `<Name>Classes`; tokens only                                               |
| `<Name>Context.ts`          | Optional parent↔child contract for container/item pairs                                                                         |
| `index.ts`                  | Component barrel: the component and its props type                                                                              |

Read `references/component-anatomy.md` before writing the files — it explains
each one with annotated skeletons, and points at the living example in the
repository.

## Workflow

Follow the steps in order. The specification tests come first: they encode the
contract and stay fixed while the implementation is written.

1. **Plan slots and states.** Decide the elements the component renders, the
   props that reach them, which props the component owns, and which pass
   through. Note every non-obvious decision for the JSDoc.
2. **Write the specification tests** (`test/<kebab-name>.spec.test.tsx`) from
   the contract alone: rendering, accessible names and roles, activation and
   disabled behavior, pass-through props, rich content. Run them against the
   not-yet-existing component and confirm they fail for the right reason.
3. **Write the props type** from `templates/Component.types.ts`. Base it on the
   element the root renders; `Omit` the props the component owns. Document
   every prop: meaning, default, precedence, accessibility effect.
4. **Write the styles** from `templates/useComponentStyles.styles.ts`. Use
   `makeStyles` with `tokens` at module scope; compose variants in the
   `use<Name>Styles` hook. Read `references/styling.md`.
5. **Write the state hook** from `templates/useComponent.ts`. Resolve defaults,
   read contexts, compute classes. No JSX, no effects unless a real
   synchronization need exists. Read `references/state-and-render.md`.
6. **Write the render function** from `templates/renderComponent.tsx`. Pure
   mapping from state to elements; `mergeClasses` for every class the caller
   can also set.
7. **Write the component shell** from `templates/Component.tsx` and create the
   folder `index.ts` from `templates/index.ts`.
8. **Add the context file** from `templates/ComponentContext.ts` only for
   container/item pairs, and export the component from `src/index.ts`.
9. **Make the specification tests green.** Adjust only the implementation, never
   the tests — a failing specification test means the implementation is wrong.
10. **Write the implementation tests** (`test/<kebab-name>.impl.test.tsx`) for
    internals: context wiring, class composition, element structure.
11. **Write the story** from `templates/Component.stories.tsx` into
    `src/components/<Name>/stories/` — one story file per component, showing
    every documented variant.
12. **Document** the component: the README table row plus its props table,
    composition notes and localization notes where they apply. Read
    `references/documentation.md`.
13. **Verify**: `pnpm format` then `pnpm verify` (format check, skill check,
    type-check, build, tests) and `pnpm storybook:build`.

## Hard rules

1. **Compose, never re-implement.** Wrap Fluent UI primitives (`Button`,
   `Popover`, `Field`, …) or existing components; check their real props in the
   `fluentui` skill instead of guessing.
2. **Presentation only.** No data fetching, no application state, no business
   rules. The application owns the data and the decisions.
3. **Tokens, never literals.** Colors, spacing, radii and shadows come from
   `tokens`. A literal is allowed only where no token exists, and then the
   comment says why.
4. **Hooks and render functions stay pure.** The state hook does not render;
   the render function does not call hooks or keep state.
5. **Native props pass through.** Extend the element's props with
   `Omit<ComponentPropsWithoutRef<'element'>, …>` and forward the rest to the
   root element; never hide a native prop for convenience.
6. **Anything interactive is accessible by construction.** Semantic element
   first, ARIA only where no element exists; accessible names, keyboard
   behavior and disabled semantics are part of the work, not a follow-up.
7. **Refs are forwarded.** `React.forwardRef` on the component; the ref
   travels through the state to the element the caller expects.
8. **Class names merge, never overwrite.** `mergeClasses(ownClass,
callerClassName)` so applications can adjust without losing the pattern.
9. **No `any`, no unsafe casts.** Model the states and variants with unions and
   type guards.
10. **Document as you go.** Every public symbol and every non-trivial internal
    decision gets a documentation comment in teaching tone; no references to
    plans, requirements or task identifiers anywhere in code.
11. **Package surface is intentional.** Components and their props types are
    exported from the package root; hooks, contexts, state types, render
    functions and classes stay internal unless the intake explicitly said
    otherwise.
12. **Keep it small.** Do not add props, variants, abstractions or dependencies
    the contract does not require; the simplest thing that fulfils the
    contract wins.

## Definition of done

- [ ] `src/components/<Name>/` has the seven files the pattern requires (context only when needed).
- [ ] Every prop, state type, class type and exported function is documented; the component carries an `@example`.
- [ ] The component is exported from the folder barrel and `src/index.ts`; internals are not.
- [ ] `test/<kebab-name>.spec.test.tsx` covers the observable contract; it passes unchanged since it was written.
- [ ] `test/<kebab-name>.impl.test.tsx` covers the internals that the spec tests cannot see.
- [ ] `test/package-exports.spec.test.ts` lists the new export.
- [ ] A story file exists and shows every documented variant; `pnpm storybook:build` succeeds.
- [ ] The package README describes the component, its props and its composition notes.
- [ ] `pnpm verify` passes (format, skill check, type-check, build, tests).

## References

| Read                                                               | When                                                                                         |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [references/component-anatomy.md](references/component-anatomy.md) | Before creating the files — full anatomy with annotated skeletons                            |
| [references/state-and-render.md](references/state-and-render.md)   | When writing the hook and the render function, or adding state, contexts or controlled props |
| [references/styling.md](references/styling.md)                     | When writing styles: tokens, variants, specificity, container/child layout, theming          |
| [references/accessibility.md](references/accessibility.md)         | For every component with interaction, labels or structure                                    |
| [references/testing.md](references/testing.md)                     | Before writing spec and impl tests                                                           |
| [references/storybook.md](references/storybook.md)                 | Before writing the story                                                                     |
| [references/documentation.md](references/documentation.md)         | Before writing JSDoc and README content                                                      |

## Templates

`templates/` holds one file per artifact the workflow produces. Copy the file,
then replace the placeholders:

| Placeholder         | Meaning                                                 | Example      |
| ------------------- | ------------------------------------------------------- | ------------ |
| `<Name>`            | Component name, PascalCase                              | `StatusBar`  |
| `<kebab-case-name>` | Component name for file names                           | `status-bar` |
| `<Group>`           | Functional Storybook group from the Storybook reference | `Layout`     |

Delete template comments that do not apply — they are instructions, not
documentation. The templates are excluded from the repository's formatting
check because they are not valid TypeScript until the placeholders are
replaced.

| Template                                                                         | Becomes                                                                 |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [templates/Component.tsx](templates/Component.tsx)                               | `src/components/<Name>/<Name>.tsx`                                      |
| [templates/Component.types.ts](templates/Component.types.ts)                     | `src/components/<Name>/<Name>.types.ts`                                 |
| [templates/useComponent.ts](templates/useComponent.ts)                           | `src/components/<Name>/use<Name>.ts`                                    |
| [templates/renderComponent.tsx](templates/renderComponent.tsx)                   | `src/components/<Name>/render<Name>.tsx`                                |
| [templates/useComponentStyles.styles.ts](templates/useComponentStyles.styles.ts) | `src/components/<Name>/use<Name>Styles.styles.ts`                       |
| [templates/ComponentContext.ts](templates/ComponentContext.ts)                   | `src/components/<Name>/<Name>Context.ts` (containers and children only) |
| [templates/index.ts](templates/index.ts)                                         | `src/components/<Name>/index.ts`                                        |
| [templates/Component.stories.tsx](templates/Component.stories.tsx)               | `src/components/<Name>/stories/<Name>.stories.tsx`                      |
| [templates/component.spec.test.tsx](templates/component.spec.test.tsx)           | `test/<kebab-case-name>.spec.test.tsx`                                  |
| [templates/component.impl.test.tsx](templates/component.impl.test.tsx)           | `test/<kebab-case-name>.impl.test.tsx`                                  |

## Review mode

Reviewing a component means checking it against the same list: the anatomy
(files present, responsibilities respected), the hard rules above, and the
definition of done. Report findings with file and line, and propose the
smallest change that fixes each one. Two checks catch most defects:

- **Leak check** — does `src/index.ts` export anything beyond components and
  their props types? Internals must not leak.
- **Consistency check** — does the component behave like the existing ones
  (naming, prop shapes, disabled semantics, class merging, doc depth)? Read the
  living example before judging.
