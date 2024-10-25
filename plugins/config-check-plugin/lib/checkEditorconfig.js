const fs = require('fs');
const path = require('path');

module.exports = async function checkEditorconfig(rootDir) {
  const filePath = path.join(rootDir, '.editorconfig');
  const result = { exists: false, isValid: false, errors: [] };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').map(line => line.trim());

      // 检查标准配置
      const expectedConfigs = {
        'root = true': false,
        '[*]': false,
        'indent_style = space': false,
        'indent_size = 4': false,
        'end_of_line = lf': false,
        'charset = utf-8': false,
        'trim_trailing_whitespace = true': false,
        'insert_final_newline = true': false
      };

      lines.forEach(line => {
        for (const config in expectedConfigs) {
          if (line === config) {
            expectedConfigs[config] = true;
            break;
          }
        }
      });

      // 检查是否所有预期的配置都存在
      for (const config in expectedConfigs) {
        if (!expectedConfigs[config]) {
          result.errors.push(`Missing configuration: ${config}`);
        }
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(error.message);
    }
  } else {
    result.errors.push('.editorconfig file does not exist');
  }

  return result;
};
