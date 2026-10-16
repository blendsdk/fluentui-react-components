# RD-01: ConfirmDialog Component

> **Document**: RD-01-confirm-dialog-component.md
> **Status**: Draft
> **Created**: 2026-10-16
> **Project**: fluentui-react-components
> **Depends On**: —
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

`ConfirmDialog` is the prompt a consuming application shows when a user action needs an explicit
decision before it runs: it states the question, presents a fixed set of actions, and reports the
chosen outcome back to the host — which owns both the visibility and the follow-up work.

The component rebuilds the functional requirements of the legacy `ConfirmDialog` from
CastingAppMT's `fui8` package (Fluent UI v8) as a native Fluent UI v9 component. The legacy
analysis covered all 25 call sites: a title plus a message, exactly two labelled actions, a
destructive variant, and a deliberately blocking presentation. This RD keeps those ideas and
rejects every v8 mechanism: the whole-dialog red palette swap becomes a targeted token recipe on
the one danger-flagged action, the `dangerouslySetInnerHTML` message becomes typed `ReactNode`
content, the `setTimeout`-based double-click guard becomes a real `busy` state, and the vestigial
props (`actions` slot, `justifyActions`, `children`) are replaced by a typed action model that
serves both the declarative component and the RD-02 provider.

The component is controlled, presentation-only, and v9-native: Fluent `Dialog` primitives provide
portal, theming, focus and motion; the component adds the decision semantics, the intent-driven
emphasis, the typed outcome and its accessibility wiring.

---

## Functional Requirements

### Must Have (M)

