import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CollapsibleSection } from '../src/index';

/** Preserves the real Fluent theme through both initial rendering and rerenders. */
function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  return <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;
}

/** Renders public usage while retaining Fluent's actual semantics and exit lifecycle. */
function renderSection(element: ReactElement) {
  return render(element, { wrapper: ThemeProvider });
}

/** Provides ordinary controls for observing local and external focus ownership. */
function focusSections(collapsed: boolean): ReactElement {
  return (
    <>
      <button>Outside</button>
      <CollapsibleSection title="Details" collapsed={collapsed} actions={<button>Edit</button>}>
        <input aria-label="Details value" />
      </CollapsibleSection>
      <CollapsibleSection title="Other">
        <input aria-label="Other value" />
      </CollapsibleSection>
    </>
  );
}

describe('CollapsibleSection accessibility', () => {
  it('should use a real level-two heading by default', () => {
    // Heading structure must exist independently of the disclosure's visual size.
    renderSection(<CollapsibleSection title="Details">Content</CollapsibleSection>);
    const heading = screen.getByRole('heading', { level: 2, name: 'Details' });
    expect(heading.tagName).toBe('H2');
    expect(within(heading).getByRole('button', { name: 'Details' })).toBeInTheDocument();
  });

  it.each([2, 3, 4, 5, 6] as const)('should render a real heading at requested level %s', level => {
    // The requested semantic heading level must not be replaced by styling alone.
    renderSection(
      <CollapsibleSection title="Details" headingLevel={level}>
        Content
      </CollapsibleSection>
    );
    const heading = screen.getByRole('heading', { level, name: 'Details' });
    expect(heading.tagName).toBe(`H${level}`);
    expect(within(heading).getByRole('button', { name: 'Details' })).toBeInTheDocument();
  });

  it('should render rich title and body elements without inventing a native tooltip', () => {
    // Rich content supplies the accessible name without being serialized as a div title.
    const view = renderSection(
      <CollapsibleSection
        title={
          <span>
            Personal <strong>details</strong>
          </span>
        }
      >
        <p>
          <em>Rich content</em>
        </p>
      </CollapsibleSection>
    );
    expect(screen.getByRole('button', { name: 'Personal details' })).toBeInTheDocument();
    expect(screen.getByText('details').tagName).toBe('STRONG');
    expect(screen.getByText('Rich content').tagName).toBe('EM');
    expect(view.container.querySelector('[title]')).not.toBeInTheDocument();
  });

  it('should keep distinct stable associations and remove named groups after exit', async () => {
    // Nested and sibling sections need private associations that survive local collapse.
    /** Keeps the nested structure unchanged while the outer controlled value changes. */
    const sections = (collapsed: boolean) => (
      <>
        <CollapsibleSection title="Outer" collapsed={collapsed}>
          <CollapsibleSection title="Inner">Inner content</CollapsibleSection>
        </CollapsibleSection>
        <CollapsibleSection title="Sibling">Sibling content</CollapsibleSection>
      </>
    );
    const view = renderSection(sections(false));
    const associations = ['Outer', 'Inner', 'Sibling'].map(name => {
      const button = screen.getByRole('button', { name });
      const targetId = button.getAttribute('aria-controls');
      expect(button.id).not.toBe('');
      expect(targetId).toBeTruthy();
      const host = document.getElementById(targetId ?? '');
      expect(host).toBeInTheDocument();
      expect(host?.tagName).toBe('DIV');
      expect(host).not.toHaveAttribute('role');
      expect(host).not.toHaveAttribute('aria-label');
      expect(host).not.toHaveAttribute('aria-labelledby');
      const group = screen.getByRole('group', { name });
      expect(group).toHaveAttribute('aria-labelledby', button.id);
      expect(group).toHaveAccessibleName(name);
      expect(host).toContainElement(group);
      return { name, buttonId: button.id, targetId };
    });
    const ids = associations.flatMap(({ buttonId, targetId }) => [buttonId, targetId]);
    expect(new Set(ids).size).toBe(ids.length);
    view.rerender(sections(false));
    for (const { name, buttonId, targetId } of associations) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveAttribute('id', buttonId);
      expect(button).toHaveAttribute('aria-controls', targetId);
    }
    view.rerender(sections(true));
    await waitFor(() => expect(screen.queryByText('Inner')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Outer' })).toHaveAttribute(
      'id',
      associations[0].buttonId
    );
    expect(screen.getByRole('button', { name: 'Outer' })).toHaveAttribute(
      'aria-controls',
      associations[0].targetId
    );
    const host = document.getElementById(associations[0].targetId ?? '');
    expect(host).toBeInTheDocument();
    expect(host).not.toHaveAttribute('role');
    expect(host).not.toHaveAttribute('aria-label');
    expect(host).not.toHaveAttribute('aria-labelledby');
    expect(screen.queryByRole('group', { name: 'Outer', hidden: true })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Inner', hidden: true })).not.toBeInTheDocument();
    await waitFor(() => expect(host?.querySelector('[role="group"]')).not.toBeInTheDocument());
    expect(screen.getByRole('group', { name: 'Sibling' })).toBeInTheDocument();
  });

  it('should forward native attributes, class, style and ref to the same root div', () => {
    // Caller root labels and identifiers must not overwrite private disclosure semantics.
    const ref = createRef<HTMLDivElement>();
    renderSection(
      <CollapsibleSection
        title="Details"
        ref={ref}
        id="caller-root"
        aria-label="Caller label"
        data-owner="caller"
        className="caller-class"
        style={{ maxWidth: '420px' }}
      >
        Content
      </CollapsibleSection>
    );
    expect(ref.current?.tagName).toBe('DIV');
    expect(ref.current).toHaveAttribute('id', 'caller-root');
    expect(ref.current).toHaveAttribute('aria-label', 'Caller label');
    expect(ref.current).toHaveAttribute('data-owner', 'caller');
    expect(ref.current).toHaveClass('caller-class');
    expect(ref.current).toHaveStyle({ maxWidth: '420px' });
    const button = screen.getByRole('button', { name: 'Details' });
    expect(button.id).not.toBe('caller-root');
    expect(button.getAttribute('aria-controls')).not.toBe('caller-root');
    expect(document.getElementById(button.getAttribute('aria-controls') ?? '')).toBeInTheDocument();
    expect(ref.current).toContainElement(button);
  });

  it('should preserve native root click propagation without toggling from the body or root', () => {
    // Only disclosure activation requests collapse; ordinary native events still propagate.
    const ref = createRef<HTMLDivElement>();
    const onClick = vi.fn();
    const onCollapsedChange = vi.fn();
    renderSection(
      <CollapsibleSection
        title="Details"
        ref={ref}
        onClick={onClick}
        onCollapsedChange={onCollapsedChange}
      >
        <span>Plain content</span>
      </CollapsibleSection>
    );
    fireEvent.click(screen.getByText('Plain content'));
    expect(onClick).toHaveBeenCalledTimes(1);
    const root = ref.current;
    if (!root) throw new Error('The root ref must point to the mounted div.');
    fireEvent.click(root);
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onCollapsedChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it.each(['body', 'action'])(
    'should recover disclosure focus when external collapse removes focused %s',
    async source => {
      // Removal of this section's focused content returns focus to its own disclosure.
      const view = renderSection(focusSections(false));
      const focused =
        source === 'body'
          ? screen.getByRole('textbox', { name: 'Details value' })
          : screen.getByRole('button', { name: 'Edit' });
      focused.focus();
      expect(focused).toHaveFocus();
      view.rerender(focusSections(true));
      expect(screen.getByRole('button', { name: 'Details' })).toHaveFocus();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      await waitFor(() => expect(screen.queryByLabelText('Details value')).not.toBeInTheDocument());
    }
  );

  it.each(['outside', 'other section'])(
    'should preserve %s focus despite a prior body visit',
    async destination => {
      // Stale ownership of a previously focused child cannot authorize stealing current focus.
      const view = renderSection(focusSections(false));
      screen.getByRole('textbox', { name: 'Details value' }).focus();
      const external =
        destination === 'outside'
          ? screen.getByRole('button', { name: 'Outside' })
          : screen.getByRole('textbox', { name: 'Other value' });
      external.focus();
      expect(external).toHaveFocus();
      view.rerender(focusSections(true));
      expect(external).toHaveFocus();
      await waitFor(() => expect(screen.queryByLabelText('Details value')).not.toBeInTheDocument());
      expect(external).toHaveFocus();
    }
  );

  it.each([false, true])(
    'should not steal outside focus on mount or expansion with initial collapsed %s',
    collapsed => {
      // Neither mounting state nor external expansion may move focus away from another control.
      const view = renderSection(
        <>
          <button>Outside</button>
          {null}
          {null}
        </>
      );
      const outside = screen.getByRole('button', { name: 'Outside' });
      outside.focus();
      view.rerender(focusSections(collapsed));
      expect(outside.isConnected).toBe(true);
      expect(screen.getByRole('button', { name: 'Outside' })).toBe(outside);
      expect(outside).toHaveFocus();
      view.rerender(focusSections(false));
      expect(outside.isConnected).toBe(true);
      expect(outside).toHaveFocus();
      expect(screen.getByRole('textbox', { name: 'Details value' })).toBeVisible();
    }
  );

  it('should retain input focus on unrelated rerender and header focus on header collapse', async () => {
    // Unchanged rendering needs no focus repair; a header-initiated collapse already has a target.
    /** Leaves collapse uncontrolled so native disclosure activation can change its state. */
    const section = () => (
      <CollapsibleSection title="Details">
        <input aria-label="Details value" />
      </CollapsibleSection>
    );
    const view = renderSection(section());
    const input = screen.getByRole('textbox', { name: 'Details value' });
    input.focus();
    view.rerender(section());
    expect(input).toHaveFocus();
    const button = screen.getByRole('button', { name: 'Details' });
    button.focus();
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
    await waitFor(() => expect(screen.queryByLabelText('Details value')).not.toBeInTheDocument());
    expect(button).toHaveFocus();
  });

  it.each(['title', 'actions', 'body'])(
    'should render markup-looking %s strings as literal text',
    location => {
      // Each caller text surface must remain React text, never parsed executable markup.
      const markup = '<img src=x onerror=alert(1)>';
      const view = renderSection(
        <CollapsibleSection
          title={location === 'title' ? markup : 'Details'}
          actions={location === 'actions' ? markup : undefined}
        >
          {location === 'body' ? markup : 'Content'}
        </CollapsibleSection>
      );
      expect(screen.getByText(markup)).toBeVisible();
      if (location === 'title') {
        expect(screen.getByRole('button', { name: markup })).toBeInTheDocument();
      }
      expect(view.container.querySelector('img, script')).not.toBeInTheDocument();
      expect(view.container.querySelector('[onerror]')).not.toBeInTheDocument();
    }
  );
});
