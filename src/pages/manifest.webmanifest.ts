import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';
import { site } from '../data/site';

export const GET: APIRoute = () => new Response(JSON.stringify({ name: site.title, short_name: 'Paistar', description: site.description, lang: 'zh-CN', start_url: withBase('/'), scope: withBase('/'), display: 'standalone', background_color: '#f7f6f2', theme_color: '#276d63', icons: [{ src: withBase('/icon-192.png'), sizes: '192x192', type: 'image/png' }, { src: withBase('/icon-512.png'), sizes: '512x512', type: 'image/png' }] }), { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } });
