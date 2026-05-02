# Atom Blog

一个轻量级、兼容 Hexo 的静态博客生成器，支持可插拔主题和多平台部署。

---

## 特性

- **Hexo 兼容** — 无缝支持 Hexo 目录结构、Front Matter 和标签插件
- **可插拔主题** — 基于 EJS 的主题系统，兼容 Hexo 主题规范
- **插件系统** — Hook 架构，支持 `hexo-*` 和 `atom-*` npm 包
- **多平台部署** — GitHub Pages、Gitee Pages、Cloudflare Pages
- **极速构建** — 最小依赖，闪电般的静态生成速度
- **现代样式** — 响应式默认主题，支持浅色/深色/自动三种模式切换
- **SEO 友好** — 自动生成 sitemap.xml、atom.xml、语义化 HTML
- **Markdown** — GFM 语法、代码高亮（highlight.js + Catppuccin Mocha 配色）
- **中文优化** — Noto Sans SC 字体、中文排版优化
- **评论系统** — 集成 Giscus（基于 GitHub Discussions），零成本部署

---

## 快速开始

```bash
# 克隆
git clone https://github.com/cn3656/atom.git
cd atom

# 安装依赖
npm install

# 创建文章
node bin/atom.js new "我的第一篇文章"

# 生成静态文件
node bin/atom.js generate

# 本地预览（默认端口 4000）
node bin/atom.js server

# 部署
node bin/atom.js deploy
```

---

## 发布文章

### 方式一：命令行创建

```bash
# 创建文章（自动生成 Front Matter）
node bin/atom.js new "文章标题"

# 创建草稿
node bin/atom.js new --draft "草稿标题"
```

命令会在 `source/_posts/` 目录下生成 `.md` 文件，使用 `scaffolds/post.md` 作为模板。

### 方式二：手动创建

在 `source/_posts/` 目录下新建 `.md` 文件，写入以下格式：

```markdown
---
title: 文章标题
date: 2026-05-02
categories:
  - 科技
tags:
  - AI
  - 芯片
---

正文内容...
```

### 添加摘要

在正文中插入 `<!-- more -->`，其上方内容将作为首页摘要显示：

```markdown
---
title: 我的文章
---

这段文字会显示在首页卡片中作为摘要。

<!-- more -->

这段文字只在文章详情页中显示。
```

---

## 分类与标签

### 添加分类

在 Front Matter 的 `categories` 字段中添加：

```yaml
categories:
  - 科技          # 单个分类
```

支持层级分类（最多两级）：

```yaml
categories:
  - [编程, JavaScript]    # 二级分类：编程 > JavaScript
  - [编程, Python]        # 二级分类：编程 > Python
```

分类页面自动生成在 `/categories/分类名/` 路径下。

### 添加标签

在 Front Matter 的 `tags` 字段中添加：

```yaml
tags:
  - AI           # 一个标签占一行
  - 芯片
  - 人工智能
```

标签页面自动生成在 `/tags/标签名/` 路径下。

### 分类与标签的区别

| | 分类 (categories) | 标签 (tags) |
|---|---|---|
| 性质 | 文章归属的类别 | 文章的关键词 |
| 数量 | 通常 1-2 个 | 可以多个 |
| 层级 | 支持多级 | 扁平结构 |
| URL | `/categories/科技/` | `/tags/AI/` |

### 默认分类

新建文章默认分类为「默认分类」，可在 `scaffolds/post.md` 中修改：

```yaml
# scaffolds/post.md
---
title: {{ title }}
date: {{ date }}
categories:
  - 默认分类       # 改成你常用的分类
tags:
---
```

---

## 生成与预览

```bash
# 生成静态文件到 public/ 目录
node bin/atom.js generate

# 生成后立即部署
node bin/atom.js generate --deploy

# 本地预览
node bin/atom.js server          # 默认 4000 端口
node bin/atom.js server -p 8080  # 指定端口

# 监听文件变化自动重新生成
node bin/atom.js server --watch

# 清除生成的文件
node bin/atom.js clean
```

---

## 评论系统

