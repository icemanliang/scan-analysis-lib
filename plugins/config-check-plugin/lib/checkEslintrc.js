const fs = require('fs');
const path = require('path');
const jsonc = require('jsonc-parser');

module.exports = async function checkEslintrc(baseDir, config) {
  let result = { exists: false, isValid: false, errors: [] };
  let eslintConfig;

  // 检查配置文件是否存在
  for (const file of config.possibleFiles) {
    const filePath = path.join(baseDir, file);
    if (fs.existsSync(filePath)) {
      result.exists = true;
      result.filePath = path.relative(baseDir, filePath);
      try {
        eslintConfig = await loadConfig(filePath);
        break;
      } catch (error) {
        result.errors.push(`解析 ${file} 时出错: ${error.message}`);
        continue;
      }
    }
  }

  if (!result.exists || !eslintConfig) {
    result.errors.push('未找到或无法解析 ESLint 配置文件');
    return result;
  }

  // 检查 extends 数组的有效性
  if (!Array.isArray(eslintConfig.extends)) {
    result.errors.push('extends 应该是一个数组');
    return result;
  }

  // 检查 extends 数组中的每个项是否为字符串
  const hasInvalidExtend = eslintConfig.extends.some(ext => typeof ext !== 'string');
  if (hasInvalidExtend) {
    result.errors.push('extends 数组中的所有项必须是字符串');
    return result;
  }

  // 检查 parser
  const tsConfigPath = path.join(baseDir, 'tsconfig.json');
  const isTypeScript = fs.existsSync(tsConfigPath);
  const expectedParser = isTypeScript ? config.parser.typescript : config.parser.javascript;

  if (eslintConfig.parser !== expectedParser) {
    result.errors.push(`parser 应该为 "${expectedParser}"`);
  }

  // 检查项目类型并验证相应的配置
  const packageJson = await loadPackageJson(baseDir);
  if (!packageJson) {
    result.errors.push('无法读取或解析 package.json');
    return result;
  }

  const { dependencies = {} } = packageJson;
  const isReact = config.dependencies.react.some(dep => dependencies[dep]);
  const isVue = config.dependencies.vue.some(dep => dependencies[dep]);

  // 检查配置有效性
  if (!eslintConfig.extends.includes(config.customConfig)) {
    if (isReact) {
      const hasValidConfig = config.validReactConfigs.some(conf => 
        conf.every(item => eslintConfig.extends.includes(item))
      );
      if (!hasValidConfig) {
        result.errors.push(`React 项目必须包含以下配置组合之一: ${JSON.stringify(config.validReactConfigs)}`);
      }
    } else if (isVue) {
      const hasValidConfig = config.validVueConfigs.every(conf => eslintConfig.extends.includes(conf));
      if (!hasValidConfig) {
        result.errors.push(`Vue 项目必须包含以下配置: ${config.validVueConfigs.join(', ')}`);
      }
    }
  }

  // 根据 errors 数组判断 isValid
  result.isValid = result.errors.length === 0;
  return result;
};

async function loadConfig(filePath) {
  if (filePath.endsWith('.js')) {
    try {
      // 首先尝试直接 require
      const config = require(filePath);
      return {
        extends: config.extends || [],
        parser: config.parser || ''
      };
    } catch (error) {
      try {
        // require 失败后，尝试用正则提取关键配置
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 提取 extends 数组
        const extendsMatch = content.match(/extends:\s*\[([\s\S]*?)\]/);
        const extends_ = extendsMatch ? 
          extendsMatch[1].split(',')
            .map(item => item.trim().replace(/['"]/g, ''))
            .filter(Boolean) : 
          [];
        
        // 提取 parser
        const parserMatch = content.match(/parser:\s*['"]([^'"]*)['"]/);
        const parser = parserMatch ? parserMatch[1] : '';

        return {
          extends: extends_,
          parser
        };
      } catch (regexError) {
        // 如果正则提取也失败，则抛出错误
        throw new Error(`解析 JS 配置文件失败: ${error.message}`);
      }
    }
  }
  
  // JSON 文件处理保持不变
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    return jsonc.parse(content);
  } catch (error) {
    throw new Error(`JSON 解析错误: ${error.message}`);
  }
}

async function loadPackageJson(baseDir) {
  try {
    const content = fs.readFileSync(path.join(baseDir, 'package.json'), 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
