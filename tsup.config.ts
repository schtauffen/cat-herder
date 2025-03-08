import {defineConfig} from 'tsup';
import pkg from './package.json' assert { type: 'json' };

const entry = ['src/index.ts'];

export default defineConfig({
  entry,
});
