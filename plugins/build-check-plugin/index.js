const fs = require('fs');
const path = require('path');
const htmlparser2 = require('htmlparser2');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const browserslist = require('browserslist');
const defaultConfig = require('./config');
const HtmlChecker = require('./lib/html-checker');
const moment = require('moment');

class BuildCheckPlugin {
  constructor(config = {}) {
    this.name = 'BuildCheckPlugin';            // 插件名称
    this.devMode = false;                       // 是否开启调试模式
    this.config = {                            // 插件配置
      ...defaultConfig,
      ...config
    };
  }

  // 开发模式调试日志
  devLog(title, message) {
    if(this.devMode) {
      console.debug(moment().format('YYYY-MM-DD HH:mm:ss'), 'debug', `[${this.name}]`, title, message);
    }
  }

  // 注册插件
  apply(scanner) {
    scanner.hooks.project.tapPromise(this.name, async (context) => {
      // this.devLog('config check', this.config);
      if(context.buildDir === '') {
        context.logger.log('warn', 'build directory is not exists, skip build check.');
        context.scanResults.buildInfo = null;
        return;
      }
      try {
        context.logger.log('info', 'start build check...'); 
        const startTime = Date.now()
        
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

        context.logger.log('info', `build check completed, time: ${Date.now() - startTime} ms`);
      } catch (error) {
        context.scanResults.buildInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.stack}`);
      }
    });
  }

  // 分析目录
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
    this.devLog('stats', stats);
    return stats;
  }

  // 检查 HTML 文件
  async checkHtmlFiles(buildPath) {
    const htmlChecker = new HtmlChecker(this.config.html);   // HTML 检查器
    const htmlFiles = fs.readdirSync(buildPath).filter(file => path.extname(file).toLowerCase() === '.html');
    const results = [];

    for (const file of htmlFiles) {
      try {
        const filePath = path.join(buildPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const dom = htmlparser2.parseDocument(content);
        
        const checkResult = htmlChecker.check(dom);
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

    this.devLog('htmlChecks', results);
    return results;
  }

  // 检查 JS 文件
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

    this.devLog('jsChecks', results);
    return results;
  }

  // 检查 JS 文件是否压缩
  isMinified(content) {
    const { minLines, maxLineLength } = this.config.minification;
    return content.split('\n').length < minLines || content.length / content.split('\n').length > maxLineLength;
  }

  // 检查 CSS 文件
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

    this.devLog('cssChecks', results);
    return results;
  }

  // 检查 CSS 文件前缀
  async checkCssPrefixes(baseDir, css) {
    const browsers = browserslist.loadConfig({ path: baseDir });
    const prefixer = postcss([autoprefixer({ overrideBrowserslist: browsers })]);
    const result = await prefixer.process(css, { from: undefined });
    
    return {
      missingPrefixes: result.warnings().length > 0,
      warnings: result.warnings().map(warning => warning.text)
    };
  }

  // 检查 CSS 文件是否压缩
  isCssMinified(content) {
    const { minLines, maxLineLength } = this.config.minification;
    return content.split('\n').length < minLines || content.length / content.split('\n').length > maxLineLength;
  }
}

module.exports = BuildCheckPlugin;
