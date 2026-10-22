import { hashPassword, limit, startSession, validPassword, verifyPassword } from '../../../server/auth';
import { execute, rows } from '../../../server/database';
import { body, csrf, endpoint, HttpError, json, requireUser } from '../../../server/http';

export const POST = endpoint(async context => {
  csrf(context);
  const user = requireUser(context);
  if (!await limit(`password:${user.id}`, 8, 3600)) throw new HttpError(429, '修改次数较多，请稍后再试。');
  const input = await body(context, 8192);
  if (typeof input.currentPassword !== 'string' || Buffer.byteLength(input.currentPassword) > 256 || !validPassword(input.password)) throw new HttpError(400, '新密码至少需要 12 个字符。');
  if (input.password === input.currentPassword) throw new HttpError(400, '新密码需要与原密码不同。');
  const current = (await rows('SELECT password_hash FROM blog_users WHERE id=?', [user.id]))[0];
  if (!current || !await verifyPassword(input.currentPassword, current.password_hash)) throw new HttpError(401, '当前密码不正确。');
  const hash = await hashPassword(input.password);
  await execute('UPDATE blog_users SET password_hash=?,must_change_password=FALSE WHERE id=?', [hash,user.id]);
  await execute('DELETE FROM blog_sessions WHERE user_id=?', [user.id]);
  await startSession(context,user.id,false);
  return json({ ok: true, redirect: user.role === 'admin' ? '/admin/' : '/account/?updated=1' });
});
