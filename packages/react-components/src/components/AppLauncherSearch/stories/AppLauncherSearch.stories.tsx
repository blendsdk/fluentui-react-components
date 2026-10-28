import { CalendarLtr20Regular, Chat20Regular, Mail20Regular } from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { AppLauncherItem } from '../../AppLauncherItem';
import { AppLauncherList } from '../../AppLauncherList';
import { AppLauncherSearch } from '../AppLauncherSearch';

const meta: Meta<typeof AppLauncherSearch> = {
  id: 'components-applaunchersearch',
  title: 'Navigation/AppLauncherSearch',
  component: AppLauncherSearch,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof AppLauncherSearch>;

/**
 * The default field: a labelled search box with the launcher placeholder. The
 * label is the accessible name — the launcher renders no visible label.
 */
export const Default: Story = {
  args: { label: 'Search apps' },
};

/** The small app set the controlled story filters, one row icon per app. */
const sampleApps = [
  { label: 'Mail', icon: <Mail20Regular /> },
  { label: 'Calendar', icon: <CalendarLtr20Regular /> },
  { label: 'Chat', icon: <Chat20Regular /> },
];

/**
 * A controlled field wired to component state: typing filters a local list,
 * and an empty result renders an application-provided message. The field
 * itself holds no query.
 */
function FilteringSearch(): ReactElement {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const matches = sampleApps.filter(app => app.label.toLowerCase().includes(needle));

  return (
    <>
      <AppLauncherSearch
        label="Search apps"
        value={query}
        onChange={(_event, data) => setQuery(data.value)}
      />
      {matches.length === 0 ? (
        <p>No apps found</p>
      ) : (
        <AppLauncherList>
          {matches.map(app => (
            <AppLauncherItem key={app.label} label={app.label} icon={app.icon} />
          ))}
        </AppLauncherList>
      )}
    </>
  );
}

/**
 * The controlled wiring with live filtering: the query lives in the calling
 * component, and the list below the field follows it.
 */
export const Controlled: Story = {
  render: () => <FilteringSearch />,
};

/**
 * Every user-facing string is a prop. A German field: the accessible name,
 * the visible placeholder, and — through Fluent's `dismiss` slot — the clear
 * button's accessible name.
 */
export const Localized: Story = {
  args: {
    label: 'Apps durchsuchen',
    placeholder: 'Suchen',
    dismiss: { 'aria-label': 'Eingabe löschen' },
  },
};

/**
 * The remaining `SearchBox` props pass through; `size` is the common one.
 */
export const Size: Story = {
  args: { label: 'Search apps', size: 'large' },
};
