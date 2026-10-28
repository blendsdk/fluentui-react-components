import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CollapsibleSection } from '../src/index';

/** Keeps the real Fluent theme present on initial render and every rerender. */
function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  return <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;
}

/** Renders public usage without replacing any Fluent primitive or its lifecycle. */
function renderSection(element: ReactElement) {
  return render(element, { wrapper: ThemeProvider });
}

/** Holds disposable body state so unmounting can be observed through fresh input. */
function StatefulBody(): ReactElement {
  const [value, setValue] = useState('Initial value');
  return (
    <input aria-label="Body value" value={value} onChange={event => setValue(event.target.value)} />
  );
}

describe('CollapsibleSection', () => {
  it('should start expanded with a native button without notifying on mount', () => {
    // Default rendering exposes the body without treating initialization as a user request.
    const onCollapsedChange = vi.fn();
    renderSection(
      <CollapsibleSection title="Details" onCollapsedChange={onCollapsedChange}>
        Content
      </CollapsibleSection>
    );
    const disclosure = screen.getByRole('button', { name: 'Details' });
    expect(disclosure.tagName).toBe('BUTTON');
    expect(disclosure).toHaveAttribute('type', 'button');
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Content')).toBeVisible();
    expect(onCollapsedChange).not.toHaveBeenCalled();
  });

  it('should never mount initially collapsed children while retaining the control target', () => {
    // Collapsed initialization must not run child effects, even for a hidden body.
    const onMount = vi.fn();
    /** Reports an actual mount rather than merely checking whether text is hidden. */
    function MountObserver(): ReactElement {
      useEffect(() => {
        onMount();
      }, []);
      return <span>Content</span>;
    }
    renderSection(
      <CollapsibleSection title="Details" defaultCollapsed>
        <MountObserver />
      </CollapsibleSection>
    );
    const disclosure = screen.getByRole('button', { name: 'Details' });
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(onMount).not.toHaveBeenCalled();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
    const targetId = disclosure.getAttribute('aria-controls');
    expect(targetId).toBeTruthy();
    expect(document.getElementById(targetId ?? '')).toBeInTheDocument();
  });

  it('should update uncontrolled state and report collapse then expansion exactly once each', async () => {
    // User requests drive local state, with body removal following the exit lifecycle.
    const onCollapsedChange = vi.fn();
    renderSection(
      <CollapsibleSection title="Details" onCollapsedChange={onCollapsedChange}>
        Content
      </CollapsibleSection>
    );
    const disclosure = screen.getByRole('button', { name: 'Details' });
    fireEvent.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(screen.queryByText('Content')).not.toBeInTheDocument());
    fireEvent.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Content')).toBeVisible();
    expect(onCollapsedChange.mock.calls).toEqual([[true], [false]]);
  });

  it('should ignore changes to the uncontrolled initial value after mount', () => {
    // A changed default cannot reset an already mounted section or emit a request.
    const onCollapsedChange = vi.fn();
    const view = renderSection(
      <CollapsibleSection title="Details" onCollapsedChange={onCollapsedChange}>
        Content
      </CollapsibleSection>
    );
    view.rerender(
      <CollapsibleSection title="Details" defaultCollapsed onCollapsedChange={onCollapsedChange}>
        Content
      </CollapsibleSection>
    );
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('Content')).toBeVisible();
    expect(onCollapsedChange).not.toHaveBeenCalled();
  });

  it('should keep controlled content expanded when the parent does not accept a collapse request', () => {
    // Notification is a request, not authority to override a controlled prop.
    const onCollapsedChange = vi.fn();
    renderSection(
      <CollapsibleSection title="Details" collapsed={false} onCollapsedChange={onCollapsedChange}>
        Content
      </CollapsibleSection>
    );
    const disclosure = screen.getByRole('button', { name: 'Details' });
    fireEvent.click(disclosure);
    expect(onCollapsedChange.mock.calls).toEqual([[true]]);
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Content')).toBeVisible();
  });

  it('should follow an echoing controlled parent without duplicating notifications', async () => {
    // Parent state accepts each requested boolean and remains the source of truth.
    const onCollapsedChange = vi.fn();
    /** Models an application accepting requests through its own controlled state. */
    function ControlledParent(): ReactElement {
      const [collapsed, setCollapsed] = useState(false);
      return (
        <CollapsibleSection
          title="Details"
          collapsed={collapsed}
          onCollapsedChange={next => {
            onCollapsedChange(next);
            setCollapsed(next);
          }}
        >
          Content
        </CollapsibleSection>
      );
    }
    renderSection(<ControlledParent />);
    const disclosure = screen.getByRole('button', { name: 'Details' });
    fireEvent.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(screen.queryByText('Content')).not.toBeInTheDocument());
    fireEvent.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Content')).toBeVisible();
    expect(onCollapsedChange.mock.calls).toEqual([[true], [false]]);
  });

  it('should follow external controlled changes without emitting user requests', async () => {
    // Prop-driven collapse and expansion must not call the user-change callback.
    const onCollapsedChange = vi.fn();
    /** Builds the same controlled section for each external value. */
    const section = (collapsed: boolean) => (
      <CollapsibleSection
        title="Details"
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
      >
        Content
      </CollapsibleSection>
    );
    const view = renderSection(section(false));
    expect(screen.getByText('Content')).toBeVisible();
    view.rerender(section(true));
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await waitFor(() => expect(screen.queryByText('Content')).not.toBeInTheDocument());
    view.rerender(section(false));
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('Content')).toBeVisible();
    expect(onCollapsedChange).not.toHaveBeenCalled();
  });

  it('should let controlled false override an initially collapsed default', () => {
    // False is an authoritative controlled value, not a missing value.
    renderSection(
      <CollapsibleSection title="Details" collapsed={false} defaultCollapsed>
        Content
      </CollapsibleSection>
    );
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('Content')).toBeVisible();
  });

  it('should work without callbacks in both uncontrolled and controlled usage', async () => {
    // Optional notifications must not prevent local changes or override controlled state.
    renderSection(
      <>
        <CollapsibleSection title="Local">Local content</CollapsibleSection>
        <CollapsibleSection title="Controlled" collapsed={false}>
          Controlled content
        </CollapsibleSection>
      </>
    );
    const local = screen.getByRole('button', { name: 'Local' });
    fireEvent.click(local);
    expect(local).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(screen.queryByText('Local content')).not.toBeInTheDocument());
    fireEvent.click(local);
    expect(local).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Local content')).toBeVisible();
    const controlled = screen.getByRole('button', { name: 'Controlled' });
    fireEvent.click(controlled);
    expect(controlled).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Controlled content')).toBeVisible();
  });

  it('should keep header actions outside the disclosure and activate them independently', () => {
    // An action is its own control, not part of the disclosure activation target.
    const onEdit = vi.fn();
    const onCollapsedChange = vi.fn();
    renderSection(
      <CollapsibleSection
        title="Details"
        actions={<button onClick={onEdit}>Edit</button>}
        onCollapsedChange={onCollapsedChange}
      >
        Content
      </CollapsibleSection>
    );
    const disclosure = screen.getByRole('button', { name: 'Details' });
    const edit = screen.getByRole('button', { name: 'Edit' });
    expect(disclosure).not.toContainElement(edit);
    fireEvent.click(edit);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onCollapsedChange).not.toHaveBeenCalled();
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  });

  it('should remove actions immediately on controlled collapse and unmount the body after exit', async () => {
    // Header actions disappear in the collapse commit; body removal may finish later.
    /** Keeps action and body content unchanged while the parent changes collapsed state. */
    const section = (collapsed: boolean) => (
      <CollapsibleSection title="Details" collapsed={collapsed} actions={<button>Edit</button>}>
        Content
      </CollapsibleSection>
    );
    const view = renderSection(section(false));
    expect(screen.getByRole('button', { name: 'Edit' })).toBeVisible();
    expect(screen.getByText('Content')).toBeVisible();
    view.rerender(section(true));
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Content')).not.toBeInTheDocument());
  });

  it('should reset body-local state after collapse completes and the body reopens', async () => {
    // Body state is disposable rather than retained in hidden mounted children.
    renderSection(
      <CollapsibleSection title="Details">
        <StatefulBody />
      </CollapsibleSection>
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Body value' }), {
      target: { value: 'Changed' },
    });
    expect(screen.getByRole('textbox', { name: 'Body value' })).toHaveValue('Changed');
    const disclosure = screen.getByRole('button', { name: 'Details' });
    fireEvent.click(disclosure);
    await waitFor(() => expect(screen.queryByLabelText('Body value')).not.toBeInTheDocument());
    fireEvent.click(disclosure);
    expect(screen.getByRole('textbox', { name: 'Body value' })).toHaveValue('Initial value');
  });

  it('should isolate nested requests and reset the inner section after the outer body unmounts', async () => {
    // An inner request belongs only to that section; an outer exit discards its local state.
    const onOuterChange = vi.fn();
    const onInnerChange = vi.fn();
    renderSection(
      <CollapsibleSection title="Outer" onCollapsedChange={onOuterChange}>
        <CollapsibleSection title="Inner" onCollapsedChange={onInnerChange}>
          Inner content
        </CollapsibleSection>
      </CollapsibleSection>
    );
    const outer = screen.getByRole('button', { name: 'Outer' });
    fireEvent.click(screen.getByRole('button', { name: 'Inner' }));
    expect(onInnerChange.mock.calls).toEqual([[true]]);
    expect(onOuterChange).not.toHaveBeenCalled();
    expect(outer).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(screen.queryByText('Inner content')).not.toBeInTheDocument());
    fireEvent.click(outer);
    await waitFor(() => expect(screen.queryByText('Inner')).not.toBeInTheDocument());
    fireEvent.click(outer);
    expect(screen.getByRole('button', { name: 'Inner' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Inner content')).toBeVisible();
    expect(onInnerChange.mock.calls).toEqual([[true]]);
    expect(onOuterChange.mock.calls).toEqual([[true], [false]]);
  });
});
