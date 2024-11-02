const stylelint = require('stylelint');
const glob = require('fast-glob');
const defaultConfig = require('./config');
const { formatResults, analyzeResults } = require('./util');

class StylelintCheckPlugin {
  constructor(config = {}) {
    this.name = 'StylelintCheckPlugin';
    
    // 合并配置
    this.config = {
      ...defaultConfig,
      ...config
    };
  }

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

  async apply(scanner) {
    scanner.hooks.code.tapPromise('StylelintCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting Stylelint check...');
        
        const baseConfig = {
          rules: this.config.stylelint.rules
        };

        let allResults = [];

        for (const { pattern, syntax } of this.config.files) {
          const config = syntax 
            ? { ...baseConfig, customSyntax: syntax }
            : baseConfig;

          const result = await this.checkFiles(pattern, config, context);
          if (!result) continue;

          allResults = allResults.concat(result.results);
        }

        // 格式化结果
        const formattedResults = formatResults(allResults, context.baseDir);
        const analysis = analyzeResults(allResults);

        context.scanResults.stylelintInfo = {
          ...formattedResults,
          ...analysis
        };

        const { errorCount, errorRuleCount } = context.scanResults.stylelintInfo;
        context.logger.log('info', 
          `Stylelint check completed. Found ${errorCount} errors from ${errorRuleCount} rules.`
        );

      } catch(error) {
        context.scanResults.stylelintInfo = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
        console.error('Full error:', error);
      }
    });
  }
}

module.exports = StylelintCheckPlugin;