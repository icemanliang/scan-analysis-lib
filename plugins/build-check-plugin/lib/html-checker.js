class HtmlChecker {
  constructor(config = {}) {
    this.config = config;
  }

  check(dom) {
    if (!dom) {
      return {
        warnings: ['无效的 DOM : 文档为空或未定义'],
        stats: {}
      };
    }

    const result = {
      warnings: [],
      stats: {
        hasDoctype: false,
        hasLangAttr: false,
        hasSEOMeta: false,
        hasViewport: false,
        viewportContent: null,
        hasCSP: false,
        hasPerformance: false,
        resources: {
          scripts: {
            total: 0,
            external: 0,
            hosts: [],
            nonStandardHosts: [],
            unvalidateUrls: [],
            unsafeHosts: []
          },
          styles: {
            total: 0,
            external: 0,
            hosts: [],
            nonStandardHosts: [],
            unvalidateUrls: [],
            unsafeHosts: []
          }
        }
      }
    };

    this.checkDoctype(dom, result);
    this.checkHtmlStructure(dom, result);
    this.checkMetaTags(dom, result);
    this.checkSecurityHeaders(dom, result);
    this.checkPerformanceOptimization(dom, result);
    this.checkExternalResources(dom, result);

    return result;
  }

  checkDoctype(dom, result) {
    const hasDoctype = dom.children?.some(node => 
      node.type === 'directive' && node.name?.toLowerCase() === '!doctype'
    );

    result.stats.hasDoctype = hasDoctype;
    if (!hasDoctype) {
      result.warnings.push('缺少 <!DOCTYPE html> 声明');
    }
  }

  checkHtmlStructure(dom, result) {
    const htmlTag = dom.children?.find(node => 
      node.type === 'tag' && node.name === 'html'
    );

    if (!htmlTag) {
      result.warnings.push('缺少 <html> 标签');
      return;
    }

    const langAttr = htmlTag.attribs?.lang;
    result.stats.hasLangAttr = !!langAttr;
    if (!langAttr) {
      result.warnings.push('html 标签缺少 lang 属性');
    }
  }

  checkMetaTags(dom, result) {
    const metaTags = this.findMetaTags(dom);
    
    // 检查 SEO 相关 meta 标签
    const seoTags = ['description', 'keywords'];
    const missingSEOTags = seoTags.filter(name => 
      !metaTags.some(meta => meta.attribs?.name === name)
    );

    result.stats.hasSEOMeta = missingSEOTags.length === 0;
    if (missingSEOTags.length > 0) {
      result.warnings.push(`缺少 SEO 相关的 meta 标签 : ${missingSEOTags.join('、')}`);
    }

    // 检查 viewport
    const viewportMeta = metaTags.find(meta => 
      meta.attribs?.name === 'viewport'
    );
    const expectedViewport = 'width=device-width, initial-scale=1';
    
    result.stats.hasViewport = !!viewportMeta;
    result.stats.viewportContent = viewportMeta?.attribs?.content;

    if (!viewportMeta) {
      result.warnings.push('缺少 viewport meta 标签');
    } else if (viewportMeta.attribs?.content !== expectedViewport) {
      result.warnings.push(`viewport 内容应为 "${expectedViewport}"`);
    }
  }

  checkSecurityHeaders(dom, result) {
    const metaTags = this.findMetaTags(dom);
    
    const cspMeta = metaTags.find(meta => 
      meta.attribs?.['http-equiv']?.toLowerCase() === 'content-security-policy'
    );

    result.stats.hasCSP = !!cspMeta;
    if (!cspMeta) {
      result.warnings.push('缺少内容安全策略(CSP)meta 标签');
    }
  }

  checkPerformanceOptimization(dom, result) {
    const linkTags = this.findLinkTags(dom);
    
    const preconnectCount = linkTags.filter(link => 
      link.attribs?.rel === 'preconnect'
    ).length;

    const prefetchCount = linkTags.filter(link => 
      link.attribs?.rel === 'dns-prefetch'
    ).length;

    if (preconnectCount === 0 && prefetchCount === 0) {
      result.stats.hasPerformance = false;
      result.warnings.push('未找到 preconnect 或 dns-prefetch 链接标签');
    } else {
      result.stats.hasPerformance = true;
    }
  }

  checkExternalResources(dom, result) {
    const scripts = this.findScriptTags(dom);
    const styles = this.findStyleTags(dom);
    const stats = result.stats.resources;
    
    // 检查脚本资源
    stats.scripts.total = scripts.length;
    const scriptHosts = new Set();
    const scriptNonStandardHosts = new Set();
    const unvalidateScriptUrls = new Set();
    const unsafeScriptHosts = new Set();
    
    scripts.forEach(script => {
      if (script.attribs?.src) {
        const src = script.attribs.src;
        stats.scripts.external++;
        
        // 检查是否是标准的 HTTP(S) 请求
        if (!src.startsWith('http://') && !src.startsWith('https://')) {
          unvalidateScriptUrls.add(src);
        } else {
          try {
            const hostname = new URL(src).hostname;
            scriptHosts.add(hostname);
            if (this.isUnsafeHost(hostname)) {
              unsafeScriptHosts.add(hostname);
            } else if (!this.isStandardHost(hostname)) {
              scriptNonStandardHosts.add(hostname);
            }
          } catch {
            scriptNonStandardHosts.add(src);
          }
        }
      }
    });

    // 检查样式资源
    stats.styles.total = styles.length;
    const styleHosts = new Set();
    const styleNonStandardHosts = new Set();
    const unvalidateStyleUrls = new Set();
    const unsafeStyleHosts = new Set();
    styles.forEach(style => {
      if (style.attribs?.href) {
        const href = style.attribs.href;
        stats.styles.external++;
        
        // 检查是否是标准的 HTTP(S) 请求
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
            unvalidateStyleUrls.add(href);
        } else {
          try {
            const hostname = new URL(href).hostname;
            styleHosts.add(hostname);
            if (this.isUnsafeHost(hostname)) {
              unsafeStyleHosts.add(href);
            } else if (!this.isStandardHost(hostname)) {
              styleNonStandardHosts.add(hostname);
            }
          } catch {
            styleNonStandardHosts.add(href);
          }
        }
      }
    });

    // 转换 Set 为数组
    stats.scripts.hosts = Array.from(scriptHosts);
    stats.scripts.nonStandardHosts = Array.from(scriptNonStandardHosts);
    stats.scripts.unvalidateUrls = Array.from(unvalidateScriptUrls);
    stats.scripts.unsafeHosts = Array.from(unsafeScriptHosts);  
    stats.styles.hosts = Array.from(styleHosts);
    stats.styles.nonStandardHosts = Array.from(styleNonStandardHosts);
    stats.styles.unvalidateUrls = Array.from(unvalidateStyleUrls);
    stats.styles.unsafeHosts = Array.from(unsafeStyleHosts);
  }

  // 辅助方法
  findMetaTags(dom) {
    const headTag = this.findHeadTag(dom);
    return headTag ? this.findChildTags(headTag, 'meta') : [];
  }

  findLinkTags(dom) {
    const headTag = this.findHeadTag(dom);
    return headTag ? this.findChildTags(headTag, 'link') : [];
  }

  findScriptTags(dom) {
    const scripts = [];
    this.traverseDOM(dom, node => {
        if (node.type === 'script' && node.name === 'script') {
          scripts.push(node);
        }
    });
    return scripts;
  }

  findStyleTags(dom) {
    return this.findAllTags(dom, 'link').filter(tag => 
      tag.attribs?.rel === 'stylesheet'
    );
  }

  findHeadTag(dom) {
    const htmlTag = dom.children?.find(node => 
      node.type === 'tag' && node.name === 'html'
    );
    return htmlTag?.children?.find(node => 
      node.type === 'tag' && node.name === 'head'
    );
  }

  findChildTags(parent, tagName) {
    return parent.children?.filter(node => 
      node.type === 'tag' && node.name === tagName
    ) || [];
  }

  findAllTags(dom, tagName) {
    const tags = [];
    this.traverseDOM(dom, node => {
      if (node.type === 'tag' && node.name === tagName) {
        tags.push(node);
      }
    });
    return tags;
  }

  traverseDOM(node, callback) {
    callback(node);
    if (node.children) {
      node.children.forEach(child => this.traverseDOM(child, callback));
    }
  }

  isStandardHost(hostname) {
    return this.config?.cdn?.standardHosts?.some(pattern => 
      hostname.includes(pattern)
    ) ?? true;
  }

  isUnsafeHost(hostname) {
    return this.config?.cdn?.unsafeHosts?.some(pattern => 
      hostname.includes(pattern)
    ) ?? false;
  }
}

module.exports = HtmlChecker; 