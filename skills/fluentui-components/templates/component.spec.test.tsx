// Template: test/<kebab-case-name>.spec.test.tsx
// Written FIRST, from the contract alone, and kept unchanged while the
// component is implemented. Query by role and accessible name, as a screen
// reader user would. One test per promise the contract makes.
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { <Name> } from '../src/index';

// `<kebab-case-name>` in the file name; <Name> in the code.

/**
 * Renders the component inside the theme provider, mirroring how applications
 * mount it.
 */
function renderComponent(component: ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{component}</FluentProvider>);
}

describe('<Name>', () => {
  it('renders <the documented content>', () => {
    renderComponent(<<Name> label="Example" />);

    expect(screen.getByText('Example')).toBeInTheDocument();
  });

  it('exposes <the documented semantics>', () => {
    const { container } = renderComponent(<<Name> label="Example" />);

    // Prefer role queries; use container queries only for structure that has
    // no role (and say why in a comment).
    expect(container.querySelector('<element>')).not.toBeNull();
  });

  it('forwards native props to the root element', () => {
    const { container } = renderComponent(<<Name> label="Example" aria-label="Named" className="caller-class" />);

    const root = container.querySelector('<element>');

    expect(root).toHaveAttribute('aria-label', 'Named');
    expect(root).toHaveClass('caller-class');
  });

  // Add the contract's remaining promises: activation callbacks, disabled
  // modes, rich content, empty states, keyboard behavior.
});
