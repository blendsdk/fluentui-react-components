import { defineConfig } from 'vite';

/**
 * Vite configuration for the component library.
 *
 * The build emits per-module ESM so a consumer importing one component does
 * not pull every other component into its module graph. The package root still
 * exposes a single public entry; the `exports` map blocks deep imports. React,
 * React DOM, React Hook Form and every Fluent UI package stay external because
 * consuming applications provide them as peer dependencies: bundling them
 * would duplicate React and create a second form instance or a second Griffel
 * instance, breaking the single-instance setup the components rely on.
 * Declarations are emitted by `tsc -p tsconfig.build.json` in the package's
 * build script, not by a Vite plugin, so TypeScript stays the single source of
 * truth for types.
 */
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^react-hook-form($|\/)/,
        /^@fluentui\//,
        /^@tanstack\//,
        /^@dnd-kit\//,
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      },
    },
  },
});
