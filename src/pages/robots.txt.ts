import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';

export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL(withBase('/sitemap-index.xml'), site).toString()}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
