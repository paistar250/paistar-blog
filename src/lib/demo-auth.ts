/** Browser-only demo identity. It never gates posts or claims to secure data. */
const ACCOUNTS = 'paistar-demo-accounts-v1';
const SESSION = 'paistar-demo-session-v1';
const ITERATIONS = 180_000;

type Account = { email: string; name: string; salt: string; verifier: string; version: 1 };
export type DemoSession = { email: string; name: string; guest: boolean };

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const value of bytes) binary += String.fromCharCode(value);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array): Promise<string> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' }, material, 256);
  return bytesToBase64(new Uint8Array(bits));
}

function accounts(): Account[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ACCOUNTS) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is Account => Boolean(item && typeof item.email === 'string' && typeof item.verifier === 'string' && typeof item.salt === 'string' && typeof item.name === 'string')) : [];
  } catch { return []; }
}

export async function register(name: string, email: string, password: string): Promise<void> {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedName.length < 2 || normalizedName.length > 24) throw new Error('昵称请填写 2–24 个字符。');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('请输入有效的邮箱格式。');
  if (password.length < 8) throw new Error('演示密码至少需要 8 个字符。');
  const existing = accounts();
  if (existing.some((item) => item.email === normalizedEmail)) throw new Error('这个邮箱已在此浏览器注册。');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const verifier = await derive(password, salt);
  try { localStorage.setItem(ACCOUNTS, JSON.stringify([...existing, { email: normalizedEmail, name: normalizedName, salt: bytesToBase64(salt), verifier, version: 1 }])); }
  catch { throw new Error('浏览器未允许本地存储，无法保存演示账号。'); }
}

export async function login(email: string, password: string, remember: boolean): Promise<DemoSession> {
  const account = accounts().find((item) => item.email === email.trim().toLowerCase());
  if (!account) throw new Error('邮箱或密码不正确。');
  let verifier: string;
  try { verifier = await derive(password, base64ToBytes(account.salt)); }
  catch { throw new Error('演示账号数据已损坏，请清除本站数据后重新注册。'); }
  const actual = base64ToBytes(verifier);
  const expected = base64ToBytes(account.verifier);
  let difference = actual.length ^ expected.length;
  for (let i = 0; i < Math.min(actual.length, expected.length); i++) difference |= actual[i] ^ expected[i];
  if (difference !== 0) throw new Error('邮箱或密码不正确。');
  const session = { email: account.email, name: account.name, guest: false };
  logout();
  try { (remember ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(session)); }
  catch { throw new Error('浏览器未允许存储演示状态。'); }
  return session;
}

export function enterCatDemo(): DemoSession {
  const session = { email: '', name: '夜航访客', guest: true };
  logout();
  sessionStorage.setItem(SESSION, JSON.stringify(session));
  return session;
}

export function getSession(): DemoSession | null {
  let stores: Storage[];
  try { stores = [sessionStorage, localStorage]; } catch { return null; }
  for (const store of stores) {
    try {
      const value = store.getItem(SESSION);
      if (!value) continue;
      const parsed: unknown = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && 'name' in parsed && typeof parsed.name === 'string' && 'email' in parsed && typeof parsed.email === 'string' && 'guest' in parsed && typeof parsed.guest === 'boolean') return parsed as DemoSession;
    } catch { /* Ignore corrupted or disabled storage. */ }
  }
  return null;
}

export function logout(): void {
  try { localStorage.removeItem(SESSION); } catch { /* Ignore. */ }
  try { sessionStorage.removeItem(SESSION); } catch { /* Ignore. */ }
}
