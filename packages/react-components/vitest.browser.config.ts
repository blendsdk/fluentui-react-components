import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * Vitest browser project configuration for the component library.
 *
 * The browser project runs real DOM and layout tests in Chromium. The matrix
 * configuration imports this object and replaces the single Chromium instance
 * with the full Chromium/Firefox/WebKit set.
 */
/** Shared Chromium browser project; the matrix config replaces its instances. */
export const browserTestConfig = {
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  test: {
    include: ['test/browser/**/*.browser.test.tsx'],
    setupFiles: ['./test/setup.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' as const }],
    },
  },
};

export default defineConfig(browserTestConfig);
