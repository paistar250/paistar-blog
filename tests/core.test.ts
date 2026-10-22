import test from 'node:test';
import assert from 'node:assert/strict';
import type { APIContext } from 'astro';
import { hashPassword,verifyPassword,validPassword } from '../src/server/auth.ts';
import { renderMarkdown,importMarkdown } from '../src/server/markdown.ts';
import { csrf,requireAdmin,HttpError } from '../src/server/http.ts';
import { validatePost } from '../src/server/posts.ts';

test('password verifier uses independent salts and rejects the wrong password',async()=>{
  const password='fixture-only-strong-password-2026';
  const one=await hashPassword(password);
  const two=await hashPassword(password);
  assert.notEqual(one,two);
  assert.ok(!one.includes(password));
  assert.equal(await verifyPassword(password,one),true);
  assert.equal(await verifyPassword('wrong-password',one),false);
  assert.equal(await verifyPassword(password,'malformed'),false);
  assert.equal(validPassword('short'),false);
});

test('rendered Markdown removes executable markup and unsafe URLs',async()=>{
  const result=await renderMarkdown('## 相同标题\n\n## 相同标题\n\n<script>alert(1)</script>\n\n<img src="x" onerror="alert(2)">\n\n[坏链接](javascript:alert(3))\n\n```js\nconst value = 1;\n```');
  assert.doesNotMatch(result.html,/<script|onerror|javascript:/i);
  assert.match(result.html,/const/);
  assert.match(result.html,/shiki/);
  assert.equal(result.headings.length,2);
  assert.notEqual(result.headings[0].slug,result.headings[1].slug);
});

test('Markdown upload parses YAML but never executes MDX modules',()=>{
  const input=importMarkdown('---\ntitle: 测试\ntags: [安全]\n---\n\n## 正文','a-note.md');
  assert.equal(input.title,'测试');
  assert.deepEqual(input.tags,['安全']);
  assert.throws(()=>importMarkdown('import fs from "node:fs";\n\n正文','bad.mdx'),HttpError);
  assert.throws(()=>importMarkdown('正文','payload.html'),HttpError);
  assert.doesNotThrow(()=>importMarkdown('```js\nimport x from "package";\n```','code.md'));
});

test('server checks reject reader writes and unfinished admin credentials',()=>{
  const context=(role:string,mustChangePassword=false)=>({locals:{user:{id:1,role,mustChangePassword}}}) as unknown as APIContext;
  assert.throws(()=>requireAdmin(context('reader')),(error:unknown)=>error instanceof HttpError&&error.status===403);
  assert.throws(()=>requireAdmin(context('admin',true)),(error:unknown)=>error instanceof HttpError&&error.status===428);
  assert.equal(requireAdmin(context('admin')).role,'admin');
});

test('CSRF rejects cross-origin requests and mismatched tokens',()=>{
  process.env.APP_ORIGIN='https://paistar.eu.cc';
  const token='a'.repeat(64);
  const context=(origin:string,header:string)=>({request:new Request('https://paistar.eu.cc/api/auth/logout',{headers:{origin,'x-csrf-token':header}}),cookies:{get:()=>({value:token})}}) as unknown as APIContext;
  assert.doesNotThrow(()=>csrf(context('https://paistar.eu.cc',token)));
  assert.throws(()=>csrf(context('https://attacker.example',token)),HttpError);
  assert.throws(()=>csrf(context('https://paistar.eu.cc','b'.repeat(64))),HttpError);
});

test('article validation prevents path traversal and enforces tags and metadata limits',()=>{
  const valid={slug:'safe-post',title:'一篇文章',description:'摘要',body:'正文',category:'随笔',tags:['生活'],date:'2026-10-22',draft:false};
  assert.equal(validatePost(valid).draft,false);
  assert.throws(()=>validatePost({...valid,slug:'../../etc/passwd'}),HttpError);
  assert.throws(()=>validatePost({...valid,tags:Array(20).fill('tag')}),HttpError);
});
