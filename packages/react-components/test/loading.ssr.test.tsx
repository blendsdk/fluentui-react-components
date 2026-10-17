// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Loading } from '../src/index';

describe('Loading server rendering', () => {
  it('renders the empty status root without browser access', () => {
    // The filler must be import-safe and server-renderable: no window or
    // document access during render, and no visible text until the client
    // effect reveals it. That empty first paint is what lets hydration turn
    // the label into a text change inside an existing live region.
    const html = renderToString(<Loading />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-atomic="true"');
    expect(html).not.toContain('Loading…');
  });
});
