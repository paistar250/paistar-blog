import { defineMiddleware } from 'astro:middleware';
import { getUser } from './server/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (context.request.method === 'GET' && !path.endsWith('/') && /^\/(?:journal|archive|categories|tags|search|about|contact|login|signup|account|admin|posts)(?:\/|$)/.test(path)) return context.redirect(path + '/' + context.url.search, 308);
  context.locals.user = path === '/offline/' ? null : await getUser(context);
  if (path.startsWith('/admin/')) {
    if (!context.locals.user) return context.redirect('/login/?next=/admin/', 302);
    if (context.locals.user.role !== 'admin') return new Response('没有访问权限。', { status: 403, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } });
    if (context.locals.user.mustChangePassword) return context.redirect('/account/?welcome=1', 302);
  }
  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
});
