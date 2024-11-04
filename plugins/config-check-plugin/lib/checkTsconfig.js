const fs = require('fs');
const path = require('path');

module.exports = async function checkTsconfig(baseDir, config) {
  const filePath = path.join(baseDir, 'tsconfig.json');
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
    result.errors.push('tsconfig.json 文件不存在');
  }

  return result;
};

async function loadConfig(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    const normalizedContent = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
      .replace(/\/\/.*/g, '') // 移除单行注释
      .replace(/,(\s*[}\]])/g, '$1') // 移除尾随逗号
      .replace(/'/g, '"') // 替换单引号为双引号
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // 给属性名加上双引号
    
    return JSON.parse(normalizedContent);
  } catch (error) {
    throw new Error(`JSON 解析错误: ${error.message}`);
  }
}
