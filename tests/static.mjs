import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : entry.name.endsWith('.html') ? [path] : [];
  });
}
function target(pathname) {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  return join(root, relative, relative.endsWith('/') || !relative.includes('.') ? 'index.html' : '');
}
const pages = walk(root);
let checked = 0;
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  for (const [, raw] of html.matchAll(/href="([^"]+)"/g)) {
    const url = new URL(raw.replaceAll('&amp;', '&'), 'https://paistar.eu.cc/' + relative(root, page).replaceAll('\\', '/'));
    if (url.origin !== 'https://paistar.eu.cc') continue;
    assert.ok(existsSync(target(url.pathname)), `Broken link in ${page}: ${raw}`);
    if (url.hash) {
      const linked = readFileSync(target(url.pathname), 'utf8');
      const fragment = decodeURIComponent(url.hash.slice(1));
      assert.ok(linked.includes(`id="${fragment}"`), `Missing fragment in ${page}: ${raw}`);
    }
    checked++;
  }
}
assert.ok(pages.some((page) => relative(root,page).startsWith('posts')), 'No article pages were generated');
assert.ok(existsSync(join(root, 'pagefind', 'pagefind.js')));
assert.ok(existsSync(join(root, 'sitemap-index.xml')));
assert.ok(existsSync(join(root, 'rss.xml')));
assert.ok(existsSync(join(root, 'login', 'index.html')));
assert.ok(existsSync(join(root, 'signup', 'index.html')));
const entry = readFileSync(join(root, 'index.html'), 'utf8');
assert.match(entry, /data-login/);
assert.match(entry, /直接阅读/);
assert.doesNotMatch(entry, /登录演示|auth-disclosure/);
const home = readFileSync(join(root, 'journal', 'index.html'), 'utf8');
assert.match(home, /最新文章/);
assert.match(home, /置顶/);
assert.doesNotMatch(home, /工具台|bento-card/);
console.log(`Static audit passed: ${pages.length} HTML pages, ${checked} internal links and fragments.`);
