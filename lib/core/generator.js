/**
 * Ation Blog - 核心生成器
 * 将 Markdown 源文件编译为静态 HTML
 */

const fs = require('fs');
const path = require('path');
const Config = require('./config');
const { DataStore } = require('./data');
const Renderer = require('./renderer');
const ThemeManager = require('../theme/manager');
const PluginManager = require('../plugin/manager');
const HexoCompat = require('../plugin/hexo-compat');

class Generator {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.config = new Config(baseDir);
    this.data = new DataStore(baseDir);
    this.renderer = new Renderer(this.config.getAll());
    this.theme = new ThemeManager(baseDir, this.config);
    this.plugins = new PluginManager(baseDir);
    this.hexoCompat = new HexoCompat(this);
    this.generated = 0;
  }
  
  async init() {
    await this.plugins.emitHook('before_init', this);
    
    // 加载 Ation 原生插件
    this.plugins.loadPlugins(this.config.get('plugins', []));
    
    // 加载 hexo-* npm 插件 (通过兼容层)
    const hexoLoaded = this.hexoCompat.loadHexoPlugins(this.baseDir, this.config.getAll());
    if (hexoLoaded > 0) {
      console.log(`[Ation] ${hexoLoaded} hexo plugins loaded via compat layer`);
      
      // 注入 hexo 插件注册的辅助函数到模板上下文
      const hexoHelpers = this.hexoCompat.getHelpers();
      if (Object.keys(hexoHelpers).length > 0) {
        this.theme.setHexoHelpers(hexoHelpers);
      }
    }
    
    await this.plugins.emitHook('after_init', this);
  }
  
  async generate() {
    console.log('[Ation] Starting generation...');
    
    await this.plugins.emitHook('before_generate', this);
    
    const publicDir = path.join(this.baseDir, this.config.get('public_dir', 'public'));
    
    // 清空输出目录
    this._cleanDir(publicDir);
    fs.mkdirSync(publicDir, { recursive: true });
    
    // 加载数据
    this.data.load();
    this.siteData = this.data.dataFiles || {};
    this.theme.setSiteData(this.siteData);
    console.log(`[Ation] Loaded ${this.data.posts.length} posts, ${this.data.pages.length} pages`);
    
    // 复制主题资源
    this.theme.copyAssets(publicDir);
    
    // 复制 source 中的静态文件
    this._copySourceAssets(publicDir);
    
    // 生成页面
    await this._generatePosts(publicDir);
    await this._generatePages(publicDir);
    await this._generateIndex(publicDir);
    await this._generateArchives(publicDir);
    await this._generateCategories(publicDir);
    await this._generateTags(publicDir);
    
    // 生成 sitemap.xml
    this._generateSitemap(publicDir);
    
    // 生成 RSS/Atom feed
    this._generateFeed(publicDir);
    
    // 生成 404 页面
    this._generate404(publicDir);
    
    await this.plugins.emitHook('after_generate', this);
    
    console.log(`[Ation] Generated ${this.generated} files to ${publicDir}`);
    return this.generated;
  }
  
  async _generatePosts(publicDir) {
    for (const post of this.data.posts) {
      if (post.draft) continue;
      
      let content = this.renderer.render(post.content);
      
      // 插件处理
      content = await this.plugins.applyHook('after_render', content, { post, config: this.config });
      
      // 渲染 post 模板
      try {
        const html = await this.theme.render('post', {
          page: {
            title: post.title,
            date: post.date,
            categories: post.categories,
            tags: post.tags,
            content,
            excerpt: post.excerpt,
            permalink: post.permalink,
            layout: 'post',
            frontMatter: post.frontMatter
          },
          post,
          is_post: true
        });
        
        const outputPath = path.join(publicDir, post.permalink, 'index.html');
        this._writeFile(outputPath, html);
        this.generated++;
      } catch (e) {
        console.error(`[Ation] Error rendering post "${post.title}":`, e.message);
      }
    }
  }
  
  async _generatePages(publicDir) {
    for (const page of this.data.pages) {
      const content = this.renderer.render(page.content);
      
      // Hexo 兼容: 优先用 page.slug 或 page.layout 对应的模板，fallback 到 page
      let templateName = page.slug || page.layout || 'page';
      if (!this.theme._resolveTemplate(templateName)) {
        templateName = 'page';
      }
      
      try {
        const html = await this.theme.render(templateName, {
          page: {
            title: page.title,
            content,
            permalink: page.permalink,
            layout: 'page',
            slug: page.slug,
            frontMatter: page.frontMatter,
            __post: true  // 标记为内容页 (用于 description 提取)
          },
          is_page: true
        });
        
        const outputPath = path.join(publicDir, page.permalink, 'index.html');
        this._writeFile(outputPath, html);
        this.generated++;
      } catch (e) {
        console.error(`[Ation] Error rendering page "${page.title}":`, e.message);
      }
    }
  }
  
  async _generateIndex(publicDir) {
    const perPage = this.config.get('per_page', 10);
    const total = Math.ceil(this.data.posts.filter(p => !p.draft).length / perPage);
    
    for (let page = 1; page <= total; page++) {
      const data = this.data.getPosts(page, perPage);
      
      // 渲染文章摘要
      const posts = data.posts.map(post => ({
        ...post,
        content: this.renderer.render(post.excerpt || post.content)
      }));
      
      try {
        const html = await this.theme.render('index', {
          page: {
            title: this.config.get('title', 'Blog'),
            layout: 'index',
            current: page,
            total,
            per_page: perPage,
            posts: posts  // Hexo 兼容: page.posts 也包含文章列表
          },
          posts,
          pagination: data,
          is_home: true
        });
        
        const pageDir = page === 1 ? '' : `${this.config.get('pagination_dir', 'page')}/${page}`;
        const outputPath = path.join(publicDir, pageDir, 'index.html');
        this._writeFile(outputPath, html);
        this.generated++;
      } catch (e) {
        console.error(`[Ation] Error rendering index page ${page}:`, e.message);
      }
    }
  }
  
  async _generateArchives(publicDir) {
    const archives = this.data.getArchives();
    const archiveDir = this.config.get('archive_dir', 'archives');
    
    try {
      const html = await this.theme.render('archive', {
        page: {
          title: 'Archives',
          layout: 'archive',
          base: `/${archiveDir}/`
        },
        archives,
        is_archive: true
      });
      
      const outputPath = path.join(publicDir, archiveDir, 'index.html');
      this._writeFile(outputPath, html);
      this.generated++;
    } catch (e) {
      console.error('[Ation] Error rendering archives:', e.message);
    }
  }
  
  async _generateCategories(publicDir) {
    const categories = this.data.getCategories();
    const categoryDir = this.config.get('category_dir', 'categories');
    
    // 分类列表页
    try {
      const html = await this.theme.render('category', {
        page: {
          title: 'Categories',
          layout: 'category'
        },
        categories,
        is_categories: true
      });
      
      this._writeFile(path.join(publicDir, categoryDir, 'index.html'), html);
      this.generated++;
    } catch (e) {
      console.error('[Ation] Error rendering categories:', e.message);
    }
    
    // 单个分类页
    for (const cat of categories) {
      try {
        const html = await this.theme.render('category', {
          page: {
            title: cat.name,
            layout: 'category',
            category: cat.name,
            base: `/${categoryDir}/${cat.name}/`
          },
          category: cat,
          posts: cat.posts.map(p => ({
            ...p,
            content: this.renderer.render(p.excerpt || p.content)
          })),
          is_category: true
        });
        
        this._writeFile(
          path.join(publicDir, categoryDir, cat.name, 'index.html'),
          html
        );
        this.generated++;
      } catch (e) {
        console.error(`[Ation] Error rendering category "${cat.name}":`, e.message);
      }
    }
  }
  
  async _generateTags(publicDir) {
    const tags = this.data.getTags();
    const tagDir = this.config.get('tag_dir', 'tags');
    
    // 标签列表页
    try {
      const html = await this.theme.render('tag', {
        page: {
          title: 'Tags',
          layout: 'tag'
        },
        tags,
        is_tags: true
      });
      
      this._writeFile(path.join(publicDir, tagDir, 'index.html'), html);
      this.generated++;
    } catch (e) {
      console.error('[Ation] Error rendering tags:', e.message);
    }
    
    // 单个标签页
    for (const tag of tags) {
      try {
        const html = await this.theme.render('tag', {
          page: {
            title: tag.name,
            layout: 'tag',
            tag: tag.name,
            base: `/${tagDir}/${tag.name}/`
          },
          tag,
          posts: tag.posts.map(p => ({
            ...p,
            content: this.renderer.render(p.excerpt || p.content)
          })),
          is_tag: true
        });
        
        this._writeFile(
          path.join(publicDir, tagDir, tag.name, 'index.html'),
          html
        );
        this.generated++;
      } catch (e) {
        console.error(`[Ation] Error rendering tag "${tag.name}":`, e.message);
      }
    }
  }
  
  _generateSitemap(publicDir) {
    const root = this.config.get('url', 'https://ation.github.io');
    const urls = [];
    
    // 首页
    urls.push({ loc: root, changefreq: 'daily', priority: '1.0' });
    
    // 文章
    for (const post of this.data.posts) {
      if (post.draft) continue;
      urls.push({
        loc: `${root}${post.permalink}`,
        lastmod: post.updated.toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8'
      });
    }
    
    // 归档/分类/标签
    const archiveDir = this.config.get('archive_dir', 'archives');
    const categoryDir = this.config.get('category_dir', 'categories');
    const tagDir = this.config.get('tag_dir', 'tags');
    
    urls.push({ loc: `${root}/${archiveDir}/`, changefreq: 'weekly', priority: '0.6' });
    urls.push({ loc: `${root}/${categoryDir}/`, changefreq: 'weekly', priority: '0.6' });
    urls.push({ loc: `${root}/${tagDir}/`, changefreq: 'weekly', priority: '0.6' });
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    
    this._writeFile(path.join(publicDir, 'sitemap.xml'), xml);
    this.generated++;
  }
  
  _generateFeed(publicDir) {
    const root = this.config.get('url', 'https://ation.github.io');
    const title = this.config.get('title', 'Ation Blog');
    const posts = this.data.posts.filter(p => !p.draft).slice(0, 20);
    
    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${title}</title>
  <link href="${root}" />
  <link href="${root}/atom.xml" rel="self" />
  <id>${root}/</id>
  <updated>${new Date().toISOString()}</updated>
${posts.map(post => `  <entry>
    <title>${post.title}</title>
    <link href="${root}${post.permalink}" />
    <id>${root}${post.permalink}</id>
    <updated>${post.updated.toISOString()}</updated>
    <content type="html"><![CDATA[${this.renderer.render(post.content)}]]></content>
  </entry>`).join('\n')}
</feed>`;
    
    this._writeFile(path.join(publicDir, 'atom.xml'), feed);
    this.generated++;
  }
  
  _generate404(publicDir) {
    try {
      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found</title>
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 6rem; margin: 0; color: #e74c3c; }
    p { font-size: 1.2rem; color: #666; margin: 1rem 0; }
    a { color: #3498db; text-decoration: none; } a:hover { text-decoration: underline; }
  </style>
</head>
<body><div class="container"><h1>404</h1><p>Page not found</p><a href="/">Back to Home</a></div></body>
</html>`;
      this._writeFile(path.join(publicDir, '404.html'), html);
      this.generated++;
    } catch (e) {}
  }
  
  _copySourceAssets(publicDir) {
    const sourceDir = path.join(this.baseDir, this.config.get('source_dir'));
    if (!fs.existsSync(sourceDir)) return;
    
    const entries = fs.readdirSync(sourceDir);
    for (const entry of entries) {
      if (entry.startsWith('_') || entry.endsWith('.md')) continue;
      const srcPath = path.join(sourceDir, entry);
      const destPath = path.join(publicDir, entry);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this._copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  _writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  _cleanDir(dir) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  }
  
  _copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      if (fs.statSync(srcPath).isDirectory()) {
        this._copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

module.exports = Generator;
