const npmCheck = require('npm-check');

class NpmCheckPlugin {
  constructor() {
    this.name = 'NpmCheckPlugin';
  }
  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('NpmCheckPlugin', async (context) => {
      return new Promise(async (resolve, rejects) => {
        try{
          const { blacklistPackages } = context.config;
          const currentState = await npmCheck({ cwd: context.root });
          const allPackages = currentState.get('packages');
  
          const results = {
            totalPackages: allPackages.length,
            thirdPartyPackages: [],
            internalPackages: [],
            blacklistViolations: []
          };
  
          allPackages.forEach(pkg => {
            const pkgName = pkg.moduleName;
            if (pkgName.startsWith('@iceman-npm')) {
              results.internalPackages.push({ name: pkgName, version: pkg.installed });
            } else {
              results.thirdPartyPackages.push({ name: pkgName, version: pkg.installed });
            }
  
            if (blacklistPackages.includes(pkgName)) {
              results.blacklistViolations.push({ name: pkgName, version: pkg.installed });
            }
          });
  
          context.scanResults.npmCheck = results;
          resolve();
        }catch(error){
          context.scanResults.npmCheck = null;
          process.send({ type: 'log', level: 'error', text: `Error in plugin ${this.name}: ${error.message}` });
          resolve();
        }
      })
    });
  }
}

module.exports = NpmCheckPlugin;