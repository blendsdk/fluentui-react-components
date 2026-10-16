import {
  Button,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderNavigation,
  makeStyles,
  OverlayDrawer,
  Text,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  tokens,
} from '@fluentui/react-components';
import {
  CalendarClock20Regular,
  CalendarClock32Regular,
  CalendarLtr20Regular,
  CalendarLtr32Regular,
  Document20Regular,
  Document32Regular,
  Folder20Regular,
  Folder32Regular,
  Globe20Regular,
  Globe32Regular,
  GridDots20Regular,
  Home20Regular,
  Mail32Regular,
  PeopleTeam20Regular,
  PeopleTeam32Regular,
  Settings20Regular,
  Settings32Regular,
  Video20Regular,
  Video32Regular,
} from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement, RefObject } from 'react';
import { createElement, useRef, useState } from 'react';
import { AppLauncherGrid } from '../AppLauncherGrid';
import { AppLauncherItem } from '../AppLauncherItem';
import { AppLauncherList } from '../AppLauncherList';
import { AppLauncherSearch } from '../AppLauncherSearch';
import { AppLauncherSection } from '../AppLauncherSection';
import { AppLauncher } from './AppLauncher';
import type { AppLauncherProps } from './AppLauncher.types';

const meta: Meta<typeof AppLauncher> = {
  title: 'Components/AppLauncher',
  component: AppLauncher,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The launcher shell: a waffle trigger that opens a docked panel of application tiles',
          'and rows. The application owns the data and the open state; the samples below show the',
          'full workbench set — the Microsoft 365 flow, full docking, a trigger-anchored list, a',
          'drawer toolbar and a German launcher.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Docking geometry — in Microsoft365Flow, open the panel: it sits flush below the bar, edge to edge.',
          '2. Full docking — in FullDocking, the panel reaches the window bottom, scrolls internally, and the search field stays pinned on top while the tiles scroll under it.',
          '3. Tooltip suppression — focus the closed waffle: the tooltip appears; open the panel and focus it again: no tooltip floats over the panel.',
          '4. Tile hover — hover a tile: it lifts with a soft shadow and paints above its neighbors.',
          '5. Keyboard flow — Tab moves through the panel, Enter/Space activate an item, the first Escape clears a query and the second closes the panel.',
          '6. Drawer toolbar — in DrawerToolbar, the waffle sits between the Home and Settings commands and opens the panel below itself, floating over the page.',
          '7. Localization — in Localized, every string is German: trigger label, field name and placeholder, clear button and the empty state.',
          '8. Accessibility addon — the a11y panel reports no violations for every story.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AppLauncher>;

type AppEntry = {
  label: string;
  /** Icon sized for the grid tiles — a Fluent `*32` icon or a logo. */
  icon: ReactElement;
  /** Smaller icon for the compact list rows; the stress sample falls back to `icon`. */
  smallIcon?: ReactElement;
  /** Renders the item disabled — business-rule disabled apps. */
  disabled?: boolean;
  /** Renders the item `disabledFocusable`: announced disabled, still reachable. */
  disabledFocusable?: boolean;
};

/**
 * Hand-drawn sample logos: a white glyph on a colored rounded square, the way
 * an application passes a colorful product mark instead of a monochrome Fluent
 * icon. Each logo scales with `size` and is hidden from assistive technology —
 * the item label carries the accessible name.
 */
function MailLogo({ size = 40 }: { size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="38" height="38" rx="9" fill="#2563eb" />
      <rect x="9" y="13" width="22" height="14" rx="2" fill="#ffffff" />
      <path
        d="M10 15l10 7 10-7"
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** White folder on an amber square. */
function FilesLogo({ size = 40 }: { size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="38" height="38" rx="9" fill="#f59e0b" />
      <path
        d="M9 15.5A2.5 2.5 0 0 1 11.5 13h5.4l2.6 3h8A2.5 2.5 0 0 1 30 18.5v7A2.5 2.5 0 0 1 27.5 28h-16A2.5 2.5 0 0 1 9 25.5z"
        fill="#ffffff"
      />
    </svg>
  );
}

/** White speech bubble on a green square. */
function ChatLogo({ size = 40 }: { size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="38" height="38" rx="9" fill="#10b981" />
      <rect x="9" y="12" width="22" height="15" rx="3.5" fill="#ffffff" />
      <path d="M14.5 26.5l3.2 4.5V26.5z" fill="#ffffff" />
      <circle cx="15.5" cy="19.5" r="1.6" fill="#10b981" />
      <circle cx="20" cy="19.5" r="1.6" fill="#10b981" />
      <circle cx="24.5" cy="19.5" r="1.6" fill="#10b981" />
    </svg>
  );
}

/** White page with writing lines on a rose square. */
function NotesLogo({ size = 40 }: { size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="38" height="38" rx="9" fill="#e11d48" />
      <rect x="11" y="9" width="18" height="22" rx="3" fill="#ffffff" />
      <rect x="14.5" y="14.5" width="11" height="1.8" rx="0.9" fill="#e11d48" />
      <rect x="14.5" y="19" width="11" height="1.8" rx="0.9" fill="#e11d48" />
      <rect x="14.5" y="23.5" width="7" height="1.8" rx="0.9" fill="#e11d48" />
    </svg>
  );
}

/** White board with a scribble on a violet square. */
function WhiteboardLogo({ size = 40 }: { size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="38" height="38" rx="9" fill="#7c3aed" />
      <rect x="9" y="10" width="22" height="16" rx="2.5" fill="#ffffff" />
      <path
        d="M13 21.5c2.2-4.4 4.2-6.6 6.2-6.6 1.8 0 2.5 2.6 4.2 2.6 1.3 0 2.4-1.1 3.6-3.2"
        fill="none"
        stroke="#7c3aed"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 29l3.5-3 3.5 3"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Rising white bars on an orange square. */
function InsightsLogo({ size = 40 }: { size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="38" height="38" rx="9" fill="#ea580c" />
      <rect x="12" y="21" width="4" height="8" rx="1.4" fill="#ffffff" />
      <rect x="18" y="16" width="4" height="13" rx="1.4" fill="#ffffff" />
      <rect x="24" y="12" width="4" height="17" rx="1.4" fill="#ffffff" />
    </svg>
  );
}

/**
 * Apps of the samples, sized like the Microsoft 365 launcher tiles. The icons
 * mix monochrome Fluent icons with colorful logos; `Bookings` and `Insights`
 * are disabled, `Bookings (focusable)` renders `disabledFocusable` beside
 * `Bookings` so the two disabled treatments can be compared, and
 * `Resource Planning` carries a long name to compare tile wrapping with row
 * ellipsizing.
 */
const apps: AppEntry[] = [
  { label: 'Mail', icon: <MailLogo />, smallIcon: <MailLogo size={20} /> },
  { label: 'Calendar', icon: <CalendarLtr32Regular />, smallIcon: <CalendarLtr20Regular /> },
  { label: 'Files', icon: <FilesLogo />, smallIcon: <FilesLogo size={20} /> },
  { label: 'Teams', icon: <PeopleTeam32Regular />, smallIcon: <PeopleTeam20Regular /> },
  { label: 'Chat', icon: <ChatLogo />, smallIcon: <ChatLogo size={20} /> },
  { label: 'Documents', icon: <Document32Regular />, smallIcon: <Document20Regular /> },
  { label: 'Calls', icon: <Video32Regular />, smallIcon: <Video20Regular /> },
  { label: 'Notes', icon: <NotesLogo />, smallIcon: <NotesLogo size={20} /> },
  { label: 'Sites', icon: <Globe32Regular />, smallIcon: <Globe20Regular /> },
  {
    label: 'Bookings',
    icon: <CalendarClock32Regular />,
    smallIcon: <CalendarClock20Regular />,
    disabled: true,
  },
  {
    label: 'Bookings (focusable)',
    icon: <CalendarClock32Regular />,
    smallIcon: <CalendarClock20Regular />,
    disabledFocusable: true,
  },
  { label: 'Whiteboard', icon: <WhiteboardLogo />, smallIcon: <WhiteboardLogo size={20} /> },
  {
    label: 'Resource Planning',
    icon: <Folder32Regular />,
    smallIcon: <Folder20Regular />,
  },
  { label: 'Settings', icon: <Settings32Regular />, smallIcon: <Settings20Regular /> },
  {
    label: 'Insights',
    icon: <InsightsLogo />,
    smallIcon: <InsightsLogo size={20} />,
    disabled: true,
  },
];

/** Apps pinned to the top of the kitchen-sink sample. */
const pinnedApps = apps.slice(0, 3);

/** The remaining apps, shown under the "All apps" title. */
const allApps = apps.slice(3);

/** The apps the kitchen-sink sample treats as recently used on first open. */
const initialRecentLabels = ['Mail', 'Calendar', 'Chat'];

/** Icon cycle for the stress sample, stored as components, not elements. */
const stressIcons = [
  Mail32Regular,
  CalendarLtr32Regular,
  Globe32Regular,
  PeopleTeam32Regular,
  Video32Regular,
  Document32Regular,
];

/**
 * Returns the icon of a stress tile, cycling through the sample icons.
 *
 * @param index - position of the tile in the stress sample
 * @returns the icon element for that position
 */
function stressIcon(index: number): ReactElement {
  const Icon = stressIcons[index % stressIcons.length] ?? Mail32Regular;

  return createElement(Icon);
}

/** Enough tiles to make the full docking sample scroll. */
const stressApps: AppEntry[] = Array.from({ length: 40 }, (_, index) => ({
  label: `App ${index + 1}`,
  icon: stressIcon(index),
  // Every tenth tile stands in for an app disabled by business rules.
  disabled: (index + 1) % 10 === 0,
}));

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  toolbarEnd: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  main: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
});

/**
 * Keeps the open state of a sample launcher so activating an app closes the
 * panel — the package leaves that behavior to the application.
 *
 * @param onOpen - called right before the panel opens, for state that should
 *   be applied at open time (the recent order in the kitchen-sink sample)
 * @returns the open state, the change handler and a close helper for clicks
 */
function useActivatingLauncher(onOpen?: () => void) {
  const [open, setOpen] = useState(false);

  const onOpenChange: NonNullable<AppLauncherProps['onOpenChange']> = (_event, data) => {
    if (data.open) {
      onOpen?.();
    }
    setOpen(data.open);
  };

  return { open, onOpenChange, close: () => setOpen(false) };
}

/**
 * Lays a list of apps out as launcher tiles.
 *
 * @param props - component props
 * @param props.items - apps to render
 * @param props.onActivate - called with the app when its tile is clicked
 */
function AppTiles({
  items,
  onActivate,
}: {
  items: AppEntry[];
  onActivate?: (item: AppEntry) => void;
}) {
  return (
    <AppLauncherGrid>
      {items.map(item => (
        <AppLauncherItem
          key={item.label}
          label={item.label}
          icon={item.icon}
          disabled={item.disabled}
          disabledFocusable={item.disabledFocusable}
          onClick={onActivate ? () => onActivate(item) : undefined}
        />
      ))}
    </AppLauncherGrid>
  );
}

/**
 * Lays a list of apps out as launcher rows.
 *
 * @param props - component props
 * @param props.items - apps to render
 * @param props.onActivate - called with the app when its row is clicked
 */
function AppRows({
  items,
  onActivate,
}: {
  items: AppEntry[];
  onActivate?: (item: AppEntry) => void;
}) {
  return (
    <AppLauncherList>
      {items.map(item => (
        <AppLauncherItem
          key={item.label}
          label={item.label}
          icon={item.smallIcon ?? item.icon}
          disabled={item.disabled}
          disabledFocusable={item.disabledFocusable}
          onClick={onActivate ? () => onActivate(item) : undefined}
        />
      ))}
    </AppLauncherList>
  );
}

/**
 * Frames a sample launcher in a thin application bar — the context the
 * launcher ships into — and passes the bar element to the sample so its panel
 * can dock to it.
 *
 * @param props - component props
 * @param props.render - called with the bar element to render the sample
 */
function LauncherBar({
  render,
}: {
  render: (dockTarget: RefObject<HTMLElement | null>) => ReactElement;
}): ReactElement {
  const styles = useStyles();
  const barRef = useRef<HTMLElement>(null);

  return (
    <header ref={barRef} className={styles.header}>
      {render(barRef)}
    </header>
  );
}

/**
 * The Microsoft 365 flow in one sample: a search field on top, then the recent
 * rows, the pinned tiles and the full grid while the query is empty, and a
 * result list while searching. The open state is controlled so activating an
 * app closes the panel, and the recent order is applied when the panel opens —
 * the list never reshuffles under the pointer while it is open.
 *
 * @param props - component props
 * @param props.dockTarget - the top bar the panel docks to
 */
function M365LauncherSample({ dockTarget }: { dockTarget: RefObject<HTMLElement | null> }) {
  const [query, setQuery] = useState('');
  const [recentLabels, setRecentLabels] = useState(initialRecentLabels);
  // Activations land here first; the order reaches the panel when it opens.
  const pendingRecentLabels = useRef(initialRecentLabels);
  const launcher = useActivatingLauncher(() => setRecentLabels(pendingRecentLabels.current));

  const needle = query.trim().toLowerCase();
  const results =
    needle === '' ? [] : apps.filter(item => item.label.toLowerCase().includes(needle));
  const recentApps = recentLabels
    .map(label => apps.find(item => item.label === label))
    .filter((item): item is AppEntry => item !== undefined);

  const recordUse = (item: AppEntry) => {
    pendingRecentLabels.current = [
      item.label,
      ...pendingRecentLabels.current.filter(label => label !== item.label),
    ].slice(0, 5);
    launcher.close();
  };

  return (
    <AppLauncher
      label="App launcher"
      dockTarget={dockTarget}
      open={launcher.open}
      onOpenChange={launcher.onOpenChange}
    >
      <AppLauncherSearch
        label="Search apps"
        value={query}
        onChange={(_event, data) => setQuery(data.value)}
      />
      {needle === '' ? (
        <>
          <AppLauncherSection title="Recent">
            <AppRows items={recentApps} onActivate={recordUse} />
          </AppLauncherSection>
          <AppLauncherSection title="Pinned" divider>
            <AppTiles items={pinnedApps} onActivate={recordUse} />
          </AppLauncherSection>
          <AppLauncherSection title="All apps" divider>
            <AppTiles items={allApps} onActivate={recordUse} />
          </AppLauncherSection>
        </>
      ) : (
        <AppLauncherSection>
          {results.length === 0 ? (
            <Text>No apps found</Text>
          ) : (
            <AppRows items={results} onActivate={recordUse} />
          )}
        </AppLauncherSection>
      )}
    </AppLauncher>
  );
}

/**
 * The full docking sample: 40 tiles scrolling inside the panel, closing when a
 * tile is activated; an empty query keeps all 40 scrolling, a query filters
 * them.
 *
 * @param props - component props
 * @param props.dockTarget - the top bar the panel docks to
 */
function FullDockSample({ dockTarget }: { dockTarget: RefObject<HTMLElement | null> }) {
  const launcher = useActivatingLauncher();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const results = stressApps.filter(item => item.label.toLowerCase().includes(needle));

  return (
    <AppLauncher
      label="App launcher (full dock)"
      docking="full"
      dockTarget={dockTarget}
      open={launcher.open}
      onOpenChange={launcher.onOpenChange}
    >
      <AppLauncherSearch
        label="Search apps"
        value={query}
        onChange={(_event, data) => setQuery(data.value)}
      />
      <AppTiles items={needle === '' ? stressApps : results} onActivate={launcher.close} />
    </AppLauncher>
  );
}

/** The list sample: the apps as full-width rows, anchored to its trigger. */
function AppListSample() {
  const launcher = useActivatingLauncher();

  return (
    <AppLauncher
      label="App launcher"
      positioning={{ position: 'below', align: 'end' }}
      open={launcher.open}
      onOpenChange={launcher.onOpenChange}
    >
      <AppRows items={apps} onActivate={launcher.close} />
    </AppLauncher>
  );
}

/** The list sample framed in a bar, its trigger at the far end. */
function ListBarSample(): ReactElement {
  const styles = useStyles();

  return (
    <header className={styles.header}>
      <div className={styles.toolbarEnd}>
        <AppListSample />
      </div>
    </header>
  );
}

/**
 * The drawer sample: the waffle as one command of a Fluent `Toolbar` inside an
 * open, non-modal `OverlayDrawer`. The launcher uses the caller-provided
 * trigger slot — a `ToolbarButton` replaces the built-in waffle — and the
 * panel opens below that button, floating over the page.
 */
function DrawerToolbarSample() {
  const styles = useStyles();
  const launcher = useActivatingLauncher();
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <>
      <OverlayDrawer
        modalType="non-modal"
        open={drawerOpen}
        position="start"
        onOpenChange={(_event, data) => setDrawerOpen(data.open)}
      >
        <DrawerHeader>
          <DrawerHeaderNavigation>
            <Toolbar aria-label="Workspace commands">
              <ToolbarGroup role="presentation" className={styles.toolbarEnd}>
                <ToolbarButton aria-label="Home" icon={<Home20Regular />} />
                <AppLauncher
                  trigger={<ToolbarButton aria-label="App launcher" icon={<GridDots20Regular />} />}
                  open={launcher.open}
                  onOpenChange={launcher.onOpenChange}
                >
                  <AppTiles items={apps.slice(3, 9)} onActivate={launcher.close} />
                </AppLauncher>
                <ToolbarButton aria-label="Settings" icon={<Settings20Regular />} />
              </ToolbarGroup>
            </Toolbar>
          </DrawerHeaderNavigation>
        </DrawerHeader>
        <DrawerBody>
          <Text>
            The waffle in this drawer's toolbar opens the launcher below itself, floating over the
            page — docked to nothing.
          </Text>
        </DrawerBody>
      </OverlayDrawer>
      <div className={styles.main}>
        <Button appearance="secondary" onClick={() => setDrawerOpen(open => !open)}>
          Toggle the drawer
        </Button>
      </div>
    </>
  );
}

/**
 * The German sample: the launcher with the built-in trigger and German strings
 * on every prop — the trigger label, the search field name and placeholder,
 * the clear button's accessible name and the empty state.
 */
function LocalizedLauncherSample() {
  const launcher = useActivatingLauncher();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const results = apps.filter(item => item.label.toLowerCase().includes(needle));

  return (
    <AppLauncher label="App-Starter" open={launcher.open} onOpenChange={launcher.onOpenChange}>
      <AppLauncherSearch
        label="Apps durchsuchen"
        placeholder="Suchen"
        dismiss={{ 'aria-label': 'Eingabe löschen' }}
        value={query}
        onChange={(_event, data) => setQuery(data.value)}
      />
      {needle === '' ? (
        <AppTiles items={pinnedApps} onActivate={launcher.close} />
      ) : results.length === 0 ? (
        <Text>Keine Apps gefunden</Text>
      ) : (
        <AppRows items={results} onActivate={launcher.close} />
      )}
    </AppLauncher>
  );
}

/**
 * The kitchen-sink sample: search over recent rows, pinned tiles and the full
 * app grid; typing filters into a result list with an empty state; disabled
 * and `disabledFocusable` apps sit among the enabled ones; activation closes
 * the panel and records the app in the recents.
 */
export const Microsoft365Flow: Story = {
  render: () => <LauncherBar render={bar => <M365LauncherSample dockTarget={bar} />} />,
};

/**
 * Full docking: 40 stress tiles filling the window from the bar down, with
 * every tenth tile disabled, scrolling inside the panel and the search field
 * pinned on top.
 */
export const FullDocking: Story = {
  render: () => <LauncherBar render={bar => <FullDockSample dockTarget={bar} />} />,
};

/**
 * A plain rows list at the far end of the bar, anchored to its trigger with
 * the panel aligned to the trigger's end edge instead of docked to the bar.
 */
export const TriggerAnchoredList: Story = {
  render: () => <ListBarSample />,
};

/**
 * The waffle as one command of a drawer toolbar, between two other commands;
 * the panel opens below that button, floating over the page — docked to
 * nothing. Toggle the drawer to compare the page with and without it.
 */
export const DrawerToolbar: Story = {
  render: () => <DrawerToolbarSample />,
};

/**
 * The launcher in German: every string — trigger label, field name and
 * placeholder, clear button and empty state — is a prop passed at the call
 * site, so the package ships no localized text.
 */
export const Localized: Story = {
  render: () => <LauncherBar render={() => <LocalizedLauncherSample />} />,
};
