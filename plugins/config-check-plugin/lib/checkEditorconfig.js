const fs = require('fs');
const path = require('path');

module.exports = async function checkEditorconfig(baseDir, config) {
  const filePath = path.join(baseDir, '.editorconfig');
  const result = { exists: false, isValid: false, errors: [] };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').map(line => line.trim());

      // 检查标准配置
      const configStatus = { ...config.expectedConfigs };

      lines.forEach(line => {
        for (const configKey in configStatus) {
          if (line === configKey) {
            configStatus[configKey] = true;
            break;
          }
        }
      });

      // 检查是否所有预期的配置都存在
      for (const configKey in configStatus) {
        if (!configStatus[configKey]) {
          result.errors.push(`缺少配置项: ${configKey}`);
        }
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`读取文件时出错: ${error.message}`);
    }
  } else {
    result.errors.push('.editorconfig 文件不存在');
  }

  return result;
};
