import assert from 'node:assert/strict';
import { mkdirSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4321';
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
mkdirSync('.qa', { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(base + '/', { waitUntil: 'networkidle' });
assert.match(await page.title(), /Paistar 手记/);
assert.ok(await page.locator('.bento-card').count() >= 8);
await page.screenshot({ path: '.qa/home-desktop-dark.png', fullPage: true });
await page.getByRole('button', { name: '切换白天或黑夜模式' }).click();
assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
await page.reload({ waitUntil: 'domcontentloaded' });
assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
await page.screenshot({ path: '.qa/home-desktop-light.png', fullPage: true });

const articleHrefs = readdirSync('dist/posts', { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => `/posts/${entry.name}/`);
assert.ok(articleHrefs.length >= 6);
for (const href of articleHrefs) {
  const response = await page.goto(base + href, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200, href);
  assert.ok(await page.locator('.article-prose h2').count() > 0, href);
  assert.ok(await page.locator('.article-main h1').innerText(), href);
}
await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(150);
assert.ok(Number(await page.locator('.reading-progress').getAttribute('aria-valuenow')) > 0);

await page.goto(base + '/search/', { waitUntil: 'networkidle' });
await page.locator('#search-input').fill('Bento');
try { await page.waitForFunction(() => document.querySelectorAll('.search-result').length > 0, null, { timeout: 10000 }); }
catch { throw new Error(`Search failed: ${await page.locator('#search-status').innerText()} | errors: ${errors.join('; ')}`); }
assert.ok((await page.locator('.search-result').first().getAttribute('href')).includes('/posts/'));

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, deviceScaleFactor: 1 });
const phone = await mobile.newPage();
await phone.goto(base + '/', { waitUntil: 'networkidle' });
assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Mobile horizontal overflow');
await phone.screenshot({ path: '.qa/home-mobile.png', fullPage: true });
await phone.getByRole('button', { name: '展开菜单' }).click();
assert.equal(await phone.locator('#mobile-nav').isVisible(), true);
await phone.locator('#mobile-nav').getByRole('link', { name: '归档' }).click();
assert.match(phone.url(), /\/archive\//);
await phone.goto(base + articleHrefs[0], { waitUntil: 'networkidle' });
assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Mobile article overflow');
await phone.screenshot({ path: '.qa/article-mobile.png', fullPage: true });
for (const path of ['/about/', '/archive/', '/categories/', '/tags/', '/search/', '/login/', '/signup/']) {
  await phone.goto(base + path, { waitUntil: 'domcontentloaded' });
  assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Mobile overflow: ${path}`);
  if (path === '/login/') await phone.screenshot({ path: '.qa/login-mobile.png', fullPage: true });
}

const email = `demo-${Date.now()}@example.test`;
const password = 'example-demo-only-8274';
await page.goto(base + '/signup/', { waitUntil: 'networkidle' });
await page.screenshot({ path: '.qa/signup-desktop.png', fullPage: true });
await page.locator('[name=name]').fill('测试读者');
await page.locator('[name=email]').fill(email);
await page.locator('[name=password]').fill(password);
await page.locator('[name=confirm]').fill(password);
await page.locator('[data-signup] button[type=submit]').click();
await page.waitForURL('**/login/?registered=1');
await page.screenshot({ path: '.qa/login-desktop.png', fullPage: true });
const storedAccounts = await page.evaluate(() => localStorage.getItem('paistar-demo-accounts-v1'));
assert.ok(storedAccounts.includes(email));
assert.ok(!storedAccounts.includes(password), 'Plaintext password was stored');
await page.locator('[name=email]').fill(email);
await page.locator('[name=password]').fill('wrong-password');
await page.locator('[data-login] button[type=submit]').click();
await page.getByText('邮箱或密码不正确。').waitFor();
await page.locator('[name=password]').fill(password);
await page.locator('[name=remember]').check();
await page.locator('[data-login] button[type=submit]').click();
await page.waitForURL(base + '/');
assert.ok(await page.locator('[data-account-link]').innerText().then((text) => text.includes('测试读者')));
assert.ok(await page.evaluate(() => localStorage.getItem('paistar-demo-session-v1')));
await page.getByRole('button', { name: '退出' }).click();
await page.waitForURL(base + '/');
assert.equal(await page.evaluate(() => localStorage.getItem('paistar-demo-session-v1')), null);
await page.goto(base + '/login/', { waitUntil: 'networkidle' });
await page.locator('[name=email]').fill(email);
await page.locator('[name=password]').fill(password);
await page.locator('[data-login] button[type=submit]').click();
await page.waitForURL(base + '/');
assert.equal(await page.evaluate(() => localStorage.getItem('paistar-demo-session-v1')), null);
assert.ok(await page.evaluate(() => sessionStorage.getItem('paistar-demo-session-v1')));
await page.setViewportSize({ width: 390, height: 844 });
assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Signed-in mobile header overflow');
await page.setViewportSize({ width: 1440, height: 900 });
await page.getByRole('button', { name: '退出' }).click();
await page.waitForURL(base + '/');
await page.goto(base + '/login/', { waitUntil: 'networkidle' });
for (let i = 0; i < 5; i++) await page.locator('[data-secret-cat]').click();
await page.waitForURL(base + '/');
assert.match(await page.locator('[data-account-link]').innerText(), /夜航访客/);
assert.equal(await page.evaluate(() => localStorage.getItem('paistar-demo-session-v1')), null);
assert.ok(await page.evaluate(() => sessionStorage.getItem('paistar-demo-session-v1')));
assert.deepEqual(errors, []);
await browser.close();
console.log(`Browser E2E passed: ${articleHrefs.length} linked articles, search, theme, mobile nav/layout, local account, logout and cat entry.`);
