import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import sharp from 'sharp';

await mkdir('.generated', { recursive: true });
await mkdir('public/media', { recursive: true });
await sharp('src/assets/scenes/reading.jpg').resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 84 }).toFile('public/media/reading.webp');
const posts = [];
for (const filename of await readdir('src/content/posts')) {
  if (!/\.mdx?$/.test(filename)) continue;
  const source = (await readFile(path.join('src/content/posts', filename), 'utf8')).replaceAll('\r\n', '\n');
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing frontmatter: ${filename}`);
  const data = parse(match[1], { schema: 'core', maxAliasCount: 20 });
  let body = match[2];
  if (filename.endsWith('.mdx')) {
    body = body.replace(/^import .*;\s*$/gm, '').replace(/<Image\s[^>]*\/>/g, '![夜晚书桌与阅读空间](/media/reading.webp)');
  }
  posts.push({ slug: filename.replace(/\.mdx?$/, ''), ...data, body: body.trim() });
}
await writeFile('.generated/seed-posts.json', JSON.stringify(posts, null, 2) + '\n');
console.log(`Prepared ${posts.length} existing posts for one-time database migration.`);
