const fs = require('fs');
const path = require('path');


// 统计指定目录下的 js 文件数量
function countJsFiles(dir) {
  // 计数器
  let count = 0;
  // 读取目录中的所有文件和子目录
  const items = fs.readdirSync(dir);
  for (const item of items) {
    // 获取当前项的完整路径
    const fullPath = path.join(dir, item);

    // 检查文件或目录
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      // 如果是目录，递归调用
      count += countJsFiles(fullPath);
    } else if (stats.isFile() && fullPath.endsWith('.js')) {
      // 如果是 .js 文件，累加计数
      count++;
    }
  }
  return count;
}

class CustomPlugin {
    constructor(config) {
      this.name = 'CustomPlugin';
      this.config = config;
      this.devMode = false;
    }
  
    apply(scanner) {
      // 自定义插件逻辑, 统计指定类型的文件数量,注册到 code 钩子中
      scanner.hooks.code.tapPromise(this.name, async (context) => {
        // this.devLog('config custom', this.config);
        try {
            context.logger.log('info', 'start custom plugin...');
            const countFileType = this.config.countFileType;
            const scanDir = path.join(context.baseDir, context.codeDir);
            const count = countJsFiles(scanDir);

            context.scanResults.customInfo = {
                total: count,
            };
            context.logger.log('info', `total ${count} ${countFileType} files`);
            context.logger.log('info', `custom plugin completed`);
        } catch(error) {
            context.scanResults.customInfo = null;
            context.logger.log('error', `error in plugin ${this.name}: ${error.stack}`);
        }
      });
    }
}

module.exports = CustomPlugin;