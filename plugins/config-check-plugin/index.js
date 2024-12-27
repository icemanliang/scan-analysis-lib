const defaultConfig = require('./config');
const moment = require('moment');

class ConfigCheckPlugin {
  constructor(config = {}) {
    this.name = 'ConfigCheckPlugin';                 // 插件名称
    this.devMode = false;                            // 是否开启调试模式  
    this.config = {                                  // 插件配置
      ...defaultConfig,
      ...config
    };
  }

  // 开发模式调试日志
  devLog(title, message) {
    if(this.devMode) {
      console.debug(moment().format('YYYY-MM-DD HH:mm:ss'), 'debug', `[${this.name}]`, title, message);
    }
  }

  // 注册插件
  apply(scanner) {
    scanner.hooks.project.tapPromise(this.name, async (context) => {
      // this.devLog('config check', this.config);
      try {
        context.logger.log('info', 'start config check...');
        const startTime = Date.now()
        
        const results = {};
        const { checks } = this.config;

        // commitlintconfig 检查
        if (checks.commitlint) {
          const checkCommitlint = require('./lib/checkCommitlint');
          results.commitlint = await checkCommitlint(context.baseDir, this.config.commitlint);
          // this.devLog('commitlint', results.commitlint);
        }
        // prettierconfig 检查
        if (checks.prettier) {
          const checkPrettierrc = require('./lib/checkPrettierrc');
          results.prettier = await checkPrettierrc(context.baseDir, this.config.prettier);
          // this.devLog('prettier', results.prettier);
        }
        // readme 检查
        if (checks.readme) {
          const checkReadme = require('./lib/checkReadme');
          results.readme = await checkReadme(context.baseDir, this.config.readme);
          // this.devLog('readme', results.readme);
        }
        // npmrc 检查
        if (checks.npmrc) {
          const checkNpmrc = require('./lib/checkNpmrc');
          results.npmrc = await checkNpmrc(context.baseDir, this.config.npmrc);
          // this.devLog('npmrc', results.npmrc);
        }
        // eslintconfig 检查
        if (checks.eslint) {
          const checkEslintrc = require('./lib/checkEslintrc');
          results.eslint = await checkEslintrc(context.baseDir, this.config.eslint);
          // this.devLog('eslint', results.eslint);
        }
        // tsconfig 检查
        if (checks.tsconfig) {
          const checkTsconfig = require('./lib/checkTsconfig');
          results.tsconfig = await checkTsconfig(context, this.config.tsconfig);
          // this.devLog('tsconfig', results.tsconfig);
        }
        // node 版本检查
        if (checks.nodeVersion) {
          const checkNodeVersion = require('./lib/checkNodeVersion');
          results.nodeVersion = await checkNodeVersion(context.baseDir, this.config.nodeVersion);
          // this.devLog('nodeVersion', results.nodeVersion);
        }
        // editorconfig 检查
        if (checks.editorconfig) {
          const checkEditorconfig = require('./lib/checkEditorconfig');
          results.editorconfig = await checkEditorconfig(context.baseDir, this.config.editorconfig);
          // this.devLog('editorconfig', results.editorconfig);
        }
        // package.json 检查
        if (checks.packageJson) {
          const checkPackageJson = require('./lib/checkPackageJson');
          results.packageJson = await checkPackageJson(context.baseDir, this.config.packageJson);
          // this.devLog('packageJson', results.packageJson);
        }
        // license 检查
        if (checks.license) {
          const checkLicense = require('./lib/checkLicense');
          results.license = await checkLicense(context.baseDir, this.config.license);
          // this.devLog('license', results.license);
        }
        // ignoreFiles 检查
        if (checks.ignoreFiles) {
          const checkIgnoreFiles = require('./lib/checkIgnoreFiles');
          results.ignoreFiles = await checkIgnoreFiles(context.baseDir, this.config.ignoreFiles);
          // this.devLog('ignoreFiles', results.ignoreFiles);
        }
        // browserslist 检查
        if (checks.browserslist) {
          const checkBrowserslist = require('./lib/checkBrowserslist');
          results.browserslist = await checkBrowserslist(context.baseDir, this.config.browserslist);
          // this.devLog('browserslist', results.browserslist);
        }

        context.scanResults.configInfo = results;
        context.logger.log('info', `config check completed, time: ${Date.now() - startTime} ms`);
      } catch(error) {
        context.scanResults.configInfo = null;
        context.logger.log('error', `error in plugin ${this.name}: ${error.stack}`);
      }
    });
  }
}

module.exports = ConfigCheckPlugin;
