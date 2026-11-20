import { Text } from '@fluentui/react-components';
import { GridDots20Regular } from '@fluentui/react-icons';
import { useRef, useState } from 'react';
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

/** One branded bar: the product name and its brand color. */
type BrandedBarProps = {
  name: string;
  color: string;
};

/**
 * The bars of the story: the neutral Contoso brand plus the suite's product
 * bars, each in its own brand color, so the trigger can be checked on light
 * and dark backgrounds.
 */
const brands: BrandedBarProps[] = [
  { name: 'Contoso', color: '#0f6cbd' },
  { name: 'Contoso Chat', color: '#5b5fc7' },
  { name: 'Contoso Docs', color: '#185abd' },
  { name: 'Contoso Sheets', color: '#107c41' },
  { name: 'Contoso Slides', color: '#c43e1c' },
];

/**
 * One application bar with its own launcher: the waffle is an AppBarButton,
 * and the panel docks to the bar it was opened from.
 */
function BrandedBar({ name, color }: BrandedBarProps) {
  const barRef = useRef<HTMLElement>(null);
  const launcher = useActivatingLauncher();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const results = apps.filter(item => item.label.toLowerCase().includes(needle));

  return (
    <AppBar ref={barRef} aria-label={`${name} application bar`} style={{ backgroundColor: color }}>
      <AppLauncher
        trigger={
          <AppBarButton aria-label={`App launcher (${name})`} icon={<GridDots20Regular />} />
        }
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
      <AppBarTitle>{name}</AppBarTitle>
    </AppBar>
  );
}

/**
 * The launcher on application bars in different brand colors. The
 * AppBarButton keeps the white foreground and the soft white overlay states
 * on every bar color. Open the launcher from each bar — the panel docks to the
 * bar it was opened from.
 */
export const BrandedBars = () => (
  <Page>
    {brands.map(brand => (
      <BrandedBar key={brand.name} {...brand} />
    ))}
    <Captions>
      <Text size={500} weight="semibold">
        Branded bars
      </Text>
      <Text>
        Hover and press each waffle: it stays on-brand on every bar color, with a soft white overlay
        as the interaction feedback; keyboard focus shows the white focus ring. The panel docks to
        the bar it was opened from.
      </Text>
    </Captions>
  </Page>
);
