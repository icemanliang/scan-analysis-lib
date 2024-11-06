const { Detector, MemoryStore, mild } = require('@jscpd/core');
const { Tokenizer } = require('@jscpd/tokenizer');
const path = require('path');
const glob = require('fast-glob');
const fs = require('fs');
const defaultConfig = require('./config');
const moment = require('moment');

class RedundancyCheckPlugin {
  constructor(config = {}) {
    this.name = 'RedundancyCheckPlugin';       // 插件名称  
    this.devMode = false;                      // 是否开启调试模式
    this.config = {                            // 插件配置
      detection: {
        ...defaultConfig.detection,
        ...config.detection
      },
      files: {
        ...defaultConfig.files,
        ...config.files
      }
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
    scanner.hooks.code.tapPromise(this.name, async (context) => {
      try {
        context.logger.log('info', 'start redundancy check...');
        const startTime = Date.now();

        const srcPath = path.resolve(context.baseDir, context.codeDir);
        const files = glob.sync(this.config.files.patterns, {
          cwd: srcPath,
          ignore: this.config.files.ignore,
          absolute: true
        });

        context.logger.log('info', `check directory: ${srcPath}`);

        // 创建必要的实例
        const tokenizer = new Tokenizer();
        const store = new MemoryStore();
        const detector = new Detector(
          tokenizer,
          store,
          [], // cloneValidators
          {
            minLines: this.config.detection.minLines,
            minTokens: this.config.detection.minTokens,
            mode: mild
          }
        );

        // 检测重复代码
        const clones = [];
        for (let i = 0; i < files.length; i++) {
          const fileA = files[i];
          const contentA = fs.readFileSync(fileA, 'utf8');
          const format = path.extname(fileA).slice(1);

          const result = await detector.detect(fileA, contentA, format);
          if (result.length > 0) {
            clones.push(...result);
          }
        }
        this.devLog('clones', clones);

        context.scanResults.redundancyInfo = {
          statistic: {
            total: files.length,
            duplicates: clones.length,
            files: new Set(clones.flatMap(c => [
              c.duplicationA.sourceId, 
              c.duplicationB.sourceId
            ])).size,
            clones: clones.map(clone => ({
              firstFile: {
                name: path.relative(context.baseDir, clone.duplicationA.sourceId),
                startLine: clone.duplicationA.start.line,
                endLine: clone.duplicationA.end.line
              },
              secondFile: {
                name: path.relative(context.baseDir, clone.duplicationB.sourceId),
                startLine: clone.duplicationB.start.line,
                endLine: clone.duplicationB.end.line
              },
              lines: clone.duplicationA.end.line - clone.duplicationA.start.line,
              tokens: clone.duplicationA.range.length
            }))
          }
        };
        context.logger.log('info', `redundancy check completed, time: ${Date.now() - startTime} ms`);
      } catch(error) {
        context.scanResults.redundancyInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.stack}`);
      }
    });
  }
}

module.exports = RedundancyCheckPlugin;
