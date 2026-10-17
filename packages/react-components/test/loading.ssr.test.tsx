// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Loading, LoadingOverlay, useLoading } from '../src/index';

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

/**
 * A host that exposes the idle controller state in the server HTML.
 */
function IdleControllerHost() {
  const { isLoading, label, run } = useLoading();

  return <span>{`${isLoading ? 'busy' : 'idle'}|${label ?? 'none'}|${typeof run}`}</span>;
}

describe('useLoading server rendering', () => {
  it('renders the idle controller without browser access', () => {
    const html = renderToString(<IdleControllerHost />);

    expect(html).toContain('idle');
    expect(html).toContain('none');
    expect(html).toContain('function');
  });
});

describe('LoadingOverlay server rendering', () => {
  it('renders the mounted content and the busy wrapper without browser access', () => {
    // The overlay must keep its children in the server HTML and mark the
    // content busy immediately, while the status text and the scrim wait for
    // the client effect. This is also the empty status node that hydration
    // later turns into an announcement.
    const html = renderToString(
      <LoadingOverlay loading>
        <span>server content</span>
      </LoadingOverlay>
    );

    expect(html).toContain('server content');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).not.toContain('Loading…');
  });
});
