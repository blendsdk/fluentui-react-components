import { FluentProvider, tokens, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { SyntheticEvent } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { TileGrid } from '../../src/components/TileGrid';
import type {
  TileGridAction,
  TileGridDragHandleProps,
  TileGridItemRenderArgs,
  TileGridReorderArgs,
  TileGridStrings,
} from '../../src/components/TileGrid';
import { TileGridItem } from '../../src/components/TileGridItem';
import type { TileGridItemProps } from '../../src/components/TileGridItem';
import { createTileGridFixture } from '../fixtures/tileGridFixture';
import type { TileGridFixtureItem } from '../fixtures/tileGridFixture';

/**
 * Real-browser contract for the tile shell.
 *
 * These cases cover the surfaces that only a layout and hit-testing engine can
 * prove: the pointer-only drag handle, the touch fallback through the overflow
 * menu, overlay hit-testing, focus return, and action isolation inside a real
 * grid. Assertions read public DOM hooks, computed styles, and DOM geometry.
 */

const ITEMS = createTileGridFixture(3);
const ITEM = ITEMS[0];
const GRID_LABEL = 'Photos';
const GRID_TIMEOUT = 20_000;
const INITIAL_VIEWPORT = { width: innerWidth, height: innerHeight };

beforeAll(async () => {
  await page.viewport(1280, 900);
});

afterAll(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

/** Props the shell receives without the original item. */
type ShellProps = Omit<TileGridItemProps<TileGridFixtureItem>, 'item'>;

/** Renders one shell in a real, bounded host so media and overlay geometry exists. */
function mountShell(overrides: Partial<ShellProps> = {}) {
  return render(
    <FluentProvider theme={webLightTheme}>
      <div style={{ width: 240 }}>
        <TileGridItem item={ITEM} title={ITEM.label} {...overrides} />
      </div>
    </FluentProvider>
  );
}

/** Returns the shell root or fails with an explicit message. */
function shellRoot(container: HTMLElement): HTMLElement {
  const root = container.querySelector<HTMLElement>('[data-tile-grid-item-shell]');
  if (!root) throw new Error('The tile shell root did not render');
  return root;
}

/** Returns the first element carrying a public tile-shell hook. */
function hook(container: ParentNode, attribute: string): HTMLElement | null {
  return container.querySelector<HTMLElement>(`[${attribute}]`);
}

/** Library-owned handle wiring shaped the way the grid supplies it. */
function handleProps(overrides: Partial<TileGridDragHandleProps> = {}): TileGridDragHandleProps {
  return {
    setNodeRef: () => {},
    attributes: {},
    listeners: {},
    isDragging: false,
    disabled: false,
    label: `Reorder ${ITEM.label}`,
    ...overrides,
  };
}

/** Three representative actions; the last one uses the destructive intent. */
function itemActions(
  onSelect: (item: TileGridFixtureItem) => void
): readonly TileGridAction<TileGridFixtureItem>[] {
  return [
    { id: 'open', label: 'Open', onSelect },
    { id: 'download', label: 'Download', onSelect },
    { id: 'delete', label: 'Delete', intent: 'danger', onSelect },
  ];
}

/** Media query that replaces hover-only inline actions on touch devices. */
const TOUCH_MEDIA = /\(\s*hover\s*:\s*none\s*\)/;

/** Whether a declaration removes the element from layout and focus. */
function hidesContent(style: CSSStyleDeclaration): boolean {
  return (
    style.getPropertyValue('display') === 'none' ||
    style.getPropertyValue('visibility') === 'hidden' ||
    style.getPropertyValue('content-visibility') === 'hidden'
  );
}

/** Whether a selector list matches the element; Griffel may add pseudo states. */
function selectorMatches(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

/**
 * Finds a `(hover: none)` declaration that hides the element.
 *
 * The browser runner exposes no media emulation that can make the engine report
 * a coarse pointer, so the emitted rule is inspected directly. The rule must
 * both sit inside the touch media query and match the element.
 */
function touchHidingRule(element: Element): string | null {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSMediaRule) || !TOUCH_MEDIA.test(rule.media.mediaText)) {
        continue;
      }
      for (const inner of Array.from(rule.cssRules)) {
        if (!(inner instanceof CSSStyleRule) || !hidesContent(inner.style)) continue;
        if (selectorMatches(element, inner.selectorText)) return inner.cssText;
      }
    }
  }
  return null;
}

/** Lets native paint, pointer capture, and React effects settle. */
async function frames() {
  await act(async () => {
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
  });
}

