import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const site = 'https://paistar.eu.cc';
const base = '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  integrations: [react(), mdx(), sitemap({ filter: (page) => new URL(page).pathname !== '/' && !/\/(?:offline\/|404\.html|login\/|signup\/)/.test(page) })],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
