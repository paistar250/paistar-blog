import { renderMarkdown } from '../../../server/markdown';
import { body, csrf, endpoint, HttpError, json, requireAdmin } from '../../../server/http';
export const POST = endpoint(async context => {
  csrf(context); requireAdmin(context);
  const input = await body(context);
  if (typeof input.body !== 'string' || input.body.length > 300_000) throw new HttpError(400,'正文为空或过长。');
  return json(await renderMarkdown(input.body));
});
