import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { AppBarSpacer } from '../src/index';

/** Keeps the real Fluent theme present for every render. */
function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  return <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;
}

/** Renders the spacer through the public component contract. */
function renderSpacer(element: ReactElement) {
  return render(element, { wrapper: ThemeProvider });
}

describe('AppBarSpacer', () => {
  it('should render an empty div with no accessible content', () => {
    const { container } = renderSpacer(<AppBarSpacer />);
    const root = container.firstElementChild;

    expect(root?.tagName).toBe('DIV');
    expect(root?.textContent).toBe('');
    expect(root?.hasAttribute('tabindex')).toBe(false);
  });

  it('should forward the ref, class and native props', () => {
    const ref = createRef<HTMLDivElement>();

    renderSpacer(<AppBarSpacer ref={ref} className="custom" id="gap" />);

    expect(ref.current?.id).toBe('gap');
    expect(ref.current?.className).toContain('custom');
  });
});
