import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPosts, postUrl } from '../lib/blog';
import { withBase } from '../lib/url';
import { site } from '../data/site';

export const GET: APIRoute = async (context) => {
  const posts = await getPosts();
  return rss({
    title: site.title,
    description: site.description,
    site: context.site!,
    items: posts.map((post) => ({ title: post.data.title, pubDate: post.data.date, description: post.data.description, link: withBase(postUrl(post)), categories: [post.data.category, ...post.data.tags] })),
    customData: '<language>zh-CN</language>',
  });
};
