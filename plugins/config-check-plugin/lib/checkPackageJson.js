const fs = require('fs');
const path = require('path');
const semver = require('semver');

module.exports = async function checkPackageJson(rootDir, options = {}) {
  const filePath = path.join(rootDir, 'package.json');
  const result = { exists: false, isValid: false, errors: [], packageManagerType: null, packageManagerVersion: null };
  const { isNpmPackage = false } = options;

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // 检查通用字段
      checkField(packageJson, 'name', value => /^[a-z]+(-[a-z]+)*$/.test(value), '全小写字母，可使用中线连接多段全小写字母', result);
      checkField(packageJson, 'description', value => value && value.trim() !== '', '不能为空', result);
      checkField(packageJson, 'main', value => value && value.trim() !== '', '不能为空', result);
      checkPackageManager(packageJson, result);
      checkScripts(packageJson, result);
      checkLintStaged(packageJson, result);

      // 检查 NPM 包特有字段
      if (isNpmPackage) {
        checkField(packageJson, 'version', value => semver.valid(value) !== null, '必须是有效的 semver 版本', result);
        checkField(packageJson, 'module', value => value && value.trim() !== '', '不能为空', result);
        checkField(packageJson, 'license', value => value && value.trim() !== '', '不能为空', result);
        checkField(packageJson, 'keywords', Array.isArray, '必须是一个数组', result);
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`解析 package.json 时出错: ${error.message}`);
    }
  } else {
    result.errors.push('package.json 文件不存在');
  }

  return result;
};

function checkField(obj, field, validator, errorMessage, result) {
  if (!obj[field] || !validator(obj[field])) {
    result.errors.push(`${field} 字段 ${errorMessage}`);
  }
}

function checkPackageManager(packageJson, result) {
  const packageManagerRegex = /^(npm|yarn|pnpm)@(\d+\.\d+\.\d+)$/;
  if (!packageJson.packageManager || !packageManagerRegex.test(packageJson.packageManager)) {
    result.errors.push('packageManager 字段格式不正确，应为 "npm@x.x.x"、"yarn@x.x.x" 或 "pnpm@x.x.x"');
  } else {
    const [, type, version] = packageJson.packageManager.match(packageManagerRegex);
    result.packageManagerType = type;
    result.packageManagerVersion = version;
  }
}

function checkScripts(packageJson, result) {
  const requiredScripts = ['lint', 'build', 'prepare'];
  if (!packageJson.scripts) {
    result.errors.push('缺少 scripts 字段');
    return;
  }
  requiredScripts.forEach(script => {
    if (!packageJson.scripts[script]) {
      result.errors.push(`缺少 ${script} 脚本`);
    }
  });
  if (!packageJson.scripts.prepare || !packageJson.scripts.prepare.includes('husky install')) {
    result.errors.push('prepare 脚本中缺少 "husky install"');
  }
}

function checkLintStaged(packageJson, result) {
  if (!packageJson['lint-staged']) {
    result.errors.push('缺少 lint-staged 配置');
    return;
  }
  const lintStagedConfig = packageJson['lint-staged'];
  let hasEslintConfig = false;

  for (const key in lintStagedConfig) {
    if (Array.isArray(lintStagedConfig[key])) {
      if (lintStagedConfig[key].some(command => command.includes('eslint'))) {
        hasEslintConfig = true;
        break;
      }
    } else if (typeof lintStagedConfig[key] === 'string' && lintStagedConfig[key].includes('eslint')) {
      hasEslintConfig = true;
      break;
    }
  }

  if (!hasEslintConfig) {
    result.errors.push('lint-staged 配置中缺少 eslint 命令');
  }
}
