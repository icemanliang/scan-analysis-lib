const fs = require('fs');
const path = require('path');

module.exports = async function checkReadme(baseDir, config) {
  const filePath = path.join(baseDir, 'README.md');
  const result = { exists: false, isValid: false, errors: [] };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      // 检查必需的章节
      config.requiredSections.forEach(section => {
        const sectionPattern = new RegExp(`^#+\\s*${section}`, 'im');
        if (!lines.some(line => sectionPattern.test(line))) {
          result.errors.push(`缺少必需的章节: ${section}`);
        }
      });

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(error.message);
    }
  } else {
    result.errors.push('README.md 文件不存在');
  }

  return result;
};
