import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { AppBar, AppBarSpacer, AppBarTitle } from '../src/index';

/** Keeps the real Fluent theme present for every render. */
function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  return <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;
}

/** Renders through the public component contract with the theme wrapper. */
function renderWithTheme(element: ReactElement) {
  return render(element, { wrapper: ThemeProvider });
}

describe('AppBar shell internals', () => {
  it('should merge the bar root class with the caller class', () => {
    renderWithTheme(
      <AppBar className="custom">
        <span>Content</span>
      </AppBar>
    );

    const banner = screen.getByRole('banner');
    const classes = banner.className.split(/\s+/).filter(Boolean);
    expect(classes).toContain('custom');
    expect(classes.length).toBeGreaterThan(1);
  });

  it('should forward the bar and title refs', () => {
    const barRef = createRef<HTMLElement>();
    const titleRef = createRef<HTMLElement>();

    renderWithTheme(
      <AppBar ref={barRef}>
        <AppBarTitle ref={titleRef}>Contoso</AppBarTitle>
      </AppBar>
    );

    expect(barRef.current?.tagName).toBe('HEADER');
    expect(titleRef.current?.tagName).toBe('SPAN');
  });

  it('should add the link class only in link mode', () => {
    const linkRender = renderWithTheme(<AppBarTitle href="/">Contoso</AppBarTitle>);
    const link = screen.getByRole('link', { name: 'Contoso' });
    const linkClasses = link.className.split(/\s+/).filter(Boolean);
    linkRender.unmount();

    renderWithTheme(<AppBarTitle>Contoso</AppBarTitle>);
    const span = screen.getByText('Contoso');
    const spanClasses = span.className.split(/\s+/).filter(Boolean);

    expect(linkClasses.some(className => !spanClasses.includes(className))).toBe(true);
  });

  it('should not add the command attribute to arbitrary children', () => {
    renderWithTheme(
      <AppBar>
        <button type="button">Command</button>
      </AppBar>
    );

    expect(screen.getByRole('button', { name: 'Command' })).not.toHaveAttribute(
      'data-app-bar-button'
    );
  });

  it('should forward the spacer ref and merge its root class', () => {
    const ref = createRef<HTMLDivElement>();

    renderWithTheme(<AppBarSpacer ref={ref} className="custom" />);

    expect(ref.current?.tagName).toBe('DIV');
    const classes = ref.current?.className.split(/\s+/).filter(Boolean) ?? [];
    expect(classes).toContain('custom');
    expect(classes.length).toBeGreaterThan(1);
  });
});
