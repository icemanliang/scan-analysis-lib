const fs = require('fs');
const path = require('path');
const htmlparser2 = require('htmlparser2');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const browserslist = require('browserslist');

class BuildCheckPlugin {
  constructor(options = {}) {
    this.name = 'BuildCheckPlugin';
    this.options = {
      rootDir: './',
      buildDir: 'dist',
      unsafeCDNHosts: ['http://unsafecdn.com'],
      ...options
    };
  }

  apply(scanner) {
    scanner.hooks.build.tapPromise(this.name, async (context) => {
      try {
        context.logger.log('info', 'Starting build check...');
        
        const buildPath = path.join(context.root, this.options.buildDir);
        const stats = this.analyzeDirectory(buildPath);
        const htmlChecks = await this.checkHtmlFiles(buildPath);
        const jsChecks = await this.checkJsFiles(buildPath);
        const cssChecks = await this.checkCssFiles(buildPath);

        context.scanResults.buildInfo = {
          stats,
          htmlChecks,
          jsChecks,
          cssChecks
        };

        context.logger.log('info', 'Build check completed.');
      } catch (error) {
        context.scanResults.buildInfo = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
      }
    });
  }

  analyzeDirectory(dir) {
    const stats = {
      html: { count: 0, size: 0 },
      js: { count: 0, size: 0 },
      css: { count: 0, size: 0 },
      media: { count: 0, size: 0 },
      other: { count: 0, size: 0 },
      total: { count: 0, size: 0 }
    };

    const processFile = (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const size = fs.statSync(filePath).size;
      let category;

      if (ext === '.html') category = 'html';
      else if (ext === '.js') category = 'js';
      else if (ext === '.css') category = 'css';
      else if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.mp4', '.webm', '.woff', '.woff2', '.ttf', '.eot'].includes(ext)) category = 'media';
      else category = 'other';

      stats[category].count++;
      stats[category].size += size;
      stats.total.count++;
      stats.total.size += size;
    };

    const walkDir = (currentPath) => {
      const files = fs.readdirSync(currentPath);
      for (const file of files) {
        const filePath = path.join(currentPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          processFile(filePath);
        }
      }
    };

    walkDir(dir);
    return stats;
  }

  async checkHtmlFiles(buildPath) {
    const htmlFiles = fs.readdirSync(buildPath).filter(file => path.extname(file).toLowerCase() === '.html');
    const results = [];

    for (const file of htmlFiles) {
      const filePath = path.join(buildPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const result = {
        file,
        unsafeCDN: [],
        jsPrefetch: false,
        cssPreload: false,
        fontPreload: false,
        fontCrossOrigin: false
      };

      const parser = new htmlparser2.Parser({
        onopentag: (name, attribs) => {
          if (name === 'script' && attribs.src) {
            const src = attribs.src;
            if (this.options.unsafeCDNHosts.some(host => src.includes(host))) {
              result.unsafeCDN.push(src);
            }
            if (attribs.rel === 'prefetch') {
              result.jsPrefetch = true;
            }
          }
          if (name === 'link' && attribs.rel === 'stylesheet' && attribs.rel === 'preload') {
            result.cssPreload = true;
          }
          if (name === 'link' && attribs.rel === 'preload' && attribs.as === 'font') {
            result.fontPreload = true;
            if (attribs.crossorigin === 'anonymous') {
              result.fontCrossOrigin = true;
            }
          }
        }
      });

      parser.write(content);
      parser.end();

      results.push(result);
    }

    return results;
  }

  async checkJsFiles(buildPath) {
    const jsFiles = fs.readdirSync(buildPath).filter(file => path.extname(file).toLowerCase() === '.js');
    const results = [];

    for (const file of jsFiles) {
      const filePath = path.join(buildPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const result = {
        file,
        useStrict: content.includes('use strict'),
        isMinified: this.isMinified(content),
        hasSourceMap: fs.existsSync(filePath + '.map')
      };
      results.push(result);
    }

    return results;
  }

  isMinified(content) {
    return content.split('\n').length < 5 || content.length / content.split('\n').length > 100;
  }

  async checkCssFiles(buildPath) {
    const cssFiles = fs.readdirSync(buildPath).filter(file => path.extname(file).toLowerCase() === '.css');
    const results = [];

    for (const file of cssFiles) {
      const filePath = path.join(buildPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const result = {
        file,
        prefixCheck: await this.checkCssPrefixes(content),
        isMinified: this.isCssMinified(content)
      };
      results.push(result);
    }

    return results;
  }

  async checkCssPrefixes(css) {
    const browsers = browserslist.loadConfig({ path: this.options.rootDir });
    const prefixer = postcss([autoprefixer({ browsers })]);
    const result = await prefixer.process(css, { from: undefined });
    return {
      missingPrefixes: result.warnings().length > 0,
      warnings: result.warnings().map(warning => warning.text)
    };
  }

  isCssMinified(content) {
    return content.split('\n').length < 5 || content.length / content.split('\n').length > 100;
  }
}

module.exports = BuildCheckPlugin;
