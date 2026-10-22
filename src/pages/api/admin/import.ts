import { importMarkdown } from '../../../server/markdown';
import { body, csrf, endpoint, HttpError, json, requireAdmin } from '../../../server/http';
export const POST = endpoint(async context => {
  csrf(context); requireAdmin(context);
  const input = await body(context);
  if (typeof input.content !== 'string' || typeof input.filename !== 'string') throw new HttpError(400,'请选择 Markdown 文件。');
  return json({ post: importMarkdown(input.content,input.filename) });
});
