import { CalendarLtr20Regular, CalendarLtr32Regular, Mail32Regular } from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { AppLauncherGrid } from '../../AppLauncherGrid';
import { AppLauncherList } from '../../AppLauncherList';
import { AppLauncherItem } from '../AppLauncherItem';

const meta: Meta<typeof AppLauncherItem> = {
  id: 'components-applauncheritem',
  title: 'Navigation/AppLauncherItem',
  component: AppLauncherItem,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof AppLauncherItem>;

/**
 * A hand-drawn sample logo: a white envelope on a blue rounded square, the
 * kind of colorful product mark an application passes as an item icon. The
 * item does not constrain its icon, so the logo keeps its own size and
 * colors. The mark is decorative and hidden from assistive technology — the
 * item label carries the accessible name.
 */
function MailLogo({ size = 32 }: { size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="38" height="38" rx="9" fill="#2563eb" />
      <rect x="9" y="13" width="22" height="14" rx="2" fill="#ffffff" />
      <path
        d="M10 15l10 7 10-7"
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A standalone item: rendered outside a grid or list it falls back to the
 * tile layout — icon above the name. In the launcher the surrounding
 * container decides the layout.
 */
export const Default: Story = {
  args: { label: 'Mail', icon: <Mail32Regular /> },
};

/**
 * Without an icon only the label is shown.
 */
export const IconLess: Story = {
  args: { label: 'Mail' },
};

/**
 * Icons are free-form: a colorful logo element beside a monochrome Fluent
 * icon, side by side in one grid.
 */
export const ColorfulLogo: Story = {
  render: () => (
    <AppLauncherGrid>
      <AppLauncherItem label="Mail" icon={<MailLogo />} />
      <AppLauncherItem label="Calendar" icon={<CalendarLtr32Regular />} />
    </AppLauncherGrid>
  ),
};

/**
 * The two disabled treatments side by side. `disabled` removes the item from
 * keyboard navigation entirely; `disabledFocusable` keeps it reachable —
 * announced as disabled, still focusable, never activating. Both show the
 * same muted name and dimmed icon.
 */
export const DisabledPair: Story = {
  render: () => (
    <AppLauncherGrid>
      <AppLauncherItem label="Mail" icon={<Mail32Regular />} disabled />
      <AppLauncherItem label="Calendar" icon={<CalendarLtr32Regular />} disabledFocusable />
    </AppLauncherGrid>
  ),
};

/**
 * A long app name: it wraps inside a grid tile and ends in an ellipsis inside
 * a list row — the surrounding container decides.
 */
export const LongName: Story = {
  render: () => (
    <div>
      <AppLauncherGrid>
        <AppLauncherItem label="Resource Planning" icon={<CalendarLtr32Regular />} />
      </AppLauncherGrid>
      <AppLauncherList>
        <AppLauncherItem label="Resource Planning" icon={<CalendarLtr20Regular />} />
      </AppLauncherList>
    </div>
  ),
};
