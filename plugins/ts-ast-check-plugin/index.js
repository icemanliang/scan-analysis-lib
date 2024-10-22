const ts = require('typescript');
const path = require('path');
const fs = require('fs');
const glob = require('fast-glob');

class TsAstCheckPlugin {
  constructor(options = {}) {
    this.name = 'TsAstCheckPlugin';
    this.options = {
      scanDirs: ['./src'],  // 默认扫描当前目录
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],  // 默认忽略的目录
      ...options
    };
  }

  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('TsAstCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting TypeScript AST check...');

        const results = {
          generatorFunctions: [],
          classComponents: [],
          functionComponents: [],
        };

        const files = await this.getAllFiles(context.root);
        files.forEach(file => {
          const sourceFile = this.createSourceFile(file);
          if (sourceFile) {
            this.analyzeFile(sourceFile, results);
          }
        });

        context.scanResults.tsAst = results;
        context.logger.log('info', `TypeScript AST check completed. Found ${results.generatorFunctions.length} generator functions, ${results.classComponents.length} class components, and ${results.functionComponents.length} function components.`);
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

  analyzeFile(sourceFile, results) {
    ts.forEachChild(sourceFile, node => this.visitNode(node, sourceFile, results));
  }

  visitNode(node, sourceFile, results) {
    if (ts.isFunctionDeclaration(node) && node.asteriskToken) {
      this.recordGeneratorFunction(node, sourceFile, results);
    } else if (ts.isClassDeclaration(node) && this.isClassComponent(node)) {
      this.recordClassComponent(node, sourceFile, results);
    } else if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
      if (this.isFunctionComponent(node)) {
        this.recordFunctionComponent(node, sourceFile, results);
      }
    }

    ts.forEachChild(node, child => this.visitNode(child, sourceFile, results));
  }

  isClassComponent(node) {
    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          const baseType = clause.types[0];
          if (baseType && baseType.expression && baseType.expression.escapedText === 'React.Component') {
            return true;
          }
        }
      }
    }
    return false;
  }

  isFunctionComponent(node) {
    let usesHooks = false;
    let returnsJSX = false;

    // 检查是否使用了 React Hooks
    ts.forEachChild(node, child => {
      if (ts.isCallExpression(child) && child.expression.getText().startsWith('use')) {
        usesHooks = true;
      }
    });

    // 检查是否返回 JSX
    if (node.body && ts.isBlock(node.body)) {
      const returnStatement = node.body.statements.find(stmt => ts.isReturnStatement(stmt));
      if (returnStatement && returnStatement.expression) {
        returnsJSX = this.isJSXElement(returnStatement.expression);
      }
    } else if (node.body && this.isJSXElement(node.body)) {
      returnsJSX = true;
    }

    return usesHooks || returnsJSX;
  }

  isJSXElement(node) {
    return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
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

  recordFunctionComponent(node, sourceFile, results) {
    results.functionComponents.push({
      file: sourceFile.fileName,
      name: node.name ? node.name.text : (node.parent && ts.isVariableDeclaration(node.parent) ? node.parent.name.text : 'anonymous'),
      line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
    });
  }
}

module.exports = TsAstCheckPlugin;
