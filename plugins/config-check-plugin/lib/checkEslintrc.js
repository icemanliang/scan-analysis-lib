const fs = require('fs');
const path = require('path');

module.exports = async function checkEslintrc(rootDir) {
  const filePath = path.join(rootDir, '.eslintrc.js');
  const result = { exists: false, isValid: false };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const config = require(filePath);
      // 检查一些常见的 ESLint 配置项
      result.isValid = (
        config.extends &&
        config.rules &&
        typeof config.rules === 'object'
      );
    } catch (error) {
      result.error = error.message;
    }
  }

  return result;
};
