const ts = require('typescript');
const path = require('path');
const fs = require('fs');
const glob = require('fast-glob');

class CountCheckPlugin {
  constructor(options = {}) {
    this.name = 'CountCheckPlugin';
    this.options = {
      scanDirs: ['./src'],  // 默认扫描当前目录
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],  // 默认忽略的目录
      ...options
    };
    this.results = {
      generatorFunctions: [],
      classComponents: [],
      domApis: {},
      bomApis: {},
      functionStats: {
        total: 0,
        hooks: 0,
        missingTypes: 0,
        functionsWithMissingTypes: []
      }
    };
  }

  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('CountCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting TypeScript/JavaScript AST check...');

        const files = await this.getAllFiles(context.root);
        files.forEach(file => {
          const sourceFile = this.createSourceFile(file);
          if (sourceFile) {
            this.analyzeFile(sourceFile);
          }
        });

        context.scanResults.tsAst = this.results;
        context.logger.log('info', `AST check completed. Found ${this.results.generatorFunctions.length} generator functions, ${this.results.classComponents.length} class components, ${Object.keys(this.results.domApis).length} DOM APIs, and ${Object.keys(this.results.bomApis).length} BOM APIs.`);
        context.logger.log('info', `In TypeScript files: Found ${this.results.functionStats.total} functions in total, including ${this.results.functionStats.hooks} Hook functions. ${this.results.functionStats.missingTypes} functions have missing type declarations.`);
      } catch (error) {
        context.scanResults.tsAst = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
      }
    });
  }

  async getAllFiles(rootDir) {
    const patterns = this.options.scanDirs.map(dir => path.join(rootDir, dir, '**/*.{js,jsx,ts,tsx}'));
    return glob(patterns, {
      ignore: this.options.ignore,
      absolute: true,
    });
  }

  createSourceFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  }

  analyzeFile(sourceFile) {
    const isTypeScriptFile = sourceFile.fileName.endsWith('.ts') || sourceFile.fileName.endsWith('.tsx');
    ts.forEachChild(sourceFile, node => this.visitNode(node, sourceFile, isTypeScriptFile));
  }

  visitNode(node, sourceFile, isTypeScriptFile) {
    if (ts.isFunctionDeclaration(node)) {
      if (isTypeScriptFile) {
        this.checkFunctionDeclaration(node, sourceFile);
      }
      if (node.asteriskToken) {
        this.recordGeneratorFunction(node, sourceFile);
      }
    } else if (ts.isClassDeclaration(node) && this.isClassComponent(node)) {
      this.recordClassComponent(node, sourceFile);
    } else if (ts.isPropertyAccessExpression(node)) {
      this.checkBrowserAPI(node, sourceFile);
    }

    ts.forEachChild(node, child => this.visitNode(child, sourceFile, isTypeScriptFile));
  }

  checkFunctionDeclaration(node, sourceFile) {
    const name = node.name ? node.name.getText() : 'anonymous';
    
    this.results.functionStats.total++;

    // 检查函数名是否以 'use' 开头（Hook 函数）
    if (name.startsWith('use')) {
      this.results.functionStats.hooks++;
      return; // 跳过 Hook 函数的类型检查
    }

    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    const hasValidParameterTypes = node.parameters.every(p => p.type && p.type.kind !== ts.SyntaxKind.AnyKeyword);
    const hasValidReturnType = node.type && node.type.kind !== ts.SyntaxKind.AnyKeyword;

    if (!hasValidParameterTypes || !hasValidReturnType) {
      this.results.functionStats.missingTypes++;
      this.results.functionStats.functionsWithMissingTypes.push({
        name,
        file: sourceFile.fileName,
        line,
        hasParameterTypes: hasValidParameterTypes,
        hasReturnType: hasValidReturnType
      });
    }
  }

  isClassComponent(node) {
    let extendsReactComponent = false;
    let hasRenderMethod = false;

    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          const baseType = clause.types[0];
          if (baseType && baseType.expression) {
            const expressionText = baseType.expression.getText();
            extendsReactComponent = expressionText === 'React.Component' || expressionText === 'Component';
          }
        }
      }
    }

    if (node.members) {
      for (const member of node.members) {
        if (ts.isMethodDeclaration(member) && member.name && member.name.getText() === 'render') {
          hasRenderMethod = true;
          break;
        }
      }
    }

    return extendsReactComponent && hasRenderMethod;
  }

  checkBrowserAPI(node, sourceFile) {
    const objectName = node.expression.getText();
    const propertyName = node.name.getText();
    const apiName = `${objectName}.${propertyName}`;
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

    if (this.isDOM(objectName)) {
      this.addApiUsage(this.results.domApis, apiName, sourceFile.fileName, line);
    } else if (this.isBOM(objectName)) {
      this.addApiUsage(this.results.bomApis, apiName, sourceFile.fileName, line);
    }
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

  recordGeneratorFunction(node, sourceFile) {
    this.results.generatorFunctions.push({
      file: sourceFile.fileName,
      name: node.name ? node.name.text : 'anonymous',
      line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
    });
  }

  recordClassComponent(node, sourceFile) {
    this.results.classComponents.push({
      file: sourceFile.fileName,
      name: node.name ? node.name.text : 'anonymous',
      line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
    });
  }
}

module.exports = CountCheckPlugin;
