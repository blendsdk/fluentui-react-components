import { GridDots20Regular, Home20Regular } from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppLauncherTrigger } from './AppLauncherTrigger';

const meta: Meta<typeof AppLauncherTrigger> = {
  title: 'Components/AppLauncherTrigger',
  component: AppLauncherTrigger,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof AppLauncherTrigger>;

/**
 * The built-in waffle: an icon-only button whose label is both the accessible
 * name and the tooltip. The launcher renders it unless a caller-provided
 * `trigger` replaces it.
 */
export const Default: Story = {
  args: { label: 'App launcher' },
};

/**
 * A localized label — for example the German "App-Starter" — used as the
 * accessible name and the tooltip.
 */
export const CustomLabel: Story = {
  args: { label: 'App-Starter' },
};

/**
 * An icon override for applications that want their own mark instead of the
 * waffle.
 */
export const CustomIcon: Story = {
  args: { label: 'Home', icon: <Home20Regular /> },
};

/**
 * The remaining `Button` props pass through; `appearance` is the common one.
 * The default is the lo-profile subtle look.
 */
export const Appearance: Story = {
  args: { label: 'App launcher', appearance: 'secondary' },
};

/**
 * The icon is free-form: any element the `Button` accepts works as the
 * trigger icon, for example the default waffle glyph.
 */
export const WaffleGlyph: Story = {
  args: { label: 'App launcher', icon: <GridDots20Regular /> },
};
