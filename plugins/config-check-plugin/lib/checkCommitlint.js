const fs = require('fs');
const path = require('path');

module.exports = async function checkCommitlint(baseDir, config) {
  const result = { exists: false, isValid: false, filePath: null };

  for (const file of config.possibleFiles) {
    const filePath = path.join(baseDir, file);
    if (fs.existsSync(filePath)) {
      result.exists = true;
      result.filePath = path.relative(baseDir, filePath);
      try {
        let commitlintConfig;
        if (file.endsWith('.js')) {
          commitlintConfig = require(filePath);
        } else {
          const content = fs.readFileSync(filePath, 'utf-8');
          commitlintConfig = JSON.parse(content);
        }

        // 检查 extends 属性
        if (Array.isArray(commitlintConfig.extends) && 
            config.requiredExtends.every(ext => commitlintConfig.extends.includes(ext))) {
          result.isValid = true;
        } else {
          result.isValid = false;
          result.error = `配置必须继承以下模块: ${config.requiredExtends.join(', ')}`;
        }
      } catch (error) {
        result.isValid = false;
        result.error = `解析配置文件时出错: ${error.message}`;
      }
      break;
    }
  }

  return result;
};
