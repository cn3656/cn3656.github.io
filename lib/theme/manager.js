/**
 * Atom Blog - 主题系统 v2
 * 完全兼容 Hexo 主题，支持 partial/is_home/is_archive 等辅助函数
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const yaml = require('js-yaml');

class ThemeManager {
  constructor(baseDir, config) {
    this.baseDir = baseDir;
    this.config = config;
    this.themeName = config.get('theme', 'default');
    this.themeDir = path.join(baseDir, 'themes', this.themeName);
    this.themeConfig = this._loadThemeConfig();
    this.i18n = this._loadI18n();
  }

  _loadThemeConfig() {
    const configPath = path.join(this.themeDir, '_config.yml');
    if (fs.existsSync(configPath)) {
      try {
        return yaml.load(fs.readFileSync(configPath, 'utf8')) || {};
      } catch (e) {
        console.warn('[Atom] theme _config.yml parse error:', e.message);
      }
    }
    return {};
  }

  // 注入 hexo 插件注册的辅助函数
  setHexoHelpers(helpers) {
    this._hexoHelpers = helpers;
  }

  // 注入 site.data (source/_data/*.yml)
  setSiteData(data) {
    this._siteData = data;
  }

  _loadI18n() {
    const lang = this.config.get('language', 'zh-CN');
    const langFile = path.join(this.themeDir, 'languages', `${lang}.yml`);
    const defaultLangFile = path.join(this.themeDir, 'languages', 'zh-CN.yml');
    const enLangFile = path.join(this.themeDir, 'languages', 'en.yml');

    for (const f of [langFile, defaultLangFile, enLangFile]) {
      if (fs.existsSync(f)) {
        try {
          const data = yaml.load(fs.readFileSync(f, 'utf8'));
          if (data) return this._flattenI18n(data);
        } catch (e) {}
      }
    }
    // 内置基础翻译
    return {
      home: '首页', archives: '归档', categories: '分类',
      tags: '标签', about: '关于', tag: '标签', category: '分类',
      prev: '上一页', next: '下一页', older: '更早', newer: '更新'
    };
  }

  _flattenI18n(obj, prefix = '') {
    let result = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null) {
        Object.assign(result, this._flattenI18n(v, key));
      } else {
        result[key] = v;
        result[k] = v; // 也支持短名
      }
    }
    return result;
  }

  /**
   * 渲染模板 (主入口)
   */
  async render(template, data = {}) {
    const templatePath = this._resolveTemplate(template);
    if (!templatePath) {
      throw new Error(`[Atom] Template not found: ${template}`);
    }

    const context = this._buildContext(data);
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // 渲染子模板
    const body = ejs.render(templateContent, {
      ...context,
      filename: templatePath,
      cache: false
    });

    // 用 layout.ejs 包装 (layout 本身除外)
    if (template !== 'layout') {
      const layoutPath = this._resolveTemplate('layout');
      if (layoutPath) {
        const layoutContent = fs.readFileSync(layoutPath, 'utf8');
        return ejs.render(layoutContent, {
          ...context,
          body,
          filename: layoutPath,
          cache: false
        });
      }
    }

    return body;
  }

  /**
   * 构建 Hexo 兼容的模板上下文
   */
  _buildContext(data = {}) {
    const self = this;
    const page = data.page || {};
    const config = this.config.getAll();
    const theme = this.themeConfig;
    const root = config.root || '/';

    // ---- partial(): 同步渲染子模板 (Hexo 核心函数) ----
    const partial = (name, locals = {}) => {
      const partialPath = self._resolveTemplate(name);
      if (!partialPath) {
        console.warn(`[Atom] partial not found: ${name}`);
        return '';
      }
      try {
        const partialContent = fs.readFileSync(partialPath, 'utf8');
        return ejs.render(partialContent, {
          ...context,
          ...locals,
          filename: partialPath,
          cache: false
        });
      } catch (e) {
        console.warn(`[Atom] partial error (${name}):`, e.message);
        return '';
      }
    };

    // ---- url_for(): URL 处理 ----
    const url_for = (url) => {
      if (!url) return root;
      if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
      if (url.startsWith(root)) return url;
      return root.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
    };

    // ---- __(): i18n 翻译 ----
    const __ = (key) => {
      return self.i18n[key] || self.i18n[key?.toLowerCase()] || key;
    };

    // ---- date(): 日期格式化 ----
    const formatDate = (d, fmt) => {
      if (!d) return '';
      const dt = d instanceof Date ? d : new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      const pad = (n) => String(n).padStart(2, '0');
      return (fmt || 'YYYY-MM-DD')
        .replace('YYYY', dt.getFullYear())
        .replace('YY', String(dt.getFullYear()).slice(-2))
        .replace('MM', pad(dt.getMonth() + 1))
        .replace('DD', pad(dt.getDate()))
        .replace('HH', pad(dt.getHours()))
        .replace('mm', pad(dt.getMinutes()))
        .replace('ss', pad(dt.getSeconds()));
    };

    // ---- strip_html(): 去除 HTML 标签 ----
    const strip_html = (str) => {
      if (!str) return '';
      return String(str).replace(/<[^>]*>/g, '');
    };

    // ---- css() / js(): 资源标签 ----
    const css = (files) => {
      if (!Array.isArray(files)) files = [files];
      return files.map(f => {
        if (!f.endsWith('.css')) f += '.css';
        const url = f.startsWith('http') ? f : url_for(f);
        return `<link rel="stylesheet" href="${url}">`;
      }).join('\n');
    };

    const js = (files) => {
      if (!Array.isArray(files)) files = [files];
      return files.map(f => {
        if (!f.endsWith('.js')) f += '.js';
        const url = f.startsWith('http') ? f : url_for(f);
        return `<script src="${url}"></script>`;
      }).join('\n');
    };

    // ---- 页面类型判断函数 (Hexo 兼容) ----
    const layout = page.layout || '';
    const is_home = () => layout === 'index' || layout === 'home' || !!data.is_home;
    const is_post = () => layout === 'post' || !!data.is_post;
    const is_page = () => layout === 'page' || !!data.is_page;
    const is_archive = () => layout === 'archive' || !!data.is_archive;
    const is_category = () => layout === 'category' || !!data.is_category;
    const is_tag = () => layout === 'tag' || !!data.is_tag;
    const is_month = () => !!page.month;
    const is_year = () => !!page.year && !page.month;

    // ---- 辅助工具 ----
    const truncate = (str, len = 200) => {
      if (!str) return '';
      str = String(str);
      return str.length > len ? str.substring(0, len) + '...' : str;
    };

    const toc = (content) => ''; // 简化

    const full_url_for = (url) => {
      const baseUrl = config.url || '';
      return baseUrl.replace(/\/$/, '') + url_for(url);
    };

    const env = (key) => process.env[key] || '';

    const gravatar = (email, size) => {
      const crypto = require('crypto');
      const hash = email ? crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex') : '';
      return `https://www.gravatar.com/avatar/${hash}?s=${size || 80}`;
    };

    // ---- Hexo 兼容的 categories/tags 对象 ----
    const categoryDir = config.category_dir || 'categories';
    const tagDir = config.tag_dir || 'tags';

    const hexifyCategories = (cats) => {
      if (!cats) return [];
      if (typeof cats[0] === 'object' && cats[0] !== null && cats[0].name) return cats;
      return cats.map(name => ({
        name,
        slug: name,
        path: `/${categoryDir}/${name}/`
      }));
    };

    const hexifyTags = (tags) => {
      if (!tags) return [];
      if (typeof tags[0] === 'object' && tags[0] !== null && tags[0].name) return tags;
      return tags.map(name => ({
        name,
        slug: name,
        path: `/${tagDir}/${name}/`
      }));
    };

    // ---- Hexo Query 兼容: 给数组加 .sort().each().map() 链式方法 ----
    const hexoQuery = (arr) => {
      if (!arr) arr = [];
      const chainable = () => {
        const wrapper = [...arr];
        // Hexo .sort(field) 返回按字段排序的数组
        wrapper.sort = (field) => {
          if (typeof field === 'string') {
            const sorted = [...arr].sort((a, b) => {
              const va = a[field], vb = b[field];
              if (va instanceof Date) return va - vb;
              return String(va || '').localeCompare(String(vb || ''));
            });
            return hexoQuery(sorted);
          }
          return hexoQuery(arr);
        };
        wrapper.reverse = () => hexoQuery([...arr].reverse());
        wrapper.each = (fn) => { arr.forEach(fn); return wrapper; };
        wrapper.forEach = arr.forEach.bind(arr);
        wrapper.map = (fn) => arr.map(fn);
        wrapper.filter = (fn) => hexoQuery(arr.filter(fn));
        wrapper.limit = (n) => hexoQuery(arr.slice(0, n));
        wrapper.length = arr.length;
        wrapper.count = () => arr.length;
        wrapper.toArray = () => arr;
        // 使 iterable
        wrapper[Symbol.iterator] = arr[Symbol.iterator].bind(arr);
        return wrapper;
      };
      return chainable();
    };

    // Hexo 兼容的 post 对象
    const hexifyPosts = (posts) => {
      if (!posts) return hexoQuery([]);
      const result = posts.map(p => ({
        ...p,
        categories: hexifyCategories(p.categories || []),
        tags: hexifyTags(p.tags || []),
        path: p.permalink || p.path || '',
        content: p.content || '',
        excerpt: p.excerpt || '',
        summary: p.summary || '',
        img: p.img || p.photo || p.frontMatter?.img || '',
        author: p.author || p.frontMatter?.author || '',
        hide: p.hide || p.frontMatter?.hide || false,
      }));
      return hexoQuery(result);
    };

    const hexifyPage = {
      ...page,
      posts: hexifyPosts(page.posts || data.posts || []),
      categories: hexifyCategories(page.categories || []),
      tags: hexifyTags(page.tags || [])
    };

    // ---- moment 兼容 ----
    const moment = (d) => {
      const dt = d instanceof Date ? d : (d ? new Date(d) : new Date());
      const create = (date) => {
        const m = {
          format: (fmt) => formatDate(date, fmt),
          year: () => date.getFullYear(),
          month: () => date.getMonth() + 1,
          date: () => date.getDate(),
          hour: () => date.getHours(),
          minute: () => date.getMinutes(),
          second: () => date.getSeconds(),
          day: () => date.getDay(),
          toDate: () => date,
          isValid: () => !isNaN(date.getTime()),
          valueOf: () => date.getTime(),
          unix: () => Math.floor(date.getTime() / 1000),
          startOf: (unit) => {
            const d = new Date(date);
            if (unit === 'year') { d.setMonth(0, 1); d.setHours(0, 0, 0, 0); }
            else if (unit === 'month') { d.setDate(1); d.setHours(0, 0, 0, 0); }
            else if (unit === 'day') { d.setHours(0, 0, 0, 0); }
            return create(d);
          },
          endOf: (unit) => {
            const d = new Date(date);
            if (unit === 'year') { d.setMonth(11, 31); d.setHours(23, 59, 59, 999); }
            else if (unit === 'month') { d.setMonth(d.getMonth() + 1, 0); d.setHours(23, 59, 59, 999); }
            else if (unit === 'day') { d.setHours(23, 59, 59, 999); }
            return create(d);
          },
          subtract: (val, unit) => {
            const d = new Date(date);
            if (unit === 'years' || unit === 'year') d.setFullYear(d.getFullYear() - val);
            else if (unit === 'months' || unit === 'month') d.setMonth(d.getMonth() - val);
            else if (unit === 'days' || unit === 'day') d.setDate(d.getDate() - val);
            else if (unit === 'hours' || unit === 'hour') d.setHours(d.getHours() - val);
            else if (unit === 'minutes' || unit === 'minute') d.setMinutes(d.getMinutes() - val);
            else if (unit === 'seconds' || unit === 'second') d.setSeconds(d.getSeconds() - val);
            else if (unit === 'weeks' || unit === 'week') d.setDate(d.getDate() - val * 7);
            else if (unit === 'ms' || unit === 'milliseconds') d.setTime(d.getTime() - val);
            return create(d);
          },
          add: (val, unit) => {
            const d = new Date(date);
            if (unit === 'years' || unit === 'year') d.setFullYear(d.getFullYear() + val);
            else if (unit === 'months' || unit === 'month') d.setMonth(d.getMonth() + val);
            else if (unit === 'days' || unit === 'day') d.setDate(d.getDate() + val);
            else if (unit === 'hours' || unit === 'hour') d.setHours(d.getHours() + val);
            else if (unit === 'minutes' || unit === 'minute') d.setMinutes(d.getMinutes() + val);
            else if (unit === 'seconds' || unit === 'second') d.setSeconds(d.getSeconds() + val);
            else if (unit === 'weeks' || unit === 'week') d.setDate(d.getDate() + val * 7);
            return create(d);
          },
          isBefore: (other) => date < (other instanceof Date ? other : new Date(other)),
          isAfter: (other) => date > (other instanceof Date ? other : new Date(other)),
          isSame: (other) => date.getTime() === (other instanceof Date ? other : new Date(other)).getTime(),
          diff: (other, unit) => {
            const o = other instanceof Date ? other : new Date(other);
            const diff = date.getTime() - o.getTime();
            if (unit === 'seconds' || unit === 'second') return Math.floor(diff / 1000);
            if (unit === 'minutes' || unit === 'minute') return Math.floor(diff / 60000);
            if (unit === 'hours' || unit === 'hour') return Math.floor(diff / 3600000);
            if (unit === 'days' || unit === 'day') return Math.floor(diff / 86400000);
            if (unit === 'months' || unit === 'month') return (date.getFullYear() - o.getFullYear()) * 12 + date.getMonth() - o.getMonth();
            if (unit === 'years' || unit === 'year') return date.getFullYear() - o.getFullYear();
            return diff;
          },
          locale: () => create(date),
          fromNow: () => {
            const now = new Date();
            const diff = now - date;
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return 'just now';
            if (mins < 60) return mins + ' minutes ago';
            const hours = Math.floor(mins / 60);
            if (hours < 24) return hours + ' hours ago';
            const days = Math.floor(hours / 24);
            if (days < 30) return days + ' days ago';
            const months = Math.floor(days / 30);
            if (months < 12) return months + ' months ago';
            return Math.floor(months / 12) + ' years ago';
          },
        };
        return m;
      };
      return create(dt);
    };

    // 组装完整上下文
    const context = {
      // 核心
      config,
      theme,
      page: hexifyPage,

      // 数据
      posts: hexifyPosts(data.posts || []),
      categories: data.categories || [],
      tags: data.tags || [],
      archives: data.archives || [],
      pagination: data.pagination || {},
      site: { posts: hexifyPosts(data.posts || []), categories: data.categories || [], tags: data.tags || [], data: self._siteData || {} },

      // Hexo 辅助函数
      partial,
      url_for,
      __,
      date: formatDate,
      strip_html,
      css,
      js,
      is_home,
      is_post,
      is_page,
      is_archive,
      is_category,
      is_tag,
      is_month,
      is_year,
      full_url_for,
      toc,
      truncate,
      env,
      gravatar,
      moment,

      // Hexo 兼容
      body: data.body || '',
      _p: __,
      url: full_url_for,
      feed_url: () => url_for('/atom.xml'),
      
      // hexo-* 插件注册的辅助函数
      ...(self._hexoHelpers || {}),
    };

    return context;
  }

  _resolveTemplate(name) {
    // 清理路径，防止目录遍历
    const cleanName = name.replace(/\.\./g, '').replace(/\/\//g, '/');

    const candidates = [
      path.join(this.themeDir, 'layout', `${cleanName}`),
      path.join(this.themeDir, 'layout', `${cleanName}.ejs`),
      path.join(this.themeDir, 'layout', `${cleanName}`, 'index.ejs'),
      path.join(this.themeDir, 'layout', `${cleanName}.html`),
      path.join(this.themeDir, `${cleanName}`),
      path.join(this.themeDir, `${cleanName}.ejs`),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * 复制主题静态资源到 public
   */
  copyAssets(publicDir) {
    const sourceDir = path.join(this.themeDir, 'source');
    if (!fs.existsSync(sourceDir)) return;
    this._copyDir(sourceDir, publicDir);
  }

  _copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
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

  getThemeInfo() {
    const packagePath = path.join(this.themeDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    }
    return { name: this.themeName };
  }
}

module.exports = ThemeManager;
