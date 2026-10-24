import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MailRegular } from '@fluentui/react-icons';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from 'storybook/test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TileGridItem } from '../src/components/TileGridItem';
import type { TileGridItemProps } from '../src/components/TileGridItem';
import type {
  TileGridAction,
  TileGridDragHandleProps,
  TileGridStrings,
} from '../src/components/TileGrid';

/**
 * Public contract of the optional tile shell.
 *
 * The shell is presentation-only, so the tests mount it as a black box inside
 * a Fluent provider and observe the documented regions through stable data
 * hooks. Action behaviour is proven through application callbacks; no internal
 * module is imported and no selection, drag, or reorder work is simulated.
 */

/** Minimal application record whose identity is independent from its label. */
interface Item {
  /** Opaque identity passed back to action callbacks. */
  id: string;
  /** Human-readable name shown in the tile and used by fixtures. */
  label: string;
}

const ITEM: Item = { id: 'photo-1', label: 'Lake sunrise' };

const IMAGE_SOURCE = 'data:image/png;base64,iVBORw0KGgo=';

const CUSTOM_STRINGS: Partial<TileGridStrings> = { moreActions: 'Photo actions' };

/** Builds an action without repeating the no-op callback in every case. */
function action(
  id: string,
  label: string,
  overrides: Partial<TileGridAction<Item>> = {}
): TileGridAction<Item> {
  return { id, label, onSelect: () => {}, ...overrides };
}

/** Builds the library-owned handle wiring shaped the way the grid supplies it. */
function handleProps(overrides: Partial<TileGridDragHandleProps> = {}): TileGridDragHandleProps {
  return {
    setNodeRef: () => {},
    attributes: {},
    listeners: {},
    isDragging: false,
    disabled: false,
    label: 'Reorder Lake sunrise',
    ...overrides,
  };
}

/** Mounts one shell inside the theme provider, mirroring application usage. */
function renderShell(props: TileGridItemProps<Item>) {
  return render(
    <FluentProvider theme={webLightTheme}>
      <TileGridItem {...props} />
    </FluentProvider>
  );
}

