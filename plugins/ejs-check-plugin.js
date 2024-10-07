const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');

class EjsCheckPlugin {
  constructor() {
    this.name = 'EjsCheckPlugin';
  }
  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('EjsCheckPlugin', (context) => {
      return new Promise(async (resolve, rejects) =>{
        try{
          const { templateSnippet, blacklistDomains } = context.config;
          const ejsFiles = await fg(['**/*.ejs'], { cwd: context.root });
          const results = {
            totalFiles: ejsFiles.length,
            blacklistViolations: [],
            templateViolations: []
          };

          ejsFiles.forEach(file => {
            const fullPath = path.join(context.root, file);
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (!content.includes(templateSnippet)) {
              results.templateViolations.push({ file, message: 'Missing standard template snippet' });
            }
            
            if (/unpkg\.com/.test(content)) {
              const unpkgUrl = content.match(/unpkg\.com\/[^"]+/)[0];
              for (let domain of blacklistDomains) {
                if (unpkgUrl.includes(domain)) {
                  results.blacklistViolations.push({ file, url: unpkgUrl, domain });
                }
              }
            }
          });

          context.scanResults.ejs = results;
          resolve();
        }catch(error){
          context.scanResults.ejs = null;
          process.send({ type: 'log', level: 'error', text: `Error in plugin ${this.name}: ${error.message}` });
          resolve();
        }
      })
    });
  }
}

module.exports = EjsCheckPlugin;
