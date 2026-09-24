import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.TEST_URL || "http://127.0.0.1:4179";
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const errors = [];
await fs.mkdir(".qa", { recursive: true });

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle" });
  assert.match(await page.title(), /Paistar/);
  assert.equal(await page.locator("a.tool-card").count(), 5);
  await page.screenshot({ path: ".qa/desktop.png", fullPage: true });

  await page.getByRole("textbox", { name: "搜索工具" }).fill("二维码");
  assert.equal(await page.locator("a.tool-card").count(), 1);
  await page.getByRole("textbox", { name: "搜索工具" }).fill("");
  await page.getByRole("button", { name: /文本与编码/ }).click();
  assert.equal(await page.locator("a.tool-card").count(), 2);
  await page.getByRole("button", { name: /全部工具/ }).click();

  await page.goto(`${base}/tools/json/`);
  await page.screenshot({ path: ".qa/tool-json.png", fullPage: true });
  await page.getByRole("textbox", { name: "输入 JSON" }).fill('{"ok":true,"n":2}');
  await page.getByRole("button", { name: "格式化" }).click();
  assert.match(await page.getByRole("textbox", { name: "JSON 转换结果" }).inputValue(), /\n  "ok": true/);
  await page.getByRole("button", { name: "压缩" }).click();
  assert.equal(await page.getByRole("textbox", { name: "JSON 转换结果" }).inputValue(), '{"ok":true,"n":2}');
  await page.getByRole("textbox", { name: "输入 JSON" }).fill("{broken}");
  await page.getByRole("button", { name: "格式化" }).click();
  assert.match(await page.locator("p[role=alert]").innerText(), /解析失败/);

  await page.goto(`${base}/tools/timestamp/`);
  await page.getByRole("textbox", { name: "时间戳或日期" }).fill("0");
  await page.getByRole("button", { name: "转换" }).click();
  assert.match(await page.getByText("1970-01-01T00:00:00.000Z").innerText(), /1970/);
  await page.getByRole("textbox", { name: "时间戳或日期" }).fill("not-a-date");
  await page.getByRole("button", { name: "转换" }).click();
  assert.match(await page.locator("p[role=alert]").innerText(), /无法识别/);

  await page.goto(`${base}/tools/base64/`);
  await page.getByRole("textbox", { name: "待编解码文本" }).fill("你好🌟");
  await page.getByRole("button", { name: "编码", exact: true }).click();
  const encoded = await page.getByRole("textbox", { name: "编解码结果" }).inputValue();
  assert.equal(encoded, Buffer.from("你好🌟").toString("base64"));
  await page.getByRole("textbox", { name: "待编解码文本" }).fill(encoded);
  await page.getByRole("button", { name: "解码", exact: true }).click();
  assert.equal(await page.getByRole("textbox", { name: "编解码结果" }).inputValue(), "你好🌟");
  await page.getByRole("tab", { name: "URL 组件" }).click();
  await page.getByRole("textbox", { name: "待编解码文本" }).fill("a b&c");
  await page.getByRole("button", { name: "编码", exact: true }).click();
  assert.equal(await page.getByRole("textbox", { name: "编解码结果" }).inputValue(), "a%20b%26c");

  await page.goto(`${base}/tools/diff/`);
  await page.getByRole("textbox", { name: "原始文本" }).fill("A\nold\nZ\n");
  await page.getByRole("textbox", { name: "修改后文本" }).fill("A\nnew\nZ\n");
  await page.getByRole("button", { name: "比较差异" }).click();
  assert.match(await page.locator("[aria-label='文本差异结果']").innerText(), /old[\s\S]*new/);
  assert.match(await page.getByText(/新增 1 行/).innerText(), /删除 1 行/);

  await page.goto(`${base}/tools/qr/`);
  await page.screenshot({ path: ".qa/tool-qr.png", fullPage: true });
  await page.getByRole("textbox", { name: "二维码内容" }).fill("https://example.com/?q=测试");
  await page.getByRole("button", { name: "生成二维码" }).click();
  await page.waitForFunction(() => document.querySelector('img[alt^="二维码"]')?.getAttribute("src")?.startsWith("data:image/png;base64,"));
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "下载 PNG" }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "paistar-qr.png");

  await page.goto(base);
  await page.getByRole("button", { name: "切换白天或黑夜模式" }).click();
  assert.equal(await page.locator("html").evaluate((node) => node.classList.contains("dark")), true);
  await page.reload({ waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("html").evaluate((node) => node.classList.contains("dark")), true);
  assert.equal(await page.evaluate(() => localStorage.getItem("paistar-theme")), "dark");
  await page.screenshot({ path: ".qa/dark.png", fullPage: false });
  await page.goto(`${base}/missing-page/`);
  assert.match(await page.locator("body").innerText(), /这里暂时/);
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 });
  const phone = await mobile.newPage();
  phone.on("pageerror", (error) => errors.push(error.message));
  await phone.goto(base, { waitUntil: "networkidle" });
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "mobile horizontal overflow");
  await phone.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await phone.locator(".tool-card").first().evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration) < 0.01), true, "reduced motion preference ignored");
  await phone.screenshot({ path: ".qa/mobile.png", fullPage: true });
  await phone.getByRole("button", { name: "打开导航菜单" }).click();
  assert.equal(await phone.getByRole("navigation", { name: "手机导航" }).isVisible(), true);
  await phone.screenshot({ path: ".qa/mobile-menu.png", fullPage: false });
  await phone.getByRole("navigation", { name: "手机导航" }).getByRole("link", { name: /更新记录/ }).click();
  await phone.waitForURL("**/updates/");
  await phone.getByRole("heading", { name: /每一次/ }).waitFor();
  assert.match(await phone.title(), /更新记录/);
  await mobile.close();

  assert.deepEqual(errors, []);
  console.log("E2E passed: search, filters, five tools, theme, mobile menu, 404; screenshots in .qa/");
} finally { await browser.close(); }
