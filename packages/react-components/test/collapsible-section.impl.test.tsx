import { Card, FluentProvider, webLightTheme } from '@fluentui/react-components';
import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CollapsibleSection } from '../src/index';
import { useCollapsibleSection } from '../src/components/CollapsibleSection/useCollapsibleSection';

/** Supplies the real Fluent renderer/theme to both component and hook tests. */
function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  return <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;
}

/** Reads generated rules as static styling evidence, not browser-computed appearance. */
function generatedCss(): string {
  return Array.from(document.styleSheets)
    .flatMap(sheet => Array.from(sheet.cssRules, rule => rule.cssText))
    .join('\n');
}

describe('CollapsibleSection internals', () => {
  it.each(['small', 'medium', 'large', 'extra-large'] as const)(
    'should retain the filled small Card treatment with a %s header',
    size => {
      const root = createRef<HTMLDivElement>();
      const reference = createRef<HTMLDivElement>();
      render(
        <>
          <Card appearance="filled" size="small" focusMode="off" ref={reference} />
          <CollapsibleSection title="Details" size={size} ref={root} onClick={() => {}}>
            Content
          </CollapsibleSection>
        </>,
        { wrapper: ThemeProvider }
      );
      // Shared primitive classes pin Card treatment without claiming jsdom renders CSS.
      for (const className of reference.current?.classList ?? []) {
        if (!className.startsWith('___')) expect(root.current).toHaveClass(className);
      }
      expect(root.current).not.toHaveAttribute('tabindex');
      expect(root.current).not.toHaveAttribute('data-tabster');
      expect(root.current?.querySelectorAll('.fui-Accordion')).toHaveLength(1);
      expect(root.current?.querySelectorAll('.fui-AccordionItem')).toHaveLength(1);
    }
  );

  it('should resolve defaults, visual size and semantic headings in the hook', () => {
    const root = createRef<HTMLDivElement>();
    const { result } = renderHook(
      () => useCollapsibleSection({ title: 'Details', children: 'Content' }, root),
      { wrapper: ThemeProvider }
    );
    expect(result.current.headingTag).toBe('h2');
    expect(result.current.size).toBe('large');
    expect(result.current.openItems).toEqual([result.current.itemValue]);
    expect(result.current.rootRef).toBe(root);
    expect(result.current.showActions).toBe(false);
  });

  it.each([2, 3, 4, 5, 6] as const)('should map heading %s independently of header size', level => {
    const { result } = renderHook(
      () =>
        useCollapsibleSection(
          { title: 'Details', children: null, headingLevel: level, size: 'small', collapsed: true },
          null
        ),
      { wrapper: ThemeProvider }
    );
    expect(result.current.headingTag).toBe(`h${level}`);
    expect(result.current.size).toBe('small');
    expect(result.current.openItems).toEqual([]);
  });

  it('should keep actions outside the heading and preserve the generic host after exit', async () => {
    const root = createRef<HTMLDivElement>();
    render(
      <CollapsibleSection title="Details" actions={<button>Edit</button>} ref={root}>
        Content
      </CollapsibleSection>,
      { wrapper: ThemeProvider }
    );
    const disclosure = screen.getByRole('button', { name: 'Details' });
    const action = screen.getByRole('button', { name: 'Edit' });
    const heading = screen.getByRole('heading', { name: 'Details' });
    expect(heading.parentElement).toBe(action.parentElement?.parentElement);
    expect(heading).not.toContainElement(action);
    const host = document.getElementById(disclosure.getAttribute('aria-controls') ?? '');
    expect(host?.firstElementChild).toHaveClass('fui-AccordionPanel');
    fireEvent.click(disclosure);
    expect(action).not.toBeInTheDocument();
    await waitFor(() => expect(host).toBeEmptyDOMElement());
    expect(host).toBeInTheDocument();
    expect(host).not.toHaveAttribute('role');
  });

  it.each([null, undefined])('should omit the action wrapper for %s actions', actions => {
    const { result } = renderHook(
      () => useCollapsibleSection({ title: 'Details', children: null, actions }, null),
      { wrapper: ThemeProvider }
    );
    expect(result.current.showActions).toBe(false);
  });

  it('should merge root classes and preserve style, supplied tabIndex and focus handlers', () => {
    const ref = createRef<HTMLDivElement>();
    const onFocus = vi.fn();
    const onFocusCapture = vi.fn();
    const onBlur = vi.fn();
    const onBlurCapture = vi.fn();
    render(
      <CollapsibleSection
        title="Details"
        ref={ref}
        className="caller-class"
        style={{ maxWidth: '420px' }}
        tabIndex={-1}
        onFocus={onFocus}
        onFocusCapture={onFocusCapture}
        onBlur={onBlur}
        onBlurCapture={onBlurCapture}
      >
        <input aria-label="Body input" />
      </CollapsibleSection>,
      { wrapper: ThemeProvider }
    );
    expect(ref.current).toHaveClass('fui-Card', 'caller-class');
    expect(ref.current?.classList.length).toBeGreaterThan(2);
    expect(ref.current).toHaveAttribute('tabindex', '-1');
    expect(ref.current).toHaveStyle({ maxWidth: '420px' });
    screen.getByRole('textbox', { name: 'Body input' }).focus();
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onFocusCapture).toHaveBeenCalledTimes(1);
    screen.getByRole('button', { name: 'Details' }).focus();
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onBlurCapture).toHaveBeenCalledTimes(1);
  });

  it('should not try to repair focus to a disconnected disclosure on whole-component unmount', () => {
    const view = render(
      <CollapsibleSection title="Details">
        <input aria-label="Body input" />
      </CollapsibleSection>,
      { wrapper: ThemeProvider }
    );
    const disclosure = screen.getByRole('button', { name: 'Details' });
    const focus = vi.spyOn(disclosure, 'focus');
    screen.getByRole('textbox', { name: 'Body input' }).focus();
    view.unmount();
    expect(disclosure.isConnected).toBe(false);
    expect(focus).not.toHaveBeenCalled();
    focus.mockRestore();
  });

  it('should generate guarded token typography and a reduced-motion direct-SVG override', () => {
    render(<CollapsibleSection title="Details">Content</CollapsibleSection>, {
      wrapper: ThemeProvider,
    });
    const css = generatedCss();
    // This checks generated declarations only. Motion, focus rings and layout need a browser.
    expect(css).toMatch(
      /:enabled:not\(\[aria-disabled="true"\]\).*font-weight:\s*var\(--fontWeightSemibold\)/
    );
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\).*?>\s*svg\s*\{\s*transition:\s*none\s*!important/s
    );
    expect(
      screen.getByRole('button', { name: 'Details' }).querySelector('svg')
    ).toBeInTheDocument();
  });
});
