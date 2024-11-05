const { Project } = require('ts-morph');
const path = require('path');
const fs = require('fs');
const jsonc = require('jsonc-parser');
const defaultConfig = require('./config');

class DependencyCheckPlugin {
  constructor(config = {}) {
    this.name = 'DependencyCheckPlugin';
    this.config = {
      ...defaultConfig,
      ...config
    };
  }

  apply(scanner) {
    scanner.hooks.dependency.tapPromise(this.name, async (context) => {
      try {
        context.logger.log('info', 'Starting dependency check...');
        const compilerOptions = this.getCompilerOptions(context.baseDir);
        if(context.aliasConfig && Object.keys(context.aliasConfig).length > 0) {
          // console.log('context.aliasConfig', context.aliasConfig);
          compilerOptions.paths = {
            ...compilerOptions.paths,
            ...context.aliasConfig
          };
        }

        const project = new Project({
          compilerOptions: compilerOptions
        });

        project.addSourceFilesAtPaths(path.join(context.baseDir, context.codeDir, "**/*.{ts,tsx,js,jsx}"));

        const internalDependencies = {};
        const externalDependencies = {};
        
        project.getSourceFiles().forEach(sourceFile => {
          const filePath = sourceFile.getFilePath();
          // console.log('filePath', filePath);
          
          sourceFile.getImportDeclarations().forEach(importDecl => {
            const moduleSpecifier = importDecl.getModuleSpecifierValue();
            const importedFilePath = this.resolveImportPath(context.baseDir, filePath, moduleSpecifier, compilerOptions.paths);

            if (importedFilePath) {
              if (importedFilePath.includes('node_modules')) {
                // 外部依赖
                const packageName = this.getPackageNameFromPath(importedFilePath);
                if (!externalDependencies[packageName]) {
                  externalDependencies[packageName] = { count: 0, dependents: [], detailedImports: {} };
                }
                externalDependencies[packageName].count += 1;
                externalDependencies[packageName].dependents.push(path.relative(context.baseDir, filePath));

                // 如果是需要详细导入信息的包，收集导入的具体内容
                if (this.config.detailedImportPackages.includes(packageName)) {
                  const importedNames = importDecl.getNamedImports().map(named => named.getName());
                  const defaultImport = importDecl.getDefaultImport()?.getText();
                  if (defaultImport) importedNames.unshift(defaultImport);

                  const formattedFilePath = path.relative(context.baseDir, filePath);
                  if (!externalDependencies[packageName].detailedImports[formattedFilePath]) {
                    externalDependencies[packageName].detailedImports[formattedFilePath] = [];
                  }
                  externalDependencies[packageName].detailedImports[formattedFilePath].push(...importedNames);
                }
              } else {
                // 内部依赖
                const formattedImportedFilePath = path.relative(context.baseDir, importedFilePath);
                if (!internalDependencies[formattedImportedFilePath]) {
                  internalDependencies[formattedImportedFilePath] = { count: 0, dependents: [] };
                }
                internalDependencies[formattedImportedFilePath].count += 1;
                internalDependencies[formattedImportedFilePath].dependents.push(path.relative(context.baseDir, filePath));
              }
            }
          });
        });

        context.scanResults.dependencyInfo = { internal: internalDependencies, external: externalDependencies };
        context.logger.log('info', `UsageCheck completed. Analyzed ${Object.keys(internalDependencies).length} internal files and ${Object.keys(externalDependencies).length} external packages.`);
      } catch (error) {
        context.scanResults.dependencyInfo = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
      }
    });
  }

  getCompilerOptions(baseDir) {
    const tsConfigPath = path.join(baseDir, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      try {
        const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf8');
        const tsConfig = jsonc.parse(tsConfigContent);
        if (tsConfig?.compilerOptions) {
          // console.log('tsConfig.compilerOptions', tsConfig.compilerOptions);
          return tsConfig.compilerOptions;
        }
      } catch (error) {
        console.error('Error reading tsconfig.json:', error);
      }
    }
    return this.config.compilerOptions;
  }

  resolveImportPath(baseDir, currentFilePath, moduleSpecifier, aliasConfig) {
    // 处理相对路径导入
    if (moduleSpecifier.startsWith('.')) {
      return this.resolveFileWithExtensions(path.resolve(path.dirname(currentFilePath), moduleSpecifier));
    }

    // 处理别名导入
    for (const [alias, aliasPath] of Object.entries(aliasConfig)) {
      const regexAlias = new RegExp(`^${alias.replace('*', '(.*)')}$`);
      const match = moduleSpecifier.match(regexAlias);
      if (match) {
        const resolvedPath = path.join(baseDir, aliasPath[0].replace('*', match[1]));
        const result = this.resolveFileWithExtensions(resolvedPath);
        if (result) return result;
      }
    }

    // 处理 node_modules 导入
    const nodeModulesPath = path.join(baseDir, 'node_modules', moduleSpecifier);
    if (fs.existsSync(nodeModulesPath)) {
      return nodeModulesPath;
    }

    // 如果无法解析，返回 null
    return null;
  }

  resolveFileWithExtensions(filePath) {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
    for (const ext of extensions) {
      const fullPath = filePath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }

  getPackageNameFromPath(fullPath) {
    const parts = fullPath.split('node_modules/');
    const packagePath = parts[parts.length - 1];
    return packagePath.split('/')[0];
  }
}

module.exports = DependencyCheckPlugin;
