const fs = require('fs');
const path = require('path');

module.exports = async function checkEditorconfig(rootDir) {
  const filePath = path.join(rootDir, '.editorconfig');
  const result = { exists: false, isValid: false };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // 检查是否包含某些关键配置
      result.isValid = (
        content.includes('root = true') &&
        content.includes('indent_style =') &&
        content.includes('indent_size =') &&
        content.includes('end_of_line =')
      );
    } catch (error) {
      result.error = error.message;
    }
  }

  return result;
};
