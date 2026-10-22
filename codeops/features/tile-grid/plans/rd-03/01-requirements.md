# Requirements: TileGrid RD-03

> **Parent**: [Index](00-index.md)
> **Source**: [RD-03](../../requirements/RD-03-selection-focus-and-accessibility.md)

## Scope Delta

| Requirement                                                            | In this plan                                                                                                                                                          | Remaining boundary                                                                                                   |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [RD-03](../../requirements/RD-03-selection-focus-and-accessibility.md) | All 21 acceptance criteria, including inherited selection behavior and both development warnings.                                                                     | Custom application portals retain app-owned lifecycle under AR-13.                                                   |
| [RD-01](../../requirements/RD-01-selection-and-marquee.md)             | Regression coverage and corrections for seed anchors, toggle anchors, fixed mode, and the mounted marquee completion path. Preserve all existing oracle expectations. | Aggregate completion must be proven against Phase A plus this plan at final verification.                            |
| [RD-02](../../requirements/RD-02-layout-and-virtualization.md)         | Deferred keyboard zoom, controlled callback, focus/scroll integration, and the approved native `tabIndex` correction.                                                 | Final render-argument types, shell/reorder types, export pin, and dependency freeze remain with RD-04/final release. |
| [RD-04](../../requirements/RD-04-arranging-tile-shell-and-actions.md)  | Context for future action isolation only.                                                                                                                             | Tile shell, actions, arranging, dnd-kit, and full photo-library recipe.                                              |

The four existing layouts and 20K budgets apply to every new interaction. Existing geometry and
selection specifications remain the oracle; this plan adds tests for the newly integrated behavior
and previously uncovered required invariants (AR-1, AR-2, AR-14).

## Plan-Local Decisions

| Decision                                                | Authority                           |
| ------------------------------------------------------- | ----------------------------------- |
| Selection presentation versus eligibility               | AR-5; requirements AR-19            |
| Library-owned entry and visible recovery                | AR-6–AR-7; requirements AR-20–AR-21 |
| Navigation and native event behavior                    | AR-8–AR-9                           |
| Bounded preview, complete final selection, cancellation | AR-10–AR-11                         |
| Committed-count announcements                           | AR-12                               |
| Local focus plumbing and portal boundary                | AR-13                               |
| Four-phase delivery and module names                    | AR-14                               |
| Controls, descriptions, and styling                     | AR-15                               |

## Plan-Local Acceptance

The concrete additional cases are ST-01–ST-43 in [07-testing-strategy.md](07-testing-strategy.md).
No acceptance criterion is inferred from implementation output. The three owning specifications
define exact algorithms and lifecycle ordering; the requirement documents own product scope.

## Security and Compatibility Boundary

RD-03's security section is authoritative. Labels, count strings, and IDs are untrusted text, not
HTML or executable selectors. Ref registries use opaque IDs as map keys. No selected-ID/label/URL
logging, fetching, persistence, auth, or server validation layer is introduced. Server-side input
validation, authorization, rate limiting, and encryption remain application responsibilities and
are not applicable to this client-only change.

AR-3 preserves the released package surface. Tests and stories import TileGrid from its component
folder. Package-root exports and declaration exclusions remain part of final verification.
