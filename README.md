# Paistar 手记

一个可长期维护的中文个人博客。Astro 生成纯静态页面，部署到 GitHub Pages，域名为 [paistar.eu.cc](https://paistar.eu.cc/)。Cloudflare 管理 DNS。首页采用原创不对称 Bento 网格，正文保持适合阅读的单栏排版。

## 本地运行与检查

需要 Node.js 24 和 npm。

```bash
npm ci
npm run dev
npm run check
npm run build
npm test
npm run preview
```

`npm run build` 会在 `dist/` 生成所有页面和 Pagefind 搜索索引。开发服务器没有搜索索引；测试搜索请在构建后使用 `npm run preview`。`npm test` 会检查生成的页面、链接、锚点、RSS 和站点地图。浏览器交互测试可运行 `npm run test:e2e`（需要本机 Chrome）。

## 新增或更新文章

在 `src/content/posts/` 新建 `my-story.md` 或 `my-story.mdx`。文件名决定 URL，例如 `/posts/my-story/`。示例文章可以直接替换；修改后提交到 `main` 即自动发布。

```md
---
title: 我的第一篇文章
description: 一句话介绍文章内容。
date: 2026-09-28
category: 技术札记
tags: [写作, 前端]
draft: false
featured: false
pinned: false
readingMinutes: 5
---

这里开始正文。用 ## 和 ### 标题生成文章目录。
```

`title`、`description`、`date`、`category` 必填；`tags`、`updated`、`draft`、`featured`、`pinned`、`readingMinutes` 可选。`draft: true` 不发布。首页置顶区使用最新的 `pinned: true` 文章；精选区使用未置顶的 `featured: true` 文章。首页最新记录、分类、标签、归档和 RSS 会自动更新。新分类或标签建议在 `src/lib/blog.ts` 的 `slugs` 中加入稳定英文路径。

Markdown 内链使用相对路径，比如 `../../about/`。MDX 可导入 Astro 组件。图片放在 `src/assets/`，使用 `astro:assets` 的 `Image` 组件生成优化格式和尺寸，并为图片写有意义的 `alt`。示例见 `astro-static-site.mdx`。

## 修改外观与资料

`src/data/site.ts` 管理站名、作者、介绍、导航及公开联系地址。首页卡片在 `src/pages/index.astro`，文章阅读样式在 `src/styles/article.css`，全局明暗主题在 `src/styles/global.css`。关于页和联系页分别位于 `src/pages/about.astro` 与 `src/pages/contact.astro`。所有卡片和导航都应指向真实内容。

主题首次加载时在 HTML 头部读取 `paistar-theme`，避免闪烁。未选择时跟随系统颜色偏好；切换会记住选择。系统偏好减少动画时，动画与平滑滚动会关闭。

## 本地演示账号

`/signup/` 和 `/login/` 只演示浏览器本地状态。账号记录保存在当前浏览器的 `localStorage`；密码使用随机盐与 PBKDF2 SHA-256 派生校验值，不保存明文。勾选“记住登录”时登录状态保存在 `localStorage`，否则保存在 `sessionStorage`。退出只清除状态，不删除演示账号。登录页连续点小猫 5 次可进入临时访客演示。

**本地演示不用于保护内容。** 浏览器数据可以被本机用户查看或删除，账号不跨设备同步，也没有服务端身份验证。所有博客文章对未登录访客公开。不要把真实常用密码输入演示表单，不要在前端放密钥。若以后需要真实账户、私密文章或评论，必须另接后端并重新设计权限与隐私说明。

## 部署与回退

`.github/workflows/deploy.yml` 在推送 `main` 后执行 `npm ci`、类型检查、静态构建、链接审计，再用 GitHub Pages artifact 部署。GitHub 仓库 **Settings → Pages → Build and deployment → Source** 应为 **GitHub Actions**；Custom domain 为 `paistar.eu.cc`。Cloudflare 根域 A 记录指向 GitHub Pages 的四个地址：`185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153`。域名证书由 GitHub Pages 为自定义域名签发；Cloudflare 代理如启用，SSL/TLS 应使用 Full (strict)。

发布前的工具台版本保存在 Git 标签 `tools-v2`，更早的 Astro 博客保存在 `blog-v1`。需要回退时，从对应标签创建修复分支并重新发布，不要删除仓库或直接删代码。

## 静态功能

首页、文章、分类、标签、归档、Pagefind 站内搜索、文章目录、阅读进度、前后篇、相关文章、代码高亮、深浅主题、手机布局；canonical、分享卡、BlogPosting 结构化数据、RSS、站点地图、robots.txt；图片优化、跳到正文、键盘焦点、PWA 清单、已访问页面缓存及离线回退页。登录演示仅保存在浏览器中。
