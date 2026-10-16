import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLauncherGrid, AppLauncherItem, AppLauncherSection } from '../src/index';

describe('AppLauncherSection', () => {
  it('renders its title and content', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <AppLauncherSection title="All apps" divider>
          <AppLauncherGrid>
            <AppLauncherItem label="Mail" />
          </AppLauncherGrid>
        </AppLauncherSection>
      </FluentProvider>
    );

    expect(screen.getByText('All apps')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Mail' })).toBeDefined();
  });

  it('renders its content without a title', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <AppLauncherSection>
          <AppLauncherGrid>
            <AppLauncherItem label="Mail" />
          </AppLauncherGrid>
        </AppLauncherSection>
      </FluentProvider>
    );

    expect(screen.getByRole('button', { name: 'Mail' })).toBeDefined();
  });
});
