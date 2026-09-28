import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export async function getPosts(): Promise<Post[]> {
  return (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function postUrl(post: Post): string {
  return `/posts/${post.id}/`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai' }).format(date);
}

const slugs: Record<string, string> = {
  技术札记: 'tech', 生活随笔: 'life', 读书笔记: 'reading',
  Astro: 'astro', 前端: 'frontend', 写作: 'writing', 阅读: 'books',
  设计: 'design', 效率: 'productivity', 旅行: 'travel', Markdown: 'markdown',
};

export function termSlug(term: string): string {
  return slugs[term] || encodeURIComponent(term);
}

export function categories(posts: Post[]) {
  const counts = new Map<string, number>();
  posts.forEach((post) => counts.set(post.data.category, (counts.get(post.data.category) || 0) + 1));
  return [...counts].map(([name, count]) => ({ name, count, slug: termSlug(name) })).sort((a, b) => b.count - a.count);
}

export function tags(posts: Post[]) {
  const counts = new Map<string, number>();
  posts.forEach((post) => post.data.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
  return [...counts].map(([name, count]) => ({ name, count, slug: termSlug(name) })).sort((a, b) => b.count - a.count);
}

export function relatedPosts(post: Post, posts: Post[], count = 3): Post[] {
  return posts.filter((item) => item.id !== post.id)
    .map((item) => ({ item, score: Number(item.data.category === post.data.category) * 3 + item.data.tags.filter((tag) => post.data.tags.includes(tag)).length }))
    .sort((a, b) => b.score - a.score || b.item.data.date.valueOf() - a.item.data.date.valueOf())
    .slice(0, count).map(({ item }) => item);
}
