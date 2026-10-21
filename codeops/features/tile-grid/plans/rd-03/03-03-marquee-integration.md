# Marquee Integration: TileGrid RD-03

> **Parent**: [Index](00-index.md)
> **Authority**: AR-10–AR-11, AR-14–AR-15; RD-01 state machine

## Existing Controller, Mounted Host

Keep `createMarqueeController` as the pointer-state authority. Add two internal optional callbacks
in `marquee/types.ts`; current standalone controller tests keep their default behavior:

```ts
onRectChange?: (rect: MarqueeRect | null) => void;
resolveFinalSelection?: (
  rect: MarqueeRect,
  initialSelection: ReadonlySet<string>,
  additive: boolean
) => ReadonlySet<string>;
```

`onRectChange` reports actual rectangle changes independently of selected-hit changes, including
auto-scroll frames and terminal removal. It supplies snapshots rather than mutable internal state.
At pointer-up, sample the final point before determining threshold/selection. For an active
gesture, call the resolver once when supplied, otherwise use the existing preview set. Mark the
gesture committed before calling out/releasing capture so later capture loss cannot cancel it.
No resolver runs on short clicks, cancel, capture loss, or dispose.

`marquee/useTileGridMarquee.ts` owns the mounted controller, live geometry port, visual preview,
overlay rectangle, and event wiring. The existing selection store remains committed-state authority.
Construct/dispose the controller through effects when the root and opt-in allow it; do not allocate
a controller during render or mount listeners when disabled.

## Geometry and Selection Flow

Use a rectangle-by-ID map rebuilt with geometry and live refs for current mounted-window IDs,
root, scroll offset, predicates, and selection. Geometry port reads never measure individual tile
nodes. Container bounds may be measured once per controller update. Preview hit testing uses the
current mounted/visible plus overscan window; root scroll events update the existing virtualizer.
Do not add a separate per-pixel scroll-render loop.

Use the scroll container's client-area origin for pointer conversion: subtract
`bounds.left + root.clientLeft` and `bounds.top + root.clientTop`, then add the vertical scroll
offset. Cached rectangles and the overlay use this same coordinate space. Ordinary root borders
must not shift intersections (preflight PF-007).

At gesture start, snapshot effective committed selection and input identities. Preview changes
only the visible selected presentation; it never mutates the store, invokes `onSelectionChange`,
or updates the live region. The full selected-ID set is not reconstructed on each pointer frame.
For the mounted host, leave the existing full-set `onPreview` callback unwired and do not call
`getPreviewSelection()`. Use `onRectChange` and the gesture-start membership snapshot to compute
only mounted-item presentation: plain preview shows current intersections; additive preview shows
snapshot membership or an intersection. Recompute for mounted-window changes as well as rectangle
changes. Keep pending and idle presentation committed. This avoids the existing snapshot copies
without changing standalone controller callback semantics (preflight PF-006).

At successful release, the resolver intersects the final rectangle with cached geometry once,
filters through current eligibility, and produces either those IDs or their union with the
gesture-start set. Use the existing strict intersection helper: touching edges alone do not hit.
This O(n) terminal pass includes tiles that left the viewport during auto-scroll. Call the store's
single `replaceSelection` method; equality suppresses a no-op callback. Remove preview/overlay
and render the actual controlled or uncontrolled source. A rejecting parent leaves its old state.

## Event Ownership

Start only for an enabled multiselect grid, primary mouse/pen pointer, primary button, and genuine
grid background. Exclude every tile descendant, the empty-state content, nested grid, control,
link, input, menu, and future drag handle. Use root containment and fixed selectors, not raw-ID
selectors. A touch pointer remains native tapping/scrolling (AR-11).

Compose root native handlers with the grid handlers and honor `defaultPrevented`. Capture on the
root. After the controller attempts capture, the mounted host verifies it; capture failure disposes
the host gesture without a callback. This host rule does not rewrite the controller's existing
synthetic/no-capture unit contract. Prevent browser text-selection/default drag only for an accepted
mouse/pen background gesture.

Pointer move/up/cancel/lost-capture events must belong to the active pointer. Escape cancels before
the ordinary focus Escape path. The controller's terminal guard owns pointer-up/capture-loss ordering.
Overlay nodes are `aria-hidden`, have `pointer-events:none`, and use token stroke/fill colors.

An accepted gesture does not acquire keyboard focus. While pending or active, attach one bubbling
`keydown` listener to the root's `ownerDocument` so Escape also arrives when a search field outside
the grid remains focused. Ignore already-prevented events and preserve nested-menu consumption.
Root keyboard handling may cancel first; the document path must then observe the terminal state/
prevented event and do nothing. Successful cancellation prevents Escape's default action. Remove
the listener on short release, commit, cancel, capture failure, prop-driven cancellation, dispose,
and unmount. It is gesture-scoped inside this host, not a permanent document handler (preflight PF-003).

## External Changes and Cleanup

Cancel pending/active gestures on changes to normalized item identity/order, geometry, predicate
identity, effective controlled selected membership, or enabled state (AR-11). A replacement Set
with equal membership is not a selection change. Normal preview renders and container scroll do
not change these inputs and must not cancel the gesture. Document stable predicate identities in
the component props/README so application rerenders do not unintentionally cancel.

Cancellation removes transient preview/overlay and uses the **latest** committed selection. Never
write the controller's original snapshot back over an external parent update. Unmount disposes
frames, pointer capture, and listeners without calling the public callback. The controller may
notify its internal cancellation callback; that is not a selection-store commit.

## Failure Handling and Verification

| Case                                            | Result                                                         | Authority    |
| ----------------------------------------------- | -------------------------------------------------------------- | ------------ |
| Movement below 4 CSS px                         | Background click; no overlay commit, selection, or activation. | RD-01        |
| Escape, pointercancel, nonterminal capture loss | Remove preview and stop frames; no selection callback.         | RD-01; AR-11 |
| Pointer-up then capture loss                    | Keep committed result; at most one change callback.            | RD-01        |
| Same hits but a new rectangle                   | Overlay still moves; no selection callback.                    | AR-10        |
| Data/geometry/parent change                     | Cancel and keep latest source; no obsolete commit.             | AR-11        |
| Capture failure or unmount                      | Dispose host gesture and stop all activity.                    | AR-11        |

Specification cases: ST-26–ST-34 and ST-36–ST-39. Browser tests use real pointer capture and edge
scrolling. Existing controller tests remain valid; extend internals for resolver ordering, frame
cleanup, and rectangle-only notifications after the public oracles are green.
