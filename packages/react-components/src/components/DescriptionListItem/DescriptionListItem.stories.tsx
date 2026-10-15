import { Badge } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DescriptionListItem } from './DescriptionListItem';

const meta: Meta<typeof DescriptionListItem> = {
  title: 'Components/DescriptionListItem',
  component: DescriptionListItem,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof DescriptionListItem>;

/**
 * An item rendered outside a list falls back to the stacked layout: the
 * label above the value. Inside a list, the surrounding layout decides — see
 * the `DescriptionList` stories for both arrangements.
 */
export const Standalone: Story = {
  args: { label: 'Plan', children: 'Pro' },
};

/**
 * The value accepts any content, here a badge; the label stays the term.
 */
export const RichValue: Story = {
  args: {
    label: 'Plan',
    children: (
      <Badge appearance="filled" color="brand">
        Pro
      </Badge>
    ),
  },
};
