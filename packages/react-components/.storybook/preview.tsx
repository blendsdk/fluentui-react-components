import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import type { Decorator, Preview } from '@storybook/react-vite';

/**
 * Wraps every story in `FluentProvider`, mirroring how applications mount the
 * components. The provider supplies the web light theme, the design tokens
 * the stories' styles resolve against, and the Griffel renderer, so a story
 * renders exactly like it would inside an application.
 */
const withFluentProvider: Decorator = Story => (
  <FluentProvider theme={webLightTheme}>
    <Story />
  </FluentProvider>
);

const preview: Preview = {
  decorators: [withFluentProvider],
  parameters: {
    controls: { expanded: true },
  },
};

export default preview;
