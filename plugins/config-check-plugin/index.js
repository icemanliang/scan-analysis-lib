const path = require('path');
const simpleGit = require('simple-git');

// const checkCommitlintConfig = require('./lib/checkCommitlintConfig');
// const checkPrettierrc = require('./lib/checkPrettierrc');
// const checkReadme = require('./lib/checkReadme');
// const checkNpmrc = require('./lib/checkNpmrc');
// const checkEslintrc = require('./lib/checkEslintrc');
// const checkTsconfig = require('./lib/checkTsconfig');
// const checkNodeVersion = require('./lib/checkNodeVersion');
// const checkEditorconfig = require('./lib/checkEditorconfig');
// const checkPackageJson = require('./lib/checkPackageJson');
const checkCommitMessage = require('./lib/checkCommitMessage');
// const checkLicense = require('./lib/checkLicense');
// const checkEjsTemplates = require('./lib/checkEjsTemplates');

class ProjectConfigCheckPlugin {
  constructor() {
    this.name = 'ProjectConfigCheckPlugin';
  }

  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('ProjectConfigCheckPlugin', async (context) => {
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
        // results.ejsTemplates = await checkEjsTemplates(context.root);

        // 获取最近的提交信息并检查
        const git = simpleGit(context.root);
        const commits = await git.log({ maxCount: 10 });
        results.commitMessages = await checkCommitMessage(commits.all);

        context.scanResults.projectConfig = results;
        context.logger.log('info', 'Project configuration check completed.');
      } catch(error) {
        context.scanResults.projectConfig = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
      }
    });
  }
}

module.exports = ProjectConfigCheckPlugin;
