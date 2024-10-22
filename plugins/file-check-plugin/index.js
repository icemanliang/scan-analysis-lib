const path = require('path');
const fs = require('fs');
const glob = require('fast-glob');

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
        context.logger.log('info', 'Starting file statistics and naming check...');

        const results = {
          fileStats: {},
          namingIssues: {
            directories: [],
            files: []
          }
        };

        const files = await this.getAllFiles(context.root);
        files.forEach(file => {
          this.analyzeFile(file, results);
          this.checkNaming(file, results);
        });

        // 检查目录命名
        const directories = await this.getAllDirectories(context.root);
        directories.forEach(dir => {
          this.checkDirectoryNaming(dir, results);
        });

        context.scanResults.fileStatsNaming = results;
        context.logger.log('info', 'File statistics and naming check completed.');
        context.logger.log('info', `Found ${Object.keys(results.fileStats).length} file types.`);
        context.logger.log('info', `Found ${results.namingIssues.directories.length} directories and ${results.namingIssues.files.length} files with naming issues.`);
      } catch (error) {
        context.scanResults.fileStatsNaming = null;
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
}

module.exports = FileCheckPlugin;
