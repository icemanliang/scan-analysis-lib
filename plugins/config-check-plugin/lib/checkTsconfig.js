const fs = require('fs');
const path = require('path');

module.exports = async function checkTsconfig(rootDir) {
  const filePath = path.join(rootDir, 'tsconfig.json');
  const result = { exists: false, isValid: false };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      // 检查一些常见的 TypeScript 配置项
      result.isValid = (
        config.compilerOptions &&
        typeof config.compilerOptions.strict === 'boolean' &&
        Array.isArray(config.include) &&
        Array.isArray(config.exclude)
      );
    } catch (error) {
      result.error = error.message;
    }
  }

  return result;
};
