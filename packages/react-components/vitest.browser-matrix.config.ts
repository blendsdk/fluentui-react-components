import { defineConfig } from 'vitest/config';
import { browserTestConfig } from './vitest.browser.config';

/**
 * Vitest browser matrix configuration.
 *
 * Reuses the Chromium browser project and replaces its single instance with
 * Chromium, Firefox, and WebKit for the CI matrix.
 */
export default defineConfig({
  ...browserTestConfig,
  test: {
    ...browserTestConfig.test,
    browser: {
      ...browserTestConfig.test.browser,
      instances: [
        { browser: 'chromium' as const },
        { browser: 'firefox' as const },
        { browser: 'webkit' as const },
      ],
    },
  },
});
