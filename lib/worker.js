const ReadmeCheckPlugin = require('../plugins/readme-check-plugin');
const ConfigCheckPlugin = require('../plugins/config-check-plugin');
const LicenseCheckPlugin = require('../plugins/license-check-plugin'); 
const RedundancyCheckPlugin = require('../plugins/redundancy-check-plugin'); 
const StyleCheckPlugin = require('../plugins/style-check-plugin'); 
const EslintCheckPlugin = require('../plugins/eslint-check-plugin'); 
const ProjectConfigCheckPlugin = require('../plugins/project-config-check-plugin');
const EjsCheckPlugin = require('../plugins/ejs-check-plugin');
const TsAstCheckPlugin = require('../plugins/ts-ast-check-plugin');
const DependencyCheckPlugin = require('../plugins/dependency-check-plugin');
const NpmCheckPlugin = require('../plugins/npm-check-plugin');

const { AsyncSeriesHook } = require('tapable');
const fs = require('fs');

class WorkerScanner {
  constructor() {
    this.hooks = {
      afterScan: new AsyncSeriesHook(['context']),
    };
    this.scanResults = {};
  }

  async scan(context) {
    context.scanResults = this.scanResults;

    try {
      await this.hooks.afterScan.promise(context);
    } catch (error) {
      process.send({ type: 'log', level: 'error', text: `Error in Child Process: ${error.message}` });
    }

    return this.scanResults;
  }

  use(plugin) {
    plugin.apply(this);
  }
}

async function startWorker() {
  const [targetDir, tempResultFile] = process.argv.slice(2);
  const scanner = new WorkerScanner();
  scanner.use(new ReadmeCheckPlugin());
  scanner.use(new ConfigCheckPlugin());
  scanner.use(new LicenseCheckPlugin());
  scanner.use(new RedundancyCheckPlugin()); 
  scanner.use(new StyleCheckPlugin()); 
  scanner.use(new EslintCheckPlugin()); 
  scanner.use(new ProjectConfigCheckPlugin());
  scanner.use(new EjsCheckPlugin());
  scanner.use(new TsAstCheckPlugin());
  scanner.use(new DependencyCheckPlugin());
  scanner.use(new NpmCheckPlugin());


  process.send({ type: 'log', level: 'info', text: `Start scanning ${targetDir}` });

  const results = await scanner.scan({ root: targetDir });

  fs.writeFileSync(tempResultFile, JSON.stringify(results, null, 2));

  process.send({ type: 'log', level: 'info', text: `Scan completed for ${targetDir}` });

  process.exit();
}

startWorker()
