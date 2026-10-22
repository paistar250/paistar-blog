import { listPosts, savePost, validatePost } from '../../../../server/posts';
import { body, csrf, endpoint, json, requireAdmin } from '../../../../server/http';
export const GET = endpoint(async context => { requireAdmin(context); return json({ posts: await listPosts(true) }); });
export const POST = endpoint(async context => {
  csrf(context);
  const user = requireAdmin(context);
  const post = await savePost(validatePost(await body(context)),user.id);
  return json({ post }, 201);
});
