const path = require('path');
const fs = require('fs');
const glob = require('fast-glob');
const simpleGit = require('simple-git');

class FileCheckPlugin {
  constructor(options = {}) {
    this.name = 'FileCheckPlugin';
    this.options = {
      scanDirs: ['./src'],  // 默认扫描当前目录
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],  // 默认忽略的目录
      ...options
    };
  }

  apply(scanner) {
    scanner.hooks.afterScan.tapPromise('FileCheckPlugin', async (context) => {
      try {
        context.logger.log('info', 'Starting file checks...');

        const results = {
          fileStats: {},
          namingIssues: {
            directories: [],
            files: []
          },
          commitMessages: [],
          huskyCheck: { exists: false, isValid: false, errors: [] },
          gitignoreCheck: { exists: false, isValid: false, errors: [] }
        };

        const files = await this.getAllFiles(context.root);
        files.forEach(file => {
          this.analyzeFile(file, results);
          this.checkNaming(file, results);
        });

        const directories = await this.getAllDirectories(context.root);
        directories.forEach(dir => {
          this.checkDirectoryNaming(dir, results);
        });

        // 执行 husky 检查
        results.huskyCheck = await this.checkHusky(context.root);
        // 执行 gitignore 检查
        results.gitignoreCheck = await this.checkGitignore(context.root);

        results.commitMessages = await this.checkCommitMessages(context.root);

        context.scanResults.fileInfo = results;
        context.logger.log('info', 'File checks completed.');
      } catch (error) {
        context.scanResults.fileInfo = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
      }
    });
  }

  async getAllFiles(rootDir) {
    const patterns = this.options.scanDirs.map(dir => path.join(rootDir, dir, '**/*'));
    return glob(patterns, {
      ignore: this.options.ignore,
      absolute: true,
      onlyFiles: true
    });
  }

  async getAllDirectories(rootDir) {
    const patterns = this.options.scanDirs.map(dir => path.join(rootDir, dir, '**/*'));
    return glob(patterns, {
      ignore: this.options.ignore,
      absolute: true,
      onlyDirectories: true
    });
  }

  analyzeFile(filePath, results) {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    if (!results.fileStats[ext]) {
      results.fileStats[ext] = { count: 0, totalSize: 0 };
    }
    
    results.fileStats[ext].count++;
    results.fileStats[ext].totalSize += stats.size;
  }

  checkNaming(filePath, results) {
    const fileName = path.basename(filePath, path.extname(filePath)); // 移除文件扩展名
    if (!this.isValidNaming(fileName)) {
      results.namingIssues.files.push(filePath);
    }
  }

  checkDirectoryNaming(dirPath, results) {
    const dirName = path.basename(dirPath);
    if (!this.isValidNaming(dirName)) {
      results.namingIssues.directories.push(dirPath);
    }
  }

  isValidNaming(str) {
    // 检查是否全部是小写字母
    if (/^[a-z]+$/.test(str)) {
      return true;
    }
    // 检查是否符合 kebab-case（只包含小写字母和连字符）
    return /^[a-z]+(-[a-z]+)*$/.test(str);
  }

  async checkCommitMessages(rootDir) {
    const git = simpleGit(rootDir);
    const commits = await git.log({ maxCount: 10 });
    const commitMessageRegex = /^(Merge branch|(\[[A-Z]+-\d+\]\s)?(feat|fix|docs|style|refactor|test|chore)(\([\w-]+\))?: .+)/;

    return commits.all.map(commit => {
      const isValid = commitMessageRegex.test(commit.message);
      return {
        hash: commit.hash,
        message: commit.message,
        isValid,
        errors: isValid ? [] : ['Invalid commit message'],
        warnings: []
      };
    });
  }

  async checkHusky(rootDir) {
    const result = {
      exists: false,
      isValid: false,
      errors: []
    };

    const huskyDir = path.join(rootDir, '.husky');
    if (fs.existsSync(huskyDir)) {
      result.exists = true;
      const requiredHooks = ['commit-msg', 'pre-commit', 'pre-push'];
      
      requiredHooks.forEach(hook => {
        const hookPath = path.join(huskyDir, hook);
        if (!fs.existsSync(hookPath)) {
          result.errors.push(`缺少 ${hook} 钩子文件`);
        }
      });
      
      result.isValid = result.errors.length === 0;
    } else {
      result.errors.push('.husky 目录不存在');
    }

    return result;
  }

  async checkGitignore(rootDir) {
    const result = {
      exists: false,
      isValid: false,
      errors: []
    };

    const gitignorePath = path.join(rootDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      result.exists = true;
      try {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        const lines = content.split('\n').map(line => line.trim());

        if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
          result.errors.push('.gitignore 文件是空的');
        }

        // 参考 checkIgnoreFiles.js 中的 checkGitignore 函数
        const requiredIgnores = [
          'logs',
          '*.log',
          'npm-debug.log*',
          'yarn-debug.log*',
          'yarn-error.log*',
          'lerna-debug.log*',
          '.pnpm-debug.log*',
          '.yarn/cache',
          '.yarn/unplugged',
          '.yarn/build-state.yml',
          '.yarn/install-state.gz',
          '.pnp.*',
          '.temp*',
          '.cache*',
          'node_modules',
          'dist/',
          '.DS_Store'
        ];

        requiredIgnores.forEach(ignore => {
          if (!lines.some(line => line.startsWith(ignore) || line === ignore)) {
            result.errors.push(`缺少必要的忽略项: ${ignore}`);
          }
        });

        result.isValid = result.errors.length === 0;
      } catch (error) {
        result.errors.push(error.message);
      }
    } else {
      result.errors.push('.gitignore 文件不存在');
    }

    return result;
  }
}

module.exports = FileCheckPlugin;
