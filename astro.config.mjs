import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL || 'https://paistar250.github.io';
const base = process.env.BASE_PATH || '/paistar-blog';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  integrations: [mdx(), sitemap({ filter: (page) => !/\/(?:offline\/|404\.html)/.test(page) })],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});

