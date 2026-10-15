import { defineConfig } from 'vite';

/**
 * Vite configuration for the component library.
 *
 * The build is a single ESM bundle. React, React DOM and every Fluent UI
 * package stay external because consuming applications provide them as peer
 * dependencies: bundling them would duplicate React and break the single
 * Griffel instance the components' styles rely on. Declarations are emitted
 * by `tsc -p tsconfig.build.json` in the package's build script, not by a
 * Vite plugin, so TypeScript stays the single source of truth for types.
 */
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    sourcemap: true,
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@fluentui\//],
    },
  },
});
