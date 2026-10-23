# TileGrid RD-04 Implementation Plan

> **Feature**: Optional single-item drag arranging, the `TileGridItem` shell, actions, and the 20K photo-library recipe
> **Status**: Planning Complete
> **Created**: 2026-10-23
> **Implements**: tile-grid/RD-04
> **CodeOps Artifact Schema**: 1

## Overview

RD-04 completes the TileGrid contract. It adds an opt-in arranging layer on `@dnd-kit/core`, a
presentation shell that applications compose inside `renderItem`, and a recipe that proves the
grid at 20K items with filtering, seeded selection, zoom, actions, and arranging.

The grid remains presentation-only. The application owns item order, actions, authorization,
image URLs, the preview surface, and persistence. The grid reports a proposed order through
`onReorder`; it never mutates `items` or the selection set.

## Minimum-Sufficient Baseline

**Original goal:** finish the v1 TileGrid with optional single-item drag reorder, a configurable
tile shell with app-supplied actions, and a verifiable 20K photo-library composition.

**Smallest viable design:** add the already-approved `@dnd-kit/core` 6.3.x dependency (requirements
AR #11), reuse the existing geometry, virtualization, focus, selection, and live-region modules,
and implement the shell with the house Fluent UI component pattern. No custom drag engine, no new
test harness, and no new public subsystem beyond the types and component named in RD-04.

**Excluded machinery:** `@dnd-kit/sortable`, multi-item or cross-grid drag, a built-in lightbox,
a built-in filter toolbar, image fetching or URL validation, and order persistence. These are
RD-04 exclusions or requirements AR #11 rejections.

**Approved complexity:** AR-3 — `@dnd-kit/core` 6.3.x as an externalized direct dependency,
already approved by requirements AR #11 with the complete challenger packet and user decision.

## Document Index

| #   | Document                                                  | Description                                 |
| --- | --------------------------------------------------------- | ------------------------------------------- |
| AR  | [Ambiguity Register](00-ambiguity-register.md)            | Zero-Ambiguity Gate decisions (audit trail) |
| 00  | [Index](00-index.md)                                      | This document — overview and navigation     |
| 01  | [Requirements](01-requirements.md)                        | RD-04 delta view and plan-local decisions   |
| 02  | [Current State](02-current-state.md)                      | Existing TileGrid seams and gaps            |
| 03  | [Reorder Layer](03-01-reorder-layer.md)                   | Drag model, collision, overlay, auto-scroll |
| 03  | [Tile Shell](03-02-tile-shell.md)                         | `TileGridItem`, actions, menu, strings      |
| 03  | [Recipe and Package Surface](03-03-recipe-and-package.md) | 20K story, documentation, exports           |
| 07  | [Testing Strategy](07-testing-strategy.md)                | Specification test cases and verification   |
| 99  | [Execution Plan](99-execution-plan.md)                    | Phases, sessions, and task checklist        |

## Quick Reference

### Usage Examples

```tsx
<TileGrid
  items={photos}
  getItemId={photo => photo.id}
  getItemLabel={photo => photo.name}
  reorderable
  onReorder={({ itemId, toIndex, orderedIds }) => persistOrder(itemId, toIndex, orderedIds)}
  onItemActivate={photo => openPreview(photo)}
  renderItem={({
    item,
    selected,
    selectable,
    disabled,
    isDragging,
    isOverlay,
    dragHandleProps,
    reorderActions,
    strings,
  }) => (
    <TileGridItem
      item={item}
      selected={selected}
      selectable={selectable}
      disabled={disabled}
      isDragging={isDragging}
      isOverlay={isOverlay}
      dragHandleProps={dragHandleProps}
      reorderActions={reorderActions}
      strings={strings}
      media={<img src={photoUrl(item)} alt="" loading="lazy" />}
      title={item.name}
      actions={[
        { id: 'favorite', label: 'Favorite', icon: <StarRegular />, onSelect: toggleFavorite },
      ]}
    />
  )}
/>
```

```tsx
<TileGridItem
  item={photo}
  selected={selected}
  selectable={selectable}
  media={<img src={photo.thumbnailUrl} alt="" />}
  title={photo.name}
  description={photo.description}
  badges={<Badge appearance="tint">RAW</Badge>}
  actions={inlineActions}
  overflowActions={menuOnlyActions}
  dragHandleProps={dragHandleProps}
  reorderActions={reorderActions}
  strings={strings}
/>
```

### Key Decisions

| Decision              | Outcome                                                       |
| --------------------- | ------------------------------------------------------------- |
| Drag dependency       | `@dnd-kit/core` 6.3.1, externalized, no sortable package      |
| Order commit          | Controlled `onReorder`; the grid never mutates `items`        |
| Keyboard reorder      | Move up / Move down menu actions with a shared live region    |
| Overflow reachability | `actions` are always duplicated into the menu                 |
| Drag overlay          | Custom body portal at the tile rectangle, no drop animation   |
| Package surface       | Complete TileGrid and TileGridItem export at RD-04 completion |

## Specialist Agents

**None** — the capability-gap check re-ran against the RD-04 plan evidence and found no gap a
standing specialist would close.

_Detection evidence: the work integrates a documented dependency (`@dnd-kit/core` 6.3.1) behind
the existing geometry, focus, and selection modules; the governing design lives in
`03-01-reorder-layer.md`, and the repository already carries the `fluentui-components` skill for the
shell pattern. A drag specialist would restate the 03-01 packet. The 2026-10-22 `analyze-agents`
check also returned `None` across all eight existing plans._

## Related Files

- `packages/react-components/src/components/TileGrid/` — reorder integration, types, render state
- `packages/react-components/src/components/TileGridItem/` — new shell component
- `packages/react-components/src/components/TileGrid/reorder/` — insertion, overlay, auto-scroll
- `packages/react-components/test/` — spec, impl, SSR, and export-pin tests
- `packages/react-components/test/browser/` — drag, keyboard, and recipe browser tests
- `packages/react-components/src/components/TileGrid/stories/` — drag and photo-library stories
- `packages/react-components/src/components/TileGridItem/stories/` — shell stories
- `packages/react-components/README.md` — public contract documentation
