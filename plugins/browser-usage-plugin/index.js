const fs = require('fs');
const path = require('path');
const fastGlob = require('fast-glob');
const ts = require('typescript');

class BrowserUsagePlugin {
  constructor(options = {}) {
    this.name = 'BrowserUsagePlugin';
    this.domApis = {};
    this.bomApis = {};
    this.options = {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts'],
      ...options
    };
  }

  isDOM(objectName) {
    return (objectName === 'document' || objectName === 'window');
  }

  isBOM(objectName) {
    return ['window', 'navigator', 'screen', 'history'].includes(objectName);
  }

  addApiUsage(apis, apiName, filePath, line) {
    if (!apis[apiName]) {
      apis[apiName] = [];
    }
    apis[apiName].push({ file: filePath, line });
  }

  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const visit = (node) => {
      if (ts.isPropertyAccessExpression(node)) {
        const objectName = node.expression.getText(sourceFile);
        const propertyName = node.name.getText(sourceFile);
        const apiName = `${objectName}.${propertyName}`;
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

        if (this.isDOM(objectName)) {
          this.addApiUsage(this.domApis, apiName, filePath, line);
        } else if (this.isBOM(objectName)) {
          this.addApiUsage(this.bomApis, apiName, filePath, line);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('BrowserUsagePlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting DOM/BOM usage analysis...');

        const files = await fastGlob('**/*.{js,jsx,ts,tsx}', {
          cwd: context.root,
          ignore: this.options.ignore,
          absolute: true
        });

        const analyzedFiles = [];
        const failedFiles = [];

        files.forEach((file) => {
          try {
            this.analyzeFile(file);
            analyzedFiles.push(file);
          } catch (error) {
            failedFiles.push({ file, error: error.message });
            context.logger.log('error', `Failed to analyze file ${file}: ${error.message}`);
          }
        });

        const domApiCount = Object.keys(this.domApis).length;
        const bomApiCount = Object.keys(this.bomApis).length;
        const totalUsageCount = Object.values(this.domApis).concat(Object.values(this.bomApis))
          .reduce((sum, usages) => sum + usages.length, 0);

        context.scanResults.browserUsage = {
          domApis: this.domApis,
          bomApis: this.bomApis,
          summary: {
            domApiCount,
            bomApiCount,
            totalUsageCount,
            analyzedFilesCount: analyzedFiles.length,
            failedFilesCount: failedFiles.length,
          },
          failedFiles,
        };

        context.logger.log('info', 'DOM/BOM usage analysis completed.');
        context.logger.log('info', `Found ${domApiCount} unique DOM APIs and ${bomApiCount} unique BOM APIs.`);
        context.logger.log('info', `Total usage count: ${totalUsageCount}`);
        context.logger.log('info', `Analyzed ${analyzedFiles.length} files, failed to analyze ${failedFiles.length} files.`);
      } catch (error) {
        context.scanResults.browserUsage = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
        console.error('Full error:', error);
      }
    });
  }
}

module.exports = BrowserUsagePlugin;
