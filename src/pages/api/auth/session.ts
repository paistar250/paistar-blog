import { randomBytes } from 'node:crypto';
import type { APIRoute } from 'astro';
import { json } from '../../../server/http';
import { secureCookies } from '../../../server/config';

export const GET: APIRoute = context => {
  let token = context.cookies.get('paistar_csrf')?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = randomBytes(32).toString('hex');
    context.cookies.set('paistar_csrf', token, { path: '/', secure: secureCookies(), httpOnly: true, sameSite: 'strict', maxAge: 86400 });
  }
  return json({ user: context.locals.user, csrfToken: token });
};
