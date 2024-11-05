const defaultConfig = require('./config');

class ConfigCheckPlugin {
  constructor(config = {}) {
    this.name = 'ConfigCheckPlugin';
    this.config = {
      ...defaultConfig,
      ...config
    };
  }

  apply(scanner) {
    scanner.hooks.project.tapPromise(this.name, async (context) => {
      try {
        context.logger.log('info', 'starting config check...');
        
        const results = {};
        const { checks } = this.config;

        // 根据配置执行检查
        if (checks.commitlint) {
          const checkCommitlint = require('./lib/checkCommitlint');
          results.commitlint = await checkCommitlint(context.baseDir, this.config.commitlint);
        }
        if (checks.prettier) {
          const checkPrettierrc = require('./lib/checkPrettierrc');
          results.prettier = await checkPrettierrc(context.baseDir, this.config.prettier);
        }
        if (checks.readme) {
          const checkReadme = require('./lib/checkReadme');
          results.readme = await checkReadme(context.baseDir, this.config.readme);
        }
        if (checks.npmrc) {
          const checkNpmrc = require('./lib/checkNpmrc');
          results.npmrc = await checkNpmrc(context.baseDir, this.config.npmrc);
        }
        if (checks.eslint) {
          const checkEslintrc = require('./lib/checkEslintrc');
          results.eslint = await checkEslintrc(context.baseDir, this.config.eslint);
        }
        if (checks.tsconfig) {
          const checkTsconfig = require('./lib/checkTsconfig');
          results.tsconfig = await checkTsconfig(context.baseDir, this.config.tsconfig);
        }
        if (checks.nodeVersion) {
          const checkNodeVersion = require('./lib/checkNodeVersion');
          results.nodeVersion = await checkNodeVersion(context.baseDir, this.config.nodeVersion);
        }
        if (checks.editorconfig) {
          const checkEditorconfig = require('./lib/checkEditorconfig');
          results.editorconfig = await checkEditorconfig(context.baseDir, this.config.editorconfig);
        }
        if (checks.packageJson) {
          const checkPackageJson = require('./lib/checkPackageJson');
          results.packageJson = await checkPackageJson(context.baseDir, this.config.packageJson);
        }
        if (checks.license) {
          const checkLicense = require('./lib/checkLicense');
          results.license = await checkLicense(context.baseDir, this.config.license);
        }
        if (checks.ignoreFiles) {
          const checkIgnoreFiles = require('./lib/checkIgnoreFiles');
          results.ignoreFiles = await checkIgnoreFiles(context.baseDir, this.config.ignoreFiles);
        }
        if (checks.browserslist) {
          const checkBrowserslist = require('./lib/checkBrowserslist');
          results.browserslist = await checkBrowserslist(context.baseDir, this.config.browserslist);
        }

        context.scanResults.configInfo = results;
        context.logger.log('info', 'config check completed.');
      } catch(error) {
        context.scanResults.configInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.message}`);
      }
    });
  }
}

module.exports = ConfigCheckPlugin;
