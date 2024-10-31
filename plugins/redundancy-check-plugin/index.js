const { detectClones } = require('jscpd');
const path = require('path');
const fs = require('fs');

class RedundancyCheckPlugin {
  constructor(config = {}) {
    this.name = 'RedundancyCheckPlugin';
    this.config = config;
  }

  apply(scanner) {
    scanner.hooks.code.tapPromise('RedundancyCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting redundancy check...');

        
        console.log('context.root', context);
        const srcPath = path.resolve(context.root, './src');
        
        // 确保 srcPath 存在
        if (!fs.existsSync(srcPath)) {
          throw new Error(`Source directory not found: ${srcPath}`);
        }

        const options = {
          path: [srcPath],  // 使用 context.root 作为扫描路径
          ignore: [
            '**/node_modules/**/*',
            '**/dist/**',
            '**/build/**',
            '**/public/**',
            '**/vendor/**'
          ],
          format: ['javascript', 'typescript'],
          minLines: 10,
          maxLines: 1000,
          silent: true,
          output: false,
          absolute: true,
          ...this.config  // 合并用户提供的配置
        };

        context.logger.log('info', `Checking redundancy in: ${options.path.join(', ')}`);
        console.log('jscpd options:', JSON.stringify(options, null, 2));
        const result = await detectClones(options);

        context.logger.log('info', 'Redundancy check completed.');
        context.scanResults.redundancyInfo = { statistic: result };
      } catch(error) {
        context.scanResults.redundancyInfo = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
        console.error('Full error:', error);
      }
    });
  }
}

module.exports = RedundancyCheckPlugin;
