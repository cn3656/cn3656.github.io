# Atom Blog

A lightweight, Hexo-compatible static blog generator with pluggable themes and multi-platform deployment.

一个轻量级、兼容 Hexo 的静态博客生成器，支持可插拔主题和多平台部署。

---

## Features / 特性

- **Hexo Compatible / Hexo 兼容** — 无缝支持 Hexo 目录结构、Front Matter 和标签插件
- **Pluggable Themes / 可插拔主题** — 基于 EJS 的主题系统，兼容 Hexo 主题规范
- **Plugin System / 插件系统** — Hook 架构，支持 `hexo-*` 和 `atom-*` npm 包
- **Multi-platform Deploy / 多平台部署** — GitHub Pages、Gitee Pages、Cloudflare Pages
- **Fast Build / 极速构建** — 最小依赖，闪电般的静态生成速度
- **Modern CSS / 现代样式** — 响应式默认主题，支持暗色/亮色模式，毛玻璃头部、卡片动画
- **SEO Ready / SEO 友好** — 自动生成 sitemap.xml、atom.xml、语义化 HTML
- **Markdown** — GFM 语法、代码高亮（highlight.js）、Hexo 标签插件
- **Chinese Optimized / 中文优化** — Noto Sans SC 字体、中文排版优化

---

## Quick Start / 快速开始

```bash
# Clone / 克隆
git clone https://github.com/cn3656/atom.git
cd atom

# Install dependencies / 安装依赖
npm install

# Create a new post / 创建新文章
node bin/atom.js new "我的第一篇文章"

# Generate static files / 生成静态文件
node bin/atom.js generate

# Preview locally / 本地预览（默认端口 4000）
node bin/atom.js server

# Deploy / 部署
node bin/atom.js deploy
```

---

## Directory Structure / 目录结构

```
.
├── _config.yml          # 站点配置（兼容 Hexo 格式）
├── source/
│   ├── _posts/          # 博客文章（Markdown）
│   ├── _drafts/         # 草稿
│   ├── _data/           # 数据文件（YAML/JSON）
│   ├── about/           # 关于页面
│   ├── contact/         # 留言板
│   ├── friends/         # 友情链接
│   └── images/          # 静态资源
├── themes/
│   ├── default/         # 默认主题（现代简洁风格）
│   └── matery/          # Matery 主题（Material Design）
├── plugins/             # 本地插件
├── scaffolds/           # 文章/页面模板
├── lib/                 # 核心引擎
│   ├── core/            # 生成器、配置、数据、渲染器
│   ├── theme/           # 主题管理器
│   ├── plugin/          # 插件管理器
│   └── deploy/          # 部署模块
└── bin/
    └── atom.js          # CLI 入口
```

---

## Configuration / 配置

编辑 `_config.yml`：

```yaml
title: My Blog              # 站点标题
subtitle: A blog by Atom    # 副标题
author: Your Name           # 作者
language: zh-CN             # 语言
timezone: Asia/Shanghai     # 时区
url: https://yourname.github.io
theme: default              # 主题名
per_page: 10                # 每页文章数

deploy:
  type: git                 # git | gitee | cloudflare
  repo: https://github.com/...
  branch: main

menu:                       # 导航菜单
  Home: /
  Archives: /archives/
  About: /about/
```

---

## Creating Posts / 创建文章

文章是带 YAML Front Matter 的 Markdown 文件：

```markdown
---
title: Hello World
date: 2026-05-02
categories:
  - 默认分类
tags:
  - javascript
  - blog
---

你的内容在这里...
```

支持的 Front Matter 字段：
- `title` — 文章标题
- `date` — 发布日期
- `updated` — 更新日期
- `categories` — 分类（支持层级）
- `tags` — 标签
- `layout` — 自定义布局模板
- `excerpt` — 自定义摘要

---

## Theme Development / 主题开发

主题遵循 Hexo 规范：

```
themes/my-theme/
├── layout/
│   ├── layout.ejs    # 主布局（header/footer）
│   ├── index.ejs     # 首页
│   ├── post.ejs      # 文章页
│   ├── page.ejs      # 独立页面
│   ├── archive.ejs   # 归档页
│   ├── category.ejs  # 分类页
│   └── tag.ejs       # 标签页
├── source/
│   ├── css/
│   └── js/
└── _config.yml       # 主题配置
```

可用模板变量：
- `config` — 站点配置
- `theme` — 主题配置
- `page` — 当前页面数据
- `posts` — 文章列表
- `pagination` — 分页数据
- `categories` / `tags` — 分类/标签列表
- `archives` — 归档数据

---

## Plugin Development / 插件开发

```javascript
// plugins/my-plugin/index.js
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  
  hooks: {
    before_generate(ctx) {
      console.log('Generating...');
    },
    after_render(content, { post }) {
      return content.replace(/foo/g, 'bar');
    }
  }
};
```

可用 Hooks：
- `before_init` / `after_init` — 初始化前后
- `before_generate` / `after_generate` — 生成前后
- `before_render` / `after_render` — 渲染前后
- `before_deploy` / `after_deploy` — 部署前后
- `new_post` / `new_page` — 创建文章/页面时
- `server_middleware` — 开发服务器中间件

---

## Deployment / 部署

### GitHub Pages
```yaml
deploy:
  type: git
  repo: https://github.com/user/user.github.io.git
  branch: main
```

### Gitee Pages
```yaml
deploy:
  type: gitee
  gitee_repo: https://gitee.com/user/user.git
  branch: master
```

### Cloudflare Pages
```yaml
deploy:
  type: cloudflare
  cf_project: my-blog
```

或在 Cloudflare 控制台连接 GitHub 仓库：
- Build command: `npm run generate`
- Output directory: `public`

---

## Hexo Compatibility / Hexo 兼容性

| Feature / 功能 | Status / 状态 |
|---------|--------|
| YAML Front Matter | ✅ Supported / 已支持 |
| `_config.yml` | ✅ Supported / 已支持 |
| `source/_posts/` structure / 目录结构 | ✅ Supported / 已支持 |
| `<!-- more -->` excerpt / 摘要 | ✅ Supported / 已支持 |
| Hexo tag plugins / 标签插件 | ⚠️ Partial / 部分支持 (codeblock, quote, asset_img, post_link) |
| Hexo themes (EJS) / 主题 | ✅ Compatible / 兼容 |
| `hexo-*` npm plugins / 插件 | ✅ Auto-discovered / 自动发现 |
| Permalink patterns / 固定链接 | ✅ Supported / 已支持 |
| Categories & Tags / 分类和标签 | ✅ Supported / 已支持 |
| Scaffold templates / 脚手架模板 | ✅ Supported / 已支持 |
| `source/_data/` data files / 数据文件 | ✅ Supported / 已支持 |

---

## License / 许可证

MIT
