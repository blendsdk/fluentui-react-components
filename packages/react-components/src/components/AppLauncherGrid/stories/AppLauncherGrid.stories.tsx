import {
  BookOpen32Regular,
  CalendarLtr32Regular,
  Chat32Regular,
  Document32Regular,
  Folder32Regular,
  Mail32Regular,
  Notebook32Regular,
  People32Regular,
} from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { AppLauncherItem } from '../../AppLauncherItem';
import { AppLauncherGrid } from '../AppLauncherGrid';

const meta: Meta<typeof AppLauncherGrid> = {
  title: 'Components/AppLauncherGrid',
  component: AppLauncherGrid,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof AppLauncherGrid>;

/** The sample apps the grid stories lay out as tiles. */
const apps = [
  { label: 'Mail', icon: <Mail32Regular /> },
  { label: 'Calendar', icon: <CalendarLtr32Regular /> },
  { label: 'Chat', icon: <Chat32Regular /> },
  { label: 'Files', icon: <Folder32Regular /> },
  { label: 'People', icon: <People32Regular /> },
  { label: 'Notes', icon: <Notebook32Regular /> },
  { label: 'Library', icon: <BookOpen32Regular /> },
  { label: 'Reports', icon: <Document32Regular /> },
];

/** Renders the shared sample apps as grid tiles. */
function AppTiles({ columns }: { columns?: number }): ReactElement {
  return (
    <AppLauncherGrid columns={columns}>
      {apps.map(app => (
        <AppLauncherItem key={app.label} label={app.label} icon={app.icon} />
      ))}
    </AppLauncherGrid>
  );
}

/**
 * The default three-column grid — the Microsoft 365 app launcher's column
 * count — with the sample tiles.
 */
export const Default: Story = {
  render: () => <AppTiles />,
};

/**
 * The `columns` prop widens the grid; four columns fit wider panels.
 */
export const FourColumns: Story = {
  render: () => <AppTiles columns={4} />,
};

/**
 * A long app name wraps inside its tile; the tile grows instead of clipping
 * the label.
 */
export const LongName: Story = {
  render: () => (
    <AppLauncherGrid>
      <AppLauncherItem label="Resource Planning" icon={<CalendarLtr32Regular />} />
      <AppLauncherItem label="Mail" icon={<Mail32Regular />} />
      <AppLauncherItem label="Chat" icon={<Chat32Regular />} />
    </AppLauncherGrid>
  ),
};
