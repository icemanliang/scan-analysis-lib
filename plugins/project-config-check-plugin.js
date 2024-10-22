const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');

class ProjectConfigCheckPlugin {
  constructor() {
    this.name = 'ProjectConfigCheckPlugin';
  }
  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('ProjectConfigCheckPlugin', (context) => {
      return new Promise(async (resolve, reject) => {
        try {
          context.logger.log('info', 'Starting project configuration check...');
          const configFiles = [
            '.husky', 'commitlint.config.js', '.prettierrc', '.npmrc', '.eslintrc.js',
            'tsconfig.json', '.nvmrc', '.editorconfig', 'jest.config.js', '.gitlab-ci.yml',
            'browserslist', 'package.json'
          ];

          const results = {};

          // 检查配置文件是否存在
          configFiles.forEach(file => {
            const filePath = path.join(context.root, file);
            results[file] = fs.existsSync(filePath);
            context.logger.log('info', `${file}: ${results[file] ? 'Found' : 'Not found'}`);
          });

          // 检查 package.json 内的字段
          const packageFile = path.join(context.root, 'package.json');
          if (fs.existsSync(packageFile)) {
            const packageContent = JSON.parse(fs.readFileSync(packageFile, 'utf-8'));
            if (packageContent.husky) results['husky'] = true;
            if (packageContent.commitlint) results['commitlint'] = true;
            if (packageContent.prettier) results['prettier'] = true;
            if (packageContent.eslintConfig) results['eslintrc.js'] = true;
            if (packageContent.jest) results['jest.config.js'] = true;
            results['packages'] = packageContent.dependencies;
            results['node_version'] = packageContent.engines.node;
            context.logger.log('info', 'Package.json analyzed successfully.');
          }

          // 使用 simple-git 获取近期提交信息
          const git = simpleGit(context.root);
          const commits = await git.log({ maxCount: 10 });
          results['recent_commits'] = commits.all;
          context.logger.log('info', 'Recent git commits retrieved.');

          context.scanResults.projectConfig = results;
          context.logger.log('info', 'Project configuration check completed.');
          resolve();
        } catch(error) {
          context.scanResults.projectConfig = null;
          context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
          resolve();
        }
      });
    });
  }
}

module.exports = ProjectConfigCheckPlugin;
