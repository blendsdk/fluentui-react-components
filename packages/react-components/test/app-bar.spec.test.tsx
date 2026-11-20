import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppBar, AppBarSpacer, AppBarTitle } from '../src/index';

/** Keeps the real Fluent theme present for every render. */
function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  return <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;
}

/** Renders a bar through the public component contract. */
function renderBar(element: ReactElement) {
  return render(element, { wrapper: ThemeProvider });
}

describe('AppBar', () => {
  it('should render a banner landmark with its children', () => {
    renderBar(
      <AppBar>
        <span>Content</span>
      </AppBar>
    );

    const banner = screen.getByRole('banner');
    expect(banner.tagName).toBe('HEADER');
    expect(within(banner).getByText('Content')).toBeInTheDocument();
  });

  it('should expose the caller accessible name', () => {
    renderBar(
      <AppBar aria-label="Application">
        <span>Content</span>
      </AppBar>
    );

    expect(screen.getByRole('banner', { name: 'Application' })).toBeInTheDocument();
  });

  it('should forward the ref to the header element', () => {
    const ref = createRef<HTMLElement>();

    renderBar(
      <AppBar ref={ref}>
        <span>Content</span>
      </AppBar>
    );

    expect(ref.current).toBe(screen.getByRole('banner'));
  });

  it('should pass native props through and merge the caller class', () => {
    renderBar(
      <AppBar id="app-bar" className="custom" style={{ minHeight: '64px' }}>
        <span>Content</span>
      </AppBar>
    );

    const banner = screen.getByRole('banner');
    expect(banner.id).toBe('app-bar');
    expect(banner.className).toContain('custom');
    expect(banner.style.minHeight).toBe('64px');
  });

  it('should not restyle an arbitrary child button', () => {
    const onClick = vi.fn();

    renderBar(
      <AppBar>
        <button type="button" onClick={onClick}>
          Command
        </button>
      </AppBar>
    );

    const command = screen.getByRole('button', { name: 'Command' });
    expect(command).not.toHaveAttribute('data-app-bar-button');
    fireEvent.click(command);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render the title, spacer and trailing content in order', () => {
    renderBar(
      <AppBar>
        <AppBarTitle>Contoso</AppBarTitle>
        <AppBarSpacer />
        <span>End</span>
      </AppBar>
    );

    const banner = screen.getByRole('banner');
    expect(banner.children[0]).toHaveTextContent('Contoso');
    expect(banner.children[1].tagName).toBe('DIV');
    expect(banner.children[2]).toHaveTextContent('End');
  });
});
