import { Text } from '@fluentui/react-components';
import { useRef, useState } from 'react';
import { GridDots20Regular } from '@fluentui/react-icons';
import { AppLauncher } from '../AppLauncher';
import { AppBar } from '../../AppBar';
import { AppBarButton } from '../../AppBarButton';
import { AppBarTitle } from '../../AppBarTitle';
import { AppLauncherSearch } from '../../AppLauncherSearch';
import { AppLauncherSection } from '../../AppLauncherSection';
import {
  AppTiles,
  Captions,
  Page,
  apps,
  useActivatingLauncher,
} from './AppLauncherStoryApps.story';

/**
 * The search field in every state, with the results laid out as tiles: the
 * field is controlled, so the stories' filtering is an application decision.
 * Typing filters the tiles, a miss shows the empty state, the clear button
 * empties the field and the first Escape clears the query before the second
 * Escape closes the panel. The kitchen-sink story shows the same states with
 * the results as list rows.
 */
export const SearchStates = () => {
  const barRef = useRef<HTMLElement>(null);
  const launcher = useActivatingLauncher();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const results = apps.filter(item => item.label.toLowerCase().includes(needle));

  return (
    <Page>
      <AppBar ref={barRef}>
        <AppLauncher
          trigger={<AppBarButton aria-label="App launcher" icon={<GridDots20Regular />} />}
          dockTarget={barRef}
          open={launcher.open}
          onOpenChange={launcher.onOpenChange}
        >
          <AppLauncherSearch
            label="Search apps"
            value={query}
            onChange={(_event, data) => setQuery(data.value)}
          />
          <AppLauncherSection>
            {results.length === 0 ? (
              <Text>No apps found</Text>
            ) : (
              <AppTiles items={results} onActivate={launcher.close} />
            )}
          </AppLauncherSection>
        </AppLauncher>
        <AppBarTitle>Contoso</AppBarTitle>
      </AppBar>
      <Captions>
        <Text size={500} weight="semibold">
          Search states
        </Text>
        <Text>
          Type "bo" to filter the tiles down to Bookings, "zz" to see the empty state. The clear
          button and the first Escape clear the query; the second Escape closes the panel.
        </Text>
      </Captions>
    </Page>
  );
};
