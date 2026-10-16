// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ConfirmProvider } from '../src/index';

describe('ConfirmProvider server rendering', () => {
  it('imports and renders to a string without a DOM', () => {
    // The provider must be safe at import time and under server rendering:
    // no window access outside effects, no dialog markup while idle.
    const html = renderToString(
      <ConfirmProvider>
        <span>server content</span>
      </ConfirmProvider>
    );

    expect(html).toContain('server content');
    expect(html).not.toContain('alertdialog');
  });
});
