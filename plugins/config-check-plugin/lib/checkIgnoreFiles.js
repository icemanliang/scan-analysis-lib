const fs = require('fs');
const path = require('path');

module.exports = async function checkIgnoreFiles(baseDir, config) {
  const results = {};

  for (const file of config.files) {
    const filePath = path.join(baseDir, file);
    const result = { exists: false, isValid: false, errors: [] };

    if (fs.existsSync(filePath)) {
      result.exists = true;
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').map(line => line.trim());

        if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
          result.errors.push(`${file} 是空的`);
        }

        // 检查必要的忽略项
        const requiredIgnores = config.rules[file] || [];
        requiredIgnores.forEach(ignore => {
          if (!lines.some(line => line.startsWith(ignore) || line === ignore)) {
            result.errors.push(`缺少必要的忽略项: ${ignore}`);
          }
        });

        result.isValid = result.errors.length === 0;
      } catch (error) {
        result.errors.push(error.message);
      }
    } else {
      result.errors.push(`${file} 文件不存在`);
    }

    results[file] = result;
  }

  return results;
};
