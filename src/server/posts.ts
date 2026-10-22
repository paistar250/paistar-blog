import type { RowDataPacket } from 'mysql2/promise';
import { database, ensureDatabase, rows } from './database.ts';
import { HttpError } from './http.ts';

export type Cover = 'hello' | 'coding' | 'reading' | 'life' | 'design' | 'notes';
export type Post = {
  id: string; body: string;
  data: { title: string; description: string; date: Date; updated?: Date; category: string; tags: string[]; draft: boolean; featured: boolean; pinned: boolean; readingMinutes: number; cover: Cover };
};

export function toPost(row: RowDataPacket): Post {
  return { id: row.slug, body: row.body, data: {
    title: row.title, description: row.description,
    date: new Date(row.published_at), updated: new Date(row.updated_at),
    category: row.category, tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
    draft: Boolean(row.draft), featured: Boolean(row.featured), pinned: Boolean(row.pinned),
    readingMinutes: Number(row.reading_minutes), cover: row.cover,
  } };
}

export async function listPosts(includeDrafts = false): Promise<Post[]> {
  await ensureDatabase();
  return (await rows(`SELECT * FROM blog_posts ${includeDrafts ? '' : 'WHERE draft=FALSE'} ORDER BY published_at DESC,slug ASC`)).map(toPost);
}

export async function getPost(slug: string, includeDraft = false): Promise<Post | null> {
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug)) return null;
  await ensureDatabase();
  const result = await rows(`SELECT * FROM blog_posts WHERE slug=? ${includeDraft ? '' : 'AND draft=FALSE'} LIMIT 1`, [slug]);
  return result.length ? toPost(result[0]) : null;
}

export type PostInput = {
  slug: string; title: string; description: string; body: string; category: string; tags: string[];
  cover: Cover; featured: boolean; pinned: boolean; draft: boolean; date: Date; readingMinutes: number;
};

export function validatePost(input: Record<string, unknown>): PostInput {
  const text = (key: string, min: number, max: number): string => {
    if (typeof input[key] !== 'string') throw new HttpError(400, `请填写${({ title: '标题', slug: '文章路径', description: '摘要', body: '正文', category: '分类' } as Record<string,string>)[key] || key}。`);
    const value = (input[key] as string).trim();
    if (value.length < min || value.length > max) throw new HttpError(400, `${key} 长度应为 ${min}–${max} 个字符。`);
    return value;
  };
  const slug = text('slug', 1, 120);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new HttpError(400, '文章路径只能使用小写字母、数字和短横线。');
  const markdown = text('body', 1, 300_000);
  const tags = input.tags;
  if (!Array.isArray(tags) || tags.length > 12 || tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.length > 32)) throw new HttpError(400, '最多填写 12 个标签，每个不超过 32 字。');
  const cover = String(input.cover || 'notes');
  if (!['hello','coding','reading','life','design','notes'].includes(cover)) throw new HttpError(400, '请选择有效封面。');
  const date = new Date(String(input.date || ''));
  if (!Number.isFinite(date.valueOf()) || date.getUTCFullYear() < 1970 || date.getUTCFullYear() > 2200) throw new HttpError(400, '请选择有效日期。');
  return {
    slug, title: text('title', 1, 160), description: text('description', 1, 500),
    body: markdown, category: text('category', 1, 48), tags: [...new Set(tags.map(tag => tag.trim()))],
    cover: cover as Cover, date,
    featured: input.featured === true, pinned: input.pinned === true, draft: input.draft !== false,
    readingMinutes: Math.max(1, Math.ceil(markdown.replace(/```[\s\S]*?```/g, '').length / 400)),
  };
}

export async function savePost(input: PostInput, editor: number, expected?: string): Promise<Post> {
  await ensureDatabase();
  const connection = await database().getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute<RowDataPacket[]>('SELECT * FROM blog_posts WHERE slug=? FOR UPDATE', [input.slug]);
    if (expected === undefined && existing.length) throw new HttpError(409, '这个文章路径已存在，请换一个。');
    if (expected !== undefined && !existing.length) throw new HttpError(404, '文章不存在。');
    if (existing.length) {
      if (new Date(existing[0].updated_at).toISOString() !== expected) throw new HttpError(409, '文章已被其他页面修改，请重新打开后编辑，避免覆盖。');
      await connection.execute('INSERT INTO blog_post_revisions(slug,snapshot,editor_id) VALUES (?,?,?)', [input.slug, JSON.stringify(existing[0]), editor]);
    }
    const values = [input.title,input.description,input.body,input.category,JSON.stringify(input.tags),input.cover,input.featured,input.pinned,input.draft,input.readingMinutes,input.date,new Date(),editor];
    if (existing.length) {
      await connection.execute('UPDATE blog_posts SET title=?,description=?,body=?,category=?,tags=?,cover=?,featured=?,pinned=?,draft=?,reading_minutes=?,published_at=?,updated_at=?,author_id=? WHERE slug=?', [...values,input.slug]);
    } else {
      await connection.execute('INSERT INTO blog_posts(title,description,body,category,tags,cover,featured,pinned,draft,reading_minutes,published_at,updated_at,author_id,slug) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [...values,input.slug]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (typeof error === 'object' && error && 'code' in error && error.code === 'ER_DUP_ENTRY') throw new HttpError(409, '文章路径已存在。');
    throw error;
  } finally { connection.release(); }
  return (await getPost(input.slug, true))!;
}
