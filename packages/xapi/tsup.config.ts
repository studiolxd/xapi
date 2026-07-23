import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      react: 'src/react/index.ts',
      vue: 'src/vue/index.ts',
      angular: 'src/angular/index.ts',
      svelte: 'src/svelte/index.ts',
      server: 'src/server/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    external: ['react', 'react-dom', 'vue', /^@angular\//, /^svelte($|\/)/],
  },
  {
    entry: { xapi: 'src/index.ts' },
    format: ['iife'],
    globalName: 'Xapi',
    sourcemap: true,
    minify: true,
    treeshake: true,
    clean: false,
  },
]);
