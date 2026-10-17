import { CalendarLtr20Regular, Chat20Regular, Mail20Regular } from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppLauncherItem } from '../../AppLauncherItem';
import { AppLauncherList } from '../AppLauncherList';

const meta: Meta<typeof AppLauncherList> = {
  title: 'Components/AppLauncherList',
  component: AppLauncherList,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof AppLauncherList>;

/**
 * Full-width rows with the icon beside the app name — the layout of the
 * launcher's search results and recents.
 */
export const Rows: Story = {
  render: () => (
    <AppLauncherList>
      <AppLauncherItem label="Mail" icon={<Mail20Regular />} />
      <AppLauncherItem label="Calendar" icon={<CalendarLtr20Regular />} />
      <AppLauncherItem label="Chat" icon={<Chat20Regular />} />
    </AppLauncherList>
  ),
};

/**
 * A long app name ends in an ellipsis instead of wrapping or stretching the
 * row.
 */
export const LongName: Story = {
  render: () => (
    <AppLauncherList>
      <AppLauncherItem label="Resource Planning" icon={<CalendarLtr20Regular />} />
      <AppLauncherItem label="Mail" icon={<Mail20Regular />} />
    </AppLauncherList>
  ),
};

/**
 * A disabled row among enabled ones: the name is muted, the icon is dimmed,
 * and the row neither activates nor takes keyboard focus.
 */
export const Disabled: Story = {
  render: () => (
    <AppLauncherList>
      <AppLauncherItem label="Mail" icon={<Mail20Regular />} />
      <AppLauncherItem label="Calendar" icon={<CalendarLtr20Regular />} disabled />
      <AppLauncherItem label="Chat" icon={<Chat20Regular />} />
    </AppLauncherList>
  ),
};