- [ ] A controlled `ConfirmDialog` component: visibility follows the `open` prop; every closure
      is an explicit action that reports the outcome via `onResolve`, never an internal state
      change and never an implicit dismissal (AR #7).
- [ ] Strict alert semantics: Escape and backdrop clicks cannot dismiss the dialog and there is
      no close affordance; every exit goes through a rendered action (AR #6).
- [ ] A default action pair rendered in DOM order decline → confirm: decline as
      `appearance="secondary"`, confirm as `appearance="primary"`; their labels come from
      `strings.confirm` / `strings.decline` (AR #7, AR #12).
- [ ] A required `title` rendered through `DialogTitle`: it is the dialog's accessible name; an
      optional `message` rendered in `DialogContent` (AR #10, AR #14).
- [ ] Content is never parsed as HTML: `title` and `message` are `ReactNode`; a plain-string
      message preserves `\n` as visible line breaks (AR #10, AR #11).
- [ ] An `intent` variant, `'confirmation'` (default) or `'danger'`, which changes only the
      emphasis of the affirmative action: the danger token recipe (base, hover and pressed
      backgrounds plus the on-brand white foreground) for `'danger'`; the dialog surface is
      identical in both variants (AR #4, AR #5).
- [ ] An optional `actions` array (custom action sets such as Yes/No/Cancel or
      Save/Discard/Cancel): a non-empty tuple of `ConfirmAction` records — `value`, `label`,
      optional `appearance`, `intent`, `icon`; it replaces the default pair, renders in array
      order, resolves the chosen `value`, and is mutually exclusive with the dialog-level
      `intent` (AR #8).
- [ ] The declared action order reaches the DOM unchanged; the first action receives initial
      focus (v9 behavior), and the ordering guidance — safe action first — is documented in the
      README composition notes (AR #13).
- [ ] Action icons are decorative: they render as part of the button content and never carry the
      accessible name (AR #14).
- [ ] A `busy` prop: while true, every action is disabled and cannot resolve anything; focus must
      never fall to `<body>` when the focused action becomes disabled (AR #13).
- [ ] Robust label handling: an empty-string `strings.confirm` / `strings.decline` value falls
      back to its English default, and a blank custom action `label` falls back to the action's
      `value` — a rendered action can never be unnamed (AR #15).
- [ ] Robust action handling: a runtime-empty `actions` array (possible only through untyped
      consumers) falls back to the default pair and reports pair outcomes (`onResolve` receives
      a boolean); an alert dialog is never rendered without an exit (AR #9).
- [ ] English default labels: `"Confirm"` and `"Cancel"`; `strings` overrides merge key by key
      (AR #12).
- [ ] Accessibility: the dialog is an `alertdialog` named by its title; when a message is present
      the dialog is described by it (`aria-describedby` wired by the component toward the message
      element); focus moves into the dialog and is trapped while open (v9 built-ins); on close the
      component restores focus to the invoking element best-effort — v9's built-in restore needs a
      `DialogTrigger`, which this controlled component does not render (AR #13, AR #14).
- [ ] Native props pass through to the dialog surface element — `className`/`style` merge (caller
      wins), `data-*` and `aria-*` pass through; a forwarded ref points at the surface element
      (AR #15).
- [ ] v9-only: the component imports from `@fluentui/react-components` and React only; no v8
      artifact, no fallback path, no new dependency (AR #1, AR #2).
- [ ] The component follows the repository's component pattern (types → hook → render → styles →
      story → README section), is exported from the package root, and ships doc comments for its
      public API (house standards).
- [ ] Specification and implementation tests, the updated package export-surface test, and a
      Storybook story enumerating its variants — default pair, danger pair, custom action set
      (per-action danger/primary/icon), busy, multi-line message, string overrides — with the
      focus/keyboard and forced-colors passes recorded as manual review checklist items (AR #21).
- [ ] README section with the props table, composition notes (the safe-action-first ordering rule
      and the host guidance for repeat activations), the localization notes, and a "when not to
      use" boundary statement pointing to `Dialog` + `DialogActions` composition for forms,
      multi-step flows and custom bodies (AR #24).

### Should Have

- None — the confirmed scope fits Must Have and Won't Have.

### Won't Have (Out of Scope)

- Escape/backdrop dismissal, a close button, or any implicit decline (AR #6).
- Uncontrolled visibility (`defaultOpen`) — the host owns `open` (AR #7).
- HTML rendering of content, in any form (AR #10).
- A ReactNode `actions` slot and per-action `onClick`/`className` — bespoke behavior means
  composing `Dialog` primitives (AR #8; boundary statement AR #24).
- Forms, validation, multi-step flows or arbitrary dialog bodies (AR #24).
- A dialog header glyph prop — named deferral (AR #23).
- A custom portal `mountNode` override and a module-level global dialog singleton (AR #16).
- v8 compatibility or a dual-implementation fallback branch (AR #1).
- Busy-hold-open flows — the dialog resolves immediately on activation (AR #22, RD-02).
- Whole-dialog theme swaps, always-mounted hidden dialogs and `setTimeout`-based interaction
  guards (legacy mechanics rejected; AR #2, AR #5).

---

## Technical Requirements

### Component anatomy (M)

Following the repository pattern under `packages/react-components/`:

| File                                                            | Role                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/components/ConfirmDialog/ConfirmDialog.tsx`                | `forwardRef` shell (ref targets the dialog surface element)        |
| `src/components/ConfirmDialog/ConfirmDialog.types.ts`           | Public prop, action and string contracts                           |
| `src/components/ConfirmDialog/useConfirmDialog.ts`              | State hook (variant resolution, id wiring, focus policy, defaults) |
| `src/components/ConfirmDialog/renderConfirmDialog.tsx`          | Pure render function                                               |
| `src/components/ConfirmDialog/useConfirmDialogStyles.styles.ts` | Griffel styles with Fluent tokens; exports the classes type        |
| `src/components/ConfirmDialog/ConfirmDialog.stories.tsx`        | Storybook stories (every documented variant)                       |
| `src/components/ConfirmDialog/index.ts`                         | Barrel                                                             |
| `src/index.ts`                                                  | Package barrel: component + public types                           |
| `packages/react-components/README.md`                           | Component section: description, props table, composition, boundary |
| `test/confirm-dialog.spec.test.tsx`                             | Contract tests derived from this RD                                |
| `test/confirm-dialog.impl.test.tsx`                             | Internals (classes, id wiring, focus moves, fallbacks)             |
| `test/package-exports.spec.test.ts`                             | Extended export-surface list                                       |

### Public API (M)

```ts
/** How severe the pending decision is; drives the affirmative action's emphasis. */
export type ConfirmIntent = 'confirmation' | 'danger';

/** One action of a custom action set. */
export interface ConfirmAction<V extends string = string> {
  /** Outcome reported to the host when this action is activated. */
  value: V;
  /** Visible action label; also the accessible name. A blank label falls back to `value`. */
  label: string;
  /** Visual emphasis of the button. Default: `'secondary'`. */
  appearance?: 'primary' | 'secondary';
  /** `'danger'` applies the danger token recipe to this action. Default: `'default'`. */
  intent?: 'default' | 'danger';
  /** Decorative glyph rendered inside the button; never the accessible name. */
  icon?: ReactNode;
}

/** The visible action labels; English defaults, per-key overrides. */
export interface ConfirmDialogStrings {
  confirm: string; // default: "Confirm"
  decline: string; // default: "Cancel"
}

interface ConfirmDialogBaseProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'title'
> {
  open: boolean;
  title: ReactNode;
  message?: ReactNode;
  strings?: Partial<ConfirmDialogStrings>;
  busy?: boolean;
}

interface ConfirmDialogPairProps extends ConfirmDialogBaseProps {
  intent?: ConfirmIntent;
  actions?: undefined;
  /** Called once per activation with the adopted outcome. */
  onResolve: (confirmed: boolean) => void;
}

interface ConfirmDialogActionsProps<V extends string> extends ConfirmDialogBaseProps {
  intent?: undefined;
  /** At least one action; replaces the default pair. */
  actions: readonly [ConfirmAction<V>, ...ConfirmAction<V>[]];
  /** Called once per activation with the chosen value. */
  onResolve: (value: V) => void;
}

export type ConfirmDialogProps<V extends string = string> =
  ConfirmDialogPairProps | ConfirmDialogActionsProps<V>;
```

- **Mutual exclusion:** the pair variant allows `intent` and forbids `actions`; the actions
  variant requires `actions` and forbids the dialog-level `intent` (per-action intent applies) —
  one source of truth for emphasis (AR #8).
- **Generic typing:** `ConfirmAction` values infer their literal union from the call site
  (`actions={[{ value: 'save' }, …]}` → `onResolve: (value: 'save' | 'discard' | 'cancel')`); the
  component declares the single generic `V extends string` and uses the canonical `forwardRef`
  generic-preserving assertion — a recorded exception to the no-unsafe-casts rule: compile-time
  only, preserving the generic exactly, documented in the component file with its justification,
  and revisited if a cast-free pattern becomes idiomatic (AR #20).
- **Native pass-through:** the base props are the surface element's props; they spread onto the
  surface. `className` and `style` merge (caller wins); a caller-provided `aria-describedby` /
  `aria-label` wins over the component's own wiring; `ref` forwards to the surface
  (`HTMLDivElement`) (AR #15).
- **Callbacks:** `onResolve` is invoked exactly once per activation — one user action on a
  rendered action element (a click, or Space/Enter on the focused button); repeat activations
  while the dialog stays open report again, so the host closes it (or sets `busy`) on the first
  report. The component itself never closes the dialog, executes the action, or performs side
  effects (AR #7).

> **Decision per AR #4 / AR #8:** two intents, plus a typed action array for N-way decisions.
> `question` is a wording choice, not a visual axis; the action model covers Yes/No/Cancel without
> new intents or slots.

### Danger styling (M)

`intent="danger"` (pair variant) or `intent="danger"` on an action applies one Griffel class to
that button only:

| State               | Token                                 |
| ------------------- | ------------------------------------- |
| Background          | `colorStatusDangerBackground3`        |
| Background, hover   | `colorStatusDangerBackground3Hover`   |
| Background, pressed | `colorStatusDangerBackground3Pressed` |
| Foreground          | `colorNeutralForegroundOnBrand`       |

> **2026-10-16 manual-pass amendment:** the foreground uses
> `colorNeutralForegroundOnBrand` (white in both themes). The previously pinned
> `colorStatusDangerForegroundInverted` resolves to a low-contrast red on the strong danger
> background in both themes — a direct user finding during the Storybook pass.

- The dialog surface, title and content classes are identical to the `confirmation` variant
  (AR #5).
- The override beats the Fluent `Button` styles through specificity: the guarded selector
  `:enabled:not([aria-disabled="true"])` for the base state plus its combinations for every
  interactive state — `:hover`, `:hover:active` and `:active:focus-visible` (the keyboard-pressed
  pair) — each applying the danger background tokens and the on-brand white foreground, with a comment
  explaining what it outweighs (house styling rules). Disabled buttons stay outside the guard and
  keep Fluent's disabled styling.
- In forced-colors mode the button stays usable and the override must not defeat Fluent's
  high-contrast handling (no `forced-color-adjust: none`; colors stay token-driven); the label
  carries the meaning there, because the user agent replaces authored colors at rest. Verified by
  the story's manual forced-colors checklist item.
- Icons render inside the button content and are decorative (`aria-hidden`), never the accessible
  name (AR #14).

### Focus and accessibility wiring (M)

- **Initial focus:** v9 `Dialog` focuses the first focusable element inside the surface
  (`react-dialog/lib/utils/useFocusFirstElement.js`); rendering actions in DOM order therefore
  focuses the first action — the documented ordering rule puts the safe action first (AR #13).
- **Accessible name:** `DialogTitle` id wiring is automatic in v9
  (`useDialogSurface.js:104` — `aria-labelledby`); the required `title` guarantees a name.
- **Accessible description:** the component generates an id (`useId`) for the message element and
  sets `aria-describedby` on the surface when `message` is present and the caller did not supply
  one (AR #14, AR #15).
- **Busy focus policy:** when `busy` flips to true while an action holds focus, a component effect
  moves focus to the dialog surface once — Fluent provides no utility for focus lost to the body
  (the modalizer ignores it); the effect fires only on the `false → true` transition and only when
  the focused element is one of the action buttons, so unrelated re-renders never steal focus
  (AR #13).
- **Trap and restore:** focus is trapped while open — v9 built-in, no custom focus-trap code.
  v9 restores focus only for `DialogTrigger`-opened dialogs; this component is trigger-less and
  restores best-effort itself: a layout effect captures the focused element on the `false → true`
  open transition and re-focuses it on close when it is still connected.
- **Verification channels:** jsdom has no layout, so tabster finds no focusable element and focus
  lands on the dialog surface there; the spec asserts focus containment, and the exact
  first-action focus, the trap cycle and the close-time restore are verified in the story's
  manual keyboard pass.
- **Dismissal:** no `onOpenChange` handler is passed; Escape therefore stays inert, and backdrop
  clicks are ignored under `modalType="alert"` (AR #6).

### Behaviour details (M)

- **Default labels:** `ConfirmDialogStrings` resolves per key over the English defaults; an empty
  string for a pair label falls back to the default, and a blank custom action `label` falls back
  to its `value` (AR #15).
- **Actions fallback:** `actions.length === 0` at runtime renders the default pair — the dialog
  behaves exactly like the pair variant and `onResolve` receives a boolean (AR #9).
- **Line breaks:** a plain-string `message` renders with `white-space: pre-line`; ReactNode
  content is untouched (AR #11).
- **Controlled closure:** each activation calls `onResolve` exactly once and does nothing else;
  the dialog remains open until the host sets `open={false}` — repeat activations while it stays
  open report again (close it or set `busy` on the first report) (AR #7).
- **Mounting and motion:** v9 defaults are kept (`unmountOnClose` true); entering/closing motion
  and portal mounting are v9 responsibilities; the component adds no animation code.

---

## Integration Points

### With RD-02 (ConfirmProvider + `useConfirm`)

- RD-02 renders this component and maps its request options onto the same props contract; the
  provider's pair mode uses the pair variant and resolves a boolean, the actions mode uses the
  actions variant and resolves the chosen value (RD-02).
- This RD does not know the provider; it stays host-agnostic and presentation-only.

### With the existing package

- The package barrel gains the component export and its public types; the inner files
  (state type, hook, render function, classes, defaults) stay internal (house rule).
- The Storybook story and README section are part of this RD's definition of done.

---

## Scope Decisions

| Decision                  | Options Considered                                      | Chosen                                            | Rationale                                                                                    | AR Ref         |
| ------------------------- | ------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------- |
| Platform                  | v9-only vs dual v8/v9                                   | v9-only, no fallback                              | "Everything v9 and v9 only"; a fallback is a second design system, not a fallback            | AR #1, AR #2   |
| Decision model            | Pair only vs typed action array vs ReactNode slot       | Pair + optional typed `actions` non-empty tuple   | Covers Yes/No/Cancel with typed promise outcomes on both layers                              | AR #8, AR #20  |
| Danger treatment          | Token recipe vs whole-theme swap vs Button danger color | Token recipe on the flagged action only           | Theme-safe in dark mode and custom themes; Button has no danger look in v9                   | AR #5          |
| Dismissal                 | Strict alert vs Escape/backdrop decline                 | Strict alert                                      | Parity with the legacy blocking behavior; a forced decision needs an explicit choice         | AR #6          |
| Visibility                | Controlled only vs controlled + uncontrolled            | Controlled only                                   | Host owns state and side effects; matches every legacy call site                             | AR #7          |
| Content model             | ReactNode, never HTML vs HTML strings                   | ReactNode, never HTML; `\n` preserved for strings | HTML path unused in the legacy data (0/55) and an XSS surface; multi-line evidence preserved | AR #10, AR #11 |
| Initial focus             | First action in DOM order vs per-intent switching       | First action; safe-action-first documented        | Matches Fluent 2 guidance; no unsafe variants; v9 built-in                                   | AR #13         |
| Accessibility description | Component-wired `aria-describedby` vs v9 defaults only  | Component wires it when a message exists          | v9 auto-wires only the label; the description improves announcement fidelity                 | AR #14         |
| Label robustness          | Empty string honored vs fallback to default             | Fallback to the default for action labels         | A rendered action can never be unnamed                                                       | AR #15         |
| Runtime-empty actions     | Fallback to pair vs no actions vs throw                 | Fallback to the default pair                      | An alert dialog can never trap the user                                                      | AR #9          |
| Header glyph              | Icon prop vs wording-only                               | Wording-only in v1                                | Named deferral; no iconography without a concrete need                                       | AR #23         |

> **Traceability:** Every scope decision references the Ambiguity Register entry that resolved
> it. See `00-ambiguity-register.md`.

---

## Security Considerations

- **Data sensitivity:** none — the component is presentation-only and handles no PII,
  credentials or tokens.
- **Input validation:** all content arrives through typed props (`ReactNode`, `ConfirmAction[]`
  tuple); runtime guards cover the only two bypassable states (empty labels, empty actions)
  (AR #9, AR #15).
- **Authentication & authorization:** N/A — no auth surface; visibility is host-controlled.
- **Injection risks:** `title` and `message` are the content-driven surfaces; both are typed
  `ReactNode` and render through React — never parsed as HTML (the legacy
  `dangerouslySetInnerHTML` path is rejected; AR #10). A spec criterion asserts markup-like
  strings render inert in both.
- **Encryption needs:** N/A — no data at rest or in transit.
- **Rate limiting:** N/A — no endpoints.
- **Infrastructure:** N/A — client-side library component; no secrets, no deployment surface.

---

## Acceptance Criteria

1. [ ] With `open` true and the default pair, exactly one element with `role="alertdialog"` is in
       the document; its accessible name equals the rendered `title` text. With `open` false, no
       `alertdialog` element exists in the document.
2. [ ] The dialog renders two actions in DOM order: decline (secondary appearance) then confirm
       (primary appearance). The decline label is `strings.decline` (default `"Cancel"`), the
       confirm label is `strings.confirm` (default `"Confirm"`).
3. [ ] On open, focus moves into the dialog: `document.activeElement` is contained by the
       `alertdialog` element (the surface in jsdom; the first action in a real browser — verified
       by the story's manual keyboard pass).
4. [ ] With `open` true, an Escape keydown dispatched on the `alertdialog` element (focus inside
       the dialog) and a click on the backdrop each leave the `alertdialog` in the document and
       produce zero `onResolve` calls.
5. [ ] Activating confirm calls `onResolve(true)` exactly once and does not remove the dialog from
       the document (the host still controls `open`); activating decline calls `onResolve(false)`
       exactly once. Each activation reports once; repeat activations while the dialog stays open
       report again — the host closes it (or sets `busy`) on the first report.
6. [ ] With `intent="danger"`, the affirmative button's class composition differs from the
       `confirmation` variant by exactly the danger class; the danger class declares
       `background-color` for base, `:hover`, `:hover:active` and `:active:focus-visible` from the
       three danger background tokens, with the on-brand white foreground; the surface element's
       classes are identical in both variants. A manual forced-colors pass (story checklist item)
       confirms the button stays usable and the override keeps Fluent's high-contrast handling
       intact.
7. [ ] With `actions` `[{ value: 'cancel' }, { value: 'discard', intent: 'danger' }, { value: 'save', appearance: 'primary' }]`
       (labels supplied): three buttons render in array order (the first is the initial-focus
       target in a real browser — see the manual keyboard pass); activating `discard` calls
       `onResolve('discard')` once; the resolved value type is inferred as
       `'cancel' | 'discard' | 'save'` at the call site (`// @ts-expect-error` pins keep the
       inference compile-checked).
8. [ ] Passed `strings={{ confirm: 'Delete' }}` only the affirmative label changes to `"Delete"`;
       the decline label remains `"Cancel"`. Passed `strings={{ confirm: '' }}` the affirmative
       label falls back to `"Confirm"` (never an unnamed button).
9. [ ] A `message` of `"line one\nline two"` renders with a computed `white-space: pre-line` and
       displays two visual lines. A `message` — and a `title` — containing
       `<script>alert(1)</script>` produce no `script` element in the document and the text is
       visible literally.
10. [ ] With `message` present, the `alertdialog`'s `aria-describedby` resolves to the element
        containing the message text; with `message` absent, the `alertdialog` has no
        `aria-describedby`. A caller-provided `aria-describedby` is forwarded unchanged.
11. [ ] With `busy` true: every action button is disabled and activating one produces no
        `onResolve` call; when `busy` flips to true while an action holds focus (focus the button
        explicitly in the test), `document.activeElement` is the dialog surface element; an
        unrelated re-render while `busy` stays true does not move focus again.
12. [ ] A runtime `actions: []` value (untyped consumer) renders the default confirm/decline pair
        and `onResolve` receives `true`/`false` like the pair variant; a dialog with zero actions
        is never rendered.
13. [ ] Native props: `data-testid`, `className` and `style` land on the dialog surface element;
        both the caller's class and the component's classes apply to it; the forwarded `ref`
        resolves to that element.
14. [ ] Zero v8 artifacts: no import of `@fluentui/react` (v8) anywhere in the component, story,
        or tests; the package manifest keeps its existing dependency set.
15. [ ] Security requirements verified (see Security Considerations): the textual-rendering and
        no-network criteria above (9) hold; the component performs no network, storage or timer
        side effects.
16. [ ] After the host sets `open={false}`, focus returns to the element that had focus before
        opening (when it is still in the document); a removed element is not restored anywhere.
17. [ ] An action `{ value: 'save', label: '' }` renders with `save` as its visible label and
        accessible name — a blank custom label never produces an unnamed button.
18. [ ] The package root exports `ConfirmDialog` plus `ConfirmIntent`, `ConfirmAction`,
        `ConfirmDialogStrings` and `ConfirmDialogProps`; the export-surface pin test carries the
        matching type pins.
19. [ ] Compile-time contract: a dialog-level `intent` combined with `actions`, and an `actions`
        value that is not a non-empty tuple, each fail type-check (`// @ts-expect-error` pins in
        the spec tests).
20. [ ] An action carrying an `icon` renders the glyph inside the button, hidden from assistive
        technology (`aria-hidden`), and the button's accessible name is exactly its `label`.

---

## Non-Functional Notes

- **Complexity:** S–M — one presentational component over existing Fluent UI v9 primitives; no
  new state machines; the only effects are the documented busy-focus synchronization and the
  bounded focus capture/restore.
- **Performance:** no measurable target beyond the repository norm — rendering is a single
  Fluent dialog; the component memoizes nothing expensive and adds no listeners.
- **Bundle:** no new dependency; imports stay within `@fluentui/react-components` and React.
