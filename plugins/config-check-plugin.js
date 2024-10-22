class ConfigCheckPlugin {
    constructor() {
      this.name = 'ConfigCheckPlugin';
    }
    apply(scanner) {
      scanner.hooks.afterScan.tapPromise('ConfigCheckPlugin', (context) => {
        return new Promise((resolve, reject) => {
          try {
            const fs = require('fs');
            const path = require('path');
            const npmrcPath = path.join(context.root, '.npmrc');
      
            if (!fs.existsSync(npmrcPath)) {
              const errorMsg = '.npmrc 文件不存在';
              context.scanResults.npmrc = { compliant: false, message: errorMsg };
              context.logger.log('warn', errorMsg);
              resolve();
              return;
            }
      
            const content = fs.readFileSync(npmrcPath, 'utf-8');
            
            const requiredConfig = 'registry=https://registry.npmjs.org/';
            
            let compliant = true;
      
            if (!content.includes(requiredConfig)) {
              const errorMsg = `.npmrc 文件缺少必要的配置项: ${requiredConfig}`;
              context.logger.log('warn', errorMsg);
              compliant = false;
            }
      
            if (compliant) {
              context.logger.log('info', '.npmrc 文件内容合规');
            }
            
            context.scanResults.npmrc = { compliant, requiredConfig: !compliant ? requiredConfig : undefined };
            resolve();
          } catch(error) {
            context.scanResults.npmrc = null;
            context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
            resolve();
          }
        });
      });
    }
  }
  
  module.exports = ConfigCheckPlugin;
