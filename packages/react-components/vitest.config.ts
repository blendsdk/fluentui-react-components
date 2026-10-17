import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for the component library.
 *
 * Tests run in jsdom because every component is a browser component. The
 * React plugin transforms JSX the same way consuming applications transform
 * it, so tests exercise the components under realistic conditions. The
 * setup file registers the jest-dom matchers and unmounts rendered trees
 * after each test.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'storybook-static', '.turbo'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'storybook-static/',
        '.turbo/',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        '**/*.stories.tsx',
        '**/*.story.tsx',
        'test/setup.ts',
      ],
    },
  },
});
