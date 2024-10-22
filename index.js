const Scanner = require('./lib/scanner');
const path = require('path');

function validateConfig(config) {
  if (!config.FINAL_RESULT_DIR) {
    throw new Error('FINAL_RESULT_DIR is required in the configuration');
  }
  if (!Array.isArray(config.source) || config.source.length === 0) {
    throw new Error('source must be a non-empty array in the configuration');
  }
  if (!Array.isArray(config.plugins)) {
    throw new Error('plugins must be an array in the configuration');
  }
  // 可以添加更多的验证逻辑
}

module.exports = function createScanner(userConfig = {}) {
  const defaultConfig = {
    FINAL_RESULT_DIR: path.join(process.cwd(), 'scan-result'),
    source: [],
    plugins: []
  };

  const config = { ...defaultConfig, ...userConfig };
  validateConfig(config);

  return new Scanner(config);
};
