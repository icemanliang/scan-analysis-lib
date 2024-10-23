const fs = require('fs');
const path = require('path');

module.exports = async function checkNodeVersion(rootDir) {
  const filePath = path.join(rootDir, '.node-version');
  const result = { exists: false, isValid: false, version: null };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const version = fs.readFileSync(filePath, 'utf8').trim();
      result.version = version;
      // 检查版本号是否符合语义化版本规范
      result.isValid = /^v?\d+\.\d+\.\d+$/.test(version);
    } catch (error) {
      result.error = error.message;
    }
  }

  return result;
};
