const fs = require('fs');
const path = require('path');

module.exports = async function checkNpmrc(rootDir, options = {}) {
  const filePath = path.join(rootDir, '.npmrc');
  const result = { exists: false, isValid: false, errors: [] };

  const {
    registryDomain = 'https://npmjs.iceman.cn'
  } = options;

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').map(line => line.trim());

      // 检查 registry 配置
      const registryLine = lines.find(line => line.startsWith('registry='));
      if (!registryLine) {
        result.errors.push('Missing registry configuration');
      } else if (!registryLine.startsWith(`registry=${registryDomain}`)) {
        result.errors.push(`Invalid registry domain. Expected: ${registryDomain}`);
      }

      // 检查 legacy-peer-deps 配置
      const legacyPeerDepsLine = lines.find(line => line === 'legacy-peer-deps=true');
      if (!legacyPeerDepsLine) {
        result.errors.push('Missing or invalid legacy-peer-deps configuration');
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(error.message);
    }
  } else {
    result.errors.push('.npmrc file does not exist');
  }

  return result;
};
