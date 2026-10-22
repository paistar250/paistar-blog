import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import node from '@astrojs/node';

const site = 'https://paistar.eu.cc';
const base = '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  security: {
    allowedDomains: [
      { hostname: 'paistar.eu.cc', protocol: 'https' },
      { hostname: 'localhost', protocol: 'https', port: '8443' },
    ],
  },
  session: false,
  integrations: [react(), mdx()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
