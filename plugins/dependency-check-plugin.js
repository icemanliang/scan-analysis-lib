const { Project } = require('ts-morph');
const path = require('path');

class DependencyCheckPlugin {
  constructor() {
    this.name = 'DependencyCheckPlugin';
  }
  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('DependencyCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting dependency check...');
        const aliasConfig = {
          "@src/*": "./src/*",
          "@components/*": "./src/components/*",
          "@utils/*": "./src/utils/*",
          "@hooks/*": "./src/hooks/*",
          "@assets/*": "./src/assets/*",
        };
        const project = new Project({
          tsConfigFilePath: path.join(context.root, 'tsconfig.json')
        });

        project.addSourceFilesAtPaths("src/**/*.{ts,tsx,js,jsx}");

        const aliasMap = new Map();
        Object.entries(aliasConfig).forEach(alias => {
          aliasMap.set(alias[0], alias[1]);
        });

        const dependencies = {};
        
        project.getSourceFiles().forEach(sourceFile => {
          const filePath = sourceFile.getFilePath();
          dependencies[filePath] = dependencies[filePath] || { count: 0, dependents: [] };

          sourceFile.getImportDeclarations().forEach(importDecl => {
            const moduleSpecifier = importDecl.getModuleSpecifierValue();
            let importedFilePath;
            if (moduleSpecifier.startsWith('.')) {
              importedFilePath = path.resolve(path.dirname(filePath), moduleSpecifier);
            } else {
              const matchedAlias = Array.from(aliasMap.keys()).find(aliasKey => moduleSpecifier.startsWith(aliasKey));
              if (matchedAlias) {
                importedFilePath = path.resolve(aliasMap.get(matchedAlias), moduleSpecifier.replace(matchedAlias, ''));
              } else {
                importedFilePath = path.resolve('node_modules', moduleSpecifier);
              }
            }

            dependencies[importedFilePath] = dependencies[importedFilePath] || { count: 0, dependents: [] };
            dependencies[importedFilePath].count += 1;
            dependencies[importedFilePath].dependents.push(filePath);
          });
        });

        context.scanResults.dependencies = dependencies;
        context.logger.log('info', `Dependency check completed. Analyzed ${Object.keys(dependencies).length} files.`);
      } catch (error) {
        context.scanResults.dependencies = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
      }
    });
  }
}

module.exports = DependencyCheckPlugin;
