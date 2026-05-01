#!/usr/bin/env node
/**
 * Ation Blog - CLI 入口
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const program = new Command();

program
  .name('ation')
  .description('A lightweight, Hexo-compatible static blog generator')
  .version('1.0.0');

// --- init ---
program
  .command('init [directory]')
  .description('Initialize a new blog')
  .action((directory = '.') => {
    const targetDir = path.resolve(directory);
    console.log(`[Ation] Initializing blog in ${targetDir}...`);
    
    // 创建目录结构
    const dirs = [
      'source/_posts',
      'source/_drafts',
      'source/about',
      'source/images',
      'themes/default/layout',
      'themes/default/source/css',
      'themes/default/source/js',
      'plugins',
      'scaffolds'
    ];
    
    for (const dir of dirs) {
      const fullPath = path.join(targetDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
    
    // 创建 _config.yml
    const configPath = path.join(targetDir, '_config.yml');
    if (!fs.existsSync(configPath)) {
      const config = {
        title: 'My Blog',
        subtitle: 'A blog powered by Ation',
        description: 'A modern, fast blog',
        author: 'Author',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        url: 'https://ation.github.io',
        root: '/',
        theme: 'default',
        per_page: 10,
        pagination_dir: 'page',
        permalink: ':year/:month/:day/:title/',
        source_dir: 'source',
        public_dir: 'public',
        tag_dir: 'tags',
        archive_dir: 'archives',
        category_dir: 'categories',
        deploy: {
          type: 'git',
          repo: '',
          branch: 'main'
        },
        plugins: [],
        menu: {
          Home: '/',
          Archives: '/archives/',
          Categories: '/categories/',
          Tags: '/tags/',
          About: '/about/'
        }
      };
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');
      console.log('[Ation] Created _config.yml');
    }
    
    // 创建示例文章
    const postPath = path.join(targetDir, 'source/_posts', 'hello-world.md');
    if (!fs.existsSync(postPath)) {
      const content = `---
title: Hello World
date: ${new Date().toISOString().split('T')[0]}
categories:
  - 教程
tags:
  - ation
  - blog
---

欢迎来到 Ation Blog！这是你的第一篇文章。

## 快速开始

编辑 \`source/_posts/\` 目录下的 Markdown 文件来创建新文章。

\`\`\`bash
# 生成静态文件
ation generate

# 本地预览
ation server

# 部署到 GitHub Pages
ation deploy
\`\`\`

<!-- more -->

## 特性

- 兼容 Hexo 主题和插件
- 多平台部署 (GitHub/Gitee/Cloudflare)
- 插件化架构
- 响应式默认主题
- SEO 友好
- 极速构建

> 开始写作吧！
`;
      fs.writeFileSync(postPath, content, 'utf8');
      console.log('[Ation] Created hello-world.md');
    }
    
    // 创建 about 页面
    const aboutPath = path.join(targetDir, 'source/about/index.md');
    if (!fs.existsSync(aboutPath)) {
      fs.writeFileSync(aboutPath, `---
title: About
layout: page
date: ${new Date().toISOString().split('T')[0]}
---

这是一个由 Ation 驱动的博客。

Ation 是一个轻量级的静态博客生成器，兼容 Hexo 主题和插件。
`, 'utf8');
      console.log('[Ation] Created about page');
    }
    
    // 创建 scaffolds
    const scaffoldPost = path.join(targetDir, 'scaffolds', 'post.md');
    if (!fs.existsSync(scaffoldPost)) {
      fs.writeFileSync(scaffoldPost, `---
title: {{ title }}
date: {{ date }}
categories:
tags:
---

`, 'utf8');
    }
    
    const scaffoldDraft = path.join(targetDir, 'scaffolds', 'draft.md');
    if (!fs.existsSync(scaffoldDraft)) {
      fs.writeFileSync(scaffoldDraft, `---
title: {{ title }}
date: {{ date }}
tags:
---

`, 'utf8');
    }
    
    console.log('[Ation] Blog initialized! Run `ation server` to preview.');
  });

// --- generate ---
program
  .command('generate')
  .description('Generate static files')
  .option('-d, --deploy', 'Deploy after generating')
  .action(async (options) => {
    const Generator = require(path.join(__dirname, '..', 'lib', 'core', 'generator'));
    const generator = new Generator(process.cwd());
    
    await generator.init();
    await generator.generate();
    
    if (options.deploy) {
      const { deploy } = require(path.join(__dirname, '..', 'lib', 'deploy'));
      await deploy(process.cwd());
    }
  });

// --- server ---
program
  .command('server')
  .description('Start local server')
  .option('-p, --port <port>', 'Port', '4000')
  .option('-w, --watch', 'Watch file changes')
  .action(async (options) => {
    const Generator = require(path.join(__dirname, '..', 'lib', 'core', 'generator'));
    const generator = new Generator(process.cwd());
    
    await generator.init();
    await generator.generate();
    
    const connect = require('connect');
    const serveStatic = require('serve-static');
    const publicDir = path.join(process.cwd(), 'public');
    
    const app = connect();
    app.use(serveStatic(publicDir));
    
    // SPA fallback for 404
    app.use((req, res) => {
      res.statusCode = 404;
      const f404 = path.join(publicDir, '404.html');
      if (fs.existsSync(f404)) {
        res.end(fs.readFileSync(f404));
      } else {
        res.end('404 Not Found');
      }
    });
    
    const server = app.listen(options.port, () => {
      const url = `http://localhost:${options.port}`;
      console.log(`[Ation] Server running at ${url}`);
      try { require('open')(url); } catch {}
    });
    
    if (options.watch) {
      const chokidar = require('chokidar');
      const sourceDir = path.join(process.cwd(), 'source');
      const themesDir = path.join(process.cwd(), 'themes');
      
      let regenerating = false;
      const regenerate = async () => {
        if (regenerating) return;
        regenerating = true;
        console.log('[Ation] Changes detected, regenerating...');
        try {
          await generator.generate();
          console.log('[Ation] Regeneration complete');
        } catch (e) {
          console.error('[Ation] Error:', e.message);
        }
        regenerating = false;
      };
      
      chokidar.watch([sourceDir, themesDir], {
        ignored: /(^|[/\\])\../,
        persistent: true
      }).on('change', regenerate);
    }
  });

// --- new ---
program
  .command('new <title>')
  .description('Create a new post')
  .option('-d, --draft', 'Create as draft')
  .action((title, options) => {
    const scaffoldType = options.draft ? 'draft' : 'post';
    const scaffoldPath = path.join(process.cwd(), 'scaffolds', `${scaffoldType}.md`);
    
    let template;
    if (fs.existsSync(scaffoldPath)) {
      template = fs.readFileSync(scaffoldPath, 'utf8');
    } else {
      template = `---\ntitle: {{ title }}\ndate: {{ date }}\ntags:\n---\n\n`;
    }
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
    
    const content = template
      .replace('{{ title }}', title)
      .replace('{{ date }}', dateStr);
    
    const dir = options.draft ? 'source/_drafts' : 'source/_posts';
    const filePath = path.join(process.cwd(), dir, `${slug}.md`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[Ation] Created ${options.draft ? 'draft' : 'post'}: ${filePath}`);
  });

// --- deploy ---
program
  .command('deploy')
  .description('Deploy to remote')
  .option('-t, --type <type>', 'Deploy type (git/cloudflare)', 'git')
  .action(async (options) => {
    const { deploy } = require(path.join(__dirname, '..', 'lib', 'deploy'));
    await deploy(process.cwd(), options.type);
  });

// --- clean ---
program
  .command('clean')
  .description('Clean generated files')
  .action(() => {
    const publicDir = path.join(process.cwd(), 'public');
    if (fs.existsSync(publicDir)) {
      fs.rmSync(publicDir, { recursive: true });
      console.log('[Ation] Cleaned public directory');
    } else {
      console.log('[Ation] Nothing to clean');
    }
  });

program.parse();
