# ConfirmDialog: confirm-dialog

> **Document**: 03-01-confirm-dialog.md
> **Parent**: [Index](00-index.md)

## Overview

The controlled confirmation prompt specified by RD-01: a strict alert dialog that states a
question, renders a fixed action set, and reports the chosen outcome through `onResolve`. This
document owns the implementable mechanics — types, internal interfaces, the danger styling
recipe, the focus machinery and the action normalization — while all behavior and acceptance
criteria are owned by [RD-01](../../requirements/RD-01-confirm-dialog-component.md).

## Architecture

### Current Architecture

No confirmation component exists. The closest implementation is `ErrorDialog` (see
`02-current-state.md`), which establishes the anatomy this component mirrors: `forwardRef` shell,
discriminated props union normalized once in the state hook, pure render from a documented state
object, static Griffel classes, and `DialogSurface` receiving the native props spread plus the
forwarded ref.

### Proposed Changes

New folder `src/components/ConfirmDialog/` per the RD-01 file table:

| File                                             | Contents                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `ConfirmDialog.types.ts`                         | Public prop, action and string contracts; internal pair/actions interfaces      |
| `useConfirmDialogStyles.styles.ts`               | `makeStyles` classes (surface, message, danger action) + `ConfirmDialogClasses` |
| `useConfirmDialog.ts`                            | Normalization, label resolution, ids, focus effects, outcome bridge, state type |
| `renderConfirmDialog.tsx`                        | Pure render of the alert dialog from the state                                  |
| `ConfirmDialog.tsx`                              | `forwardRef` shell; the generic-preserving export assertion (AR #5)             |
| `ConfirmDialog.stories.tsx`                      | One story per documented variant + the manual review checklist                  |
| `index.ts`                                       | Folder barrel: `ConfirmDialog` + public types                                   |
| `src/index.ts` (modified)                        | Package exports (AR #4)                                                         |
| `packages/react-components/README.md` (modified) | Component section per RD-01 AR #24                                              |

## Implementation Details

### Public API

The type declarations are exactly the RD-01 §Public API block: `ConfirmIntent`, `ConfirmAction`,
`ConfirmDialogStrings`, the internal `ConfirmDialogPairProps` / `ConfirmDialogActionsProps<V>`
interfaces, and the exported union `ConfirmDialogProps<V extends string = string>`. Exported from
the package root (AR #4): `ConfirmDialog`, `ConfirmIntent`, `ConfirmAction`,
`ConfirmDialogStrings`, `ConfirmDialogProps`; the two sub-interfaces and every other internal
symbol stay unexported (house rule, leak check in review).

The component's callable type is a **two-overload object assertion** (AR #5) so literal inference
survives `forwardRef` for inline callbacks:

```tsx
function ConfirmDialogInner<V extends string>(
  props: ConfirmDialogProps<V>,
  ref: ForwardedRef<HTMLDivElement>
): ReactElement {
  const state = useConfirmDialog(props, ref);
  return renderConfirmDialog(state);
}

const ForwardedConfirmDialog = React.forwardRef(ConfirmDialogInner);
ForwardedConfirmDialog.displayName = 'ConfirmDialog';

export const ConfirmDialog = ForwardedConfirmDialog as {
  (props: ConfirmDialogPairProps & RefAttributes<HTMLDivElement>): ReactElement;
  <V extends string>(
    props: ConfirmDialogActionsProps<V> & RefAttributes<HTMLDivElement>
  ): ReactElement;
};
```

The single assertion is compile-time only, preserves the generic exactly, carries a justification
comment in the component file, and is revisited if a cast-free pattern becomes idiomatic — the
recorded exception route of requirements AR #20.

### Interfaces

State and helpers the hook owns (exported from `useConfirmDialog.ts` for the render function,
never from the package):

```ts
/** One rendered action, fully resolved. */
export type ConfirmDialogActionDescriptor = {
  /** Stable React key: `pair-confirm`/`pair-decline`, or `action-<index>`. */
  key: string;
  /** Outcome reported on activation: a boolean for the pair, the value for custom actions. */
  outcome: boolean | string;
  /** Resolved visible label (fallbacks applied). */
  label: string;
  /** Resolved Button appearance. */
  appearance: 'primary' | 'secondary';
  /** Whether the danger recipe applies to this action. */
  danger: boolean;
  /** Decorative glyph rendered inside the button; already wrapped `aria-hidden`. */
  icon?: ReactNode;
};

/**
 * The activation bridge from the render function back to the caller's callback.
 *
 * Method syntax is deliberate: it relates both caller callback shapes —
 * `(confirmed: boolean) => void` and `(value: V) => void` — to the union parameter without a
 * cast, which also carries the runtime-empty-actions fallback where an untyped consumer's
 * actions-typed callback receives a boolean (AR #9, plan AR #6).
 */
type ConfirmOutcomeReporter = {
  report(outcome: boolean | string): void;
};

/** State the render function consumes. */
export type ConfirmDialogState = {
  open: boolean;
  title: ReactNode;
  message: ReactNode | undefined;
  messageId: string;
  /** `aria-describedby` for the surface: caller value wins, else the message id, else absent. */
  describedBy: string | undefined;
  strings: ConfirmDialogStrings; // resolved: empty values fell back (RD-01 AC 8)
  actions: readonly ConfirmDialogActionDescriptor[];
  busy: boolean;
  /** Reports one activation; the bridge above. */
  onAction: (outcome: boolean | string) => void;
  surfaceProps: ComponentPropsWithoutRef<'div'>; // native props minus component-owned fields
  surfaceRef: Ref<HTMLDivElement>; // merged internal + forwarded ref (AR #7)
  classes: ConfirmDialogClasses;
};
```

Normalization (`normalizeProps`) discriminates once:

- **Pair variant** (`actions === undefined`): descriptors are decline then confirm in DOM order
  (RD-01 AC 2); outcomes `false` / `true`; decline `appearance: 'secondary'`, confirm
  `appearance: 'primary'`; the dialog `intent` applies `danger` to the confirm descriptor.
- **Actions variant**: descriptors map the array in order; `appearance` defaults
  `'secondary'`; `danger` comes from the per-action `intent`; labels resolve with the blank-value
  fallback (below).
- **Runtime-empty actions** (untyped consumers only, AR #9): `actions.length === 0` falls back to
  the pair descriptors and pair outcomes; no empty-state error, no zero-action dialog.

The outcome bridge is a single object: `const reporter: ConfirmOutcomeReporter = { report:
props.onResolve };` — union-props assignment compiles under the bivariant method slot
(compile-verified in planning, AR #6); the state exposes `onAction: reporter.report`.

### Danger styling

One class, applied to the flagged button only (RD-01 §Danger styling; requirements AR #4/#5):

```ts
dangerAction: {
  ':enabled:not([aria-disabled="true"])': {
    backgroundColor: tokens.colorStatusDangerBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  ':enabled:not([aria-disabled="true"]):hover': {
    backgroundColor: tokens.colorStatusDangerBackground3Hover,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  ':enabled:not([aria-disabled="true"]):hover:active': {
    backgroundColor: tokens.colorStatusDangerBackground3Pressed,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  ':enabled:not([aria-disabled="true"]):active:focus-visible': {
    backgroundColor: tokens.colorStatusDangerBackground3Pressed,
    color: tokens.colorNeutralForegroundOnBrand,
  },
},
```

The compound selectors raise specificity above Fluent Button's own state rules while the
`:enabled:not([aria-disabled="true"])` guard keeps disabled buttons on Fluent's disabled styling.
A comment in the file states what the override outweighs (house styling rules). The class is
merged onto the button with `mergeClasses`; the surface, title and message classes never vary by
intent (RD-01 AC 6). Forced colors: no `forced-color-adjust`; colors stay token-driven (story
checklist item).

Other classes: `surface` (a bounded prompt width, e.g. `maxWidth: '480px'` — the focused-prompt
reading of the `ErrorDialog` 700 px practice; cosmetic, zero semantic impact) and `message`
(`whiteSpace: 'pre-line'` — the RD-01 AR #11 mechanism). The full class set is
`ConfirmDialogClasses = { surface, message, dangerAction }`.

### Focus and accessibility machinery

Pinned by plan AR #7; the timing evidence is in `02-current-state.md` (v9 focuses via a passive
effect).

- **Capture and restore** — one `useLayoutEffect` keyed on `open`:

  ```ts
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  useLayoutEffect(() => {
    if (open && !wasOpenRef.current) {
      const active = document.activeElement;
      previouslyFocusedRef.current = active instanceof HTMLElement ? active : null;
    } else if (!open && wasOpenRef.current) {
      const previous = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      if (previous !== null && previous.isConnected) previous.focus();
    }
    wasOpenRef.current = open;
  }, [open]);
  ```

  Mount-with-`open` counts as the open transition; layouts run before v9's passive focus move, so
  the capture sees the invoking element (RD-01 AC 16, §Verification channels).

- **Busy rescue** — one `useEffect` keyed on `busy`; when `busy` is true it moves focus to the
  surface exactly when the active element is inside the surface (jsdom keeps the disabled
  button focused) or is `document.body` (real browsers move focus to the body when the focused
  control is disabled). The effect deps make unrelated re-renders no-ops; the mount-with-`busy`
  run is harmless (RD-01 AC 11; the RD's invariant "focus never falls to `<body>`").
- **Merged surface ref** — the hook keeps an internal `surfaceElementRef` and a
  `useCallback`-stable callback ref that assigns both the internal ref and the forwarded `ref`
  (both are stable, so the callback identity is stable).
- **`aria-describedby`** — `messageId` comes from `useId()`; `describedBy = callerDescribedBy ??
(message != null ? messageId : undefined)`; the render sets the attribute explicitly **after**
  the `surfaceProps` spread so a caller-provided value wins unchanged (RD-01 AC 10; `null` counts
  as absent).
- **Accessible name** — the required `title` renders through `DialogTitle`; v9 wires
  `aria-labelledby` automatically (requirements AR #14).
- **Rendered structure** — `<Dialog open modalType="alert">` → `<DialogSurface>` → `DialogTitle`
  (`title`) → `DialogContent` with the message element (`<div id={messageId} …>`) when present →
  `DialogActions` with the action buttons (`disabled={busy}`, `key`, `appearance`, `icon`,
  merged className, `onClick={() => state.onAction(action.outcome)}`). Icons are wrapped by the
  component in an `aria-hidden` element so any `ReactNode` glyph stays decorative (RD-01 AC 20;
  Fluent icons are already hidden, arbitrary nodes are not — verified in the installed package).

### Behaviour details

- **Label resolution** (RD-01 AC 8/17): `strings` resolves per key over the English defaults;
  a `confirm`/`decline` whose trimmed value is empty falls back to the default; a custom action
  with a blank `label` (empty or whitespace-only) falls back to its `value`. One shared
  trimmed-empty rule implements the RD's "a rendered action can never be unnamed" invariant.
- **Message rendering** (RD-01 AC 9): the message class carries `white-space: pre-line`; content
  is rendered as React children, never parsed as HTML.
- **Controlled closure** (RD-01 AC 5): activation calls `onResolve` once and nothing else — no
  state change, no dismissal; repeat activations report again.
- **Motion and portal**: v9 defaults; no animation code in the component.

## Code Examples

```tsx
// Pair mode with a danger confirm.
<ConfirmDialog
  open={pending}
  title="Delete this record?"
  message="This cannot be undone."
  intent="danger"
  onResolve={confirmed => {
    setPending(false);
    if (confirmed) deleteRecord();
  }}
/>
```

```tsx
// Custom set; outcome is 'cancel' | 'discard' | 'save'.
<ConfirmDialog
  open={pending}
  title="Save your changes?"
  actions={[
    { value: 'cancel', label: 'Cancel' },
    { value: 'discard', label: 'Discard', intent: 'danger' },
    { value: 'save', label: 'Save', appearance: 'primary' },
  ]}
  onResolve={outcome => {
    setPending(false);
    apply(outcome);
  }}
/>
```

## Error Handling

| Error Case                                             | Handling Strategy                                                          | AR Ref                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------- | --------------------------------- |
| Runtime-empty `actions` array (untyped consumer)       | Fall back to the default pair; pair outcomes (boolean)                     | requirements AR #9                |
| Blank custom action label (empty or whitespace-only)   | Fall back to the action's `value`; a button is never unnamed               | requirements AR #15 · RD-01 AC 17 |
| Empty-string `strings.confirm` / `strings.decline`     | Fall back to the English default                                           | requirements AR #15 · RD-01 AC 8  |
| Activation while `busy`                                | Buttons are disabled; no `onResolve` call                                  | RD-01 AC 11                       |
| Focus lost to `<body>` when `busy` disables the button | Busy rescue moves focus to the surface (both jsdom and browser conditions) | plan AR #7 · RD-01 AC 11          |
| Invoking element removed before close                  | `isConnected` check skips restoration; nothing throws                      | RD-01 AC 16                       |
| Caller-provided `aria-describedby`                     | Caller value is forwarded unchanged; the component never overrides it      | RD-01 AC 10                       |

> **Traceability:** Every mechanism above references the register entry that resolved it.
> Behavioral requirements and acceptance criteria are owned by RD-01.

## Testing Requirements

- **Spec tests** (`test/confirm-dialog.spec.test.tsx`): every jsdom-observable RD-01 acceptance
  criterion via the ST cases in `07-testing-strategy.md` (ST-1…ST-24), including the compile-time
  pins (type-check gate) and the markup-inertness security cases.
- **Implementation tests** (`test/confirm-dialog.impl.test.tsx`): the danger class rules and
  tokens in the emitted stylesheet, label/action fallback internals, id wiring, the busy and
  restore effects' precise conditions, the merged ref, class merging.
- **Story set** (`ConfirmDialog.stories.tsx`): the variants of RD-01 AR #21 plus the manual
  review checklist (exact first-action focus, Tab trap cycle, close-time restore, live
  Escape/backdrop behavior, forced-colors pass) recorded as story documentation.
- **README section**: description, props table, composition notes (safe-action-first ordering,
  host guidance for repeat activations), localization notes, and the "when not to use" boundary
  statement (RD-01 AR #24).
