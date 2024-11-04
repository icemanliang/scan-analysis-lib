const fs = require('fs');
const path = require('path');

module.exports = async function checkPrettierrc(baseDir, config) {
  const result = { exists: false, isValid: false, filePath: null };

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
        result.isValid = Object.keys(config.expectedConfig).every(
          key => prettierConfig[key] === config.expectedConfig[key]
        );
      } catch (error) {
        result.error = error.message;
      }
      break;
    }
  }

  return result;
};
