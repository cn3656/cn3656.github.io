/**
 * Ation Blog - 插件系统
 * 支持 Hook 机制, 兼容 Hexo 插件接口
 */

const fs = require('fs');
const path = require('path');

const HOOKS = [
  'before_init',        // 初始化前
  'after_init',         // 初始化后
  'before_generate',    // 生成前
  'after_generate',     // 生成后
  'before_render',      // 渲染前 (单篇文章)
  'after_render',       // 渲染后 (单篇文章)
  'before_deploy',      // 部署前
  'after_deploy',       // 部署后
  'new_post',           // 新建文章
  'new_page',           // 新建页面
  'server_middleware',  // 开发服务器中间件
  // Hexo 兼容 hooks
  'generateBefore',
  'generateAfter',
  'renderBefore',
  'renderAfter',
  'deployBefore',
  'deployAfter',
  'new',
];

class PluginManager {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.plugins = new Map();
    this.hooks = {};
    
    // 初始化所有 hook 列表
    for (const hook of HOOKS) {
      this.hooks[hook] = [];
    }
  }
  
  /**
   * 注册插件
   * @param {string} name - 插件名
   * @param {object} plugin - 插件对象
   * 插件对象结构:
   * {
   *   name: 'plugin-name',
   *   version: '1.0.0',
   *   hooks: {
   *     'before_generate': (ctx) => {},
   *     'after_render': (content, data) => content
   *   },
   *   filters: {
   *     'post_content': (content) => content
   *   }
   * }
   */
  register(name, plugin) {
    if (this.plugins.has(name)) {
      console.warn(`[Ation] Plugin "${name}" already registered, skipping`);
      return;
    }
    
    this.plugins.set(name, plugin);
    
    // 注册 hooks
    if (plugin.hooks) {
      for (const [hook, fn] of Object.entries(plugin.hooks)) {
        if (this.hooks[hook]) {
          this.hooks[hook].push({ plugin: name, fn });
        } else {
          console.warn(`[Ation] Unknown hook "${hook}" in plugin "${name}"`);
        }
      }
    }
    
    // 注册 filters (Hexo 兼容)
    if (plugin.filters) {
      for (const [filter, fn] of Object.entries(plugin.filters)) {
        if (this.hooks[filter]) {
          this.hooks[filter].push({ plugin: name, fn });
        } else {
          // 自动创建 filter hook
          this.hooks[filter] = [{ plugin: name, fn }];
        }
      }
    }
    
    console.log(`[Ation] Plugin registered: ${name}`);
  }
  
  /**
   * 执行 hook (瀑布式, 返回值传递)
   */
  async applyHook(hookName, data, context) {
    const handlers = this.hooks[hookName] || [];
    let result = data;
    
    for (const { plugin, fn } of handlers) {
      try {
        const ret = await fn(result, context);
        if (ret !== undefined) {
          result = ret;
        }
      } catch (e) {
        console.error(`[Ation] Error in plugin "${plugin}" hook "${hookName}":`, e.message);
      }
    }
    
    return result;
  }
  
  /**
   * 执行 hook (事件式, 不关心返回值)
   */
  async emitHook(hookName, context) {
    const handlers = this.hooks[hookName] || [];
    
    for (const { plugin, fn } of handlers) {
      try {
        await fn(context);
      } catch (e) {
        console.error(`[Ation] Error in plugin "${plugin}" hook "${hookName}":`, e.message);
      }
    }
  }
  
  /**
   * 从 plugins 目录加载插件
   */
  loadPlugins(configuredPlugins) {
    const pluginsDir = path.join(this.baseDir, 'plugins');
    const pluginsToLoad = configuredPlugins || [];
    
    // 自动扫描 plugins 目录
    if (fs.existsSync(pluginsDir)) {
      const entries = fs.readdirSync(pluginsDir);
      for (const entry of entries) {
        const pluginPath = path.join(pluginsDir, entry);
        
        if (fs.statSync(pluginPath).isDirectory()) {
          const indexPath = path.join(pluginPath, 'index.js');
          if (fs.existsSync(indexPath)) {
            pluginsToLoad.push(`./plugins/${entry}`);
          }
        } else if (entry.endsWith('.js')) {
          pluginsToLoad.push(`./plugins/${entry}`);
        }
      }
    }
    
    // 加载 npm 插件 (hexo-* 或 ation-* 前缀)
    try {
      const nodeModules = path.join(this.baseDir, 'node_modules');
      if (fs.existsSync(nodeModules)) {
        for (const prefix of ['ation-', 'hexo-']) {
          const entries = fs.readdirSync(nodeModules).filter(e => e.startsWith(prefix));
          for (const entry of entries) {
            if (!pluginsToLoad.includes(entry)) {
              pluginsToLoad.push(entry);
            }
          }
        }
      }
    } catch (e) {
      // node_modules 可能不存在
    }
    
    // 依次加载
    for (const pluginRef of pluginsToLoad) {
      try {
        let plugin;
        if (pluginRef.startsWith('.') || pluginRef.startsWith('/')) {
          plugin = require(path.resolve(this.baseDir, pluginRef));
        } else {
          plugin = require(path.join(this.baseDir, 'node_modules', pluginRef));
        }
        
        const name = plugin.name || pluginRef;
        this.register(name, plugin);
      } catch (e) {
        console.warn(`[Ation] Failed to load plugin "${pluginRef}":`, e.message);
      }
    }
    
    console.log(`[Ation] ${this.plugins.size} plugins loaded`);
  }
  
  getPlugin(name) {
    return this.plugins.get(name);
  }
  
  listPlugins() {
    return Array.from(this.plugins.keys());
  }
}

module.exports = PluginManager;
