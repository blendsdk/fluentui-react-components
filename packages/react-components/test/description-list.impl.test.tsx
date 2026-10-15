import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { DescriptionList, DescriptionListItem } from '../src/index';

/**
 * Renders a list inside the theme provider, mirroring how applications mount
 * the components.
 */
function renderList(list: ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{list}</FluentProvider>);
}

describe('DescriptionList internals', () => {
  it('tells its items which layout to render with', () => {
    // jsdom has no layout engine, so the class names stand in for the visual
    // difference: a columns pair takes its two column tracks from the list's
    // grid, a stacked pair is a one-column grid of its own.
    const stacked = renderList(
      <DescriptionList layout="stacked">
        <DescriptionListItem label="Plan">Pro</DescriptionListItem>
      </DescriptionList>
    );
    const stackedClasses = stacked.container.querySelector('dl > div')?.className;
    stacked.unmount();

    const columns = renderList(
      <DescriptionList layout="columns">
        <DescriptionListItem label="Plan">Pro</DescriptionListItem>
      </DescriptionList>
    );
    const columnsClasses = columns.container.querySelector('dl > div')?.className;

    expect(stackedClasses).not.toBe(columnsClasses);
  });

  it('falls back to the stacked layout for items outside a list', () => {
    const standalone = renderList(
      <DescriptionListItem label="Plan" data-testid="pair">
        Pro
      </DescriptionListItem>
    );
    const standaloneClasses = standalone.container.querySelector('[data-testid="pair"]')?.className;
    standalone.unmount();

    const insideList = renderList(
      <DescriptionList layout="stacked">
        <DescriptionListItem label="Plan" data-testid="pair">
          Pro
        </DescriptionListItem>
      </DescriptionList>
    );

    expect(standaloneClasses).toBe(
      insideList.container.querySelector('[data-testid="pair"]')?.className
    );
  });

  it('keeps the pairs as direct children of the list element', () => {
    const { container } = renderList(
      <DescriptionList>
        <DescriptionListItem label="Plan">Pro</DescriptionListItem>
        <DescriptionListItem label="Seats">12</DescriptionListItem>
      </DescriptionList>
    );

    expect(container.querySelector('dl')?.children).toHaveLength(2);
  });

  it('merges the caller class name into the item wrapper', () => {
    const { container } = renderList(
      <DescriptionList>
        <DescriptionListItem label="Plan" className="custom-pair">
          Pro
        </DescriptionListItem>
      </DescriptionList>
    );

    expect(container.querySelector('dl > div')).toHaveClass('custom-pair');
  });
});
