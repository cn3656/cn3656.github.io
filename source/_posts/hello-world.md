---
title: Hello World
date: 2026-05-02
categories:
  - 默认分类
tags:
  - ation
  - blog
---

欢迎来到 Atom Blog！这是你的第一篇文章。

## 快速开始

编辑 `source/_posts/` 目录下的 Markdown 文件来创建新文章。

```bash
# 生成静态文件
atom generate

# 本地预览
atom server

# 部署到 GitHub Pages
atom deploy
```

<!-- more -->

## 特性

- **兼容 Hexo** - 支持Hexo目录结构、Front Matter、标签插件
- **主题系统** - EJS模板引擎，兼容Hexo主题
- **插件系统** - Hook架构，支持 `hexo-*` 和 `atom-*` npm 包
- **多平台部署** - GitHub Pages / Gitee Pages / Cloudflare Pages
- **极速构建** - 最小依赖，闪电般的静态生成速度
- **现代设计** - 响应式默认主题，支持暗色模式
- **SEO 友好** - 自动生成 sitemap.xml、atom.xml

## Markdown 示例

### 代码高亮

```javascript
const ation = require('atom');
const blog = new ation('./my-blog');

blog.init().then(() => {
  return blog.generate();
});
```

### 引用

> Atom 是一个轻量级的静态博客生成器，兼容 Hexo 主题和插件。

### 列表

1. 写 Markdown 文章
2. 运行 `atom generate`
3. 部署到 GitHub Pages

### 表格

| 平台 | 部署方式 | 状态 |
|------|----------|------|
| GitHub Pages | Git push / Actions | 支持 |
| Gitee Pages | Git push | 支持 |
| Cloudflare Pages | Wrangler / Git | 支持 |

---

开始你的写作之旅吧！
