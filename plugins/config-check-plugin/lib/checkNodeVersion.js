const fs = require('fs');
const path = require('path');

module.exports = async function checkNodeVersion(baseDir, config) {
  const filePath = path.join(baseDir, '.node-version');
  const result = { exists: false, isValid: false, errors: [] };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8').trim();
      
      // 检查版本格式是否正确
      if (!config.versionPattern.test(content)) {
        result.errors.push('Node 版本格式不正确. 期望格式: v18.10.2 或 18.10.2');
      }

      // 检查版本号是否合法
      const version = content.replace(/^v/, '');
      const [major, minor, patch] = version.split('.').map(Number);
      
      if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
        result.errors.push('Node 版本号不合法');
      }

      result.isValid = result.errors.length === 0;
      result.version = version;
    } catch (error) {
      result.errors.push(error.message);
    }
  } else {
    result.errors.push('.node-version 文件不存在');
  }

  return result;
};
