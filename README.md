# Ation Blog

A lightweight, Hexo-compatible static blog generator with pluggable themes and multi-platform deployment.

## Features

- **Hexo Compatible** - Drop-in support for Hexo's directory structure, front matter, and tag plugins
- **Pluggable Themes** - EJS-based theme system compatible with Hexo theme conventions
- **Plugin System** - Hook-based plugin architecture, supports `hexo-*` and `ation-*` npm packages
- **Multi-platform Deploy** - GitHub Pages, Gitee Pages, Cloudflare Pages
- **Fast Build** - Minimal dependencies, lightning-fast static generation
- **Modern CSS** - Responsive default theme with dark mode support
- **SEO Ready** - Auto-generated sitemap.xml, atom.xml, semantic HTML
- **Markdown** - GFM, code highlighting, Hexo tag plugins

## Quick Start

```bash
# Clone
git clone https://github.com/ation/ation.github.io.git
cd ation.github.io

# Install dependencies
npm install

# Create a new post
node bin/ation.js new "My First Post"

# Generate static files
node bin/ation.js generate

# Preview locally
node bin/ation.js server

# Deploy
node bin/ation.js deploy
```

## Directory Structure

```
.
├── _config.yml          # Site configuration (Hexo compatible)
├── source/
│   ├── _posts/          # Blog posts (Markdown)
│   ├── _drafts/         # Drafts
│   ├── about/           # About page
│   └── images/          # Static assets
├── themes/
│   └── default/         # Default theme
│       ├── layout/      # EJS templates
│       ├── source/      # Theme assets (CSS/JS)
│       └── _config.yml  # Theme config
├── plugins/             # Local plugins
├── scaffolds/           # Post/page templates
├── lib/                 # Core engine
│   ├── core/            # Generator, config, data, renderer
│   ├── theme/           # Theme manager
│   ├── plugin/          # Plugin manager
│   └── deploy/          # Deployment modules
└── bin/
    └── ation.js         # CLI entry point
```

## Configuration

Edit `_config.yml`:

```yaml
title: My Blog
subtitle: A blog powered by Ation
author: Your Name
url: https://yourname.github.io
theme: default
per_page: 10

deploy:
  type: git                    # git | gitee | cloudflare
  repo: https://github.com/...
  branch: main

menu:
  Home: /
  Archives: /archives/
  About: /about/
```

## Creating Posts

Posts are Markdown files with YAML front matter:

```markdown
---
title: Hello World
date: 2024-01-01
categories:
  - Tech
tags:
  - javascript
  - blog
---

Your content here...
```

## Theme Development

Themes follow Hexo conventions:

```
themes/my-theme/
├── layout/
│   ├── layout.ejs    # Main layout (header/footer)
│   ├── index.ejs     # Home page
│   ├── post.ejs      # Single post
│   ├── page.ejs      # Single page
│   ├── archive.ejs   # Archives
│   ├── category.ejs  # Categories
│   └── tag.ejs       # Tags
├── source/
│   ├── css/
│   └── js/
└── _config.yml       # Theme-specific config
```

Available template variables:
- `config` - Site config
- `theme` - Theme config
- `page` - Current page data
- `posts` - Post list (index/archive pages)
- `pagination` - Pagination data

## Plugin Development

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
      // Modify rendered HTML
      return content.replace(/foo/g, 'bar');
    }
  }
};
```

Available hooks:
- `before_init` / `after_init`
- `before_generate` / `after_generate`
- `before_render` / `after_render`
- `before_deploy` / `after_deploy`
- `new_post` / `new_page`
- `server_middleware`

## Deployment

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

Or connect your GitHub repo in Cloudflare dashboard:
- Build command: `npm run generate`
- Output directory: `public`

## Hexo Compatibility

Ation is designed to be highly compatible with Hexo:

| Feature | Status |
|---------|--------|
| YAML Front Matter | Supported |
| `_config.yml` | Supported |
| `source/_posts/` structure | Supported |
| `<!-- more -->` excerpt | Supported |
| Hexo tag plugins | Partial (codeblock, quote, asset_img, post_link) |
| Hexo themes (EJS) | Compatible |
| `hexo-*` npm plugins | Auto-discovered |
| Permalink patterns | Supported |
| Categories & Tags | Supported |
| Scaffold templates | Supported |

## License

MIT
