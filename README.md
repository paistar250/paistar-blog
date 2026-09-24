# Paistar · 工具台

运行在 [paistar.eu.cc](https://paistar.eu.cc/) 的个人工具平台。使用 Next.js App Router 的 `output: 'export'`、Tailwind CSS v4 和 shadcn/ui 组件；GitHub Pages 只托管 `out/` 静态文件，不需要服务器或数据库。

## 功能

- 首页：品牌区、全局搜索（支持 `/` 快捷键）、分类导航、精选工具、可筛选工具卡片。
- 五个可用工具：JSON 格式化/压缩、时间戳转换、Base64/URL 编解码、逐行文本对比、二维码生成/PNG 下载。
- 独立工具详情页、关于、更新记录、404、robots 和 sitemap。
- 深浅色模式：优先读取本地选择，否则跟随系统；首屏 HTML 在加载样式前设定主题。移动端导航与适度玻璃效果；尊重 `prefers-reduced-motion`。
- 工具输入在浏览器里处理。本站不提供登录、评论或任何需要服务器的假功能。

## 本地开发和验证

需要 Node.js 24 与 npm：

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
```

`npm run build` 会在 `out/` 生成可直接部署的静态网站。想检查真正的导出文件，可运行 `npm run preview`，再在另一个终端运行 `TEST_URL=http://127.0.0.1:4178 npm run test:e2e`。在 Windows PowerShell 中先执行 `$env:TEST_URL='http://127.0.0.1:4178'`，再执行 `npm run test:e2e`。E2E 默认使用 `C:\Program Files\Google\Chrome\Application\chrome.exe`；也可设置 `CHROME_PATH`。浏览器测试覆盖搜索、分类、五个工具、主题、手机导航和 404，并把截图放入 `.qa/`。

## 增加工具

1. 在 `src/lib/tools.ts` 中添加工具的 id、名称、分类、关键词和说明。
2. 在 `src/components/tool-workspace.tsx` 中实现工具组件，并在 `ToolWorkspace` 的 switch 中注册。
3. `src/app/tools/[slug]/page.tsx` 的 `generateStaticParams` 会在构建时为每个工具生成 HTML。新工具必须在浏览器离线逻辑中真正可用。
4. 为转换逻辑补充 `tests/transform.test.mjs` 或 E2E 用例，再运行以上检查。

全站视觉变量在 `src/app/globals.css`；导航在 `src/components/site-header.tsx`。基础按钮使用 shadcn/ui CLI 生成的 `src/components/ui/button.tsx`。编辑样式时保持清晰文字对比，玻璃材质只用于导航与搜索建议浮层。

## 发布与回退

推送到 `main` 后，`.github/workflows/deploy.yml` 运行单元测试、lint、静态构建，并把 `out/` 部署到已启用 GitHub Actions 发布源的 GitHub Pages。仓库 Pages 自定义域名保持 `paistar.eu.cc`；`public/.nojekyll` 防止静态资源路径受 Jekyll 处理。域名及 HTTPS 在 GitHub Pages Settings 中查看；Cloudflare DNS 继续指向 GitHub Pages。

旧博客完整代码保存在 Git 标签 [`blog-v1`](https://github.com/paistar250/paistar-blog/tree/blog-v1)。如需回退，先在本地以该标签检查旧版本，再对工具平台上线提交执行 `git revert` 并推送 `main`；Actions 会重新发布旧站。操作前检查之后的提交，避免一并撤销新的内容。
