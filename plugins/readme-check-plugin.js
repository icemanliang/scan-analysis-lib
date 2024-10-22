class ReadmeCheckPlugin {
    constructor() {
      this.name = 'ReadmeCheckPlugin';
    }
    apply(scanner) {
      scanner.hooks.afterScan.tapPromise('ReadmeCheckPlugin', (context) => {
        return new Promise((resolve, reject) => {
          try {
            const fs = require('fs');
            const path = require('path');
            const readmePath = path.join(context.root, 'README.md');
        
            if (!fs.existsSync(readmePath)) {
              const errorMsg = 'README.md 文件不存在';
              context.scanResults.readme = { compliant: false, message: errorMsg };
              context.logger.log('warn', errorMsg);
              resolve();
              return;
            }
        
            const content = fs.readFileSync(readmePath, 'utf-8');
            
            const requiredSections = ['# 项目介绍', '# 安装', '# 使用方法'];
        
            let compliant = true;
            let missingSections = [];
            
            requiredSections.forEach(section => {
              if (!content.includes(section)) {
                const errorMsg = `README.md 文件缺少 ${section} 部分`;
                missingSections.push(section);
                compliant = false;
                context.logger.log('warn', errorMsg);
              }
            });
        
            if (compliant) {
              context.logger.log('info', 'README.md 文件结构合规');
            }
        
            context.scanResults.readme = { compliant, missingSections };
            resolve();
          } catch(error) {
            context.scanResults.readme = null;
            context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
            resolve();
          }
        });
      });
    }
  }
  
  module.exports = ReadmeCheckPlugin;  
