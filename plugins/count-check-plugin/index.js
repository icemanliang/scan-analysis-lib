const ts = require('typescript');
const path = require('path');
const fs = require('fs');
const glob = require('fast-glob');
const defaultConfig = require('./config');
const { formatResults } = require('./util');
const moment = require('moment');

class CountCheckPlugin {
  constructor(config = {}) {
    this.name = 'CountCheckPlugin';                  // 插件名称 
    this.devMode = false;                            // 是否开启调试模式  
    this.config = {                                  // 插件配置
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
      },
      tFunctionCheck: {
        total: 0,
        noParamCalls: [],
        runParamCalls: [],
        issues: []
      }
    };
  }

  // 注册插件
  apply(scanner) {
    scanner.hooks.code.tapPromise(this.name, async (context) => {
      try {
        context.logger.log('info', 'start count check...');
        const startTime = Date.now();

        // 初始化结果对象
        const results = this.initResults();
        const files = await this.getAllFiles(context.baseDir, context.codeDir);
        const totalFilesCount = files.length;
        files.forEach(file => {
          const sourceFile = this.createSourceFile(file);
          if (sourceFile) {
            this.analyzeFile(sourceFile, results);
          }
        });

        context.scanResults.countInfo = {
          ...formatResults(results, context.baseDir),
          totalFilesCount
        };      
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
        context.logger.log('info', `t function check: ${results.tFunctionCheck.total} calls, ${results.tFunctionCheck.issues.length} issues.`);
        context.logger.log('info', `count check completed, time: ${Date.now() - startTime} ms`);
      } catch (error) {
        context.scanResults.countInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.stack}`);
      }
    });
  }

  // 获取所有文件
  async getAllFiles(baseDir, codeDir) {
    const patterns = path.join(baseDir, codeDir, '**/*.{js,jsx,ts,tsx}');
    return glob(patterns, {
      ignore: this.config.ignore.patterns,
      absolute: true,
    });
  }

  // 分析文件
  analyzeFile(sourceFile, results) {
    const isTypeScriptFile = sourceFile.fileName.endsWith('.ts') || sourceFile.fileName.endsWith('.tsx');
    ts.forEachChild(sourceFile, node => this.visitNode(node, sourceFile, isTypeScriptFile, results));
  }

  // 访问节点
  visitNode(node, sourceFile, isTypeScriptFile, results) {
    if (ts.isFunctionDeclaration(node) ||           
        ts.isFunctionExpression(node) ||            
        ts.isArrowFunction(node) ||                 
        ts.isMethodDeclaration(node)) {             
      if (isTypeScriptFile && !ts.isArrowFunction(node)) { // 排除箭头函数
        this.checkFunctionDeclaration(node, sourceFile, results);
      }
      if (node.asteriskToken) {
        this.recordGeneratorFunction(node, sourceFile, results);
      }
    } else if (ts.isClassDeclaration(node) && this.isClassComponent(node)) {
      this.recordClassComponent(node, sourceFile, results);
    } else if (ts.isPropertyAccessExpression(node)) {
      this.checkBrowserAPI(node, sourceFile, results);
    } else if (ts.isCallExpression(node) && 
               ts.isIdentifier(node.expression) && 
               node.expression.text === 't') {
      this.checkTFunction(node, sourceFile, results);
    }

    ts.forEachChild(node, child => this.visitNode(child, sourceFile, isTypeScriptFile, results));
  }

  // 检查函数声明
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
    
    // 修改返回类型检查逻辑
    const hasValidReturnType = Boolean(
      node.type && (
        // 检查是否有显式的返回类型标注
        node.type.kind !== ts.SyntaxKind.AnyKeyword
        // 检查是否为 void 类型
        // node.type.kind !== ts.SyntaxKind.VoidKeyword
      )
    );

    // this.devLog('checkFunctionDeclaration', { 
    //   name,
    //   hasValidParameterTypes, 
    //   hasValidReturnType,
    // });

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

  // 检查类组件
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
    // this.devLog('isClassComponent', { extendsReactComponent, hasRequiredMethods });
    return extendsReactComponent && hasRequiredMethods;
  }

  // 检查浏览器 API
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

  // 创建源文件
  createSourceFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  }

  // 添加 API 使用
  addApiUsage(apis, apiName, filePath, line) {
    if (!apis[apiName]) {
      apis[apiName] = [];
    }
    apis[apiName].push({ file: filePath, line });
  }

  // 记录生成器函数
  recordGeneratorFunction(node, sourceFile, results) {
    results.generatorFunctions.push({
      file: sourceFile.fileName,
      name: node.name ? node.name.text : 'anonymous',
      line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
    });
    // this.devLog('recordGeneratorFunction', results.generatorFunctions);
  }

  // 记录类组件
  recordClassComponent(node, sourceFile, results) {
    results.classComponents.push({
      file: sourceFile.fileName,
      name: node.name ? node.name.text : 'anonymous',
      line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
    });
    // this.devLog('recordClassComponent', results.classComponents);
  }

  // 检查 t 函数调用
  checkTFunction(node, sourceFile, results) {
    // 总调用次数
    results.tFunctionCheck.total++;
    const args = node.arguments;
    // 无参数调用
    if (!args.length || !args[0]) {
      // this.devLog('checkTFunction', 'no arguments');
      results.tFunctionCheck.noParamCalls.push({
        file: sourceFile.fileName,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        reason: '无参数调用'
      });
      return;
    }
    // 动态参数调用
    const firstArg = args[0];
    if (!ts.isStringLiteral(firstArg)) {
      // this.devLog('checkTFunction', 'first argument is not a string literal');
      results.tFunctionCheck.runParamCalls.push({
        file: sourceFile.fileName,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        reason: '动态参数调用'
      });
      return;
    }

    const text = firstArg.text;
    const location = {
      file: sourceFile.fileName,
      line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
    };

    // 检查字符串长度
    if (text.length > 50) {
      results.tFunctionCheck.issues.push({
        ...location,
        reason: '字符串长度不能超过50'
      });
      return;
    }

    // 单参数时必须是纯中文
    if (args.length === 1) {
      if (!/^[\u4e00-\u9fa5]+$/.test(text)) {
        results.tFunctionCheck.issues.push({
          ...location,
          reason: '单参数调用只能包含中文'
        });
      }
      return;
    }

    // 多参数时检查占位符数量
    const placeholders = text.match(/\{(\d+)?\}/g) || [];
    if (placeholders.length !== args.length - 1) {
      results.tFunctionCheck.issues.push({
        ...location,
        reason: `占位符数量与参数数量不匹配`
      });
    }
  }
}

module.exports = CountCheckPlugin;