/** Draws the shell from the arguments the grid supplies to its renderer. */
function renderTileShell({
  item,
  selected,
  selectable,
  disabled,
  isDragging,
  isOverlay,
  dragHandleProps,
  reorderActions,
  strings,
}: TileGridItemRenderArgs<TileGridFixtureItem>) {
  return (
    <TileGridItem
      item={item}
      title={item.label}
      selected={selected}
      selectable={selectable}
      disabled={disabled}
      isDragging={isDragging}
      isOverlay={isOverlay}
      dragHandleProps={dragHandleProps}
      reorderActions={reorderActions}
      strings={strings}
    />
  );
}

/** Renders the shell through a small arranging grid. */
function mountGrid(handlers: {
  onItemActivate: (item: TileGridFixtureItem) => void;
  onReorder: (args: TileGridReorderArgs) => void;
}) {
  return render(
    <FluentProvider theme={webLightTheme}>
      <div style={{ width: 640, height: 400 }}>
        <TileGrid
          items={ITEMS}
          getItemId={item => item.id}
          getItemLabel={item => item.label}
          getItemAspectRatio={item => item.aspectRatio}
          renderItem={renderTileShell}
          ariaLabel={GRID_LABEL}
          tileSize={160}
          gap={8}
          selectionMode="multiselect"
          enableMarquee
          reorderable
          {...handlers}
        />
      </div>
    </FluentProvider>
  );
}

