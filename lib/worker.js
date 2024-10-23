// const ReadmeCheckPlugin = require('../plugins/readme-check-plugin');
// const ConfigCheckPlugin = require('../plugins/config-check-plugin');
// const LicenseCheckPlugin = require('../plugins/license-check-plugin'); 
// const RedundancyCheckPlugin = require('../plugins/redundancy-check-plugin'); 
// const StyleCheckPlugin = require('../plugins/style-check-plugin');
// const EslintCheckPlugin = require('../plugins/eslint-check-plugin'); 
// const ProjectConfigCheckPlugin = require('../plugins/project-config-check-plugin');
// const EjsCheckPlugin = require('../plugins/ejs-check-plugin');
// const TsAstCheckPlugin = require('../plugins/ts-ast-check-plugin');
// const DependencyCheckPlugin = require('../plugins/dependency-check-plugin');
// const NpmCheckPlugin = require('../plugins/npm-check-plugin');
// const FileCheckPlugin = require('../plugins/file-check-plugin');

const { AsyncSeriesHook } = require('tapable');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const crypto = require('crypto');

class WorkerScanner {
  constructor(targetDir, tempResultFile) {
    this.targetDir = targetDir;
    this.tempResultFile = tempResultFile;
    this.appName = path.basename(path.dirname(tempResultFile));
    this.logFile = path.join(path.dirname(tempResultFile), `${this.appName}_worker.log`);
    this.fingerprint = crypto.createHash('md5').update(this.appName + Date.now()).digest('hex').slice(0, 8);

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
      ),
      transports: [
        new winston.transports.File({ filename: this.logFile }),
        new winston.transports.Console()
      ]
    });

    this.hooks = {
      afterScan: new AsyncSeriesHook(['context']),
    };
    this.scanResults = {};
  }

  log(level, message) {
    this.logger.log(level, message);
    process.send({ 
      type: 'log', 
      level, 
      text: `[${this.fingerprint}] ${message}` 
    });
  }

  async scan(context) {
    context.scanResults = this.scanResults;
    context.logger = this;

    try {
      this.log('info', `Starting scan for ${this.appName}`);
      await this.hooks.afterScan.promise(context);
      this.log('info', `Scan completed for ${this.appName}`);
    } catch (error) {
      this.log('error', `Error in scan process: ${error.message}`);
    }

    return this.scanResults;
  }

  use(plugin) {
    plugin.apply(this);
  }
}

async function startWorker() {
  const [targetDir, tempResultFile] = process.argv.slice(2);
  const scanner = new WorkerScanner(targetDir, tempResultFile);

  // 手动添加需要的插件
  // scanner.use(new RedundancyCheckPlugin());
  // scanner.use(new EslintCheckPlugin());
  // scanner.use(new StyleCheckPlugin());
  // scanner.use(new TsAstCheckPlugin());
  // scanner.use(new FileCheckPlugin());
  // scanner.use(new DependencyCheckPlugin());

  scanner.log('info', `Start scanning ${targetDir}`);

  try {
    scanner.log('info', 'Before scanner.scan()');
    const results = await scanner.scan({ root: targetDir });
    scanner.log('info', 'After scanner.scan()');
    fs.writeFileSync(tempResultFile, JSON.stringify(results, null, 2));
    scanner.log('info', `Scan completed for ${targetDir}`);
  } catch (error) {
    scanner.log('error', `Error in scanning ${targetDir}: ${error.message}`);
  } finally {
    process.exit(0);
  }
}

startWorker();
