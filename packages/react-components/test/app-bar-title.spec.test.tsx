import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { AppBarTitle } from '../src/index';

/** Keeps the real Fluent theme present for every render. */
function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  return <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;
}

/** Renders the title through the public component contract. */
function renderTitle(element: ReactElement) {
  return render(element, { wrapper: ThemeProvider });
}

describe('AppBarTitle', () => {
  it('should render a span by default', () => {
    renderTitle(<AppBarTitle>Contoso</AppBarTitle>);

    const title = screen.getByText('Contoso');
    expect(title.tagName).toBe('SPAN');
    expect(title).toHaveTextContent('Contoso');
  });

  it('should render a heading when headingLevel is set', () => {
    renderTitle(<AppBarTitle headingLevel={1}>Contoso</AppBarTitle>);
    expect(screen.getByRole('heading', { level: 1, name: 'Contoso' }).tagName).toBe('H1');

    renderTitle(<AppBarTitle headingLevel={3}>Contoso</AppBarTitle>);
    expect(screen.getByRole('heading', { level: 3, name: 'Contoso' }).tagName).toBe('H3');
  });

  it('should render an anchor with link attributes', () => {
    renderTitle(
      <AppBarTitle href="/home" target="_blank" rel="noreferrer">
        Contoso
      </AppBarTitle>
    );

    const link = screen.getByRole('link', { name: 'Contoso' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/home');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('should forward the ref to the selected root', () => {
    const spanRef = createRef<HTMLElement>();
    const first = renderTitle(<AppBarTitle ref={spanRef}>Contoso</AppBarTitle>);
    expect(spanRef.current?.tagName).toBe('SPAN');
    first.unmount();

    const headingRef = createRef<HTMLElement>();
    const second = renderTitle(
      <AppBarTitle ref={headingRef} headingLevel={2}>
        Contoso
      </AppBarTitle>
    );
    expect(headingRef.current?.tagName).toBe('H2');
    second.unmount();

    const linkRef = createRef<HTMLElement>();
    renderTitle(
      <AppBarTitle ref={linkRef} href="/home">
        Contoso
      </AppBarTitle>
    );
    expect(linkRef.current?.tagName).toBe('A');
  });

  it('should merge the caller class and forward native props', () => {
    renderTitle(
      <AppBarTitle className="custom" id="title">
        Contoso
      </AppBarTitle>
    );

    const title = screen.getByText('Contoso');
    expect(title.className).toContain('custom');
    expect(title.id).toBe('title');
  });

  it('should keep the full text and the truncation styles for a long title', () => {
    const longTitle = 'A'.repeat(200);
    renderTitle(<AppBarTitle>{longTitle}</AppBarTitle>);

    const title = screen.getByText(longTitle);
    expect(title.textContent).toBe(longTitle);
    expect(getComputedStyle(title).whiteSpace).toBe('nowrap');
    expect(getComputedStyle(title).overflow).toBe('hidden');
    expect(getComputedStyle(title).textOverflow).toBe('ellipsis');
  });
});
