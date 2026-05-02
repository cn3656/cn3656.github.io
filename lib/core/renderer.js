/**
 * Ation Blog - Markdown 渲染引擎
 * 支持 Hexo tag 插件语法、代码高亮
 */

const { marked } = require('marked');
const hljs = require('highlight.js');
const cheerio = require('cheerio');

class Renderer {
  constructor(config) {
    this.config = config;
    this._setupMarked();
  }
  
  _setupMarked() {
    const markedConfig = this.config?.marked || {};
    const highlightConfig = this.config?.highlight || {};
    
    // 自定义渲染器
    const renderer = new marked.Renderer();
    
    // 代码块高亮 — 输出 matery 主题兼容结构
    renderer.code = function(codeObj) {
      const text = typeof codeObj === 'string' ? codeObj : (codeObj.text || '');
      const lang = typeof codeObj === 'string' ? (arguments[1] || '') : (codeObj.lang || '');
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';

      let highlighted;
      try {
        highlighted = hljs.highlight(text, { language }).value;
      } catch {
        highlighted = text;
      }

      return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
    };
    
    // 图片 - 支持 Hexo 的 {% img %} 风格 class
    renderer.image = function(imgObj) {
      const href = typeof imgObj === 'string' ? imgObj : (imgObj.href || '');
      const title = typeof imgObj === 'string' ? (arguments[1] || '') : (imgObj.title || '');
      const text = typeof imgObj === 'string' ? (arguments[2] || '') : (imgObj.text || '');
      const alt = text || '';
      const titleAttr = title ? ` title="${title}"` : '';
      return `<img src="${href}" alt="${alt}"${titleAttr} loading="lazy">`;
    };
    
    // 链接 - 新窗口打开外部链接
    renderer.link = function(linkObj) {
      const href = typeof linkObj === 'string' ? linkObj : (linkObj.href || '');
      const title = typeof linkObj === 'string' ? (arguments[1] || '') : (linkObj.title || '');
      const text = typeof linkObj === 'string' ? (arguments[2] || '') : (linkObj.tokens ? linkObj.tokens.map(t => t.raw || t.text || '').join('') : (linkObj.text || ''));
      const titleAttr = title ? ` title="${title}"` : '';
      const isExternal = href.startsWith('http') && !href.includes('localhost');
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${href}"${titleAttr}${target}>${text}</a>`;
    };
    
    marked.setOptions({
      renderer,
      gfm: markedConfig.gfm !== false,
      breaks: markedConfig.breaks !== false,
      pedantic: markedConfig.pedantic || false
    });
  }
  
  render(content) {
    if (!content) return '';
    
    // 预处理: Hexo tag 插件
    let processed = this._processHexoTags(content);
    
    // 渲染 Markdown
    let html = marked.parse(processed);
    
    // 后处理
    html = this._postProcess(html);
    
    return html;
  }
  
  _processHexoTags(content) {
    // {% codeblock lang:title %}...{% endcodeblock %}
    content = content.replace(
      /\{%\s*codeblock\s*(.*?)\s*%\}([\s\S]*?)\{%\s*endcodeblock\s*%\}/g,
      (match, args, code) => {
        const parts = args.split(':');
        const lang = parts[0] || '';
        const title = parts[1] || '';
        return `\`\`\`${lang}${title ? ' ' + title : ''}\n${code.trim()}\n\`\`\``;
      }
    );
    
    // {% quote [author [url]] %}...{% endquote %}
    content = content.replace(
      /\{%\s*quote\s*(.*?)\s*%\}([\s\S]*?)\{%\s*endquote\s*%\}/g,
      (match, author, text) => {
        return `> ${text.trim()}\n${author ? `> — ${author}` : ''}`;
      }
    );
    
    // {% pullquote [class] %}...{% endpullquote %}
    content = content.replace(
      /\{%\s*pullquote\s*(.*?)\s*%\}([\s\S]*?)\{%\s*endpullquote\s*%\}/g,
      (match, cls, text) => {
        return `<blockquote class="pullquote ${cls || ''}">${text.trim()}</blockquote>`;
      }
    );
    
    // {% asset_img slug [title] %}
    content = content.replace(
      /\{%\s*asset_img\s+(\S+)\s*(.*?)\s*%\}/g,
      (match, src, title) => {
        return `![${title || ''}](/${src})`;
      }
    );
    
    // {% asset_link slug [title] %}
    content = content.replace(
      /\{%\s*asset_link\s+(\S+)\s*(.*?)\s*%\}/g,
      (match, href, title) => {
        return `[${title || href}](/${href})`;
      }
    );
    
    // {% post_link slug [title] %}
    content = content.replace(
      /\{%\s*post_link\s+(\S+)\s*(.*?)\s*%\}/g,
      (match, slug, title) => {
        return `[${title || slug}](/posts/${slug}/)`;
      }
    );
    
    return content;
  }
  
  _postProcess(html) {
    // 给表格添加 class
    html = html.replace(/<table>/g, '<table class="table">');
    
    // 外部链接处理 (补漏)
    
    return html;
  }
}

module.exports = Renderer;
