import { Text } from '@fluentui/react-components';
import { useRef, useState } from 'react';
import { GridDots20Regular } from '@fluentui/react-icons';
import { AppLauncher } from '../AppLauncher';
import { AppBar } from '../../AppBar';
import { AppBarButton } from '../../AppBarButton';
import { AppBarTitle } from '../../AppBarTitle';
import { AppLauncherSection } from '../../AppLauncherSection';
import {
  AppRows,
  Captions,
  Page,
  apps,
  initialRecentLabels,
  useActivatingLauncher,
} from './AppLauncherStoryApps.story';
import type { AppEntry } from './AppLauncherStoryApps.story';

/**
 * Controlled open state: the story owns `open` and `onOpenChange`, which is
 * what lets activating an app close the panel — the package cannot know that
 * an item was activated, because it receives plain children. Activations
 * also record the app as recently used: the new order is applied the next
 * time the panel opens, so the list never reshuffles under the pointer while
 * it is open.
 */
export const ControlledOpen = () => {
  const barRef = useRef<HTMLElement>(null);
  const [recentLabels, setRecentLabels] = useState(initialRecentLabels);
  // Activations land here first; the order reaches the panel when it opens.
  const pendingRecentLabels = useRef(initialRecentLabels);
  const launcher = useActivatingLauncher(() => setRecentLabels(pendingRecentLabels.current));

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
    <Page>
      <AppBar ref={barRef}>
        <AppLauncher
          trigger={<AppBarButton aria-label="App launcher" icon={<GridDots20Regular />} />}
          dockTarget={barRef}
          open={launcher.open}
          onOpenChange={launcher.onOpenChange}
        >
          <AppLauncherSection title="Recently used">
            <AppRows items={recentApps} onActivate={recordUse} />
          </AppLauncherSection>
        </AppLauncher>
        <AppBarTitle>Contoso</AppBarTitle>
      </AppBar>
      <Captions>
        <Text size={500} weight="semibold">
          Controlled open
        </Text>
        <Text>
          Activate an app: the panel closes and the app moves to the front of the recently used
          list. The current order is shown below, and the panel shows it the next time it opens —
          the order inside the open panel stays put while the pointer is over it.
        </Text>
        <Text weight="semibold">Recently used: {recentLabels.join(', ')}</Text>
      </Captions>
    </Page>
  );
};
