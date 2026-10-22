import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import type { APIContext } from 'astro';
import type { RowDataPacket } from 'mysql2/promise';
import { ensureDatabase, execute, rows } from './database.ts';
import { secureCookies } from './config.ts';

const derive = (password: string, salt: string) => new Promise<Buffer>((resolve,reject) => {
  scryptCallback(password,salt,64,{N:131072,r:8,p:1,maxmem:256*1024*1024},(error,key)=>error?reject(error):resolve(key));
});
export const SESSION_COOKIE = 'paistar_session';
export type User = { id: number; name: string; email: string | null; username: string | null; role: 'reader' | 'admin'; mustChangePassword: boolean };
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');

export function validPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 12 && Buffer.byteLength(password) <= 256;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt);
  return `scrypt$131072$8$1$${salt}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, cost, block, parallel, salt, expected] = stored.split('$');
  if (kind !== 'scrypt' || cost !== '131072' || block !== '8' || parallel !== '1' || !salt || !/^[a-f0-9]{128}$/.test(expected || '')) return false;
  const hash = await derive(password, salt);
  return timingSafeEqual(hash, Buffer.from(expected, 'hex'));
}

export function publicUser(row: RowDataPacket): User {
  return { id: Number(row.id), name: row.name, email: row.email, username: row.username, role: row.role, mustChangePassword: Boolean(row.must_change_password) };
}

export async function getUser(context: APIContext): Promise<User | null> {
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  await ensureDatabase();
  const users = await rows(`SELECT u.id,u.name,u.email,u.username,u.role,u.must_change_password
    FROM blog_sessions s JOIN blog_users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP(3) LIMIT 1`, [digest(token)]);
  return users.length ? publicUser(users[0]) : null;
}

export async function startSession(context: APIContext, userId: number, remember: boolean): Promise<void> {
  await endSession(context);
  const token = randomBytes(32).toString('hex');
  const duration = remember ? 30 * 86400 : 12 * 3600;
  await execute('INSERT INTO blog_sessions(token_hash,user_id,expires_at) VALUES (?,?,?)', [digest(token), userId, new Date(Date.now() + duration * 1000)]);
  context.cookies.set(SESSION_COOKIE, token, { path: '/', httpOnly: true, secure: secureCookies(), sameSite: 'lax', ...(remember ? { maxAge: duration } : {}) });
}

export async function endSession(context: APIContext): Promise<void> {
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) await execute('DELETE FROM blog_sessions WHERE token_hash=?', [digest(token)]);
  context.cookies.delete(SESSION_COOKIE, { path: '/', secure: secureCookies() });
}

export async function limit(key: string, maximum: number, seconds: number): Promise<boolean> {
  await ensureDatabase();
  const bucket = digest(key);
  await execute(`INSERT INTO blog_rate_limits(bucket,hits,resets_at) VALUES (?,1,?)
    ON DUPLICATE KEY UPDATE hits=IF(resets_at<UTC_TIMESTAMP(3),1,hits+1),
    resets_at=IF(resets_at<UTC_TIMESTAMP(3),VALUES(resets_at),resets_at)`, [bucket, new Date(Date.now() + seconds * 1000)]);
  const result = await rows('SELECT hits FROM blog_rate_limits WHERE bucket=?', [bucket]);
  return Number(result[0].hits) <= maximum;
}
