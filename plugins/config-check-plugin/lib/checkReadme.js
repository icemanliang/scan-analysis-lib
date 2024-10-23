const fs = require('fs');
const path = require('path');

module.exports = async function checkReadme(rootDir) {
  const filePath = path.join(rootDir, 'README.md');
  const result = { exists: false, isValid: false };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // 检查 README 是否包含某些关键部分
      result.isValid = (
        content.includes('# ') && // 标题
        content.includes('## Installation') &&
        content.includes('## Usage') &&
        content.includes('## Contributing') &&
        content.includes('## License')
      );
    } catch (error) {
      result.error = error.message;
    }
  }

  return result;
};
