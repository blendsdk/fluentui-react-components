// @vitest-environment node
import { describe, expect, it } from 'vitest';
import * as api from '../src/index';

describe('TileGrid module evaluation', () => {
  it('imports in a node environment without browser globals', () => {
    expect(api.TileGrid).toBeTypeOf('function');
  });
});