Atom 集成了 [Giscus](https://giscus.app) 评论系统，基于 GitHub Discussions，完全免费、无广告、无需数据库。

### 配置步骤

**1. 准备 GitHub 仓库**

确保你的博客仓库满足：
- 公开仓库
- 已安装 [giscus app](https://github.com/apps/giscus)
- 仓库已启用 Discussions 功能（Settings → Features → 勾选 Discussions）

**2. 获取配置参数**

前往 [giscus.app](https://giscus.app)，按页面提示：
- 输入仓库地址（如 `cn3656/cn3656.github.io`）
- 选择 Discussion 分类（推荐 `Announcements`）
- 复制生成的 `repo-id`、`category`、`category-id`

**3. 写入配置**

编辑 `_config.yml`，取消 giscus 部分注释并填入参数：

```yaml
giscus:
  repo: cn3656/cn3656.github.io
  repo_id: R_xxxxxxxx
  category: Announcements
  category_id: DIC_xxxxxxxx
```

**4. 启用评论**

- **文章页**：配置 giscus 后自动显示评论区
- **独立页面**：在 Front Matter 中添加 `comments: true`

```yaml
---
title: 留言板
layout: page
comments: true    # 启用评论
---
```

**5. 深色模式适配**

Giscus 的 `data-theme` 已设为 `preferred_color_scheme`，会自动跟随浏览器/系统的深浅色设置，与博客主题切换联动。

---

## 目录结构

```
.
├── _config.yml          # 站点配置
├── source/
│   ├── _posts/          # 博客文章（Markdown）
│   ├── _drafts/         # 草稿
│   ├── about/           # 关于页面
│   ├── contact/         # 留言板
│   ├── friends/         # 友情链接
│   └── images/          # 静态资源
├── themes/
│   ├── default/         # 默认主题
│   └── void/            # VOID 主题
├── scaffolds/           # 文章/页面模板
├── plugins/             # 本地插件
├── lib/                 # 核心引擎
│   ├── core/            # 生成器、配置、数据、渲染器
│   ├── theme/           # 主题管理器
│   ├── plugin/          # 插件管理器
│   └── deploy/          # 部署模块
└── bin/
    └── atom.js          # CLI 入口
```

---

## 站点配置

编辑 `_config.yml`：

```yaml
title: My Blog              # 站点标题
subtitle: 博客副标题        # 副标题
author: Your Name           # 作者
language: zh-CN             # 语言
timezone: Asia/Shanghai     # 时区
url: https://yourname.github.io
theme: default              # 主题名
per_page: 10                # 每页文章数

# 导航菜单
menu:
  首页: /
  归档: /archives/
  分类: /categories/
  标签: /tags/
  留言: /contact/
  友链: /friends/
  关于: /about/

# 社交链接
social:
  GitHub: https://github.com/yourname

# 部署
deploy:
  type: git
  repo: https://github.com/yourname/yourname.github.io.git
  branch: main
```

---

## 创建独立页面

在 `source/` 下创建目录和 `index.md`：

```bash
# 手动创建
mkdir -p source/mypage
cat > source/mypage/index.md << 'EOF'
---
title: 我的页面
layout: page
---

页面内容...
EOF
```

添加到导航菜单：

```yaml
menu:
  我的页面: /mypage/
```

---

## Front Matter 字段

| 字段 | 说明 | 示例 |
|------|------|------|
| `title` | 文章标题 | `我的文章` |
| `date` | 发布日期 | `2026-05-02` |
| `updated` | 更新日期 | `2026-05-03` |
| `categories` | 分类 | `- 科技` |
| `tags` | 标签 | `- AI` |
| `layout` | 布局模板 | `page` / `post` |
| `excerpt` | 自定义摘要 | `摘要文字` |
| `comments` | 启用评论 | `true` |

---

## 主题开发

主题遵循 Hexo 规范：

```
themes/my-theme/
├── layout/
│   ├── layout.ejs    # 主布局
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
- `url_for()` — URL 生成
- `date()` — 日期格式化

---

## 部署

### GitHub Pages（推荐）

使用 GitHub Actions 自动部署，在 `.github/workflows/deploy.yml` 中配置：

```yaml
- run: node bin/atom.js generate
- uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./public
```

推送到 `main` 分支即可自动构建部署。

### 手动部署

```bash
node bin/atom.js generate --deploy
```

---

## Hexo 兼容性

| 功能 | 状态 |
|------|------|
| YAML Front Matter | ✅ |
| `_config.yml` | ✅ |
| `source/_posts/` 目录结构 | ✅ |
| `<!-- more -->` 摘要分割 | ✅ |
| Hexo 标签插件 | ⚠️ 部分支持 (codeblock, quote, asset_img, post_link) |
| Hexo 主题 (EJS) | ✅ |
| `hexo-*` npm 插件 | ✅ 自动发现 |
| 固定链接 | ✅ |
| 分类和标签 | ✅ |
| 脚手架模板 | ✅ |
| `source/_data/` 数据文件 | ✅ |

---

## 常用命令速查

```bash
node bin/atom.js new "标题"          # 新建文章
node bin/atom.js new --draft "标题"  # 新建草稿
node bin/atom.js generate            # 生成
node bin/atom.js generate --deploy   # 生成并部署
node bin/atom.js server              # 本地预览
node bin/atom.js server -p 8080      # 指定端口预览
node bin/atom.js server --watch      # 监听变化
node bin/atom.js clean               # 清除生成文件
```

---

## License

MIT
