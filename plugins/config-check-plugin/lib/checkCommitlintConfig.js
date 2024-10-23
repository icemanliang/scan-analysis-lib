const fs = require('fs');
const path = require('path');

module.exports = async function checkCommitlintConfig(rootDir) {
  const filePath = path.join(rootDir, 'commitlint.config.js');
  const result = { exists: false, isValid: false };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const config = require(filePath);
      // 这里添加检查配置是否符合标准的逻辑
      result.isValid = true; // 假设配置有效
    } catch (error) {
      result.error = error.message;
    }
  }

  return result;
};
