import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  base: process.env.SITE_BASE ?? '/',
  output: 'static',
  site: process.env.SITE_URL,
  integrations: [react()],
  build: {
    format: 'directory',
  },
  vite: {
    build: {
      sourcemap: true,
    },
  },
});
