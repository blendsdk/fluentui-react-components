// @vitest-environment node
import { describe, expect, it } from 'vitest';
import * as api from '../src/components/TileGrid';

describe('TileGrid module evaluation', () => {
  it('imports in a node environment without browser globals', () => {
    expect(api.TileGrid).toBeTypeOf('function');
  });
});
