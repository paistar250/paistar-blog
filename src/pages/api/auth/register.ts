import { hashPassword, limit, publicUser, validPassword } from '../../../server/auth';
import { ensureDatabase, execute, rows } from '../../../server/database';
import { body, csrf, endpoint, HttpError, json } from '../../../server/http';

export const POST = endpoint(async context => {
  csrf(context);
  const input = await body(context, 8192);
  const ip = context.request.headers.get('x-real-ip') || context.clientAddress;
  if (!await limit(`register:${ip}`, 10, 3600)) throw new HttpError(429, '注册次数较多，请稍后再试。');
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (name.length < 2 || name.length > 24) throw new HttpError(400, '昵称请填写 2–24 个字符。');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, '请输入有效邮箱。');
  if (!validPassword(input.password)) throw new HttpError(400, '密码至少 12 个字符，最多 256 字节。');
  await ensureDatabase();
  const passwordHash = await hashPassword(input.password);
  try {
    const result = await execute("INSERT INTO blog_users(email,name,password_hash,role) VALUES (?,?,?,'reader')", [email,name,passwordHash]);
    const user = (await rows('SELECT * FROM blog_users WHERE id=?', [result.insertId]))[0];
    return json({ user: publicUser(user) }, 201);
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'ER_DUP_ENTRY') throw new HttpError(409, '这个邮箱已经注册，请直接登录。');
    throw error;
  }
});
