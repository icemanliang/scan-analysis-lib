const fs = require('fs');
const path = require('path');
const htmlparser2 = require('htmlparser2');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const browserslist = require('browserslist');
const defaultConfig = require('./config');
const HtmlChecker = require('./lib/html-checker');

class BuildCheckPlugin {
  constructor(config = {}) {
    this.name = 'BuildCheckPlugin';
    this.config = {
      ...defaultConfig,
      ...config
    };
    this.htmlChecker = new HtmlChecker(this.config.html);
  }

  apply(scanner) {
    scanner.hooks.build.tapPromise(this.name, async (context) => {
      if(context.buildDir === '') {
        context.logger.log('warn', 'build directory is not exists, skip build check.');
        context.scanResults.buildInfo = null;
        return;
      }
      try {
        context.logger.log('info', 'starting build check...');
        
        const buildPath = path.join(context.baseDir, context.buildDir);
        const stats = this.analyzeDirectory(buildPath);
        const htmlChecks = await this.checkHtmlFiles(buildPath);
        const jsChecks = await this.checkJsFiles(buildPath);
        const cssChecks = await this.checkCssFiles(context.baseDir, buildPath);

        context.scanResults.buildInfo = {
          stats,
          htmlChecks,
          jsChecks,
          cssChecks
        };

        context.logger.log('info', 'build check completed.');
      } catch (error) {
        context.scanResults.buildInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.message}`);
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
      else if (this.config.fileTypes.media.includes(ext)) category = 'media';
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
      try {
        const filePath = path.join(buildPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const dom = htmlparser2.parseDocument(content);
        
        const checkResult = this.htmlChecker.check(dom);
        results.push({
          file,
          ...checkResult
        });
      } catch (error) {
        results.push({
          file,
          errors: [`Failed to process file: ${error.message}`],
          warnings: []
        });
      }
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
    const { minLines, maxLineLength } = this.config.minification;
    return content.split('\n').length < minLines || content.length / content.split('\n').length > maxLineLength;
  }

  async checkCssFiles(baseDir, buildPath) {
    const cssFiles = fs.readdirSync(buildPath).filter(file => path.extname(file).toLowerCase() === '.css');
    const results = [];

    for (const file of cssFiles) {
      const filePath = path.join(buildPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const result = {
        file,
        prefixCheck: await this.checkCssPrefixes(baseDir, content),
        isMinified: this.isCssMinified(content)
      };
      results.push(result);
    }

    return results;
  }

  async checkCssPrefixes(baseDir, css) {
    const browsers = browserslist.loadConfig({ path: baseDir });
    const prefixer = postcss([autoprefixer({ overrideBrowserslist: browsers })]);
    const result = await prefixer.process(css, { from: undefined });
    return {
      missingPrefixes: result.warnings().length > 0,
      warnings: result.warnings().map(warning => warning.text)
    };
  }

  isCssMinified(content) {
    const { minLines, maxLineLength } = this.config.minification;
    return content.split('\n').length < minLines || content.length / content.split('\n').length > maxLineLength;
  }
}

module.exports = BuildCheckPlugin;
