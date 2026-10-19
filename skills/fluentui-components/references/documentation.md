# Documentation

Components in this repository are documented for the next developer at the
moment of reading, in a calm teaching tone. Documentation is part of the
contract: the props JSDoc is what Storybook's autodocs renders, and the README
is what a consumer reads before installing.

## Where each thing is documented

| Place                       | Content                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `<Name>.tsx` JSDoc          | What the component is, when to use it, the `@example` block                                             |
| `<Name>.types.ts`           | Every prop: meaning, default, precedence, accessibility effect                                          |
| `use<Name>.ts`              | The state type's fields (what the render function receives) and the non-obvious parts of the resolution |
| `render<Name>.tsx`          | Element choice and Fluent UI props with surprising behavior                                             |
| `use<Name>Styles.styles.ts` | Unusual selectors, token choices, why a literal is a literal                                            |
| `<Name>Context.ts`          | The container/child contract and the standalone fallback                                                |
| Component folder `index.ts` | Nothing — barrels stay bare                                                                             |
| Package README              | Purpose, props table, composition patterns, localization                                                |
| `test/*.spec.test.tsx`      | The contract, expressed as tests; comments only where the _why_ is not obvious                          |

Do not repeat the same sentence in several places: state a fact once, in the
place that owns it, and link or refer to it from the others.

## Writing JSDoc

- One short paragraph first: what it is and what it renders. A second
  paragraph only when there is a real caveat (when not to use it, what it does
  not own).
- Document the _why_ of non-obvious choices, not the what of obvious code.
  `// The wrapper is a div because dl allows grouping elements` earns its
  place; `// set the label` does not.
- Name invariants and edge cases: which prop wins when two are set, which
  layout applies outside a container, what happens to children that are not
  items.
- Public components carry an `@example` in a fenced `tsx` block, using the real
  prop names.
- Never mention plans, requirements, task identifiers or issue numbers. Durable
  rationale is restated in plain language instead.

## The README

The package README has one section per component plus shared sections:

1. **Purpose** — one sentence, and the "presentation only, the application owns
   the data" principle where it applies.
2. **Install and mount** — peer dependencies and the `FluentProvider` wrapper.
3. **Component section** — a one-paragraph description, the props table, and
   the composition patterns.
4. **Development** — commands and where tests/stories live.

The props table lists every prop, its type, its default, and one sentence:

| Prop     | Type                     | Default     | Description                                                        |
| -------- | ------------------------ | ----------- | ------------------------------------------------------------------ |
| `layout` | `'stacked' \| 'columns'` | `'stacked'` | Arrangement of the pairs; provided to the items through a context. |

Rows that document pass-through props summarize the native type
(`ComponentPropsWithoutRef<'dl'>`) and refer to the DOM documentation rather
than copying it.

Composition patterns are short, concrete bullets or snippets: how the
container/child pair is meant to be used, what the application owns, and what
the component deliberately does not do (placeholders, data fetching, sorting).

Localization: state which strings are props and which have English defaults. If
the component ships no strings, say so — that is a feature worth documenting.

## Review checklist

- [ ] Every public symbol has a documentation comment; non-trivial internals do
      too.
- [ ] The component has `@example`; prop docs state defaults and precedence.
- [ ] README: new component section with props table and composition notes.
- [ ] No plan, requirement or task references anywhere.
- [ ] Comments explain decisions, not code.
