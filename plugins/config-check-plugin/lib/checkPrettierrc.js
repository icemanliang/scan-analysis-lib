const fs = require('fs');
const path = require('path');

module.exports = async function checkPrettierrc(rootDir) {
  const possibleFiles = [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.js',
    'prettier.config.js'
  ];

  const expectedConfig = {
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    printWidth: 100
  };

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
          const content = fs.readFileSync(filePath, 'utf8');
          config = JSON.parse(content);
        }

        // 检查配置是否与预期配置一致
        result.isValid = Object.keys(expectedConfig).every(
          key => config[key] === expectedConfig[key]
        );
      } catch (error) {
        result.error = error.message;
      }
      break; // 找到第一个存在的配置文件后就停止
    }
  }

  return result;
};
