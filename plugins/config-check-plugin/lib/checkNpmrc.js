const fs = require('fs');
const path = require('path');

module.exports = async function checkNpmrc(baseDir, config) {
  const filePath = path.join(baseDir, '.npmrc');
  const result = { exists: false, isValid: false, errors: [] };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').map(line => line.trim());

      // 检查 registry 配置
      const registryLine = lines.find(line => line.startsWith('registry='));
      if (!registryLine) {
        result.errors.push('缺少 registry 配置');
      } else if (!registryLine.startsWith(`registry=${config.registryDomain}`)) {
        result.errors.push(`无效的 registry 域名. 期望: ${config.registryDomain}`);
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(error.message);
    }
  } else {
    result.errors.push('.npmrc 文件不存在');
  }

  return result;
};
