import { createHash } from 'node:crypto';
import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { codeToHtml, bundledLanguages } from 'shiki';
import { parse } from 'yaml';
import { HttpError } from './http.ts';

export type Heading = { depth: number; slug: string; text: string };
const cache = new Map<string, { html: string; headings: Heading[] }>();
const plain = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

export async function renderMarkdown(markdown: string) {
  const key = createHash('sha256').update(markdown).digest('hex');
  if (cache.has(key)) return cache.get(key)!;
  const headings: Heading[] = [];
  const ids = new Map<string, number>();
  const code = new Map<string, string>();
  const renderer = new Marked({ gfm: true, breaks: false, async: true });
  renderer.use({
    async: true,
    walkTokens: async token => {
      if (token.type === 'code') {
        const candidate = (token.lang || 'text').split(/\s/)[0];
        const lang = candidate in bundledLanguages ? candidate as keyof typeof bundledLanguages : 'text';
        code.set(token.text + '\0' + (token.lang || ''), await codeToHtml(token.text, { lang, themes: { light: 'github-light', dark: 'github-dark' } }));
      }
    },
    renderer: {
      code(token) { return code.get(token.text + '\0' + (token.lang || '')) || '<pre><code></code></pre>'; },
      heading(token) {
        const text = plain(token.text).replace(/[*_`]/g, '');
        const base = text.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 100) || 'section';
        const count = (ids.get(base) || 0) + 1;
        ids.set(base, count);
        const slug = count === 1 ? base : `${base}-${count}`;
        headings.push({ depth: token.depth, slug, text });
        return `<h${token.depth} id="${slug}">${this.parser.parseInline(token.tokens)}</h${token.depth}>`;
      },
    },
  });
  const output = await renderer.parse(markdown);
  const color = [/^#[0-9a-f]{3,8}$/i, /^rgba?\([0-9.,%\s]+\)$/];
  const html = sanitizeHtml(output, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'span', 'del', 'input'],
    allowedAttributes: {
      '*': ['class'], 'h1': ['id'], 'h2': ['id'], 'h3': ['id'], 'h4': ['id'], 'h5': ['id'], 'h6': ['id'],
      a: ['href','title','target','rel'], img: ['src','alt','title','width','height','loading','decoding'],
      pre: ['class','style','tabindex'], span: ['class','style'], code: ['class'],
      input: ['type','checked','disabled'], th: ['align'], td: ['align'],
    },
    allowedSchemes: ['http','https','mailto'], allowProtocolRelative: false,
    allowedStyles: {
      '*': { color, 'background-color': color, '--shiki-dark': color, '--shiki-dark-bg': color, '--shiki-light': color, '--shiki-light-bg': color, 'font-style': [/^italic$/], 'font-weight': [/^(?:bold|[1-9]00)$/], 'text-decoration': [/^underline$/] },
    },
    transformTags: {
      a: (_tag, attributes) => ({ tagName: 'a', attribs: { ...attributes, rel: 'noopener noreferrer' } }),
      img: (_tag, attributes) => ({ tagName: 'img', attribs: { ...attributes, loading: 'lazy', decoding: 'async' } }),
      input: (_tag, attributes) => ({ tagName: 'input', attribs: { type: 'checkbox', disabled: '', ...(Object.hasOwn(attributes, 'checked') ? { checked: '' } : {}) } }),
    },
  });
  const result = { html, headings };
  if (cache.size >= 80) cache.delete(cache.keys().next().value!);
  cache.set(key, result);
  return result;
}

export function importMarkdown(content: string, filename: string): Record<string, unknown> {
  if (!/\.(?:md|mdx|markdown)$/i.test(filename) || Buffer.byteLength(content) > 400_000) throw new HttpError(400, '请上传不超过 400 KB 的 Markdown 文件。');
  const source = content.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  let data: Record<string, unknown> = {};
  let body = source;
  if (match) {
    try {
      const parsed: unknown = parse(match[1], { schema: 'core', maxAliasCount: 20 });
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      data = parsed as Record<string, unknown>;
    } catch { throw new HttpError(400, '文章开头的 YAML 信息格式不正确。'); }
    body = match[2];
  }
  let fenced = false;
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (!fenced && /^(?:import|export)\s/.test(line)) throw new HttpError(400, '在线后台不执行 MDX 脚本，请先移除 import/export，改用 Markdown 图片与排版。');
  }
  return { ...data, slug: filename.replace(/\.(?:md|mdx|markdown)$/i, '').toLowerCase().replace(/[^a-z0-9-]/g, '-'), body, date: String(data.date || new Date().toISOString().slice(0,10)), tags: data.tags || [], cover: data.cover || 'notes', draft: data.draft !== false };
}
