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
    // Performance files build their own 20K fixtures and measure frame timing.
    // Running them sequentially keeps one file from perturbing another's budget.
    fileParallelism: false,
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
