import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';

export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /account/\nDisallow: /login/\nDisallow: /signup/\nSitemap: ${new URL(withBase('/sitemap.xml'), site).toString()}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
