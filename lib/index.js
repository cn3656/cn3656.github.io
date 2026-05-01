/**
 * Ation Blog - Main Entry
 * A lightweight, Hexo-compatible static blog generator
 * 
 * Usage:
 *   const Ation = require('./lib');
 *   const blog = new Ation('/path/to/blog');
 *   await blog.init();
 *   await blog.generate();
 */

const Generator = require('./core/generator');

class Ation {
  constructor(baseDir) {
    this.baseDir = baseDir || process.cwd();
    this.generator = new Generator(this.baseDir);
  }
  
  async init() {
    await this.generator.init();
    return this;
  }
  
  async generate() {
    return this.generator.generate();
  }
  
  getConfig() {
    return this.generator.config;
  }
  
  getData() {
    return this.generator.data;
  }
  
  getPlugins() {
    return this.generator.plugins;
  }
  
  getTheme() {
    return this.generator.theme;
  }
}

Ation.Generator = Generator;
Ation.Config = require('./core/config');
Ation.DataStore = require('./core/data').DataStore;
Ation.Renderer = require('./core/renderer');
Ation.ThemeManager = require('./theme/manager');
Ation.PluginManager = require('./plugin/manager');

module.exports = Ation;
