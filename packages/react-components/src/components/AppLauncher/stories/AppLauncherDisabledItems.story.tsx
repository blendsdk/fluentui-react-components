import { Text } from '@fluentui/react-components';
import { CalendarClock20Regular, CalendarClock32Regular } from '@fluentui/react-icons';
import { useRef } from 'react';
import { AppLauncher } from '../AppLauncher';
import { AppLauncherSection } from '../../AppLauncherSection';
import {
  AppBar,
  AppRows,
  AppTiles,
  Brand,
  Captions,
  LauncherTriggerButton,
  Page,
  useActivatingLauncher,
} from './AppLauncherStoryApps.story';
import type { AppEntry } from './AppLauncherStoryApps.story';
import { InsightsLogo, MailLogo } from './AppLauncherStoryLogos.story';

const items: AppEntry[] = [
  { label: 'Mail', icon: <MailLogo />, smallIcon: <MailLogo size={20} /> },
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
  {
    label: 'Insights',
    icon: <InsightsLogo />,
    smallIcon: <InsightsLogo size={20} />,
    disabled: true,
  },
];

/**
 * The two disabled flavors side by side, in tiles and in rows. `disabled`
 * mutes the item, removes it from the tab order and blocks activation.
 * `disabledFocusable` shows the same muted look and never activates either,
 * but the item is announced as disabled and stays reachable with the
 * keyboard — useful when an application wants the disabled item to be
 * focusable, for example to explain why it is disabled.
 */
export const DisabledItems = () => {
  const barRef = useRef<HTMLElement>(null);
  const launcher = useActivatingLauncher();

  return (
    <Page>
      <AppBar ref={barRef}>
        <AppLauncher
          trigger={<LauncherTriggerButton />}
          dockTarget={barRef}
          open={launcher.open}
          onOpenChange={launcher.onOpenChange}
        >
          <AppLauncherSection title="Tiles">
            <AppTiles items={items} onActivate={launcher.close} />
          </AppLauncherSection>
          <AppLauncherSection title="Rows" divider>
            <AppRows items={items} onActivate={launcher.close} />
          </AppLauncherSection>
        </AppLauncher>
        <Brand />
      </AppBar>
      <Captions>
        <Text size={500} weight="semibold">
          Disabled items
        </Text>
        <Text>
          Bookings and Insights render disabled: the name and the logo are muted, the items leave
          the tab order and never activate. Bookings (focusable) renders disabledFocusable: the same
          muted look and the same never-activating behavior, but the item keeps its place in the tab
          order and is announced as disabled when focused.
        </Text>
      </Captions>
    </Page>
  );
};
