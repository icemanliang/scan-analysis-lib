const fs = require('fs');
const path = require('path');

module.exports = async function checkBrowserslist(rootDir) {
  const filePath = path.join(rootDir, '.browserslistrc');
  const result = { exists: false, isValid: false, errors: [] };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').map(line => line.trim());

      // 检查必要的配置项
      const requiredConfigs = [
        '> 1%',
        'last 2 versions',
        'not dead'
      ];

      requiredConfigs.forEach(config => {
        if (!lines.includes(config)) {
          result.errors.push(`Missing required configuration: ${config}`);
        }
      });

      // 检查是否包含 [development] 部分
      const developmentIndex = lines.indexOf('[development]');
      if (developmentIndex === -1) {
        result.errors.push('Missing [development] section');
      } else {
        const developmentConfigs = lines.slice(developmentIndex + 1);
        if (!developmentConfigs.includes('last 1 years')) {
          result.errors.push('Missing "last 1 years" in [development] section');
        }
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(error.message);
    }
  } else {
    result.errors.push('.browserslistrc file does not exist');
  }

  return result;
};