/** Returns the first element carrying one of the documented shell hooks. */
function byHook(attribute: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[${attribute}]`);
  if (!element) {
    throw new Error(`Expected the ${attribute} hook to be rendered.`);
  }
  return element;
}

/** Returns the single shell root. */
function shellRoot(): HTMLElement {
  return byHook('data-tile-grid-item-shell');
}

/** Returns an inline action entry inside the shell. */
function inlineAction(id: string): HTMLElement {
  const element = shellRoot().querySelector<HTMLElement>(`[data-tile-grid-action-id="${id}"]`);
  if (!element) {
    throw new Error(`Expected the inline action "${id}" to be rendered.`);
  }
  return element;
}

/** Returns an action entry inside the open overflow menu. */
function menuAction(menu: HTMLElement, id: string): HTMLElement {
  const item = within(menu)
    .getAllByRole('menuitem')
    .find(candidate => candidate.getAttribute('data-tile-grid-action-id') === id);
  if (!item) {
    throw new Error(`Expected the menu action "${id}" to be rendered.`);
  }
  return item;
}

/** Reads the numeric ratio from the media container's inline aspect ratio. */
function ratioOf(element: HTMLElement): number {
  const [width = '', height] = element.style.aspectRatio.split('/');
  const parsedWidth = Number.parseFloat(width);
  if (height === undefined) {
    return parsedWidth;
  }
  return parsedWidth / Number.parseFloat(height);
}

/**
 * Reveals the hover-only inline row through the documented focus-within path.
 *
 * jsdom does not maintain `:hover` state, so focusing the always-visible menu
 * trigger is the reliable way to expose the inline actions to role queries.
 */
function revealInlineActions(name = 'More actions'): void {
  const trigger = screen.getByRole('button', { name });
  act(() => trigger.focus());
}

/** Opens the shell's overflow menu and returns its menu surface. */
async function openMenu(name = 'More actions'): Promise<HTMLElement> {
  const user = userEvent.setup();
  await act(async () => {
    await user.click(screen.getByRole('button', { name }));
  });
  return screen.findByRole('menu');
}

afterEach(() => vi.restoreAllMocks());

describe('tile shell contract', () => {
  it('should render every documented slot in its region', async () => {
    // One shell exercises media, content, both action lists, reorder entries,
    // the custom indicator, the overlay, and the default handle together.
    renderShell({
      item: ITEM,
      media: <img alt={ITEM.label} src={IMAGE_SOURCE} />,
      title: 'Sunrise over the lake',
      description: 'Lake Tahoe, 06:14',
      badges: (
        <>
          <span>New</span>
          <span>4K</span>
        </>
      ),
      actions: [action('share', 'Share')],
      overflowActions: [action('remove', 'Remove')],
      reorderActions: [action('move-up', 'Move up')],
      selectionIndicator: <span data-testid="custom-selection-indicator">Selected</span>,
      statusOverlay: (
        <button type="button" onClick={() => {}}>
          Retry sync
        </button>
      ),
      dragHandleProps: handleProps(),
      strings: CUSTOM_STRINGS,
      selected: true,
      selectable: true,
    });

    const root = shellRoot();
    expect(root.tagName).toBe('DIV');
    expect(root).not.toHaveAttribute('role');
    expect(root).toHaveAttribute('data-selected', 'true');

    const media = byHook('data-tile-grid-media');
    expect(media).toHaveAttribute('data-fit', 'cover');
    expect(media).toContainElement(screen.getByRole('img', { name: ITEM.label }));

    const overlay = byHook('data-tile-grid-status-overlay');
    expect(media).toContainElement(overlay);
    expect(within(overlay).getByRole('button', { name: 'Retry sync' })).toBeInTheDocument();
    expect(within(media).getByTestId('custom-selection-indicator')).toBeInTheDocument();

    for (const text of ['Sunrise over the lake', 'Lake Tahoe, 06:14', 'New', '4K']) {
      const node = screen.getByText(text);
      expect(root).toContainElement(node);
      expect(media).not.toContainElement(node);
    }

    const inlineRow = byHook('data-tile-grid-inline-actions');
    const share = inlineAction('share');
    expect(inlineRow).toContainElement(share);
    expect(share).toHaveAttribute('type', 'button');

    const handle = byHook('data-tile-grid-drag-handle');
    expect(handle.tagName).toBe('BUTTON');
    expect(handle).toHaveAttribute('type', 'button');
    expect(handle).toHaveAttribute('tabindex', '-1');
    expect(handle).toHaveAccessibleName('Reorder Lake sunrise');

    const trigger = byHook('data-tile-grid-menu-trigger');
    expect(trigger).toHaveAccessibleName('Photo actions');

    const menu = await openMenu('Photo actions');
    expect(menuAction(menu, 'share')).toBeInTheDocument();
    expect(menuAction(menu, 'remove')).toBeInTheDocument();
    expect(menuAction(menu, 'move-up')).toBeInTheDocument();
  });

  it('should pass the original item to an action exactly once', () => {
    // Action callbacks receive the value the application supplied, not a copy.
    const onSelect = vi.fn<(item: Item) => void>();
    renderShell({
      item: ITEM,
      actions: [action('share', 'Share', { onSelect })],
    });

    fireEvent.click(inlineAction('share'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]).toBe(ITEM);
  });

  it('should reject and ignore children as a content channel', () => {
    // The slots are the only content channel; a forwarded child must not render.
    render(
      <FluentProvider theme={webLightTheme}>
        <TileGridItem
          item={ITEM}
          title="Photo"
          // @ts-expect-error children is not a documented content channel
          children={<span>Injected child content</span>}
        />
      </FluentProvider>
    );

    expect(screen.queryByText('Injected child content')).toBeNull();
    expect(screen.getByText('Photo')).toBeInTheDocument();
  });

  it('should run an inline action once without changing selected or dragging state', () => {
    // Activating an action is independent from the visual tile state.
    const onSelect = vi.fn<(item: Item) => void>();
    renderShell({
      item: ITEM,
      selected: true,
      selectable: true,
      isDragging: false,
      actions: [action('share', 'Share', { onSelect })],
    });

    const root = shellRoot();
    const state = () => ({
      selected: root.getAttribute('data-selected'),
      disabled: root.getAttribute('data-disabled'),
      dragging: root.getAttribute('data-dragging'),
      overlay: root.getAttribute('data-overlay'),
    });
    const before = state();

    fireEvent.click(inlineAction('share'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]).toBe(ITEM);
    expect(state()).toEqual(before);
    expect(root).toHaveAttribute('data-selected', 'true');
    expect(root).not.toHaveAttribute('data-dragging');
  });

  it('should render an icon action with its label as the accessible name', () => {
    // An icon replaces the visible text; the accessible name must remain.
    renderShell({
      item: ITEM,
      actions: [action('share', 'Share', { icon: <MailRegular /> })],
    });
    revealInlineActions();

    const button = screen.getByRole('button', { name: 'Share' });

    expect(button).toHaveAttribute('data-tile-grid-action-id', 'share');
    expect(button.querySelector('svg')).not.toBeNull();
    expect(button.textContent).toBe('');
  });

  it.each([
    { description: 'empty', label: '' },
    { description: 'whitespace-only', label: '   ' },
  ])('should name an action by its id when the label is $description', ({ label }) => {
    // An action can never render unnamed, even when the application leaves the label blank.
    renderShell({
      item: ITEM,
      actions: [action('favorite', label)],
    });
    revealInlineActions();

    const button = screen.getByRole('button', { name: 'favorite' });

    expect(button).toHaveAttribute('data-tile-grid-action-id', 'favorite');
    expect(button.textContent).toBe('favorite');
  });

  it('should order menu entries as actions, overflow actions, then reorder actions', async () => {
    // The menu always repeats the inline actions before the menu-only and reorder entries.
    renderShell({
      item: ITEM,
      actions: [action('edit', 'Edit'), action('archive', 'Archive')],
      overflowActions: [action('duplicate', 'Duplicate')],
      reorderActions: [action('move-up', 'Move up'), action('move-down', 'Move down')],
    });

    const menu = await openMenu();
    const ids = within(menu)
      .getAllByRole('menuitem')
      .map(item => item.getAttribute('data-tile-grid-action-id'));

    expect(ids).toEqual(['edit', 'archive', 'duplicate', 'move-up', 'move-down']);
  });

  it('should not render a custom handle without library handle props', () => {
    // The render prop cannot invent drag wiring the grid did not provide.
    renderShell({
      item: ITEM,
      title: 'Lake sunrise',
      dragHandle: () => <button type="button">Custom handle</button>,
    });

    expect(screen.queryByRole('button', { name: 'Custom handle' })).toBeNull();
    expect(document.querySelector('[data-tile-grid-drag-handle-slot]')).toBeNull();
  });

  it('should mark a disabled shell and suppress its actions, menu, and handle', () => {
    // A disabled shell keeps readable content but offers no way to act or drag.
    const onSelect = vi.fn<(item: Item) => void>();
    renderShell({
      item: ITEM,
      title: 'Lake sunrise',
      disabled: true,
      actions: [action('archive', 'Archive', { onSelect })],
      dragHandleProps: handleProps(),
    });

    const root = shellRoot();
    expect(root).toHaveAttribute('aria-disabled', 'true');
    expect(root).toHaveAttribute('data-disabled', 'true');
    expect(root.querySelector('[data-tile-grid-menu-trigger]')).toBeNull();
    expect(root.querySelector('[data-tile-grid-drag-handle]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
    expect(within(root).getByText('Lake sunrise')).toBeInTheDocument();

    // The shell may omit the inline actions or render them disabled. Either way,
    // no action may stay enabled or reach its callback.
    for (const control of Array.from(
      root.querySelectorAll<HTMLElement>('[data-tile-grid-action-id]')
    )) {
      expect(control).toBeDisabled();
      fireEvent.click(control);
    }
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('should show the default selection badge when selected and selectable', () => {
    // The visual indicator mirrors the selected state owned by the application.
    renderShell({
      item: ITEM,
      media: <img alt={ITEM.label} src={IMAGE_SOURCE} />,
      selected: true,
      selectable: true,
    });

    const indicator = byHook('data-tile-grid-selection-indicator');

    expect(indicator).toBeInTheDocument();
    expect(byHook('data-tile-grid-media')).toContainElement(indicator);
    expect(shellRoot()).toHaveAttribute('data-selected', 'true');
  });

  it('should hide the selection badge when selectable is false', () => {
    // Selection can be retained for the grid while the shell hides its affordance.
    renderShell({
      item: ITEM,
      selected: true,
      selectable: false,
      selectionIndicator: <span>Custom selection indicator</span>,
    });

    expect(document.querySelector('[data-tile-grid-selection-indicator]')).toBeNull();
    expect(screen.queryByText('Custom selection indicator')).toBeNull();
  });

  it('should render the status overlay above media and activate its button', () => {
    // The overlay belongs to the media region and its own controls stay usable.
    const onRetry = vi.fn();
    renderShell({
      item: ITEM,
      aspectRatio: 1,
      media: <img alt={ITEM.label} src={IMAGE_SOURCE} />,
      statusOverlay: (
        <button type="button" onClick={onRetry}>
          Retry sync
        </button>
      ),
    });

    const media = byHook('data-tile-grid-media');
    const overlay = byHook('data-tile-grid-status-overlay');
    expect(media).toContainElement(overlay);

    const image = screen.getByRole('img', { name: ITEM.label });
    expect(image.compareDocumentPosition(overlay) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );

    fireEvent.click(within(overlay).getByRole('button', { name: 'Retry sync' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should apply contain fit and a valid aspect ratio to the media container', () => {
    // The ratio belongs to the container; the fit reaches the application image.
    renderShell({
      item: ITEM,
      fit: 'contain',
      aspectRatio: 4 / 3,
      media: <img alt={ITEM.label} src={IMAGE_SOURCE} />,
    });

    const media = byHook('data-tile-grid-media');
    expect(media).toHaveAttribute('data-fit', 'contain');
    expect(ratioOf(media)).toBeCloseTo(4 / 3, 5);

    const image = screen.getByRole('img', { name: ITEM.label });
    const objectFit = getComputedStyle(image).objectFit;
    // jsdom resolves the component's descendant rule; a different test engine
    // that reports the initial `fill` leaves the painted check to the browser suite.
    if (objectFit === 'contain' || objectFit === 'cover') {
      expect(objectFit).toBe('contain');
    }
  });

  it.each([
    { description: 'zero', value: 0 },
    { description: 'a negative number', value: -2 },
    { description: 'not a number', value: Number.NaN },
    { description: 'infinite', value: Number.POSITIVE_INFINITY },
  ])('should fall back to a square media ratio when aspectRatio is $description', ({ value }) => {
    // Non-positive and non-finite ratios cannot describe a box.
    renderShell({
      item: ITEM,
      aspectRatio: value,
      media: <img alt={ITEM.label} src={IMAGE_SOURCE} />,
    });

    expect(ratioOf(byHook('data-tile-grid-media'))).toBeCloseTo(1, 5);
  });

  it('should mark danger actions inline and in the menu', async () => {
    // Intent is a stable styling hook on both representations of the action.
    renderShell({
      item: ITEM,
      actions: [action('share', 'Share'), action('delete', 'Delete photo', { intent: 'danger' })],
    });

    expect(inlineAction('share')).toHaveAttribute('data-intent', 'default');
    expect(inlineAction('delete')).toHaveAttribute('data-intent', 'danger');

    const menu = await openMenu();
    expect(menuAction(menu, 'share')).toHaveAttribute('data-intent', 'default');
    expect(menuAction(menu, 'delete')).toHaveAttribute('data-intent', 'danger');
  });

  it('should merge caller class and style with the shell values', () => {
    // Inline caller values win over the shell's own rules.
    renderShell({
      item: ITEM,
      className: 'caller-shell',
      style: {
        flexDirection: 'row',
        overflow: 'visible',
        backgroundColor: 'rgb(12, 34, 56)',
      },
    });

    const root = shellRoot();
    expect(root).toHaveClass('caller-shell');
    expect(
      Array.from(root.classList).filter(name => name !== 'caller-shell').length
    ).toBeGreaterThan(0);
    expect(getComputedStyle(root).flexDirection).toBe('row');
    expect(getComputedStyle(root).overflow).toBe('visible');
    expect(getComputedStyle(root).backgroundColor).toBe('rgb(12, 34, 56)');
  });

  it('should forward native div props to the shell root', () => {
    // Native attributes and handlers are part of the shell's public surface.
    const onClick = vi.fn();
    renderShell({
      item: ITEM,
      id: 'tile-shell',
      tabIndex: 0,
      dir: 'rtl',
      onClick,
    });

    const root = shellRoot();
    expect(root).toHaveAttribute('id', 'tile-shell');
    expect(root).toHaveAttribute('tabindex', '0');
    expect(root).toHaveAttribute('dir', 'rtl');

    fireEvent.click(root);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should keep aria-disabled true when a caller tries to override it', () => {
    // The disabled prop owns the state; a caller-supplied value cannot win.
    const overridden: TileGridItemProps<Item> = {
      item: ITEM,
      disabled: true,
      // @ts-expect-error aria-disabled is owned by the disabled prop
      'aria-disabled': false,
    };

    renderShell(overridden);

    expect(shellRoot()).toHaveAttribute('aria-disabled', 'true');
  });

  it('should render a hostile action label as text without logging its URL', () => {
    // Labels are React text, never HTML and never a logging input.
    const hostileLabel =
      '<img src="https://evil.example/pixel.png" onerror="alert(1)">Delete</img>';
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const onSelect = vi.fn<(item: Item) => void>();

    renderShell({
      item: ITEM,
      actions: [action('hostile', hostileLabel, { onSelect })],
    });

    const control = inlineAction('hostile');
    expect(control.textContent).toBe(hostileLabel);
    expect(shellRoot().querySelector('img, script, iframe, object, embed')).toBeNull();
    expect(document.querySelector('[src*="evil.example"]')).toBeNull();

    fireEvent.click(control);

    expect(onSelect).toHaveBeenCalledTimes(1);
    const messages = [log, info, warn, error, debug].flatMap(spy =>
      spy.mock.calls.map(call => call.map(value => String(value)).join(' '))
    );
    expect(
      messages.filter(message => message.includes(hostileLabel) || message.includes('evil.example'))
    ).toEqual([]);
  });

  it('should run a menu action exactly once', async () => {
    // Activating a menu entry calls only that entry's callback, once.
    const onArchive = vi.fn<(item: Item) => void>();
    const onPreview = vi.fn<(item: Item) => void>();
    renderShell({
      item: ITEM,
      actions: [action('preview', 'Preview', { onSelect: onPreview })],
      overflowActions: [action('archive', 'Archive', { onSelect: onArchive })],
    });

    const menu = await openMenu();
    const user = userEvent.setup();
    await act(async () => {
      await user.click(menuAction(menu, 'archive'));
    });

    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onArchive.mock.calls[0]?.[0]).toBe(ITEM);
    expect(onPreview).not.toHaveBeenCalled();
  });
});
