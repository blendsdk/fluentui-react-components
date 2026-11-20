import { Button, FluentProvider, webLightTheme } from '@fluentui/react-components';
import { render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { AppBarButton } from '../src/index';

/** Keeps the real Fluent theme present for every render. */
function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  return <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;
}

/** Renders a command through the public component contract. */
function renderButton(element: ReactElement) {
  return render(element, { wrapper: ThemeProvider });
}

describe('AppBarButton internals', () => {
  it('should add the bar attribute and the component class', () => {
    renderButton(<AppBarButton>Settings</AppBarButton>);

    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button).toHaveAttribute('data-app-bar-button');
    expect(button.className.split(/\s+/).filter(Boolean).length).toBeGreaterThan(1);
  });

  it('should merge the caller class', () => {
    renderButton(<AppBarButton className="custom">Settings</AppBarButton>);

    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button.className).toContain('custom');
  });

  it('should default the type to button and render a native button root', () => {
    renderButton(<AppBarButton>Settings</AppBarButton>);

    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should add a component class that a plain Fluent Button lacks', () => {
    const plainRender = renderButton(<Button>Plain</Button>);
    const plainButton = screen.getByRole('button', { name: 'Plain' });
    const plainClasses = new Set(plainButton.className.split(/\s+/).filter(Boolean));
    plainRender.unmount();

    renderButton(<AppBarButton>Settings</AppBarButton>);
    const button = screen.getByRole('button', { name: 'Settings' });
    const extraClasses = button.className
      .split(/\s+/)
      .filter(className => className && !plainClasses.has(className));

    expect(extraClasses.length).toBeGreaterThan(0);
  });
});
