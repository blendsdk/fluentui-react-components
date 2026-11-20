import { makeStyles, tokens } from '@fluentui/react-components';
import {
  CalendarLtr20Regular,
  GridDots20Regular,
  Mail20Regular,
  Settings20Regular,
} from '@fluentui/react-icons';
import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { AppBar } from '../AppBar';
import { AppBarButton } from '../../AppBarButton';
import { AppBarSpacer } from '../../AppBarSpacer';
import { AppBarTitle } from '../../AppBarTitle';
import { AppLauncher } from '../../AppLauncher';
import { AppLauncherGrid } from '../../AppLauncherGrid';
import { AppLauncherItem } from '../../AppLauncherItem';
import { AppLauncherSection } from '../../AppLauncherSection';

/** Story-only layout; the shared decorator supplies `FluentProvider`. */
const useStyles = makeStyles({
  frame: {
    display: 'grid',
    alignContent: 'start',
    gap: tokens.spacingVerticalM,
    minHeight: '360px',
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  caption: {
    color: tokens.colorNeutralForeground2,
    maxWidth: '640px',
    margin: 0,
  },
});

/**
 * The canonical AppBar + AppLauncher composition.
 *
 * The launcher is open on load so the docked panel, the 22% trigger highlight
 * and the panel content are visible immediately. The trigger, Escape, an
 * outside click and an item activation all close it; the application owns that
 * state.
 */
export function WithLauncher(): ReactElement {
  const styles = useStyles();
  const barRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(true);

  return (
    <div className={styles.frame}>
      <AppBar ref={barRef} aria-label="Application with launcher">
        <AppLauncher
          trigger={<AppBarButton aria-label="App launcher" icon={<GridDots20Regular />} />}
          dockTarget={barRef}
          open={open}
          onOpenChange={(_event, data) => setOpen(data.open)}
        >
          <AppLauncherSection title="Apps">
            <AppLauncherGrid>
              <AppLauncherItem
                label="Mail"
                icon={<Mail20Regular />}
                onClick={() => setOpen(false)}
              />
              <AppLauncherItem
                label="Calendar"
                icon={<CalendarLtr20Regular />}
                onClick={() => setOpen(false)}
              />
              <AppLauncherItem
                label="Settings"
                icon={<Settings20Regular />}
                onClick={() => setOpen(false)}
              />
            </AppLauncherGrid>
          </AppLauncherSection>
        </AppLauncher>
        <AppBarTitle>Contoso</AppBarTitle>
        <AppBarSpacer />
        <AppBarButton aria-label="Settings" icon={<Settings20Regular />} />
      </AppBar>
      <p className={styles.caption}>
        The AppBar hosts the existing AppLauncher: the waffle is an AppBarButton, the panel docks
        below the bar, and the trigger keeps the 22% open highlight while the launcher is open.
        Close it with the waffle, Escape, an outside click or an item activation.
      </p>
    </div>
  );
}
