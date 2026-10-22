# Navigation and Focus: TileGrid RD-03

> **Parent**: [Index](00-index.md)
> **Authority**: AR-6–AR-9, AR-13–AR-15

## Pure Navigation

`focus/navigation.ts` receives cached rectangles, current ID, and a navigation key and returns a
target ID or the current ID at a boundary. It accesses no DOM. The ranking and unequal-height
example in AR-8 are normative. Use non-negative edge gaps, strict center-direction tests, squared
center distance, and the normalized item index for deterministic ties. A pass over cached numeric
rectangles on a keypress is sufficient; do not build a new spatial-index subsystem.

The internal testable entry point is `getNavigationTarget(rectangles, activeId, key): string |
undefined`, where `rectangles` is `readonly TileGridItemRect[]`, `activeId` is a string, and `key`
is one of the four arrows, Home, End, PageUp, or PageDown. An unknown active ID/empty geometry
returns `undefined`; callers use the normal visible-entry recovery rather than inventing an item.

Home/End and Ctrl+Home/Ctrl+End resolve collection endpoints. PageUp/PageDown apply the approved
one-row vertical rule. Disabled and non-selectable items participate in navigation. No wrapping.
Use the normalized display order, not rendered DOM order, for Shift range selection.

## Active Target and Physical Focus

`focus/useTileGridFocus.ts` owns `activeId`, a pending keyboard target, the mounted-wrapper ref
registry, and whether inline grid content held physical focus. IDs are opaque map keys (AR-13).

| Situation                                         | Resolution                                                                                                                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First measured viewport                           | First selected item intersecting the viewport in item order; otherwise first visible item. No mount autofocus or selection scroll.                                              |
| Keyboard target already visible                   | Set active ID and focus its wrapper with `preventScroll:true`.                                                                                                                  |
| Keyboard target offscreen but already mounted     | Scroll using the internal helper, then focus its connected registered wrapper with `preventScroll:true`. Check current navigation intent and focus ownership before completing. |
| Keyboard target offscreen and unmounted           | Set pending ID before scrolling; focus its wrapper on future registration only while that request and grid focus ownership remain current, then clear pending.                  |
| Focused item is removed before replacement mounts | Keep physical focus on the named root temporarily; finish recovery when the visible target mounts.                                                                              |
| Reset key changes                                 | Apply reset first; keep a visible active item, otherwise first visible selectable, then first visible, then root.                                                               |
| Layout/zoom change                                | Keep the active item if it intersects the resulting viewport; otherwise nearest visible item by center distance, lower-index tie.                                               |
| Manual scroll unmounts active item                | Use a visible fallback without scrolling back; prefer selectable, then any visible item, then root.                                                                             |
| Page append/update with stable key                | Preserve anchor and mounted active item. If it is removed, recover visibly.                                                                                                     |
| Grid did not hold focus                           | Change the next entry target only; do not focus it or steal focus from an application popup.                                                                                    |

“Visible” means a rectangle intersects the actual viewport, not merely an overscan mount. In
manual-scroll recovery the trigger is loss of the mounted active target. Prefer the first item
in normalized order among eligible visible fallbacks. When geometry is temporarily empty,
the root is the single entry target until measurement supplies a tile.

Use stable callback refs and the root's `ownerDocument`. Keep a distinction between an intentional
focus move outside the grid and DOM focus lost because a registered focused node unmounted.
Before removing a focused entry, transfer focus through the root; do not infer ownership solely
from `document.activeElement` after it has become `body`. A pending keyboard target is invalidated
if its ID disappears or a newer navigation/reset supersedes it (AR-7, AR-13).
Intentional focus movement outside the grid also invalidates a pending navigation request. A later
ref attachment must not reclaim focus after that departure. Offscreen overscan targets use their
existing connected refs rather than waiting for a new attachment (preflight PF-004).

For layout/reset/data recovery, derive visibility from cached geometry and the post-anchor actual
viewport, even when the virtualizer still exposes its previous mounted window. Preserve a visible
active ID through that gap. Reuse the existing pending mechanism for a chosen target that has not
mounted, with the root as a temporary physical focus bridge. Ref attachment registers nodes only;
post-anchor layout reconciliation validates current intent, membership, visibility, connection,
and focus ownership before completing a pending request. New inline focus supersedes an older
request. Recovery never scrolls to force an obsolete target back into view (runtime AR-23).

Callback refs enter their cache only when attached; abandoned renders must not retain attempted
item IDs. Stable mounted callbacks and identity-aware detach cleanup remain unchanged (AR-23).

## Tab Order in Custom Content

`focus/useTileGridTabOrder.ts` implements the exact AR-13 contract. Scope it to registered mounted
tile content and the existing empty-content container while the named-root fallback is active;
library-owned selection controls use React props/ref handling directly. The named root is the
entry owner for empty content. Its eligible controls use the same outside suppression, entered
DOM-order traversal, reverse entry, Escape return, and cleanup lifecycle as tile content. This
keeps a custom Retry/Create button usable without adding another outside entry stop (preflight PF-005).

