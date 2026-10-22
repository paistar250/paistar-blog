import { rows, ensureDatabase } from '../../server/database';
import { endpoint, json } from '../../server/http';
export const GET = endpoint(async context => {
  const query = (context.url.searchParams.get('q') || '').trim().slice(0,100);
  if (!query) return json({results:[]});
  await ensureDatabase();
  const term = `%${query.replace(/[\\%_]/g,'\\$&')}%`;
  const results = await rows('SELECT slug,title,description FROM blog_posts WHERE draft=FALSE AND (title LIKE ? OR description LIKE ? OR body LIKE ?) ORDER BY published_at DESC LIMIT 30',[term,term,term]);
  return json({results:results.map(row=>({url:`/posts/${row.slug}/`,title:row.title,excerpt:row.description}))});
});
