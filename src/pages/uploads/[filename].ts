import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { uploadDirectory } from '../../server/config';
export const GET: APIRoute = async context => {
  const filename = context.params.filename || '';
  if (!/^[0-9a-f-]{36}\.webp$/.test(filename)) return new Response('Not found',{status:404});
  try {
    const image = await readFile(path.join(uploadDirectory(),filename));
    return new Response(image,{headers:{'Content-Type':'image/webp','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=86400'}});
  } catch { return new Response('Not found',{status:404}); }
};
