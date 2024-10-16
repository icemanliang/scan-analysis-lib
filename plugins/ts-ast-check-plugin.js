const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');
const fs = require('fs');

class TsAstCheckPlugin {
  constructor() {
    this.name = 'TsAstCheckPlugin';
  }
  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('TsAstCheckPlugin', (context) => {
      return new Promise((resolve, reject) => {
        try {
          const project = new Project({
            tsConfigFilePath: path.join(context.root, 'tsconfig.json')
          });
    
          // Add all source files to the project
          project.addSourceFilesAtPaths(["src/**/*.ts", "src/**/*.tsx", "src/**/*.js", "src/**/*.jsx"]);
    
          // Linting results
          const results = {
            totalFiles: 0,
            totalLines: 0,
            largeFiles: [],
            namingViolations: [],
            classComponentInfo: [],
            generatorFunctionInfo: []
          };
    
          for (const sourceFile of project.getSourceFiles()) {
            const filePath = sourceFile.getFilePath();
            const stat = fs.statSync(filePath);
            const lines = sourceFile.getEndLineNumber() + 1;
            results.totalFiles += 1;
            results.totalLines += lines;
    
            if (lines > 500) {
              results.largeFiles.push({ file: filePath, lines });
            }
    
            // File name check
            const fileName = path.basename(filePath);
            const fileNamePattern = /^[a-z0-9]+(-[a-z0-9]+)*\.[jt]sx?$/;
            if (!fileNamePattern.test(fileName)) {
              results.namingViolations.push({ type: 'FileName', file: fileName });
            }
    
            // AST node analysis
            sourceFile.forEachDescendant(node => {
              switch (node.getKindName()) {
                case 'VariableDeclaration':
                  const varName = node.getName();
                  const varLine = node.getStartLineNumber();
                  if (/[A-Z|\_$]/.test(varName)) {
                    results.namingViolations.push({ type: 'VariableName', file: filePath, name: varName, line: varLine });
                  }
                  if (node.getInitializer()?.getText().startsWith('var ')) {
                    results.namingViolations.push({ type: 'VarDeclaration', file: filePath, line: varLine });
                  }
                  break;
    
                case 'PropertyAssignment':
                  const propName = node.getName();
                  const propLine = node.getStartLineNumber();
                  if (!/^[a-z][A-Za-z0-9]*$/.test(propName)) {
                    results.namingViolations.push({ type: 'PropertyName', file: filePath, name: propName, line: propLine });
                  }
                  break;
    
                case 'FunctionDeclaration':
                case 'MethodDeclaration':
                  const funcName = node.getName();
                  const funcLine = node.getStartLineNumber();
                  const funcBody = node.getBodyText();
                  if (/[\_\$]/.test(funcName)) {
                    results.namingViolations.push({ type: 'FunctionName', file: filePath, name: funcName, line: funcLine });
                  }
                  if (funcBody?.split('\n').length > 150) {
                    results.namingViolations.push({ type: 'FuncBodyLength', file: filePath, name: funcName, line: funcLine });
                  }
                  if (!node.getJsDocs().length) {
                    results.namingViolations.push({ type: 'FuncNoComment', file: filePath, name: funcName, line: funcLine });
                  }
                  break;
    
                case 'ClassDeclaration':
                  const className = node.getName();
                  const classLine = node.getStartLineNumber();
                  if (!/^[A-Z][A-Za-z0-9]*$/.test(className)) {
                    results.namingViolations.push({ type: 'ClassName', file: filePath, name: className, line: classLine });
                  }
    
                  node.getInstanceProperties().forEach(member => {
                    const memberName = member.getName();
                    const memberLine = member.getStartLineNumber();
                    if (/[\_\$]/.test(memberName)) {
                      results.namingViolations.push({ type: 'MemberName', file: filePath, name: memberName, line: memberLine });
                    }
                  });
                  break;
              }
    
              // 检查处理 Generator 函数
              if (node.isKind(SyntaxKind.FunctionDeclaration) && node.isGenerator()) {
                results.generatorFunctionInfo.push({
                  file: filePath,
                  name: node.getName(),
                  line: node.getStartLineNumber()
                });
              }
            });
    
            // 检查处理类组件
            sourceFile.getClasses().forEach(cls => {
              if (cls.getExtends()?.getText().includes('Component')) {
                results.classComponentInfo.push({
                  file: filePath,
                  name: cls.getName(),
                  line: cls.getStartLineNumber()
                });
              }
            });
          }
    
          context.scanResults.tsAst = results;
          resolve();
        } catch(error) {
          context.scanResults.tsAst = null;
          process.send({ type: 'log', level: 'error', text: `Error in plugin ${this.name}: ${error.message}` });
          resolve();
        }
      });
    });
  }
}

module.exports = TsAstCheckPlugin;
