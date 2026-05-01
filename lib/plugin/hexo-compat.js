/**
 * Ation Blog - Hexo 兼容适配层
 * 模拟 Hexo 的全局对象 hexo.extend.* API
 * 使 hexo-* npm 插件能在 Ation 中加载
 */

const fs = require('fs');
const path = require('path');

class HexoCompat {
  constructor(ationContext) {
    this.ation = ationContext;
    this.generators = [];
    this.filters = [];
    this.helpers = {};
    this.tags = {};
    this.processors = [];
  }

  /**
   * 创建模拟的 hexo 全局对象
   */
  createMockHexo(config) {
    const self = this;
    
    const mockHexo = {
      config: config || {},
      
      extend: {
        generator: {
          register(name, fn) {
            self.generators.push({ name, fn });
          }
        },
        
        filter: {
          register(type, fn, priority) {
            self.filters.push({ type, fn, priority: priority || 10 });
          }
        },
        
        helper: {
          register(name, fn) {
            self.helpers[name] = fn;
          }
        },
        
        tag: {
          register(name, fn, options) {
            self.tags[name] = { fn, options };
          }
        },
        
        processor: {
          register(pattern, fn) {
            self.processors.push({ pattern, fn });
          }
        },
        
        deployer: {
          register(name, fn) {
            // 部署器注册
          }
        },
        
        renderer: {
          register(name, output, fn, sync) {
            // 渲染器注册
          }
        },
        
        migrator: {
          register(name, fn) {
            // 迁移器注册
          }
        }
      },
      
      // 常用属性
      log: {
        info: (...args) => console.log('[hexo-compat]', ...args),
        warn: (...args) => console.warn('[hexo-compat]', ...args),
        error: (...args) => console.error('[hexo-compat]', ...args),
        debug: (...args) => {},
      },
      
      source_dir: '',
      public_dir: '',
      theme_dir: '',
      theme_config: {},
      
      // 事件系统
      on() {},
      emit() {},
      
      // 加载
      load() { return Promise.resolve(); },
    };
    
    return mockHexo;
  }

  /**
   * 加载 hexo-* npm 插件
   */
  loadHexoPlugins(baseDir, config) {
    const nodeModules = path.join(baseDir, 'node_modules');
    if (!fs.existsSync(nodeModules)) return;
    
    const mockHexo = this.createMockHexo(config);
    
    // 注入全局 hexo 对象
    global.hexo = mockHexo;
    
    const entries = fs.readdirSync(nodeModules).filter(e => e.startsWith('hexo-'));
    let loaded = 0;
    
    for (const entry of entries) {
      try {
        const pluginPath = path.join(nodeModules, entry);
        const pkgPath = path.join(pluginPath, 'package.json');
        
        if (!fs.existsSync(pkgPath)) continue;
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const mainFile = path.join(pluginPath, pkg.main || 'index.js');
        
        if (!fs.existsSync(mainFile)) continue;
        
        // 更新 hexo 对象属性
        mockHexo.source_dir = path.join(baseDir, config.source_dir || 'source');
        mockHexo.public_dir = path.join(baseDir, config.public_dir || 'public');
        mockHexo.theme_dir = path.join(baseDir, 'themes', config.theme || 'default');
        
        // 加载插件
        require(mainFile);
        loaded++;
        console.log(`[Ation] Loaded hexo plugin: ${entry}`);
      } catch (e) {
        console.warn(`[Ation] Failed to load hexo plugin "${entry}":`, e.message);
      }
    }
    
    return loaded;
  }

  /**
   * 获取已注册的辅助函数
   */
  getHelpers() {
    return { ...this.helpers };
  }

  /**
   * 获取已注册的生成器
   */
  getGenerators() {
    return [...this.generators];
  }

  /**
   * 获取已注册的过滤器
   */
  getFilters(type) {
    if (type) {
      return this.filters.filter(f => f.type === type).sort((a, b) => a.priority - b.priority);
    }
    return [...this.filters];
  }
}

module.exports = HexoCompat;
