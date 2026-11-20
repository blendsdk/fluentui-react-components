import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { GridDots20Regular, Settings20Regular } from '@fluentui/react-icons';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { createRef, useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppBar, AppBarButton, AppLauncher } from '../src/index';

/** Keeps the real Fluent theme present for every render. */
function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  return <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;
}

/** Renders a command through the public component contract. */
function renderButton(element: ReactElement) {
  return render(element, { wrapper: ThemeProvider });
}

/** Mimics an application bar with a working launcher trigger. */
function LauncherShell(): ReactElement {
  const barRef = useRef<HTMLElement>(null);

  return (
    <AppBar ref={barRef}>
      <AppLauncher
        trigger={<AppBarButton aria-label="App launcher" icon={<GridDots20Regular />} />}
        dockTarget={barRef}
      >
        <div>Panel content</div>
      </AppLauncher>
    </AppBar>
  );
}

describe('AppBarButton', () => {
  it('should render a text command with the bar attribute and default button type', () => {
    renderButton(<AppBarButton>Settings</AppBarButton>);

    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('data-app-bar-button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should render a named icon-only command', () => {
    renderButton(<AppBarButton aria-label="Settings" icon={<Settings20Regular />} />);

    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('should call onClick once per click', () => {
    const onClick = vi.fn();
    renderButton(<AppBarButton onClick={onClick}>Settings</AppBarButton>);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should forward the ref to the button', () => {
    const ref = createRef<HTMLButtonElement>();
    renderButton(<AppBarButton ref={ref}>Settings</AppBarButton>);

    expect(ref.current?.tagName).toBe('BUTTON');
  });

  it('should merge the caller class and forward native props', () => {
    renderButton(
      <AppBarButton className="custom" id="settings">
        Settings
      </AppBarButton>
    );

    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button.className).toContain('custom');
    expect(button.id).toBe('settings');
  });

  it('should not fire a disabled command', () => {
    const onClick = vi.fn();
    renderButton(
      <AppBarButton disabled onClick={onClick}>
        Settings
      </AppBarButton>
    );

    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should keep disabledFocusable focusable without firing it', () => {
    const onClick = vi.fn();
    renderButton(
      <AppBarButton disabledFocusable onClick={onClick}>
        Settings
      </AppBarButton>
    );

    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should pass aria-expanded through for the open state', () => {
    renderButton(<AppBarButton aria-expanded="true">Settings</AppBarButton>);

    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('should pass an explicit type through', () => {
    renderButton(<AppBarButton type="submit">Save</AppBarButton>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'submit');
  });

  it('should open the existing AppLauncher from the bar trigger', () => {
    renderButton(<LauncherShell />);

    const trigger = screen.getByRole('button', { name: 'App launcher' });
    fireEvent.click(trigger);

    expect(screen.getByText('Panel content')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
