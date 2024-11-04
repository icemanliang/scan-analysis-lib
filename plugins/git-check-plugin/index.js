const path = require('path');
const fs = require('fs');
const glob = require('fast-glob');
const simpleGit = require('simple-git');
const defaultConfig = require('./config');

class GitCheckPlugin {
  constructor(config = {}) {
    this.name = 'GitCheckPlugin';
    this.config = {
      ...defaultConfig,
      ...config
    };
  }

  apply(scanner) {
    scanner.hooks.project.tapPromise(this.name, async (context) => {
      try {
        context.logger.log('info', 'Starting git checks...');

        const results = await this.runChecks(context.baseDir, context.codeDir);
        context.scanResults.gitInfo = results;
        
        context.logger.log('info', 'Git checks completed.');
      } catch (error) {
        context.scanResults.gitInfo = null;
        context.logger.log('error', `Error in plugin ${this.name}: ${error.message}`);
      }
    });
  }

  async runChecks(baseDir, codeDir) {
    const results = {
      fileStats: {},
      namingIssues: {
        directories: [],
        files: []
      },
      invalidCommits: [],
      huskyCheck: { exists: false, isValid: false, errors: [] },
      gitignoreCheck: { exists: false, isValid: false, errors: [] }
    };

    // 文件分析
    const files = await this.getAllFiles(baseDir, codeDir);
    files.forEach(file => {
      this.analyzeFile(file, results);
      this.checkNaming(file, baseDir, results);
    });

    // 目录分析
    const directories = await this.getAllDirectories(baseDir, codeDir);
    directories.forEach(dir => {
      this.checkDirectoryNaming(dir, baseDir, results);
    });

    // Git 相关检查
    results.huskyCheck = await this.checkHusky(baseDir);
    results.gitignoreCheck = await this.checkGitignore(baseDir);
    results.invalidCommits = await this.checkCommitMessages(baseDir);

    return results;
  }

  async getAllFiles(baseDir, codeDir) {
    const pattern = path.join(baseDir, codeDir, '**/*');
    return glob(pattern, {
      absolute: true,
      onlyFiles: true
    });
  }

  async getAllDirectories(baseDir, codeDir) {
    const pattern = path.join(baseDir, codeDir, '**/*');
    return glob(pattern, {
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

  checkNaming(filePath, baseDir, results) {
    const fileName = path.basename(filePath, path.extname(filePath));
    if (!this.isValidNaming(fileName)) {
      const relativePath = path.relative(baseDir, filePath);
      results.namingIssues.files.push(relativePath);
    }
  }

  checkDirectoryNaming(dirPath, baseDir, results) {
    const dirName = path.basename(dirPath);
    if (!this.isValidNaming(dirName)) {
      const relativePath = path.relative(baseDir, dirPath);
      results.namingIssues.directories.push(relativePath);
    }
  }

  isValidNaming(str) {
    const { patterns } = this.config.naming;
    return patterns.lowercase.test(str) || patterns.kebabCase.test(str);
  }

  async checkCommitMessages(baseDir) {
    const git = simpleGit(baseDir);
    const commits = await git.log({ maxCount: this.config.git.recentCommitsCount });
    
    return commits.all
      .filter(commit => !this.config.git.commitMessagePattern.test(commit.message))
      .map(commit => ({
        hash: commit.hash,
        message: commit.message
      }));
  }

  async checkHusky(baseDir) {
    const result = { exists: false, isValid: false, errors: [] };
    const huskyDir = path.join(baseDir, '.husky');

    if (!fs.existsSync(huskyDir)) {
      result.errors.push('.husky 目录不存在');
      return result;
    }

    result.exists = true;
    this.config.git.requiredHooks.forEach(hook => {
      const hookPath = path.join(huskyDir, hook);
      if (!fs.existsSync(hookPath)) {
        result.errors.push(`缺少 ${hook} 钩子文件`);
      }
    });
    
    result.isValid = result.errors.length === 0;
    return result;
  }

  async checkGitignore(baseDir) {
    const result = { exists: false, isValid: false, errors: [] };
    const gitignorePath = path.join(baseDir, '.gitignore');

    if (!fs.existsSync(gitignorePath)) {
      result.errors.push('.gitignore 文件不存在');
      return result;
    }

    result.exists = true;
    try {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      const lines = content.split('\n').map(line => line.trim());

      if (!lines.length || (lines.length === 1 && !lines[0])) {
        result.errors.push('.gitignore 文件是空的');
        return result;
      }

      this.config.git.requiredIgnores.forEach(ignore => {
        if (!lines.some(line => line.startsWith(ignore) || line === ignore)) {
          result.errors.push(`缺少必要的忽略项: ${ignore}`);
        }
      });

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(error.message);
    }

    return result;
  }
}

module.exports = GitCheckPlugin;
