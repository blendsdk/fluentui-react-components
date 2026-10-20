import { describe, expect, it } from 'vitest';
import { createTileGridFixture } from '../fixtures/tileGridFixture';

/**
 * Performance-harness smoke test.
 *
 * Proves the browser performance project can create the shared 20K fixture
 * and measure a high-resolution duration with performance.now().
 */
describe('tile-grid performance harness', () => {
  it('creates the 20K fixture and measures a finite duration', () => {
    const startedAt = performance.now();
    const fixture = createTileGridFixture(20_000);
    const elapsed = performance.now() - startedAt;

    expect(fixture).toHaveLength(20_000);
    expect(Number.isFinite(elapsed)).toBe(true);
    expect(fixture[0]).toMatchObject({ id: 'tile-0', aspectRatio: 0.8 });
    expect(fixture[19_999].aspectRatio).toBe(2);
    expect(new Set(fixture.map(item => item.id)).size).toBe(20_000);
  });
});
