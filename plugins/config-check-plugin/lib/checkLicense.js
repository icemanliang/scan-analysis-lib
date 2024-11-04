const fs = require('fs');
const path = require('path');
  
module.exports = async function checkLicense(baseDir, config) {
  const filePath = path.join(baseDir, 'LICENSE');
  const result = { exists: false, isValid: false, errors: [] };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const licenseType = content.split('\n')[0].split(' ')[0];
      
      if (!config.validLicenses.includes(licenseType)) {
        result.errors.push(`无效的许可证类型。支持的类型: ${config.validLicenses.join(', ')}`);
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(error.message);
    }
  } else {
    result.errors.push('LICENSE 文件不存在');
  }

  return result;
};
