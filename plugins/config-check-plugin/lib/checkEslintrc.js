const fs = require('fs');
const path = require('path');

module.exports = async function checkEslintrc(rootDir) {
  const possibleFiles = ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yaml', '.eslintrc.yml', '.eslintrc'];
  let result = { exists: false, isValid: false, errors: [] };
  let config;

  for (const file of possibleFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      result.exists = true;
      result.filePath = filePath;
      try {
        if (file.endsWith('.js')) {
          config = require(filePath);
        } else if (file.endsWith('.json') || file === '.eslintrc') {
          const content = fs.readFileSync(filePath, 'utf8');
          try {
            config = JSON.parse(content);
          } catch (jsonError) {
            // 尝试修复常见的 JSON 错误
            const fixedContent = content.replace(/'/g, '"').replace(/,\s*}/g, '}');
            config = JSON.parse(fixedContent);
          }
        } else {
          // 对于 YAML 文件，我们需要一个 YAML 解析器
          result.errors.push(`不支持的文件格式: ${file}`);
          continue;
        }
        break;
      } catch (error) {
        result.errors.push(`解析 ${file} 时出错: ${error.message}`);
        continue;
      }
    }
  }

  if (!result.exists) {
    result.errors.push('未找到 ESLint 配置文件');
    return result;
  }

  if (!config) {
    result.errors.push('无法解析 ESLint 配置文件');
    return result;
  }

  // 检查 parser
  const tsConfigPath = path.join(rootDir, 'tsconfig.json');
  const isTypeScript = fs.existsSync(tsConfigPath);
  const expectedParser = isTypeScript ? '@typescript-eslint/parser' : '@babel/eslint-parser';

  if (config.parser !== expectedParser) {
    result.errors.push(`parser 应该为 "${expectedParser}"`);
  }

  // 检查 extends
  if (!Array.isArray(config.extends)) {
    result.errors.push('extends 应该是一个数组');
    return result;
  }

  const packageJsonPath = path.join(rootDir, 'package.json');
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    result.errors.push('无法读取或解析 package.json');
    return result;
  }

  const isReact = packageJson.dependencies && (packageJson.dependencies.react || packageJson.dependencies['react-dom']);
  const isVue = packageJson.dependencies && packageJson.dependencies.vue;

  const customEslintConfig = '@iceman/eslint-config'; // 可配置的自定义 ESLint 配置包

  if (config.extends.includes(customEslintConfig)) {
    result.isValid = true;
  } else if (isReact) {
    const validReactConfigs = [
      ['airbnb', 'airbnb/hooks'],
      ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended']
    ];
    result.isValid = validReactConfigs.some(conf => 
      conf.every(item => config.extends.includes(item)) &&
      !(config.extends.includes('airbnb') && config.extends.includes('eslint:recommended'))
    );
  } else if (isVue) {
    result.isValid = config.extends.includes('plugin:vue/recommended') && config.extends.includes('eslint:recommended');
  }

  if (!result.isValid) {
    result.errors.push('extends 配置不符合要求');
  }

  return result;
};
