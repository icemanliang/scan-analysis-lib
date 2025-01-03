const { Detector, MemoryStore, mild } = require('@jscpd/core');
const { Tokenizer } = require('@jscpd/tokenizer');
const path = require('path');
const glob = require('fast-glob');
const fs = require('fs');
const defaultConfig = require('./config');
const moment = require('moment');
const { groupClonesByContent } = require('./util');

class RedundancyCheckPlugin {
  constructor(config = {}) {
    this.name = 'RedundancyCheckPlugin';       // 插件名称  
    this.devMode = false;                      // 是否开启调试模式
    this.config = {
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
  
  // 重复代码检测
  async detectRedundancy(context, config) {
    const srcPath = path.resolve(context.baseDir, context.codeDir);

    const files = glob.sync(config.files.patterns, {
      cwd: srcPath,
      ignore: config.files.ignore,
      absolute: true
    });
    // this.devLog('files count', files.length);

    // 检查文件数量是否超过限制，如果超过则跳过检测，返回null，防止内存溢出
    if(files.length > config.maxFilesLimit) {
      context.logger.log('warn', `max files limit: ${config.maxFilesLimit}, actual: ${files.length}`);
      context.scanResults.redundancyInfo = null;
      return;
    }
    // this.devLog('check directory', srcPath);

    // 创建必要的实例
    const tokenizer = new Tokenizer();
    const store = new MemoryStore();
    const detector = new Detector(
      tokenizer,
      store,
      [], // cloneValidators
      {
        minLines: config.minLines,
        minTokens: config.minTokens,
        mode: mild
      }
    );

    // 获取文件格式, 映射文件扩展名到 tokenizer 支持的格式
    const getFormat = (filename) => {
      const ext = path.extname(filename).slice(1);
      const formatMap = {
        'js': 'javascript',
        'ts': 'typescript',
        'jsx': 'jsx',
        'tsx': 'tsx'
      };
      return formatMap[ext] || ext;
    };

    // 检测重复代码
    const clones = [];
    for (let i = 0; i < files.length; i++) {
      const fileA = files[i];
      const contentA = fs.readFileSync(fileA, 'utf8');
      const format = getFormat(fileA);

      const result = await detector.detect(fileA, contentA, format);
      if (result.length > 0) {
        clones.push(...result);
      }
    }

    return {
      filesCount: files.length,
      clones: clones
    };
  }

  // 注册插件
  apply(scanner) {
    scanner.hooks.code.tapPromise(this.name, async (context) => {
      // this.devLog('config check', this.config);
      try {
        context.logger.log('info', 'start redundancy check...');
        const startTime = Date.now();
        const { filesCount: jsFilesCount, clones: jsClones } = await this.detectRedundancy(context, this.config.jsCheck);
        const { filesCount: jsxFilesCount, clones: jsxClones } = await this.detectRedundancy(context, this.config.jsxCheck);
        const filesCount = jsFilesCount + jsxFilesCount;
        const clones = [...jsClones, ...jsxClones];
        // this.devLog('clones', clones);

        // 对克隆进行分组和处理
        const groupedClones = groupClonesByContent(clones, context.baseDir);
        
        context.scanResults.redundancyInfo = {
          total: filesCount,
          duplicates: groupedClones.length,
          files: new Set(clones.flatMap(c => [
            c.duplicationA.sourceId, 
            c.duplicationB.sourceId
          ])).size,
          clones: groupedClones
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
