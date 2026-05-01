/**
 * Ation Blog - 数据模型
 * 管理文章、分类、标签、页面等数据
 * 兼容 Hexo 数据结构
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');
const Config = require('./config');

class Post {
  constructor(data = {}) {
    this.title = data.title || '';
    this.date = data.date ? new Date(data.date) : new Date();
    this.updated = data.updated ? new Date(data.updated) : new Date();
    this.categories = data.categories || [];
    this.tags = data.tags || [];
    this.content = data.content || '';
    this.excerpt = data.excerpt || '';
    this.slug = data.slug || '';
    this.layout = data.layout || 'post';
    this.permalink = data.permalink || '';
    this.frontMatter = data.frontMatter || {};
    this.source = data.source || '';
    this.photos = data.photos || [];
    this.link = data.link || '';
  }
  
  toJSON() {
    return {
      title: this.title,
      date: this.date.toISOString(),
      updated: this.updated.toISOString(),
      categories: this.categories,
      tags: this.tags,
      content: this.content,
      excerpt: this.excerpt,
      slug: this.slug,
      layout: this.layout,
      permalink: this.permalink,
      photos: this.photos,
      link: this.link
    };
  }
}

class DataStore {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.config = new Config(baseDir);
    this.posts = [];
    this.pages = [];
    this.categories = new Map();
    this.tags = new Map();
    this.archives = new Map();
  }
  
  load() {
    this.posts = [];
    this.pages = [];
    this.categories = new Map();
    this.tags = new Map();
    this.archives = new Map();
    this.dataFiles = {};
    
    const sourceDir = path.join(this.baseDir, this.config.get('source_dir'));
    
    // 加载数据文件 (source/_data/*.yml/*.json)
    this._loadDataFiles(sourceDir);
    
    // 加载文章
    this._loadDirectory(path.join(sourceDir, '_posts'), 'post');
    
    // 加载草稿
    this._loadDirectory(path.join(sourceDir, '_drafts'), 'draft');
    
    // 加载页面 (source 下直接的 md 文件)
    this._loadPages(sourceDir);
    
    // 排序
    this.posts.sort((a, b) => b.date - a.date);
    
    // 生成分类和标签索引
    this._buildIndex();
    
    return this;
  }
  
  _loadDirectory(dir, layout) {
    if (!fs.existsSync(dir)) return;
    
    const files = this._walkDir(dir, '.md');
    
    for (const file of files) {
      try {
        const raw = fs.readFileSync(file, 'utf8');
        const parsed = matter(raw);
        const relativePath = path.relative(dir, file);
        const slug = relativePath.replace(/\.md$/, '');
        
        const post = new Post({
          title: parsed.data.title || slug,
          date: parsed.data.date,
          updated: parsed.data.updated || fs.statSync(file).mtime,
          categories: this._normalizeArray(parsed.data.categories),
          tags: this._normalizeArray(parsed.data.tags),
          content: parsed.content,
          excerpt: this._extractExcerpt(parsed.content),
          slug: slug,
          layout: parsed.data.layout || layout,
          permalink: this._generatePermalink(slug, parsed.data),
          frontMatter: parsed.data,
          source: file,
          photos: parsed.data.photos || [],
          link: parsed.data.link || ''
        });
        
        if (layout === 'draft') {
          post.draft = true;
        }
        
        this.posts.push(post);
      } catch (e) {
        console.warn(`[Ation] Failed to parse ${file}:`, e.message);
      }
    }
  }
  
  _loadPages(sourceDir) {
    if (!fs.existsSync(sourceDir)) return;
    
    const entries = fs.readdirSync(sourceDir);
    for (const entry of entries) {
      if (entry.startsWith('_') || entry.startsWith('.')) continue;
      const fullPath = path.join(sourceDir, entry);
      
      if (entry.endsWith('.md') && fs.statSync(fullPath).isFile()) {
        try {
          const raw = fs.readFileSync(fullPath, 'utf8');
          const parsed = matter(raw);
          const slug = entry.replace(/\.md$/, '');
          
          this.pages.push({
            title: parsed.data.title || slug,
            date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
            content: parsed.content,
            slug: slug,
            layout: parsed.data.layout || 'page',
            permalink: `/${slug}/`,
            frontMatter: parsed.data
          });
        } catch (e) {
          console.warn(`[Ation] Failed to parse page ${entry}:`, e.message);
        }
      } else if (fs.statSync(fullPath).isDirectory()) {
        // 目录内的 index.md 作为页面
        const indexPath = path.join(fullPath, 'index.md');
        if (fs.existsSync(indexPath)) {
          try {
            const raw = fs.readFileSync(indexPath, 'utf8');
            const parsed = matter(raw);
            
            this.pages.push({
              title: parsed.data.title || entry,
              date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
              content: parsed.content,
              slug: entry,
              layout: parsed.data.layout || 'page',
              permalink: `/${entry}/`,
              frontMatter: parsed.data
            });
          } catch (e) {
            console.warn(`[Ation] Failed to parse ${indexPath}:`, e.message);
          }
        }
      }
    }
  }
  
  _loadDataFiles(sourceDir) {
    const dataDir = path.join(sourceDir, '_data');
    if (!fs.existsSync(dataDir)) return;
    
    const entries = fs.readdirSync(dataDir);
    for (const entry of entries) {
      const fullPath = path.join(dataDir, entry);
      if (!fs.statSync(fullPath).isFile()) continue;
      
      const ext = path.extname(entry);
      const name = path.basename(entry, ext);
      
      try {
        const raw = fs.readFileSync(fullPath, 'utf8');
        if (ext === '.yml' || ext === '.yaml') {
          this.dataFiles[name] = yaml.load(raw);
        } else if (ext === '.json') {
          this.dataFiles[name] = JSON.parse(raw);
        }
      } catch (e) {
        console.warn(`[Ation] Failed to parse data file ${entry}:`, e.message);
      }
    }
  }
  
  _extractExcerpt(content) {
    // 兼容 Hexo: <!-- more --> 作为摘要分割
    const moreIndex = content.indexOf('<!-- more -->');
    if (moreIndex !== -1) {
      return content.substring(0, moreIndex).trim();
    }
    // 默认取前 200 字
    const stripped = content.replace(/[#*`\[\]()>_~|-]/g, '').trim();
    return stripped.substring(0, 200) + (stripped.length > 200 ? '...' : '');
  }
  
  _generatePermalink(slug, frontMatter) {
    const pattern = this.config.get('permalink', ':year/:month/:day/:title/');
    const date = frontMatter.date ? new Date(frontMatter.date) : new Date();
    const root = this.config.get('root', '/');
    
    let permalink = pattern
      .replace(':year', date.getFullYear().toString())
      .replace(':month', (date.getMonth() + 1).toString().padStart(2, '0'))
      .replace(':i_month', (date.getMonth() + 1).toString())
      .replace(':day', date.getDate().toString().padStart(2, '0'))
      .replace(':i_day', date.getDate().toString())
      .replace(':title', slug)
      .replace(':id', frontMatter.id || Date.now().toString());
    
    // 确保 root 前缀
    if (!permalink.startsWith(root)) {
      permalink = root + permalink;
    }
    
    return permalink;
  }
  
  _buildIndex() {
    // 分类索引
    for (const post of this.posts) {
      if (post.draft) continue;
      
      for (const cat of post.categories) {
        if (!this.categories.has(cat)) {
          this.categories.set(cat, []);
        }
        this.categories.get(cat).push(post);
      }
      
      for (const tag of post.tags) {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, []);
        }
        this.tags.get(tag).push(post);
      }
      
      // 归档索引 (按年月)
      const year = post.date.getFullYear();
      const month = post.date.getMonth() + 1;
      const archiveKey = `${year}`;
      
      if (!this.archives.has(year)) {
        this.archives.set(year, new Map());
      }
      const yearMap = this.archives.get(year);
      if (!yearMap.has(month)) {
        yearMap.set(month, []);
      }
      yearMap.get(month).push(post);
    }
  }
  
  _normalizeArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }
  
  _walkDir(dir, ext) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        results = results.concat(this._walkDir(fullPath, ext));
      } else if (entry.endsWith(ext)) {
        results.push(fullPath);
      }
    }
    return results;
  }
  
  getPosts(page = 1, perPage = null) {
    perPage = perPage || this.config.get('per_page', 10);
    const published = this.posts.filter(p => !p.draft);
    const total = published.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    
    return {
      posts: published.slice(start, start + perPage),
      total,
      page,
      perPage,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
      prev: page > 1 ? page - 1 : null,
      next: page < totalPages ? page + 1 : null
    };
  }
  
  getCategories() {
    return Array.from(this.categories.entries()).map(([name, posts]) => ({
      name,
      count: posts.length,
      posts
    }));
  }
  
  getTags() {
    return Array.from(this.tags.entries()).map(([name, posts]) => ({
      name,
      count: posts.length,
      posts
    }));
  }
  
  getArchives() {
    const result = [];
    for (const [year, months] of this.archives) {
      const yearData = { year, months: [], count: 0 };
      for (const [month, posts] of months) {
        yearData.months.push({ month, posts, count: posts.length });
        yearData.count += posts.length;
      }
      result.push(yearData);
    }
    result.sort((a, b) => b.year - a.year);
    return result;
  }
}

module.exports = { DataStore, Post };
