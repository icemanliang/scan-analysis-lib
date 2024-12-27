const fs = require('fs');
const path = require('path');
const jsonc = require('jsonc-parser');

module.exports = async function checkTsconfig(context, config) {
  const filePath = path.join(context.baseDir, 'tsconfig.json');
  const result = { exists: false, isValid: false, errors: [] };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const tsConfig = await loadConfig(filePath);

      if (!tsConfig.compilerOptions) {
        result.errors.push('缺少 compilerOptions 配置');
      } else {
        Object.entries(config.compilerOptions).forEach(([option, expectedValue]) => {
          const actualValue = tsConfig.compilerOptions[option];
          
          if (actualValue === undefined) {
            result.errors.push(`缺少 compilerOptions.${option} 配置`);
          } else if (Array.isArray(expectedValue)) {
            if (!Array.isArray(actualValue) || 
                !expectedValue.every(item => actualValue.includes(item))) {
              result.errors.push(`compilerOptions.${option} 必须包含 ${expectedValue.join(', ')}`);
            }
          } else if (typeof expectedValue === 'boolean') {
            if (actualValue !== expectedValue) {
              result.errors.push(`compilerOptions.${option} 必须设置为 ${expectedValue}`);
            }
          } else if (actualValue !== expectedValue) {
            result.errors.push(`compilerOptions.${option} 必须设置为 ${expectedValue}`);
          }
        });
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`解析 tsconfig.json 时出错: ${error.message}`);
    }
  } else {
    context.logger.log('warn', 'tsconfig.json 文件不存在');
  }

  return result;
};

async function loadConfig(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    return jsonc.parse(content);
  } catch (error) {
    throw new Error(`JSON 解析错误: ${error.message}`);
  }
}
