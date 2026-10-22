import { timingSafeEqual } from 'node:crypto';
import type { APIContext } from 'astro';
import { appOrigin } from './config.ts';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export async function body(context: APIContext, maximum = 512_000): Promise<Record<string, unknown>> {
  if (!context.request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, '请发送 JSON 数据。');
  const bytes = await readBytes(context.request, maximum);
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch { throw new HttpError(400, '请求格式不正确。'); }
}

export async function readBytes(request: Request, maximum: number): Promise<Uint8Array> {
  if (Number(request.headers.get('content-length') || 0) > maximum) throw new HttpError(413, '文件或内容超过大小限制。');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); throw new HttpError(413, '文件或内容超过大小限制。'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, size);
}

export function csrf(context: APIContext): void {
  const allowed = new Set([appOrigin(), ...(process.env.PREVIEW_ORIGIN ? [new URL(process.env.PREVIEW_ORIGIN).origin] : [])]);
  if (!allowed.has(context.request.headers.get('origin') || '')) throw new HttpError(403, '请求来源不被允许。');
  const cookie = context.cookies.get('paistar_csrf')?.value || '';
  const header = context.request.headers.get('x-csrf-token') || '';
  if (!/^[a-f0-9]{64}$/.test(cookie) || !/^[a-f0-9]{64}$/.test(header) || !timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) throw new HttpError(403, '页面已过期，请刷新后重试。');
}

export function requireUser(context: APIContext) {
  if (!context.locals.user) throw new HttpError(401, '请先登录。');
  return context.locals.user;
}

export function requireAdmin(context: APIContext) {
  const user = requireUser(context);
  if (user.role !== 'admin') throw new HttpError(403, '只有管理员可以修改文章。');
  if (user.mustChangePassword) throw new HttpError(428, '请先修改初始密码。');
  return user;
}

export function endpoint(handler: (context: APIContext) => Promise<Response>) {
  return async (context: APIContext): Promise<Response> => {
    try { return await handler(context); }
    catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      console.error('API request failed', error instanceof Error ? error.name : 'UnknownError');
      return json({ error: '服务暂时不可用，请稍后重试。' }, 500);
    }
  };
}
