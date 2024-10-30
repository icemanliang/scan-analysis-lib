const stylelint = require('stylelint');
const path = require('path');
const glob = require('fast-glob');

class StylelintCheckPlugin {
  constructor() {
    this.name = 'StylelintCheckPlugin';
  }

  async checkFiles(pattern, config, context) {
    const files = await glob(pattern, {
      cwd: context.root,
      absolute: true,
      followSymbolicLinks: false,
      deep: 5
    });

    if (files.length === 0) {
      return null;
    }

    return stylelint.lint({
      files,
      config,
      maxWarnings: 1000
    });
  }

  async apply(scanner) {
    scanner.hooks.afterScan.tapPromise('StylelintCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting Stylelint check...');
        
        const baseConfig = {
          rules: {
            'max-nesting-depth': 5,
            'selector-max-id': 0,
            'selector-class-pattern': '^[a-z][a-zA-Z0-9]+$',
            'declaration-block-single-line-max-declarations': 1,
            'color-hex-case': 'lower'
          }
        };

        const fileConfigs = [
          { pattern: 'src/**/*.less', syntax: 'postcss-less' },
          { pattern: 'src/**/*.scss', syntax: 'postcss-scss' },
          { pattern: 'src/**/*.css', syntax: null },
          { pattern: 'src/**/*.vue', syntax: 'postcss-html' }
        ];

        const stats = {
          deepNestingCount: 0,
          idSelectorsCount: 0,
          invalidClassNamesCount: 0,
          multiLineDeclarationsCount: 0,
          uppercaseColorsCount: 0
        };

        let totalResults = [];
        let totalErrorCount = 0;
        let totalWarningCount = 0;

        for (const { pattern, syntax } of fileConfigs) {
          const config = syntax 
            ? { ...baseConfig, customSyntax: syntax }
            : baseConfig;

          const result = await this.checkFiles(pattern, config, context);
          if (!result) continue;

          const limitedResults = result.results.slice(0, 1000);
          this.processResults(limitedResults, stats);

          totalResults = totalResults.concat(limitedResults);
          totalErrorCount += result.errored ? Math.min(result.results.length, 1000) : 0;
          totalWarningCount += Math.min(
            result.results.reduce((sum, res) => sum + res.warnings.length, 0),
            1000 * 100
          );
        }

        context.scanResults.stylelintInfo = {
          errorCount: totalErrorCount,
          warningCount: totalWarningCount,
          stats,
          results: totalResults.slice(0, 1000)
        };

        context.logger.log('info', `Stylelint check completed. Found ${totalErrorCount} errors and ${totalWarningCount} warnings.`);

      } catch(error) {
        context.scanResults.stylelintInfo = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
        console.error('Full error:', error);
      }
    });
  }

  processResults(results, stats) {
    results.forEach(fileResult => {
      const warnings = fileResult.warnings.slice(0, 100);
      warnings.forEach(warning => {
        switch(warning.rule) {
          case 'max-nesting-depth':
            stats.deepNestingCount++;
            break;
          case 'selector-max-id':
            stats.idSelectorsCount++;
            break;
          case 'selector-class-pattern':
            stats.invalidClassNamesCount++;
            break;
          case 'declaration-block-single-line-max-declarations':
            stats.multiLineDeclarationsCount++;
            break;
          case 'color-hex-case':
            stats.uppercaseColorsCount++;
            break;
        }
      });
    });
  }
}

module.exports = StylelintCheckPlugin;