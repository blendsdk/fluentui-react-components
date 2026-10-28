import { CalendarLtr32Regular, Chat32Regular, Mail32Regular } from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { AppLauncherGrid } from '../../AppLauncherGrid';
import { AppLauncherItem } from '../../AppLauncherItem';
import { AppLauncherSection } from '../AppLauncherSection';

const meta: Meta<typeof AppLauncherSection> = {
  id: 'components-applaunchersection',
  title: 'Navigation/AppLauncherSection',
  component: AppLauncherSection,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof AppLauncherSection>;

/**
 * A small tile grid every section story groups, so the stories differ only in
 * the props they pass.
 */
function TileGrid(): ReactElement {
  return (
    <AppLauncherGrid>
      <AppLauncherItem label="Mail" icon={<Mail32Regular />} />
      <AppLauncherItem label="Calendar" icon={<CalendarLtr32Regular />} />
      <AppLauncherItem label="Chat" icon={<Chat32Regular />} />
    </AppLauncherGrid>
  );
}

/**
 * A titled section groups its tiles under a caption — the common case for
 * "Pinned" or "All apps" groups.
 */
export const Titled: Story = {
  render: () => (
    <AppLauncherSection title="All apps">
      <TileGrid />
    </AppLauncherSection>
  ),
};

/**
 * `divider` separates a section from the one above it; sections get spacing
 * either way.
 */
export const WithDivider: Story = {
  render: () => (
    <>
      <AppLauncherSection title="Pinned">
        <TileGrid />
      </AppLauncherSection>
      <AppLauncherSection title="All apps" divider>
        <TileGrid />
      </AppLauncherSection>
    </>
  ),
};

/**
 * Without a title the section is a plain unlabeled group — useful when a
 * caption would only repeat the surrounding context.
 */
export const Untitled: Story = {
  render: () => (
    <AppLauncherSection>
      <TileGrid />
    </AppLauncherSection>
  ),
};
