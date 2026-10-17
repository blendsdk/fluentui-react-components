import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Storybook configuration for the component library.
 *
 * Stories live in a `stories/` folder inside each component folder. Keeping
 * examples out of the implementation files makes the component source easier
 * to scan while the story still belongs to the component it documents.
 * Scenario `.story.tsx` fixtures may live beside the entry story and are
 * imported by it rather than discovered directly. The docs addon renders an
 * autodocs page per component; the a11y addon reports accessibility violations
 * while a story is open.
 *
 * `viteFinal` only sets the asset base path. GitHub Pages serves the built
 * Storybook under `https://blendsdk.github.io/fluentui-react-components/`,
 * and the deployment workflow passes that sub-path through
 * `STORYBOOK_BASE_PATH`. Local runs keep the default base of `/`.
 */
const config: StorybookConfig = {
  stories: ['../src/**/stories/*.stories.@(ts|tsx)'],
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
