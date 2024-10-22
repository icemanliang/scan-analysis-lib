const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');

class EjsCheckPlugin {
  constructor() {
    this.name = 'EjsCheckPlugin';
  }
  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('EjsCheckPlugin', (context) => {
      return new Promise((resolve, reject) => {
        try {
          context.logger.log('info', 'Starting EJS check...');
          const ejsFiles = fg.sync('**/*.ejs', { cwd: context.root, absolute: true });
          
          const results = {
            totalFiles: ejsFiles.length,
            filesWithIssues: []
          };

          ejsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const issues = this.checkEjsContent(content);
            if (issues.length > 0) {
              results.filesWithIssues.push({
                file: path.relative(context.root, file),
                issues
              });
            }
          });

          context.scanResults.ejs = results;
          context.logger.log('info', `EJS check completed. Found issues in ${results.filesWithIssues.length} out of ${results.totalFiles} files.`);
          resolve();
        } catch(error) {
          context.scanResults.ejs = null;
          context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
          resolve();
        }
      });
    });
  }

  checkEjsContent(content) {
    const issues = [];
    // 检查未闭合的 EJS 标签
    const openTags = (content.match(/<%(?!%)/g) || []).length;
    const closeTags = (content.match(/%>/g) || []).length;
    if (openTags !== closeTags) {
      issues.push('Unmatched EJS tags');
    }
    
    // 检查潜在的 XSS 漏洞
    if (content.includes('<%-')) {
      issues.push('Potential XSS vulnerability: unescaped output');
    }
    
    return issues;
  }
}

module.exports = EjsCheckPlugin;
