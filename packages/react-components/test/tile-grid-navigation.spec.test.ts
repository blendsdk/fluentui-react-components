// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getNavigationTarget } from '../src/components/TileGrid/focus/navigation';
import type { TileGridItemRect } from '../src/components/TileGrid/geometry/types';

/** Navigation accepts cached numbers and opaque IDs, without a browser document. */
const keys = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
] as const;
type NavigationKey = (typeof keys)[number];

/** Builds literal geometry fixtures; expectations below are hand-calculated. */
function rect(id: string, index: number, x: number, y: number, width = 100, height = 100) {
  return Object.freeze({ id, index, x, y, width, height });
}

/** The tall left-hand tile overlaps two right-hand tiles by different amounts. */
const irregular: readonly TileGridItemRect[] = Object.freeze([
  rect('A', 0, 0, 0),
  rect('B', 1, 110, 0),
  rect('C', 2, 0, 110, 100, 160),
  rect('D', 3, 110, 110),
  rect('E', 4, 110, 220),
]);

describe('TileGrid geometry navigation contract', () => {
  it.each<[string, NavigationKey, string]>([
    ['C', 'ArrowRight', 'D'],
    ['C', 'ArrowUp', 'A'],
    ['B', 'ArrowDown', 'D'],
    ['D', 'PageDown', 'E'],
    ['A', 'ArrowLeft', 'A'],
  ])('moves %s with %s to %s in unequal-height geometry', (active, key, target) => {
    // The 100px overlap with D beats the 50px overlap with E when leaving C to the right.
    expect(getNavigationTarget(irregular, active, key)).toBe(target);
  });

  it.each<[string, NavigationKey]>([
    ['A', 'ArrowLeft'],
    ['B', 'ArrowRight'],
    ['A', 'ArrowUp'],
    ['E', 'ArrowDown'],
    ['A', 'PageUp'],
    ['E', 'PageDown'],
  ])('keeps %s at its %s boundary without wrapping', (active, key) => {
    // A boundary returns the current ID rather than starting another row or column.
    expect(getNavigationTarget(irregular, active, key)).toBe(active);
  });

  it.each(keys)('returns no target for empty geometry or an unknown active ID with %s', key => {
    // Recovery belongs to the caller; navigation cannot invent an active item.
    expect(getNavigationTarget([], 'missing', key)).toBeUndefined();
    expect(getNavigationTarget(irregular, 'missing', key)).toBeUndefined();
  });

  it.each<[NavigationKey, string]>([
    ['Home', 'A'],
    ['End', 'E'],
  ])('uses the collection endpoint for %s', (key, target) => {
    // Endpoints span the whole collection rather than the current geometric row.
    expect(getNavigationTarget(irregular, 'D', key)).toBe(target);
  });

  it.each<[string, NavigationKey, string]>([
    ['B', 'PageDown', 'D'],
    ['D', 'PageUp', 'B'],
    ['A', 'PageDown', 'C'],
    ['C', 'PageUp', 'A'],
  ])('moves one fixed row from %s with %s to %s', (active, key, target) => {
    // Page navigation is one vertical move, even when several rows fit in a viewport.
    const fixed = [
      rect('A', 0, 0, 0),
      rect('B', 1, 110, 0),
      rect('C', 2, 0, 110),
      rect('D', 3, 110, 110),
    ];
    expect(getNavigationTarget(fixed, active, key)).toBe(target);
  });

  it.each<[NavigationKey, number, number, number, number]>([
    ['ArrowLeft', 0, 60, 0, 160],
    ['ArrowRight', 220, 60, 220, 160],
    ['ArrowUp', 60, 0, 160, 0],
    ['ArrowDown', 60, 220, 160, 220],
  ])('uses normalized index to break equal %s scores', (key, x1, y1, x2, y2) => {
    // Both candidates have equal overlap, gap, and distance; array order must not win the tie.
    const rectangles = [
      rect('higher-index', 5, x1, y1),
      rect('lower-index', 2, x2, y2),
      rect('active', 0, 110, 110),
    ];
    expect(getNavigationTarget(rectangles, 'active', key)).toBe('lower-index');
  });

  it.each(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] as const)(
    'excludes equal-center candidates for %s even if their edges extend farther',
    key => {
      // Direction uses a strict center comparison, not an edge or a non-strict comparison.
      const rectangles = [rect('active', 0, 100, 100), rect('same-center', 1, 0, 0, 300, 300)];
      expect(getNavigationTarget(rectangles, 'active', key)).toBe('active');
    }
  );

  it.each([
    {
      rule: 'greater vertical overlap before horizontal gap',
      candidates: [rect('near', 1, 110, 50), rect('overlap', 2, 300, 0)],
      target: 'overlap',
    },
    {
      rule: 'smaller horizontal gap before center distance',
      candidates: [rect('wide', 1, 110, 0, 300), rect('near-center', 2, 120, 0, 10)],
      target: 'wide',
    },
    {
      rule: 'nearer center before normalized index',
      candidates: [rect('far-center', 2, 110, 0), rect('near-center', 5, 110, 0, 20)],
      target: 'near-center',
    },
    {
      rule: 'zero rather than negative overlapping edge gaps',
      candidates: [rect('wide', 2, 50, 0), rect('near-center', 5, 75, 0, 10)],
      target: 'near-center',
    },
  ])('ranks rightward candidates by $rule', ({ candidates, target }) => {
    // Each fixture isolates one ranking priority using conflicting numeric advantages.
    expect(
      getNavigationTarget([rect('active', 0, 0, 0), ...candidates], 'active', 'ArrowRight')
    ).toBe(target);
  });

  it.each([
    {
      rule: 'horizontal overlap before a nearer non-overlapping candidate',
      candidates: [rect('no-overlap', 1, 110, 110), rect('overlap', 2, 90, 300)],
      target: 'overlap',
    },
    {
      rule: 'smaller vertical gap before greater horizontal overlap',
      candidates: [rect('near-gap', 1, 90, 110), rect('more-overlap', 2, 0, 130)],
      target: 'near-gap',
    },
    {
      rule: 'greater horizontal overlap after equal vertical gaps',
      candidates: [rect('partial-overlap', 1, 50, 110), rect('full-overlap', 2, 0, 110)],
      target: 'full-overlap',
    },
    {
      rule: 'nearer center after equal gaps and overlaps',
      candidates: [
        rect('far-center', 2, 0, 110, 100, 300),
        rect('near-center', 5, 0, 110, 100, 10),
      ],
      target: 'near-center',
    },
    {
      rule: 'nearest center when every candidate lacks horizontal overlap',
      candidates: [rect('small-gap', 1, 1000, 110), rect('near-center', 2, 110, 300)],
      target: 'near-center',
    },
    {
      rule: 'lower index when non-overlapping centers are equally distant',
      candidates: [rect('higher-index', 5, 110, 110), rect('lower-index', 2, -110, 110)],
      target: 'lower-index',
    },
  ])('ranks downward candidates by $rule', ({ candidates, target }) => {
    // Without horizontal overlap, nearest-center ranking replaces edge-gap ranking entirely.
    expect(
      getNavigationTarget([rect('active', 0, 0, 0), ...candidates], 'active', 'ArrowDown')
    ).toBe(target);
  });

  it('treats punctuation, Unicode, and prototype-like IDs as opaque identities', () => {
    // Neither property lookup nor selector parsing may reinterpret an item ID.
    const rectangles = [rect('__proto__', 0, 0, 0), rect('a["雪"]', 1, 110, 0)];
    expect(getNavigationTarget(rectangles, '__proto__', 'ArrowRight')).toBe('a["雪"]');
    expect(getNavigationTarget(rectangles, 'a["雪"]', 'ArrowLeft')).toBe('__proto__');
  });
});
