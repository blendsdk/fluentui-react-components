import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Storybook configuration for the component library.
 *
 * Stories live next to the components they document — a `.stories.tsx` file
 * beside each component source — and are collected from there, so a component
 * and its story always travel together. The docs addon renders an autodocs
 * page per component; the a11y addon reports accessibility violations while a
 * story is open.
 *
 * `viteFinal` only sets the asset base path. GitHub Pages serves the built
 * Storybook under `https://blendsdk.github.io/fluentui-react-components/`,
 * and the deployment workflow passes that sub-path through
 * `STORYBOOK_BASE_PATH`. Local runs keep the default base of `/`.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async viteConfig => ({
    ...viteConfig,
    base: process.env.STORYBOOK_BASE_PATH || '/',
  }),
};

export default config;
