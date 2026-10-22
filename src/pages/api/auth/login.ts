import { hashPassword, limit, publicUser, startSession, verifyPassword } from '../../../server/auth';
import { rows } from '../../../server/database';
import { body, csrf, endpoint, HttpError, json } from '../../../server/http';

let dummy: Promise<string> | undefined;
export const POST = endpoint(async context => {
  csrf(context);
  const input = await body(context, 8192);
  const login = typeof input.login === 'string' ? input.login.trim().toLowerCase().slice(0,254) : '';
  const password = typeof input.password === 'string' ? input.password : '';
  if (!login || !password || Buffer.byteLength(password) > 256) throw new HttpError(400, '请输入账号和密码。');
  const ip = context.request.headers.get('x-real-ip') || context.clientAddress;
  if (!await limit(`login-ip:${ip}`, 40, 900) || !await limit(`login-account:${login}`, 12, 900)) throw new HttpError(429, '尝试次数较多，请 15 分钟后再试。');
  const users = await rows('SELECT * FROM blog_users WHERE email=? OR username=? LIMIT 1', [login,login]);
  const user = users[0];
  dummy ||= hashPassword('not-an-actual-account-password-7284');
  const matches = await verifyPassword(password, user?.password_hash || await dummy);
  if (!user || !matches) throw new HttpError(401, '账号或密码不正确。');
  await startSession(context, Number(user.id), input.remember === true);
  const safeUser = publicUser(user);
  return json({ user: safeUser, redirect: safeUser.mustChangePassword ? '/account/?welcome=1' : safeUser.role === 'admin' ? '/admin/' : '/journal/' });
});