Maintain each consumer element's author tabindex (including absence) separately from the temporary
managed value. Discover native controls, links with `href`, editable nodes, and explicit tabindex
elements through fixed selectors. Preserve author `-1`; positive values become zero when enabled
so active controls follow DOM order. Respect disabled/hidden state and existing native focusability.

Without an authored tabindex, classify actual native semantics rather than trusting the DOM
tabIndex getter: a link needs href, hidden inputs are excluded, and a native summary must be the
first direct summary. Exclude descendants of every closed details ancestor except its first summary
and that summary's descendants. Observe type/controls as well as href/open when those attributes
affect eligibility. At explicit Tab boundaries, confirm a real focus transfer before consuming the
key; unsuccessful focus leaves native traversal available, and consumer redirection is respected
(runtime AR-23).

Drain queued external attribute records before computing current author intent. Disconnect the
local observer for the manager's own synchronous writes and immediately reconnect. Reconcile on
mount, active/focus-state changes, child changes, and relevant native-focusability attributes.
Restore the latest author values and disconnect on release. A removed element must not remain in
the registry. Never scan the document for item IDs or add a global portal registry.

Outside the grid, only the active wrapper is tabbable. Focusing the wrapper enables its eligible
controls; forward Tab explicitly focuses the owned selection input before ordinary content,
including the unchecked-active-radio case. Reverse entry from outside also reaches the wrapper.
Handle the corresponding reverse boundary explicitly: Shift+Tab from the first eligible consumer
content control reaches the owned radio even when it is unchecked and another group member is
checked. Use the existing mounted-control registry; respect prevented events and leave selection
unchanged. Native progression handles other active controls; no cycling/trap. Shift+Tab from the
owned control returns to the wrapper and then leaves. These symmetric boundaries preserve the
contract on browsers whose native radio traversal skips unchecked members (preflight PF-009).
Escape on inline content returns to the wrapper unless a nested menu
already handled/prevented it. On leaving, suppress controls again. Pointer focus in another tile
sets that tile active without replacing the control's actual focus.

Portalled content stays application-owned. A menu's first Escape closes the menu and returns to
its trigger; a later Escape on inline content returns to the wrapper. React-bubbled popup events
whose DOM targets are outside the list must not trigger grid shortcuts or focus recovery.

## Keyboard Mapping

On the wrapper: plain navigation changes focus only; Shift+Arrow invokes the existing range
transition after movement. Single mode uses its existing single-target range semantics; none mode
only moves focus. Space uses the current mode's toggle/select rule; Enter activates enabled items.
Ctrl/Cmd+A calls the existing select-all path, including single/none warnings. Prevent the browser
default only for a handled grid key. Unrelated modifier/browser shortcuts pass through (AR-9).

Nested native controls retain their own keys. Native radio arrow behavior may change selected
radio/focus among mounted group members; normal focus/change handlers synchronize active ID and
selection once. Grid navigation does not intercept editable content, menu keys, or native radio
arrows. Escape cancellation of an active marquee has precedence over inline focus return.

## Reset and Controlled Zoom

Extend the current anchor-preservation owner with `scrollResetKey`; compare using React's
`Object.is` dependency semantics. Mount is not a reset. On key change, reset to zero and skip old
anchor restoration for that update, even when items/layout/size also change. Otherwise keep the
existing geometry/list anchoring behavior. Perform focus recovery after the final viewport is known.

Wrapper `+`/`=` and `-` keys report the resolved tile size plus/minus 20, clamped through existing
size normalization. Only `zoomable=true` with a handler enables them; never update size internally.
At a bound the reported value is the bound. Browser Ctrl/Cmd zoom shortcuts and nested editable
keys remain native. Focus calls use `preventScroll` so they do not undo anchor/reset placement.

## Failure Handling and Verification

| Case                                            | Result                                                          | Authority   |
| ----------------------------------------------- | --------------------------------------------------------------- | ----------- |
| No directional candidate                        | Keep active/focus/selection; no range transition.               | AR-8        |
| Empty list or zero-width unmeasured layout      | Named-root fallback; no crash or fake tile.                     | AR-6–AR-7   |
| External input/content updates                  | Reconcile bounded author attributes; preserve intentional `-1`. | AR-13       |
| Parent filter while focus is in a toolbar/popup | Update next entry target, leave current focus alone.            | AR-7, AR-13 |
| Pending target disappears                       | Cancel pending target and use the approved recovery path.       | AR-7, AR-13 |

Specification cases: ST-14–ST-25 and ST-35–ST-39. Browser tests must cover Chromium, Firefox, and
WebKit; jsdom alone cannot prove native radio Tab, actual focus loss, or virtualization timing.
