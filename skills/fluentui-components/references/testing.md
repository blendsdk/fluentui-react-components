# Testing

Tests live in `test/` beside the sources, split by what they are allowed to
know:

| File                           | Knows                                                              | Written                           | Meaning when it fails                                           |
| ------------------------------ | ------------------------------------------------------------------ | --------------------------------- | --------------------------------------------------------------- |
| `<kebab-name>.spec.test.tsx`   | The contract: props, rendered semantics, accessibility, activation | First, from the contract          | The implementation is wrong. Never change the test to fix it.   |
| `<kebab-name>.impl.test.tsx`   | Internals: context wiring, class composition, element structure    | After the implementation is green | An internal changed; align the test with the intended internals |
| `package-exports.spec.test.ts` | The package's public surface                                       | With every new export             | The public API changed — intentional or a leak                  |

This mirrors the repository-wide rule: specification tests are an immutable
oracle, implementation tests track internals.

## Setup

`test/setup.ts` registers the jest-dom matchers and runs `cleanup()` after each
test. Tests import `describe`, `expect`, `it` from `vitest` explicitly, so the
cleanup call is what unmounts components between tests — do not remove it.

Every test that renders a component wraps it in `FluentProvider` with
`webLightTheme`, mirroring how applications mount the components. A helper at
the top of the file keeps that repetition out of the tests:

```tsx
function renderList(list: ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{list}</FluentProvider>);
}
```

## Writing specification tests

Write them from the contract, before the implementation, one test per promise
the contract makes:

- **Rendering**: every documented part appears (labels, values, icons,
  placeholders, empty states the component owns).
- **Semantics**: query by role and accessible name, as a screen reader user
  would. Roles go through `screen.getByRole('term')`,
  `getByRole('button', { name: 'Mail' })`, … — if a role query is impossible,
  that is a finding about the component, not a reason to switch to
  `querySelector`.
- **Activation**: `userEvent`/`fireEvent` clicks and keys call the callbacks
  the contract documents.
- **Disabled modes**: `disabled` renders a disabled control; `disabledFocusable`
  renders `aria-disabled` and stays focusable.
- **Pass-through**: a native prop (`aria-label`, `className`, `data-*`)
  reaches the element the contract says it reaches.
- **Rich content**: children and slots accept elements, not just strings.

Assert what a consumer observes. Do not assert class names, internal state
names or component instance counts — those are implementation tests.

## Writing implementation tests

The spec tests cannot see everything. The implementation tests cover what is
deliberately internal:

- **Context wiring**: a child inside a container renders differently than a
  standalone child (compare the class names of both cases — jsdom has no layout
  engine, so class names stand in for the visual difference; say so in a
  comment).
- **Class composition**: the caller's `className` is merged, not replaced.
- **Structure**: the container does not insert wrapper elements between itself
  and its children (for example `dl.children` has one entry per pair).
- **Styles contract**: layout-independent facts that must hold for the
  component to be styled correctly.

## jsdom limits

- No layout: `getBoundingClientRect()` returns zeros, widths and heights are 0. Assert structure and classes, or mock the API the component reads.
- No real focus management for portaled surfaces (dialogs, popovers): cover the
  behavior in a story instead, and keep the unit test on the parts jsdom can
  see.
- No CSS: `getComputedStyle` returns the inline style only; class name
  comparisons are the honest stand-in.

## Naming and structure

- One describe block per component, test names that state the promise
  ("renders the label and the value of every pair").
- Keep the file's helper functions pure and at the top.
- When a behavior needs both a spec and an impl angle, write two tests — do not
  merge layers into one file.

## Export surface test

Every new component adds its runtime export to
`test/package-exports.spec.test.ts`, keeping the sorted list exact. Type-only
exports do not appear there; that is expected. The test is the guard against
accidentally publishing hooks, contexts or state types.

## Commands

```bash
pnpm --filter @blendsdk/fluentui-react-components test          # all tests, one pass
pnpm --filter @blendsdk/fluentui-react-components test:watch    # watch mode while developing
pnpm --filter @blendsdk/fluentui-react-components test:coverage # coverage report
```

## Review checklist

- [ ] Spec tests written from the contract, unchanged while implementing.
- [ ] Roles and accessible names queried the way a screen reader reads.
- [ ] Both disabled modes covered.
- [ ] Pass-through props covered.
- [ ] Impl tests cover context wiring, class merging and structure.
- [ ] `package-exports.spec.test.ts` updated.
- [ ] `pnpm test` passes with no skipped tests.
