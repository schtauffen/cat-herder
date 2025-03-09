import {defineConfig, Format} from 'tsup';

const entry = ['src/index.ts'];

export default defineConfig({
  entry,
  format: ['cjs', 'esm', 'iife'],
  globalName: 'catHerder',
  clean: true,
  dts: {
    entry,
  },
  esbuildOptions(options) {
    if (options.format === 'iife') {
      options.entryNames = 'cat-herder';
    }
  },
});
