import { database } from '../../../../server/database';
import { getPost, savePost, validatePost } from '../../../../server/posts';
import { body, csrf, endpoint, HttpError, json, requireAdmin } from '../../../../server/http';
import type { RowDataPacket } from 'mysql2/promise';

export const GET = endpoint(async context => {
  requireAdmin(context);
  const post = await getPost(context.params.slug || '',true);
  if (!post) throw new HttpError(404,'文章不存在。');
  return json({ post });
});
export const PUT = endpoint(async context => {
  csrf(context);
  const user = requireAdmin(context);
  const input = await body(context);
  if (typeof input.version !== 'string') throw new HttpError(400,'缺少文章版本，请刷新页面。');
  const post = await savePost(validatePost({ ...input, slug: context.params.slug }),user.id,input.version);
  return json({ post });
});
export const DELETE = endpoint(async context => {
  csrf(context);
  const user = requireAdmin(context);
  const input = await body(context, 4096);
  const connection = await database().getConnection();
  try {
    await connection.beginTransaction();
    const [posts] = await connection.execute<RowDataPacket[]>('SELECT * FROM blog_posts WHERE slug=? FOR UPDATE',[context.params.slug || '']);
    if (!posts.length) throw new HttpError(404,'文章不存在。');
    if (new Date(posts[0].updated_at).toISOString() !== input.version) throw new HttpError(409,'文章已更新，请刷新后重试。');
    await connection.execute('INSERT INTO blog_post_revisions(slug,snapshot,editor_id) VALUES (?,?,?)',[posts[0].slug,JSON.stringify(posts[0]),user.id]);
    await connection.execute('DELETE FROM blog_posts WHERE slug=?',[posts[0].slug]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
  return json({ ok: true });
});
