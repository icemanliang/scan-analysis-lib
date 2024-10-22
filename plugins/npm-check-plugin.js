const npmCheck = require('npm-check');

class NpmCheckPlugin {
  constructor() {
    this.name = 'NpmCheckPlugin';
  }
  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('NpmCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting npm check...');
        const currentState = await npmCheck({
          cwd: context.root,
          skipUnused: false,
          ignoreDev: false
        });

        const packages = currentState.get('packages');
        console.log(packages);
        const results = {
          outdated: [],
          unused: []
        };

        packages.forEach(pkg => {
          if (pkg.isOutdated) {
            results.outdated.push({
              name: pkg.moduleName,
              currentVersion: pkg.installed,
              latestVersion: pkg.latest
            });
          }
          if (pkg.isUnused) {
            results.unused.push(pkg.moduleName);
          }
        });

        context.scanResults.npmCheck = results;
        context.logger.log('info', `npm check completed. Found ${results.outdated.length} outdated and ${results.unused.length} unused packages.`);
      } catch (error) {
        context.scanResults.npmCheck = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
      }
    });
  }
}

module.exports = NpmCheckPlugin;
