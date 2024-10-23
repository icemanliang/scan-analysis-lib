const fs = require('fs');
const path = require('path');

module.exports = async function checkNpmrc(rootDir) {
  const filePath = path.join(rootDir, '.npmrc');
  const result = { exists: false, isValid: false };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // 检查是否包含某些关键配置
      result.isValid = (
        content.includes('registry=') &&
        content.includes('save-exact=true')
      );
    } catch (error) {
      result.error = error.message;
    }
  }

  return result;
};
