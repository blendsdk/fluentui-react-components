// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SystemErrorProvider } from '../src/index';

describe('SystemErrorProvider server rendering', () => {
  it('imports and renders to a string without a DOM', () => {
    // The provider must be safe at import time and under server rendering:
    // no window access outside effects, no import-time browser API use.
    const html = renderToString(
      <SystemErrorProvider>
        <span>server content</span>
      </SystemErrorProvider>
    );

    expect(html).toContain('server content');
  });
});
