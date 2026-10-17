import { Badge, Link } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { DescriptionListItem } from '../../DescriptionListItem';
import { DescriptionList } from '../DescriptionList';
import type { DescriptionListProps } from '../DescriptionList.types';

const meta: Meta<typeof DescriptionList> = {
  title: 'Components/DescriptionList',
  component: DescriptionList,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof DescriptionList>;

/**
 * Renders the same three subscription pairs in every story, so the stories
 * differ only in the props they pass.
 */
function renderSubscription(args: DescriptionListProps): ReactElement {
  return (
    <DescriptionList {...args}>
      <DescriptionListItem label="Plan">Pro</DescriptionListItem>
      <DescriptionListItem label="Seats">12</DescriptionListItem>
      <DescriptionListItem label="Renewal date">March 1, 2027</DescriptionListItem>
    </DescriptionList>
  );
}

/**
 * The default layout: each label above its value. It suits narrow surfaces
 * and values that need the full width.
 */
export const Stacked: Story = {
  args: { layout: 'stacked' },
  render: renderSubscription,
};

/**
 * The labels move into a column of their own and line up across all pairs,
 * which suits scanning a set of short values.
 */
export const Columns: Story = {
  args: { layout: 'columns' },
  render: renderSubscription,
};

/**
 * Values are free-form content: any element an application needs can sit in
 * the definition.
 */
export const RichValues: Story = {
  args: { layout: 'columns' },
  render: args => (
    <DescriptionList {...args}>
      <DescriptionListItem label="Plan">
        <Badge appearance="filled" color="brand">
          Pro
        </Badge>
      </DescriptionListItem>
      <DescriptionListItem label="Documentation">
        <Link href="https://blendsdk.github.io/fluentui-react-components/">
          Component documentation
        </Link>
      </DescriptionListItem>
    </DescriptionList>
  ),
};
