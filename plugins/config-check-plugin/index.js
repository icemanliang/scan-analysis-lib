const path = require('path');
// const checkCommitlintConfig = require('./lib/checkCommitlintConfig');
// const checkPrettierrc = require('./lib/checkPrettierrc');
// const checkReadme = require('./lib/checkReadme');
// const checkNpmrc = require('./lib/checkNpmrc');
// const checkEslintrc = require('./lib/checkEslintrc');
// const checkTsconfig = require('./lib/checkTsconfig');
// const checkNodeVersion = require('./lib/checkNodeVersion');
// const checkEditorconfig = require('./lib/checkEditorconfig');
// const checkPackageJson = require('./lib/checkPackageJson');
// const checkLicense = require('./lib/checkLicense');
const checkIgnoreFiles = require('./lib/checkIgnoreFiles');
// const checkBrowserslist = require('./lib/checkBrowserslist');
// const checkEjsTemplates = require('./lib/checkEjsTemplates');

class ConfigCheckPlugin {
  constructor() {
    this.name = 'ConfigCheckPlugin';
  }

  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('ConfigCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting project configuration check...');
        
        const results = {};

        // 执行各项检查
        // results.commitlint = await checkCommitlintConfig(context.root);
        // results.prettier = await checkPrettierrc(context.root);
        // results.readme = await checkReadme(context.root);
        // results.npmrc = await checkNpmrc(context.root);
        // results.eslint = await checkEslintrc(context.root);
        // results.tsconfig = await checkTsconfig(context.root);
        // results.nodeVersion = await checkNodeVersion(context.root);
        // results.editorconfig = await checkEditorconfig(context.root);
        // results.packageJson = await checkPackageJson(context.root);
        // results.license = await checkLicense(context.root);
        results.ignoreFiles = await checkIgnoreFiles(context.root);
        // results.browserslist = await checkBrowserslist(context.root);
        // results.ejsTemplates = await checkEjsTemplates(context.root);

        context.scanResults.configInfo = results;
        context.logger.log('info', 'Project configuration check completed.');
      } catch(error) {
        context.scanResults.configInfo = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
      }
    });
  }
}

module.exports = ConfigCheckPlugin;