describe('TileGridItem browser contract', () => {
  it('should name the default drag handle after the item and keep it out of the tab order', async () => {
    const label = `Reorder ${ITEM.label}`;
    const { container } = render(
      <FluentProvider theme={webLightTheme}>
        <button type="button">Before</button>
        <div style={{ width: 240 }}>
          <TileGridItem item={ITEM} title={ITEM.label} dragHandleProps={handleProps()} />
        </div>
        <button type="button">After</button>
      </FluentProvider>
    );

    const root = shellRoot(container);
    const handle = within(root).getByRole('button', { name: label });
    expect(handle).toHaveAttribute('data-tile-grid-drag-handle');
    expect(handle).toHaveAttribute('type', 'button');
    expect(handle).toHaveAttribute('tabindex', '-1');
    expect(handle).toBeEnabled();
    expect(handle).toHaveAccessibleName(label);
    expect(handle.getAttribute('aria-label') ?? handle.textContent ?? '').toContain(ITEM.label);

    await userEvent.click(screen.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    await waitFor(() => expect(screen.getByRole('button', { name: 'After' })).toHaveFocus());
    expect(handle).not.toHaveFocus();
  });

  it('should keep readable content when square media fills a square tile', async () => {
    const { container } = render(
      <FluentProvider theme={webLightTheme}>
        <div style={{ width: 160, height: 160 }}>
          <TileGridItem
            item={ITEM}
            media={<img alt="Square media" src={ITEM.thumbnailUrl} />}
            title={ITEM.label}
            description="A readable description"
          />
        </div>
      </FluentProvider>
    );
    await frames();

    const root = shellRoot(container);
    const media = hook(container, 'data-tile-grid-media');
    if (!media) throw new Error('The media container did not render');
    const title = within(root).getByText(ITEM.label);
    const mediaRect = media.getBoundingClientRect();

    expect(title).toBeVisible();
    expect(title.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(mediaRect.height).toBeGreaterThan(0);
    expect(mediaRect.height).toBeLessThan(160);
  });

  it('should hand the library drag wiring and state to a custom drag handle', async () => {
    const received: TileGridDragHandleProps[] = [];
    const attributes = {
      'data-dnd-attribute': 'handle',
      'aria-roledescription': 'draggable tile',
    };
    const onPointerDown = vi.fn<(event: SyntheticEvent) => void>();
    const setNodeRef = vi.fn<(node: HTMLElement | null) => void>();
    const supplied = handleProps({
      setNodeRef,
      attributes,
      listeners: { onPointerDown },
      isDragging: true,
    });

    const { container } = mountShell({
      dragHandleProps: supplied,
      dragHandle: props => {
        received.push(props);
        return (
          <button
            type="button"
            data-testid="custom-drag-handle"
            ref={props.setNodeRef}
            {...props.attributes}
            {...props.listeners}
            aria-label={props.label}
          >
            Custom handle
          </button>
        );
      },
    });

    const custom = screen.getByTestId('custom-drag-handle');
    const last = received.at(-1);
    if (!last) throw new Error('The custom drag handle render prop was not called');
    expect(last.setNodeRef).toBe(setNodeRef);
    expect(last.attributes).toMatchObject(attributes);
    expect(Object.keys(last.listeners)).toContain('onPointerDown');
    expect(last.isDragging).toBe(true);
    expect(last.disabled).toBe(false);
    expect(last.label).toBe(`Reorder ${ITEM.label}`);
    expect(custom).toHaveAccessibleName(`Reorder ${ITEM.label}`);
    expect(custom).toHaveAttribute('data-dnd-attribute', 'handle');
    expect(custom).toHaveAttribute('aria-roledescription', 'draggable tile');
    expect(setNodeRef.mock.calls.some(([node]) => node === custom)).toBe(true);
    expect(hook(container, 'data-tile-grid-drag-handle')).toBeNull();

    await userEvent.click(custom);
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    const [event] = onPointerDown.mock.calls[0] ?? [];
    expect(event?.type).toBe('pointerdown');
    expect(event?.target).toBe(custom);
  });

  it('should position a custom drag handle inside a fixed-height tile', async () => {
    const { container } = render(
      <FluentProvider theme={webLightTheme}>
        <div style={{ width: 200, height: 200 }}>
          <TileGridItem
            item={ITEM}
            title={ITEM.label}
            dragHandleProps={handleProps()}
            dragHandle={props => (
              <button
                type="button"
                data-testid="positioned-custom-handle"
                ref={props.setNodeRef}
                {...props.attributes}
                {...props.listeners}
                aria-label={props.label}
              >
                Custom
              </button>
            )}
          />
        </div>
      </FluentProvider>
    );
    await frames();

    const root = shellRoot(container);
    const custom = screen.getByTestId('positioned-custom-handle');
    const rootRect = root.getBoundingClientRect();
    const customRect = custom.getBoundingClientRect();

    expect(customRect.left).toBeGreaterThanOrEqual(rootRect.left);
    expect(customRect.top).toBeGreaterThanOrEqual(rootRect.top);
    expect(customRect.right).toBeLessThanOrEqual(rootRect.right + 1);
    expect(customRect.bottom).toBeLessThanOrEqual(rootRect.bottom + 1);
    expect(rootRect.bottom - customRect.bottom).toBeLessThanOrEqual(16);
  });

  it('should keep every action reachable from the overflow menu while the inline row is hidden for touch media', async () => {
    const onSelect = vi.fn<(item: TileGridFixtureItem) => void>();
    const { container } = mountShell({ actions: itemActions(onSelect) });
    await frames();

    const inline = hook(container, 'data-tile-grid-inline-actions');
    if (!inline) throw new Error('The inline action row did not render');
    const inlineIds = Array.from(
      inline.querySelectorAll<HTMLElement>('[data-tile-grid-action-id]')
    ).map(entry => entry.getAttribute('data-tile-grid-action-id'));
    expect(inlineIds).toEqual(['open', 'download', 'delete']);
    expect(inline.querySelector('[data-tile-grid-action-id="delete"]')).toHaveAttribute(
      'data-intent',
      'danger'
    );

    const touchRule = touchHidingRule(inline);
    if (!touchRule) {
      throw new Error(
        `The inline action row is not hidden by a (hover: none) media rule; classes: ${inline.className}`
      );
    }

    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger).toBeVisible();
    expect(trigger).toHaveAttribute('data-tile-grid-menu-trigger');
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    const entries = within(menu)
      .getAllByRole('menuitem')
      .map(entry => entry.textContent?.trim());
    expect(entries).toEqual(['Open', 'Download', 'Delete']);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("should let only the status overlay's interactive content receive pointer events above the media", async () => {
    const onRetry = vi.fn();
    const { container } = mountShell({
      aspectRatio: 1,
      media: (
        <img
          alt="Lake preview"
          src={ITEM.thumbnailUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ),
      statusOverlay: (
        <button type="button" onClick={onRetry}>
          Retry upload
        </button>
      ),
    });
    await frames();

    const media = hook(container, 'data-tile-grid-media');
    if (!media) throw new Error('The media container did not render');
    const overlay = hook(container, 'data-tile-grid-status-overlay');
    if (!overlay) throw new Error('The status overlay did not render');
    expect(media).toContainElement(overlay);

    const image = screen.getByRole('img', { name: 'Lake preview' });
    expect(image.compareDocumentPosition(overlay) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );

    const mediaRect = media.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    expect(mediaRect.width).toBeGreaterThan(0);
    expect(mediaRect.height).toBeGreaterThan(0);
    expect(Math.abs(overlayRect.width - mediaRect.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(overlayRect.height - mediaRect.height)).toBeLessThanOrEqual(1);
    expect(getComputedStyle(overlay).pointerEvents).toBe('none');

    const retry = within(overlay).getByRole('button', { name: 'Retry upload' });
    expect(getComputedStyle(retry).pointerEvents).toBe('auto');
    const rect = retry.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    if (!hit) throw new Error('The status overlay button is outside the viewport');
    expect(hit === retry || retry.contains(hit)).toBe(true);

    await userEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should paint the contain fit and the danger foreground', async () => {
    const danger: TileGridAction<TileGridFixtureItem> = {
      id: 'delete',
      label: 'Delete',
      intent: 'danger',
      onSelect: () => {},
    };
    const { container } = mountShell({
      fit: 'contain',
      aspectRatio: 1,
      media: <img alt="Fit preview" src={ITEM.thumbnailUrl} />,
      actions: [danger],
    });
    await frames();

    const image = screen.getByRole('img', { name: 'Fit preview' });
    expect(getComputedStyle(image).objectFit).toBe('contain');

    const root = shellRoot(container);
    const probe = document.createElement('span');
    probe.style.color = tokens.colorPaletteRedForeground1;
    root.appendChild(probe);
    const expectedColor = getComputedStyle(probe).color;
    const button = root.querySelector<HTMLElement>('[data-tile-grid-action-id="delete"]');
    if (!button) throw new Error('The danger action did not render');
    expect(getComputedStyle(button).color).toBe(expectedColor);
    probe.remove();
  });

  it('should fade the source tile while it is dragged', async () => {
    const { container } = mountShell({ isDragging: true });
    await frames();

    expect(getComputedStyle(shellRoot(container)).opacity).toBe('0.5');
  });

  it('should remove actions, the menu, and the handle and ignore pointer events in the overlay copy', async () => {
    const onSelect = vi.fn<(item: TileGridFixtureItem) => void>();
    const { container } = mountShell({
      actions: itemActions(onSelect),
      overflowActions: [{ id: 'share', label: 'Share', onSelect }],
      dragHandleProps: handleProps(),
      isDragging: true,
      isOverlay: true,
    });

    const root = shellRoot(container);
    expect(root).toHaveAttribute('data-overlay', 'true');
    expect(getComputedStyle(root).pointerEvents).toBe('none');
    expect(getComputedStyle(root).opacity).toBe('1');
    expect(hook(container, 'data-tile-grid-inline-actions')).toBeNull();
    expect(hook(container, 'data-tile-grid-menu-trigger')).toBeNull();
    expect(hook(container, 'data-tile-grid-drag-handle')).toBeNull();
    expect(container.querySelectorAll('[data-tile-grid-action-id]')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
    expect(screen.queryByRole('button', { name: `Reorder ${ITEM.label}` })).toBeNull();
    expect(within(root).getByText(ITEM.label)).toBeVisible();
  });

  it('should name the menu trigger from the strings, fire one action, and restore focus to the trigger', async () => {
    const onOpen = vi.fn<(item: TileGridFixtureItem) => void>();
    const strings: Partial<TileGridStrings> = { moreActions: 'Photo commands' };
    mountShell({
      actions: [{ id: 'open', label: 'Open', onSelect: onOpen }],
      strings,
    });

    const trigger = screen.getByRole('button', { name: 'Photo commands' });
    expect(trigger).toHaveAttribute('data-tile-grid-menu-trigger');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    await userEvent.click(trigger);
    const entry = await screen.findByRole('menuitem', { name: 'Open' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Photo commands' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await userEvent.click(entry);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(ITEM);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('should run an inline shell action without changing selection or drag state', async () => {
    const onOpen = vi.fn<(item: TileGridFixtureItem) => void>();
    const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();

    function renderActionTile(args: TileGridItemRenderArgs<TileGridFixtureItem>) {
      return (
        <TileGridItem
          item={args.item}
          title={args.item.label}
          selected={args.selected}
          selectable={args.selectable}
          actions={[{ id: 'open', label: 'Open', onSelect: onOpen }]}
          reorderActions={args.reorderActions}
          dragHandleProps={args.dragHandleProps}
          strings={args.strings}
        />
      );
    }

    render(
      <FluentProvider theme={webLightTheme}>
        <div style={{ width: 640, height: 400 }}>
          <TileGrid
            items={ITEMS}
            getItemId={item => item.id}
            getItemLabel={item => item.label}
            getItemAspectRatio={item => item.aspectRatio}
            renderItem={renderActionTile}
            ariaLabel={GRID_LABEL}
            tileSize={160}
            gap={8}
            selectionMode="multiselect"
            defaultSelectedIds={[ITEM.id]}
            reorderable
            onReorder={onReorder}
          />
        </div>
      </FluentProvider>
    );

    const item = await screen.findByRole('listitem', { name: ITEM.label });
    await userEvent.hover(item);
    const action = within(item).getByRole('button', { name: 'Open' });
    const shell = item.querySelector<HTMLElement>('[data-tile-grid-item-shell]');
    if (!shell) throw new Error('The shell root did not render');
    expect(shell).toHaveAttribute('data-selected', 'true');

    await userEvent.click(action);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(ITEM);
    expect(shell).toHaveAttribute('data-selected', 'true');
    expect(onReorder).not.toHaveBeenCalled();
    expect(document.querySelector('[data-tile-grid-overlay]')).toBeNull();
  });

  it(
    'should run the grid keyboard reorder action through the shell menu and share the announcement',
    async () => {
      const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();
      mountGrid({ onItemActivate: vi.fn(), onReorder });

      const item = await screen.findByRole('listitem', { name: ITEM.label });
      const trigger = within(item).getByRole('button', { name: 'More actions' });
      await userEvent.click(trigger);
      const moveDown = await screen.findByRole('menuitem', { name: 'Move down' });
      await userEvent.click(moveDown);

      expect(onReorder).toHaveBeenCalledTimes(1);
      const [args] = onReorder.mock.calls[0] ?? [];
      if (!args) throw new Error('The reorder callback did not receive a payload');
      expect(args.itemId).toBe(ITEM.id);
      expect(args.fromIndex).toBe(0);
      expect(args.toIndex).toBe(1);
      expect(args.orderedIds).toHaveLength(ITEMS.length);
      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent('Moved to position 2 of 3')
      );
      await waitFor(() => expect(trigger).toHaveFocus());
    },
    GRID_TIMEOUT
  );

  it(
    'should not start a marquee or activate the tile from the default drag handle',
    async () => {
      const onItemActivate = vi.fn<(item: TileGridFixtureItem) => void>();
      const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();
      mountGrid({ onItemActivate, onReorder });

      const root = await screen.findByRole('list', { name: GRID_LABEL });
      await screen.findByRole('listitem', { name: ITEM.label });
      const handle = screen.getByRole('button', { name: `Reorder ${ITEM.label}` });
      expect(handle).toHaveAttribute('data-tile-grid-drag-handle');
      expect(handle).toHaveAttribute('tabindex', '-1');

      const handleRect = handle.getBoundingClientRect();
      const neighbour = screen
        .getByRole('listitem', { name: ITEMS[1].label })
        .getBoundingClientRect();
      const pointerId = 91;
      const target = {
        clientX: neighbour.left + neighbour.width * 0.8,
        clientY: neighbour.top + neighbour.height / 2,
      };

      fireEvent.pointerDown(handle, {
        pointerId,
        isPrimary: true,
        button: 0,
        clientX: handleRect.left + handleRect.width / 2,
        clientY: handleRect.top + handleRect.height / 2,
        bubbles: true,
      });
      await frames();
      // The first move crosses the sensor's 4px activation distance; the
      // second move updates the insertion after the drag is active.
      fireEvent.pointerMove(handle, {
        pointerId,
        isPrimary: true,
        clientX: handleRect.left + handleRect.width / 2 + 12,
        clientY: handleRect.top + handleRect.height / 2,
        bubbles: true,
      });
      await frames();
      fireEvent.pointerMove(handle, {
        pointerId,
        isPrimary: true,
        ...target,
        bubbles: true,
      });
      await frames();

      expect(document.querySelector('[data-tile-grid-overlay]')).not.toBeNull();
      expect(handle).not.toHaveAttribute('aria-pressed');
      expect(handle).not.toHaveAttribute('aria-describedby');
      expect(root.querySelector('[data-tile-grid-marquee]')).toBeNull();
      expect(onItemActivate).not.toHaveBeenCalled();

      fireEvent.pointerUp(handle, {
        pointerId,
        isPrimary: true,
        button: 0,
        ...target,
        bubbles: true,
      });
      await frames();
      fireEvent.click(handle);

      expect(onItemActivate).not.toHaveBeenCalled();
      expect(onReorder).toHaveBeenCalledTimes(1);
      expect(root.querySelector('[data-tile-grid-marquee]')).toBeNull();
    },
    GRID_TIMEOUT
  );
});
