const validateConfig = require('./lib/validate');
const Scanner = require('./lib/scanner');

/**
 * 扫描项目
 * @param {Object} config 配置
 * @returns {Promise<Object>} 扫描结果
 */

module.exports = async function scan(config = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      // validateConfig(config);
      const scanner = new Scanner(config);
      const result = await scanner.scan();
      resolve(result);
    } catch (error) {
      console.error('scan failed:', error);
      reject(error);
    }
  });
};