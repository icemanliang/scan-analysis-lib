const path = require('path');

class KnipCheckPlugin {
  constructor() {
    this.name = 'KnipCheckPlugin';
  }
  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('KnipCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting knip check...');

        const { scan } = await import('knip');

        const config = {
          entry: ['src/**/*.{js,jsx,ts,tsx}'],
          project: ['src/**/*.{js,jsx,ts,tsx}'],
          ignoreDependencies: [],
          ignoreExports: [],
          ignoreUnused: []
        };

        const results = await scan({
          rootPath: context.root,
          config
        });

        const unusedDependencies = results.dependencies.filter(dep => dep.used === false);
        const unusedFiles = results.files.filter(file => file.used === false);

        context.scanResults.knipCheck = {
          unusedDependencies: unusedDependencies.map(dep => dep.name),
          unusedFiles: unusedFiles.map(file => path.relative(context.root, file.path))
        };

        context.logger.log('info', `Knip check completed. Found ${unusedDependencies.length} unused dependencies and ${unusedFiles.length} unused files.`);
      } catch (error) {
        context.scanResults.knipCheck = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
      }
    });
  }
}

module.exports = KnipCheckPlugin;
