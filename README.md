# Paistar 手记

[paistar.eu.cc](https://paistar.eu.cc/) · Astro 服务端博客 · MySQL 8.4 · Docker · Caddy

保留现有博客外观，文章和账号使用 MySQL 持久化。访客可阅读公开文章；注册用户仅有阅读权限和本人密码修改权限；管理员可上传、编辑、预览、保存草稿和发布文章。

## 开发

```bash
npm ci
cp .env.example .env
# 填写本地 MySQL 连接信息、ADMIN_PASSWORD_FILE 和 UPLOAD_DIR
npm run build
npm run bootstrap
npm run dev
```

```bash
npm run check
npm run build
npm test
npm start
```

## 写文章

管理员登录后进入 `/admin/`，点击「写文章」。支持直接编辑或上传 Markdown 文件，图片上传后转换成 WebP 并保存到服务器。文章元数据示例：

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

`src/content/posts/` 中的原有六篇文章只在首次安装时导入数据库；重新部署不会覆盖在线修改。上传的 MDX 仅解析 Markdown 内容，不执行 JavaScript 导入或 JSX 组件。文章保存有版本冲突检查，草稿不进入公开页面、搜索、RSS 或站点地图。

## 账号

初始管理员用户名为 `admin`，随机密码保存在服务器受限文件中。在自己的服务器终端查看：

```bash
sudo cat /opt/paistar/apps/blog/secrets/admin-initial-password
```

首次登录必须修改密码。密码以 scrypt 哈希存储，登录状态使用 HttpOnly、Secure Cookie 和数据库会话；退出及修改密码会撤销相应会话。注册接口固定创建 reader，所有文章写入接口在服务端校验管理员权限和 CSRF。

尚未配置邮件验证、邮件找回密码或第三方登录。旧版浏览器演示账号不属于真实账号，需要重新注册。

## 部署与回滚

服务器应用目录 `/opt/paistar/apps/blog`，MySQL 配置 `/opt/paistar/infra`，数据 `/srv/paistar/mysql`，上传图片 `/srv/paistar/uploads`。

```bash
sudo bash deploy/install.sh "$PWD" <release-id>
sudo docker compose --project-directory /opt/paistar/apps/blog ps
curl --fail http://127.0.0.1:4321/api/health
```

首次部署使用私有预览。DNS 生效且云防火墙 TCP 80/443 放行后，在对应源码目录执行：

```bash
sudo bash deploy/enable-public-tls.sh "$PWD"
```

Caddy 自动申请并续期域名证书。MySQL 仅绑定本机，不开放公网 3306。应用和代理分别限制为 1 GiB、256 MiB。服务器按用户要求不配置 Swap。

GitHub Actions 先执行检查、测试和构建；`main` 且仓库变量 `SERVER_DEPLOY_ENABLED=true` 时通过专用受限 SSH 密钥部署。仓库 Secrets 为 `SERVER_SSH_HOST`、`SERVER_SSH_KEY`、`SERVER_SSH_HOST_KEY`。该密钥只允许部署指定的最新 main 提交，不能用于交互终端。

部署前执行数据库和上传目录备份，启动失败自动恢复上一版镜像。手动恢复上一个镜像：

```bash
cd /opt/paistar/apps/blog
sudo cp previous-release.env .env
sudo docker compose up -d --wait
```

数据库每日备份保留七天，位置 `/var/backups/paistar`；上传目录也需定期备份到其他设备。同机备份无法防止服务器磁盘丢失。旧静态版本保留在 `codex/before-server-migration`，只用于旧站回滚，不包含新账号或在线新增文章。

## DNS 与 HTTPS

Cloudflare 保留现有域名管理，将原先四条 GitHub Pages 根域名 A 记录替换为一条：`A / @ / 18.142.18.23`，TTL 自动，首次切换先选「仅 DNS」。若有旧的根域名 AAAA 也应移除，避免请求分流到旧站。无需更改域名的 NS。

先确认服务器 80/443 已放行，再启用上面的公网 TLS 配置。证书签发并验证成功后，可开启 Cloudflare 代理，SSL/TLS 模式选择「完全（严格）」。不要给 `/api/*`、`/admin/*`、`/account/*` 设置缓存全部内容的规则。

## 素材

贴纸：[OpenMoji](https://openmoji.org/)（[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)）。场景：[Studio Ghibli](https://www.ghibli.jp/works/)。

字体：Noto Sans SC / Noto Serif SC（SIL Open Font License），通过 Fontsource 在本站托管。

鼠标拖尾：[React Bits · Ribbons](https://github.com/DavidHDev/react-bits/tree/main/src/content/Animations/Ribbons)，许可证保留在 public/credits/。
