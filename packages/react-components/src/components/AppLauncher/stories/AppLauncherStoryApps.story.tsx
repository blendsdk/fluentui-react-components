import { makeStyles, tokens } from '@fluentui/react-components';
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
  Mail32Regular,
  PeopleTeam20Regular,
  PeopleTeam32Regular,
  Settings20Regular,
  Settings32Regular,
  Video20Regular,
  Video32Regular,
} from '@fluentui/react-icons';
import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { AppLauncherGrid } from '../../AppLauncherGrid';
import { AppLauncherItem } from '../../AppLauncherItem';
import { AppLauncherList } from '../../AppLauncherList';
import type { AppLauncherProps } from '../AppLauncher.types';
import {
  ChatLogo,
  FilesLogo,
  InsightsLogo,
  MailLogo,
  NotesLogo,
  WhiteboardLogo,
} from './AppLauncherStoryLogos.story';

/**
 * One app of the sample sets: the label the item shows, the icon sized for the
 * layout it appears in, and the disabled flavors.
 */
export type AppEntry = {
  label: string;
  /** Icon sized for the grid tiles — a Fluent `*32` icon or a logo. */
  icon: ReactElement;
  /**
   * Optional smaller icon sized for the compact list rows (`*20` Fluent
   * icons, or a logo at `size={20}`). The stress sample omits it and falls
   * back to `icon`.
   */
  smallIcon?: ReactElement;
  /**
   * When true the item renders disabled: muted, unfocusable and never
   * activating.
   */
  disabled?: boolean;
  /**
   * When true the item renders `disabledFocusable`: announced disabled and
   * never activating, but still reachable with the keyboard.
   */
  disabledFocusable?: boolean;
};

/**
 * Apps of the stories, sized like the Microsoft 365 launcher tiles.
 *
 * The icons deliberately mix the two treatments an application can pass: a
 * monochrome Fluent icon, or a colorful logo element. `Bookings` and
 * `Insights` render disabled, so the disabled look sits next to the enabled
 * tiles; `Bookings (focusable)` renders `disabledFocusable` beside `Bookings`
 * so the two disabled flavors can be compared, and `Contoso Resource
 * Planning` carries a deliberately long name to compare wrapping (tiles)
 * with ellipsizing (rows).
 */
export const apps: AppEntry[] = [
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
    label: 'Contoso Resource Planning',
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

/** Apps pinned to the top of the kitchen-sink story. */
export const pinnedApps = apps.slice(0, 3);

/** The remaining apps, shown under the "All apps" title. */
export const allApps = apps.slice(3);

/** The apps the kitchen-sink story treats as recently used on first open. */
export const initialRecentLabels = ['Mail', 'Calendar', 'Chat'];

/**
 * Icon cycle for the full-dock story. Stored as components rather than JSX
 * elements so the list is not mistaken for renderable content.
 */
const stressIcons = [
  Mail32Regular,
  CalendarLtr32Regular,
  Globe32Regular,
  PeopleTeam32Regular,
  Video32Regular,
  Document32Regular,
];

/** Enough tiles to make the full docking story scroll. */
export const stressApps: AppEntry[] = Array.from({ length: 40 }, (_, index) => {
  const Icon = stressIcons[index % stressIcons.length] ?? Mail32Regular;

  return {
    label: `App ${index + 1}`,
    icon: <Icon />,
    // Every tenth tile stands in for an app disabled by business rules.
    disabled: (index + 1) % 10 === 0,
  };
});

/**
 * Keeps the open state of a story launcher so activating an app closes the
 * panel, the way a launcher behaves. The package leaves that behavior to the
 * application: it renders whatever the caller composes and cannot know that
 * an item was activated.
 *
 * @param onOpen - called right before the panel opens, for state that should
 *   be applied at open time (the recent order in the kitchen-sink story)
 * @returns the open state, the change handler and a close helper for clicks
 */
export function useActivatingLauncher(onOpen?: () => void) {
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
 * @param props.onActivate - called with the app when its tile is activated
 */
export function AppTiles({
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
 * @param props.onActivate - called with the app when its row is activated
 */
export function AppRows({
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

const useFrameStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '560px',
    margin: '24px',
    padding: '16px',
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
  },
});

/**
 * A page frame for a launcher story: the neutral surface applications mount
 * the launcher into.
 */
export function Page({ children }: { children: ReactNode }) {
  const styles = useFrameStyles();

  return <div className={styles.page}>{children}</div>;
}

/**
 * The caption card under a launcher: what the story demonstrates, in a
 * content card on the page background.
 */
export function Captions({ children }: { children: ReactNode }) {
  const styles = useFrameStyles();

  return <div className={styles.card}>{children}</div>;
}
