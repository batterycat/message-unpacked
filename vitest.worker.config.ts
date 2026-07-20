import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    cloudflareTest({
      main: './workers/room-worker.ts',
      wrangler: { configPath: './workers/wrangler.toml' },
      miniflare: {
        bindings: {
          LIVE_ROOMS_ENABLED: 'true',
          ALLOWED_ORIGINS: 'https://classroom.example',
        },
      },
    }),
  ],
  test: {
    include: ['workers/**/*.worker.test.ts'],
  },
});
