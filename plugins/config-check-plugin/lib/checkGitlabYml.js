const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

module.exports = async function checkGitlabYml(rootDir) {
  const filePath = path.join(rootDir, '.gitlab-ci.yml');
  const result = { exists: false, isValid: false };

  if (fs.existsSync(filePath)) {
    result.exists = true;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = yaml.load(content);
      // 检查是否包含某些关键配置
      result.isValid = (
        config.stages &&
        Array.isArray(config.stages) &&
        Object.keys(config).some(key => typeof config[key] === 'object' && config[key].stage)
      );
    } catch (error) {
      result.error = error.message;
    }
  }

  return result;
};
