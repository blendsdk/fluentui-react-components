import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * Vitest performance project configuration.
 *
 * Runs the TileGrid performance suite in Chromium with enough time for the
 * 20K benchmark and scripted-scroll measurements.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['test/perf/**/*.perf.test.tsx'],
    setupFiles: ['./test/setup.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' as const }],
    },
  },
});
