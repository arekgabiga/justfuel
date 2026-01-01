// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    // @ts-expect-error: tailwindcss vite plugin type mismatch
    plugins: [tailwindcss()],
  },
  adapter: vercel(),
});
