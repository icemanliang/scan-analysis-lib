const fs = require('fs');
const path = require('path');

module.exports = async function checkBrowserslist(baseDir, config) {
  const filePath = path.join(baseDir, '.browserslistrc');
  const result = { exists: false, isValid: false, errors: [] };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').map(line => line.trim());

      // 检查必要的配置项
      config.requiredConfigs.forEach(requiredConfig => {
        if (!lines.includes(requiredConfig)) {
          result.errors.push(`缺少必需的配置: ${requiredConfig}`);
        }
      });

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(error.message);
    }
  } else {
    result.errors.push('.browserslistrc 文件不存在');
  }

  return result;
};
