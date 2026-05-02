/**
 * Atom Blog - Main Entry
 * A lightweight, Hexo-compatible static blog generator
 * 
 * Usage:
 *   const Atom = require('./lib');
 *   const blog = new Atom('/path/to/blog');
 *   await blog.init();
 *   await blog.generate();
 */

const Generator = require('./core/generator');

class Atom {
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

Atom.Generator = Generator;
Atom.Config = require('./core/config');
Atom.DataStore = require('./core/data').DataStore;
Atom.Renderer = require('./core/renderer');
Atom.ThemeManager = require('./theme/manager');
Atom.PluginManager = require('./plugin/manager');

module.exports = Atom;
