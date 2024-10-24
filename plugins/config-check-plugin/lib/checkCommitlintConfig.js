const fs = require('fs');
const path = require('path');

module.exports = async function checkCommitlintConfig(rootDir) {
  const possibleFiles = [
    'commitlint.config.js',
    '.commitlintrc',
    '.commitlintrc.js',
    '.commitlintrc.json'
  ];

  const result = { exists: false, isValid: false, filePath: null };

  for (const file of possibleFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      result.exists = true;
      result.filePath = filePath;
      try {
        let config;
        if (file.endsWith('.js')) {
          config = require(filePath);
        } else {
          const content = fs.readFileSync(filePath, 'utf-8');
          config = JSON.parse(content);
        }

        // 检查 extends 属性
        if (Array.isArray(config.extends) && 
            config.extends.includes('@commitlint/config-conventional')) {
          result.isValid = true;
        } else {
          result.isValid = false;
          result.error = 'Configuration does not extend @commitlint/config-conventional';
        }
      } catch (error) {
        result.isValid = false;
        result.error = error.message;
      }
      break; // 找到第一个存在的配置文件后就停止
    }
  }

  return result;
};
