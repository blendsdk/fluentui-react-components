import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

/**
 * Configuration of the Storybook shell (the manager UI).
 *
 * The built Storybook is the published component documentation, so the shell
 * carries the project name and links back to the repository instead of the
 * default Storybook branding. `brandTitle` is what the browser tab and the
 * sidebar show.
 */
addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'BlendSDK Fluent UI Components',
    brandUrl: 'https://github.com/blendsdk/fluentui-react-components',
    brandTarget: '_blank',
  }),
});
