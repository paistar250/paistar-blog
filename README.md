# Paistar 手记

基于 Astro 的中文个人博客。纯静态构建，发布到 GitHub Pages；文章用 Markdown/MDX 编写，搜索由 Pagefind 在构建时生成。无需服务器、数据库或前端密钥。

## 本地运行

需要 Node.js 24 和 npm。第一次运行：

```bash
npm ci
npm run dev
```

访问终端显示的本地地址。正式检查：

```bash
npm run check
npm run build
npm run preview
```

`npm run build` 会生成 `dist/`，并对静态 HTML 建立 Pagefind 搜索索引。直接用 `astro build` 不会生成搜索索引。

## 新增文章

在 `src/content/posts/` 新建 `my-story.md` 或 `my-story.mdx`。文件名就是文章 URL 的最后一段，例如 `/posts/my-story/`。建议用英文小写和连字符命名。最小示例：

```md
---
title: 我的第一篇文章
description: 用一句话介绍文章内容。
date: 2026-09-24
category: 技术札记
tags: [Astro, 前端]
draft: false
readingMinutes: 5
---

这里开始写正文。使用 ## 和 ### 标题会自动生成文章目录。
```

支持字段：`title`、`description`、`date`、`category` 必填；`tags`、`updated`、`draft`、`featured`、`readingMinutes` 可选。`draft: true` 不会发布。`featured: true` 可以成为首页焦点文章。分类和标签新增名称时，在 `src/lib/blog.ts` 的 `slugs` 对照表中添加英文路径名。

Markdown 内链请使用相对于文章路径的地址（例如 `../../about/`），这样在 GitHub 临时预览地址和正式域名下都能工作。MDX 可引入 Astro 组件。图片建议放在 `src/assets/` 并使用 `astro:assets` 的 `Image` 组件；`astro-static-site.mdx` 展示了生成响应式 WebP 图片的写法。每张图片都要写有意义的 `alt` 文本。

## 修改网站信息

`src/data/site.ts` 集中配置博客名称、作者、简介、公开 GitHub 地址和可选邮箱。邮箱留空时，联系页不会显示邮箱入口。首页、关于页的正文可直接修改对应的 `.astro` 文件。`scripts/generate-art.mjs` 用于生成示例插画、分享卡片和 PWA 图标；替换图片后可重新运行 `node scripts/generate-art.mjs`。

如需真实评论、邮件订阅或其他动态功能，应选择独立服务，并明确处理隐私、审核与反垃圾。本站目前只提供 GitHub 联系入口与 RSS；不会展示无法工作的表单或登录界面，也不要把服务密钥放进前端代码或仓库。

## 发布与域名

仓库的 `.github/workflows/deploy.yml` 在每次推送 `main` 时自动构建并部署，也可从 Actions 手动触发。GitHub 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。工作流使用 `withastro/action`、`actions/deploy-pages`；提交时必须包含 `package-lock.json`。

工作流读取两个 GitHub 仓库变量，可在 **Settings → Secrets and variables → Actions → Variables** 修改：

| 变量 | 预览地址 | 正式域名 |
| --- | --- | --- |
| `SITE_URL` | `https://paistar250.github.io` | `https://paistar.eu.cc` |
| `BASE_PATH` | `/paistar-blog` | `/` |

默认值用于新仓库的临时地址 `https://paistar250.github.io/paistar-blog/`。切到正式域名时，设置上述正式值并重新运行工作流。GitHub Pages 的自定义域名必须在仓库 **Settings → Pages → Custom domain** 或 GitHub API 中设置；对于 Actions 发布源，仓库中的 `CNAME` 文件不负责绑定域名。正式 DNS 在 Cloudflare 由四条根域名 A 记录指向 GitHub Pages：`185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153`。先以 DNS only 验证 GitHub 证书与 HTTPS，再按需启用 Cloudflare 代理。

## 已实现功能

- 首页、文章页、分类、标签、归档、搜索、目录、阅读进度、相关文章及前后篇；
- Markdown/MDX、代码高亮、浅色/深色模式、响应式排版、减少动画偏好；
- canonical、Open Graph/Twitter 分享图、BlogPosting 结构化数据、站点地图、robots.txt、RSS；
- Astro 响应式图片、PWA 清单、离线回退页和已访问页面缓存、跳到正文与键盘焦点。

搜索在纯本地预览中需要先执行 `npm run build`；开发服务器没有生成 Pagefind 索引。PWA 离线功能需要 HTTPS（或浏览器允许的 localhost 环境）。
