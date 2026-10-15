# Paistar 手记

[paistar.eu.cc](https://paistar.eu.cc/) · Astro 静态博客

## 开发

```bash
npm ci
npm run dev
```

```bash
npm run check
npm run build
npm test
npm run preview
```

## 写文章

在 `src/content/posts/` 新建 Markdown 或 MDX：

```yaml
---
title: 文章标题
description: 一句话摘要
date: 2026-10-15
category: 技术札记
tags: [前端]
cover: coding
pinned: false
draft: false
---
```

封面可选 `hello`、`coding`、`reading`、`life`、`design`、`notes`。图片在 `src/assets/scenes/`，对应配置在 `src/data/art.ts`。站点资料在 `src/data/site.ts`。

登录账号仅保存于当前浏览器，文章公开可读。

贴纸：[OpenMoji](https://openmoji.org/)（[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)）。场景：[Studio Ghibli](https://www.ghibli.jp/works/)。

字体：Noto Sans SC / Noto Serif SC（SIL Open Font License），通过 Fontsource 在本站托管。
