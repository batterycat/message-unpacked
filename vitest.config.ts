import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'workers/**/*.test.ts'],
    exclude: ['workers/**/*.worker.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
