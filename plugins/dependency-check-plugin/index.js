const { Project } = require('ts-morph');
const path = require('path');
const fs = require('fs');
const jsonc = require('jsonc-parser');
const defaultConfig = require('./config');
const moment = require('moment');
const { transformDetailedImports } = require('./util');

class DependencyCheckPlugin {
  constructor(config = {}) {
    this.name = 'DependencyCheckPlugin';     // 插件名称  
    this.devMode = true;                    // 是否开启调试模式
    this.config = {                          // 插件配置
      compilerOptions: {
        ...defaultConfig.compilerOptions,
        ...config.compilerOptions
      },
      ignoreMatch: config.ignoreMatch || defaultConfig.ignoreMatch
    };
    this.packageJson = null;
  }

  // 开发模式调试日志
  devLog(title, message) {
    if(this.devMode) {
      console.debug(moment().format('YYYY-MM-DD HH:mm:ss'), 'debug', `[${this.name}]`, title, message);
    }
  }

  // 注册插件
  apply(scanner) {
    scanner.hooks.dependency.tapPromise(this.name, async (context) => {
      // this.devLog('config check', this.config);
      try {
        context.logger.log('info', 'start dependency check...');
        const startTime = Date.now();

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

        // 内部依赖和外部依赖
        const internalTotalFilePaths = [];  // 参与分析的文件路径汇总
        const internalDependencies = {};
        const externalDependencies = {};
        
        project.getSourceFiles().forEach(sourceFile => {
          const filePath = sourceFile.getFilePath();
          internalTotalFilePaths.push(path.relative(context.baseDir, filePath));
          // this.devLog('filePath', filePath);
          
          sourceFile.getImportDeclarations().forEach(importDecl => {
            const moduleSpecifier = importDecl.getModuleSpecifierValue();
            const importedFilePath = this.resolveImportPath(context.baseDir, filePath, moduleSpecifier, compilerOptions.paths);

            // this.devLog('importedFilePath', importedFilePath);
            if (importedFilePath) {
              if (importedFilePath.includes('node_modules')) {
                // 外部依赖
                const packageName = this.getPackageNameFromPath(importedFilePath);
                if (!externalDependencies[packageName]) {
                  externalDependencies[packageName] = { count: 0, dependents: [], detailedImports: {} };
                }
                externalDependencies[packageName].count += 1;
                externalDependencies[packageName].dependents.push(path.relative(context.baseDir, filePath));

                const importedNames = importDecl.getNamedImports().map(named => named.getName());
                const defaultImport = importDecl.getDefaultImport()?.getText();
                if (defaultImport) importedNames.unshift(defaultImport);

                const formattedFilePath = path.relative(context.baseDir, filePath);
                if (!externalDependencies[packageName].detailedImports[formattedFilePath]) {
                  externalDependencies[packageName].detailedImports[formattedFilePath] = [];
                }
                externalDependencies[packageName].detailedImports[formattedFilePath].push(...importedNames);
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

        // 在输出结果之前转换数据结构
        Object.keys(externalDependencies).forEach(packageName => {
          externalDependencies[packageName].detailedImports = 
            transformDetailedImports(externalDependencies[packageName].detailedImports);
        });

        // 计算依赖度为0的文件
        const dependencyZeroFiles = internalTotalFilePaths
          .filter(filePath => !internalDependencies[filePath])
          .filter(filePath => !this.config.ignoreMatch.some(pattern => filePath.includes(pattern))); 

        context.scanResults.dependencyInfo = { internal: internalDependencies, external: externalDependencies, dependencyZeroFiles };
        context.logger.log('info', `analyzed ${Object.keys(internalDependencies).length} internal files and ${Object.keys(externalDependencies).length} external packages.`);
        context.logger.log('info', `dependency check completed, time: ${Date.now() - startTime} ms`);
      } catch (error) {
        context.scanResults.dependencyInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.stack}`);
      }
    });
  }

  // 获取 tsconfig.json 配置
  getCompilerOptions(baseDir) {
    const tsConfigPath = path.join(baseDir, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      try {
        const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf8');
        const tsConfig = jsonc.parse(tsConfigContent);
        if (tsConfig?.compilerOptions) {
          // this.devLog('getCompilerOptions', tsConfig.compilerOptions);
          return tsConfig.compilerOptions;
        }
      } catch (error) {
        console.error('error reading tsconfig.json:', error);
      }
    }
    return this.config.compilerOptions;
  }

  // 解析导入路径
  resolveImportPath(baseDir, currentFilePath, moduleSpecifier, aliasConfig) {
    // 处理相对路径导入
    if (moduleSpecifier.startsWith('.')) {
      return this.resolveFileWithExtensions(path.resolve(path.dirname(currentFilePath), moduleSpecifier));
    }

    // 处理别名导入
    if (aliasConfig && Object.keys(aliasConfig).length > 0) {
      for (const [alias, aliasPath] of Object.entries(aliasConfig)) {
        const regexAlias = new RegExp(`^${alias.replace('*', '(.*)')}$`);
        const match = moduleSpecifier.match(regexAlias);
        if (match) {
          const resolvedPath = path.join(baseDir, aliasPath[0].replace('*', match[1]));
          const result = this.resolveFileWithExtensions(resolvedPath);
          if (result) return result;
        }
      }
    }

    // 处理外部依赖导入
    // this.devLog('resolveExternalImportPath', moduleSpecifier);
    const packageJson = this.getPackageJson(baseDir);
    if (packageJson) {
      const dependencies = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {})
      };
      
      // 获取模块的根包名（处理子模块导入的情况，如 'lodash/get'）
      const rootPackageName = moduleSpecifier.split('/')[0];
      
      // 完整匹配或者匹配到按需导入的包，则返回完整路径
      if (dependencies[moduleSpecifier] || dependencies[rootPackageName]) {
        return path.join(baseDir, 'node_modules', moduleSpecifier);
      }
    }

    // 如果无法解析，返回 null
    return null;
  }

  // 解析文件路径
  resolveFileWithExtensions(filePath) {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
    for (const ext of extensions) {
      const fullPath = filePath + ext;
      if (fs.existsSync(fullPath)) {
        // this.devLog('resolveFileWithExtensions', fullPath);
        return fullPath;
      }
    }
    return null;
  }

  // 从路径中获取包名
  getPackageNameFromPath(fullPath) {
    const parts = fullPath.split('node_modules/');
    const packagePath = parts[parts.length - 1];
    return packagePath.split('/')[0];
  }

  // 新增方法：获取 package.json 内容
  getPackageJson(baseDir) {
    if (this.packageJson) return this.packageJson;
    
    const packageJsonPath = path.join(baseDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        this.packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return this.packageJson;
      } catch (error) {
        console.error('读取 package.json 失败:', error);
      }
    }
    return null;
  }
}

module.exports = DependencyCheckPlugin;
