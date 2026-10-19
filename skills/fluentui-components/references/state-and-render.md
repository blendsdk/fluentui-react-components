# State and render

The pattern splits a component in three: a **state hook** that turns props into
a resolved state, a **render function** that turns state into elements, and a
**shell** that connects them. The split keeps the two halves independently
readable: all decisions in one place, all markup in the other.

## Purity rules

**The state hook does not render.** No JSX, no class names as JSX, no
formatting for display. It resolves values.

**The render function does not decide.** No hooks, no state, no reading of
props that the state should have resolved. `renderX(state)` must be a pure
function of `state` — given the same state it returns the same elements, which
is what makes it trivially testable and reviewable.

**The shell does nothing else.** Exactly `state → render → return`.

A render function that needs a decision means the state is incomplete: move the
decision into the hook.

## Defaulting belongs to the hook

The hook destructures the props, applies every default, and returns explicit
values. Neither the render function nor the styles should repeat a default:

```ts
export function useExample(props: ExampleProps, ref: Ref<HTMLDivElement>): ExampleState {
  const { children, layout = 'stacked', ...rootProps } = props;

  const classes = useExampleStyles(layout);

  return { children, layout, rootProps, rootRef: ref, classes };
}
```

Keep `layout` in the state even when only the classes consume it: the state is
the resolved picture of the component, and context providers, tests and future
render changes read it from there.

## Pass-through props

Pattern: remove the props the component owns from the props object, keep the
rest together under `rootProps`, spread them onto the root element in the
render function.

```ts
const { children, label, ...rootProps } = props;
```

- `rootProps` is typed as `Omit<<Name>Props, 'label' | 'children'>` so the
  state type documents what is forwarded.
- In the render function, spread `rootProps` **before** the attributes the
  component owns, so a caller cannot accidentally break the component's own
  contract, and merge the class name instead of replacing it.

## Controlled and uncontrolled state

Only add internal state when the application must be able to observe or drive
it. The shape both Fluent UI and this repository use:

```ts
// props
/** Controlled value. Leave undefined for the uncontrolled default. */
open?: boolean;
/** Fired whenever the component asks to change the value. */
onOpenChange?: (event: …, data: { open: boolean }) => void;

// hook
const [openState, setOpenState] = useState(false);

const handleOpenChange = (event: …, data: { open: boolean }) => {
  setOpenState(data.open);
  onOpenChange?.(event, data);
};

const open = controlledOpen ?? openState;
```

Rules:

- The internal mirror is always updated, even when controlled, so the component
  can react to its own view of the state (for example to hide a tooltip).
- `onOpenChange` is always called, controlled or not.
- Document the pairing on the props; the README repeats it in the prop table.
- Components with no state do not fake one for symmetry.

## Context as a container/child contract

When a container decides something about its children (layout, density, size),
the container **provides** and the child **consumes**:

```tsx
// container render function
<ChildLayoutContext.Provider value={state.layout}>{state.children}</ChildLayoutContext.Provider>
```

```ts
// child hook
const layout = useContext(ChildLayoutContext);
const classes = useChildStyles(layout);
```

Rules:

- The context carries a decision, not data flowing both ways. If the child must
  tell the container something, make it a prop or a callback.
- Context providers render no element: putting one between a `dl` and its `div`
  children keeps the DOM valid.
- The child's standalone default is the fallback value of the context, so a
  lone child renders sensibly.
- The array-of-children case (mapping, wrapping each child) is a render
  concern; the context is for values. See the living container example for
  both.
- Do not export contexts from the package root; they are internal contracts
  between the components of this package.

## Refs

- The component shell takes the ref from `forwardRef` and passes it to the hook.
- The hook returns it as a named field (`rootRef`, `itemRef`, …), and the
  render function attaches it to the element the caller expects (usually the
  root).
- When a wrapper passes the ref to a Fluent UI component, hand the Fluent
  component the ref through its own ref-friendly prop, not through
  `rootProps` — `rootProps` never contains a ref.
- Memoized or virtual targets (for example a positioning anchor that must read
  a rect lazily) are created with `useMemo` in the hook and passed through the
  state; see the launcher-style components for the technique.

## Deriving values

- Compute derived values in the hook, not in the render function.
- Memoize only what is genuinely expensive or that must stay referentially
  stable (objects passed to Fluent UI props that compare by identity, virtual
  DOM targets). A `useMemo` around two string concatenations is noise; leave it
  out.
- Never store derived values in state; derive them on every render from props
  and state.

## Effects

Effects are the exception, not the pattern. Use one when the component must
synchronize with something outside React (a DOM API, an observer, a timer that
must pause). When you add one:

- Explain _why_ in a comment: what must stay in sync with what, and when the
  effect re-runs and cleans up.
- Prefer Fluent UI's own hooks (`useTimeout`, `useEventCallback`, …) when one
  exists.
- Never use an effect to compute render input; that belongs in the body of the
  hook.
