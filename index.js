const validateConfig = require('./lib/validate');
const Scanner = require('./lib/scanner');

module.exports = async function scan(config = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      validateConfig(config);
      const scanner = new Scanner(config);
      const result = await scanner.scan();
      resolve(result);
    } catch (error) {
      console.error('scan failed:', error);
      reject(error);
    }
  });
};