const { ESLint } = require('eslint');

class EslintCheckPlugin {
  constructor() {
    this.name = 'EslintCheckPlugin';
  }
  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('EslintCheckPlugin', (context) => {
      return new Promise(async (resolve, rejects) =>{
        try{
          const eslint = new ESLint({
            baseConfig: {
              extends: ['airbnb', 'plugin:security/recommended'],
              plugins: ['security', 'complexity'],
              rules: {
                'complexity': ['error', { 'max': 10 }],
              },
            },
            useEslintrc: false,
          });
    
          const results = await eslint.lintFiles([context.root]);
    
          const report = ESLint.getErrorResults(results);
          const errorCount = report.errorCount || 0;
          const warningCount = report.warningCount || 0;
    
          context.scanResults.eslint = {
            errorCount,
            warningCount,
            results: report
          };
          resolve();
        }catch(error){
          context.scanResults.eslint = null;
          process.send({ type: 'log', level: 'error', text: `Error in plugin ${this.name}: ${error.message}` });
          resolve();
        }
      })
    });
  }
}

module.exports = EslintCheckPlugin;