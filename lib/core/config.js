/**
 * Ation Blog - 配置管理模块
 * 兼容 Hexo 的 _config.yml 配置
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DEFAULT_CONFIG = {
  // 站点配置
  title: 'Ation Blog',
  subtitle: 'A lightweight blog powered by Ation',
  description: 'A modern, fast, and extensible static blog',
  author: 'Ation',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  url: 'https://ation.github.io',
  root: '/',
  
  // 主题
  theme: 'default',
  
  // 分页
  per_page: 10,
  pagination_dir: 'page',
  
  // 永久链接
  permalink: ':year/:month/:day/:title/',
  permalink_defaults: {},
  
  // 目录结构 (兼容 Hexo)
  source_dir: 'source',
  public_dir: 'public',
  tag_dir: 'tags',
  archive_dir: 'archives',
  category_dir: 'categories',
  
  // 日期格式
  date_format: 'YYYY-MM-DD',
  time_format: 'HH:mm:ss',
  
  // 部署
  deploy: {
    type: 'git',
    repo: '',
    branch: 'main',
    message: 'Site updated: {{ now("YYYY-MM-DD HH:mm:ss") }}'
  },
  
  // 插件
  plugins: [],
  
  // Markdown
  marked: {
    gfm: true,
    breaks: true,
    pedantic: false,
    smartLists: true,
    smartypants: true
  },
  
  // 高亮
  highlight: {
    enable: true,
    line_number: true,
    auto_detect: true,
    tab_replace: '  '
  },
  
  // SEO
  seo: {
    google_analytics: '',
    baidu_analytics: ''
  },
  
  // 导航菜单
  menu: {
    Home: '/',
    Archives: '/archives/',
    Categories: '/categories/',
    Tags: '/tags/',
    About: '/about/'
  },
  
  // 社交链接
  social: {},
  
  // 兼容 Hexo 的配置标记
  hexo_compatible: true
};

class Config {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.config = { ...DEFAULT_CONFIG };
    this.themeConfig = {};
    this.load();
  }
  
  load() {
    // 加载主配置
    const configPath = path.join(this.baseDir, '_config.yml');
    if (fs.existsSync(configPath)) {
      try {
        const userConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
        this.config = this._deepMerge(this.config, userConfig);
      } catch (e) {
        console.warn('[Ation] _config.yml parse error:', e.message);
      }
    }
    
    // 加载主题配置
    const themeConfigPath = path.join(
      this.baseDir, 'themes', this.config.theme, '_config.yml'
    );
    if (fs.existsSync(themeConfigPath)) {
      try {
        this.themeConfig = yaml.load(fs.readFileSync(themeConfigPath, 'utf8'));
      } catch (e) {
        console.warn('[Ation] theme _config.yml parse error:', e.message);
      }
    }
  }
  
  get(key, defaultValue) {
    const keys = key.split('.');
    let val = this.config;
    for (const k of keys) {
      val = val?.[k];
      if (val === undefined) break;
    }
    return val !== undefined ? val : defaultValue;
  }
  
  set(key, value) {
    const keys = key.split('.');
    let obj = this.config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
  }
  
  getAll() {
    return { ...this.config };
  }
  
  getThemeConfig() {
    return { ...this.themeConfig };
  }
  
  save() {
    const configPath = path.join(this.baseDir, '_config.yml');
    fs.writeFileSync(configPath, yaml.dump(this.config), 'utf8');
  }
  
  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}

module.exports = Config;
