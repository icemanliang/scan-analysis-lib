const jscpd = require('jscpd');

class RedundancyCheckPlugin {
  constructor() {
    this.name = 'RedundancyCheckPlugin';
  }
  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('RedundancyCheckPlugin', (context) => {
      return new Promise(async (resolve, rejects) =>{
        try{
          const options = {
            path: context.root, 
            reporters: [], // No reporters since we will handle the results programmatically
            languages: ['javascript', 'typescript', 'jsx', 'tsx'],
            minLines: 10
          };
    
          const result = await jscpd.detectInFiles(options);
          context.scanResults.redundancy = { statistic: result.statistic };
          resolve();
        }catch(error){
          context.scanResults.readme = null;
          process.send({ type: 'log', level: 'error', text: `Error in plugin ${this.name}: ${error.message}` });
          resolve();
        }
      })
    });
  }
}

module.exports = RedundancyCheckPlugin;
