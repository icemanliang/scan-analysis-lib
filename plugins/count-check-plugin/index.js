const ts = require('typescript');
const path = require('path');
const fs = require('fs');
const glob = require('fast-glob');
const defaultConfig = require('./config');

class CountCheckPlugin {
  constructor(config = {}) {
    this.name = 'CountCheckPlugin';
    
    // 合并配置
    this.config = {
      ...defaultConfig,
      ...config
    };

    // 基础目录
    this.baseDir = '';
  }

  // 初始化结果对象
  initResults() {
    return {
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
    scanner.hooks.code.tapPromise('CountCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'start count check...');
        this.baseDir = context.baseDir;

        // 初始化结果对象
        const results = this.initResults();

        const files = await this.getAllFiles(context.baseDir, context.codeDir);
        files.forEach(file => {
          const sourceFile = this.createSourceFile(file);
          if (sourceFile) {
            this.analyzeFile(sourceFile, results);
          }
        });

        context.scanResults.countInfo = this.formatResults(results);
        
        this.logResults(context, results);
      } catch (error) {
        context.scanResults.countInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.message}`);
      }
    });
  }

  logResults(context, results) {
    context.logger.log('info', 
      `total ${results.generatorFunctions.length} generator functions, ` +
      `${results.classComponents.length} class components, ` +
      `${Object.keys(results.domApis).length} dom apis, and ` +
      `${Object.keys(results.bomApis).length} bom apis.`
    );
    context.logger.log('info',
      `total ${results.functionStats.total} functions, ` +
      `including ${results.functionStats.hooks} hook functions. ` +
      `${results.functionStats.missingTypes} functions missing type declarations.`
    );
  }

  async getAllFiles(baseDir, codeDir) {
    const patterns = path.join(baseDir, codeDir, '**/*.{js,jsx,ts,tsx}');
    return glob(patterns, {
      ignore: this.config.ignore.patterns,
      absolute: true,
    });
  }

  analyzeFile(sourceFile, results) {
    const isTypeScriptFile = sourceFile.fileName.endsWith('.ts') || sourceFile.fileName.endsWith('.tsx');
    ts.forEachChild(sourceFile, node => this.visitNode(node, sourceFile, isTypeScriptFile, results));
  }

  visitNode(node, sourceFile, isTypeScriptFile, results) {
    if (ts.isFunctionDeclaration(node)) {
      if (isTypeScriptFile) {
        this.checkFunctionDeclaration(node, sourceFile, results);
      }
      if (node.asteriskToken) {
        this.recordGeneratorFunction(node, sourceFile, results);
      }
    } else if (ts.isClassDeclaration(node) && this.isClassComponent(node)) {
      this.recordClassComponent(node, sourceFile, results);
    } else if (ts.isPropertyAccessExpression(node)) {
      this.checkBrowserAPI(node, sourceFile, results);
    }

    ts.forEachChild(node, child => this.visitNode(child, sourceFile, isTypeScriptFile, results));
  }

  checkFunctionDeclaration(node, sourceFile, results) {
    const name = node.name ? node.name.getText() : 'anonymous';
    
    results.functionStats.total++;

    // 检查是否为 Hook 函数
    if (name.startsWith(this.config.function.hookPrefix)) {
      results.functionStats.hooks++;
      if (this.config.function.skipHookTypeCheck) return;
    }

    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    const hasValidParameterTypes = node.parameters.every(p => p.type && p.type.kind !== ts.SyntaxKind.AnyKeyword);
    const hasValidReturnType = node.type && node.type.kind !== ts.SyntaxKind.AnyKeyword;

    if (!hasValidParameterTypes || !hasValidReturnType) {
      results.functionStats.missingTypes++;
      results.functionStats.functionsWithMissingTypes.push({
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
    let hasRequiredMethods = false;

    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          const baseType = clause.types[0];
          if (baseType && baseType.expression) {
            const expressionText = baseType.expression.getText();
            extendsReactComponent = this.config.react.componentBaseClasses.includes(expressionText);
          }
        }
      }
    }

    if (node.members) {
      hasRequiredMethods = this.config.react.requiredMethods.every(methodName => {
        return node.members.some(member => 
          ts.isMethodDeclaration(member) && 
          member.name && 
          member.name.getText() === methodName
        );
      });
    }

    return extendsReactComponent && hasRequiredMethods;
  }

  checkBrowserAPI(node, sourceFile, results) {
    const objectName = node.expression.getText();
    const propertyName = node.name.getText();
    const apiName = `${objectName}.${propertyName}`;
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

    if (this.config.api.dom.includes(objectName)) {
      this.addApiUsage(results.domApis, apiName, sourceFile.fileName, line);
    } else if (this.config.api.bom.includes(objectName)) {
      this.addApiUsage(results.bomApis, apiName, sourceFile.fileName, line);
    }
  }

  formatFilePath(fullPath) {
    return path.relative(this.baseDir, fullPath);
  }

  formatResults(results) {
    const formatItem = item => ({
      ...item,
      file: this.formatFilePath(item.file)
    });

    const formatArray = array => array.map(formatItem);

    const formatApiMap = apiMap => {
      const newMap = {};
      Object.entries(apiMap).forEach(([key, value]) => {
        newMap[key] = formatArray(value);
      });
      return newMap;
    };

    return {
      ...results,
      generatorFunctions: formatArray(results.generatorFunctions),
      classComponents: formatArray(results.classComponents),
      domApis: formatApiMap(results.domApis),
      bomApis: formatApiMap(results.bomApis),
      functionStats: {
        ...results.functionStats,
        functionsWithMissingTypes: formatArray(results.functionStats.functionsWithMissingTypes)
      }
    };
  }

  createSourceFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  }

  addApiUsage(apis, apiName, filePath, line) {
    if (!apis[apiName]) {
      apis[apiName] = [];
    }
    apis[apiName].push({ file: filePath, line });
  }

  recordGeneratorFunction(node, sourceFile, results) {
    results.generatorFunctions.push({
      file: sourceFile.fileName,
      name: node.name ? node.name.text : 'anonymous',
      line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
    });
  }

  recordClassComponent(node, sourceFile, results) {
    results.classComponents.push({
      file: sourceFile.fileName,
      name: node.name ? node.name.text : 'anonymous',
      line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
    });
  }
}

module.exports = CountCheckPlugin;
