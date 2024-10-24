const { Project } = require('ts-morph');
const path = require('path');
const fs = require('fs');
const jsonc = require('jsonc-parser');

class UsageCheckPlugin {
  constructor(options = {}) {
    this.name = 'UsageCheckPlugin';
    this.options = {
      aliasConfig: {
        "@src/*": "./src/*",
        "@components/*": "./src/components/*",
        "@utils/*": "./src/utils/*",
        "@hooks/*": "./src/hooks/*",
        "@assets/*": "./src/assets/*",
      },
      detailedImportPackages: ['react', 'lodash'], // 需要详细导入信息的包
      ...options
    };
  }

  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('UsageCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting dependency check...');
        const aliasConfig = this.getAliasConfig(context.root);
        const project = new Project({
          tsConfigFilePath: path.join(context.root, 'tsconfig.json')
        });

        project.addSourceFilesAtPaths("src/**/*.{ts,tsx,js,jsx}");

        const internalDependencies = {};
        const externalDependencies = {};
        
        project.getSourceFiles().forEach(sourceFile => {
          const filePath = sourceFile.getFilePath();
          
          sourceFile.getImportDeclarations().forEach(importDecl => {
            const moduleSpecifier = importDecl.getModuleSpecifierValue();
            const importedFilePath = this.resolveImportPath(context.root, filePath, moduleSpecifier, aliasConfig);

            if (importedFilePath) {
              if (importedFilePath.includes('node_modules')) {
                // 外部依赖
                const packageName = this.getPackageNameFromPath(importedFilePath);
                if (!externalDependencies[packageName]) {
                  externalDependencies[packageName] = { count: 0, dependents: [], detailedImports: {} };
                }
                externalDependencies[packageName].count += 1;
                externalDependencies[packageName].dependents.push(filePath);

                // 如果是需要详细导入信息的包，收集导入的具体内容
                if (this.options.detailedImportPackages.includes(packageName)) {
                  const importedNames = importDecl.getNamedImports().map(named => named.getName());
                  const defaultImport = importDecl.getDefaultImport()?.getText();
                  if (defaultImport) importedNames.unshift(defaultImport);
                  if (!externalDependencies[packageName].detailedImports[filePath]) {
                    externalDependencies[packageName].detailedImports[filePath] = [];
                  }
                  externalDependencies[packageName].detailedImports[filePath].push(...importedNames);
                }
              } else {
                // 内部依赖
                if (!internalDependencies[importedFilePath]) {
                  internalDependencies[importedFilePath] = { count: 0, dependents: [] };
                }
                internalDependencies[importedFilePath].count += 1;
                internalDependencies[importedFilePath].dependents.push(filePath);
              }
            }
          });
        });

        context.scanResults.dependencies = { internal: internalDependencies, external: externalDependencies };
        context.logger.log('info', `UsageCheck completed. Analyzed ${Object.keys(internalDependencies).length} internal files and ${Object.keys(externalDependencies).length} external packages.`);
      } catch (error) {
        context.scanResults.dependencies = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
      }
    });
  }

  getAliasConfig(rootDir) {
    const tsConfigPath = path.join(rootDir, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      try {
        const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf8');
        const tsConfig = jsonc.parse(tsConfigContent);
        if (tsConfig.compilerOptions?.paths) {
          return tsConfig.compilerOptions.paths;
        }
      } catch (error) {
        console.error('Error reading tsconfig.json:', error);
      }
    }
    return this.options.aliasConfig;
  }

  resolveImportPath(rootDir, currentFilePath, moduleSpecifier, aliasConfig) {
    // 处理相对路径导入
    if (moduleSpecifier.startsWith('.')) {
      return this.resolveFileWithExtensions(path.resolve(path.dirname(currentFilePath), moduleSpecifier));
    }

    // 处理别名导入
    for (const [alias, aliasPath] of Object.entries(aliasConfig)) {
      const regexAlias = new RegExp(`^${alias.replace('*', '(.*)')}$`);
      const match = moduleSpecifier.match(regexAlias);
      if (match) {
        const resolvedPath = path.join(rootDir, aliasPath[0].replace('*', match[1]));
        const result = this.resolveFileWithExtensions(resolvedPath);
        if (result) return result;
      }
    }

    // 处理 node_modules 导入
    const nodeModulesPath = path.join(rootDir, 'node_modules', moduleSpecifier);
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

module.exports = UsageCheckPlugin;
