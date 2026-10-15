// Template: test/<kebab-case-name>.impl.test.tsx
// Written after the implementation is green. Covers what the spec tests
// cannot see: context wiring, class composition, element structure. jsdom has
// no layout engine, so class names stand in for visual differences — say so
// where it happens.
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { <Name> } from '../src/index';

function renderComponent(component: ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{component}</FluentProvider>);
}

describe('<Name> internals', () => {
  it('renders the variant its container asks for', () => {
    // jsdom has no layout engine, so the class names stand in for the visual
    // difference: <what the classes express>.
    const first = renderComponent(<<Name> label="Example" layout="default" />);
    const firstClasses = first.container.querySelector('<element>')?.className;
    first.unmount();

    const second = renderComponent(<<Name> label="Example" layout="compact" />);
    const secondClasses = second.container.querySelector('<element>')?.className;

    expect(firstClasses).not.toBe(secondClasses);
  });

  it('merges the caller class name into the root element', () => {
    const { container } = renderComponent(<<Name> label="Example" className="custom-class" />);

    expect(container.querySelector('<element>')).toHaveClass('custom-class');
  });

  it('renders children without adding wrapper elements', () => {
    const { container } = renderComponent(
      <<Name> label="Example">
        <span>Child one</span>
        <span>Child two</span>
      </<Name>>
    );

    expect(container.querySelector('<element>')?.children).toHaveLength(2);
  });
});
