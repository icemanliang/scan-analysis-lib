const fs = require('fs');
const path = require('path');

module.exports = async function checkPrettierrc(baseDir, config) {
  const result = { exists: false, isValid: false, filePath: null, errors: [] };

  for (const file of config.possibleFiles) {
    const filePath = path.join(baseDir, file);
    if (fs.existsSync(filePath)) {
      result.exists = true;
      result.filePath = path.relative(baseDir, filePath);
      try {
        let prettierConfig;
        if (file.endsWith('.js')) {
          prettierConfig = require(filePath);
        } else {
          const content = fs.readFileSync(filePath, 'utf8');
          prettierConfig = JSON.parse(content);
        }

        // 检查配置是否与预期配置一致
        const invalidKeys = Object.keys(config.expectedConfig).filter(
          key => prettierConfig[key] !== config.expectedConfig[key]
        );

        if (invalidKeys.length > 0) {
          result.errors.push(`以下配置项不符合预期: ${invalidKeys.join(', ')}`);
        }
      } catch (error) {
        if (error.message.includes('Cannot find module') && file.endsWith('.js')) {
          // 检查是否是自定义配置
          const content = fs.readFileSync(filePath, 'utf8');
          if (!content.includes(config.customConfig)) {
            result.errors.push(`无效的配置文件内容: ${error.message}`);
          }
        } else {
          result.errors.push(`解析配置文件时出错: ${error.message}`);
        }
      }
      break;
    }
  }

  if (!result.exists) {
    result.errors.push('未找到 Prettier 配置文件');
  }

  result.isValid = result.errors.length === 0;
  return result;
};
