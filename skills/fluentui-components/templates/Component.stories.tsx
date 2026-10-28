// Template: src/components/<Name>/stories/<Name>.stories.tsx
// Replace <Name>, <Group> and <kebab-case-name>. Choose the functional group
// from references/storybook.md. Preserve an existing ID when regrouping stories.
// One story per documented variant (see the README prop
// table). Descriptions say WHEN to choose a variant, not what it looks like.
// The FluentProvider wrapper comes from .storybook/preview.tsx — do not
// repeat it here.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { <Name> } from '../<Name>';

const meta: Meta<typeof <Name>> = {
  id: '<kebab-case-name>',
  title: '<Group>/<Name>',
  component: <Name>,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof <Name>>;

/** The default variant: <when to choose it>. */
export const Default: Story = {
  args: { label: 'Example' },
};

/** <Alternative variant>: <when to choose it>. */
export const Alternative: Story = {
  args: { label: 'Example', layout: 'compact' },
};

// Use render instead of args when the story needs children or rich content:
//
// export const RichContent: Story = {
//   args: { layout: 'compact' },
//   render: args => (
//     <<Name> {...args}>
//       <Badge color="brand">Pro</Badge>
//     </<Name>>
//   ),
// };
