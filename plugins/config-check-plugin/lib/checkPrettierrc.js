const fs = require('fs');
const path = require('path');

module.exports = async function checkPrettierrc(rootDir) {
  const filePath = path.join(rootDir, '.prettierrc.json');
  const result = { exists: false, isValid: false };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      // 检查一些常见的 Prettier 配置项
      result.isValid = (
        typeof config.printWidth === 'number' &&
        typeof config.tabWidth === 'number' &&
        typeof config.useTabs === 'boolean' &&
        typeof config.semi === 'boolean' &&
        typeof config.singleQuote === 'boolean'
      );
    } catch (error) {
      result.error = error.message;
    }
  }

  return result;
};
