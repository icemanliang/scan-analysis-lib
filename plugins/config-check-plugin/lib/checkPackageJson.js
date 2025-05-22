const fs = require('fs');
const path = require('path');

module.exports = async function checkPackageJson(baseDir, config, app = { isNpm: false }) {
  const filePath = path.join(baseDir, 'package.json');
  const result = { 
    exists: false, 
    isValid: false, 
    errors: [], 
    packageManagerType: null,
    packageManagerVersion: null 
  };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // 检查必需字段
      Object.entries(config.requiredFields).forEach(([field, message]) => {
        if (!packageJson[field] || packageJson[field].trim() === '') {
          result.errors.push(`${field} 字段 ${message}`);
        }
      });

      // 检查包名格式
      if (!config.namePattern.test(packageJson.name)) {
        result.errors.push(`name 字段 ${config.requiredFields.name}`);
      }
      // 检查private字段,且必须为true
      if (!packageJson.private) {
        result.errors.push('private 字段必须为 true');
      }

      // 检查并解析 packageManager
      if (packageJson.packageManager && config.packageManagerPattern.test(packageJson.packageManager)) {
        const [type, version] = packageJson.packageManager.split('@');
        result.packageManagerType = type;
        result.packageManagerVersion = version;
      } else {
        result.errors.push('packageManager 字段格式不正确，应为 "npm@x.x.x"、"yarn@x.x.x" 或 "pnpm@x.x.x"');
      }

      // 检查必需的脚本
      if (!packageJson.scripts) {
        result.errors.push('缺少 scripts 字段');
      } else {
        config.requiredScripts.forEach(script => {
          if (!packageJson.scripts[script]) {
            result.errors.push(`缺少 ${script} 脚本`);
          }
        });

        if (!packageJson.scripts.prepare?.includes(config.prepareShouldInclude)) {
          result.errors.push(`prepare 脚本中缺少 "${config.prepareShouldInclude}"`);
        }
      }

      // 检查 lint-staged
      if (config.lintStagedRequired) {
        checkLintStaged(packageJson, config.lintStagedConfig, result);
      }

      // 仅在 isNpm 为 true 时检查 npm 包特定字段
      if (app.isNpm) {
        Object.entries(config.npmPackageFields).forEach(([field, message]) => {
          if (field === 'version') {
            checkVersion(packageJson, result);
          } else if (field === 'keywords') {
            if (!Array.isArray(packageJson[field])) {
              result.errors.push(`${field} ${message}`);
            }
          } else if (!packageJson[field] || packageJson[field].trim() === '') {
            result.errors.push(`${field} ${message}`);
          }
        });
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      result.errors.push(error.message);
    }
  } else {
    result.errors.push('package.json 文件不存在');
  }

  return result;
};

function checkLintStaged(packageJson, expectedConfig, result) {
  if (!packageJson['lint-staged']) {
    result.errors.push('缺少 lint-staged 配置');
    return;
  }

  const lintStagedConfig = packageJson['lint-staged'];
  let hasValidConfig = false;

  // 遍历用户配置的每一项
  Object.entries(lintStagedConfig).forEach(([pattern, userCommands]) => {
    // 检查是否匹配配置中的任意一项
    Object.entries(expectedConfig).some(([expectedPattern, expectedCommands]) => {
      if (pattern === expectedPattern) {
        const actualCommands = Array.isArray(userCommands) ? userCommands : [userCommands];
        // 检查命令是否包含期望的命令
        if (expectedCommands.every(cmd => 
          actualCommands.some(actualCmd => actualCmd.includes(cmd))
        )) {
          hasValidConfig = true;
          return true;
        }
      }
      return false;
    });
  });

  if (!hasValidConfig) {
    result.errors.push('lint-staged 配置不符合要求，需要至少包含配置中的一项完整配置');
  }
}

function checkVersion(packageJson, result) {
  const semverRegex = /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
  if (!packageJson.version || !semverRegex.test(packageJson.version)) {
    result.errors.push('version 字段必须是有效的 semver 版本');
  }
}
