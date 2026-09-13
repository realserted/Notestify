import { defineConfig } from 'vitest/config';
import path from 'node:path';

// .mts so Vite loads it as ESM. As .ts it is loaded as CommonJS, which warns
// today and breaks when the native config loader becomes the default.
export default defineConfig({
  test: {
    environment: 'node',
    // Only src. e2e/ belongs to Playwright, and picking those up here would
    // run browser tests in a node environment and fail confusingly.
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
});
