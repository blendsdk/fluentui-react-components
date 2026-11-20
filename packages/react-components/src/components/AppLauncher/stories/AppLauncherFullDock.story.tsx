import { Text } from '@fluentui/react-components';
import { useRef, useState } from 'react';
import { GridDots20Regular } from '@fluentui/react-icons';
import { AppLauncher } from '../AppLauncher';
import { AppBar } from '../../AppBar';
import { AppBarButton } from '../../AppBarButton';
import { AppBarTitle } from '../../AppBarTitle';
import { AppLauncherSearch } from '../../AppLauncherSearch';
import {
  AppTiles,
  Captions,
  Page,
  stressApps,
  useActivatingLauncher,
} from './AppLauncherStoryApps.story';

/**
 * Full docking: the panel extends from the bar down to the window bottom and
 * scrolls internally. The search field stays pinned to the panel's top while
 * the tiles scroll under it, and every tenth tile stands in for an app
 * disabled by business rules.
 */
export const FullDock = () => {
  const barRef = useRef<HTMLElement>(null);
  const launcher = useActivatingLauncher();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const results = stressApps.filter(item => item.label.toLowerCase().includes(needle));

  return (
    <Page>
      <AppBar ref={barRef}>
        <AppLauncher
          trigger={
            <AppBarButton aria-label="App launcher (full dock)" icon={<GridDots20Regular />} />
          }
          docking="full"
          dockTarget={barRef}
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
        <AppBarTitle>Contoso</AppBarTitle>
      </AppBar>
      <Captions>
        <Text size={500} weight="semibold">
          Full dock
        </Text>
        <Text>
          With docking="full" the panel is forced to extend from the bar to the window bottom —
          Microsoft 365 style. The 40 tiles scroll inside the panel, and the search field stays
          pinned to the panel's top while they scroll under it. Typing filters the tiles.
        </Text>
      </Captions>
    </Page>
  );
};
