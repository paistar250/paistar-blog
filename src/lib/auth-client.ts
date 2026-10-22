type Session = { user: { id: number; name: string; role: 'reader'|'admin'; mustChangePassword: boolean } | null; csrfToken: string };
let token = '';
export async function session(): Promise<Session> {
  const response = await fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new Error('暂时无法连接服务器。');
  const data = await response.json() as Session;
  token = data.csrfToken;
  return data;
}
export async function api<T = Record<string, unknown>>(url: string, options: { method?: string; data?: unknown; form?: FormData } = {}): Promise<T> {
  const method = options.method || 'GET';
  if (method !== 'GET' && !token) await session();
  const response = await fetch(url, {
    method, credentials: 'same-origin', cache: 'no-store',
    headers: { ...(options.form ? {} : { 'Content-Type': 'application/json' }), ...(method !== 'GET' ? { 'X-CSRF-Token': token } : {}) },
    ...(options.form ? { body: options.form } : options.data !== undefined ? { body: JSON.stringify(options.data) } : {}),
  });
  const data = await response.json().catch(() => ({ error: '服务器暂时不可用。' }));
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : '操作未完成，请重试。');
  return data as T;
}
