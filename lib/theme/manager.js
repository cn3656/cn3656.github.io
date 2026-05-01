/**
 * Ation Blog - 主题系统
 * 兼容 Hexo 主题结构, 支持 EJS 模板
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

class ThemeManager {
  constructor(baseDir, config) {
    this.baseDir = baseDir;
    this.config = config;
    this.themeName = config.get('theme', 'default');
    this.themeDir = path.join(baseDir, 'themes', this.themeName);
    this.themeConfig = config.getThemeConfig();
    this.cache = new Map();
  }
  
  /**
   * 渲染模板
   */
  async render(template, data = {}) {
    const templatePath = this._resolveTemplate(template);
    if (!templatePath) {
      throw new Error(`[Ation] Template not found: ${template}`);
    }
    
    const context = this._buildContext(data);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // 渲染主体内容 (子模板)
    const body = await ejs.render(templateContent, {
      ...context,
      filename: templatePath,
      cache: false
    });
    
    // 用 layout.ejs 包装 (排除 layout 本身和 404)
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
   * 渲染字符串模板
   */
  async renderString(templateStr, data = {}) {
    const context = this._buildContext(data);
    return ejs.render(templateStr, {
      ...context,
      cache: false
    });
  }
  
  /**
   * 构建模板上下文
   */
  _buildContext(data) {
    return {
      // 站点配置
      config: this.config.getAll(),
      theme: this.themeConfig,
      
      // 数据
      ...data,
      
      // 辅助函数
      __: (key) => this._translate(key),
      url_for: (path) => this._urlFor(path),
      date: (date, format) => this._formatDate(date, format),
      strip_html: (str) => str.replace(/<[^>]*>/g, ''),
      truncate: (str, len = 200) => str.length > len ? str.substring(0, len) + '...' : str,
      is_current: (path) => false, // 由 data 注入
      
      // Hexo 兼容辅助
      partial: (name, locals) => '',  // 同步模式下简化处理
      css: (files) => this._assetTags('css', files),
      js: (files) => this._assetTags('js', files),
    };
  }
  
  _resolveTemplate(name) {
    // 尝试多种路径
    const candidates = [
      path.join(this.themeDir, 'layout', `${name}.ejs`),
      path.join(this.themeDir, 'layout', `${name}`, 'index.ejs'),
      path.join(this.themeDir, 'layout', `${name}.html`),
      path.join(this.themeDir, `${name}.ejs`),
    ];
    
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    
    return null;
  }
  
  _urlFor(url) {
    const root = this.config.get('root', '/');
    if (!url) return root;
    if (url.startsWith('http') || url.startsWith('//')) return url;
    if (url.startsWith('/')) return root.replace(/\/$/, '') + url;
    return root + url;
  }
  
  _formatDate(date, format) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    const pad = (n) => n.toString().padStart(2, '0');
    
    return (format || 'YYYY-MM-DD')
      .replace('YYYY', d.getFullYear())
      .replace('YY', d.getFullYear().toString().slice(-2))
      .replace('MM', pad(d.getMonth() + 1))
      .replace('DD', pad(d.getDate()))
      .replace('HH', pad(d.getHours()))
      .replace('mm', pad(d.getMinutes()))
      .replace('ss', pad(d.getSeconds()));
  }
  
  _translate(key) {
    // 简单的 i18n 支持
    const lang = this.config.get('language', 'zh-CN');
    const langFile = path.join(this.themeDir, 'languages', `${lang}.yml`);
    // 简化实现, 直接返回 key
    return key;
  }
  
  _assetTags(type, files) {
    const root = this.config.get('root', '/');
    if (!Array.isArray(files)) files = [files];
    
    return files.map(f => {
      // 自动补后缀
      if (type === 'css' && !f.endsWith('.css')) f += '.css';
      if (type === 'js' && !f.endsWith('.js')) f += '.js';
      
      const url = f.startsWith('http') ? f : root.replace(/\/$/, '') + '/' + f.replace(/^\//, '');
      if (type === 'css') {
        return `<link rel="stylesheet" href="${url}">`;
      }
      return `<script src="${url}"></script>`;
    }).join('\n');
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
    
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this._copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  /**
   * 获取主题信息
   */
  getThemeInfo() {
    const infoPath = path.join(this.themeDir, '_config.yml');
    const packagePath = path.join(this.themeDir, 'package.json');
    
    if (fs.existsSync(packagePath)) {
      return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    }
    return { name: this.themeName };
  }
}

module.exports = ThemeManager;
