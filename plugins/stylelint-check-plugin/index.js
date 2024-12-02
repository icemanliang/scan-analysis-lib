const stylelint = require('stylelint');
const glob = require('fast-glob');
const defaultConfig = require('./config');
const { formatResults, analyzeResults } = require('./util');
const moment = require('moment');

class StylelintCheckPlugin {
  constructor(config = {}) {
    this.name = 'StylelintCheckPlugin';       // 插件名称
    this.devMode = false;                      // 是否开启调试模式
    this.config = {                           // 插件配置
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

  // 检查文件
  async checkFiles(pattern, config, context) {
    const files = await glob(pattern, {
      cwd: context.baseDir,
      absolute: true,
      ...this.config.glob
    });

    if (files.length === 0) {
      return null;
    }

    return stylelint.lint({
      files,
      config
    });
  }

  // 注册插件
  async apply(scanner) {
    scanner.hooks.code.tapPromise(this.name, async (context) => {
      // this.devLog('config check', this.config);
      try {
        context.logger.log('info', 'start stylelint check...');
        const startTime = Date.now();
        
        const baseConfig = {
          rules: this.config.stylelint.rules
        };

        let allResults = [];
        let totalFilesCount = 0;

        for (const { pattern, syntax } of this.config.files) {
          const config = syntax 
            ? { ...baseConfig, customSyntax: syntax }
            : baseConfig;

          const result = await this.checkFiles(pattern, config, context);
          if (!result) continue;

          allResults = allResults.concat(result.results);
          totalFilesCount += result.results.length;
        }
        this.devLog('allResults', allResults);

        // 格式化结果
        const formattedResults = formatResults(allResults, context.baseDir);
        const analysis = analyzeResults(allResults);

        context.scanResults.stylelintInfo = {
          totalFilesCount,
          ...formattedResults,
          ...analysis
        };

        const { errorCount, errorRuleCount } = context.scanResults.stylelintInfo;
        context.logger.log('info', `total found ${errorCount} errors from ${errorRuleCount} rules.`);
        context.logger.log('info', `stylelint check completed, time: ${Date.now() - startTime} ms`);

      } catch(error) {
        context.scanResults.stylelintInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.stack}`);
      }
    });
  }
}

module.exports = StylelintCheckPlugin;