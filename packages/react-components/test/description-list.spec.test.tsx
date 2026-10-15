import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { render, screen } from '@testing-library/react';
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

describe('DescriptionList', () => {
  it('renders the label and the value of every pair', () => {
    renderList(
      <DescriptionList>
        <DescriptionListItem label="Plan">Pro</DescriptionListItem>
        <DescriptionListItem label="Seats">12</DescriptionListItem>
      </DescriptionList>
    );

    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Seats')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('exposes each pair as a term and its definition', () => {
    const { container } = renderList(
      <DescriptionList>
        <DescriptionListItem label="Plan">Pro</DescriptionListItem>
      </DescriptionList>
    );

    expect(container.querySelector('dl')).not.toBeNull();
    expect(screen.getByRole('term')).toHaveTextContent('Plan');
    expect(screen.getByRole('definition')).toHaveTextContent('Pro');
  });

  it('forwards native props to the list element', () => {
    const { container } = renderList(
      <DescriptionList aria-label="Subscription" className="caller-class">
        <DescriptionListItem label="Plan">Pro</DescriptionListItem>
      </DescriptionList>
    );

    const list = container.querySelector('dl');

    expect(list).toHaveAttribute('aria-label', 'Subscription');
    expect(list).toHaveClass('caller-class');
  });

  it('renders rich content in values', () => {
    renderList(
      <DescriptionList>
        <DescriptionListItem label="Status">
          <a href="https://example.com/project">Active</a>
        </DescriptionListItem>
      </DescriptionList>
    );

    expect(screen.getByRole('link', { name: 'Active' })).toBeInTheDocument();
  });

  it('forwards native props to an item wrapper', () => {
    const { container } = renderList(
      <DescriptionList>
        <DescriptionListItem label="Plan" data-testid="pair">
          Pro
        </DescriptionListItem>
      </DescriptionList>
    );

    expect(container.querySelector('[data-testid="pair"]')).toHaveTextContent('PlanPro');
  });
});
